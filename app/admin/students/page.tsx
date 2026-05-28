'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Student = {
  id: string;
  name: string;
  school: string | null;
  grade: string | null;
  phone: string | null;
  parent_name: string | null;
  teacher_id: string | null;
  subjects: string | null;
  memo: string | null;
  is_active: boolean;
  teachers?: { name: string; subject: string } | null;
};

const GRADES = ['초4', '초5', '초6', '중1', '중2', '중3', '고1', '고2', '고3', '기타'];

const emptyForm = {
  name: '',
  school: '',
  grade: '',
  phone: '',
  parent_name: '',
  teacher_id: '',
  subjects: '',
  memo: '',
  is_active: true,
};

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('active');
  const [myRole, setMyRole] = useState('');
  const [myTeacherId, setMyTeacherId] = useState('');

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ ...emptyForm });
  const [addLoading, setAddLoading] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ ...emptyForm });

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
    const [studentsRes, teachersRes] = await Promise.all([
      fetch('/api/admin/students'),
      fetch('/api/admin/teachers'),
    ]);
    const studentsData = await studentsRes.json();
    const teachersData = await teachersRes.json();
    setStudents(Array.isArray(studentsData) ? studentsData : []);
    setTeachers(Array.isArray(teachersData) ? teachersData : []);
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name) return alert('이름을 입력해주세요.');
    setAddLoading(true);
    const body: any = { ...addForm };
    if (!body.teacher_id) delete body.teacher_id;
    const res = await fetch('/api/admin/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setAddForm({ ...emptyForm });
      setShowAdd(false);
      fetchAll();
    } else {
      alert('추가 실패. 다시 시도해주세요.');
    }
    setAddLoading(false);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    const body: any = { id: editId, ...editForm };
    if (!body.teacher_id) body.teacher_id = null;
    await fetch('/api/admin/students', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setEditId(null);
    fetchAll();
  };

  const toggleActive = async (s: Student) => {
    await fetch('/api/admin/students', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, is_active: !s.is_active }),
    });
    fetchAll();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 학생을 삭제할까요? 관련 일지도 삭제됩니다.`)) return;
    await fetch(`/api/admin/students?id=${id}`, { method: 'DELETE' });
    fetchAll();
  };

  const filtered = students.filter((s) => {
    const matchSearch =
      s.name.includes(search) ||
      (s.school || '').includes(search) ||
      (s.phone || '').includes(search);
    const matchActive =
      filterActive === 'all' ||
      (filterActive === 'active' && s.is_active) ||
      (filterActive === 'inactive' && !s.is_active);
    // 선생님 계정은 본인 담당 학생만 표시
    const matchTeacher =
      myRole !== 'teacher' || s.teacher_id === myTeacherId;
    return matchSearch && matchActive && matchTeacher;
  });

  const FormFields = ({
    form,
    setForm,
  }: {
    form: typeof emptyForm;
    setForm: (f: typeof emptyForm) => void;
  }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">이름 *</label>
        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="홍길동"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">학년</label>
        <select
          value={form.grade}
          onChange={(e) => setForm({ ...form, grade: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">선택</option>
          {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">학교</label>
        <input
          type="text"
          value={form.school}
          onChange={(e) => setForm({ ...form, school: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="○○중학교"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">연락처 (학부모)</label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="010-0000-0000"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">보호자 이름</label>
        <input
          type="text"
          value={form.parent_name}
          onChange={(e) => setForm({ ...form, parent_name: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="홍부모"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">담당 선생님</label>
        <select
          value={form.teacher_id}
          onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">미배정</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">수강 과목</label>
        <input
          type="text"
          value={form.subjects}
          onChange={(e) => setForm({ ...form, subjects: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="수학, 과학"
        />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">메모</label>
        <input
          type="text"
          value={form.memo}
          onChange={(e) => setForm({ ...form, memo: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="특이사항 등"
        />
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">👨‍🎓 학생 관리</h1>
        <a
          href={myRole === 'teacher' ? '/admin/teacher' : '/admin'}
          className="text-sm hover:underline"
        >
          ← {myRole === 'teacher' ? '내 페이지' : '관리자 홈'}
        </a>
      </nav>

      <div className="max-w-5xl mx-auto py-8 px-6">
        {/* 상단 컨트롤 */}
        <div className="flex flex-wrap gap-3 items-center justify-between mb-6">
          <div className="flex gap-2">
            {([['all', '전체'], ['active', '재원중'], ['inactive', '퇴원']] as const).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilterActive(val)}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition
                  ${filterActive === val ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 border hover:border-blue-400'}`}
              >
                {label} ({val === 'all' ? students.length : val === 'active' ? students.filter(s => s.is_active).length : students.filter(s => !s.is_active).length})
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-1 md:flex-none">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 md:w-48 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="이름, 학교, 연락처 검색"
            />
            <button
              onClick={() => { setShowAdd(!showAdd); setEditId(null); }}
              className="bg-blue-700 text-white px-5 py-2 rounded-full font-bold text-sm hover:bg-blue-800 whitespace-nowrap"
            >
              + 학생 추가
            </button>
          </div>
        </div>

        {/* 추가 폼 */}
        {showAdd && (
          <form onSubmit={handleAdd} className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
            <h3 className="font-bold text-gray-800 mb-4">새 학생 등록</h3>
            <FormFields form={addForm} setForm={setAddForm} />
            <div className="flex gap-2 mt-4">
              <button
                type="submit"
                disabled={addLoading}
                className="bg-blue-700 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-blue-800 disabled:opacity-50"
              >
                {addLoading ? '추가 중...' : '등록'}
              </button>
              <button type="button" onClick={() => setShowAdd(false)} className="border px-6 py-2 rounded-lg text-sm text-gray-600">
                취소
              </button>
            </div>
          </form>
        )}

        {/* 학생 목록 */}
        {loading ? (
          <p className="text-center text-gray-400 py-20">불러오는 중...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-20">학생이 없습니다.</p>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 border-b text-xs font-bold text-gray-500">
              <div className="col-span-2">이름</div>
              <div className="col-span-1">학년</div>
              <div className="col-span-2">학교</div>
              <div className="col-span-2">연락처</div>
              <div className="col-span-2">담당 선생님</div>
              <div className="col-span-1">상태</div>
              <div className="col-span-2">액션</div>
            </div>

            {filtered.map((s) => (
              <div key={s.id} className="border-b last:border-b-0">
                {editId === s.id ? (
                  <form onSubmit={handleEdit} className="p-4">
                    <FormFields form={editForm} setForm={setEditForm} />
                    <div className="flex gap-2 mt-3">
                      <button type="submit" className="bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold">저장</button>
                      <button type="button" onClick={() => setEditId(null)} className="border px-4 py-1.5 rounded-lg text-sm text-gray-600">취소</button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-gray-50">
                    <div className="col-span-2 font-medium text-gray-800 text-sm">{s.name}</div>
                    <div className="col-span-1 text-gray-500 text-sm">{s.grade || '-'}</div>
                    <div className="col-span-2 text-gray-500 text-sm truncate">{s.school || '-'}</div>
                    <div className="col-span-2 text-gray-500 text-sm">{s.phone || '-'}</div>
                    <div className="col-span-2 text-sm">
                      {s.teachers ? (
                        <span className="text-blue-600">{s.teachers.name}</span>
                      ) : (
                        <span className="text-gray-300">미배정</span>
                      )}
                    </div>
                    <div className="col-span-1">
                      <button
                        onClick={() => toggleActive(s)}
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                      >
                        {s.is_active ? '재원' : '퇴원'}
                      </button>
                    </div>
                    <div className="col-span-2 flex gap-1">
                      <button
                        onClick={() => router.push(`/admin/students/${s.id}/logs`)}
                        className="border px-2 py-1 rounded-lg text-xs text-blue-600 hover:bg-blue-50"
                      >
                        일지
                      </button>
                      <button
                        onClick={() => {
                          setEditId(s.id);
                          setShowAdd(false);
                          setEditForm({
                            name: s.name,
                            school: s.school || '',
                            grade: s.grade || '',
                            phone: s.phone || '',
                            parent_name: s.parent_name || '',
                            teacher_id: s.teacher_id || '',
                            subjects: s.subjects || '',
                            memo: s.memo || '',
                            is_active: s.is_active,
                          });
                        }}
                        className="border px-2 py-1 rounded-lg text-xs text-gray-600 hover:bg-gray-50"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(s.id, s.name)}
                        className="border px-2 py-1 rounded-lg text-xs text-red-500 hover:bg-red-50"
                      >
                        삭제
                      </button>
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
