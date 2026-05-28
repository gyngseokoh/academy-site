import { NextRequest, NextResponse } from 'next/server';

// GET /api/teacher-consultations?teacher_id=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const teacherId = searchParams.get('teacher_id');

  if (!teacherId) {
    return NextResponse.json({ error: 'teacher_id required' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const res = await fetch(
    `${supabaseUrl}/rest/v1/current_student_consultations?teacher_id=eq.${teacherId}&order=reserved_at.desc`,
    {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    },
  );

  const data = await res.json();
  return NextResponse.json(Array.isArray(data) ? data : []);
}

// PATCH /api/teacher-consultations
// body: { id, status, reserved_at, teacher_id }
export async function PATCH(req: NextRequest) {
  const { id, status, reserved_at, teacher_id } = await req.json();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // 상담 상태 업데이트
  const patchRes = await fetch(
    `${supabaseUrl}/rest/v1/current_student_consultations?id=eq.${id}`,
    {
      method: 'PATCH',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    },
  );

  if (!patchRes.ok) {
    return NextResponse.json({ error: '상태 업데이트 실패' }, { status: 500 });
  }

  // 거절 시 슬롯 복구
  if (status === '거절' && reserved_at && teacher_id) {
    await fetch(
      `${supabaseUrl}/rest/v1/teacher_slots?slot_time=eq.${encodeURIComponent(reserved_at)}&teacher_id=eq.${teacher_id}`,
      {
        method: 'PATCH',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_available: true }),
      },
    );
  }

  return NextResponse.json({ ok: true });
}
