import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const headers = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

// GET /api/admin/makeup?status=예정&teacher_id=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const teacherId = searchParams.get('teacher_id');

  let url = `${SUPABASE_URL}/rest/v1/makeup_classes?select=*,students(id,name,grade),classes(id,name,subject,teacher_id,teachers(id,name)),attendance_records(attendance_date,status)&order=scheduled_date.asc,scheduled_time.asc`;
  if (status) url += `&status=eq.${encodeURIComponent(status)}`;
  if (teacherId) url += `&teacher_id=eq.${teacherId}`;

  const res = await fetch(url, { headers });
  const data = await res.json();
  return NextResponse.json(Array.isArray(data) ? data : []);
}

// enrollment_id 자동 조회 (회차 복구를 위해) — makeup_classes에는 컬럼이 없으므로 조회 전용
async function lookupEnrollmentId(studentId?: string, classId?: string): Promise<string | null> {
  if (!studentId || !classId) return null;
  const enrRes = await fetch(
    `${SUPABASE_URL}/rest/v1/class_enrollments?student_id=eq.${studentId}&class_id=eq.${classId}&select=id&limit=1`,
    { headers },
  );
  const enrData = await enrRes.json();
  return Array.isArray(enrData) && enrData.length > 0 ? enrData[0].id : null;
}

// POST /api/admin/makeup — 보충 수업 등록
// 단일: { student_id, class_id, ... }
// 일괄: { student_ids: [...], class_id, scheduled_date, scheduled_time, note }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { class_id, attendance_record_id, scheduled_date, scheduled_time, teacher_id, note } = body;

  if (Array.isArray(body.student_ids)) {
    if (body.student_ids.length === 0) return NextResponse.json({ ok: true, count: 0 });
    const rows = body.student_ids.map((sid: string) => ({
      student_id: sid,
      class_id: class_id ?? null,
      attendance_record_id: null,
      scheduled_date: scheduled_date ?? null,
      scheduled_time: scheduled_time ?? null,
      teacher_id: teacher_id ?? null,
      note: note ?? null,
      status: '예정',
    }));
    const res = await fetch(`${SUPABASE_URL}/rest/v1/makeup_classes`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify(rows),
    });
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: 400 });
    }
    return NextResponse.json({ ok: true, count: rows.length });
  }

  const { student_id } = body;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/makeup_classes`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify({
      student_id,
      class_id,
      attendance_record_id: attendance_record_id ?? null,
      scheduled_date: scheduled_date ?? null,
      scheduled_time: scheduled_time ?? null,
      teacher_id: teacher_id ?? null,
      note: note ?? null,
      status: '예정',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: 400 });
  }
  const data = await res.json();
  return NextResponse.json(Array.isArray(data) ? data[0] : data);
}

// PATCH /api/admin/makeup — 상태/일정 수정
// 단일: { id, ...fields }   일괄: { ids: [...], fields: {...} }
export async function PATCH(req: NextRequest) {
  const body = await req.json();

  if (Array.isArray(body.ids)) {
    if (body.ids.length === 0) return NextResponse.json({ ok: true });
    const inList = body.ids.map((i: string) => `"${i}"`).join(',');
    const res = await fetch(`${SUPABASE_URL}/rest/v1/makeup_classes?id=in.(${inList})`, {
      method: 'PATCH',
      headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify(body.fields ?? {}),
    });
    if (!res.ok) return NextResponse.json({ error: 'bulk update failed' }, { status: 500 });
    return NextResponse.json({ ok: true, count: body.ids.length });
  }

  const { id, enrollment_id: _ignore, ...fields } = body;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/makeup_classes?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify(fields),
  });
  if (!res.ok) return NextResponse.json({ error: 'update failed' }, { status: 500 });

  if (fields.status === '완료') {
    const mkRes = await fetch(
      `${SUPABASE_URL}/rest/v1/makeup_classes?id=eq.${id}&select=student_id,class_id`,
      { headers },
    );
    const mkData = await mkRes.json();
    const mk = Array.isArray(mkData) && mkData.length > 0 ? mkData[0] : null;
    const enrollmentId = await lookupEnrollmentId(mk?.student_id, mk?.class_id);
    if (enrollmentId) {
      const enrRes = await fetch(
        `${SUPABASE_URL}/rest/v1/class_enrollments?id=eq.${enrollmentId}&select=remaining_sessions`,
        { headers },
      );
      const enrData = await enrRes.json();
      if (Array.isArray(enrData) && enrData.length > 0) {
        const current = enrData[0].remaining_sessions ?? 0;
        await fetch(`${SUPABASE_URL}/rest/v1/class_enrollments?id=eq.${enrollmentId}`, {
          method: 'PATCH',
          headers: { ...headers, Prefer: 'return=minimal' },
          body: JSON.stringify({ remaining_sessions: current + 1 }),
        });
      }
    }
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/makeup?id=xxx  또는  ?ids=a,b,c (일괄)
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const ids = searchParams.get('ids');

  if (ids) {
    const list = ids.split(',').filter(Boolean);
    if (list.length === 0) return NextResponse.json({ ok: true });
    const inList = list.map((i) => `"${i}"`).join(',');
    await fetch(`${SUPABASE_URL}/rest/v1/makeup_classes?id=in.(${inList})`, {
      method: 'DELETE',
      headers,
    });
    return NextResponse.json({ ok: true, count: list.length });
  }

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await fetch(`${SUPABASE_URL}/rest/v1/makeup_classes?id=eq.${id}`, {
    method: 'DELETE',
    headers,
  });
  return NextResponse.json({ ok: true });
}
