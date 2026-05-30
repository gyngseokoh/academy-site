import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const headers = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

// POST — 요일/시간 추가
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { class_id, day_of_week, start_time, end_time } = body;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/class_schedules`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify({ class_id, day_of_week, start_time, end_time }),
  });
  const data = await res.json();
  if (!res.ok) return NextResponse.json({ error: data }, { status: 400 });
  return NextResponse.json(data);
}

// DELETE — 요일/시간 삭제
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await fetch(`${SUPABASE_URL}/rest/v1/class_schedules?id=eq.${id}`, {
    method: 'DELETE',
    headers,
  });
  return NextResponse.json({ ok: true });
}
