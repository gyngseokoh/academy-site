import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const headers = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

// GET /api/admin/makeup?status=예정&teacher_id=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const teacherId = searchParams.get('teacher_id');

  let url = `${SUPABASE_URL}/rest/v1/makeup_classes?select=*,students(id,name,grade),classes(id,name,subject,teacher_id,teachers(id,name)),attendance_records(attendance_date,status)&order=scheduled_date.asc,scheduled_time.asc`;
  if (status) url += `&status=eq.${encodeURIComponent(status)}`;
  if (teacherId) url += `&teacher_id=eq.${teacherId}`;

  const res = await fetch(url, { headers });
  const data = await res.json();
  return NextResponse.json(Array.isArray(data) ? data : []);
}

// POST /api/admin/makeup — 보충 수업 등록
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { student_id, class_id, attendance_record_id, scheduled_date, scheduled_time, teacher_id, note } = body;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/makeup_classes`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify({
      student_id,
      class_id,
      attendance_record_id: attendance_record_id ?? null,
      scheduled_date: scheduled_date ?? null,
      scheduled_time: scheduled_time ?? null,
      teacher_id: teacher_id ?? null,
      note: note ?? null,
      status: '예정',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: 400 });
  }
  const data = await res.json();
  return NextResponse.json(Array.isArray(data) ? data[0] : data);
}

// PATCH /api/admin/makeup — 상태/일정 수정
export async function PATCH(req: NextRequest) {
  const { id, ...fields } = await req.json();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/makeup_classes?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify(fields),
  });
  if (!res.ok) return NextResponse.json({ error: 'update failed' }, { status: 500 });

  // 보충 완료 시 잔여 회차 복구
  if (fields.status === '완료' && fields.enrollment_id) {
    const enrRes = await fetch(
      `${SUPABASE_URL}/rest/v1/class_enrollments?id=eq.${fields.enrollment_id}&select=remaining_sessions`,
      { headers },
    );
    const enrData = await enrRes.json();
    if (Array.isArray(enrData) && enrData.length > 0) {
      const current = enrData[0].remaining_sessions ?? 0;
      await fetch(`${SUPABASE_URL}/rest/v1/class_enrollments?id=eq.${fields.enrollment_id}`, {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify({ remaining_sessions: current + 1 }),
      });
    }
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/makeup?id=xxx
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await fetch(`${SUPABASE_URL}/rest/v1/makeup_classes?id=eq.${id}`, {
    method: 'DELETE',
    headers,
  });
  return NextResponse.json({ ok: true });
}
