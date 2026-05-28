import { NextRequest, NextResponse } from 'next/server';

// POST /api/admin/link-teacher
// body: { teacher_id, email }
// → auth.users에서 이메일로 user_id 조회 → teachers.user_id 업데이트
export async function POST(req: NextRequest) {
  const { teacher_id, email } = await req.json();

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // 1. Supabase Auth Admin API로 이메일 검색
  const usersRes = await fetch(
    `${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=1000`,
    {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
    },
  );

  if (!usersRes.ok) {
    return NextResponse.json({ error: '사용자 목록 조회 실패' }, { status: 500 });
  }

  const usersData = await usersRes.json();
  const users = usersData.users || [];
  const found = users.find((u: any) => u.email === email);

  if (!found) {
    return NextResponse.json(
      { error: `"${email}" 계정이 존재하지 않습니다. 먼저 Supabase에서 계정을 만들어 주세요.` },
      { status: 404 },
    );
  }

  // 2. teachers 테이블 user_id 업데이트
  const patchRes = await fetch(
    `${SUPABASE_URL}/rest/v1/teachers?id=eq.${teacher_id}`,
    {
      method: 'PATCH',
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({ user_id: found.id }),
    },
  );

  if (!patchRes.ok) {
    return NextResponse.json({ error: '연결 실패' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, user_id: found.id });
}
