'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Stats = {
  total: number;
  newThisMonth: number;
  totalConsultations: number;
  approvedConsultations: number;
  conversionRate: number;
  bySchool: { school: string; count: number }[];
  byGrade: { grade: string; count: number }[];
  byTeacher: { id: string; name: string; role: string; count: number }[];
  monthlyNew: { month: string; count: number }[];
};

const ROLE_LABEL: Record<string, string> = {
  director: '원장', vice_director: '부원장', teacher: '선생님',
};

export default function StatsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('sb_access_token');
    if (!token) { router.push('/login'); return; }
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false); });
  }, []);

  if (loading) return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">불러오는 중...</p>
    </main>
  );

  if (!stats) return null;

  const maxSchool = Math.max(...stats.bySchool.map(s => s.count), 1);
  const maxMonthly = Math.max(...stats.monthlyNew.map(m => m.count), 1);

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">📊 통계 대시보드</h1>
        <a href="/admin" className="text-sm hover:underline">← 관리자 홈</a>
      </nav>

      <div className="max-w-5xl mx-auto py-8 px-6 space-y-6">
        {/* 핵심 지표 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: '전체 재원생', value: stats.total, unit: '명', color: 'text-blue-700' },
            { label: '이번 달 신규', value: stats.newThisMonth, unit: '명', color: 'text-green-600' },
            { label: '누적 상담', value: stats.totalConsultations, unit: '건', color: 'text-gray-700' },
            { label: '등록 전환율', value: stats.conversionRate, unit: '%', color: 'text-yellow-600' },
          ].map(item => (
            <div key={item.label} className="bg-white rounded-2xl border p-5 text-center shadow-sm">
              <p className={`text-4xl font-bold ${item.color}`}>{item.value}<span className="text-lg">{item.unit}</span></p>
              <p className="text-gray-500 text-sm mt-1">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 월별 신규 학생 */}
          <div className="bg-white rounded-2xl border p-6 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-5">월별 신규 학생</h3>
            <div className="flex items-end gap-2 h-32">
              {stats.monthlyNew.map(m => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-bold text-blue-700">{m.count}</span>
                  <div className="w-full bg-blue-600 rounded-t transition-all"
                    style={{ height: `${Math.max(4, Math.round((m.count / maxMonthly) * 88))}px` }} />
                  <span className="text-xs text-gray-400">{m.month.slice(5)}월</span>
                </div>
              ))}
            </div>
          </div>

          {/* 선생님별 학생 수 */}
          <div className="bg-white rounded-2xl border p-6 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4">선생님별 담당 학생</h3>
            <div className="space-y-3">
              {stats.byTeacher.filter(t => t.count > 0).map(t => (
                <div key={t.id} className="flex items-center gap-3">
                  <div className="w-20 text-sm font-medium text-gray-700 flex-shrink-0 flex items-center gap-1">
                    {t.name}
                    <span className="text-xs text-gray-400">({ROLE_LABEL[t.role] ?? '선생님'})</span>
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${Math.round((t.count / stats.total) * 100)}%` }} />
                  </div>
                  <span className="text-sm font-bold text-gray-700 w-8 text-right">{t.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 학교별 학생 수 */}
          <div className="bg-white rounded-2xl border p-6 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4">학교별 재원생</h3>
            <div className="space-y-2">
              {stats.bySchool.slice(0, 10).map(s => (
                <div key={s.school} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-24 flex-shrink-0 truncate">{s.school}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${Math.round((s.count / maxSchool) * 100)}%` }} />
                  </div>
                  <span className="text-sm font-bold text-gray-700 w-6 text-right">{s.count}</span>
                </div>
              ))}
              {stats.bySchool.length === 0 && (
                <p className="text-gray-400 text-sm">학생 정보에 학교가 입력되지 않았습니다</p>
              )}
            </div>
          </div>

          {/* 학년별 학생 수 */}
          <div className="bg-white rounded-2xl border p-6 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4">학년별 재원생</h3>
            <div className="grid grid-cols-3 gap-3">
              {stats.byGrade.map(g => (
                <div key={g.grade} className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold text-blue-700">{g.count}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{g.grade}</p>
                </div>
              ))}
              {stats.byGrade.length === 0 && (
                <p className="text-gray-400 text-sm col-span-3">학생 정보에 학년이 입력되지 않았습니다</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
