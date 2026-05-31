'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type Student = {
  id: string;
  name: string;
  grade: string | null;
  teacher_id: string | null;
  is_active?: boolean;
};

type Log = {
  id: string;
  student_id: string;
  date: string;
  content: string;
  log_date?: string;
};

function getToday() {
  const kst = new Date(Date.now() + 9 * 3600000);
  return kst.toISOString().slice(0, 10);
}

export default function AllLogsPage() {
  const router = useRouter();
  const [date, setDate] = useState(getToday());
  const [students, setStudents] = useState<Student[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);  // 선택된 날짜의 일지
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState('');
  const [myTeacherId, setMyTeacherId] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [teachers, setTeachers] = useState<any[]>([]);

  // 학생별 작성 중인 내용 (student_id → content)
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const token = localStorage.getItem('sb_access_token');
    if (!token) { router.push('/login'); return; }
    const role = localStorage.getItem('sb_role') || '';
    const tid = localStorage.getItem('sb_teacher_id') || '';
    setMyRole(role);
    setMyTeacherId(tid);
    if (role === 'teacher') setFilterTeacher(tid);
    fetchStudentsAndTeachers();
  }, []);

  useEffect(() => {
    if (students.length > 0) fetchLogsForDate();
  }, [date, students]);

  const fetchStudentsAndTeachers = async () => {
    const [sRes, tRes] = await Promise.all([
      fetch('/api/admin/students'),
      fetch('/api/admin/teachers'),
    ]);
    const sData = await sRes.json();
    const tData = await tRes.json();
    setStudents(Array.isArray(sData) ? sData : []);
    setTeachers(Array.isArray(tData) ? tData : []);
    setLoading(false);
  };

  const fetchLogsForDate = useCallback(async () => {
    const res = await fetch(`/api/admin/student-logs`);
    const data = await res.json();
    const filtered = Array.isArray(data)
      ? data.filter((l: Log) => (l.log_date ?? l.date) === date)
      : [];
    setLogs(filtered);

    // 기존 일지를 draft로 초기화
    const newDrafts: Record<string, string> = {};
    filtered.forEach((l: Log) => { newDrafts[l.student_id] = l.content; });
    setDrafts(prev => ({ ...newDrafts, ...Object.fromEntries(Object.entries(prev).filter(([k]) => !newDrafts[k])) }));
    setSaved({});
  }, [date]);

  const handleSave = async (studentId: string) => {
    const content = drafts[studentId]?.trim();
    if (!content) return alert('내용을 입력해주세요.');
    setSaving(prev => ({ ...prev, [studentId]: true }));

    const existing = logs.find(l => l.student_id === studentId);
    const method = existing ? 'PATCH' : 'POST';
    const body = existing
      ? { id: existing.id, content, log_date: date }
      : { student_id: studentId, log_date: date, content };

    await fetch('/api/admin/student-logs', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    setSaving(prev => ({ ...prev, [studentId]: false }));
    setSaved(prev => ({ ...prev, [studentId]: true }));
    setTimeout(() => setSaved(prev => ({ ...prev, [studentId]: false })), 2000);
    fetchLogsForDate();
  };

  const handleDelete = async (studentId: string) => {
    const existing = logs.find(l => l.student_id === studentId);
    if (!existing) return;
    if (!confirm('이 일지를 삭제할까요?')) return;
    await fetch(`/api/admin/student-logs?id=${existing.id}`, { method: 'DELETE' });
    setDrafts(prev => { const n = { ...prev }; delete n[studentId]; return n; });
    fetchLogsForDate();
  };

  const visibleStudents = students.filter(s => {
    if (s.is_active === false) return false;
    if (myRole === 'teacher') return s.teacher_id === myTeacherId;
    if (filterTeacher) return s.teacher_id === filterTeacher;
    return true;
  });

  const written = visibleStudents.filter(s => logs.some(l => l.student_id === s.id));
  const unwritten = visibleStudents.filter(s => !logs.some(l => l.student_id === s.id));

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">📓 학생 일지 작성</h1>
        <a href={myRole === 'teacher' ? '/admin/teacher' : '/admin'} className="text-sm hover:underline">
          ← {myRole === 'teacher' ? '내 페이지' : '관리자 홈'}
        </a>
      </nav>

      <div className="max-w-3xl mx-auto py-8 px-6">
        {/* 날짜 + 필터 */}
        <div className="flex gap-3 items-center mb-6 flex-wrap">
          <div className="flex items-center gap-2 bg-white border rounded-xl px-4 py-2 shadow-sm">
            <span className="text-gray-400 text-sm">📅</span>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="text-sm font-bold text-gray-800 focus:outline-none" />
          </div>
          {myRole !== 'teacher' && (
            <select value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)}
              className="border rounded-xl px-3 py-2 text-sm bg-white shadow-sm focus:outline-none">
              <option value="">전체 선생님</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}
          <div className="ml-auto text-sm text-gray-500">
            <span className="text-green-600 font-bold">{written.length}</span>/{visibleStudents.length}명 작성 완료
          </div>
        </div>

        {loading ? (
          <p className="text-center text-gray-400 py-20">불러오는 중...</p>
        ) : visibleStudents.length === 0 ? (
          <p className="text-center text-gray-400 py-20">담당 학생이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {/* 미작성 학생 먼저 */}
            {unwritten.length > 0 && (
              <>
                <p className="text-xs font-bold text-orange-500 uppercase tracking-widest px-1">
                  미작성 ({unwritten.length}명)
                </p>
                {unwritten.map(s => (
                  <StudentCard key={s.id} student={s} log={null}
                    draft={drafts[s.id] ?? ''}
                    setDraft={v => setDrafts(prev => ({ ...prev, [s.id]: v }))}
                    onSave={() => handleSave(s.id)}
                    onDelete={() => handleDelete(s.id)}
                    saving={!!saving[s.id]}
                    justSaved={!!saved[s.id]}
                    teachers={teachers} />
                ))}
              </>
            )}

            {/* 작성 완료 학생 */}
            {written.length > 0 && (
              <>
                <p className="text-xs font-bold text-green-600 uppercase tracking-widest px-1 mt-4">
                  작성 완료 ({written.length}명)
                </p>
                {written.map(s => {
                  const log = logs.find(l => l.student_id === s.id)!;
                  return (
                    <StudentCard key={s.id} student={s} log={log}
                      draft={drafts[s.id] ?? log.content}
                      setDraft={v => setDrafts(prev => ({ ...prev, [s.id]: v }))}
                      onSave={() => handleSave(s.id)}
                      onDelete={() => handleDelete(s.id)}
                      saving={!!saving[s.id]}
                      justSaved={!!saved[s.id]}
                      teachers={teachers} />
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function StudentCard({ student, log, draft, setDraft, onSave, onDelete, saving, justSaved, teachers }: {
  student: Student;
  log: Log | null;
  draft: string;
  setDraft: (v: string) => void;
  onSave: () => void;
  onDelete: () => void;
  saving: boolean;
  justSaved: boolean;
  teachers: any[];
}) {
  const [expanded, setExpanded] = useState(!log); // 미작성이면 기본 펼침
  const teacher = teachers.find(t => t.id === student.teacher_id);
  const hasLog = !!log;
  const isDirty = draft !== (log?.content ?? '');

  return (
    <div className={`bg-white rounded-2xl border shadow-sm transition ${hasLog ? 'border-green-100' : 'border-orange-100'}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 py-3 cursor-pointer"
        onClick={() => setExpanded(e => !e)}>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${hasLog ? 'bg-green-400' : 'bg-orange-300'}`} />
          <span className="font-bold text-gray-900">{student.name}</span>
          {student.grade && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{student.grade}</span>}
          {teacher && <span className="text-xs text-blue-500">{teacher.name} T</span>}
          {hasLog && !expanded && (
            <span className="text-xs text-gray-400 truncate max-w-[160px]">{log!.content}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {justSaved && <span className="text-green-500 text-xs font-bold">✓ 저장됨</span>}
          <span className="text-gray-400 text-sm">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* 작성 영역 */}
      {expanded && (
        <div className="px-5 pb-4 border-t border-gray-50">
          <textarea
            rows={3}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="오늘 수업 내용, 진도, 특이사항을 자유롭게 작성하세요"
            className="w-full mt-3 border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          />
          <div className="flex gap-2 mt-2 justify-end">
            {hasLog && (
              <button onClick={onDelete}
                className="text-xs text-red-400 hover:text-red-600 px-3 py-1.5 border border-red-100 rounded-lg hover:bg-red-50 transition">
                삭제
              </button>
            )}
            <button onClick={onSave} disabled={saving || !isDirty}
              className={`px-5 py-1.5 rounded-lg text-sm font-bold transition
                ${saving ? 'bg-gray-100 text-gray-400' : isDirty ? 'bg-blue-700 text-white hover:bg-blue-800' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
              {saving ? '저장 중...' : hasLog ? '수정' : '저장'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
