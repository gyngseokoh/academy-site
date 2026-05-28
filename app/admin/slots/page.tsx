'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toKST, formatKST, slotMatchesKST } from '@/lib/kst';

export default function SlotsPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [existingSlots, setExistingSlots] = useState<any[]>([]);
  const [approvedTimes, setApprovedTimes] = useState<string[]>([]); // 승인된 예약의 slot_time 목록
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
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
    const teacherId = localStorage.getItem('sb_teacher_id') || '';
    setMyRole(role);
    setMyTeacherId(teacherId);
    fetchAll(role, teacherId);
  }, []);

  const fetchAll = async (role?: string, teacherId?: string) => {
    const r = role ?? myRole;
    const t = teacherId ?? myTeacherId;
    await Promise.all([fetchSlots(r, t), fetchApprovedConsultations(r, t)]);
  };

  const fetchSlots = async (role: string, teacherId: string) => {
    // 부원장이면 본인 teacher_id 슬롯만 조회
    const filter = role === 'vice_director' && teacherId
      ? `&teacher_id=eq.${teacherId}`
      : '';
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/director_slots?select=*&order=slot_time${filter}`,
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

  // 승인된 예약의 reserved_at 목록 가져오기 (이 시간은 슬롯 삭제 불가)
  const fetchApprovedConsultations = async (role: string, teacherId: string) => {
    // 부원장이면 본인 teacher_id 상담만 조회
    const filter = role === 'vice_director' && teacherId
      ? `&teacher_id=eq.${teacherId}`
      : '';
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/new_student_consultations?status=eq.승인&select=reserved_at${filter}`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${token}`,
        },
      },
    );
    const data = await res.json();
    setApprovedTimes(
      Array.isArray(data) ? data.map((c: any) => c.reserved_at) : [],
    );
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

  const toggleSlot = (time: string) => {
    setSlots((prev) =>
      prev.includes(time) ? prev.filter((t) => t !== time) : [...prev, time],
    );
  };

  // 현재 KST 날짜/시간
  const getNowKST = () => {
    const now = new Date();
    const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    return {
      date: kst.toISOString().slice(0, 10),
      time: kst.toISOString().slice(11, 16),
    };
  };

  // 해당 시간이 지난 시간인지 (오늘 날짜 선택 시 현재 시각 이전은 비활성)
  const isPastTime = (dateStr: string, time: string) => {
    const nowKST = getNowKST();
    if (dateStr < nowKST.date) return true;
    if (dateStr === nowKST.date && time <= nowKST.time) return true;
    return false;
  };

  const handleSave = async () => {
    if (!selectedDate || slots.length === 0)
      return alert('날짜와 시간을 선택해주세요.');
    setLoading(true);

    const myTeacherId =
      typeof window !== 'undefined'
        ? localStorage.getItem('sb_teacher_id') || null
        : null;

    const inserts = slots.map((time) => ({
      slot_time: new Date(`${selectedDate}T${time}:00+09:00`).toISOString(),
      is_available: true,
      teacher_id: myTeacherId,
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
      setSlots([]);
      await fetchSlots(myRole, myTeacherId); // 저장 후 즉시 목록 갱신 → ✓ 표시
    } else {
      alert('저장 실패. 이미 등록된 시간이 있을 수 있어요.');
    }
    setLoading(false);
  };

  const handleDelete = async (slot: any) => {
    // 승인된 예약이 있으면 삭제 불가
    if (approvedTimes.includes(slot.slot_time)) {
      alert('승인된 예약이 있는 시간은 삭제할 수 없어요.');
      return;
    }
    if (!confirm('이 시간을 삭제할까요?')) return;
    await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/director_slots?id=eq.${slot.id}`,
      {
        method: 'DELETE',
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${token}`,
        },
      },
    );
    await fetchSlots(myRole, myTeacherId);
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
    existingSlots.some((s) => toKST(s.slot_time).date === dateStr);

  // UTC 직접 비교 → Supabase 반환 형식에 무관하게 정확
  const isAlreadySaved = (dateStr: string, time: string) =>
    existingSlots.some((s) => slotMatchesKST(s.slot_time, dateStr, time));

  // 슬롯 삭제 가능 여부
  const canDelete = (slot: any) => !approvedTimes.includes(slot.slot_time);

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">🗓️ 신규생 상담 시간 설정</h1>
        <a href="/admin" className="text-sm hover:underline">
          ← 관리자 홈
        </a>
      </nav>

      <div className="max-w-4xl mx-auto py-10 px-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 달력 */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => setCurrentMonth(new Date(year, month - 1))}
              className="text-gray-500 hover:text-blue-700 text-xl"
            >
              ‹
            </button>
            <h2 className="font-bold text-gray-800">
              {year}년 {month + 1}월
            </h2>
            <button
              onClick={() => setCurrentMonth(new Date(year, month + 1))}
              className="text-gray-500 hover:text-blue-700 text-xl"
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
                const hasExisting = hasSlot(dateStr);

                return (
                  <button
                    key={d}
                    disabled={isPast}
                    onClick={() => {
                      setSelectedDate(dateStr);
                      setSlots([]);
                    }}
                    className={`py-2 rounded-lg text-sm font-medium transition
                    ${isPast ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-blue-50'}
                    ${isSelected ? 'bg-blue-700 text-white' : ''}
                    ${hasExisting && !isSelected ? 'text-blue-600 font-bold' : ''}
                  `}
                  >
                    {d}
                    {hasExisting && (
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
                  const alreadySaved = isAlreadySaved(selectedDate, time);
                  const pastTime = isPastTime(selectedDate, time);
                  const isSelected = slots.includes(time);
                  const disabled = alreadySaved || pastTime;

                  return (
                    <button
                      key={time}
                      disabled={disabled}
                      onClick={() => toggleSlot(time)}
                      className={`py-2 rounded-lg text-xs font-medium border transition
                        ${alreadySaved ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' : ''}
                        ${pastTime && !alreadySaved ? 'bg-gray-50 text-gray-300 cursor-not-allowed border-gray-100' : ''}
                        ${isSelected ? 'bg-blue-700 text-white border-blue-700' : ''}
                        ${!disabled && !isSelected ? 'border-gray-200 hover:border-blue-400' : ''}
                      `}
                    >
                      {alreadySaved ? '✓' : pastTime ? '—' : time}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleSave}
                disabled={loading || slots.length === 0}
                className="w-full bg-blue-700 text-white py-3 rounded-lg font-bold hover:bg-blue-800 disabled:opacity-50"
              >
                {loading ? '저장 중...' : slots.length === 0 ? '시간을 선택하세요' : `${slots.length}개 시간 저장`}
              </button>
            </>
          )}
        </div>
      </div>

      {/* 등록된 슬롯 목록 */}
      <div className="max-w-4xl mx-auto px-6 pb-10">
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-bold text-gray-800 mb-4">📋 등록된 상담 시간</h3>
          {existingSlots.length === 0 ? (
            <p className="text-gray-400 text-sm">등록된 시간이 없습니다.</p>
          ) : (
            <>
              <p className="text-xs text-gray-400 mb-3">
                🔒 승인된 예약이 있는 시간은 삭제 불가 · ✕ 는 삭제 가능
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {existingSlots.map((slot) => {
                  const deletable = canDelete(slot);
                  return (
                    <div
                      key={slot.id}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm
                        ${!slot.is_available ? 'bg-yellow-50' : deletable ? 'bg-blue-50' : 'bg-red-50'}`}
                    >
                      <span
                        className={
                          !slot.is_available
                            ? 'text-yellow-600 font-medium'
                            : deletable
                            ? 'text-blue-700 font-medium'
                            : 'text-red-600 font-medium'
                        }
                      >
                        {formatKST(slot.slot_time)}
                        {!slot.is_available && (
                          <span className="ml-1 text-xs">(신규생 예약됨)</span>
                        )}
                      </span>
                      {deletable ? (
                        <button
                          onClick={() => handleDelete(slot)}
                          className="text-red-400 hover:text-red-600 ml-2 text-base font-bold"
                          title="삭제"
                        >
                          ✕
                        </button>
                      ) : (
                        <span className="ml-2 text-red-400" title="승인된 예약 있음">
                          🔒
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
