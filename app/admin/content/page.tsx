'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/app/components/Toast';

const TABS = [
  { key: 'about', label: '🏛️ 학원 소개', desc: '학원 소개 페이지 수정' },
  { key: 'schools', label: '🏫 학교 분석', desc: '학교별 내용 입력' },
  { key: 'stories', label: '📈 성적 향상 사례', desc: '성적 향상 사례 관리' },
  { key: 'reviews', label: '💬 학부모 후기', desc: '후기 관리' },
  { key: 'columns', label: '📝 입시 칼럼', desc: '칼럼 작성' },
  { key: 'seminars', label: '📅 설명회', desc: '설명회 일정 관리' },
] as const;

type Tab = typeof TABS[number]['key'];

const SCHOOL_SLUGS = [
  { slug: 'seonyugo', name: '선유고' },
  { slug: 'janghungo', name: '장훈고' },
  { slug: 'yeouido', name: '여의도고' },
  { slug: 'yeouidogirls', name: '여의도여고' },
  { slug: 'gwanakgo', name: '관악고' },
  { slug: 'dangsanseo', name: '당산서중' },
  { slug: 'dangsan', name: '당산중' },
  { slug: 'seonyu', name: '선유중' },
];

const STORY_CATEGORIES = ['수학', '과학', '수학+과학'];
const REVIEW_CATEGORIES = ['성적향상', '관리만족도', '입시상담', '학습습관변화'];
const COLUMN_CATEGORIES = ['고교학점제', '수시', '정시', '과목선택', '면접', '입결분석'];

export default function ContentPage() {
  const router = useRouter();
  const { toast, ToastHost } = useToast();
  const [tab, setTab] = useState<Tab>('about');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // 학교분석 선택
  const [selectedSchool, setSelectedSchool] = useState(SCHOOL_SLUGS[0].slug);
  const [schoolForm, setSchoolForm] = useState<Record<string, string>>({});
  const [schoolSaving, setSchoolSaving] = useState(false);

  // 학원소개 설정
  const [aboutForm, setAboutForm] = useState<Record<string, string>>({});
  const [aboutSaving, setAboutSaving] = useState(false);

  // 일반 폼
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    const token = localStorage.getItem('sb_access_token');
    if (!token) { router.push('/login'); return; }
    setSelected(new Set());
    fetchItems();
  }, [tab]);

  const fetchItems = async () => {
    if (tab === 'about') {
      setLoading(true);
      const res = await fetch('/api/admin/content/settings');
      const data = await res.json();
      setAboutForm(typeof data === 'object' ? data : {});
      setLoading(false);
      return;
    }
    if (tab === 'schools') {
      setLoading(true);
      const res = await fetch('/api/admin/content/schools');
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
      setLoading(false);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/admin/content/${tab}`);
    const data = await res.json();
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  const handleAboutSave = async () => {
    setAboutSaving(true);
    await fetch('/api/admin/content/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(aboutForm),
    });
    setAboutSaving(false);
    toast('저장되었습니다');
  };

  // 학교분석 저장
  const loadSchoolContent = () => {
    const found = items.find((i: any) => i.school_slug === selectedSchool);
    setSchoolForm(found ?? { school_slug: selectedSchool, school_name: SCHOOL_SLUGS.find(s => s.slug === selectedSchool)?.name ?? '' });
  };

  useEffect(() => { if (tab === 'schools') loadSchoolContent(); }, [selectedSchool, items]);

  const handleSchoolSave = async () => {
    setSchoolSaving(true);
    await fetch('/api/admin/content/schools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        school_slug: selectedSchool,
        school_name: SCHOOL_SLUGS.find(s => s.slug === selectedSchool)?.name,
        ...schoolForm,
      }),
    });
    setSchoolSaving(false);
    fetchItems();
    toast('저장되었습니다');
  };

  // 일반 항목 저장
  const handleSave = async () => {
    const method = editItem ? 'PATCH' : 'POST';
    const body = editItem ? { id: editItem.id, ...form } : form;
    const res = await fetch(`/api/admin/content/${tab}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      toast('저장 실패: ' + JSON.stringify(data), 'error');
      return;
    }
    setShowForm(false);
    setEditItem(null);
    setForm({});
    toast(editItem ? '수정되었습니다' : '추가되었습니다');
    fetchItems();
  };

  const handleTogglePublish = async (item: any) => {
    await fetch(`/api/admin/content/${tab}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, is_published: !item.is_published }),
    });
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('삭제할까요?')) return;
    await fetch(`/api/admin/content/${tab}?id=${id}`, { method: 'DELETE' });
    toast('삭제되었습니다');
    fetchItems();
  };

  const toggleOne = (id: string) =>
    setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () =>
    setSelected(prev => (items.length > 0 && items.every(i => prev.has(i.id))) ? new Set() : new Set(items.map(i => i.id)));
  const bulkPublish = async (pub: boolean) => {
    await Promise.all(Array.from(selected).map(id =>
      fetch(`/api/admin/content/${tab}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_published: pub }),
      })));
    toast(`${selected.size}개 ${pub ? '공개' : '비공개'} 처리`);
    setSelected(new Set()); fetchItems();
  };
  const bulkDelete = async () => {
    if (!confirm(`선택한 ${selected.size}개를 삭제할까요?`)) return;
    await Promise.all(Array.from(selected).map(id =>
      fetch(`/api/admin/content/${tab}?id=${id}`, { method: 'DELETE' })));
    toast(`${selected.size}개 삭제`);
    setSelected(new Set()); fetchItems();
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm(item);
    setShowForm(true);
  };

  const openAdd = () => {
    setEditItem(null);
    setForm({});
    setShowForm(true);
  };

  const renderForm = () => {
    if (tab === 'stories') return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">학생 레이블 *</label>
            <input value={form.student_label ?? ''} onChange={e => setForm({ ...form, student_label: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="중3 → 선유고 진학" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">과목</label>
            <select value={form.subject ?? ''} onChange={e => setForm({ ...form, subject: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">선택</option>
              {STORY_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">이전 상황</label>
            <input value={form.school_before ?? ''} onChange={e => setForm({ ...form, school_before: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="중3, 수학 3등급" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">합격/결과</label>
            <input value={form.school_after ?? ''} onChange={e => setForm({ ...form, school_after: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="선유고 진학, 내신 1등급" />
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-600 block mb-1">학습 과정 스토리</label>
          <textarea rows={4} value={form.content ?? ''} onChange={e => setForm({ ...form, content: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="학습 과정을 자세히 작성해주세요" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-600 block mb-1">결과 요약 (한 줄)</label>
          <input value={form.result ?? ''} onChange={e => setForm({ ...form, result: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="6개월 만에 수학 1등급 달성" />
        </div>
      </div>
    );

    if (tab === 'reviews') return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">작성자 *</label>
            <input value={form.author ?? ''} onChange={e => setForm({ ...form, author: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="선유고 학부모" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">카테고리</label>
            <select value={form.category ?? ''} onChange={e => setForm({ ...form, category: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">선택</option>
              {REVIEW_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-600 block mb-1">후기 내용 *</label>
          <textarea rows={4} value={form.content ?? ''} onChange={e => setForm({ ...form, content: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="후기를 작성해주세요" />
        </div>
      </div>
    );

    if (tab === 'columns') return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">제목 *</label>
            <input value={form.title ?? ''} onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="2026 수능 수학 출제 경향" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">카테고리</label>
            <select value={form.category ?? ''} onChange={e => setForm({ ...form, category: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">선택</option>
              {COLUMN_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-600 block mb-1">요약 (목록에 표시)</label>
          <input value={form.summary ?? ''} onChange={e => setForm({ ...form, summary: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="한 줄 요약" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-600 block mb-1">본문</label>
          <textarea rows={6} value={form.content ?? ''} onChange={e => setForm({ ...form, content: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="칼럼 본문을 작성해주세요" />
        </div>
      </div>
    );

    if (tab === 'seminars') return (
      <div className="space-y-3">
        <div>
          <label className="text-xs font-bold text-gray-600 block mb-1">설명회 제목 *</label>
          <input value={form.title ?? ''} onChange={e => setForm({ ...form, title: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="2026 입시설명회" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">일시</label>
            <input type="datetime-local" value={form.scheduled_at?.slice(0, 16) ?? ''}
              onChange={e => setForm({ ...form, scheduled_at: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">장소</label>
            <input value={form.location ?? '스카이수학과학입시학원'} onChange={e => setForm({ ...form, location: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-600 block mb-1">설명</label>
          <textarea rows={3} value={form.description ?? ''} onChange={e => setForm({ ...form, description: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm" placeholder="설명회 내용 안내" />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-600 block mb-1">최대 참가 인원</label>
          <input type="number" value={form.max_participants ?? ''} onChange={e => setForm({ ...form, max_participants: e.target.value })}
            className="w-32 border rounded-lg px-3 py-2 text-sm" placeholder="30" />
        </div>
      </div>
    );
    return null;
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {ToastHost}
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">✏️ 콘텐츠 관리</h1>
        <a href="/admin" className="text-sm hover:underline">← 관리자 홈</a>
      </nav>

      <div className="max-w-5xl mx-auto py-8 px-6">
        {/* 탭 */}
        <div className="flex flex-wrap gap-2 mb-8">
          {TABS.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setShowForm(false); }}
              className={`px-4 py-2 rounded-full text-sm font-bold transition
                ${tab === t.key ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 border hover:border-blue-400'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* 학원 소개 탭 */}
        {tab === 'about' && (
          <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-6">
            {loading ? <p className="text-gray-400 text-sm">불러오는 중...</p> : (
              <>
                <div>
                  <h3 className="font-bold text-gray-700 mb-3 text-sm border-b pb-2">📣 히어로 소개 문구</h3>
                  <textarea rows={3} value={aboutForm['about_hero_desc'] ?? ''}
                    onChange={e => setAboutForm({ ...aboutForm, about_hero_desc: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="학원 소개 페이지 상단에 표시되는 소개 문구" />
                </div>

                <div>
                  <h3 className="font-bold text-gray-700 mb-3 text-sm border-b pb-2">🎯 교육 철학 (3가지)</h3>
                  <div className="space-y-3">
                    {[1, 2, 3].map(n => (
                      <div key={n} className="grid grid-cols-3 gap-3">
                        <input value={aboutForm[`about_philosophy_${n}_title`] ?? ''}
                          onChange={e => setAboutForm({ ...aboutForm, [`about_philosophy_${n}_title`]: e.target.value })}
                          className="border rounded-lg px-3 py-2 text-sm" placeholder={`철학 ${n} 제목`} />
                        <textarea rows={2} value={aboutForm[`about_philosophy_${n}_desc`] ?? ''}
                          onChange={e => setAboutForm({ ...aboutForm, [`about_philosophy_${n}_desc`]: e.target.value })}
                          className="col-span-2 border rounded-lg px-3 py-2 text-sm" placeholder={`철학 ${n} 설명`} />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-gray-700 mb-3 text-sm border-b pb-2">📍 연락처 & 운영시간</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'contact_address', label: '주소' },
                      { key: 'contact_phone', label: '전화번호' },
                      { key: 'contact_hours_weekday', label: '평일 운영시간' },
                      { key: 'contact_hours_saturday', label: '토요일 운영시간' },
                    ].map(f => (
                      <div key={f.key}>
                        <label className="text-xs font-bold text-gray-500 block mb-1">{f.label}</label>
                        <input value={aboutForm[f.key] ?? ''}
                          onChange={e => setAboutForm({ ...aboutForm, [f.key]: e.target.value })}
                          className="w-full border rounded-lg px-3 py-2 text-sm" />
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={handleAboutSave} disabled={aboutSaving}
                  className="bg-blue-700 text-white px-8 py-2 rounded-lg font-bold hover:bg-blue-800 disabled:opacity-50">
                  {aboutSaving ? '저장 중...' : '저장'}
                </button>
              </>
            )}
          </div>
        )}

        {/* 학교 분석 탭 */}
        {tab === 'schools' && (
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <div className="flex gap-3 mb-6 flex-wrap">
              {SCHOOL_SLUGS.map(s => (
                <button key={s.slug} onClick={() => setSelectedSchool(s.slug)}
                  className={`px-4 py-1.5 rounded-full text-sm font-bold transition
                    ${selectedSchool === s.slug ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {s.name}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {[
                { key: 'characteristics', label: '학교 특징' },
                { key: 'difficulty', label: '내신 난도' },
                { key: 'math_tendency', label: '수학 출제 경향' },
                { key: 'science_tendency', label: '과학 출제 경향' },
                { key: 'entrance', label: '입결 분석' },
                { key: 'strategy', label: 'SKY 학습 전략' },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-sm font-bold text-gray-700 block mb-1">{field.label}</label>
                  <textarea rows={3} value={schoolForm[field.key] ?? ''}
                    onChange={e => setSchoolForm({ ...schoolForm, [field.key]: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`${field.label} 내용을 입력해주세요`} />
                </div>
              ))}
              <button onClick={handleSchoolSave} disabled={schoolSaving}
                className="bg-blue-700 text-white px-8 py-2 rounded-lg font-bold hover:bg-blue-800 disabled:opacity-50">
                {schoolSaving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        )}

        {/* 나머지 탭들 */}
        {tab !== 'schools' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <p className="text-gray-500 text-sm">총 {items.length}개</p>
                {items.length > 0 && (
                  <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer">
                    <input type="checkbox" checked={items.length > 0 && items.every(i => selected.has(i.id))}
                      onChange={toggleAll} className="w-4 h-4 accent-blue-600" />
                    전체 선택
                  </label>
                )}
              </div>
              <button onClick={openAdd}
                className="bg-blue-700 text-white px-5 py-2 rounded-full font-bold text-sm hover:bg-blue-800">
                + 추가
              </button>
            </div>

            {selected.size > 0 && (
              <div className="sticky top-2 z-20 bg-blue-900 text-white rounded-xl px-4 py-3 mb-3 flex flex-wrap items-center gap-3 shadow-lg">
                <span className="font-bold text-sm">{selected.size}개 선택됨</span>
                <button onClick={() => bulkPublish(true)} className="bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg text-sm">공개</button>
                <button onClick={() => bulkPublish(false)} className="bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg text-sm">비공개</button>
                <button onClick={bulkDelete} className="bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg text-sm font-bold ml-auto">삭제</button>
                <button onClick={() => setSelected(new Set())} className="text-blue-200 hover:text-white px-2 py-1.5 text-sm">선택 해제</button>
              </div>
            )}

            {/* 추가/수정 폼 */}
            {showForm && (
              <div className="bg-white rounded-2xl shadow-sm border p-6 mb-6">
                <h3 className="font-bold text-gray-800 mb-4">{editItem ? '수정' : '새로 추가'}</h3>
                {renderForm()}
                <div className="flex gap-2 mt-4">
                  <button onClick={handleSave}
                    className="bg-blue-700 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-blue-800">
                    저장
                  </button>
                  <button onClick={() => { setShowForm(false); setEditItem(null); setForm({}); }}
                    className="border px-6 py-2 rounded-lg text-sm text-gray-600">
                    취소
                  </button>
                </div>
              </div>
            )}

            {/* 목록 */}
            {loading ? (
              <p className="text-center text-gray-400 py-16">불러오는 중...</p>
            ) : items.length === 0 ? (
              <div className="bg-white rounded-2xl border p-12 text-center text-gray-400">
                아직 등록된 항목이 없습니다. + 추가 버튼을 눌러 시작하세요.
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item: any) => (
                  <div key={item.id} className={`bg-white rounded-2xl shadow-sm border p-5 ${selected.has(item.id) ? 'ring-2 ring-blue-400' : ''}`}>
                    <div className="flex items-start justify-between gap-3">
                      <input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleOne(item.id)}
                        className="w-4 h-4 accent-blue-600 mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {/* 제목 */}
                          <span className="font-bold text-gray-800">
                            {item.student_label || item.author || item.title || '-'}
                          </span>
                          {/* 카테고리 */}
                          {(item.category || item.subject) && (
                            <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                              {item.category || item.subject}
                            </span>
                          )}
                          {/* 공개 여부 */}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${item.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {item.is_published ? '공개' : '비공개'}
                          </span>
                        </div>
                        {/* 요약/내용 미리보기 */}
                        <p className="text-gray-400 text-sm truncate">
                          {item.summary || item.content || item.result || item.description || ''}
                        </p>
                        {/* 설명회 일시 */}
                        {item.scheduled_at && (
                          <p className="text-blue-600 text-xs mt-1">
                            📅 {new Date(item.scheduled_at).toLocaleString('ko-KR')}
                            {item.seminar_applications && ` · 신청 ${item.seminar_applications.length}명`}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1.5 ml-4 flex-shrink-0">
                        <button onClick={() => handleTogglePublish(item)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition
                            ${item.is_published ? 'border-gray-200 text-gray-500 hover:bg-gray-50' : 'bg-green-600 text-white hover:bg-green-700'}`}>
                          {item.is_published ? '비공개' : '공개'}
                        </button>
                        <button onClick={() => openEdit(item)}
                          className="border px-3 py-1.5 rounded-lg text-xs text-gray-600 hover:bg-gray-50">
                          수정
                        </button>
                        <button onClick={() => handleDelete(item.id)}
                          className="border px-3 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-50">
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
