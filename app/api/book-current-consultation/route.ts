import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { slotId, slotTime, teacher_id, applicant_name, phone, content } =
    await req.json();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const authKey = serviceRoleKey || anonKey;

  // 1. 재원생 상담 신청 등록
  const insertRes = await fetch(
    `${supabaseUrl}/rest/v1/current_student_consultations`,
    {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${authKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        teacher_id,
        applicant_name,
        phone,
        content,
        reserved_at: slotTime,
      }),
    },
  );

  if (!insertRes.ok) {
    const err = await insertRes.text();
    return NextResponse.json(
      { error: '상담 신청 등록 실패', detail: err },
      { status: 400 },
    );
  }

  // 2. teacher_slots 비활성화 (service role key로 RLS 우회)
  const patchRes = await fetch(
    `${supabaseUrl}/rest/v1/teacher_slots?id=eq.${slotId}`,
    {
      method: 'PATCH',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${authKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ is_available: false }),
    },
  );

  if (!patchRes.ok) {
    const err = await patchRes.text();
    console.error('teacher_slots 비활성화 실패:', err);
    return NextResponse.json(
      { error: '슬롯 비활성화 실패. 관리자에게 문의하세요.', detail: err },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
