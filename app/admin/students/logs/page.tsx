'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// 실제 DB 컬럼: id, student_id, log_date, content, progress, notes, created_at
type Log = {
  id: string;
  student_id: string;
  log_date: string;
  content: string;
  progress: string | null;
  notes: string | null;
  created_at: string;
};

type Student = {
  id: string;
  name: string;
  grade: string | null;
  teacher_id: string | null;
  is_active?: boolean;
  teachers?: { name: string } | null;
};

export default function AllLogsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [myRole, setMyRole] = useState('');
  const [myTeacherId, setMyTeacherId] = useState('');

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    student_id: '',
    log_date: new Date().toISOString().slice(0, 10),
    content: '',
    progress: '',
    notes: '',
  });
  const [addLoading, setAddLoading] = useState(false);

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('sb_access_token')
      : '';

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    const role = localStorage.getItem('sb_role') || '';
    const tid = localStorage.getItem('sb_teacher_id') || '';
    setMyRole(role);
    setMyTeacherId(tid);
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const [logsData, studentsData, teachersData] = await Promise.all([
      fetch('/api/admin/student-logs').then((r) => r.json()),
      fetch('/api/admin/students').then((r) => r.json()),
      fetch('/api/admin/teachers').then((r) => r.json()),
    ]);
    setLogs(Array.isArray(logsData) ? logsData : []);
    setStudents(Array.isArray(studentsData) ? studentsData : []);
    setTeachers(Array.isArray(teachersData) ? teachersData : []);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.student_id) return alert('학생을 선택해주세요.');
    if (!addForm.content.trim() && !addForm.progress.trim())
      return alert('수업 내용 또는 진도를 입력해주세요.');
    setAddLoading(true);

    const res = await fetch('/api/admin/student-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: addForm.student_id,
        log_date: addForm.log_date,
        content: addForm.content,
        progress: addForm.progress,
        notes: addForm.notes,
      }),
    });

    if (res.ok) {
      setAddForm({
        student_id: '',
        log_date: new Date().toISOString().slice(0, 10),
        content: '',
        progress: '',
        notes: '',
      });
      setShowAdd(false);
      fetchAll();
    } else {
      alert('저장 실패. 다시 시도해주세요.');
    }
    setAddLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 일지를 삭제할까요?')) return;
    await fetch(`/api/admin/student-logs?id=${id}`, { method: 'DELETE' });
    fetchAll();
  };

  const formatDate = (d: string) => {
    if (!d) return '-';
    const [y, m, day] = d.split('-');
    return `${y}.${m}.${day}`;
  };

  const getStudent = (id: string) => students.find((s) => s.id === id);

  // 로그에서 담당 선생님 id는 student → teacher_id로 간접 조회
  const filteredLogs = logs.filter((log) => {
    const student = getStudent(log.student_id);
    const studentName = student?.name || '';
    const teacherName = teachers.find((t) => t.id === student?.teacher_id)?.name || '';
    const matchSearch =
      studentName.includes(search) ||
      teacherName.includes(search) ||
      (log.content || '').includes(search) ||
      (log.progress || '').includes(search);
    const matchTeacher =
      !filterTeacher ||
      student?.teacher_id === filterTeacher;
    // 선생님은 본인 담당 학생 일지만 표시
    const matchMyTeacher =
      myRole !== 'teacher' || student?.teacher_id === myTeacherId;
    return matchSearch && matchTeacher && matchMyTeacher;
  });

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">📓 학생 일지 전체</h1>
        <div className="flex gap-4 text-sm">
          <a href="/admin/students" className="hover:underline">학생 목록</a>
          <a
            href={myRole === 'teacher' ? '/admin/teacher' : '/admin'}
            className="hover:underline"
          >
            ← {myRole === 'teacher' ? '내 페이지' : '관리자 홈'}
          </a>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-8 px-6">
        {/* 필터 + 작성 버튼 */}
        <div className="flex flex-wrap gap-3 items-center justify-between mb-6">
          <div className="flex gap-2 flex-wrap">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
              placeholder="학생·내용·진도 검색"
            />
            <select
              value={filterTeacher}
              onChange={(e) => setFilterTeacher(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체 선생님</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="bg-blue-700 text-white px-5 py-2 rounded-full font-bold text-sm hover:bg-blue-800"
          >
            + 일지 작성
          </button>
        </div>

        {/* 일지 작성 폼 */}
        {showAdd && (
          <form onSubmit={handleAdd} className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
            <h3 className="font-bold text-gray-800 mb-4">수업 일지 작성</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">학생 *</label>
                <select
                  required
                  value={addForm.student_id}
                  onChange={(e) => setAddForm({ ...addForm, student_id: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">선택</option>
                  {students
                    .filter((s) => myRole !== 'teacher' || s.teacher_id === myTeacherId)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.grade || '-'})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">날짜</label>
                <input
                  type="date"
                  value={addForm.log_date}
                  onChange={(e) => setAddForm({ ...addForm, log_date: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mb-3">
              <label className="text-xs font-medium text-gray-600 block mb-1">진도</label>
              <input
                type="text"
                value={addForm.progress}
                onChange={(e) => setAddForm({ ...addForm, progress: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="예: 수학 3-2 이차방정식"
              />
            </div>
            <div className="mb-3">
              <label className="text-xs font-medium text-gray-600 block mb-1">수업 내용</label>
              <textarea
                rows={3}
                value={addForm.content}
                onChange={(e) => setAddForm({ ...addForm, content: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="오늘 배운 내용"
              />
            </div>
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-600 block mb-1">메모/특이사항</label>
              <input
                type="text"
                value={addForm.notes}
                onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="숙제, 준비물 등"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={addLoading}
                className="bg-blue-700 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-blue-800 disabled:opacity-50"
              >
                {addLoading ? '저장 중...' : '저장'}
              </button>
              <button type="button" onClick={() => setShowAdd(false)} className="border px-6 py-2 rounded-lg text-sm text-gray-600">
                취소
              </button>
            </div>
          </form>
        )}

        {/* 일지 목록 */}
        {loading ? (
          <p className="text-center text-gray-400 py-20">불러오는 중...</p>
        ) : filteredLogs.length === 0 ? (
          <p className="text-center text-gray-400 py-20">작성된 일지가 없습니다.</p>
        ) : (
          <div className="space-y-3">
            <p className="text-gray-500 text-sm">{filteredLogs.length}개의 일지</p>
            {filteredLogs.map((log) => {
              const student = getStudent(log.student_id);
              const teacher = teachers.find((t) => t.id === student?.teacher_id);
              return (
                <div key={log.id} className="bg-white rounded-2xl shadow-sm border p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-bold text-gray-800">{student?.name || '-'}</span>
                      {student?.grade && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{student.grade}</span>
                      )}
                      {teacher && (
                        <span className="text-blue-600 text-sm">{teacher.name} T</span>
                      )}
                      <span className="text-gray-400 text-sm">{formatDate(log.log_date)}</span>
                    </div>
                    <div className="flex gap-2 ml-4 flex-shrink-0">
                      <button
                        onClick={() => router.push(`/admin/students/${log.student_id}/logs`)}
                        className="border px-3 py-1 rounded-lg text-xs text-blue-600 hover:bg-blue-50"
                      >
                        전체보기
                      </button>
                      <button
                        onClick={() => handleDelete(log.id)}
                        className="border px-3 py-1 rounded-lg text-xs text-red-500 hover:bg-red-50"
                      >
                        삭제
                      </button>
                    </div>
                  </div>

                  {log.progress && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">진도</span>
                      <span className="text-sm text-gray-700">{log.progress}</span>
                    </div>
                  )}
                  {log.content && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2 leading-relaxed">{log.content}</p>
                  )}
                  {log.notes && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">메모</span>
                      <span className="text-sm text-gray-500">{log.notes}</span>
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
