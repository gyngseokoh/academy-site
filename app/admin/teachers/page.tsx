'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Teacher = {
  id: string;
  name: string;
  subject: string;
  bio: string | null;
  user_id: string | null;
  role: string | null;
};

export default function TeachersManagePage() {
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  // 추가 폼
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', subject: '', bio: '', sort_order: '' });
  const [addLoading, setAddLoading] = useState(false);

  // 수정 모달
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', subject: '', bio: '', sort_order: '' });

  // 계정 연결 모달
  const [linkId, setLinkId] = useState<string | null>(null);
  const [linkEmail, setLinkEmail] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState('');

  const [myRole, setMyRole] = useState('');

  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('sb_access_token')
      : '';

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    setMyRole(localStorage.getItem('sb_role') || 'director');
    fetchTeachers();
  }, []);

  // 현재 로그인 계정이 해당 선생님 계정을 수정할 수 있는지
  // 원장은 모두 가능 / 부원장은 원장(director) 계정 수정 불가
  const canModify = (t: Teacher) => {
    if (myRole === 'director') return true;
    return t.role !== 'director';
  };

  const roleLabel = (role: string | null) => {
    if (role === 'director') return { text: '원장', cls: 'bg-purple-100 text-purple-700' };
    if (role === 'vice_director') return { text: '부원장', cls: 'bg-blue-100 text-blue-700' };
    return { text: '선생님', cls: 'bg-gray-100 text-gray-600' };
  };

  const fetchTeachers = async () => {
    const res = await fetch('/api/admin/teachers');
    const data = await res.json();
    setTeachers(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name || !addForm.subject) return alert('이름과 과목을 입력해주세요.');
    setAddLoading(true);
    const body = {
      ...addForm,
      sort_order: addForm.sort_order ? parseInt(addForm.sort_order) : 99,
    };
    const res = await fetch('/api/admin/teachers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setAddForm({ name: '', subject: '', bio: '', sort_order: '' });
      setShowAdd(false);
      fetchTeachers();
    } else {
      alert('추가 실패. 다시 시도해주세요.');
    }
    setAddLoading(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    const body = {
      id: editId,
      ...editForm,
      sort_order: editForm.sort_order ? parseInt(editForm.sort_order) : 99,
    };
    await fetch('/api/admin/teachers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setEditId(null);
    fetchTeachers();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 선생님을 삭제할까요? 관련 슬롯 데이터도 확인하세요.`)) return;
    await fetch(`/api/admin/teachers?id=${id}`, { method: 'DELETE' });
    fetchTeachers();
  };

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkId || !linkEmail) return;
    setLinkLoading(true);
    setLinkError('');
    const res = await fetch('/api/admin/link-teacher', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teacher_id: linkId, email: linkEmail }),
    });
    const data = await res.json();
    if (res.ok) {
      setLinkId(null);
      setLinkEmail('');
      fetchTeachers();
      alert('계정이 연결되었습니다!');
    } else {
      setLinkError(data.error || '연결 실패');
    }
    setLinkLoading(false);
  };

  const handleUnlink = async (id: string) => {
    if (!confirm('계정 연결을 해제할까요?')) return;
    await fetch('/api/admin/teachers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, user_id: null }),
    });
    fetchTeachers();
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">👩‍🏫 선생님 관리</h1>
        <a href="/admin" className="text-sm hover:underline">← 관리자 홈</a>
      </nav>

      <div className="max-w-4xl mx-auto py-8 px-6">
        {/* 추가 버튼 */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-500 text-sm">총 {teachers.length}명</p>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="bg-blue-700 text-white px-5 py-2 rounded-full font-bold text-sm hover:bg-blue-800"
          >
            + 선생님 추가
          </button>
        </div>

        {/* 추가 폼 */}
        {showAdd && (
          <form
            onSubmit={handleAdd}
            className="bg-white rounded-2xl shadow-sm border p-6 mb-6"
          >
            <h3 className="font-bold text-gray-800 mb-4">새 선생님 추가</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">이름 *</label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="홍길동"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">과목 *</label>
                <input
                  type="text"
                  required
                  value={addForm.subject}
                  onChange={(e) => setAddForm({ ...addForm, subject: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="수학, 과학 등"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 block mb-1">소개 (선택)</label>
              <textarea
                rows={2}
                value={addForm.bio}
                onChange={(e) => setAddForm({ ...addForm, bio: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="선생님 소개 문구"
              />
            </div>
            <div className="mb-4 w-32">
              <label className="text-sm font-medium text-gray-700 block mb-1">순번 (선택)</label>
              <input
                type="number"
                value={addForm.sort_order}
                onChange={(e) => setAddForm({ ...addForm, sort_order: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1, 2, 3..."
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={addLoading}
                className="bg-blue-700 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-blue-800 disabled:opacity-50"
              >
                {addLoading ? '추가 중...' : '추가'}
              </button>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="border px-6 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                취소
              </button>
            </div>
          </form>
        )}

        {/* 선생님 목록 */}
        {loading ? (
          <p className="text-center text-gray-400 py-20">불러오는 중...</p>
        ) : teachers.length === 0 ? (
          <p className="text-center text-gray-400 py-20">등록된 선생님이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {teachers.map((t) => (
              <div key={t.id} className="bg-white rounded-2xl shadow-sm border p-5">
                {editId === t.id ? (
                  // 수정 폼
                  <form onSubmit={handleEdit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="이름"
                      />
                      <input
                        type="text"
                        value={editForm.subject}
                        onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                        className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="과목"
                      />
                    </div>
                    <textarea
                      rows={2}
                      value={editForm.bio}
                      onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                      placeholder="소개"
                    />
                    <div className="mb-3 w-32">
                      <input
                        type="number"
                        value={editForm.sort_order}
                        onChange={(e) => setEditForm({ ...editForm, sort_order: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="순번 (1, 2...)"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold">저장</button>
                      <button type="button" onClick={() => setEditId(null)} className="border px-4 py-1.5 rounded-lg text-sm text-gray-600">취소</button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-gray-800 text-lg">{t.name}</span>
                        {/* role 배지 */}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${roleLabel(t.role).cls}`}>
                          {roleLabel(t.role).text}
                        </span>
                        <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full font-medium">{t.subject}</span>
                        {t.user_id ? (
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium">✓ 계정연결</span>
                        ) : (
                          <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">미연결</span>
                        )}
                      </div>
                      {t.bio && <p className="text-gray-500 text-sm">{t.bio}</p>}
                      {/* 보호된 계정 안내 */}
                      {!canModify(t) && (
                        <p className="text-xs text-orange-500 mt-1">🔒 원장 계정은 수정할 수 없습니다</p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4 flex-shrink-0">
                      {canModify(t) && (
                        <>
                          <button
                            onClick={() => {
                              setEditId(t.id);
                              setEditForm({ name: t.name, subject: t.subject, bio: t.bio || '', sort_order: String((t as any).sort_order ?? '') });
                            }}
                            className="border px-3 py-1.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                          >
                            수정
                          </button>
                          {t.user_id ? (
                            <button
                              onClick={() => handleUnlink(t.id)}
                              className="border px-3 py-1.5 rounded-lg text-sm text-orange-600 hover:bg-orange-50"
                            >
                              연결해제
                            </button>
                          ) : (
                            <button
                              onClick={() => { setLinkId(t.id); setLinkEmail(''); setLinkError(''); }}
                              className="bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-800"
                            >
                              계정연결
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(t.id, t.name)}
                            className="border px-3 py-1.5 rounded-lg text-sm text-red-500 hover:bg-red-50"
                          >
                            삭제
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 계정 연결 모달 */}
      {linkId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
            <h3 className="font-bold text-gray-800 text-lg mb-2">계정 연결</h3>
            <p className="text-gray-500 text-sm mb-6">
              선생님이 로그인할 이메일을 입력하세요.<br />
              Supabase에 미리 계정이 생성되어 있어야 합니다.
            </p>
            <form onSubmit={handleLink}>
              <input
                type="email"
                required
                value={linkEmail}
                onChange={(e) => setLinkEmail(e.target.value)}
                className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                placeholder="teacher@example.com"
              />
              {linkError && <p className="text-red-500 text-sm mb-3">{linkError}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={linkLoading}
                  className="flex-1 bg-blue-700 text-white py-3 rounded-lg font-bold hover:bg-blue-800 disabled:opacity-50"
                >
                  {linkLoading ? '연결 중...' : '연결'}
                </button>
                <button
                  type="button"
                  onClick={() => setLinkId(null)}
                  className="flex-1 border py-3 rounded-lg text-gray-600"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
