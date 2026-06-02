'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Report = {
  id: string;
  student_id: string;
  teacher_id: string;
  month: string;
  attitude: string | null;
  focus: string | null;
  understanding: string | null;
  homework_rate: string | null;
  test_result: string | null;
  plan: string | null;
  general: string | null;
  students: { id: string; name: string; grade: string; school: string; teacher_id: string; teachers: { id: string; name: string } | null } | null;
};

const FIELDS = [
  { key: 'attitude', label: '학습 태도', placeholder: '수업 태도, 집중 여부 등' },
  { key: 'focus', label: '집중도', placeholder: '수업 중 집중도 평가' },
  { key: 'understanding', label: '이해도', placeholder: '단원별 이해도 및 진도' },
  { key: 'homework_rate', label: '숙제 수행률', placeholder: '과제 제출 여부, 완성도' },
  { key: 'test_result', label: '테스트 결과', placeholder: '단원 테스트 점수 및 분석' },
  { key: 'plan', label: '향후 계획', placeholder: '다음 달 학습 계획' },
  { key: 'general', label: '종합 의견', placeholder: '학부모께 전달할 종합 의견' },
];

function getMonthStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function ReportsPage() {
  const router = useRouter();
  const [month, setMonth] = useState(getMonthStr());
  const [reports, setReports] = useState<Report[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [myRole, setMyRole] = useState('');
  const [myTeacherId, setMyTeacherId] = useState('');
  const [filterTeacherId, setFilterTeacherId] = useState('');
  const [teachers, setTeachers] = useState<any[]>([]);

  // 작성 모달
  const [writeModal, setWriteModal] = useState<any | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // 미작성 학생 모달
  const [showUnwritten, setShowUnwritten] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('sb_access_token');
    if (!token) { router.push('/login'); return; }
    const role = localStorage.getItem('sb_role') || 'director';
    const tid = localStorage.getItem('sb_teacher_id') || '';
    setMyRole(role);
    setMyTeacherId(tid);
    if (role === 'teacher' || role === 'vice_director') setFilterTeacherId(tid);
    fetchTeachers();
    fetchStudents();
  }, []);

  useEffect(() => { fetchReports(); }, [month, filterTeacherId]);

  const fetchTeachers = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/teachers?select=id,name&order=sort_order.asc`,
      { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! } });
    setTeachers(await res.json());
  };

  const fetchStudents = async () => {
    const res = await fetch('/api/admin/students');
    const data = await res.json();
    setStudents(Array.isArray(data) ? data.filter((s: any) => s.is_active !== false) : []);
  };

  const fetchReports = async () => {
    setLoading(true);
    const params = new URLSearchParams({ month });
    if (filterTeacherId) params.set('teacher_id', filterTeacherId);
    const res = await fetch(`/api/admin/reports?${params}`);
    const data = await res.json();
    setReports(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const openWrite = (student: any, existing?: Report) => {
    setWriteModal(student);
    setForm(existing ? {
      attitude: existing.attitude ?? '',
      focus: existing.focus ?? '',
      understanding: existing.understanding ?? '',
      homework_rate: existing.homework_rate ?? '',
      test_result: existing.test_result ?? '',
      plan: existing.plan ?? '',
      general: existing.general ?? '',
    } : {});
  };

  const handleSave = async () => {
    if (!writeModal) return;
    setSaving(true);
    const existing = reports.find(r => r.student_id === writeModal.id);
    await fetch('/api/admin/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(existing ? { id: existing.id } : {}),
        student_id: writeModal.id,
        teacher_id: writeModal.teacher_id || myTeacherId || null,
        month,
        ...form,
      }),
    });
    setSaving(false);
    setWriteModal(null);
    fetchReports();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('리포트를 삭제할까요?')) return;
    await fetch(`/api/admin/reports?id=${id}`, { method: 'DELETE' });
    fetchReports();
  };

  const handlePrint = (report: Report) => {
    const student = report.students;
    // 팝업 차단 대신 숨겨진 iframe으로 인쇄
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const html = `
      <html><head>
        <meta charset="utf-8"/>
        <title>월간 학습 리포트 - ${student?.name}</title>
        <style>
          @page { margin: 20mm; }
          body { font-family: 'Malgun Gothic', sans-serif; max-width: 700px; margin: 0 auto; color: #1a1a1a; font-size: 13px; }
          h1 { font-size: 22px; color: #1e3a5f; border-bottom: 3px solid #1e3a5f; padding-bottom: 10px; margin-bottom: 20px; }
          .info { background: #f8f9fa; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px; display: flex; flex-wrap: wrap; gap: 12px; }
          .info span { font-size: 13px; color: #555; }
          .section { margin-bottom: 16px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; page-break-inside: avoid; }
          .section-title { background: #1e3a5f; color: white; padding: 8px 16px; font-size: 13px; font-weight: bold; }
          .section-content { padding: 12px 16px; font-size: 13px; line-height: 1.7; white-space: pre-wrap; color: #374151; }
          .footer { text-align: center; margin-top: 30px; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 12px; }
        </style>
      </head><body>
        <h1>📋 월간 학습 리포트</h1>
        <div class="info">
          <span>학생: <strong>${student?.name ?? ''}</strong></span>
          <span>학년: ${student?.grade ?? ''}</span>
          <span>학교: ${student?.school ?? ''}</span>
          <span>담당: ${student?.teachers?.name ?? ''} 선생님</span>
          <span>기간: ${report.month}</span>
        </div>
        ${FIELDS.filter(f => (report as any)[f.key]).map(f => `
          <div class="section">
            <div class="section-title">${f.label}</div>
            <div class="section-content">${(report as any)[f.key]}</div>
          </div>
        `).join('')}
        <div class="footer">스카이수학과학입시학원 | 010-5606-3041</div>
      </body></html>`;

    const doc = iframe.contentWindow?.document;
    if (!doc) return;
    doc.open(); doc.write(html); doc.close();
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  };

  // 미작성 학생 (reports에 없는 학생)
  const writtenIds = new Set(reports.map(r => r.student_id));
  const filteredStudents = myRole === 'teacher' || myRole === 'vice_director'
    ? students.filter(s => s.teacher_id === myTeacherId)
    : filterTeacherId ? students.filter(s => s.teacher_id === filterTeacherId) : students;
  const unwrittenStudents = filteredStudents.filter(s => !writtenIds.has(s.id));

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">📄 리포트 관리</h1>
        <a href="/admin" className="text-sm hover:underline">← 관리자 홈</a>
      </nav>

      <div className="max-w-5xl mx-auto py-8 px-6">
        {/* 필터 */}
        <div className="flex gap-3 mb-6 flex-wrap items-center">
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {myRole === 'director' && (
            <select value={filterTeacherId} onChange={e => setFilterTeacherId(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">전체 선생님</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          )}
          <button onClick={() => setShowUnwritten(!showUnwritten)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition ${showUnwritten ? 'bg-orange-500 text-white' : 'bg-orange-50 text-orange-600 border border-orange-200'}`}>
            미작성 {unwrittenStudents.length}명
          </button>
          <span className="text-gray-400 text-sm ml-auto">작성 완료: {reports.length}명</span>
        </div>

        {/* 미작성 학생 목록 */}
        {showUnwritten && unwrittenStudents.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 mb-6">
            <h3 className="font-bold text-orange-700 text-sm mb-3">리포트 미작성 학생</h3>
            <div className="flex flex-wrap gap-2">
              {unwrittenStudents.map(s => (
                <button key={s.id} onClick={() => openWrite(s)}
                  className="bg-white border border-orange-200 text-orange-700 text-sm px-3 py-1.5 rounded-full hover:bg-orange-100 transition">
                  {s.name} {s.grade && `(${s.grade})`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 작성된 리포트 목록 */}
        {loading ? (
          <p className="text-center text-gray-400 py-16">불러오는 중...</p>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-2xl border p-12 text-center text-gray-400">
            <p className="text-lg mb-2">이 달 작성된 리포트가 없습니다</p>
            <p className="text-sm">위 "미작성" 버튼을 클릭해 리포트를 작성하세요</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map(r => (
              <div key={r.id} className="bg-white rounded-2xl shadow-sm border p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-bold text-gray-800 text-lg">{r.students?.name}</span>
                    {r.students?.grade && <span className="text-gray-400 text-sm">{r.students.grade}</span>}
                    {r.students?.school && <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">{r.students.school}</span>}
                    {r.students?.teachers && <span className="text-gray-500 text-sm">{r.students.teachers.name} 선생님</span>}
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => handlePrint(r)}
                      className="bg-gray-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-800">
                      🖨️ 인쇄
                    </button>
                    <button onClick={() => openWrite(r.students, r)}
                      className="border px-3 py-1.5 rounded-lg text-xs text-gray-600 hover:bg-gray-50">
                      수정
                    </button>
                    <button onClick={() => handleDelete(r.id)}
                      className="border px-3 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-50">
                      삭제
                    </button>
                  </div>
                </div>
                {/* 리포트 미리보기 */}
                <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                  {FIELDS.slice(0, 4).map(f => (
                    <div key={f.key} className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs font-bold text-gray-400 mb-0.5">{f.label}</p>
                      <p className="text-xs text-gray-600 line-clamp-2">{(r as any)[f.key] || '-'}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 리포트 작성 모달 */}
      {writeModal && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 px-4 py-8 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-bold text-gray-800 text-xl">{writeModal.name} 월간 리포트</h3>
                <p className="text-gray-400 text-sm">{month} · {writeModal.grade} · {writeModal.school}</p>
              </div>
              <button onClick={() => setWriteModal(null)} className="text-gray-400 hover:text-gray-600 text-2xl">✕</button>
            </div>

            <div className="space-y-4 mb-6">
              {FIELDS.map(f => (
                <div key={f.key}>
                  <label className="text-sm font-bold text-gray-700 block mb-1">{f.label}</label>
                  <textarea rows={2} value={form[f.key] ?? ''}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={f.placeholder} />
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving}
                className="flex-1 bg-blue-700 text-white py-3 rounded-lg font-bold hover:bg-blue-800 disabled:opacity-50">
                {saving ? '저장 중...' : '저장'}
              </button>
              <button onClick={() => setWriteModal(null)}
                className="flex-1 border py-3 rounded-lg text-gray-600 hover:bg-gray-50">
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
