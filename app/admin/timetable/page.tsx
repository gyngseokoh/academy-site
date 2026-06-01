'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/components/Toast';

// 0=일,1=월,2=화,3=수,4=목,5=금,6=토
const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]; // 월~일 순서로 표시

const SUBJECT_COLORS: Record<string, string> = {
  '수학': 'bg-blue-100 border-blue-400 text-blue-800',
  '과학': 'bg-green-100 border-green-400 text-green-800',
  '물리': 'bg-purple-100 border-purple-400 text-purple-800',
  '화학': 'bg-yellow-100 border-yellow-400 text-yellow-800',
  '생명과학': 'bg-emerald-100 border-emerald-400 text-emerald-800',
  '지구과학': 'bg-orange-100 border-orange-400 text-orange-800',
};
const DEFAULT_COLOR = 'bg-gray-100 border-gray-400 text-gray-800';

const TIME_START = 9;   // 09:00
const TIME_END = 23;    // 23:00
const SLOT_HEIGHT = 48; // px per hour

function timeToMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function getColor(subject: string) {
  for (const key of Object.keys(SUBJECT_COLORS)) {
    if (subject?.includes(key)) return SUBJECT_COLORS[key];
  }
  return DEFAULT_COLOR;
}

type ClassItem = {
  id: string;
  name: string;
  subject: string;
  teachers: { name: string } | null;
  class_schedules: { id: string; day_of_week: number; start_time: string; end_time: string }[];
  class_enrollments: { id: string }[];
};

export default function TimetablePage() {
  const router = useRouter();
  const { toast, ToastHost } = useToast();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');
  const canEdit = !!role; // 로그인한 모든 사용자 편집 가능

  // 추가 모달 — 여러 요일 동시 선택
  const [modal, setModal] = useState<{ classId: string; scheduleId?: string } | null>(null);
  const [form, setForm] = useState<{ days: number[]; start: string; end: string }>({ days: [1], start: '15:00', end: '17:00' });
  const [saving, setSaving] = useState(false);

  const toggleDay = (d: number) =>
    setForm(f => ({ ...f, days: f.days.includes(d) ? f.days.filter(x => x !== d) : [...f.days, d] }));

  useEffect(() => {
    const token = localStorage.getItem('sb_access_token');
    if (!token) { router.push('/login'); return; }
    const r = localStorage.getItem('sb_role') || 'director';
    setRole(r);
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/classes');
    const data = await res.json();
    setClasses(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const handleAddSchedule = async () => {
    if (!modal) return;
    if (!modal.classId) return toast('반을 선택하세요.', 'error');
    if (form.days.length === 0) return toast('요일을 1개 이상 선택하세요.', 'error');
    setSaving(true);
    await Promise.all(form.days.map(d =>
      fetch('/api/admin/class-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ class_id: modal.classId, day_of_week: d, start_time: form.start, end_time: form.end }),
      }),
    ));
    setSaving(false);
    setModal(null);
    toast(`${form.days.length}개 요일 시간 추가`);
    fetchClasses();
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('이 시간대를 삭제할까요?')) return;
    await fetch(`/api/admin/class-schedules?id=${id}`, { method: 'DELETE' });
    fetchClasses();
  };

  // 각 요일별로 블록 계산
  const totalMinutes = (TIME_END - TIME_START) * 60;

  if (loading) return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400">불러오는 중...</p>
    </main>
  );

  return (
    <main className="min-h-screen bg-gray-50">
      {ToastHost}
      <nav className="bg-blue-700 text-white px-6 py-3 flex justify-between items-center">
        <h1 className="text-lg font-bold">📅 전체 시간표</h1>
        <a href="/admin" className="text-sm hover:underline">← 관리자 홈</a>
      </nav>

      <div className="max-w-6xl mx-auto py-6 px-4">
        {/* 범례 */}
        <div className="flex flex-wrap gap-2 mb-5 items-center">
          <span className="text-xs text-gray-500 font-bold mr-1">과목:</span>
          {Object.entries(SUBJECT_COLORS).map(([k, v]) => (
            <span key={k} className={`text-xs px-2 py-0.5 rounded border font-medium ${v}`}>{k}</span>
          ))}
          {canEdit && (
            <button
              onClick={() => { setForm({ days: [1], start: '15:00', end: '17:00' }); setModal({ classId: '' }); }}
              className="ml-auto bg-blue-700 text-white px-4 py-1.5 rounded-full text-sm font-bold hover:bg-blue-800"
            >
              + 수업 시간 추가
            </button>
          )}
        </div>

        {/* 시간표 그리드 */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-x-auto">
          <div className="flex min-w-[700px]">
            {/* 시간 축 */}
            <div className="w-14 flex-shrink-0 border-r">
              <div className="h-10 border-b" />
              {Array.from({ length: TIME_END - TIME_START }, (_, i) => (
                <div key={i} className="border-b text-right pr-2 text-xs text-gray-400 flex items-start justify-end pt-1"
                  style={{ height: SLOT_HEIGHT }}>
                  {String(TIME_START + i).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {/* 요일별 컬럼 */}
            {DAY_ORDER.map(dayIdx => {
              const schedules = classes.flatMap(cls =>
                cls.class_schedules
                  .filter(s => s.day_of_week === dayIdx)
                  .map(s => ({ ...s, cls }))
              ).sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

              return (
                <div key={dayIdx} className="flex-1 border-r last:border-r-0 min-w-[90px]">
                  {/* 요일 헤더 */}
                  <div className={`h-10 border-b flex items-center justify-center text-sm font-bold
                    ${dayIdx === 0 ? 'text-red-500' : dayIdx === 6 ? 'text-blue-500' : 'text-gray-700'}`}>
                    {DAYS[dayIdx]}
                  </div>

                  {/* 시간 슬롯 배경 */}
                  <div className="relative" style={{ height: (TIME_END - TIME_START) * SLOT_HEIGHT }}>
                    {/* 시간 구분선 */}
                    {Array.from({ length: TIME_END - TIME_START }, (_, i) => (
                      <div key={i} className="absolute w-full border-b border-gray-100"
                        style={{ top: i * SLOT_HEIGHT, height: SLOT_HEIGHT }} />
                    ))}

                    {/* 수업 블록 */}
                    {schedules.map(({ cls, ...s }) => {
                      const startMin = timeToMinutes(s.start_time) - TIME_START * 60;
                      const endMin = timeToMinutes(s.end_time) - TIME_START * 60;
                      const top = (startMin / 60) * SLOT_HEIGHT;
                      const height = ((endMin - startMin) / 60) * SLOT_HEIGHT;
                      const color = getColor(cls.subject);
                      return (
                        <div key={s.id}
                          className={`absolute left-0.5 right-0.5 rounded-lg border-l-4 px-1.5 py-1 overflow-hidden group ${color}`}
                          style={{ top: top + 2, height: height - 4 }}>
                          <div className="text-xs font-bold leading-tight truncate">{cls.name}</div>
                          <div className="text-xs opacity-70 leading-tight truncate">{cls.subject}</div>
                          <div className="text-xs opacity-60 leading-tight">
                            {s.start_time.slice(0, 5)}~{s.end_time.slice(0, 5)}
                          </div>
                          {cls.teachers && (
                            <div className="text-xs opacity-60 leading-tight truncate">{cls.teachers.name}</div>
                          )}
                          {canEdit && (
                            <button
                              onClick={() => handleDeleteSchedule(s.id)}
                              className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xs font-bold transition">
                              ✕
                            </button>
                          )}
                        </div>
                      );
                    })}

                    {schedules.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs text-gray-200">없음</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 반 목록 요약 */}
        <div className="mt-6">
          <h2 className="text-sm font-bold text-gray-600 mb-3">전체 반 ({classes.length}개)</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {classes.map(cls => (
              <div key={cls.id} className="bg-white rounded-xl border p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-gray-800">{cls.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded border ${getColor(cls.subject)}`}>{cls.subject}</span>
                </div>
                <div className="text-xs text-gray-500">{cls.teachers?.name ?? '담당 미배정'}</div>
                <div className="text-xs text-gray-400 mt-0.5">학생 {cls.class_enrollments.length}명</div>
                {canEdit && (
                  <button
                    onClick={() => { setForm({ days: [1], start: '15:00', end: '17:00' }); setModal({ classId: cls.id }); }}
                    className="mt-2 text-xs text-blue-600 hover:underline">
                    + 시간 추가
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 시간 추가 모달 */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-bold text-gray-800 mb-4">수업 시간 추가</h3>

            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">반 선택</label>
                <select value={modal.classId} onChange={e => setModal({ ...modal, classId: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm">
                  <option value="">반을 선택하세요</option>
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>{cls.name} ({cls.subject})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">요일 (여러 개 선택 가능)</label>
                <div className="flex flex-wrap gap-1.5">
                  {DAY_ORDER.map(i => {
                    const on = form.days.includes(i);
                    return (
                      <button type="button" key={i} onClick={() => toggleDay(i)}
                        className={`w-9 h-9 rounded-lg text-sm font-bold transition ${on ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                        {DAYS[i]}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">시작</label>
                  <input type="time" value={form.start} onChange={e => setForm({ ...form, start: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">종료</label>
                  <input type="time" value={form.end} onChange={e => setForm({ ...form, end: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={handleAddSchedule} disabled={saving || !modal.classId}
                className="flex-1 bg-blue-700 text-white py-2 rounded-lg font-bold text-sm hover:bg-blue-800 disabled:opacity-50">
                {saving ? '저장 중...' : '저장'}
              </button>
              <button onClick={() => setModal(null)}
                className="flex-1 border py-2 rounded-lg text-sm text-gray-600">
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
