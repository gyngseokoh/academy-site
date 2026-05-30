import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const h = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

function getKSTDate() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

export async function GET() {
  const today = getKSTDate();
  const dayOfWeek = new Date(today + 'T00:00:00+09:00').getDay();

  // 전체 선생님
  const teacherRes = await fetch(
    `${SUPABASE_URL}/rest/v1/teachers?select=id,name,role&order=sort_order.asc`,
    { headers: h },
  );
  const teachers = await teacherRes.json();

  // 담당 학생 수 (classes → class_enrollments)
  const enrollRes = await fetch(
    `${SUPABASE_URL}/rest/v1/class_enrollments?select=id,classes(teacher_id)`,
    { headers: h },
  );
  const enrollments = await enrollRes.json();

  // 오늘 수업 있는 클래스
  const schedRes = await fetch(
    `${SUPABASE_URL}/rest/v1/class_schedules?day_of_week=eq.${dayOfWeek}&select=id,class_id,classes(teacher_id,class_enrollments(id))`,
    { headers: h },
  );
  const todaySchedules = await schedRes.json();

  // 오늘 출결 처리 현황
  const attRes = await fetch(
    `${SUPABASE_URL}/rest/v1/attendance_records?attendance_date=eq.${today}&select=id,teacher_id,status`,
    { headers: h },
  );
  const todayAtt = await attRes.json();

  // 보충 예정 수 (teacher별)
  const makeupRes = await fetch(
    `${SUPABASE_URL}/rest/v1/makeup_classes?status=eq.예정&select=id,teacher_id`,
    { headers: h },
  );
  const makeupPending = await makeupRes.json();

  // 신규생 상담 배정 (대기 중)
  const newConsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/new_student_consultations?status=eq.대기&select=id,teacher_id`,
    { headers: h },
  );
  const newConsPending = await newConsRes.json();

  // 재원생 상담 배정 (대기 중)
  const curConsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/current_consultations?status=eq.대기&select=id,teacher_id`,
    { headers: h },
  );
  const curConsPending = await curConsRes.json();

  // teacher별 집계
  const result = Array.isArray(teachers) ? teachers.map((t: any) => {
    // 담당 학생 수
    const studentCount = Array.isArray(enrollments)
      ? enrollments.filter((e: any) => e.classes?.teacher_id === t.id).length
      : 0;

    // 오늘 출결 대상 수
    const todayStudents = Array.isArray(todaySchedules)
      ? todaySchedules
          .filter((s: any) => s.classes?.teacher_id === t.id)
          .reduce((sum: number, s: any) => sum + (s.classes?.class_enrollments?.length ?? 0), 0)
      : 0;

    // 오늘 출결 처리 완료 수
    const todayDone = Array.isArray(todayAtt)
      ? todayAtt.filter((a: any) => a.teacher_id === t.id).length
      : 0;

    // 보충 예정 수
    const makeupCount = Array.isArray(makeupPending)
      ? makeupPending.filter((m: any) => m.teacher_id === t.id).length
      : 0;

    // 대기 중인 신규생 상담
    const newConsCount = Array.isArray(newConsPending)
      ? newConsPending.filter((c: any) => c.teacher_id === t.id).length
      : 0;

    // 대기 중인 재원생 상담
    const curConsCount = Array.isArray(curConsPending)
      ? curConsPending.filter((c: any) => c.teacher_id === t.id).length
      : 0;

    return {
      id: t.id,
      name: t.name,
      role: t.role,
      studentCount,
      todayStudents,
      todayDone,
      todayRemaining: Math.max(0, todayStudents - todayDone),
      makeupCount,
      newConsCount,
      curConsCount,
      totalPending: makeupCount + newConsCount + curConsCount,
    };
  }) : [];

  return NextResponse.json({ today, result });
}
