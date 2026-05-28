import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const headers = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

// GET /api/admin/new-consultations — 신규생 상담 전체 조회 (담당자 포함)
export async function GET() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/new_student_consultations?select=*,teachers(id,name,role)&order=reserved_at.desc`,
    { headers },
  );
  const data = await res.json();
  return NextResponse.json(Array.isArray(data) ? data : []);
}

// PATCH /api/admin/new-consultations — 상태 변경
// body: { id, status, reserved_at }
export async function PATCH(req: NextRequest) {
  const { id, status, reserved_at } = await req.json();

  // 상담 상태 업데이트
  const patchRes = await fetch(
    `${SUPABASE_URL}/rest/v1/new_student_consultations?id=eq.${id}`,
    {
      method: 'PATCH',
      headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify({ status }),
    },
  );

  if (!patchRes.ok) {
    return NextResponse.json({ error: '상태 업데이트 실패' }, { status: 500 });
  }

  // 거절 시 슬롯 복구
  if (status === '거절' && reserved_at) {
    await fetch(
      `${SUPABASE_URL}/rest/v1/director_slots?slot_time=eq.${encodeURIComponent(reserved_at)}`,
      {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify({ is_available: true }),
      },
    );
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/new-consultations?id=xxx — 상담 기록 삭제
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await fetch(
    `${SUPABASE_URL}/rest/v1/new_student_consultations?id=eq.${id}`,
    { method: 'DELETE', headers },
  );
  return NextResponse.json({ ok: true });
}
