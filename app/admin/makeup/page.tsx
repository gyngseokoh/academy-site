'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/components/Toast';

type MakeupClass = {
  id: string;
  student_id: string;
  class_id: string;
  attendance_record_id: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  teacher_id: string | null;
  enrollment_id: string | null;
  status: '예정' | '완료' | '미진행';
  note: string | null;
  students: { id: string; name: string; grade: string } | null;
  classes: { id: string; name: string; subject: string; teacher_id: string; teachers: { id: string; name: string } | null } | null;
  attendance_records: { attendance_date: string; status: string } | null;
};

const STATUS_TABS = ['전체', '예정', '완료', '미진행'] as const;
const STATUS_BADGE: Record<string, string> = {
  예정: 'bg-blue-100 text-blue-700',
  완료: 'bg-green-100 text-green-700',
  미진행: 'bg-red-100 text-red-700',
};

export default function MakeupPage() {
  const router = useRouter();
  const { toast, ToastHost } = useToast();
  const [makeups, setMakeups] = useState<MakeupClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<typeof STATUS_TABS[number]>('전체');
  const [myRole, setMyRole] = useState('');
  const [myTeacherId, setMyTeacherId] = useState('');

  // 추가 폼
  const [showAdd, setShowAdd] = useState(false);
  const [students, setStudents] = useState<{ id: string; name: string; grade?: string }[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string; subject: string }[]>([]);
  const [addClass, setAddClass] = useState('');
  const [addDate, setAddDate] = useState('');
  const [addTime, setAddTime] = useState('');
  const [addNote, setAddNote] = useState('');
  const [addStudents, setAddStudents] = useState<Set<string>>(new Set());
  const [studentSearch, setStudentSearch] = useState('');
  const [addLoading, setAddLoading] = useState(false);

  // 다중 선택 (목록)
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    const token = localStorage.getItem('sb_access_token');
    if (!token) { router.push('/login'); return; }
    const role = localStorage.getItem('sb_role') || 'director';
    const tid = localStorage.getItem('sb_teacher_id') || '';
    setMyRole(role); setMyTeacherId(tid);
    fetchAll(role === 'teacher' || role === 'vice_director' ? tid : '');
    fetchStudentsAndClasses();
  }, []);

  const fetchAll = async (teacherId = '') => {
    setLoading(true);
    const params = new URLSearchParams();
    if (teacherId) params.set('teacher_id', teacherId);
    const res = await fetch(`/api/admin/makeup?${params}`);
    const data = await res.json();
    setMakeups(Array.isArray(data) ? data : []);
    setSelected(new Set());
    setLoading(false);
  };

  const refresh = () => fetchAll(myRole === 'teacher' || myRole === 'vice_director' ? myTeacherId : '');

  const fetchStudentsAndClasses = async () => {
    const [sRes, cRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/students?select=id,name,grade&is_active=neq.false&order=name`, {
        headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
      }),
      fetch('/api/admin/classes'),
    ]);
    setStudents(await sRes.json());
    setClasses(await cRes.json());
  };

  const handleStatusChange = async (id: string, status: string, enrollmentId?: string | null) => {
    await fetch('/api/admin/makeup', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, enrollment_id: enrollmentId }),
    });
    toast(`'${status}'(으)로 변경`); refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('보충 일정을 삭제할까요?')) return;
    await fetch(`/api/admin/makeup?id=${id}`, { method: 'DELETE' });
    toast('삭제되었습니다'); refresh();
  };

  // 다중 학생 일괄 등록
  const toggleAddStudent = (id: string) =>
    setAddStudents((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addStudents.size === 0) return toast('학생을 1명 이상 선택하세요.', 'error');
    setAddLoading(true);
    const res = await fetch('/api/admin/makeup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_ids: Array.from(addStudents),
        class_id: addClass || null,
        scheduled_date: addDate || null,
        scheduled_time: addTime ? addTime + ':00' : null,
        note: addNote || null,
      }),
    });
    if (res.ok) {
      toast(`${addStudents.size}명 보충 등록 완료`);
      setAddStudents(new Set()); setAddClass(''); setAddDate(''); setAddTime(''); setAddNote(''); setStudentSearch('');
      setShowAdd(false); refresh();
    } else { toast('등록 실패', 'error'); }
    setAddLoading(false);
  };

  // 목록 일괄 작업
  const bulkStatus = async (status: string) => {
    await fetch('/api/admin/makeup', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selected), fields: { status } }),
    });
    toast(`${selected.size}건 '${status}' 처리`); refresh();
  };
  const bulkDelete = async () => {
    if (!confirm(`선택한 ${selected.size}건을 삭제할까요?`)) return;
    await fetch(`/api/admin/makeup?ids=${Array.from(selected).join(',')}`, { method: 'DELETE' });
    toast(`${selected.size}건 삭제`); refresh();
  };

  const filtered = makeups.filter((m) => filter === '전체' || m.status === filter);
  const counts = {
    전체: makeups.length,
    예정: makeups.filter((m) => m.status === '예정').length,
    완료: makeups.filter((m) => m.status === '완료').length,
    미진행: makeups.filter((m) => m.status === '미진행').length,
  };

  const allChecked = filtered.length > 0 && filtered.every((m) => selected.has(m.id));
  const toggleAll = () => setSelected((prev) => {
    if (filtered.every((m) => prev.has(m.id))) { const n = new Set(prev); filtered.forEach((m) => n.delete(m.id)); return n; }
    const n = new Set(prev); filtered.forEach((m) => n.add(m.id)); return n;
  });
  const toggleOne = (id: string) =>
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const filteredStudents = students.filter((s) => s.name.includes(studentSearch));

  return (
    <main className="min-h-screen bg-gray-50">
      {ToastHost}
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">🔄 보충 수업 관리</h1>
        <div className="flex gap-4 text-sm">
          <a href="/admin/attendance" className="hover:underline">출결 관리</a>
          <a href="/admin" className="hover:underline">← 관리자 홈</a>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-8 px-6">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <div className="flex gap-2">
            {STATUS_TABS.map((tab) => (
              <button key={tab} onClick={() => setFilter(tab)}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition
                  ${filter === tab ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 border hover:border-blue-400'}`}>
                {tab} ({counts[tab]})
              </button>
            ))}
          </div>
          <button onClick={() => setShowAdd(!showAdd)}
            className="bg-blue-700 text-white px-5 py-2 rounded-full font-bold text-sm hover:bg-blue-800">
            + 보충 등록 (여러 명)
          </button>
        </div>

        {/* 일괄 등록 폼 */}
        {showAdd && (
          <form onSubmit={handleAdd} className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
            <h3 className="font-bold text-gray-800 mb-4">보충 수업 등록 — 여러 학생 한 번에</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">반 (선택)</label>
                <select value={addClass} onChange={(e) => setAddClass(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">반 미지정</option>
                  {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}{c.subject && ` (${c.subject})`}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">보충 날짜</label>
                <input type="date" value={addDate} onChange={(e) => setAddDate(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">보충 시간</label>
                <input type="time" value={addTime} onChange={(e) => setAddTime(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {/* 학생 다중 선택 */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">학생 선택 *</label>
                <span className="text-xs text-blue-600 font-bold">{addStudents.size}명 선택됨</span>
              </div>
              <input value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="학생 이름 검색"
                className="w-full border rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="border rounded-xl max-h-52 overflow-y-auto p-1 grid grid-cols-2 sm:grid-cols-3 gap-1">
                {filteredStudents.map((s) => {
                  const on = addStudents.has(s.id);
                  return (
                    <button type="button" key={s.id} onClick={() => toggleAddStudent(s.id)}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-left transition
                        ${on ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-700'}`}>
                      <span className={`w-4 h-4 rounded border flex items-center justify-center text-xs flex-shrink-0
                        ${on ? 'bg-white text-blue-600 border-white' : 'border-gray-300'}`}>{on ? '✓' : ''}</span>
                      <span className="truncate">{s.name}{s.grade ? <span className={on ? 'text-blue-100' : 'text-gray-400'}> {s.grade}</span> : ''}</span>
                    </button>
                  );
                })}
                {filteredStudents.length === 0 && <p className="text-gray-400 text-sm col-span-full text-center py-4">학생이 없습니다.</p>}
              </div>
            </div>

            <input value={addNote} onChange={(e) => setAddNote(e.target.value)} placeholder="메모 (선택)"
              className="w-full border rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500" />

            <div className="flex gap-2">
              <button type="submit" disabled={addLoading}
                className="bg-blue-700 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-blue-800 disabled:opacity-50">
                {addLoading ? '등록 중...' : `${addStudents.size}명 등록`}
              </button>
              <button type="button" onClick={() => setShowAdd(false)} className="border px-6 py-2 rounded-lg text-sm text-gray-600">취소</button>
            </div>
          </form>
        )}

        {/* 일괄 작업 바 */}
        {selected.size > 0 && (
          <div className="sticky top-2 z-20 bg-blue-900 text-white rounded-xl px-4 py-3 mb-3 flex flex-wrap items-center gap-3 shadow-lg">
            <span className="font-bold text-sm">{selected.size}건 선택됨</span>
            <button onClick={() => bulkStatus('완료')} className="bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg text-sm">완료 처리</button>
            <button onClick={() => bulkStatus('미진행')} className="bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg text-sm">미진행</button>
            <button onClick={() => bulkStatus('예정')} className="bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg text-sm">예정으로</button>
            <button onClick={bulkDelete} className="bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg text-sm font-bold ml-auto">삭제</button>
            <button onClick={() => setSelected(new Set())} className="text-blue-200 hover:text-white px-2 py-1.5 text-sm">선택 해제</button>
          </div>
        )}

        {loading ? (
          <p className="text-center text-gray-400 py-20">불러오는 중...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-20">보충 수업이 없습니다.</p>
        ) : (
          <>
            <label className="flex items-center gap-2 text-sm text-gray-500 mb-2 px-1 cursor-pointer">
              <input type="checkbox" checked={allChecked} onChange={toggleAll} className="w-4 h-4 accent-blue-600" />
              전체 선택
            </label>
            <div className="space-y-3">
              {filtered.map((m) => (
                <div key={m.id} className={`bg-white rounded-2xl shadow-sm border p-5 ${selected.has(m.id) ? 'ring-2 ring-blue-400' : ''}`}>
                  <div className="flex items-start gap-3">
                    <input type="checkbox" checked={selected.has(m.id)} onChange={() => toggleOne(m.id)}
                      className="w-4 h-4 accent-blue-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-gray-800">{m.students?.name}</span>
                        {m.students?.grade && <span className="text-gray-400 text-xs">{m.students.grade}</span>}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${STATUS_BADGE[m.status]}`}>{m.status}</span>
                        {m.classes && <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">{m.classes.name}</span>}
                      </div>
                      <div className="text-sm text-gray-500 space-y-0.5">
                        {m.attendance_records && <p>원결석일: {m.attendance_records.attendance_date}</p>}
                        {m.scheduled_date && <p>보충 예정: <span className="font-medium text-gray-700">{m.scheduled_date} {m.scheduled_time?.slice(0, 5)}</span></p>}
                        {m.classes?.teachers && <p>담당: {m.classes.teachers.name} 선생님</p>}
                        {m.note && <p>메모: {m.note}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0 flex-wrap justify-end">
                      {m.status === '예정' && (
                        <>
                          <button onClick={() => handleStatusChange(m.id, '완료', m.enrollment_id)}
                            className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-600">완료</button>
                          <button onClick={() => handleStatusChange(m.id, '미진행')}
                            className="bg-red-400 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-500">미진행</button>
                        </>
                      )}
                      {m.status !== '예정' && (
                        <button onClick={() => handleStatusChange(m.id, '예정')}
                          className="border text-gray-500 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-50">예정으로</button>
                      )}
                      <button onClick={() => handleDelete(m.id)}
                        className="border text-red-400 px-3 py-1.5 rounded-lg text-xs hover:bg-red-50">삭제</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
