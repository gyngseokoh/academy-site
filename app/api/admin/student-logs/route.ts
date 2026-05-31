import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const headers = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

// 실제 DB 컬럼: id, student_id, log_date, content, progress, notes, created_at
// (teacher_id 컬럼 없음, 날짜 컬럼명은 log_date)

// GET /api/admin/student-logs?student_id=xxx&date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('student_id');
  const date = searchParams.get('date');

  let url = `${SUPABASE_URL}/rest/v1/student_logs?select=*&order=log_date.desc,created_at.desc`;
  if (studentId) url += `&student_id=eq.${studentId}`;
  if (date) url += `&log_date=eq.${date}`;

  const res = await fetch(url, { headers });
  const data = await res.json();
  return NextResponse.json(Array.isArray(data) ? data : []);
}

// POST /api/admin/student-logs
// body: { student_id, log_date|date, content?, progress?, notes? }
export async function POST(req: NextRequest) {
  const body = await req.json();
  const payload = {
    student_id: body.student_id,
    log_date: body.log_date ?? body.date,
    content: body.content ?? '',
    progress: body.progress?.trim() || null,
    notes: body.notes?.trim() || null,
  };

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
// body: { id, log_date?|date?, content?, progress?, notes? }
export async function PATCH(req: NextRequest) {
  const { id, ...raw } = await req.json();
  const fields: any = {};
  if (raw.log_date !== undefined || raw.date !== undefined) fields.log_date = raw.log_date ?? raw.date;
  if (raw.content !== undefined) fields.content = raw.content;
  if (raw.progress !== undefined) fields.progress = raw.progress?.trim() || null;
  if (raw.notes !== undefined) fields.notes = raw.notes?.trim() || null;

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
