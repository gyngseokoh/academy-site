'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/components/Toast';

type Student = { id: string; name: string; grade: string | null; teacher_id: string | null; is_active?: boolean };
type Log = { id: string; student_id: string; date: string; log_date?: string; content: string; progress: string | null; notes: string | null };
type Teacher = { id: string; name: string };
type Enrollment = { student_id: string; students?: { id: string; name: string; grade: string } };
type ClassRow = { id: string; name: string; subject: string; teacher_id: string | null; teachers: { id: string; name: string } | null; class_enrollments: Enrollment[] };

type Draft = { content: string; progress: string; notes: string };
type GroupClass = { classId: string; className: string; subject: string; students: Student[] };
type Group = { teacherId: string; teacherName: string; classes: GroupClass[]; total: number; done: number };

function getToday() {
  const kst = new Date(Date.now() + 9 * 3600000);
  return kst.toISOString().slice(0, 10);
}

export default function AllLogsPage() {
  const router = useRouter();
  const { toast, ToastHost } = useToast();
  const [date, setDate] = useState(getToday());
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState('');
  const [myTeacherId, setMyTeacherId] = useState('');
  const [filterTeacher, setFilterTeacher] = useState('');
  const [onlyUnwritten, setOnlyUnwritten] = useState(false);

  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    const token = localStorage.getItem('sb_access_token');
    if (!token) { router.push('/login'); return; }
    const role = localStorage.getItem('sb_role') || '';
    const tid = localStorage.getItem('sb_teacher_id') || '';
    setMyRole(role); setMyTeacherId(tid);
    if (role === 'teacher') setFilterTeacher(tid);
    fetchBase();
  }, []);

  useEffect(() => { if (!loading) fetchLogsForDate(); }, [date, loading]);

  const fetchBase = async () => {
    const [sRes, tRes, cRes] = await Promise.all([
      fetch('/api/admin/students'),
      fetch('/api/admin/teachers'),
      fetch('/api/admin/classes'),
    ]);
    setStudents(await sRes.json());
    setTeachers(await tRes.json());
    setClasses(await cRes.json());
    setLoading(false);
  };

  const fetchLogsForDate = useCallback(async () => {
    const res = await fetch(`/api/admin/student-logs?date=${date}`);
    const data = await res.json();
    const arr: Log[] = Array.isArray(data) ? data : [];
    setLogs(arr);
    const d: Record<string, Draft> = {};
    arr.forEach((l) => { d[l.student_id] = { content: l.content || '', progress: l.progress || '', notes: l.notes || '' }; });
    setDrafts(d);
    setSaved({});
  }, [date]);

  const logByStudent = (sid: string) => logs.find((l) => l.student_id === sid) || null;
  const getDraft = (sid: string): Draft => drafts[sid] ?? { content: '', progress: '', notes: '' };
  const setDraft = (sid: string, patch: Partial<Draft>) =>
    setDrafts((prev) => ({ ...prev, [sid]: { ...getDraft(sid), ...patch } }));

  const handleSave = async (sid: string, teacherId: string | null) => {
    const d = getDraft(sid);
    if (!d.content.trim() && !d.progress.trim() && !d.notes.trim())
      return toast('내용·진도·메모 중 하나는 입력하세요.', 'error');
    setSaving((p) => ({ ...p, [sid]: true }));
    const existing = logByStudent(sid);
    const method = existing ? 'PATCH' : 'POST';
    const body: any = existing
      ? { id: existing.id, content: d.content, progress: d.progress, notes: d.notes, log_date: date }
      : { student_id: sid, log_date: date, content: d.content, progress: d.progress, notes: d.notes, teacher_id: teacherId || undefined };
    await fetch('/api/admin/student-logs', {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    setSaving((p) => ({ ...p, [sid]: false }));
    setSaved((p) => ({ ...p, [sid]: true }));
    setTimeout(() => setSaved((p) => ({ ...p, [sid]: false })), 2000);
    await fetchLogsForDate();
  };

  const handleDelete = async (sid: string) => {
    const existing = logByStudent(sid);
    if (!existing) return;
    if (!confirm('이 일지를 삭제할까요?')) return;
    await fetch(`/api/admin/student-logs?id=${existing.id}`, { method: 'DELETE' });
    setDrafts((prev) => { const n = { ...prev }; delete n[sid]; return n; });
    toast('삭제되었습니다');
    await fetchLogsForDate();
  };

  // ── 선생님 → 반 → 학생 트리 구성 ──
  const buildGroups = (): Group[] => {
    const activeById = new Map<string, Student>();
    students.forEach((s) => { if (s.is_active !== false) activeById.set(s.id, s); });

    const teacherName = (id: string) => teachers.find((t) => t.id === id)?.name ?? '미배정';
    // teacherId -> classId -> studentId[]
    const tree = new Map<string, Map<string, { className: string; subject: string; ids: string[] }>>();
    const enrolled = new Set<string>();

    const ensure = (tid: string, cid: string, cname: string, subject: string) => {
      if (!tree.has(tid)) tree.set(tid, new Map());
      const cm = tree.get(tid)!;
      if (!cm.has(cid)) cm.set(cid, { className: cname, subject, ids: [] });
      return cm.get(cid)!;
    };

    classes.forEach((c) => {
      const tid = c.teacher_id || '미배정';
      (c.class_enrollments || []).forEach((e) => {
        if (!activeById.has(e.student_id)) return;
        enrolled.add(e.student_id);
        ensure(tid, c.id, c.name, c.subject || '').ids.push(e.student_id);
      });
    });

    // 반 미배정 학생 → 담당 선생님 아래 '반 미배정' 버킷
    activeById.forEach((s) => {
      if (enrolled.has(s.id)) return;
      const tid = s.teacher_id || '미배정';
      ensure(tid, '__none__', '반 미배정', '').ids.push(s.id);
    });

    const groups: Group[] = [];
    tree.forEach((cm, tid) => {
      const gClasses: GroupClass[] = [];
      let total = 0, done = 0;
      cm.forEach((c, cid) => {
        const studs = c.ids.map((id) => activeById.get(id)!).filter(Boolean)
          .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
        studs.forEach((s) => { total++; if (logByStudent(s.id)) done++; });
        gClasses.push({ classId: cid, className: c.className, subject: c.subject, students: studs });
      });
      gClasses.sort((a, b) => a.className.localeCompare(b.className, 'ko'));
      groups.push({ teacherId: tid, teacherName: teacherName(tid), classes: gClasses, total, done });
    });
    // 미배정 그룹은 마지막으로
    groups.sort((a, b) => {
      if (a.teacherId === '미배정') return 1;
      if (b.teacherId === '미배정') return -1;
      return a.teacherName.localeCompare(b.teacherName, 'ko');
    });
    return groups;
  };

  let groups = buildGroups();
  if (myRole === 'teacher') groups = groups.filter((g) => g.teacherId === myTeacherId);
  else if (filterTeacher) groups = groups.filter((g) => g.teacherId === filterTeacher);

  const grandTotal = groups.reduce((a, g) => a + g.total, 0);
  const grandDone = groups.reduce((a, g) => a + g.done, 0);

  const toggleGroup = (tid: string) =>
    setCollapsedGroups((prev) => { const n = new Set(prev); n.has(tid) ? n.delete(tid) : n.add(tid); return n; });

  return (
    <main className="min-h-screen bg-gray-50">
      {ToastHost}
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">📓 학생 일지 작성</h1>
        <a href={myRole === 'teacher' ? '/admin/teacher' : '/admin'} className="text-sm hover:underline">
          ← {myRole === 'teacher' ? '내 페이지' : '관리자 홈'}
        </a>
      </nav>

      <div className="max-w-3xl mx-auto py-8 px-6">
        {/* 컨트롤 */}
        <div className="flex gap-3 items-center mb-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white border rounded-xl px-4 py-2 shadow-sm">
            <span className="text-gray-400 text-sm">📅</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="text-sm font-bold text-gray-800 focus:outline-none" />
          </div>
          {myRole !== 'teacher' && (
            <select value={filterTeacher} onChange={(e) => setFilterTeacher(e.target.value)}
              className="border rounded-xl px-3 py-2 text-sm bg-white shadow-sm focus:outline-none">
              <option value="">전체 선생님</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}
          <label className="flex items-center gap-2 text-sm text-gray-600 bg-white border rounded-xl px-3 py-2 shadow-sm cursor-pointer">
            <input type="checkbox" checked={onlyUnwritten} onChange={(e) => setOnlyUnwritten(e.target.checked)} className="w-4 h-4 accent-orange-500" />
            미작성만 보기
          </label>
          <div className="ml-auto text-sm text-gray-500">
            전체 <span className="text-green-600 font-bold">{grandDone}</span>/{grandTotal}명 작성
          </div>
        </div>

        {/* 전체 진행률 바 */}
        {grandTotal > 0 && (
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-6">
            <div className="h-full bg-green-500 transition-all" style={{ width: `${Math.round((grandDone / grandTotal) * 100)}%` }} />
          </div>
        )}

        {loading ? (
          <p className="text-center text-gray-400 py-20">불러오는 중...</p>
        ) : groups.length === 0 ? (
          <p className="text-center text-gray-400 py-20">표시할 학생이 없습니다.</p>
        ) : (
          <div className="space-y-5">
            {groups.map((g) => {
              const collapsed = collapsedGroups.has(g.teacherId);
              const pct = g.total > 0 ? Math.round((g.done / g.total) * 100) : 0;
              const allDone = g.total > 0 && g.done === g.total;
              return (
                <div key={g.teacherId} className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                  {/* 선생님 헤더 */}
                  <button onClick={() => toggleGroup(g.teacherId)}
                    className="w-full flex items-center justify-between px-5 py-3 bg-gradient-to-r from-blue-50 to-white hover:from-blue-100">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm">{collapsed ? '▶' : '▼'}</span>
                      <span className="font-bold text-gray-800">{g.teacherName} 선생님</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${allDone ? 'bg-green-100 text-green-700' : g.done === 0 ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-700'}`}>
                        {g.done}/{g.total} 작성
                      </span>
                    </div>
                    <div className="flex items-center gap-2 w-32">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full ${allDone ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                    </div>
                  </button>

                  {!collapsed && (
                    <div className="px-3 py-3 space-y-4">
                      {g.classes.map((c) => {
                        const list = onlyUnwritten ? c.students.filter((s) => !logByStudent(s.id)) : c.students;
                        if (list.length === 0) return null;
                        const cDone = c.students.filter((s) => logByStudent(s.id)).length;
                        return (
                          <div key={c.classId}>
                            <div className="flex items-center gap-2 px-2 mb-1.5">
                              <span className="text-xs font-bold text-gray-600">{c.className}</span>
                              {c.subject && <span className="text-[10px] text-gray-400">{c.subject}</span>}
                              <span className="text-[10px] text-gray-400">· {cDone}/{c.students.length}</span>
                            </div>
                            <div className="space-y-2">
                              {list.map((s) => (
                                <StudentLogCard
                                  key={s.id}
                                  student={s}
                                  log={logByStudent(s.id)}
                                  draft={getDraft(s.id)}
                                  setDraft={(patch) => setDraft(s.id, patch)}
                                  expanded={expanded[s.id] ?? false}
                                  toggleExpand={() => setExpanded((p) => ({ ...p, [s.id]: !(p[s.id] ?? false) }))}
                                  onSave={() => handleSave(s.id, g.teacherId === '미배정' ? s.teacher_id : g.teacherId)}
                                  onDelete={() => handleDelete(s.id)}
                                  saving={!!saving[s.id]}
                                  justSaved={!!saved[s.id]}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
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

// ── 모듈 레벨 카드 (포커스 버그 방지) ──
function StudentLogCard({
  student, log, draft, setDraft, expanded, toggleExpand, onSave, onDelete, saving, justSaved,
}: {
  student: Student;
  log: Log | null;
  draft: Draft;
  setDraft: (patch: Partial<Draft>) => void;
  expanded: boolean;
  toggleExpand: () => void;
  onSave: () => void;
  onDelete: () => void;
  saving: boolean;
  justSaved: boolean;
}) {
  const hasLog = !!log;
  const open = expanded || !hasLog; // 미작성이면 기본 펼침
  const isDirty = !log
    ? !!(draft.content || draft.progress || draft.notes)
    : draft.content !== (log.content || '') || draft.progress !== (log.progress || '') || draft.notes !== (log.notes || '');
  const inputCls = 'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400';

  return (
    <div className={`rounded-xl border transition ${hasLog ? 'border-green-100 bg-green-50/30' : 'border-orange-100 bg-orange-50/30'}`}>
      <div className="flex items-center justify-between px-4 py-2.5 cursor-pointer" onClick={toggleExpand}>
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${hasLog ? 'bg-green-500' : 'bg-orange-400'}`} />
          <span className="font-bold text-gray-900 text-sm">{student.name}</span>
          {student.grade && <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{student.grade}</span>}
          {hasLog && !open && <span className="text-xs text-gray-400 truncate">{log!.progress || log!.content}</span>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {justSaved && <span className="text-green-600 text-xs font-bold">✓ 저장됨</span>}
          {!hasLog && <span className="text-orange-500 text-xs font-bold">미작성</span>}
          <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {open && (
        <div className="px-4 pb-3 space-y-2 border-t border-white">
          <input value={draft.progress} onChange={(e) => setDraft({ progress: e.target.value })}
            placeholder="진도 (예: 수학 3-2 이차방정식)" className={`${inputCls} mt-2`} />
          <textarea rows={2} value={draft.content} onChange={(e) => setDraft({ content: e.target.value })}
            placeholder="수업 내용 / 특이사항" className={`${inputCls} resize-none`} />
          <input value={draft.notes} onChange={(e) => setDraft({ notes: e.target.value })}
            placeholder="메모 (숙제, 다음 수업 준비 등)" className={inputCls} />
          <div className="flex gap-2 justify-end">
            {hasLog && (
              <button onClick={onDelete}
                className="text-xs text-red-400 hover:text-red-600 px-3 py-1.5 border border-red-100 rounded-lg hover:bg-red-50">삭제</button>
            )}
            <button onClick={onSave} disabled={saving || !isDirty}
              className={`px-5 py-1.5 rounded-lg text-sm font-bold transition
                ${saving || !isDirty ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-700 text-white hover:bg-blue-800'}`}>
              {saving ? '저장 중...' : hasLog ? '수정' : '저장'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
