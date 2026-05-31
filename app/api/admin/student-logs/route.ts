import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const headers = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

// GET /api/admin/student-logs?student_id=xxx
// 실제 DB 컬럼: id, student_id, date, content, progress, notes, created_at
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('student_id');

  let url = `${SUPABASE_URL}/rest/v1/student_logs?select=*&order=date.desc,created_at.desc`;
  if (studentId) url += `&student_id=eq.${studentId}`;

  const res = await fetch(url, { headers });
  const data = await res.json();
  // 클라이언트가 log_date 필드 기대 → date → log_date 매핑
  const mapped = Array.isArray(data)
    ? data.map((r: any) => ({ ...r, log_date: r.date }))
    : [];
  return NextResponse.json(mapped);
}

// POST /api/admin/student-logs
// body: { student_id, date, content, progress?, notes? }
export async function POST(req: NextRequest) {
  const body = await req.json();
  // DB 컬럼에 맞게 필드명 정리
  const payload: any = {
    student_id: body.student_id,
    date: body.log_date ?? body.date, // 클라이언트는 log_date로 보냄
    content: body.content || '',
  };
  if (body.progress !== undefined) payload.progress = body.progress;
  if (body.notes !== undefined) payload.notes = body.notes;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/student_logs`, {
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

// PATCH /api/admin/student-logs
// body: { id, date?, content?, progress?, notes? }
export async function PATCH(req: NextRequest) {
  const { id, ...fields } = await req.json();
  // 클라이언트가 log_date로 보낼 경우 → date로 변환
  if (fields.log_date) { fields.date = fields.log_date; delete fields.log_date; }

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/student_logs?id=eq.${id}`,
    {
      method: 'PATCH',
      headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify(fields),
    },
  );
  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/student-logs?id=xxx
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await fetch(`${SUPABASE_URL}/rest/v1/student_logs?id=eq.${id}`, {
    method: 'DELETE',
    headers,
  });
  return NextResponse.json({ ok: true });
}
