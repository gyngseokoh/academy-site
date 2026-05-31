import { NextRequest, NextResponse } from 'next/server';

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SK = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const AK = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const h = { apikey: AK, Authorization: `Bearer ${SK}`, 'Content-Type': 'application/json' };

export async function GET() {
  const res = await fetch(`${SB_URL}/rest/v1/site_settings?select=key,value`, { headers: h });
  const rows: { key: string; value: string }[] = await res.json();
  // key-value 객체로 변환
  const obj: Record<string, string> = {};
  if (Array.isArray(rows)) rows.forEach(r => { obj[r.key] = r.value; });
  return NextResponse.json(obj);
}

export async function POST(req: NextRequest) {
  const body: Record<string, string> = await req.json();
  const rows = Object.entries(body).map(([key, value]) => ({
    key, value, updated_at: new Date().toISOString(),
  }));
  const res = await fetch(`${SB_URL}/rest/v1/site_settings`, {
    method: 'POST',
    headers: { ...h, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const err = await res.json();
    return NextResponse.json({ error: err }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
