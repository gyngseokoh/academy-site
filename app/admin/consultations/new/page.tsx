'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatKST } from '@/lib/kst';

export default function NewConsultationsPage() {
  const router = useRouter();
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'전체' | '대기' | '승인' | '거절'>('전체');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [memos, setMemos] = useState<Record<string, string>>({});
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
    setMyRole(localStorage.getItem('sb_role') || 'director');
    setMyTeacherId(localStorage.getItem('sb_teacher_id') || '');
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    const res = await fetch('/api/admin/new-consultations');
    const data = await res.json();
    const list = Array.isArray(data) ? data : [];
    setConsultations(list);
    const m: Record<string, string> = {};
    list.forEach((c: any) => { m[c.id] = c.memo || ''; });
    setMemos(m);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string, reservedAt: string) => {
    await fetch('/api/admin/new-consultations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, reserved_at: reservedAt }),
    });
    fetchConsultations();
  };

  const deleteConsultation = async (id: string) => {
    if (!confirm('이 상담 기록을 삭제할까요?')) return;
    await fetch(`/api/admin/new-consultations?id=${id}`, { method: 'DELETE' });
    fetchConsultations();
  };

  const saveMemo = async (id: string) => {
    await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/new_student_consultations?id=eq.${id}`,
      {
        method: 'PATCH',
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memo: memos[id] }),
      },
    );
  };

  const statusBadge = (status: string) => {
    if (status === '승인') return 'bg-green-100 text-green-700';
    if (status === '거절') return 'bg-red-100 text-red-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  const roleBadge = (role: string | null) => {
    if (role === 'director') return 'text-purple-600';
    if (role === 'vice_director') return 'text-blue-600';
    return 'text-gray-500';
  };

  const roleLabel = (role: string | null) => {
    if (role === 'director') return '원장';
    if (role === 'vice_director') return '부원장';
    return '';
  };

  // role별 필터: 원장은 전체, 부원장은 본인것만
  const roleFiltered = consultations.filter((c) => {
    if (myRole === 'director') return true;
    if (myRole === 'vice_director') return c.teacher_id === myTeacherId;
    return true;
  });

  const filtered = roleFiltered.filter(
    (c) => filter === '전체' || (c.status || '대기') === filter,
  );

  const counts = {
    전체: roleFiltered.length,
    대기: roleFiltered.filter((c) => !c.status || c.status === '대기').length,
    승인: roleFiltered.filter((c) => c.status === '승인').length,
    거절: roleFiltered.filter((c) => c.status === '거절').length,
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">📋 신규생 상담 관리</h1>
        <a href="/admin" className="text-sm hover:underline">← 관리자 홈</a>
      </nav>

      <div className="max-w-5xl mx-auto py-8 px-6">
        {/* 부원장: 본인 상담만 보임 안내 */}
        {myRole === 'vice_director' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 mb-4 text-sm text-blue-700">
            본인이 담당한 신규생 상담만 표시됩니다.
          </div>
        )}

        {/* 필터 탭 */}
        <div className="flex gap-2 mb-6">
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
              <div className="col-span-2">담당자</div>
              <div className="col-span-2">예약시간</div>
              <div className="col-span-3">액션</div>
            </div>

            {filtered.map((c) => {
              const isExpanded = expandedId === c.id;
              const safeStatus = c.status || '대기';
              const handler = c.teachers;
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
                    <div className="col-span-2 text-sm">
                      {handler ? (
                        <span className={`font-medium ${roleBadge(handler.role)}`}>
                          {handler.name}
                          <span className="ml-1 text-xs font-normal opacity-70">
                            ({roleLabel(handler.role)})
                          </span>
                        </span>
                      ) : (
                        <span className="text-gray-300">미지정</span>
                      )}
                    </div>
                    <div className="col-span-2 text-blue-600 text-sm font-medium">
                      {c.reserved_at ? formatKST(c.reserved_at) : '-'}
                    </div>
                    <div className="col-span-3 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                      {safeStatus === '대기' ? (
                        <>
                          <button
                            onClick={() => updateStatus(c.id, '승인', c.reserved_at)}
                            className="flex-1 bg-green-500 text-white py-1.5 rounded-lg text-xs font-bold hover:bg-green-600"
                          >
                            ✅ 승인
                          </button>
                          <button
                            onClick={() => updateStatus(c.id, '거절', c.reserved_at)}
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
                      <button className="text-gray-400 hover:text-gray-600 text-xs px-1">
                        {isExpanded ? '▲' : '▼'}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 bg-gray-50 border-t">
                      {/* 신청 정보 */}
                      {(c.school || c.grade || c.subject || c.consultation_type) && (
                        <div className="mt-3 mb-3 flex flex-wrap gap-2">
                          {c.school && <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full">🏫 {c.school}</span>}
                          {c.grade && <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">📚 {c.grade}</span>}
                          {c.subject && <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full">📖 {c.subject}</span>}
                          {c.consultation_type && <span className="bg-yellow-50 text-yellow-700 text-xs px-2 py-1 rounded-full">💬 {c.consultation_type}</span>}
                        </div>
                      )}
                      {c.content && (
                        <div className="mt-3 mb-3">
                          <p className="text-xs font-bold text-gray-500 mb-1">상담 내용</p>
                          <p className="text-sm text-gray-700 bg-white rounded-lg p-3 border">{c.content}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-gray-500 mb-1">메모</p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={memos[c.id] || ''}
                            onChange={(e) => setMemos({ ...memos, [c.id]: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && saveMemo(c.id)}
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="메모 입력 후 저장"
                          />
                          <button
                            onClick={() => saveMemo(c.id)}
                            className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-800"
                          >
                            저장
                          </button>
                        </div>
                      </div>
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
