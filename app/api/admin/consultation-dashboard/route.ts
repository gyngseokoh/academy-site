import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const h = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const months = parseInt(searchParams.get('months') ?? '3');

  // 신규생 상담 전체 조회
  const newRes = await fetch(
    `${SUPABASE_URL}/rest/v1/new_student_consultations?select=*,teachers(id,name)&order=created_at.desc`,
    { headers: h },
  );
  const newConsultations = await newRes.json();

  // 재원생 상담 전체 조회
  const curRes = await fetch(
    `${SUPABASE_URL}/rest/v1/current_student_consultations?select=*,teachers(id,name)&order=created_at.desc`,
    { headers: h },
  );
  const curConsultations = await curRes.json();

  const newList = Array.isArray(newConsultations) ? newConsultations : [];
  const curList = Array.isArray(curConsultations) ? curConsultations : [];

  // 신규생 상담 통계
  const newTotal = newList.length;
  const newApproved = newList.filter((c: any) => c.status === '승인').length;
  const newRejected = newList.filter((c: any) => c.status === '거절').length;
  const newPending = newList.filter((c: any) => !c.status || c.status === '대기').length;
  const newConversionRate = newTotal > 0 ? Math.round((newApproved / newTotal) * 100) : 0;

  // 재원생 상담 통계
  const curTotal = curList.length;
  const curApproved = curList.filter((c: any) => c.status === '승인').length;
  const curPending = curList.filter((c: any) => !c.status || c.status === '대기').length;

  // 선생님별 신규생 상담 현황
  const teacherMap: Record<string, { name: string; total: number; approved: number; rejected: number; pending: number }> = {};
  newList.forEach((c: any) => {
    const tid = c.teacher_id ?? 'unassigned';
    const tname = c.teachers?.name ?? '미배정';
    if (!teacherMap[tid]) teacherMap[tid] = { name: tname, total: 0, approved: 0, rejected: 0, pending: 0 };
    teacherMap[tid].total++;
    if (c.status === '승인') teacherMap[tid].approved++;
    else if (c.status === '거절') teacherMap[tid].rejected++;
    else teacherMap[tid].pending++;
  });

  // 월별 신규생 상담 추이 (최근 N개월)
  const monthlyMap: Record<string, { total: number; approved: number }> = {};
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyMap[key] = { total: 0, approved: 0 };
  }
  newList.forEach((c: any) => {
    const key = (c.created_at ?? '').slice(0, 7);
    if (monthlyMap[key]) {
      monthlyMap[key].total++;
      if (c.status === '승인') monthlyMap[key].approved++;
    }
  });

  return NextResponse.json({
    new: {
      total: newTotal,
      approved: newApproved,
      rejected: newRejected,
      pending: newPending,
      conversionRate: newConversionRate,
      byTeacher: Object.entries(teacherMap).map(([id, v]) => ({ teacher_id: id, ...v })),
      monthly: Object.entries(monthlyMap).map(([month, v]) => ({ month, ...v })),
      recent: newList.slice(0, 10),
    },
    current: {
      total: curTotal,
      approved: curApproved,
      pending: curPending,
      recent: curList.slice(0, 10),
    },
  });
}
