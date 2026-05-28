import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const headers = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

// GET /api/admin/current-consultations
export async function GET() {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/current_student_consultations?select=*&order=reserved_at.desc`,
    { headers },
  );
  const data = await res.json();
  return NextResponse.json(Array.isArray(data) ? data : []);
}

// DELETE /api/admin/current-consultations?id=xxx — 상담 기록 삭제
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await fetch(
    `${SUPABASE_URL}/rest/v1/current_student_consultations?id=eq.${id}`,
    { method: 'DELETE', headers },
  );
  return NextResponse.json({ ok: true });
}
