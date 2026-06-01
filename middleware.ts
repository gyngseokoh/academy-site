import { NextRequest, NextResponse } from 'next/server';

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 원장/부원장 전용 — 모든 메서드 차단
const DIRECTOR_ONLY = [
  '/api/admin/stats',
  '/api/admin/consultation-dashboard',
  '/api/admin/new-consultations',
];
// 이 경로는 GET(조회)은 모두 허용, 변경(POST/PATCH/DELETE)만 원장/부원장
const DIRECTOR_ONLY_WRITE = ['/api/admin/teachers'];

function unauthorized(msg: string, status: number) {
  return NextResponse.json({ error: msg }, { status });
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // 토큰: 쿠키 우선, 없으면 Authorization 헤더
  const cookieToken = req.cookies.get('sb_access_token')?.value;
  const authHeader = req.headers.get('authorization') || '';
  const token = cookieToken || (authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '');

  if (!token) return unauthorized('로그인이 필요합니다.', 401);

  // 토큰 유효성 확인
  const userRes = await fetch(`${SB_URL}/auth/v1/user`, {
    headers: { apikey: ANON, Authorization: `Bearer ${token}` },
  });
  if (!userRes.ok) return unauthorized('세션이 만료되었습니다. 다시 로그인해주세요.', 401);
  const user = await userRes.json();

  const needsDirector =
    DIRECTOR_ONLY.some((p) => path.startsWith(p)) ||
    (DIRECTOR_ONLY_WRITE.some((p) => path.startsWith(p)) && req.method !== 'GET');

  if (needsDirector) {
    const tRes = await fetch(
      `${SB_URL}/rest/v1/teachers?user_id=eq.${user.id}&select=role`,
      { headers: { apikey: ANON, Authorization: `Bearer ${token}` } },
    );
    const t = await tRes.json();
    // teachers에 매핑이 없으면 원장 계정으로 간주(로그인 로직과 동일)
    const role = Array.isArray(t) && t.length > 0 ? (t[0].role || 'teacher') : 'director';
    if (role !== 'director' && role !== 'vice_director') {
      return unauthorized('이 작업은 원장/부원장만 가능합니다.', 403);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/admin/:path*'],
};
