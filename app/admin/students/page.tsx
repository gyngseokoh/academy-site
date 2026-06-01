'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';
import { useToast } from '@/app/components/Toast';

type Teacher = { id: string; name: string; subject?: string };
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

type FormState = {
  name: string;
  school: string;
  grade: string;
  phone: string;
  parent_name: string;
  teacher_id: string;
  subjects: string;
  memo: string;
  is_active: boolean;
};

const emptyForm: FormState = {
  name: '', school: '', grade: '', phone: '', parent_name: '',
  teacher_id: '', subjects: '', memo: '', is_active: true,
};

const inputCls =
  'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

// ── 모듈 레벨 컴포넌트 (포커스 버그 방지: 렌더마다 재마운트되지 않음) ──
function StudentFormFields({
  form, setForm, teachers,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  teachers: Teacher[];
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">이름 *</label>
        <input type="text" required value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className={inputCls} placeholder="홍길동" />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">학년</label>
        <select value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} className={inputCls}>
          <option value="">선택</option>
          {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">학교</label>
        <input type="text" value={form.school}
          onChange={(e) => setForm({ ...form, school: e.target.value })}
          className={inputCls} placeholder="○○중학교" />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">연락처 (학부모)</label>
        <input type="tel" value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className={inputCls} placeholder="010-0000-0000" />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">보호자 이름</label>
        <input type="text" value={form.parent_name}
          onChange={(e) => setForm({ ...form, parent_name: e.target.value })}
          className={inputCls} placeholder="홍부모" />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">담당 선생님</label>
        <select value={form.teacher_id} onChange={(e) => setForm({ ...form, teacher_id: e.target.value })} className={inputCls}>
          <option value="">미배정</option>
          {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}{t.subject ? ` (${t.subject})` : ''}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">수강 과목</label>
        <input type="text" value={form.subjects}
          onChange={(e) => setForm({ ...form, subjects: e.target.value })}
          className={inputCls} placeholder="수학, 과학" />
      </div>
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">메모</label>
        <input type="text" value={form.memo}
          onChange={(e) => setForm({ ...form, memo: e.target.value })}
          className={inputCls} placeholder="특이사항 등" />
      </div>
    </div>
  );
}

type RowDraft = { key: number; name: string; grade: string; school: string; phone: string; parent_name: string; teacher_id: string; subjects: string };
const emptyRow = (key: number): RowDraft => ({ key, name: '', grade: '', school: '', phone: '', parent_name: '', teacher_id: '', subjects: '' });

export default function StudentsPage() {
  const router = useRouter();
  const { toast, ToastHost } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('active');
  const [myRole, setMyRole] = useState('');
  const [myTeacherId, setMyTeacherId] = useState('');

  // 추가 패널: 'none' | 'single' | 'multi' | 'excel'
  const [addMode, setAddMode] = useState<'none' | 'single' | 'multi' | 'excel'>('none');
  const [addForm, setAddForm] = useState<FormState>({ ...emptyForm });
  const [addLoading, setAddLoading] = useState(false);

  // 여러 행 입력
  const [rows, setRows] = useState<RowDraft[]>([emptyRow(1), emptyRow(2), emptyRow(3)]);
  const rowKeyRef = useState(() => ({ v: 4 }))[0];

  // 엑셀 가져오기 미리보기
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importFileName, setImportFileName] = useState('');

  // 편집
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<FormState>({ ...emptyForm });

  // 다중 선택
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkTeacher, setBulkTeacher] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('sb_access_token') : '';

  useEffect(() => {
    if (!token) { router.push('/login'); return; }
    setMyRole(localStorage.getItem('sb_role') || '');
    setMyTeacherId(localStorage.getItem('sb_teacher_id') || '');
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
    setSelected(new Set());
    setLoading(false);
  };

  const teacherIdByName = (name: string): string => {
    const t = teachers.find((t) => t.name === String(name).trim());
    return t ? t.id : '';
  };

  // ── 단일 추가 ──
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim()) return toast('이름을 입력해주세요.', 'error');
    setAddLoading(true);
    const body: any = { ...addForm };
    if (!body.teacher_id) delete body.teacher_id;
    const res = await fetch('/api/admin/students', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    if (res.ok) {
      setAddForm({ ...emptyForm }); setAddMode('none'); toast('학생이 등록되었습니다');
      fetchAll();
    } else { toast('추가 실패. 다시 시도해주세요.', 'error'); }
    setAddLoading(false);
  };

  // ── 여러 행 일괄 추가 ──
  const addRow = () => { setRows((r) => [...r, emptyRow(++rowKeyRef.v)]); };
  const removeRow = (key: number) => setRows((r) => r.filter((x) => x.key !== key));
  const updateRow = (key: number, field: keyof RowDraft, val: string) =>
    setRows((r) => r.map((x) => (x.key === key ? { ...x, [field]: val } : x)));

  const handleMultiSave = async () => {
    const valid = rows.filter((r) => r.name.trim());
    if (valid.length === 0) return toast('이름이 입력된 행이 없습니다.', 'error');
    setAddLoading(true);
    const payload = valid.map((r) => ({
      name: r.name.trim(),
      grade: r.grade || null,
      school: r.school || null,
      phone: r.phone || null,
      parent_name: r.parent_name || null,
      teacher_id: r.teacher_id || null,
      subjects: r.subjects || null,
      is_active: true,
    }));
    const res = await fetch('/api/admin/students', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    if (res.ok) {
      toast(`${valid.length}명 등록 완료`);
      setRows([emptyRow(1), emptyRow(2), emptyRow(3)]); rowKeyRef.v = 4;
      setAddMode('none'); fetchAll();
    } else { toast('일괄 등록 실패', 'error'); }
    setAddLoading(false);
  };

  // ── 엑셀 양식 다운로드 ──
  const downloadTemplate = () => {
    const header = ['이름', '학년', '학교', '연락처', '보호자이름', '담당선생님', '수강과목'];
    const example = ['홍길동', '중2', '당산중', '010-1234-5678', '홍부모', teachers[0]?.name ?? '', '수학, 과학'];
    const ws = XLSX.utils.aoa_to_sheet([header, example]);
    ws['!cols'] = header.map(() => ({ wch: 14 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '학생목록');
    XLSX.writeFile(wb, '학생등록_양식.xlsx');
  };

  // ── 엑셀/CSV 업로드 → 미리보기 ──
  const handleFile = async (file: File) => {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
    const mapped = json
      .map((r) => ({
        name: String(r['이름'] ?? r['name'] ?? '').trim(),
        grade: String(r['학년'] ?? r['grade'] ?? '').trim(),
        school: String(r['학교'] ?? r['school'] ?? '').trim(),
        phone: String(r['연락처'] ?? r['phone'] ?? '').trim(),
        parent_name: String(r['보호자이름'] ?? r['보호자'] ?? r['parent_name'] ?? '').trim(),
        teacher_name: String(r['담당선생님'] ?? r['선생님'] ?? '').trim(),
        subjects: String(r['수강과목'] ?? r['과목'] ?? r['subjects'] ?? '').trim(),
      }))
      .filter((r) => r.name);
    setImportRows(mapped);
    setImportFileName(file.name);
    if (mapped.length === 0) toast('이름이 있는 행을 찾지 못했습니다.', 'error');
  };

  const norm = (v: string | null | undefined) => String(v ?? '').replace(/[^0-9]/g, '');
  const handleImport = async () => {
    if (importRows.length === 0) return;
    setAddLoading(true);
    // 기존 학생과 이름+연락처(숫자만)가 같으면 중복으로 간주하고 건너뜀
    const existKeys = new Set(students.map((s) => `${s.name}|${norm(s.phone)}`));
    const seen = new Set<string>();
    const unique: typeof importRows = [];
    let dup = 0;
    for (const r of importRows) {
      const key = `${r.name}|${norm(r.phone)}`;
      if (existKeys.has(key) || seen.has(key)) { dup++; continue; }
      seen.add(key); unique.push(r);
    }
    if (unique.length === 0) {
      toast(`모두 중복이라 추가할 학생이 없습니다 (${dup}명 건너뜀)`, 'error');
      setAddLoading(false); return;
    }
    const payload = unique.map((r) => ({
      name: r.name,
      grade: r.grade || null,
      school: r.school || null,
      phone: r.phone || null,
      parent_name: r.parent_name || null,
      teacher_id: teacherIdByName(r.teacher_name) || null,
      subjects: r.subjects || null,
      is_active: true,
    }));
    const res = await fetch('/api/admin/students', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    if (res.ok) {
      toast(dup > 0 ? `${payload.length}명 추가 (중복 ${dup}명 제외)` : `${payload.length}명 가져오기 완료`);
      setImportRows([]); setImportFileName(''); setAddMode('none'); fetchAll();
    } else { toast('가져오기 실패', 'error'); }
    setAddLoading(false);
  };

  // ── 편집 ──
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    const body: any = { id: editId, ...editForm };
    if (!body.teacher_id) body.teacher_id = null;
    await fetch('/api/admin/students', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    setEditId(null); toast('수정되었습니다'); fetchAll();
  };

  const toggleActive = async (s: Student) => {
    await fetch('/api/admin/students', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, is_active: !s.is_active }),
    });
    fetchAll();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 학생을 삭제할까요? 관련 일지도 삭제됩니다.`)) return;
    await fetch(`/api/admin/students?id=${id}`, { method: 'DELETE' });
    toast('삭제되었습니다'); fetchAll();
  };

  // ── 일괄 작업 ──
  const ids = () => Array.from(selected);
  const bulkSetActive = async (active: boolean) => {
    if (bulkBusy) return;
    setBulkBusy(true);
    await fetch('/api/admin/students', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: ids(), fields: { is_active: active } }),
    });
    toast(`${selected.size}명 ${active ? '재원' : '퇴원'} 처리`); await fetchAll(); setBulkBusy(false);
  };
  const bulkAssignTeacher = async () => {
    if (bulkBusy) return;
    if (!bulkTeacher) return toast('배정할 선생님을 선택하세요.', 'error');
    const teacherId = bulkTeacher === '__unassign__' ? null : bulkTeacher;
    setBulkBusy(true);
    await fetch('/api/admin/students', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: ids(), fields: { teacher_id: teacherId } }),
    });
    const tName = teacherId ? teachers.find((t) => t.id === teacherId)?.name : '미배정';
    toast(`${selected.size}명 담당: ${tName}`); setBulkTeacher(''); await fetchAll(); setBulkBusy(false);
  };
  const bulkDelete = async () => {
    if (bulkBusy) return;
    if (!confirm(`선택한 ${selected.size}명을 삭제할까요? 관련 일지도 삭제됩니다.`)) return;
    setBulkBusy(true);
    await fetch(`/api/admin/students?ids=${ids().join(',')}`, { method: 'DELETE' });
    toast(`${selected.size}명 삭제`); await fetchAll(); setBulkBusy(false);
  };

  const filtered = students.filter((s) => {
    const matchSearch =
      s.name.includes(search) || (s.school || '').includes(search) || (s.phone || '').includes(search);
    const matchActive =
      filterActive === 'all' ||
      (filterActive === 'active' && s.is_active !== false) ||
      (filterActive === 'inactive' && s.is_active === false);
    const matchTeacher = myRole !== 'teacher' || s.teacher_id === myTeacherId;
    return matchSearch && matchActive && matchTeacher;
  });

  const allChecked = filtered.length > 0 && filtered.every((s) => selected.has(s.id));
  const toggleAll = () => {
    setSelected((prev) => {
      if (filtered.every((s) => prev.has(s.id))) {
        const n = new Set(prev); filtered.forEach((s) => n.delete(s.id)); return n;
      }
      const n = new Set(prev); filtered.forEach((s) => n.add(s.id)); return n;
    });
  };
  const toggleOne = (id: string) =>
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const openAdd = (mode: 'single' | 'multi' | 'excel') => {
    setAddMode((m) => (m === mode ? 'none' : mode)); setEditId(null);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {ToastHost}
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">👨‍🎓 학생 관리</h1>
        <a href={myRole === 'teacher' ? '/admin/teacher' : '/admin'} className="text-sm hover:underline">
          ← {myRole === 'teacher' ? '내 페이지' : '관리자 홈'}
        </a>
      </nav>

      <div className="max-w-5xl mx-auto py-8 px-6">
        {/* 상단 컨트롤 */}
        <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
          <div className="flex gap-2">
            {([['all', '전체'], ['active', '재원중'], ['inactive', '퇴원']] as const).map(([val, label]) => (
              <button key={val} onClick={() => { setFilterActive(val); setSelected(new Set()); }}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition
                  ${filterActive === val ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 border hover:border-blue-400'}`}>
                {label} ({val === 'all' ? students.length : val === 'active' ? students.filter((s) => s.is_active).length : students.filter((s) => !s.is_active).length})
              </button>
            ))}
          </div>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="flex-1 md:w-56 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="이름, 학교, 연락처 검색" />
        </div>

        {/* 추가 방식 선택 버튼들 */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={() => openAdd('single')}
            className={`px-4 py-2 rounded-full text-sm font-bold border transition ${addMode === 'single' ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-blue-700 border-blue-200 hover:border-blue-400'}`}>
            + 학생 1명 추가
          </button>
          <button onClick={() => openAdd('multi')}
            className={`px-4 py-2 rounded-full text-sm font-bold border transition ${addMode === 'multi' ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-blue-700 border-blue-200 hover:border-blue-400'}`}>
            ⊞ 여러 명 한 번에
          </button>
          <button onClick={() => openAdd('excel')}
            className={`px-4 py-2 rounded-full text-sm font-bold border transition ${addMode === 'excel' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-green-700 border-green-200 hover:border-green-400'}`}>
            ▣ 엑셀 가져오기
          </button>
        </div>

        {/* 단일 추가 */}
        {addMode === 'single' && (
          <form onSubmit={handleAdd} className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
            <h3 className="font-bold text-gray-800 mb-4">새 학생 등록</h3>
            <StudentFormFields form={addForm} setForm={setAddForm} teachers={teachers} />
            <div className="flex gap-2 mt-4">
              <button type="submit" disabled={addLoading}
                className="bg-blue-700 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-blue-800 disabled:opacity-50">
                {addLoading ? '추가 중...' : '등록'}
              </button>
              <button type="button" onClick={() => setAddMode('none')} className="border px-6 py-2 rounded-lg text-sm text-gray-600">취소</button>
            </div>
          </form>
        )}

        {/* 여러 명 한 번에 */}
        {addMode === 'multi' && (
          <div className="bg-white rounded-2xl shadow-sm border p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800">여러 학생 한 번에 등록</h3>
              <span className="text-xs text-gray-400">이름이 입력된 행만 저장됩니다</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 border-b">
                    <th className="text-left font-medium py-2 pr-2 min-w-[120px]">이름 *</th>
                    <th className="text-left font-medium py-2 px-2">학년</th>
                    <th className="text-left font-medium py-2 px-2 min-w-[120px]">학교</th>
                    <th className="text-left font-medium py-2 px-2 min-w-[130px]">연락처</th>
                    <th className="text-left font-medium py-2 px-2 min-w-[120px]">담당 선생님</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.key} className="border-b last:border-0">
                      <td className="py-1.5 pr-2">
                        <input value={r.name} onChange={(e) => updateRow(r.key, 'name', e.target.value)} className={inputCls} placeholder="홍길동" />
                      </td>
                      <td className="py-1.5 px-2">
                        <select value={r.grade} onChange={(e) => updateRow(r.key, 'grade', e.target.value)} className={inputCls}>
                          <option value="">-</option>
                          {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </td>
                      <td className="py-1.5 px-2">
                        <input value={r.school} onChange={(e) => updateRow(r.key, 'school', e.target.value)} className={inputCls} placeholder="○○중" />
                      </td>
                      <td className="py-1.5 px-2">
                        <input value={r.phone} onChange={(e) => updateRow(r.key, 'phone', e.target.value)} className={inputCls} placeholder="010-..." />
                      </td>
                      <td className="py-1.5 px-2">
                        <select value={r.teacher_id} onChange={(e) => updateRow(r.key, 'teacher_id', e.target.value)} className={inputCls}>
                          <option value="">미배정</option>
                          {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </td>
                      <td className="py-1.5 pl-1">
                        <button onClick={() => removeRow(r.key)} className="text-gray-300 hover:text-red-500 text-lg px-1" title="행 삭제">×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <button onClick={addRow} className="text-sm text-blue-600 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50">+ 행 추가</button>
              <div className="ml-auto flex gap-2">
                <button onClick={handleMultiSave} disabled={addLoading}
                  className="bg-blue-700 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-blue-800 disabled:opacity-50">
                  {addLoading ? '저장 중...' : `${rows.filter((r) => r.name.trim()).length}명 저장`}
                </button>
                <button onClick={() => setAddMode('none')} className="border px-5 py-2 rounded-lg text-sm text-gray-600">취소</button>
              </div>
            </div>
          </div>
        )}

        {/* 엑셀 가져오기 */}
        {addMode === 'excel' && (
          <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
            <h3 className="font-bold text-gray-800 mb-2">엑셀 / CSV 가져오기</h3>
            <p className="text-sm text-gray-500 mb-4">
              양식을 내려받아 채운 뒤 업로드하세요. 열: 이름 · 학년 · 학교 · 연락처 · 보호자이름 · 담당선생님 · 수강과목
              <br /><span className="text-gray-400">담당선생님은 이름이 정확히 일치할 때 자동 배정됩니다.</span>
            </p>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <button onClick={downloadTemplate}
                className="border border-green-300 text-green-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-50">
                ↓ 엑셀 양식 다운로드
              </button>
              <label className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-700 cursor-pointer">
                파일 선택
                <input type="file" accept=".xlsx,.xls,.csv" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
              </label>
              {importFileName && <span className="text-sm text-gray-500">{importFileName} — {importRows.length}명 인식</span>}
            </div>

            {importRows.length > 0 && (
              <>
                <div className="border rounded-xl overflow-hidden mb-4 max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs text-gray-500 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2">이름</th><th className="text-left px-3 py-2">학년</th>
                        <th className="text-left px-3 py-2">학교</th><th className="text-left px-3 py-2">연락처</th>
                        <th className="text-left px-3 py-2">담당</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importRows.map((r, i) => {
                        const matched = teacherIdByName(r.teacher_name);
                        return (
                          <tr key={i} className="border-t">
                            <td className="px-3 py-1.5 font-medium text-gray-800">{r.name}</td>
                            <td className="px-3 py-1.5 text-gray-500">{r.grade || '-'}</td>
                            <td className="px-3 py-1.5 text-gray-500">{r.school || '-'}</td>
                            <td className="px-3 py-1.5 text-gray-500">{r.phone || '-'}</td>
                            <td className="px-3 py-1.5 text-xs">
                              {r.teacher_name
                                ? matched ? <span className="text-blue-600">{r.teacher_name}</span>
                                  : <span className="text-orange-500">{r.teacher_name} (미일치)</span>
                                : <span className="text-gray-300">미배정</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleImport} disabled={addLoading}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-green-700 disabled:opacity-50">
                    {addLoading ? '가져오는 중...' : `${importRows.length}명 가져오기`}
                  </button>
                  <button onClick={() => { setImportRows([]); setImportFileName(''); }} className="border px-5 py-2 rounded-lg text-sm text-gray-600">초기화</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* 일괄 작업 바 */}
        {selected.size > 0 && (
          <div className="sticky top-2 z-20 bg-blue-900 text-white rounded-xl px-4 py-3 mb-3 flex flex-wrap items-center gap-3 shadow-lg">
            <span className="font-bold text-sm">{selected.size}명 선택됨</span>
            <button onClick={() => bulkSetActive(true)} disabled={bulkBusy} className="bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg text-sm disabled:opacity-50">재원 전환</button>
            <button onClick={() => bulkSetActive(false)} disabled={bulkBusy} className="bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg text-sm disabled:opacity-50">퇴원 전환</button>
            <div className="flex items-center gap-1">
              <select value={bulkTeacher} onChange={(e) => setBulkTeacher(e.target.value)}
                className="text-sm text-gray-800 rounded-lg px-2 py-1.5">
                <option value="">담당 선생님…</option>
                <option value="__unassign__">미배정으로</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <button onClick={bulkAssignTeacher} disabled={bulkBusy} className="bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg text-sm disabled:opacity-50">배정</button>
            </div>
            <button onClick={bulkDelete} disabled={bulkBusy} className="bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg text-sm font-bold ml-auto disabled:opacity-50">삭제</button>
            <button onClick={() => setSelected(new Set())} className="text-blue-200 hover:text-white px-2 py-1.5 text-sm">선택 해제</button>
          </div>
        )}

        {/* 목록 */}
        {loading ? (
          <p className="text-center text-gray-400 py-20">불러오는 중...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-20">학생이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden min-w-[760px]">
            <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 border-b text-xs font-bold text-gray-500 items-center">
              <div className="col-span-1 flex items-center">
                <input type="checkbox" checked={allChecked} onChange={toggleAll} className="w-4 h-4 accent-blue-600 cursor-pointer" />
              </div>
              <div className="col-span-2">이름</div>
              <div className="col-span-1">학년</div>
              <div className="col-span-2">학교</div>
              <div className="col-span-2">연락처</div>
              <div className="col-span-1">담당</div>
              <div className="col-span-1">상태</div>
              <div className="col-span-2">액션</div>
            </div>

            {filtered.map((s) => (
              <div key={s.id} className="border-b last:border-b-0">
                {editId === s.id ? (
                  <form onSubmit={handleEdit} className="p-4">
                    <StudentFormFields form={editForm} setForm={setEditForm} teachers={teachers} />
                    <div className="flex gap-2 mt-3">
                      <button type="submit" className="bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold">저장</button>
                      <button type="button" onClick={() => setEditId(null)} className="border px-4 py-1.5 rounded-lg text-sm text-gray-600">취소</button>
                    </div>
                  </form>
                ) : (
                  <div className={`grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-gray-50 ${selected.has(s.id) ? 'bg-blue-50/60' : ''}`}>
                    <div className="col-span-1">
                      <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleOne(s.id)} className="w-4 h-4 accent-blue-600 cursor-pointer" />
                    </div>
                    <div className="col-span-2 font-medium text-gray-800 text-sm">{s.name}</div>
                    <div className="col-span-1 text-gray-500 text-sm">{s.grade || '-'}</div>
                    <div className="col-span-2 text-gray-500 text-sm truncate">{s.school || '-'}</div>
                    <div className="col-span-2 text-gray-500 text-sm">{s.phone || '-'}</div>
                    <div className="col-span-1 text-sm">
                      {s.teachers ? <span className="text-blue-600">{s.teachers.name}</span> : <span className="text-gray-300">-</span>}
                    </div>
                    <div className="col-span-1">
                      <button onClick={() => toggleActive(s)}
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {s.is_active ? '재원' : '퇴원'}
                      </button>
                    </div>
                    <div className="col-span-2 flex gap-1">
                      <button onClick={() => router.push(`/admin/students/${s.id}/logs`)} className="border px-2 py-1 rounded-lg text-xs text-blue-600 hover:bg-blue-50">일지</button>
                      <button onClick={() => {
                        setEditId(s.id); setAddMode('none');
                        setEditForm({
                          name: s.name, school: s.school || '', grade: s.grade || '', phone: s.phone || '',
                          parent_name: s.parent_name || '', teacher_id: s.teacher_id || '',
                          subjects: s.subjects || '', memo: s.memo || '', is_active: s.is_active,
                        });
                      }} className="border px-2 py-1 rounded-lg text-xs text-gray-600 hover:bg-gray-50">수정</button>
                      <button onClick={() => handleDelete(s.id, s.name)} className="border px-2 py-1 rounded-lg text-xs text-red-500 hover:bg-red-50">삭제</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
