import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { slotId, slotTime, applicant_name, phone, content, school, grade, subject, consultation_type } = await req.json();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const authKey = serviceRoleKey || anonKey;
  const serviceHeaders = {
    apikey: anonKey,
    Authorization: `Bearer ${authKey}`,
    'Content-Type': 'application/json',
  };

  // 0. 슬롯 중복 신청 방지 — 현재 is_available 확인
  const availRes = await fetch(
    `${supabaseUrl}/rest/v1/director_slots?id=eq.${slotId}&select=teacher_id,is_available`,
    { headers: serviceHeaders },
  );
  const availData = await availRes.json();
  const slot = Array.isArray(availData) && availData.length > 0 ? availData[0] : null;
  if (!slot || slot.is_available === false) {
    return NextResponse.json({ error: '이미 예약된 시간입니다. 다른 시간을 선택해주세요.' }, { status: 409 });
  }
  const teacherId = slot.teacher_id ?? null;

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
        school: school ?? null,
        grade: grade ?? null,
        subject: subject ?? null,
        consultation_type: consultation_type ?? null,
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
