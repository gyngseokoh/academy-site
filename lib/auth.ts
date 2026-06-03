// 토큰 만료 체크 유틸리티
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sb_access_token');
}

function hasRefresh(): boolean {
  return typeof window !== 'undefined' && !!localStorage.getItem('sb_refresh_token');
}

function clearSession() {
  ['sb_access_token', 'sb_user', 'sb_role', 'sb_teacher_id', 'sb_refresh_token'].forEach((k) =>
    localStorage.removeItem(k),
  );
  document.cookie = 'sb_access_token=; path=/; max-age=0; SameSite=Lax';
}

// API 호출 후 401이면 로그아웃 (단, refresh 토큰이 있으면 FetchAuth가 자동 갱신하므로 유지)
export async function fetchWithAuth(url: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(url, options);
  if (res.status === 401 && !hasRefresh()) {
    clearSession();
    window.location.href = '/login?expired=1';
  }
  return res;
}

// 토큰이 만료됐는지 JWT payload로 확인
export function isTokenExpired(): boolean {
  const token = getToken();
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

// 페이지 진입 시 토큰 유효성 체크 (useEffect에서 호출)
// access 토큰이 만료됐어도 refresh 토큰이 있으면 통과시킨다(API 호출 시 FetchAuth가 자동 갱신).
export function checkAuth(redirectPath = '/login'): boolean {
  if (typeof window === 'undefined') return false;
  if (isTokenExpired() && !hasRefresh()) {
    clearSession();
    window.location.href = `${redirectPath}?expired=1`;
    return false;
  }
  return true;
}
