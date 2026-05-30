'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Enrollment = {
  id: string;
  student_id: string;
  class_id: string;
  monthly_sessions: number;
  remaining_sessions: number;
  monthly_fee: number;
  students: { id: string; name: string; grade: string; phone: string } | null;
  classes: { id: string; name: string; subject: string; teacher_id: string; teachers: { id: string; name: string } | null } | null;
  payment: { id: string; status: string; amount: number; paid_at: string | null } | null;
};

const PAY_STATUS: Record<string, { label: string; cls: string }> = {
  납부: { label: '납부', cls: 'bg-green-100 text-green-700' },
  미납: { label: '미납', cls: 'bg-red-100 text-red-700' },
  면제: { label: '면제', cls: 'bg-gray-100 text-gray-500' },
};

function getMonthStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function SessionsPage() {
  const router = useRouter();
  const [month, setMonth] = useState(getMonthStr());
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState('');
  const [myTeacherId, setMyTeacherId] = useState('');
  const [filterTeacherId, setFilterTeacherId] = useState('');
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState('');

  // 인라인 편집
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ monthly_sessions: '', remaining_sessions: '', monthly_fee: '' });
  const [payModal, setPayModal] = useState<Enrollment | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payStatus, setPayStatus] = useState<'납부' | '미납' | '면제'>('납부');

  useEffect(() => {
    const token = localStorage.getItem('sb_access_token');
    if (!token) { router.push('/login'); return; }
    const role = localStorage.getItem('sb_role') || 'director';
    const tid = localStorage.getItem('sb_teacher_id') || '';
    setMyRole(role);
    setMyTeacherId(tid);
    if (role === 'teacher' || role === 'vice_director') setFilterTeacherId(tid);
    fetchTeachers();
  }, []);

  useEffect(() => { fetchSessions(); }, [month, filterTeacherId]);

  const fetchTeachers = async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/teachers?select=id,name&order=sort_order.asc`,
      { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! } },
    );
    setTeachers(await res.json());
  };

  const fetchSessions = async () => {
    setLoading(true);
    const params = new URLSearchParams({ month });
    if (filterTeacherId) params.set('teacher_id', filterTeacherId);
    const res = await fetch(`/api/admin/sessions?${params}`);
    const data = await res.json();
    setEnrollments(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const handleEdit = (e: Enrollment) => {
    setEditId(e.id);
    setEditForm({
      monthly_sessions: String(e.monthly_sessions),
      remaining_sessions: String(e.remaining_sessions),
      monthly_fee: String(e.monthly_fee ?? 0),
    });
  };

  const handleSaveEdit = async (id: string) => {
    await fetch('/api/admin/sessions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        monthly_sessions: parseInt(editForm.monthly_sessions),
        remaining_sessions: parseInt(editForm.remaining_sessions),
        monthly_fee: parseInt(editForm.monthly_fee),
      }),
    });
    setEditId(null);
    fetchSessions();
  };

  const handlePayment = async () => {
    if (!payModal) return;
    await fetch('/api/admin/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        class_enrollment_id: payModal.id,
        student_id: payModal.student_id,
        month,
        amount: parseInt(payAmount) || payModal.monthly_fee,
        status: payStatus,
      }),
    });
    setPayModal(null);
    fetchSessions();
  };

  // 월 수강료 일괄 생성 (미납으로)
  const handleBulkCreate = async () => {
    if (!confirm(`${month} 수강료 미납 기록을 일괄 생성할까요?\n(이미 있는 학생은 건너뜁니다)`)) return;
    for (const e of enrollments) {
      if (!e.payment) {
        await fetch('/api/admin/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            class_enrollment_id: e.id,
            student_id: e.student_id,
            month,
            amount: e.monthly_fee ?? 0,
            status: '미납',
          }),
        });
      }
    }
    fetchSessions();
  };

  const filtered = enrollments.filter(e =>
    !search || e.students?.name.includes(search),
  );

  const summary = {
    total: enrollments.length,
    납부: enrollments.filter(e => e.payment?.status === '납부').length,
    미납: enrollments.filter(e => e.payment?.status === '미납').length,
    미생성: enrollments.filter(e => !e.payment).length,
    예상수입: enrollments.reduce((sum, e) => sum + (e.monthly_fee ?? 0), 0),
    납부금액: enrollments.filter(e => e.payment?.status === '납부').reduce((sum, e) => sum + (e.payment?.amount ?? 0), 0),
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">💰 수강료 · 회차 관리</h1>
        <a href="/admin" className="text-sm hover:underline">← 관리자 홈</a>
      </nav>

      <div className="max-w-5xl mx-auto py-8 px-6">
        {/* 필터 */}
        <div className="flex gap-3 mb-6 flex-wrap items-center">
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <input type="text" placeholder="학생 검색" value={search} onChange={e => setSearch(e.target.value)}
            className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-36" />
          {myRole === 'director' && (
            <select value={filterTeacherId} onChange={e => setFilterTeacherId(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">전체 선생님</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name} 선생님</option>)}
            </select>
          )}
          <button onClick={handleBulkCreate}
            className="ml-auto bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-gray-800">
            미납 일괄 생성
          </button>
        </div>

        {/* 요약 */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          {[
            { label: '전체', value: summary.total, cls: 'bg-gray-100 text-gray-700' },
            { label: '납부', value: summary.납부, cls: 'bg-green-100 text-green-700' },
            { label: '미납', value: summary.미납, cls: 'bg-red-100 text-red-700' },
            { label: '미생성', value: summary.미생성, cls: 'bg-yellow-100 text-yellow-700' },
            { label: '예상수입', value: `${summary.예상수입.toLocaleString()}원`, cls: 'bg-blue-50 text-blue-700' },
            { label: '납부액', value: `${summary.납부금액.toLocaleString()}원`, cls: 'bg-green-50 text-green-700' },
          ].map(item => (
            <div key={item.label} className={`rounded-xl p-3 text-center ${item.cls}`}>
              <p className="text-lg font-bold">{item.value}</p>
              <p className="text-xs mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>

        {/* 목록 */}
        {loading ? (
          <p className="text-center text-gray-400 py-20">불러오는 중...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-20">등록된 수강 학생이 없습니다</p>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['학생', '반', '담당', '회차', '수강료', '납부 상태', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{e.students?.name}</p>
                      {e.students?.grade && <p className="text-xs text-gray-400">{e.students.grade}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{e.classes?.name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{e.classes?.teachers?.name}</td>
                    <td className="px-4 py-3">
                      {editId === e.id ? (
                        <div className="flex gap-1 items-center">
                          <input type="number" value={editForm.remaining_sessions}
                            onChange={x => setEditForm(f => ({ ...f, remaining_sessions: x.target.value }))}
                            className="w-12 border rounded px-1 py-0.5 text-xs text-center" />
                          <span className="text-gray-400">/</span>
                          <input type="number" value={editForm.monthly_sessions}
                            onChange={x => setEditForm(f => ({ ...f, monthly_sessions: x.target.value }))}
                            className="w-12 border rounded px-1 py-0.5 text-xs text-center" />
                        </div>
                      ) : (
                        <span className={`font-medium ${e.remaining_sessions <= 2 ? 'text-red-500' : 'text-gray-700'}`}>
                          {e.remaining_sessions}/{e.monthly_sessions}회
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editId === e.id ? (
                        <input type="number" value={editForm.monthly_fee}
                          onChange={x => setEditForm(f => ({ ...f, monthly_fee: x.target.value }))}
                          className="w-24 border rounded px-2 py-0.5 text-xs" />
                      ) : (
                        <span className="text-gray-700">{(e.monthly_fee ?? 0).toLocaleString()}원</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {e.payment ? (
                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${PAY_STATUS[e.payment.status]?.cls}`}>
                          {e.payment.status}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        {editId === e.id ? (
                          <>
                            <button onClick={() => handleSaveEdit(e.id)}
                              className="bg-blue-700 text-white px-2 py-1 rounded text-xs font-bold">저장</button>
                            <button onClick={() => setEditId(null)}
                              className="border px-2 py-1 rounded text-xs text-gray-500">취소</button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleEdit(e)}
                              className="border px-2 py-1 rounded text-xs text-gray-600 hover:bg-gray-50">수정</button>
                            <button onClick={() => {
                              setPayModal(e);
                              setPayAmount(String(e.monthly_fee ?? 0));
                              setPayStatus(e.payment?.status === '납부' ? '미납' : '납부');
                            }}
                              className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold hover:bg-green-700">
                              납부
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 납부 처리 모달 */}
      {payModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
            <h3 className="font-bold text-gray-800 text-lg mb-1">납부 처리</h3>
            <p className="text-gray-500 text-sm mb-5">
              <span className="font-medium text-gray-800">{payModal.students?.name}</span> · {payModal.classes?.name} · {month}
            </p>
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">납부 금액</label>
                <input type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">납부 상태</label>
                <div className="flex gap-2">
                  {(['납부', '미납', '면제'] as const).map(s => (
                    <button key={s} onClick={() => setPayStatus(s)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold border transition
                        ${payStatus === s ? 'bg-blue-700 text-white border-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handlePayment}
                className="flex-1 bg-blue-700 text-white py-3 rounded-lg font-bold hover:bg-blue-800">
                저장
              </button>
              <button onClick={() => setPayModal(null)}
                className="flex-1 border py-3 rounded-lg text-gray-600">
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
