'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type DashData = {
  new: {
    total: number; approved: number; rejected: number; pending: number; conversionRate: number;
    byTeacher: { teacher_id: string; name: string; total: number; approved: number; rejected: number; pending: number }[];
    monthly: { month: string; total: number; approved: number }[];
    recent: any[];
  };
  current: { total: number; approved: number; pending: number; recent: any[] };
};

export default function ConsultationDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'new' | 'current'>('new');

  useEffect(() => {
    const token = localStorage.getItem('sb_access_token');
    if (!token) { router.push('/login'); return; }
    fetch('/api/admin/consultation-dashboard?months=6')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">불러오는 중...</p>
    </main>
  );

  if (!data) return null;

  const maxMonthlyTotal = Math.max(...data.new.monthly.map(m => m.total), 1);

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">📈 상담 현황 대시보드</h1>
        <a href="/admin" className="text-sm hover:underline">← 관리자 홈</a>
      </nav>

      <div className="max-w-5xl mx-auto py-8 px-6">
        {/* 탭 */}
        <div className="flex gap-2 mb-8">
          {(['new', 'current'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-6 py-2 rounded-full font-bold text-sm transition
                ${tab === t ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 border hover:border-blue-400'}`}>
              {t === 'new' ? '신규생 상담' : '재원생 상담'}
            </button>
          ))}
        </div>

        {tab === 'new' && (
          <div className="space-y-6">
            {/* 핵심 지표 */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: '전체 상담', value: data.new.total, cls: 'bg-white border', val_cls: 'text-gray-800' },
                { label: '대기 중', value: data.new.pending, cls: 'bg-yellow-50 border-yellow-200 border', val_cls: 'text-yellow-700' },
                { label: '승인', value: data.new.approved, cls: 'bg-green-50 border-green-200 border', val_cls: 'text-green-700' },
                { label: '거절', value: data.new.rejected, cls: 'bg-red-50 border-red-200 border', val_cls: 'text-red-600' },
                { label: '전환율', value: `${data.new.conversionRate}%`, cls: 'bg-blue-700 border-blue-700 border', val_cls: 'text-white' },
              ].map(item => (
                <div key={item.label} className={`rounded-xl p-4 text-center ${item.cls}`}>
                  <p className={`text-3xl font-bold ${item.val_cls}`}>{item.value}</p>
                  <p className={`text-xs mt-1 ${item.val_cls === 'text-white' ? 'text-blue-200' : 'text-gray-500'}`}>{item.label}</p>
                </div>
              ))}
            </div>

            {/* 월별 추이 */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h3 className="font-bold text-gray-800 mb-5">월별 상담 추이</h3>
              <div className="flex items-end gap-3 h-32">
                {data.new.monthly.map(m => (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col justify-end gap-0.5" style={{ height: '96px' }}>
                      <div className="w-full bg-green-400 rounded-t"
                        style={{ height: `${m.total > 0 ? Math.round((m.approved / maxMonthlyTotal) * 90) : 0}px` }} />
                      <div className="w-full bg-blue-200 rounded-t"
                        style={{ height: `${m.total > 0 ? Math.round(((m.total - m.approved) / maxMonthlyTotal) * 90) : 2}px` }} />
                    </div>
                    <p className="text-xs text-gray-500">{m.month.slice(5)}월</p>
                    <p className="text-xs font-bold text-gray-700">{m.total}건</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-400 rounded inline-block" /> 승인</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-200 rounded inline-block" /> 기타</span>
              </div>
            </div>

            {/* 선생님별 현황 */}
            {data.new.byTeacher.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border p-6">
                <h3 className="font-bold text-gray-800 mb-4">선생님별 신규생 상담 현황</h3>
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>{['담당 선생님', '전체', '승인', '거절', '대기', '전환율'].map(h => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-bold text-gray-500">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.new.byTeacher.sort((a, b) => b.total - a.total).map(t => (
                      <tr key={t.teacher_id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium">{t.name}</td>
                        <td className="px-3 py-2">{t.total}</td>
                        <td className="px-3 py-2 text-green-600 font-medium">{t.approved}</td>
                        <td className="px-3 py-2 text-red-500">{t.rejected}</td>
                        <td className="px-3 py-2 text-yellow-600">{t.pending}</td>
                        <td className="px-3 py-2">
                          <span className="font-bold text-blue-700">
                            {t.total > 0 ? Math.round((t.approved / t.total) * 100) : 0}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 최근 상담 */}
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h3 className="font-bold text-gray-800 mb-4">최근 신규생 상담</h3>
              <div className="space-y-2">
                {data.new.recent.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div>
                      <span className="font-medium text-gray-800">{c.applicant_name}</span>
                      <span className="text-gray-400 text-xs ml-2">{c.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {c.teachers && <span className="text-xs text-gray-500">{c.teachers.name}</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold
                        ${c.status === '승인' ? 'bg-green-100 text-green-700' :
                          c.status === '거절' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'}`}>
                        {c.status || '대기'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'current' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: '전체 상담', value: data.current.total, cls: 'bg-white border' },
                { label: '대기 중', value: data.current.pending, cls: 'bg-yellow-50 border border-yellow-200' },
                { label: '승인', value: data.current.approved, cls: 'bg-green-50 border border-green-200' },
              ].map(item => (
                <div key={item.label} className={`rounded-xl p-6 text-center ${item.cls}`}>
                  <p className="text-3xl font-bold text-gray-800">{item.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h3 className="font-bold text-gray-800 mb-4">최근 재원생 상담</h3>
              <div className="space-y-2">
                {data.current.recent.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div>
                      <span className="font-medium text-gray-800">{c.applicant_name}</span>
                      <span className="text-gray-400 text-xs ml-2">{c.phone}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold
                      ${c.status === '승인' ? 'bg-green-100 text-green-700' :
                        c.status === '거절' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'}`}>
                      {c.status || '대기'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
