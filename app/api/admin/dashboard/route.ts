import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const h = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

// GET /api/admin/dashboard?month=2026-05
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month') ?? new Date().toISOString().slice(0, 7);
  const [year, mon] = month.split('-');
  const startDate = `${year}-${mon}-01`;
  const endDate = new Date(parseInt(year), parseInt(mon), 0).toISOString().slice(0, 10);

  // 이번 달 결석 기록
  const absentRes = await fetch(
    `${SUPABASE_URL}/rest/v1/attendance_records?status=eq.결석&attendance_date=gte.${startDate}&attendance_date=lte.${endDate}&select=*,students(id,name,grade),classes(id,name,subject,teachers(name))`,
    { headers: h },
  );
  const absentData = await absentRes.json();

  // 보충 예정 목록
  const makeupPendingRes = await fetch(
    `${SUPABASE_URL}/rest/v1/makeup_classes?status=eq.예정&select=*,students(id,name,grade),classes(id,name,subject,teachers(name))&order=scheduled_date.asc`,
    { headers: h },
  );
  const makeupPending = await makeupPendingRes.json();

  // 보충 미완료 목록
  const makeupMissedRes = await fetch(
    `${SUPABASE_URL}/rest/v1/makeup_classes?status=eq.미진행&select=*,students(id,name,grade),classes(id,name,subject,teachers(name))&order=scheduled_date.asc`,
    { headers: h },
  );
  const makeupMissed = await makeupMissedRes.json();

  // 잦은 지각 (이번 달 2회 이상)
  const lateRes = await fetch(
    `${SUPABASE_URL}/rest/v1/attendance_records?status=eq.지각&attendance_date=gte.${startDate}&attendance_date=lte.${endDate}&select=student_id,students(id,name,grade),classes(name)`,
    { headers: h },
  );
  const lateData = await lateRes.json();

  // 지각 학생별 집계
  const lateMap: Record<string, { name: string; grade: string; count: number; classes: string[] }> = {};
  if (Array.isArray(lateData)) {
    lateData.forEach((r: any) => {
      const sid = r.student_id;
      if (!lateMap[sid]) lateMap[sid] = { name: r.students?.name ?? '', grade: r.students?.grade ?? '', count: 0, classes: [] };
      lateMap[sid].count++;
      if (r.classes?.name && !lateMap[sid].classes.includes(r.classes.name)) lateMap[sid].classes.push(r.classes.name);
    });
  }
  const frequentLate = Object.entries(lateMap)
    .filter(([, v]) => v.count >= 2)
    .map(([id, v]) => ({ student_id: id, ...v }))
    .sort((a, b) => b.count - a.count);

  // 장기 미등원 (14일 이상 출석 기록 없는 학생)
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const twoWeeksAgoStr = twoWeeksAgo.toISOString().slice(0, 10);

  const recentAttendRes = await fetch(
    `${SUPABASE_URL}/rest/v1/attendance_records?status=eq.출석&attendance_date=gte.${twoWeeksAgoStr}&select=student_id`,
    { headers: h },
  );
  const recentAttend = await recentAttendRes.json();
  const recentStudentIds = new Set(Array.isArray(recentAttend) ? recentAttend.map((r: any) => r.student_id) : []);

  // 전체 등록 학생 중 최근 출석 없는 학생
  const allEnrollRes = await fetch(
    `${SUPABASE_URL}/rest/v1/class_enrollments?select=student_id,students(id,name,grade),classes(name,teachers(name))`,
    { headers: h },
  );
  const allEnroll = await allEnrollRes.json();

  const longAbsentMap: Record<string, any> = {};
  if (Array.isArray(allEnroll)) {
    allEnroll.forEach((e: any) => {
      const sid = e.student_id;
      if (!recentStudentIds.has(sid) && !longAbsentMap[sid]) {
        longAbsentMap[sid] = {
          student_id: sid,
          name: e.students?.name ?? '',
          grade: e.students?.grade ?? '',
          class_name: e.classes?.name ?? '',
          teacher: e.classes?.teachers?.name ?? '',
        };
      }
    });
  }
  const longAbsent = Object.values(longAbsentMap);

  return NextResponse.json({
    month,
    absent: Array.isArray(absentData) ? absentData : [],
    makeupPending: Array.isArray(makeupPending) ? makeupPending : [],
    makeupMissed: Array.isArray(makeupMissed) ? makeupMissed : [],
    frequentLate,
    longAbsent,
  });
}
