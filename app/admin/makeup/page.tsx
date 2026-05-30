'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type MakeupClass = {
  id: string;
  student_id: string;
  class_id: string;
  attendance_record_id: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  teacher_id: string | null;
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
  const [makeups, setMakeups] = useState<MakeupClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<typeof STATUS_TABS[number]>('전체');
  const [myRole, setMyRole] = useState('');
  const [myTeacherId, setMyTeacherId] = useState('');

  // 수동 추가 폼
  const [showAdd, setShowAdd] = useState(false);
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string; subject: string }[]>([]);
  const [addForm, setAddForm] = useState({ student_id: '', class_id: '', scheduled_date: '', scheduled_time: '', note: '' });

  useEffect(() => {
    const token = localStorage.getItem('sb_access_token');
    if (!token) { router.push('/login'); return; }
    const role = localStorage.getItem('sb_role') || 'director';
    const tid = localStorage.getItem('sb_teacher_id') || '';
    setMyRole(role);
    setMyTeacherId(tid);
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
    setLoading(false);
  };

  const fetchStudentsAndClasses = async () => {
    const [sRes, cRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/students?select=id,name&order=name`, {
        headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
      }),
      fetch('/api/admin/classes'),
    ]);
    setStudents(await sRes.json());
    setClasses(await cRes.json());
  };

  const handleStatusChange = async (id: string, status: string, enrollmentId?: string) => {
    await fetch('/api/admin/makeup', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, enrollment_id: enrollmentId }),
    });
    fetchAll(myRole === 'teacher' || myRole === 'vice_director' ? myTeacherId : '');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('보충 일정을 삭제할까요?')) return;
    await fetch(`/api/admin/makeup?id=${id}`, { method: 'DELETE' });
    fetchAll(myRole === 'teacher' || myRole === 'vice_director' ? myTeacherId : '');
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/makeup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...addForm,
        scheduled_time: addForm.scheduled_time ? addForm.scheduled_time + ':00' : null,
      }),
    });
    setAddForm({ student_id: '', class_id: '', scheduled_date: '', scheduled_time: '', note: '' });
    setShowAdd(false);
    fetchAll(myRole === 'teacher' || myRole === 'vice_director' ? myTeacherId : '');
  };

  const filtered = makeups.filter(m => filter === '전체' || m.status === filter);

  const counts = {
    전체: makeups.length,
    예정: makeups.filter(m => m.status === '예정').length,
    완료: makeups.filter(m => m.status === '완료').length,
    미진행: makeups.filter(m => m.status === '미진행').length,
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">🔄 보충 수업 관리</h1>
        <div className="flex gap-4 text-sm">
          <a href="/admin/attendance" className="hover:underline">출결 관리</a>
          <a href="/admin" className="hover:underline">← 관리자 홈</a>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-8 px-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            {STATUS_TABS.map(tab => (
              <button key={tab} onClick={() => setFilter(tab)}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition
                  ${filter === tab ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 border hover:border-blue-400'}`}>
                {tab} ({counts[tab]})
              </button>
            ))}
          </div>
          <button onClick={() => setShowAdd(!showAdd)}
            className="bg-blue-700 text-white px-5 py-2 rounded-full font-bold text-sm hover:bg-blue-800">
            + 직접 추가
          </button>
        </div>

        {/* 직접 추가 폼 */}
        {showAdd && (
          <form onSubmit={handleAdd} className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
            <h3 className="font-bold text-gray-800 mb-4">보충 수업 직접 등록</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">학생 *</label>
                <select required value={addForm.student_id} onChange={e => setAddForm({ ...addForm, student_id: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">학생 선택</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">반 *</label>
                <select required value={addForm.class_id} onChange={e => setAddForm({ ...addForm, class_id: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">반 선택</option>
                  {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name} {c.subject && `(${c.subject})`}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">보충 날짜</label>
                <input type="date" value={addForm.scheduled_date} onChange={e => setAddForm({ ...addForm, scheduled_date: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">보충 시간</label>
                <input type="time" value={addForm.scheduled_time} onChange={e => setAddForm({ ...addForm, scheduled_time: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-blue-700 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-blue-800">등록</button>
              <button type="button" onClick={() => setShowAdd(false)} className="border px-6 py-2 rounded-lg text-sm text-gray-600">취소</button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-center text-gray-400 py-20">불러오는 중...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-20">보충 수업이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {filtered.map(m => (
              <div key={m.id} className="bg-white rounded-2xl shadow-sm border p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-bold text-gray-800">{m.students?.name}</span>
                      {m.students?.grade && <span className="text-gray-400 text-xs">{m.students.grade}</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${STATUS_BADGE[m.status]}`}>{m.status}</span>
                      {m.classes && <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">{m.classes.name}</span>}
                    </div>
                    <div className="text-sm text-gray-500 space-y-0.5">
                      {m.attendance_records && (
                        <p>원결석일: {m.attendance_records.attendance_date}</p>
                      )}
                      {m.scheduled_date && (
                        <p>보충 예정: <span className="font-medium text-gray-700">{m.scheduled_date} {m.scheduled_time?.slice(0, 5)}</span></p>
                      )}
                      {m.classes?.teachers && <p>담당: {m.classes.teachers.name} 선생님</p>}
                      {m.note && <p>메모: {m.note}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1.5 ml-4 flex-shrink-0 flex-wrap justify-end">
                    {m.status === '예정' && (
                      <>
                        <button onClick={() => handleStatusChange(m.id, '완료')}
                          className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-600">
                          완료
                        </button>
                        <button onClick={() => handleStatusChange(m.id, '미진행')}
                          className="bg-red-400 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-500">
                          미진행
                        </button>
                      </>
                    )}
                    {m.status !== '예정' && (
                      <button onClick={() => handleStatusChange(m.id, '예정')}
                        className="border text-gray-500 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-50">
                        예정으로 변경
                      </button>
                    )}
                    <button onClick={() => handleDelete(m.id)}
                      className="border text-red-400 px-3 py-1.5 rounded-lg text-xs hover:bg-red-50">
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
