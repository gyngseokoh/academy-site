'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

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

export default function StudentLogsPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;

  const [student, setStudent] = useState<any>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    log_date: new Date().toISOString().slice(0, 10),
    content: '',
    progress: '',
    notes: '',
  });
  const [addLoading, setAddLoading] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    log_date: '',
    content: '',
    progress: '',
    notes: '',
  });

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('sb_access_token')
      : '';

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    fetchAll();
  }, [studentId]);

  const fetchAll = async () => {
    const [studentsData, logsData] = await Promise.all([
      fetch('/api/admin/students').then((r) => r.json()),
      fetch(`/api/admin/student-logs?student_id=${studentId}`).then((r) => r.json()),
    ]);

    const found = Array.isArray(studentsData)
      ? studentsData.find((s: any) => s.id === studentId)
      : null;
    setStudent(found || null);
    setLogs(Array.isArray(logsData) ? logsData : []);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.content.trim() && !addForm.progress.trim())
      return alert('수업 내용 또는 진도를 입력해주세요.');
    setAddLoading(true);

    const res = await fetch('/api/admin/student-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: studentId,
        log_date: addForm.log_date,
        content: addForm.content,
        progress: addForm.progress,
        notes: addForm.notes,
      }),
    });

    if (res.ok) {
      setAddForm({
        log_date: new Date().toISOString().slice(0, 10),
        content: '',
        progress: '',
        notes: '',
      });
      setShowAdd(false);
      fetchAll();
    } else {
      alert('일지 저장 실패. 다시 시도해주세요.');
    }
    setAddLoading(false);
  };

  const handleEdit = async (id: string) => {
    await fetch('/api/admin/student-logs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...editForm }),
    });
    setEditId(null);
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 일지를 삭제할까요?')) return;
    await fetch(`/api/admin/student-logs?id=${id}`, { method: 'DELETE' });
    fetchAll();
  };

  const formatDate = (d: string) => {
    if (!d) return '-';
    const [y, m, day] = d.split('-');
    return `${y}년 ${parseInt(m)}월 ${parseInt(day)}일`;
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">
          📓 {student ? `${student.name} 학생 일지` : '학생 일지'}
        </h1>
        <div className="flex gap-4 text-sm">
          <button onClick={() => router.back()} className="hover:underline">← 돌아가기</button>
          <a href="/admin" className="hover:underline">관리자 홈</a>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto py-8 px-6">
        {/* 학생 정보 요약 */}
        {student && (
          <div className="bg-white rounded-2xl shadow-sm border p-5 mb-6 flex items-center gap-4">
            <div className="text-4xl">👨‍🎓</div>
            <div className="flex-1">
              <h2 className="font-bold text-xl text-gray-800">{student.name}</h2>
              <p className="text-gray-500 text-sm">
                {[student.grade, student.school, student.subjects].filter(Boolean).join(' · ')}
              </p>
              {student.teachers && (
                <p className="text-blue-600 text-sm mt-0.5">
                  담당: {student.teachers.name} 선생님
                </p>
              )}
            </div>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="bg-blue-700 text-white px-5 py-2 rounded-full font-bold text-sm hover:bg-blue-800"
            >
              + 일지 작성
            </button>
          </div>
        )}

        {/* 일지 작성 폼 */}
        {showAdd && (
          <form onSubmit={handleAdd} className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
            <h3 className="font-bold text-gray-800 mb-4">수업 일지 작성</h3>

            <div className="mb-3">
              <label className="text-xs font-medium text-gray-600 block mb-1">날짜</label>
              <input
                type="date"
                value={addForm.log_date}
                onChange={(e) => setAddForm({ ...addForm, log_date: e.target.value })}
                className="w-48 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-3">
              <label className="text-xs font-medium text-gray-600 block mb-1">
                수업 내용
              </label>
              <textarea
                rows={4}
                value={addForm.content}
                onChange={(e) => setAddForm({ ...addForm, content: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="오늘 배운 내용, 활동 등을 기록하세요."
              />
            </div>

            <div className="mb-3">
              <label className="text-xs font-medium text-gray-600 block mb-1">
                진도 <span className="text-gray-400 font-normal">(예: 수학 3-2 이차방정식)</span>
              </label>
              <input
                type="text"
                value={addForm.progress}
                onChange={(e) => setAddForm({ ...addForm, progress: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="오늘 진도"
              />
            </div>

            <div className="mb-4">
              <label className="text-xs font-medium text-gray-600 block mb-1">
                메모 / 특이사항
              </label>
              <input
                type="text"
                value={addForm.notes}
                onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="숙제, 다음 수업 준비사항 등"
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
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="border px-6 py-2 rounded-lg text-sm text-gray-600"
              >
                취소
              </button>
            </div>
          </form>
        )}

        {/* 일지 목록 */}
        {loading ? (
          <p className="text-center text-gray-400 py-20">불러오는 중...</p>
        ) : logs.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-gray-400">작성된 일지가 없습니다.</p>
            <button
              onClick={() => setShowAdd(true)}
              className="mt-4 text-blue-600 text-sm hover:underline"
            >
              첫 번째 일지 작성하기
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-500 text-sm">총 {logs.length}개의 일지</p>
            {logs.map((log) => (
              <div key={log.id} className="bg-white rounded-2xl shadow-sm border p-5">
                {editId === log.id ? (
                  /* 수정 폼 */
                  <div>
                    <input
                      type="date"
                      value={editForm.log_date}
                      onChange={(e) => setEditForm({ ...editForm, log_date: e.target.value })}
                      className="w-48 border rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <textarea
                      rows={4}
                      placeholder="수업 내용"
                      value={editForm.content}
                      onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="진도"
                      value={editForm.progress}
                      onChange={(e) => setEditForm({ ...editForm, progress: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="메모/특이사항"
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(log.id)}
                        className="bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold"
                      >
                        저장
                      </button>
                      <button
                        onClick={() => setEditId(null)}
                        className="border px-4 py-1.5 rounded-lg text-sm text-gray-600"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-3">
                      <span className="font-bold text-gray-800">
                        {formatDate(log.log_date)}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditId(log.id);
                            setEditForm({
                              log_date: log.log_date,
                              content: log.content || '',
                              progress: log.progress || '',
                              notes: log.notes || '',
                            });
                          }}
                          className="border px-3 py-1 rounded-lg text-xs text-gray-500 hover:bg-gray-50"
                        >
                          수정
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
                      <div className="mb-2 flex items-start gap-2">
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded whitespace-nowrap">진도</span>
                        <p className="text-sm text-gray-700">{log.progress}</p>
                      </div>
                    )}

                    {log.content && (
                      <div className="mb-2 flex items-start gap-2">
                        <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded whitespace-nowrap">내용</span>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{log.content}</p>
                      </div>
                    )}

                    {log.notes && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded whitespace-nowrap">메모</span>
                        <p className="text-sm text-gray-600">{log.notes}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
