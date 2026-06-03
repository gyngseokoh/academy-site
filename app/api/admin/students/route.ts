import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const headers = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

// 선생님(teacher) 역할이면 본인 담당 학생만 수정/삭제 가능하도록 검증.
// 원장/부원장은 제한 없음. (역할/담당 정보는 미들웨어가 세팅한 신뢰 헤더에서 읽음)
async function ownershipBlock(req: NextRequest, ids: string[]): Promise<NextResponse | null> {
  const role = req.headers.get('x-sb-role') || '';
  if (role !== 'teacher') return null;
  const teacherId = req.headers.get('x-sb-teacher') || '';
  if (!teacherId) return NextResponse.json({ error: '권한 정보를 확인할 수 없습니다.' }, { status: 403 });
  if (ids.length === 0) return null;
  const inList = ids.map((i) => `"${i}"`).join(',');
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/students?id=in.(${inList})&select=id,teacher_id`,
    { headers },
  );
  const rows = await res.json();
  const ok = Array.isArray(rows) && rows.length === ids.length && rows.every((r: any) => r.teacher_id === teacherId);
  if (!ok) return NextResponse.json({ error: '본인 담당 학생만 수정/삭제할 수 있습니다.' }, { status: 403 });
  return null;
}

// GET /api/admin/students?teacher_id=xxx (optional filter)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const teacherId = searchParams.get('teacher_id');

  let url = `${SUPABASE_URL}/rest/v1/students?select=*,teachers(name,subject)&order=name`;
  if (teacherId) url += `&teacher_id=eq.${teacherId}`;

  const res = await fetch(url, { headers });
  const data = await res.json();
  return NextResponse.json(Array.isArray(data) ? data : []);
}

// POST /api/admin/students — 단일 객체 또는 객체 배열(일괄 등록)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const payload = Array.isArray(body)
    ? body
    : Array.isArray(body.rows)
      ? body.rows
      : body;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/students`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: 400 });
  }
  const data = await res.json();
  return NextResponse.json(data);
}

// PATCH /api/admin/students
// 단일:  { id, ...fields }   일괄:  { ids: [...], fields: {...} }
export async function PATCH(req: NextRequest) {
  const body = await req.json();

  if (Array.isArray(body.ids)) {
    if (body.ids.length === 0) return NextResponse.json({ ok: true });
    const blocked = await ownershipBlock(req, body.ids);
    if (blocked) return blocked;
    const inList = body.ids.map((i: string) => `"${i}"`).join(',');
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/students?id=in.(${inList})`,
      { method: 'PATCH', headers: { ...headers, Prefer: 'return=minimal' }, body: JSON.stringify(body.fields ?? {}) },
    );
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: 400 });
    }
    return NextResponse.json({ ok: true, count: body.ids.length });
  }

  const { id, ...fields } = body;
  const blocked = await ownershipBlock(req, [id]);
  if (blocked) return blocked;
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/students?id=eq.${id}`,
    { method: 'PATCH', headers: { ...headers, Prefer: 'return=minimal' }, body: JSON.stringify(fields) },
  );
  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/students?id=xxx  또는  ?ids=a,b,c (일괄)
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const ids = searchParams.get('ids');

  if (ids) {
    const list = ids.split(',').filter(Boolean);
    if (list.length === 0) return NextResponse.json({ ok: true });
    const blocked = await ownershipBlock(req, list);
    if (blocked) return blocked;
    const inList = list.map((i) => `"${i}"`).join(',');
    await fetch(`${SUPABASE_URL}/rest/v1/students?id=in.(${inList})`, { method: 'DELETE', headers });
    return NextResponse.json({ ok: true, count: list.length });
  }

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const blocked = await ownershipBlock(req, [id]);
  if (blocked) return blocked;
  await fetch(`${SUPABASE_URL}/rest/v1/students?id=eq.${id}`, { method: 'DELETE', headers });
  return NextResponse.json({ ok: true });
}
