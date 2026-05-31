import { NextRequest, NextResponse } from 'next/server';

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SK = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const AK = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const h = { apikey: AK, Authorization: `Bearer ${SK}`, 'Content-Type': 'application/json' };

export async function POST(req: NextRequest) {
  const { seminar_id, applicant_name, phone, school, grade } = await req.json();
  if (!seminar_id || !applicant_name || !phone) {
    return NextResponse.json({ error: '필수 항목을 입력해주세요' }, { status: 400 });
  }
  const res = await fetch(`${SB_URL}/rest/v1/seminar_applications`, {
    method: 'POST',
    headers: { ...h, Prefer: 'return=representation' },
    body: JSON.stringify({ seminar_id, applicant_name, phone, school: school ?? null, grade: grade ?? null }),
  });
  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
