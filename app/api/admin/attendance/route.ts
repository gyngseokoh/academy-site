import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const headers = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

// GET /api/admin/attendance?date=YYYY-MM-DD&teacher_id=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get('date');
  const teacherId = searchParams.get('teacher_id');

  if (!date) return NextResponse.json({ error: 'date required' }, { status: 400 });

  // date의 요일 계산 (로컬 기준 아닌 KST)
  const d = new Date(date + 'T00:00:00+09:00');
  const dayOfWeek = d.getDay(); // 0=일 ~ 6=토

  // 해당 요일 수업 스케줄 + 반 + 학생 조회
  const schedulesRes = await fetch(
    `${SUPABASE_URL}/rest/v1/class_schedules?day_of_week=eq.${dayOfWeek}&select=*,classes(*,teachers(id,name),class_enrollments(*,students(id,name,grade,phone,is_active)))`,
    { headers },
  );
  const schedules = await schedulesRes.json();

  // 해당 날짜 출결 기록 조회
  const attendanceRes = await fetch(
    `${SUPABASE_URL}/rest/v1/attendance_records?attendance_date=eq.${date}&select=*`,
    { headers },
  );
  const attendanceRecords = await attendanceRes.json();

  // student_id + class_id → 출결 기록 맵
  const attMap: Record<string, any> = {};
  if (Array.isArray(attendanceRecords)) {
    attendanceRecords.forEach((r: any) => {
      attMap[`${r.student_id}_${r.class_id}`] = r;
    });
  }

  const result: any[] = [];

  if (Array.isArray(schedules)) {
    schedules.forEach((sched: any) => {
      const cls = sched.classes;
      if (!cls) return;

      // 선생님 필터
      if (teacherId && cls.teacher_id !== teacherId) return;

      const enrollments = Array.isArray(cls.class_enrollments) ? cls.class_enrollments : [];
      enrollments.forEach((enr: any) => {
        const student = enr.students;
        if (!student) return;
        if (student.is_active === false) return; // 퇴원 학생 제외

        const key = `${student.id}_${cls.id}`;
        const att = attMap[key];

        result.push({
          schedule_id: sched.id,
          class_id: cls.id,
          class_name: cls.name,
          subject: cls.subject,
          start_time: sched.start_time,
          end_time: sched.end_time,
          teacher: cls.teachers,
          teacher_id: cls.teacher_id,
          student_id: student.id,
          student_name: student.name,
          student_grade: student.grade,
          enrollment_id: enr.id,
          remaining_sessions: enr.remaining_sessions,
          monthly_sessions: enr.monthly_sessions,
          attendance_id: att?.id ?? null,
          status: att?.status ?? null,
          note: att?.note ?? null,
        });
      });
    });
  }

  // 시간 → 반 → 이름 순 정렬
  result.sort((a, b) => {
    if (a.start_time !== b.start_time) return a.start_time < b.start_time ? -1 : 1;
    if (a.class_name !== b.class_name) return a.class_name < b.class_name ? -1 : 1;
    return a.student_name < b.student_name ? -1 : 1;
  });

  return NextResponse.json(result);
}

// POST — 출결 생성
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { student_id, class_id, attendance_date, start_time, status, teacher_id, note } = body;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/attendance_records`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify({ student_id, class_id, attendance_date, start_time, status, teacher_id: teacher_id ?? null, note: note ?? null }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: 400 });
  }
  const data = await res.json();
  return NextResponse.json(Array.isArray(data) ? data[0] : data);
}

// PATCH — 출결 상태 수정
export async function PATCH(req: NextRequest) {
  const { id, status, note } = await req.json();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/attendance_records?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify({ status, ...(note !== undefined ? { note } : {}) }),
  });
  if (!res.ok) return NextResponse.json({ error: 'update failed' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/attendance?id=xxx  또는  ?ids=a,b,c (일괄, 되돌리기)
// 회차 정산을 서버에서 일원화:
//  - 삭제한 출결 1건당 +1 (생성 시 차감했던 회차 되돌림)
//  - 그 출결에 연결된 보충이 '완료'였으면 -1 하고 보충도 삭제(이중 복구/고아 방지)
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const idsParam = searchParams.get('ids');
  const list = idsParam ? idsParam.split(',').filter(Boolean) : (id ? [id] : []);
  if (list.length === 0) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const inList = list.map((i) => `"${i}"`).join(',');

  const [attRes, mkRes] = await Promise.all([
    fetch(`${SUPABASE_URL}/rest/v1/attendance_records?id=in.(${inList})&select=id,student_id,class_id`, { headers }),
    fetch(`${SUPABASE_URL}/rest/v1/makeup_classes?attendance_record_id=in.(${inList})&select=id,status,student_id,class_id`, { headers }),
  ]);
  const attRows = await attRes.json();
  const mkRows = await mkRes.json();

  // (student|class)별 회차 보정 델타 계산
  const delta: Record<string, { student_id: string; class_id: string; d: number }> = {};
  const bump = (s: string, c: string, n: number) => {
    if (!s || !c) return;
    const k = `${s}|${c}`;
    delta[k] = delta[k] || { student_id: s, class_id: c, d: 0 };
    delta[k].d += n;
  };
  if (Array.isArray(attRows)) attRows.forEach((a: any) => bump(a.student_id, a.class_id, 1));
  if (Array.isArray(mkRows)) mkRows.forEach((m: any) => { if (m.status === '완료') bump(m.student_id, m.class_id, -1); });

  // 연결된 보충 삭제 + 출결 삭제
  if (Array.isArray(mkRows) && mkRows.length > 0) {
    await fetch(`${SUPABASE_URL}/rest/v1/makeup_classes?attendance_record_id=in.(${inList})`, { method: 'DELETE', headers });
  }
  await fetch(`${SUPABASE_URL}/rest/v1/attendance_records?id=in.(${inList})`, { method: 'DELETE', headers });

  // 회차 보정 적용
  await Promise.all(Object.values(delta).map(async ({ student_id, class_id, d }) => {
    if (d === 0) return;
    const enr = await fetch(
      `${SUPABASE_URL}/rest/v1/class_enrollments?student_id=eq.${student_id}&class_id=eq.${class_id}&select=id,remaining_sessions&limit=1`,
      { headers },
    );
    const e = await enr.json();
    if (!Array.isArray(e) || e.length === 0) return;
    const next = Math.max(0, (e[0].remaining_sessions ?? 0) + d);
    await fetch(`${SUPABASE_URL}/rest/v1/class_enrollments?id=eq.${e[0].id}`, {
      method: 'PATCH', headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify({ remaining_sessions: next }),
    });
  }));

  return NextResponse.json({ ok: true, count: list.length });
}
