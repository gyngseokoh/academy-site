import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const headers = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

// GET /api/admin/classes — 전체 반 조회 (스케줄 + 학생 수 포함)
export async function GET() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/classes?is_active=eq.true&select=*,teachers(id,name),class_schedules(*),class_enrollments(id,student_id,monthly_sessions,remaining_sessions,students(id,name,grade))&order=name`,
    { headers },
  );
  const data = await res.json();
  return NextResponse.json(Array.isArray(data) ? data : []);
}

// POST /api/admin/classes — 새 반 추가
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, subject, teacher_id } = body;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/classes`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify({ name, subject, teacher_id: teacher_id || null }),
  });
  const data = await res.json();
  if (!res.ok) return NextResponse.json({ error: data }, { status: 400 });
  return NextResponse.json(data);
}

// PATCH /api/admin/classes — 반 수정
export async function PATCH(req: NextRequest) {
  const { id, ...fields } = await req.json();
  await fetch(`${SUPABASE_URL}/rest/v1/classes?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify(fields),
  });
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/classes?id=xxx — 반 삭제 (soft delete)
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await fetch(`${SUPABASE_URL}/rest/v1/classes?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify({ is_active: false }),
  });
  return NextResponse.json({ ok: true });
}
