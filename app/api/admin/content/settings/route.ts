import { NextRequest, NextResponse } from 'next/server';

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SK = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const AK = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const h = { apikey: AK, Authorization: `Bearer ${SK}`, 'Content-Type': 'application/json' };

export async function GET() {
  const res = await fetch(`${SB_URL}/rest/v1/site_settings?select=key,value`, { headers: h });
  const rows = await res.json();
  const obj: Record<string, string> = {};
  if (Array.isArray(rows)) rows.forEach((r: any) => { obj[r.key] = r.value; });
  return NextResponse.json(obj);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  // 문자열 키/값만 추려서 정제 (오염된 키나 비문자열 값으로 인한 거부 방지)
  const rows = Object.entries(body)
    .filter(([key, value]) =>
      typeof key === 'string' &&
      key !== 'error' &&
      (typeof value === 'string' || typeof value === 'number' || value === null || value === undefined),
    )
    .map(([key, value]) => ({
      key,
      value: value == null ? '' : String(value),
      updated_at: new Date().toISOString(),
    }));

  if (rows.length === 0) {
    return NextResponse.json({ error: '저장할 항목이 없습니다.' }, { status: 400 });
  }

  // on_conflict=key 를 명시해야 PostgREST upsert(merge-duplicates)가 안정적으로 동작
  const res = await fetch(`${SB_URL}/rest/v1/site_settings?on_conflict=key`, {
    method: 'POST',
    headers: { ...h, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(rows),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[content/settings] upsert 실패:', res.status, err);
    return NextResponse.json({ error: err || 'upsert failed' }, { status: res.status });
  }
  return NextResponse.json({ ok: true });
}
