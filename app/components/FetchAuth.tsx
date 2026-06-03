'use client';

// /api/admin/* 요청에 액세스 토큰을 Authorization 헤더로 자동 첨부하고,
// 토큰 만료(401) 시 refresh_token으로 자동 갱신 후 1회 재시도한다.
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let patched = false;
let refreshing: Promise<string | null> | null = null;

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.pathname;
  if (typeof Request !== 'undefined' && input instanceof Request) return input.url;
  return String(input);
}

function setAccessToken(token: string) {
  localStorage.setItem('sb_access_token', token);
  document.cookie = `sb_access_token=${token}; path=/; max-age=43200; SameSite=Lax`;
}

function clearSession() {
  ['sb_access_token', 'sb_user', 'sb_role', 'sb_teacher_id', 'sb_refresh_token'].forEach((k) =>
    localStorage.removeItem(k),
  );
  document.cookie = 'sb_access_token=; path=/; max-age=0; SameSite=Lax';
}

function patchFetch() {
  if (patched || typeof window === 'undefined') return;
  patched = true;
  const orig = window.fetch.bind(window);

  // refresh_token으로 새 액세스 토큰 발급 (동시 401은 하나의 요청으로 합침)
  async function refresh(): Promise<string | null> {
    const rt = localStorage.getItem('sb_refresh_token');
    if (!rt) return null;
    if (!refreshing) {
      refreshing = (async () => {
        try {
          const res = await orig(`${SB_URL}/auth/v1/token?grant_type=refresh_token`, {
            method: 'POST',
            headers: { apikey: ANON, 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: rt }),
          });
          if (!res.ok) return null;
          const d = await res.json();
          if (d?.access_token) {
            setAccessToken(d.access_token);
            if (d.refresh_token) localStorage.setItem('sb_refresh_token', d.refresh_token);
            return d.access_token as string;
          }
          return null;
        } catch {
          return null;
        }
      })();
      refreshing.finally(() => { refreshing = null; });
    }
    return refreshing;
  }

  function withAuth(init: RequestInit, token: string): RequestInit {
    const h = new Headers(init.headers || undefined);
    h.set('Authorization', `Bearer ${token}`);
    return { ...init, headers: h };
  }

  window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const isAdmin = urlOf(input).includes('/api/admin');
    if (!isAdmin) return orig(input as any, init);

    const token = localStorage.getItem('sb_access_token');
    if (token) init = withAuth(init, token);

    let res = await orig(input as any, init);
    if (res.status !== 401) return res;

    // 만료 추정 → 갱신 시도
    const newToken = await refresh();
    if (newToken) {
      return orig(input as any, withAuth(init, newToken));
    }
    // 갱신 실패 → 세션 정리 후 로그인으로
    clearSession();
    if (!location.pathname.startsWith('/login')) {
      location.href = '/login?expired=1';
    }
    return res;
  };
}

patchFetch();

export default function FetchAuth() {
  patchFetch();
  return null;
}
