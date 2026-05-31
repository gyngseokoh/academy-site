// 토큰 만료 체크 유틸리티
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sb_access_token');
}

// API 호출 후 401이면 자동 로그아웃
export async function fetchWithAuth(url: string, options?: RequestInit): Promise<Response> {
  const res = await fetch(url, options);
  if (res.status === 401) {
    // 토큰 만료 → 로그아웃 처리
    ['sb_access_token', 'sb_user', 'sb_role', 'sb_teacher_id'].forEach(k =>
      localStorage.removeItem(k)
    );
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
export function checkAuth(redirectPath = '/login'): boolean {
  if (typeof window === 'undefined') return false;
  if (isTokenExpired()) {
    ['sb_access_token', 'sb_user', 'sb_role', 'sb_teacher_id'].forEach(k =>
      localStorage.removeItem(k)
    );
    window.location.href = `${redirectPath}?expired=1`;
    return false;
  }
  return true;
}
