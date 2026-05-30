import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const headers = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

// POST — 학생 반 배정
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { class_id, student_id, monthly_sessions, remaining_sessions } = body;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/class_enrollments`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify({
      class_id,
      student_id,
      monthly_sessions: monthly_sessions ?? 8,
      remaining_sessions: remaining_sessions ?? monthly_sessions ?? 8,
    }),
  });
  const data = await res.json();
  if (!res.ok) return NextResponse.json({ error: data }, { status: 400 });
  return NextResponse.json(data);
}

// PATCH — 회차 수정
export async function PATCH(req: NextRequest) {
  const { id, ...fields } = await req.json();
  await fetch(`${SUPABASE_URL}/rest/v1/class_enrollments?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify(fields),
  });
  return NextResponse.json({ ok: true });
}

// DELETE — 학생 반 제거
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await fetch(`${SUPABASE_URL}/rest/v1/class_enrollments?id=eq.${id}`, {
    method: 'DELETE',
    headers,
  });
  return NextResponse.json({ ok: true });
}
