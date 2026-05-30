'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatKST } from '@/lib/kst';

export default function CurrentConsultationsAdminPage() {
  const router = useRouter();
  const [consultations, setConsultations] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'전체' | '대기' | '승인' | '거절'>('전체');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState('');
  const [myTeacherId, setMyTeacherId] = useState('');

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('sb_access_token')
      : '';

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    const role = localStorage.getItem('sb_role') || 'director';
    const tid = localStorage.getItem('sb_teacher_id') || '';
    setMyRole(role);
    setMyTeacherId(tid);
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const [consultRes, teacherRes] = await Promise.all([
      fetch('/api/admin/current-consultations'),
      fetch('/api/admin/teachers'),
    ]);
    const consultData = await consultRes.json();
    const teacherData = await teacherRes.json();
    setConsultations(Array.isArray(consultData) ? consultData : []);
    setTeachers(Array.isArray(teacherData) ? teacherData : []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string, reservedAt: string, teacherId: string) => {
    await fetch('/api/teacher-consultations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, reserved_at: reservedAt, teacher_id: teacherId }),
    });
    fetchAll();
  };

  const deleteConsultation = async (id: string) => {
    if (!confirm('이 상담 기록을 삭제할까요?')) return;
    await fetch(`/api/admin/current-consultations?id=${id}`, { method: 'DELETE' });
    fetchAll();
  };

  const statusBadge = (status: string) => {
    if (status === '승인') return 'bg-green-100 text-green-700';
    if (status === '거절') return 'bg-red-100 text-red-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  const getTeacherName = (c: any) =>
    c.teachers?.name || teachers.find((t) => t.id === c.teacher_id)?.name || '미배정';

  // 역할별 기본 필터: 선생님은 본인 것만
  const roleFiltered = consultations.filter((c) => {
    if (myRole === 'teacher') return c.teacher_id === myTeacherId;
    return true;
  });

  const counts = {
    전체: roleFiltered.length,
    대기: roleFiltered.filter((c) => !c.status || c.status === '대기').length,
    승인: roleFiltered.filter((c) => c.status === '승인').length,
    거절: roleFiltered.filter((c) => c.status === '거절').length,
  };

  const filtered = roleFiltered.filter((c) => {
    const matchStatus = filter === '전체' || (c.status || '대기') === filter;
    const matchTeacher = !filterTeacher || c.teacher_id === filterTeacher;
    return matchStatus && matchTeacher;
  });

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">💬 재원생 상담 관리</h1>
        <a href="/admin" className="text-sm hover:underline">← 관리자 홈</a>
      </nav>

      <div className="max-w-5xl mx-auto py-8 px-6">
        {/* 선생님 안내 */}
        {myRole === 'teacher' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 mb-4 text-sm text-blue-700">
            본인이 담당한 재원생 상담만 표시됩니다.
          </div>
        )}

        {/* 필터 */}
        <div className="flex flex-wrap gap-2 items-center mb-6">
          {(['전체', '대기', '승인', '거절'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition
                ${filter === f ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 border hover:border-blue-400'}`}
            >
              {f} ({counts[f]})
            </button>
          ))}
          <select
            value={filterTeacher}
            onChange={(e) => setFilterTeacher(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm ml-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체 선생님</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-center text-gray-400 py-20">불러오는 중...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-20">신청된 상담이 없습니다.</p>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* 헤더 */}
            <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 border-b text-xs font-bold text-gray-500">
              <div className="col-span-1">상태</div>
              <div className="col-span-2">이름</div>
              <div className="col-span-2">연락처</div>
              <div className="col-span-2">선생님</div>
              <div className="col-span-2">예약시간</div>
              <div className="col-span-3">액션</div>
            </div>

            {filtered.map((c) => {
              const isExpanded = expandedId === c.id;
              const safeStatus = c.status || '대기';
              return (
                <div key={c.id} className="border-b last:border-b-0">
                  <div
                    className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-gray-50 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : c.id)}
                  >
                    <div className="col-span-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusBadge(safeStatus)}`}>
                        {safeStatus}
                      </span>
                    </div>
                    <div className="col-span-2 font-medium text-gray-800 text-sm">{c.applicant_name}</div>
                    <div className="col-span-2 text-gray-500 text-sm">{c.phone}</div>
                    <div className="col-span-2 text-blue-600 text-sm">{getTeacherName(c)}</div>
                    <div className="col-span-2 text-gray-700 text-sm font-medium">
                      {c.reserved_at ? formatKST(c.reserved_at) : '-'}
                    </div>
                    <div className="col-span-3 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {safeStatus === '대기' ? (
                        <>
                          <button
                            onClick={() => updateStatus(c.id, '승인', c.reserved_at, c.teacher_id)}
                            className="flex-1 bg-green-500 text-white py-1.5 rounded-lg text-xs font-bold hover:bg-green-600"
                          >
                            ✅ 승인
                          </button>
                          <button
                            onClick={() => updateStatus(c.id, '거절', c.reserved_at, c.teacher_id)}
                            className="flex-1 bg-red-500 text-white py-1.5 rounded-lg text-xs font-bold hover:bg-red-600"
                          >
                            ❌ 거절
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => deleteConsultation(c.id)}
                          className="flex-1 border border-gray-200 text-gray-400 py-1.5 rounded-lg text-xs hover:bg-red-50 hover:text-red-500 hover:border-red-200"
                        >
                          🗑 삭제
                        </button>
                      )}
                      <button className="text-gray-400 text-xs px-1">
                        {isExpanded ? '▲' : '▼'}
                      </button>
                    </div>
                  </div>

                  {isExpanded && c.content && (
                    <div className="px-4 pb-4 bg-gray-50 border-t">
                      <p className="text-xs font-bold text-gray-500 mt-3 mb-1">상담 내용</p>
                      <p className="text-sm text-gray-700 bg-white rounded-lg p-3 border">{c.content}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
