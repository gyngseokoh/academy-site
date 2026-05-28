import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { slotId, slotTime, applicant_name, phone, content } = await req.json();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const authKey = serviceRoleKey || anonKey;
  const serviceHeaders = {
    apikey: anonKey,
    Authorization: `Bearer ${authKey}`,
    'Content-Type': 'application/json',
  };

  // 1. 슬롯에서 teacher_id 조회
  const slotRes = await fetch(
    `${supabaseUrl}/rest/v1/director_slots?id=eq.${slotId}&select=teacher_id`,
    { headers: serviceHeaders },
  );
  const slotData = await slotRes.json();
  const teacherId = Array.isArray(slotData) && slotData.length > 0
    ? slotData[0].teacher_id
    : null;

  // 2. 상담 신청 등록 (teacher_id 포함)
  const insertRes = await fetch(
    `${supabaseUrl}/rest/v1/new_student_consultations`,
    {
      method: 'POST',
      headers: { ...serviceHeaders, Prefer: 'return=minimal' },
      body: JSON.stringify({
        applicant_name,
        phone,
        content,
        reserved_at: slotTime,
        status: '대기',
        teacher_id: teacherId,
      }),
    },
  );

  if (!insertRes.ok) {
    const err = await insertRes.text();
    console.error('[book-consultation] INSERT 실패:', err);
    return NextResponse.json({ error: '상담 신청 등록 실패', detail: err }, { status: 400 });
  }

  // 3. 슬롯 비활성화
  const patchRes = await fetch(
    `${supabaseUrl}/rest/v1/director_slots?id=eq.${slotId}`,
    {
      method: 'PATCH',
      headers: serviceHeaders,
      body: JSON.stringify({ is_available: false }),
    },
  );

  if (!patchRes.ok) {
    const err = await patchRes.text();
    // 슬롯 비활성화 실패 시 경고 로그 (신청 자체는 완료됨)
    console.error('슬롯 비활성화 실패:', err);
    return NextResponse.json(
      { error: '슬롯 비활성화 실패. 관리자에게 문의하세요.', detail: err },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
