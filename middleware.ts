import { NextRequest, NextResponse } from 'next/server';

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 원장/부원장 전용 — 모든 메서드 차단
const DIRECTOR_ONLY = [
  '/api/admin/stats',
  '/api/admin/consultation-dashboard',
  '/api/admin/new-consultations',
];
// 조회(GET)는 모두 허용, 변경(POST/PATCH/DELETE)만 원장/부원장
//  - teachers: 선생님 계정 관리
//  - content : 홈페이지/콘텐츠 편집
const DIRECTOR_ONLY_WRITE = ['/api/admin/teachers', '/api/admin/content'];

function deny(msg: string, status: number) {
  return NextResponse.json({ error: msg }, { status });
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // 토큰: 쿠키 우선, 없으면 Authorization 헤더
  const cookieToken = req.cookies.get('sb_access_token')?.value;
  const authHeader = req.headers.get('authorization') || '';
  const token = cookieToken || (authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '');

  if (!token) return deny('로그인이 필요합니다.', 401);

  // 토큰 유효성 확인
  const userRes = await fetch(`${SB_URL}/auth/v1/user`, {
    headers: { apikey: ANON, Authorization: `Bearer ${token}` },
  });
  if (!userRes.ok) return deny('세션이 만료되었습니다. 다시 로그인해주세요.', 401);
  const user = await userRes.json();

  // 역할 + teacher_id 조회 (다운스트림 소유권 검증에 사용)
  let role = 'director';   // teachers 매핑 없으면 원장으로 간주(로그인 로직과 동일)
  let teacherId = '';
  const tRes = await fetch(
    `${SB_URL}/rest/v1/teachers?user_id=eq.${user.id}&select=id,role`,
    { headers: { apikey: ANON, Authorization: `Bearer ${token}` } },
  );
  const t = await tRes.json();
  if (Array.isArray(t) && t.length > 0) {
    role = t[0].role || 'teacher';
    teacherId = t[0].id || '';
  }

  const needsDirector =
    DIRECTOR_ONLY.some((p) => path.startsWith(p)) ||
    (DIRECTOR_ONLY_WRITE.some((p) => path.startsWith(p)) && req.method !== 'GET');

  if (needsDirector && role !== 'director' && role !== 'vice_director') {
    return deny('이 작업은 원장/부원장만 가능합니다.', 403);
  }

  // 역할/담당 정보를 신뢰 가능한 헤더로 라우트에 전달 (클라이언트가 보낸 값은 덮어씀)
  const h = new Headers(req.headers);
  h.set('x-sb-role', role);
  h.set('x-sb-teacher', teacherId);
  return NextResponse.next({ request: { headers: h } });
}

export const config = {
  matcher: ['/api/admin/:path*'],
};
