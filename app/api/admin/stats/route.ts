import { NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const h = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

export async function GET() {
  // 전체 학생 수
  const studentsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/students?select=id,school,grade,teacher_id,created_at&is_active=neq.false&order=created_at.desc`,
    { headers: h },
  );
  const students = await studentsRes.json();
  const studentList = Array.isArray(students) ? students : [];

  // 선생님
  const teachersRes = await fetch(
    `${SUPABASE_URL}/rest/v1/teachers?select=id,name,role&order=sort_order.asc`,
    { headers: h },
  );
  const teachers = await teachersRes.json();
  const teacherList = Array.isArray(teachers) ? teachers : [];

  // 신규생 상담
  const newConsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/new_student_consultations?select=id,status,created_at&order=created_at.desc`,
    { headers: h },
  );
  const newCons = await newConsRes.json();
  const newConsList = Array.isArray(newCons) ? newCons : [];

  // 학교별 학생 수
  const schoolMap: Record<string, number> = {};
  studentList.forEach((s: any) => {
    const school = s.school || '미입력';
    schoolMap[school] = (schoolMap[school] || 0) + 1;
  });
  const bySchool = Object.entries(schoolMap)
    .sort((a, b) => b[1] - a[1])
    .map(([school, count]) => ({ school, count }));

  // 학년별 학생 수
  const gradeMap: Record<string, number> = {};
  studentList.forEach((s: any) => {
    const grade = s.grade || '미입력';
    gradeMap[grade] = (gradeMap[grade] || 0) + 1;
  });
  const byGrade = Object.entries(gradeMap)
    .sort((a, b) => b[1] - a[1])
    .map(([grade, count]) => ({ grade, count }));

  // 선생님별 학생 수
  const teacherStudentMap: Record<string, number> = {};
  studentList.forEach((s: any) => {
    if (s.teacher_id) {
      teacherStudentMap[s.teacher_id] = (teacherStudentMap[s.teacher_id] || 0) + 1;
    }
  });
  const byTeacher = teacherList.map((t: any) => ({
    id: t.id, name: t.name, role: t.role,
    count: teacherStudentMap[t.id] || 0,
  })).sort((a, b) => b.count - a.count);

  // 월별 신규 학생 (최근 6개월)
  const monthlyNew: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyNew[key] = 0;
  }
  studentList.forEach((s: any) => {
    const key = (s.created_at || '').slice(0, 7);
    if (monthlyNew[key] !== undefined) monthlyNew[key]++;
  });
  const monthlyNewList = Object.entries(monthlyNew).map(([month, count]) => ({ month, count }));

  // 상담 전환율 (승인된 상담 / 전체 상담)
  const totalCons = newConsList.length;
  const approvedCons = newConsList.filter((c: any) => c.status === '승인').length;
  const conversionRate = totalCons > 0 ? Math.round((approvedCons / totalCons) * 100) : 0;

  // 이번 달 신규 학생
  const thisMonth = new Date().toISOString().slice(0, 7);
  const newThisMonth = studentList.filter((s: any) => (s.created_at || '').startsWith(thisMonth)).length;

  return NextResponse.json({
    total: studentList.length,
    newThisMonth,
    totalConsultations: totalCons,
    approvedConsultations: approvedCons,
    conversionRate,
    bySchool,
    byGrade,
    byTeacher,
    monthlyNew: monthlyNewList,
  });
}
