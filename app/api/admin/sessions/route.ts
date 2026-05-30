import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const h = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

// GET /api/admin/sessions?month=YYYY-MM&teacher_id=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const month = searchParams.get('month') ?? new Date().toISOString().slice(0, 7);
  const teacherId = searchParams.get('teacher_id');

  // 전체 수강 등록 조회
  let url = `${SUPABASE_URL}/rest/v1/class_enrollments?select=*,students(id,name,grade,phone),classes(id,name,subject,teacher_id,teachers(id,name))&order=students(name)`;
  if (teacherId) url += `&classes.teacher_id=eq.${teacherId}`;

  const enrollRes = await fetch(url, { headers: h });
  const enrollments = await enrollRes.json();

  // 해당 월 납부 기록 조회
  const payRes = await fetch(
    `${SUPABASE_URL}/rest/v1/payments?month=eq.${month}&select=*`,
    { headers: h },
  );
  const payments = await payRes.json();

  // enrollment_id → payment 맵
  const payMap: Record<string, any> = {};
  if (Array.isArray(payments)) {
    payments.forEach((p: any) => { payMap[p.class_enrollment_id] = p; });
  }

  const result = Array.isArray(enrollments)
    ? enrollments
        .filter((e: any) => {
          if (teacherId && e.classes?.teacher_id !== teacherId) return false;
          return true;
        })
        .map((e: any) => ({
          ...e,
          payment: payMap[e.id] ?? null,
        }))
    : [];

  return NextResponse.json(result);
}

// PATCH /api/admin/sessions — 회차/수강료 수정
export async function PATCH(req: NextRequest) {
  const { id, ...fields } = await req.json();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/class_enrollments?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...h, Prefer: 'return=minimal' },
    body: JSON.stringify(fields),
  });
  if (!res.ok) return NextResponse.json({ error: 'update failed' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// POST /api/admin/sessions/payment — 납부 처리
export async function POST(req: NextRequest) {
  const { class_enrollment_id, student_id, month, amount, status, note } = await req.json();

  // upsert
  const res = await fetch(`${SUPABASE_URL}/rest/v1/payments`, {
    method: 'POST',
    headers: { ...h, Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify({
      class_enrollment_id,
      student_id,
      month,
      amount,
      status,
      note: note ?? null,
      paid_at: status === '납부' ? new Date().toISOString() : null,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: 400 });
  }
  const data = await res.json();
  return NextResponse.json(Array.isArray(data) ? data[0] : data);
}
