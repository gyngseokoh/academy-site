'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';

type DashboardData = {
  month: string;
  absent: any[];
  makeupPending: any[];
  makeupMissed: any[];
  frequentLate: { student_id: string; name: string; grade: string; count: number; classes: string[] }[];
  longAbsent: { student_id: string; name: string; grade: string; class_name: string; teacher: string }[];
};

function getMonthStr() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 7);
}

export default function DashboardPage() {
  const router = useRouter();
  const [month, setMonth] = useState(getMonthStr());
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'absent' | 'makeupPending' | 'makeupMissed' | 'frequentLate' | 'longAbsent'>('absent');

  useEffect(() => {
    const token = localStorage.getItem('sb_access_token');
    if (!token) { router.push('/login'); return; }
  }, []);

  useEffect(() => { fetchDashboard(); }, [month]);

  const fetchDashboard = async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/dashboard?month=${month}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  };

  const handleExcel = () => {
    if (!data) return;

    const wb = XLSX.utils.book_new();

    // 결석 시트
    const absentSheet = XLSX.utils.json_to_sheet(data.absent.map(r => ({
      학생명: r.students?.name ?? '',
      학년: r.students?.grade ?? '',
      반: r.classes?.name ?? '',
      담당: r.classes?.teachers?.name ?? '',
      결석일: r.attendance_date,
    })));
    XLSX.utils.book_append_sheet(wb, absentSheet, '결석목록');

    // 보충예정 시트
    const pendingSheet = XLSX.utils.json_to_sheet(data.makeupPending.map(r => ({
      학생명: r.students?.name ?? '',
      학년: r.students?.grade ?? '',
      반: r.classes?.name ?? '',
      담당: r.classes?.teachers?.name ?? '',
      보충예정일: r.scheduled_date ?? '',
      보충시간: r.scheduled_time?.slice(0, 5) ?? '',
    })));
    XLSX.utils.book_append_sheet(wb, pendingSheet, '보충예정');

    // 보충미완료 시트
    const missedSheet = XLSX.utils.json_to_sheet(data.makeupMissed.map(r => ({
      학생명: r.students?.name ?? '',
      학년: r.students?.grade ?? '',
      반: r.classes?.name ?? '',
      담당: r.classes?.teachers?.name ?? '',
      예정일: r.scheduled_date ?? '',
    })));
    XLSX.utils.book_append_sheet(wb, missedSheet, '보충미완료');

    // 잦은지각 시트
    const lateSheet = XLSX.utils.json_to_sheet(data.frequentLate.map(r => ({
      학생명: r.name,
      학년: r.grade,
      지각횟수: r.count,
      수강반: r.classes.join(', '),
    })));
    XLSX.utils.book_append_sheet(wb, lateSheet, '잦은지각');

    // 장기미등원 시트
    const longAbsentSheet = XLSX.utils.json_to_sheet(data.longAbsent.map(r => ({
      학생명: r.name,
      학년: r.grade,
      반: r.class_name,
      담당: r.teacher,
    })));
    XLSX.utils.book_append_sheet(wb, longAbsentSheet, '장기미등원');

    XLSX.writeFile(wb, `출결현황_${month}.xlsx`);
  };

  const tabs = [
    { key: 'absent' as const, label: '결석', emoji: '❌', color: 'text-red-600', count: data?.absent.length ?? 0 },
    { key: 'makeupPending' as const, label: '보충예정', emoji: '📅', color: 'text-blue-600', count: data?.makeupPending.length ?? 0 },
    { key: 'makeupMissed' as const, label: '보충미완료', emoji: '⚠️', color: 'text-orange-600', count: data?.makeupMissed.length ?? 0 },
    { key: 'frequentLate' as const, label: '잦은지각', emoji: '⏰', color: 'text-yellow-600', count: data?.frequentLate.length ?? 0 },
    { key: 'longAbsent' as const, label: '장기미등원', emoji: '🚨', color: 'text-red-700', count: data?.longAbsent.length ?? 0 },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">📊 출결 현황판</h1>
        <a href="/admin" className="text-sm hover:underline">← 관리자 홈</a>
      </nav>

      <div className="max-w-5xl mx-auto py-8 px-6">
        {/* 월 선택 + 엑셀 */}
        <div className="flex items-center gap-4 mb-8 flex-wrap">
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            className="border rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={handleExcel} disabled={!data}
            className="bg-green-600 text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
            📥 엑셀 다운로드
          </button>
        </div>

        {/* 요약 카드 */}
        {data && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`bg-white rounded-xl p-4 text-center border-2 transition
                  ${activeTab === tab.key ? 'border-blue-500 shadow-md' : 'border-transparent shadow-sm hover:border-gray-200'}`}>
                <p className="text-2xl mb-1">{tab.emoji}</p>
                <p className={`text-2xl font-bold ${tab.color}`}>{tab.count}</p>
                <p className="text-xs text-gray-500 mt-0.5">{tab.label}</p>
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <p className="text-center text-gray-400 py-20">불러오는 중...</p>
        ) : !data ? null : (
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="px-5 py-4 border-b bg-gray-50">
              <h3 className="font-bold text-gray-800">
                {tabs.find(t => t.key === activeTab)?.emoji} {tabs.find(t => t.key === activeTab)?.label} 목록
              </h3>
            </div>

            {/* 결석 목록 */}
            {activeTab === 'absent' && (
              data.absent.length === 0 ? <p className="text-center text-gray-400 py-12">결석 기록이 없습니다</p> :
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>{['학생명', '학년', '반', '담당 선생님', '결석일'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y">
                  {data.absent.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{r.students?.name}</td>
                      <td className="px-4 py-3 text-gray-500">{r.students?.grade}</td>
                      <td className="px-4 py-3">{r.classes?.name}</td>
                      <td className="px-4 py-3 text-gray-500">{r.classes?.teachers?.name}</td>
                      <td className="px-4 py-3 text-red-600 font-medium">{r.attendance_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 보충 예정 */}
            {activeTab === 'makeupPending' && (
              data.makeupPending.length === 0 ? <p className="text-center text-gray-400 py-12">보충 예정이 없습니다</p> :
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>{['학생명', '학년', '반', '담당 선생님', '보충 예정일', '시간'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y">
                  {data.makeupPending.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{r.students?.name}</td>
                      <td className="px-4 py-3 text-gray-500">{r.students?.grade}</td>
                      <td className="px-4 py-3">{r.classes?.name}</td>
                      <td className="px-4 py-3 text-gray-500">{r.classes?.teachers?.name}</td>
                      <td className="px-4 py-3 text-blue-600 font-medium">{r.scheduled_date ?? '-'}</td>
                      <td className="px-4 py-3">{r.scheduled_time?.slice(0, 5) ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 보충 미완료 */}
            {activeTab === 'makeupMissed' && (
              data.makeupMissed.length === 0 ? <p className="text-center text-gray-400 py-12">보충 미완료가 없습니다</p> :
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>{['학생명', '학년', '반', '담당 선생님', '예정일'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y">
                  {data.makeupMissed.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{r.students?.name}</td>
                      <td className="px-4 py-3 text-gray-500">{r.students?.grade}</td>
                      <td className="px-4 py-3">{r.classes?.name}</td>
                      <td className="px-4 py-3 text-gray-500">{r.classes?.teachers?.name}</td>
                      <td className="px-4 py-3 text-orange-600 font-medium">{r.scheduled_date ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 잦은 지각 */}
            {activeTab === 'frequentLate' && (
              data.frequentLate.length === 0 ? <p className="text-center text-gray-400 py-12">잦은 지각 학생이 없습니다</p> :
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>{['학생명', '학년', '지각 횟수', '수강 반'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y">
                  {data.frequentLate.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{r.name}</td>
                      <td className="px-4 py-3 text-gray-500">{r.grade}</td>
                      <td className="px-4 py-3"><span className="bg-yellow-100 text-yellow-700 font-bold px-2 py-0.5 rounded-full">{r.count}회</span></td>
                      <td className="px-4 py-3 text-gray-500">{r.classes.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 장기 미등원 */}
            {activeTab === 'longAbsent' && (
              data.longAbsent.length === 0 ? <p className="text-center text-gray-400 py-12">장기 미등원 학생이 없습니다</p> :
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>{['학생명', '학년', '반', '담당 선생님'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y">
                  {data.longAbsent.map((r, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{r.name}</td>
                      <td className="px-4 py-3 text-gray-500">{r.grade}</td>
                      <td className="px-4 py-3">{r.class_name}</td>
                      <td className="px-4 py-3 text-gray-500">{r.teacher}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
