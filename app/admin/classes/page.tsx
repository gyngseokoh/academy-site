'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

type Teacher = { id: string; name: string };
type Student = { id: string; name: string; grade: string };
type Schedule = { id: string; day_of_week: number; start_time: string; end_time: string };
type Enrollment = { id: string; student_id: string; monthly_sessions: number; remaining_sessions: number; students: Student };
type Class = {
  id: string;
  name: string;
  subject: string;
  teacher_id: string;
  teachers: Teacher | null;
  class_schedules: Schedule[];
  class_enrollments: Enrollment[];
};

export default function ClassesPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 반 추가 폼
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', subject: '', teacher_id: '' });

  // 스케줄 추가
  const [scheduleForm, setScheduleForm] = useState<Record<string, { day: string; start: string; end: string }>>({});

  // 학생 추가
  const [enrollForm, setEnrollForm] = useState<Record<string, { student_id: string; monthly: string }>>({});

  useEffect(() => {
    const token = localStorage.getItem('sb_access_token');
    if (!token) { router.push('/login'); return; }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const [classRes, teacherRes, studentRes] = await Promise.all([
      fetch('/api/admin/classes'),
      fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/teachers?select=id,name&order=sort_order.asc`, {
        headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
      }),
      fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/students?select=id,name,grade&is_active=neq.false&order=name`, {
        headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
      }),
    ]);
    setClasses(await classRes.json());
    setTeachers(await teacherRes.json());
    setAllStudents(await studentRes.json());
    setLoading(false);
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addForm),
    });
    setAddForm({ name: '', subject: '', teacher_id: '' });
    setShowAdd(false);
    fetchAll();
  };

  const handleDeleteClass = async (id: string, name: string) => {
    if (!confirm(`"${name}" 반을 삭제할까요?`)) return;
    await fetch(`/api/admin/classes?id=${id}`, { method: 'DELETE' });
    fetchAll();
  };

  const handleAddSchedule = async (classId: string) => {
    const f = scheduleForm[classId];
    if (!f?.day || !f?.start || !f?.end) return alert('요일과 시간을 모두 입력해주세요.');
    await fetch('/api/admin/class-schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ class_id: classId, day_of_week: parseInt(f.day), start_time: f.start, end_time: f.end }),
    });
    setScheduleForm(prev => ({ ...prev, [classId]: { day: '', start: '', end: '' } }));
    fetchAll();
  };

  const handleDeleteSchedule = async (id: string) => {
    await fetch(`/api/admin/class-schedules?id=${id}`, { method: 'DELETE' });
    fetchAll();
  };

  const handleAddEnrollment = async (classId: string) => {
    const f = enrollForm[classId];
    if (!f?.student_id) return alert('학생을 선택해주세요.');
    const monthly = parseInt(f.monthly || '8');
    await fetch('/api/admin/class-enrollments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ class_id: classId, student_id: f.student_id, monthly_sessions: monthly, remaining_sessions: monthly }),
    });
    setEnrollForm(prev => ({ ...prev, [classId]: { student_id: '', monthly: '8' } }));
    fetchAll();
  };

  const handleDeleteEnrollment = async (id: string) => {
    if (!confirm('학생을 이 반에서 제거할까요?')) return;
    await fetch(`/api/admin/class-enrollments?id=${id}`, { method: 'DELETE' });
    fetchAll();
  };

  const getEnrolledIds = (cls: Class) => cls.class_enrollments.map(e => e.student_id);

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">📚 반 관리</h1>
        <a href="/admin" className="text-sm hover:underline">← 관리자 홈</a>
      </nav>

      <div className="max-w-4xl mx-auto py-8 px-6">
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-500 text-sm">총 {classes.length}개 반</p>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="bg-blue-700 text-white px-5 py-2 rounded-full font-bold text-sm hover:bg-blue-800"
          >
            + 반 추가
          </button>
        </div>

        {showAdd && (
          <form onSubmit={handleAddClass} className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
            <h3 className="font-bold text-gray-800 mb-4">새 반 추가</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">반 이름 *</label>
                <input required value={addForm.name} onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="수학 A반" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">과목</label>
                <input value={addForm.subject} onChange={e => setAddForm({ ...addForm, subject: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="수학" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">담당 선생님</label>
                <select value={addForm.teacher_id} onChange={e => setAddForm({ ...addForm, teacher_id: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">선택 안함</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-blue-700 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-blue-800">추가</button>
              <button type="button" onClick={() => setShowAdd(false)} className="border px-6 py-2 rounded-lg text-sm text-gray-600">취소</button>
            </div>
          </form>
        )}

        {loading ? (
          <p className="text-center text-gray-400 py-20">불러오는 중...</p>
        ) : classes.length === 0 ? (
          <p className="text-center text-gray-400 py-20">등록된 반이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {classes.map(cls => (
              <div key={cls.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                {/* 반 헤더 */}
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50"
                  onClick={() => setExpandedId(expandedId === cls.id ? null : cls.id)}
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-bold text-gray-800 text-lg">{cls.name}</span>
                    {cls.subject && <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">{cls.subject}</span>}
                    {cls.teachers && <span className="text-gray-500 text-sm">{cls.teachers.name} 선생님</span>}
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                      학생 {cls.class_enrollments.length}명
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={e => { e.stopPropagation(); handleDeleteClass(cls.id, cls.name); }}
                      className="text-red-400 hover:text-red-600 text-sm border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50"
                    >삭제</button>
                    <span className="text-gray-400">{expandedId === cls.id ? '▲' : '▼'}</span>
                  </div>
                </div>

                {expandedId === cls.id && (
                  <div className="border-t px-5 py-4 space-y-5">
                    {/* 수업 요일/시간 */}
                    <div>
                      <h4 className="font-bold text-gray-700 text-sm mb-2">📅 수업 요일/시간</h4>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {cls.class_schedules.length === 0 && (
                          <p className="text-gray-400 text-sm">등록된 시간이 없습니다.</p>
                        )}
                        {cls.class_schedules.map(s => (
                          <div key={s.id} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full">
                            <span>{DAYS[s.day_of_week]}요일 {s.start_time.slice(0,5)}~{s.end_time.slice(0,5)}</span>
                            <button onClick={() => handleDeleteSchedule(s.id)} className="ml-1 text-blue-400 hover:text-red-500">✕</button>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <select
                          value={scheduleForm[cls.id]?.day ?? ''}
                          onChange={e => setScheduleForm(p => ({ ...p, [cls.id]: { ...p[cls.id], day: e.target.value } }))}
                          className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">요일</option>
                          {DAYS.map((d, i) => <option key={i} value={i}>{d}요일</option>)}
                        </select>
                        <input type="time" value={scheduleForm[cls.id]?.start ?? ''}
                          onChange={e => setScheduleForm(p => ({ ...p, [cls.id]: { ...p[cls.id], start: e.target.value } }))}
                          className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <span className="self-center text-gray-400">~</span>
                        <input type="time" value={scheduleForm[cls.id]?.end ?? ''}
                          onChange={e => setScheduleForm(p => ({ ...p, [cls.id]: { ...p[cls.id], end: e.target.value } }))}
                          className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        <button onClick={() => handleAddSchedule(cls.id)}
                          className="bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-800">
                          추가
                        </button>
                      </div>
                    </div>

                    {/* 학생 목록 */}
                    <div>
                      <h4 className="font-bold text-gray-700 text-sm mb-2">👨‍🎓 수강 학생</h4>
                      <div className="space-y-1 mb-3">
                        {cls.class_enrollments.length === 0 && (
                          <p className="text-gray-400 text-sm">등록된 학생이 없습니다.</p>
                        )}
                        {cls.class_enrollments.map(enr => (
                          <div key={enr.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                            <span className="font-medium text-gray-800">{enr.students?.name}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-gray-500">잔여 {enr.remaining_sessions}/{enr.monthly_sessions}회</span>
                              <button onClick={() => handleDeleteEnrollment(enr.id)}
                                className="text-red-400 hover:text-red-600 text-xs">제거</button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <select
                          value={enrollForm[cls.id]?.student_id ?? ''}
                          onChange={e => setEnrollForm(p => ({ ...p, [cls.id]: { ...p[cls.id], student_id: e.target.value } }))}
                          className="flex-1 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">학생 선택</option>
                          {allStudents.filter(s => !getEnrolledIds(cls).includes(s.id)).map(s => (
                            <option key={s.id} value={s.id}>{s.name} {s.grade && `(${s.grade})`}</option>
                          ))}
                        </select>
                        <input type="number" min="1" max="30"
                          value={enrollForm[cls.id]?.monthly ?? '8'}
                          onChange={e => setEnrollForm(p => ({ ...p, [cls.id]: { ...p[cls.id], monthly: e.target.value } }))}
                          className="w-20 border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="월회차" />
                        <button onClick={() => handleAddEnrollment(cls.id)}
                          className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-green-700">
                          배정
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
