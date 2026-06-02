import { NextRequest, NextResponse } from 'next/server';

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SK = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const AK = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const h = { apikey: AK, Authorization: `Bearer ${SK}`, 'Content-Type': 'application/json' };

export async function GET() {
  const res = await fetch(`${SB_URL}/rest/v1/school_contents?select=*&order=school_name`, { headers: h });
  return NextResponse.json(await res.json());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(`${SB_URL}/rest/v1/school_contents?on_conflict=school_slug`, {
    method: 'POST',
    headers: { ...h, Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify({ ...body, updated_at: new Date().toISOString() }),
  });
  const data = await res.json();
  if (!res.ok) return NextResponse.json({ error: data }, { status: res.status });
  return NextResponse.json(Array.isArray(data) ? data[0] : data);
}

export async function PATCH(req: NextRequest) {
  const { id, ...fields } = await req.json();
  await fetch(`${SB_URL}/rest/v1/school_contents?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...h, Prefer: 'return=minimal' },
    body: JSON.stringify({ ...fields, updated_at: new Date().toISOString() }),
  });
  return NextResponse.json({ ok: true });
}
