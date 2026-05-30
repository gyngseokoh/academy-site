'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type AttendanceRow = {
  schedule_id: string;
  class_id: string;
  class_name: string;
  subject: string;
  start_time: string;
  end_time: string;
  teacher: { id: string; name: string } | null;
  teacher_id: string;
  student_id: string;
  student_name: string;
  student_grade: string;
  enrollment_id: string;
  remaining_sessions: number;
  monthly_sessions: number;
  attendance_id: string | null;
  status: string | null;
  note: string | null;
};

type MakeupModal = {
  row: AttendanceRow;
  attendance_id: string;
};

const STATUS_CONFIG: Record<string, { label: string; active: string; badge: string }> = {
  출석: { label: '출석', active: 'bg-green-500 text-white', badge: 'bg-green-100 text-green-700' },
  지각: { label: '지각', active: 'bg-yellow-500 text-white', badge: 'bg-yellow-100 text-yellow-700' },
  결석: { label: '결석', active: 'bg-red-500 text-white', badge: 'bg-red-100 text-red-700' },
};

function getKSTDateString() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${dateStr} (${days[d.getDay()]})`;
}

function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export default function AttendancePage() {
  const router = useRouter();
  const [date, setDate] = useState(getKSTDateString());
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [myRole, setMyRole] = useState('');
  const [myTeacherId, setMyTeacherId] = useState('');
  const [filterTeacherId, setFilterTeacherId] = useState('');
  const [teachers, setTeachers] = useState<{ id: string; name: string }[]>([]);

  // 보충 예약 모달
  const [makeupModal, setMakeupModal] = useState<MakeupModal | null>(null);
  const [makeupDate, setMakeupDate] = useState('');
  const [makeupTime, setMakeupTime] = useState('');
  const [makeupSaving, setMakeupSaving] = useState(false);

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

  useEffect(() => { fetchAttendance(); }, [date, filterTeacherId]);

  const fetchTeachers = async () => {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/teachers?select=id,name&order=sort_order.asc`,
      { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! } },
    );
    setTeachers(await res.json());
  };

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ date });
    if (filterTeacherId) params.set('teacher_id', filterTeacherId);
    const res = await fetch(`/api/admin/attendance?${params}`);
    const data = await res.json();
    setRows(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [date, filterTeacherId]);

  const handleStatus = async (row: AttendanceRow, status: string) => {
    const key = `${row.student_id}_${row.class_id}`;
    setSaving(key);

    let newAttendanceId = row.attendance_id;

    if (row.attendance_id) {
      await fetch('/api/admin/attendance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.attendance_id, status }),
      });
    } else {
      // 신규 기록: 잔여 회차 차감
      const res = await fetch('/api/admin/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: row.student_id,
          class_id: row.class_id,
          attendance_date: date,
          start_time: row.start_time,
          status,
          teacher_id: row.teacher_id || null,
        }),
      });
      const data = await res.json();
      newAttendanceId = data?.id ?? null;

      // 잔여 회차 차감
      if (row.enrollment_id && row.remaining_sessions > 0) {
        await fetch('/api/admin/class-enrollments', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: row.enrollment_id,
            remaining_sessions: row.remaining_sessions - 1,
          }),
        });
      }
    }

    setRows(prev => prev.map(r =>
      r.student_id === row.student_id && r.class_id === row.class_id
        ? { ...r, status, attendance_id: newAttendanceId, remaining_sessions: r.attendance_id ? r.remaining_sessions : Math.max(0, r.remaining_sessions - 1) }
        : r,
    ));

    setSaving(null);

    // 결석이면 보충 예약 모달 오픈
    if (status === '결석' && newAttendanceId) {
      setMakeupModal({ row: { ...row, attendance_id: newAttendanceId }, attendance_id: newAttendanceId });
      setMakeupDate(addDays(date, 7));
      setMakeupTime(row.start_time.slice(0, 5));
    }
  };

  const handleSaveMakeup = async () => {
    if (!makeupModal) return;
    setMakeupSaving(true);
    await fetch('/api/admin/makeup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: makeupModal.row.student_id,
        class_id: makeupModal.row.class_id,
        attendance_record_id: makeupModal.attendance_id,
        scheduled_date: makeupDate || null,
        scheduled_time: makeupTime ? makeupTime + ':00' : null,
        teacher_id: makeupModal.row.teacher_id || null,
      }),
    });
    setMakeupSaving(false);
    setMakeupModal(null);
  };

  // 시간대별 그룹핑
  const grouped = rows.reduce<Record<string, { label: string; rows: AttendanceRow[] }>>((acc, row) => {
    const key = `${row.start_time}_${row.class_id}`;
    if (!acc[key]) {
      acc[key] = {
        label: `${row.start_time.slice(0, 5)}~${row.end_time.slice(0, 5)} ${row.class_name}${row.teacher ? ` · ${row.teacher.name} 선생님` : ''}`,
        rows: [],
      };
    }
    acc[key].rows.push(row);
    return acc;
  }, {});

  const counts = {
    total: rows.length,
    출석: rows.filter(r => r.status === '출석').length,
    지각: rows.filter(r => r.status === '지각').length,
    결석: rows.filter(r => r.status === '결석').length,
    미처리: rows.filter(r => !r.status).length,
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">✅ 출결 관리</h1>
        <div className="flex gap-4 text-sm">
          <a href="/admin/makeup" className="hover:underline">보충 관리</a>
          <a href="/admin/classes" className="hover:underline">반 관리</a>
          <a href="/admin" className="hover:underline">← 관리자 홈</a>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-8 px-6">
        {/* 날짜 선택 */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <button onClick={() => setDate(d => addDays(d, -1))}
            className="bg-white border rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-50 font-bold">‹</button>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="border rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={() => setDate(d => addDays(d, 1))}
            className="bg-white border rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-50 font-bold">›</button>
          <span className="text-gray-500 text-sm">{formatDate(date)}</span>
          <button onClick={() => setDate(getKSTDateString())}
            className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-100">
            오늘
          </button>
          {myRole === 'director' && (
            <select value={filterTeacherId} onChange={e => setFilterTeacherId(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ml-auto">
              <option value="">전체 선생님</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name} 선생님</option>)}
            </select>
          )}
        </div>

        {/* 요약 */}
        {!loading && rows.length > 0 && (
          <div className="grid grid-cols-5 gap-2 mb-6">
            {[
              { label: '전체', value: counts.total, cls: 'bg-gray-100 text-gray-700' },
              { label: '출석', value: counts.출석, cls: 'bg-green-100 text-green-700' },
              { label: '지각', value: counts.지각, cls: 'bg-yellow-100 text-yellow-700' },
              { label: '결석', value: counts.결석, cls: 'bg-red-100 text-red-700' },
              { label: '미처리', value: counts.미처리, cls: 'bg-blue-100 text-blue-700' },
            ].map(item => (
              <div key={item.label} className={`rounded-xl p-3 text-center ${item.cls}`}>
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-xs font-medium mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* 출석부 */}
        {loading ? (
          <p className="text-center text-gray-400 py-20">불러오는 중...</p>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border p-12 text-center">
            <p className="text-gray-400 text-lg mb-2">이날 수업이 없습니다</p>
            <p className="text-gray-300 text-sm">반 관리에서 수업 요일/시간을 등록해주세요</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([key, group]) => (
              <div key={key} className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                <div className="bg-blue-700 text-white px-5 py-3">
                  <h3 className="font-bold text-sm">{group.label}</h3>
                </div>
                <div className="divide-y">
                  {group.rows.map(row => {
                    const rowKey = `${row.student_id}_${row.class_id}`;
                    const isSaving = saving === rowKey;
                    return (
                      <div key={rowKey} className="flex items-center justify-between px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium text-gray-800">{row.student_name}</p>
                            {row.student_grade && <p className="text-xs text-gray-400">{row.student_grade}</p>}
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                            ${row.remaining_sessions <= 2 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                            잔여 {row.remaining_sessions}회
                          </span>
                        </div>
                        <div className="flex gap-1.5">
                          {isSaving ? (
                            <span className="text-gray-400 text-sm px-4">저장 중...</span>
                          ) : (
                            Object.entries(STATUS_CONFIG).map(([s, cfg]) => (
                              <button
                                key={s}
                                onClick={() => handleStatus(row, s)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition
                                  ${row.status === s ? cfg.active : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                              >
                                {cfg.label}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 보충 예약 모달 */}
      {makeupModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
            <h3 className="font-bold text-gray-800 text-lg mb-1">보충 수업 예약</h3>
            <p className="text-gray-500 text-sm mb-5">
              <span className="font-medium text-gray-800">{makeupModal.row.student_name}</span> 학생의 보충 일정을 등록하세요
            </p>
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">보충 날짜</label>
                <input type="date" value={makeupDate} onChange={e => setMakeupDate(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">보충 시간</label>
                <input type="time" value={makeupTime} onChange={e => setMakeupTime(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSaveMakeup} disabled={makeupSaving}
                className="flex-1 bg-blue-700 text-white py-3 rounded-lg font-bold hover:bg-blue-800 disabled:opacity-50">
                {makeupSaving ? '저장 중...' : '보충 예약'}
              </button>
              <button onClick={() => setMakeupModal(null)}
                className="flex-1 border py-3 rounded-lg text-gray-600 hover:bg-gray-50">
                나중에
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
