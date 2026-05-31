'use client';

import { useEffect, useState } from 'react';
import { toKST, slotMatchesKST } from '@/lib/kst';
import Nav from '@/app/components/Nav';

export default function CurrentConsultationPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [form, setForm] = useState({
    applicant_name: '',
    phone: '',
    content: '',
  });
  const [step, setStep] = useState<'teacher' | 'calendar' | 'form' | 'done'>(
    'teacher',
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/teachers?select=*&role=neq.director&order=sort_order.asc`,
      {
        headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
      },
    );
    const data = await res.json();
    setTeachers(Array.isArray(data) ? data : []);
  };

  const fetchSlots = async (teacherId: string) => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/teacher_slots?teacher_id=eq.${teacherId}&is_available=eq.true&order=slot_time`,
      {
        headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
      },
    );
    const data = await res.json();
    setAvailableSlots(Array.isArray(data) ? data : []);
  };

  const selectTeacher = (teacher: any) => {
    setSelectedTeacher(teacher);
    fetchSlots(teacher.id);
    setStep('calendar');
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

  // toKST()로 통일 — 달력 점 표시용
  const hasAvailableSlot = (dateStr: string) =>
    availableSlots.some((s) => toKST(s.slot_time).date === dateStr);

  // toKST()로 통일 — 해당 날짜 슬롯 목록
  const getSlotsForDate = (dateStr: string) =>
    availableSlots.filter((s) => toKST(s.slot_time).date === dateStr);

  // toKST()로 통일 — 시간 표시
  const formatTime = (slotTime: string) => toKST(slotTime).time;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch('/api/book-current-consultation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slotId: selectedSlot.id,
        slotTime: selectedSlot.slot_time,
        teacher_id: selectedTeacher.id,
        ...form,
      }),
    });

    if (res.ok) {
      setStep('done');
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || '오류가 발생했습니다. 다시 시도해주세요.');
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-white">
      <Nav current="/consultation/current" />

      <section className="max-w-3xl mx-auto py-12 px-6">
        <h2 className="text-3xl font-bold text-center mb-2 text-gray-800">
          재원생 상담 신청
        </h2>
        <p className="text-center text-gray-500 mb-10">
          담당 선생님과 상담을 예약하세요
        </p>

        {/* 완료 */}
        {step === 'done' && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              신청이 완료되었습니다!
            </h3>
            <p className="text-gray-500 mb-2">
              선생님: {selectedTeacher.name} ({selectedTeacher.subject})
            </p>
            <p className="text-gray-500 mb-2">
              예약 시간: {selectedDate} {formatTime(selectedSlot.slot_time)}
            </p>
            <p className="text-gray-500 mb-8">확인 후 연락드리겠습니다.</p>
            <a
              href="/"
              className="bg-blue-700 text-white px-6 py-3 rounded-full hover:bg-blue-800"
            >
              홈으로
            </a>
          </div>
        )}

        {/* 선생님 선택 */}
        {step === 'teacher' && (
          <div>
            <h3 className="font-bold text-gray-700 mb-4">
              담당 선생님을 선택해주세요
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teachers.map((teacher) => (
                <button
                  key={teacher.id}
                  onClick={() => selectTeacher(teacher)}
                  className="bg-white border-2 border-gray-100 rounded-2xl p-6 text-left hover:border-blue-400 hover:shadow-md transition"
                >
                  <div className="text-4xl mb-3">👩‍🏫</div>
                  <h4 className="font-bold text-lg text-gray-800">
                    {teacher.name}
                  </h4>
                  <p className="text-blue-600">{teacher.subject}</p>
                  {teacher.bio && (
                    <p className="text-gray-500 text-sm mt-2">{teacher.bio}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 달력 */}
        {step === 'calendar' && (
          <div>
            <button
              onClick={() => setStep('teacher')}
              className="text-gray-400 hover:text-gray-600 mb-6 text-sm"
            >
              ← 선생님 다시 선택
            </button>
            <div className="bg-blue-50 rounded-xl px-4 py-3 mb-6 flex items-center gap-3">
              <span className="text-2xl">👩‍🏫</span>
              <div>
                <p className="font-bold text-gray-800">
                  {selectedTeacher.name} 선생님
                </p>
                <p className="text-blue-600 text-sm">
                  {selectedTeacher.subject}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl shadow-sm border p-6">
                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={() => setCurrentMonth(new Date(year, month - 1))}
                    className="text-gray-400 hover:text-blue-700 text-xl"
                  >
                    ‹
                  </button>
                  <h3 className="font-bold text-gray-800">
                    {year}년 {month + 1}월
                  </h3>
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
                      const hasSlot = hasAvailableSlot(dateStr);
                      const isSelected = selectedDate === dateStr;
                      return (
                        <button
                          key={d}
                          disabled={isPast || !hasSlot}
                          onClick={() => {
                            setSelectedDate(dateStr);
                            setSelectedSlot(null);
                          }}
                          className={`py-2 rounded-lg text-sm font-medium transition
                          ${isPast || !hasSlot ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-blue-50 text-gray-700'}
                          ${isSelected ? 'bg-blue-700 text-white' : ''}
                          ${hasSlot && !isSelected ? 'text-blue-600 font-bold' : ''}
                        `}
                        >
                          {d}
                          {hasSlot && !isPast && (
                            <div className="w-1 h-1 bg-blue-400 rounded-full mx-auto mt-0.5" />
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border p-6">
                <h3 className="font-bold text-gray-800 mb-4">
                  {selectedDate
                    ? `${selectedDate} 시간 선택`
                    : '날짜를 선택해주세요'}
                </h3>
                {selectedDate && (
                  <>
                    <div className="grid grid-cols-2 gap-2 mb-6">
                      {getSlotsForDate(selectedDate).map((slot) => (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlot(slot)}
                          className={`py-3 rounded-xl text-sm font-medium border transition
                            ${
                              selectedSlot?.id === slot.id
                                ? 'bg-blue-700 text-white border-blue-700'
                                : 'border-gray-200 hover:border-blue-400 text-gray-700'
                            }
                          `}
                        >
                          {formatTime(slot.slot_time)}
                        </button>
                      ))}
                    </div>
                    {selectedSlot && (
                      <button
                        onClick={() => setStep('form')}
                        className="w-full bg-blue-700 text-white py-3 rounded-xl font-bold hover:bg-blue-800"
                      >
                        이 시간으로 신청하기
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 신청 폼 */}
        {step === 'form' && (
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border p-8">
            <button
              onClick={() => setStep('calendar')}
              className="text-gray-400 hover:text-gray-600 mb-4 text-sm"
            >
              ← 시간 다시 선택
            </button>
            <div className="bg-blue-50 rounded-xl p-4 mb-6">
              <p className="text-blue-700 font-bold">예약 정보</p>
              <p className="text-blue-600">
                {selectedTeacher.name} 선생님 · {selectedDate}{' '}
                {formatTime(selectedSlot.slot_time)}
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  신청자 이름 *
                </label>
                <input
                  type="text"
                  required
                  value={form.applicant_name}
                  onChange={(e) =>
                    setForm({ ...form, applicant_name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="홍길동"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  연락처 *
                </label>
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="010-0000-0000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상담 내용
                </label>
                <textarea
                  rows={4}
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="상담하고 싶은 내용을 적어주세요."
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-700 text-white py-3 rounded-xl font-bold hover:bg-blue-800 disabled:opacity-50"
              >
                {loading ? '신청 중...' : '상담 신청 완료'}
              </button>
            </form>
          </div>
        )}
      </section>

      <footer className="bg-gray-800 text-gray-400 text-center py-8 mt-10">
        <p>© 2026 스카이수학과학입시학원 | 문의: 010-5606-3041</p>
      </footer>
    </main>
  );
}
