'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toKST, formatKST, slotMatchesKST } from '@/lib/kst';

export default function TeacherAdminPage() {
  const router = useRouter();
  const [teacher, setTeacher] = useState<any>(null);
  const [teacherNotFound, setTeacherNotFound] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [existingSlots, setExistingSlots] = useState<any[]>([]);
  // 신규생 상담시간 (director_slots)
  const [directorSlots, setDirectorSlots] = useState<string[]>([]);
  const [existingDirectorSlots, setExistingDirectorSlots] = useState<any[]>([]);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [tab, setTab] = useState<'slots' | 'consultations'>('slots');
  // 상담 시간 탭 내 신규생/재원생 구분
  const [slotCategory, setSlotCategory] = useState<'teacher' | 'director'>('teacher');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'전체' | '대기' | '승인' | '거절'>('전체');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('sb_access_token')
      : '';

  const user = (() => {
    try {
      return typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('sb_user') || '{}')
        : {};
    } catch {
      return {};
    }
  })();

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchTeacher();
  }, []);

  const fetchTeacher = async () => {
    if (!user.id) {
      setTeacherNotFound(true);
      return;
    }
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/teachers?user_id=eq.${user.id}&select=*`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${token}`,
        },
      },
    );
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      setTeacher(data[0]);
      fetchSlots(data[0].id);
      fetchDirectorSlots(data[0].id);
      fetchConsultations(data[0].id);
    } else {
      setTeacherNotFound(true);
    }
  };

  const fetchSlots = async (teacherId: string) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/teacher_slots?teacher_id=eq.${teacherId}&order=slot_time`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Cache-Control': 'no-cache',
        },
      },
    );
    const data = await res.json();
    setExistingSlots(Array.isArray(data) ? data : []);
  };

  const fetchDirectorSlots = async (teacherId?: string) => {
    const id = teacherId ?? teacher?.id;
    if (!id) return;
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/director_slots?teacher_id=eq.${id}&order=slot_time`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          'Cache-Control': 'no-cache',
        },
      },
    );
    const data = await res.json();
    setExistingDirectorSlots(Array.isArray(data) ? data : []);
  };

  const fetchConsultations = async (teacherId: string) => {
    const res = await fetch(`/api/teacher-consultations?teacher_id=${teacherId}`);
    const data = await res.json();
    setConsultations(Array.isArray(data) ? data : []);
  };

  const generateTimeSlots = () => {
    const times = [];
    for (let h = 9; h < 22; h++) {
      for (let m = 0; m < 60; m += 15) {
        times.push(
          `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
        );
      }
    }
    return times;
  };

  const getNowKST = () => {
    const now = new Date();
    const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    return {
      date: kst.toISOString().slice(0, 10),
      time: kst.toISOString().slice(11, 16),
    };
  };

  const isPastTime = (dateStr: string, time: string) => {
    const nowKST = getNowKST();
    if (dateStr < nowKST.date) return true;
    if (dateStr === nowKST.date && time <= nowKST.time) return true;
    return false;
  };

  // 재원생 슬롯 저장 (teacher_slots)
  const handleSaveTeacherSlots = async () => {
    if (!selectedDate || slots.length === 0)
      return alert('날짜와 시간을 선택해주세요.');
    setLoading(true);
    const inserts = slots.map((time) => ({
      teacher_id: teacher.id,
      slot_time: new Date(`${selectedDate}T${time}:00+09:00`).toISOString(),
      is_available: true,
    }));
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/teacher_slots`,
      {
        method: 'POST',
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(inserts),
      },
    );
    if (res.ok) {
      alert('저장 완료!');
      setSlots([]);
      await fetchSlots(teacher.id);
    } else {
      alert('저장 실패. 이미 등록된 시간이 있을 수 있어요.');
    }
    setLoading(false);
  };

  const handleDeleteTeacherSlot = async (id: string) => {
    if (!confirm('삭제할까요?')) return;
    await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/teacher_slots?id=eq.${id}`,
      {
        method: 'DELETE',
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${token}`,
        },
      },
    );
    await fetchSlots(teacher.id);
  };

  // 신규생 슬롯 저장 (director_slots)
  const handleSaveDirectorSlots = async () => {
    if (!selectedDate || directorSlots.length === 0)
      return alert('날짜와 시간을 선택해주세요.');
    setLoading(true);
    const inserts = directorSlots.map((time) => ({
      slot_time: new Date(`${selectedDate}T${time}:00+09:00`).toISOString(),
      is_available: true,
      teacher_id: teacher.id,
    }));
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/director_slots`,
      {
        method: 'POST',
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify(inserts),
      },
    );
    if (res.ok) {
      alert('저장 완료!');
      setDirectorSlots([]);
      await fetchDirectorSlots(teacher.id);
    } else {
      alert('저장 실패. 이미 등록된 시간이 있을 수 있어요.');
    }
    setLoading(false);
  };

  const handleDeleteDirectorSlot = async (id: string) => {
    if (!confirm('삭제할까요?')) return;
    await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/director_slots?id=eq.${id}`,
      {
        method: 'DELETE',
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${token}`,
        },
      },
    );
    await fetchDirectorSlots(teacher.id);
  };

  const updateStatus = async (id: string, status: string, reservedAt: string) => {
    await fetch('/api/teacher-consultations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        status,
        reserved_at: reservedAt,
        teacher_id: teacher.id,
      }),
    });
    fetchConsultations(teacher.id);
  };

  const deleteConsultation = async (id: string) => {
    if (!confirm('이 상담 기록을 삭제할까요?')) return;
    await fetch(`/api/admin/current-consultations?id=${id}`, { method: 'DELETE' });
    fetchConsultations(teacher.id);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth, year, month };
  };

  const { firstDay, daysInMonth, year, month } = getDaysInMonth(currentMonth);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const formatDate = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const hasSlot = (dateStr: string) =>
    slotCategory === 'teacher'
      ? existingSlots.some((s) => toKST(s.slot_time).date === dateStr)
      : existingDirectorSlots.some((s) => toKST(s.slot_time).date === dateStr);

  const isAlreadySavedTeacher = (dateStr: string, time: string) =>
    existingSlots.some((s) => slotMatchesKST(s.slot_time, dateStr, time));

  const isAlreadySavedDirector = (dateStr: string, time: string) =>
    existingDirectorSlots.some((s) => slotMatchesKST(s.slot_time, dateStr, time));

  const statusBadge = (status: string) => {
    if (status === '승인') return 'bg-green-100 text-green-700';
    if (status === '거절') return 'bg-red-100 text-red-700';
    return 'bg-yellow-100 text-yellow-700';
  };

  const filteredConsultations = consultations.filter(
    (c) => filter === '전체' || (c.status || '대기') === filter,
  );

  const counts = {
    전체: consultations.length,
    대기: consultations.filter((c) => !c.status || c.status === '대기').length,
    승인: consultations.filter((c) => c.status === '승인').length,
    거절: consultations.filter((c) => c.status === '거절').length,
  };

  if (teacherNotFound) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">선생님 계정이 연결되지 않았습니다</h2>
          <p className="text-gray-500 mb-6">원장님께 계정 연결을 요청해주세요.</p>
          <button
            onClick={() => {
              localStorage.removeItem('sb_access_token');
              localStorage.removeItem('sb_user');
              localStorage.removeItem('sb_role');
              localStorage.removeItem('sb_teacher_id');
              router.push('/login');
            }}
            className="bg-blue-700 text-white px-6 py-2 rounded-full font-bold"
          >
            로그아웃
          </button>
        </div>
      </main>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">선생님 정보를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="text-xl font-bold">
            👩‍🏫 {teacher.name} 선생님 관리페이지
          </h1>
          <div className="flex gap-3 text-sm text-blue-200">
            <a href="/admin" className="hover:text-white hover:underline">관리자 홈</a>
            <a href="/admin/students" className="hover:text-white hover:underline">학생 관리</a>
            <a href="/admin/students/logs" className="hover:text-white hover:underline">학생 일지</a>
          </div>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem('sb_access_token');
            localStorage.removeItem('sb_user');
            localStorage.removeItem('sb_role');
            localStorage.removeItem('sb_teacher_id');
            router.push('/login');
          }}
          className="bg-white text-blue-700 px-4 py-1 rounded-full text-sm font-bold"
        >
          로그아웃
        </button>
      </nav>

      {/* 메인 탭 */}
      <div className="max-w-4xl mx-auto px-6 pt-8">
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setTab('slots')}
            className={`px-6 py-2 rounded-full font-bold text-sm transition ${tab === 'slots' ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 border'}`}
          >
            🗓️ 상담 시간 오픈
          </button>
          <button
            onClick={() => setTab('consultations')}
            className={`px-6 py-2 rounded-full font-bold text-sm transition ${tab === 'consultations' ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 border'}`}
          >
            📋 예약 관리 ({consultations.length})
          </button>
        </div>

        {/* 상담 시간 오픈 탭 */}
        {tab === 'slots' && (
          <div>
            {/* 신규생/재원생 서브탭 */}
            <div className="flex gap-2 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
              <button
                onClick={() => {
                  setSlotCategory('teacher');
                  setSelectedDate('');
                  setSlots([]);
                  setDirectorSlots([]);
                }}
                className={`px-5 py-1.5 rounded-lg text-sm font-bold transition ${slotCategory === 'teacher' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'}`}
              >
                재원생 상담시간
              </button>
              <button
                onClick={() => {
                  setSlotCategory('director');
                  setSelectedDate('');
                  setSlots([]);
                  setDirectorSlots([]);
                }}
                className={`px-5 py-1.5 rounded-lg text-sm font-bold transition ${slotCategory === 'director' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'}`}
              >
                신규생 상담시간
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 달력 */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={() => setCurrentMonth(new Date(year, month - 1))}
                    className="text-gray-400 hover:text-blue-700 text-xl"
                  >
                    ‹
                  </button>
                  <h2 className="font-bold text-gray-800">
                    {year}년 {month + 1}월
                  </h2>
                  <button
                    onClick={() => setCurrentMonth(new Date(year, month + 1))}
                    className="text-gray-400 hover:text-blue-700 text-xl"
                  >
                    ›
                  </button>
                </div>
                <div className="grid grid-cols-7 text-center text-xs text-gray-400 mb-2">
                  {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
                    <div key={d}>{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 text-center gap-y-1">
                  {Array(firstDay)
                    .fill(null)
                    .map((_, i) => (
                      <div key={i} />
                    ))}
                  {Array(daysInMonth)
                    .fill(null)
                    .map((_, i) => {
                      const d = i + 1;
                      const dateStr = formatDate(year, month, d);
                      const isPast = new Date(dateStr) < today;
                      const isSelected = selectedDate === dateStr;
                      return (
                        <button
                          key={d}
                          disabled={isPast}
                          onClick={() => {
                            setSelectedDate(dateStr);
                            setSlots([]);
                            setDirectorSlots([]);
                          }}
                          className={`py-2 rounded-lg text-sm font-medium transition
                          ${isPast ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-blue-50'}
                          ${isSelected ? 'bg-blue-700 text-white' : ''}
                          ${hasSlot(dateStr) && !isSelected ? 'text-blue-600 font-bold' : ''}
                        `}
                        >
                          {d}
                          {hasSlot(dateStr) && (
                            <div className="w-1 h-1 bg-blue-400 rounded-full mx-auto mt-0.5" />
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* 시간 선택 */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-bold text-gray-800 mb-4">
                  {selectedDate
                    ? `${selectedDate} 시간 선택`
                    : '날짜를 먼저 선택하세요'}
                </h3>
                {selectedDate && (
                  <>
                    <div className="grid grid-cols-4 gap-2 max-h-72 overflow-y-auto mb-4">
                      {generateTimeSlots().map((time) => {
                        const alreadyExists =
                          slotCategory === 'teacher'
                            ? isAlreadySavedTeacher(selectedDate, time)
                            : isAlreadySavedDirector(selectedDate, time);
                        const pastTime = isPastTime(selectedDate, time);
                        const isSelected =
                          slotCategory === 'teacher'
                            ? slots.includes(time)
                            : directorSlots.includes(time);
                        const disabled = alreadyExists || pastTime;
                        return (
                          <button
                            key={time}
                            disabled={disabled}
                            onClick={() => {
                              if (slotCategory === 'teacher') {
                                setSlots((prev) =>
                                  prev.includes(time)
                                    ? prev.filter((t) => t !== time)
                                    : [...prev, time],
                                );
                              } else {
                                setDirectorSlots((prev) =>
                                  prev.includes(time)
                                    ? prev.filter((t) => t !== time)
                                    : [...prev, time],
                                );
                              }
                            }}
                            className={`py-2 rounded-lg text-xs font-medium border transition
                              ${alreadyExists ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' : ''}
                              ${pastTime && !alreadyExists ? 'bg-gray-50 text-gray-300 cursor-not-allowed border-gray-100' : ''}
                              ${isSelected ? 'bg-blue-700 text-white border-blue-700' : ''}
                              ${!disabled && !isSelected ? 'border-gray-200 hover:border-blue-400' : ''}
                            `}
                          >
                            {alreadyExists ? '✓' : pastTime ? '—' : time}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={
                        slotCategory === 'teacher'
                          ? handleSaveTeacherSlots
                          : handleSaveDirectorSlots
                      }
                      disabled={
                        loading ||
                        (slotCategory === 'teacher'
                          ? slots.length === 0
                          : directorSlots.length === 0)
                      }
                      className="w-full bg-blue-700 text-white py-3 rounded-lg font-bold hover:bg-blue-800 disabled:opacity-50"
                    >
                      {loading
                        ? '저장 중...'
                        : (slotCategory === 'teacher' ? slots.length : directorSlots.length) === 0
                        ? '시간을 선택하세요'
                        : `${slotCategory === 'teacher' ? slots.length : directorSlots.length}개 시간 저장`}
                    </button>
                  </>
                )}
              </div>

              {/* 등록된 슬롯 목록 */}
              <div className="md:col-span-2 bg-white rounded-2xl shadow-sm p-6">
                <h3 className="font-bold text-gray-800 mb-4">
                  📋 등록된 {slotCategory === 'teacher' ? '재원생' : '신규생'} 상담 시간
                </h3>
                {(slotCategory === 'teacher' ? existingSlots : existingDirectorSlots).length === 0 ? (
                  <p className="text-gray-400 text-sm">등록된 시간이 없습니다.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {(slotCategory === 'teacher' ? existingSlots : existingDirectorSlots).map((slot) => (
                      <div
                        key={slot.id}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm
                          ${!slot.is_available ? 'bg-yellow-50' : 'bg-blue-50'}`}
                      >
                        <span className={!slot.is_available ? 'text-yellow-600 font-medium' : 'text-blue-700 font-medium'}>
                          {formatKST(slot.slot_time)}
                          {!slot.is_available && (
                            <span className="ml-1 text-xs">
                              ({slotCategory === 'teacher' ? '재원생' : '신규생'} 예약됨)
                            </span>
                          )}
                        </span>
                        {slot.is_available && (
                          <button
                            onClick={() =>
                              slotCategory === 'teacher'
                                ? handleDeleteTeacherSlot(slot.id)
                                : handleDeleteDirectorSlot(slot.id)
                            }
                            className="text-red-400 hover:text-red-600 ml-2"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 예약 관리 탭 */}
        {tab === 'consultations' && (
          <div>
            <div className="flex gap-2 mb-4">
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

            {filteredConsultations.length === 0 ? (
              <p className="text-center text-gray-400 py-20">예약된 상담이 없습니다.</p>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 border-b text-xs font-bold text-gray-500 uppercase">
                  <div className="col-span-1">상태</div>
                  <div className="col-span-2">이름</div>
                  <div className="col-span-2">연락처</div>
                  <div className="col-span-3">예약시간</div>
                  <div className="col-span-4">액션</div>
                </div>
                {filteredConsultations.map((c) => {
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
                        <div className="col-span-3 text-blue-600 text-sm font-medium">
                          {c.reserved_at ? formatKST(c.reserved_at) : '-'}
                        </div>
                        <div className="col-span-4 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {(c.status || '대기') === '대기' ? (
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
        )}
      </div>
    </main>
  );
}
