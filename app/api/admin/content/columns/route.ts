import { NextRequest, NextResponse } from 'next/server';

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SK = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const AK = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const h = { apikey: AK, Authorization: `Bearer ${SK}`, 'Content-Type': 'application/json' };

export async function GET() {
  const res = await fetch(`${SB_URL}/rest/v1/columns?select=*&order=created_at.desc`, { headers: h });
  return NextResponse.json(await res.json());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(`${SB_URL}/rest/v1/columns`, {
    method: 'POST', headers: { ...h, Prefer: 'return=representation' }, body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) return NextResponse.json({ error: data }, { status: 400 });
  return NextResponse.json(Array.isArray(data) ? data[0] : data);
}

export async function PATCH(req: NextRequest) {
  const { id, ...fields } = await req.json();
  await fetch(`${SB_URL}/rest/v1/columns?id=eq.${id}`, {
    method: 'PATCH', headers: { ...h, Prefer: 'return=minimal' }, body: JSON.stringify(fields),
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await fetch(`${SB_URL}/rest/v1/columns?id=eq.${id}`, { method: 'DELETE', headers: h });
  return NextResponse.json({ ok: true });
}
