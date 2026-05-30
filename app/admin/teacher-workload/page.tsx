'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type TeacherStat = {
  id: string;
  name: string;
  role: string;
  studentCount: number;
  todayStudents: number;
  todayDone: number;
  todayRemaining: number;
  makeupCount: number;
  newConsCount: number;
  curConsCount: number;
  totalPending: number;
};

const ROLE_LABEL: Record<string, string> = {
  director: '원장',
  vice_director: '부원장',
  teacher: '선생님',
};

const ROLE_COLOR: Record<string, string> = {
  director: 'bg-purple-100 text-purple-700',
  vice_director: 'bg-blue-100 text-blue-700',
  teacher: 'bg-gray-100 text-gray-600',
};

export default function TeacherWorkloadPage() {
  const router = useRouter();
  const [data, setData] = useState<{ today: string; result: TeacherStat[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sb_access_token');
    if (!token) { router.push('/login'); return; }
    fetch('/api/admin/teacher-workload')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); });
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    fetch('/api/admin/teacher-workload')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); });
  };

  if (loading) return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">불러오는 중...</p>
    </main>
  );

  const teachers = data?.result ?? [];
  const today = data?.today ?? '';

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">👩‍🏫 선생님 업무 현황</h1>
        <div className="flex items-center gap-4">
          <button onClick={handleRefresh}
            className="bg-white/20 text-white px-3 py-1 rounded-lg text-sm hover:bg-white/30">
            🔄 새로고침
          </button>
          <a href="/admin" className="text-sm hover:underline">← 관리자 홈</a>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto py-8 px-6">
        <p className="text-gray-500 text-sm mb-6">기준일: {today} / 오늘 출결 기준</p>

        {/* 전체 요약 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: '전체 선생님', value: teachers.length },
            { label: '오늘 미처리 출결', value: teachers.reduce((s, t) => s + t.todayRemaining, 0), warn: true },
            { label: '보충 예정', value: teachers.reduce((s, t) => s + t.makeupCount, 0), warn: true },
            { label: '대기 상담', value: teachers.reduce((s, t) => s + t.newConsCount + t.curConsCount, 0), warn: true },
          ].map(item => (
            <div key={item.label} className={`rounded-xl p-4 text-center border ${item.warn && (item.value as number) > 0 ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100'}`}>
              <p className={`text-2xl font-bold ${item.warn && (item.value as number) > 0 ? 'text-orange-600' : 'text-gray-800'}`}>{item.value}</p>
              <p className="text-xs text-gray-500 mt-1">{item.label}</p>
            </div>
          ))}
        </div>

        {/* 선생님별 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teachers.map(t => (
            <div key={t.id} className="bg-white rounded-2xl shadow-sm border p-5">
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-800 text-lg">{t.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${ROLE_COLOR[t.role] ?? 'bg-gray-100 text-gray-600'}`}>
                    {ROLE_LABEL[t.role] ?? '선생님'}
                  </span>
                </div>
                {t.totalPending > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    처리 {t.totalPending}건
                  </span>
                )}
              </div>

              {/* 지표 그리드 */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '담당 학생', value: `${t.studentCount}명`, cls: 'bg-gray-50' },
                  { label: '오늘 수업', value: `${t.todayStudents}명`, cls: 'bg-blue-50' },
                  {
                    label: '출결 처리',
                    value: t.todayStudents > 0 ? `${t.todayDone}/${t.todayStudents}` : '-',
                    cls: t.todayRemaining > 0 ? 'bg-orange-50' : 'bg-green-50',
                  },
                  {
                    label: '미처리 출결',
                    value: t.todayRemaining > 0 ? `${t.todayRemaining}건` : '완료',
                    cls: t.todayRemaining > 0 ? 'bg-orange-50 text-orange-600' : 'bg-green-50 text-green-700',
                  },
                  {
                    label: '보충 예정',
                    value: `${t.makeupCount}건`,
                    cls: t.makeupCount > 0 ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-50',
                  },
                  {
                    label: '대기 상담',
                    value: `${t.newConsCount + t.curConsCount}건`,
                    cls: (t.newConsCount + t.curConsCount) > 0 ? 'bg-red-50 text-red-600' : 'bg-gray-50',
                  },
                ].map(item => (
                  <div key={item.label} className={`rounded-lg p-2 text-center ${item.cls}`}>
                    <p className="text-sm font-bold text-gray-800">{item.value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.label}</p>
                  </div>
                ))}
              </div>

              {/* 바 차트: 오늘 출결 처리율 */}
              {t.todayStudents > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>오늘 출결 처리율</span>
                    <span>{Math.round((t.todayDone / t.todayStudents) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${t.todayRemaining === 0 ? 'bg-green-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.round((t.todayDone / t.todayStudents) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
