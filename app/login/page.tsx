'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('expired') === '1') {
      setError('로그인 세션이 만료됐습니다. 다시 로그인해주세요.');
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: 'POST',
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      },
    );

    const data = await res.json();

    if (!res.ok || !data.access_token) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      setLoading(false);
      return;
    }

    localStorage.setItem('sb_access_token', data.access_token);
    // 미들웨어 인증용 쿠키 (same-origin 요청에 자동 포함)
    document.cookie = `sb_access_token=${data.access_token}; path=/; max-age=43200; SameSite=Lax`;
    if (data.refresh_token) localStorage.setItem('sb_refresh_token', data.refresh_token);
    localStorage.setItem('sb_user', JSON.stringify(data.user));

    const userId = data.user?.id;
    if (userId) {
      const teacherRes = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/teachers?user_id=eq.${userId}&select=id,role`,
        { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! } },
      );
      const teacherData = await teacherRes.json();
      const teacherRecord = Array.isArray(teacherData) && teacherData.length > 0 ? teacherData[0] : null;

      if (teacherRecord) {
        const role = teacherRecord.role || 'teacher';
        localStorage.setItem('sb_role', role);
        localStorage.setItem('sb_teacher_id', teacherRecord.id);
        router.push(role === 'director' || role === 'vice_director' ? '/admin' : '/admin/teacher');
      } else {
        localStorage.setItem('sb_role', 'director');
        localStorage.removeItem('sb_teacher_id');
        router.push('/admin');
      }
    } else {
      router.push('/admin');
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
        <input type="email" required value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="이메일 입력" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
        <input type="password" required value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="비밀번호 입력" />
      </div>
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      <button type="submit" disabled={loading}
        className="w-full bg-blue-700 text-white py-3 rounded-lg font-bold hover:bg-blue-800 transition disabled:opacity-50">
        {loading ? '로그인 중...' : '로그인'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-md p-10 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
          <img src="/logo.png" alt="SKY" className="h-9 w-9 object-contain inline-block" /> 스카이수학과학입시학원
        </h1>
        <p className="text-center text-gray-500 mb-8">관리자 로그인</p>
        <Suspense fallback={<div className="text-center text-gray-400 py-4">로딩 중...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
