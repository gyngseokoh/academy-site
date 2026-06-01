'use client';

// /api/admin/* 요청에 localStorage의 액세스 토큰을 Authorization 헤더로 자동 첨부.
// 미들웨어 인증이 쿠키뿐 아니라 헤더도 받으므로, 쿠키 유무/재로그인과 무관하게 동작.
let patched = false;
function patchFetch() {
  if (patched || typeof window === 'undefined') return;
  patched = true;
  const orig = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init: RequestInit = {}) => {
    try {
      const url =
        typeof input === 'string' ? input :
        input instanceof URL ? input.pathname :
        input instanceof Request ? input.url : String(input);
      if (url.includes('/api/admin')) {
        const token = localStorage.getItem('sb_access_token');
        if (token) {
          const headers = new Headers(
            init.headers ?? (input instanceof Request ? input.headers : undefined),
          );
          if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
          init = { ...init, headers };
        }
      }
    } catch {
      /* noop */
    }
    return orig(input as any, init);
  };
}

// 모듈 로드 시 즉시 패치 (어떤 페이지의 fetch보다 먼저 적용)
patchFetch();

export default function FetchAuth() {
  patchFetch();
  return null;
}
