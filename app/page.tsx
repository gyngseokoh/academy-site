export const dynamic = 'force-dynamic';
import Link from 'next/link';
import Nav from '@/app/components/Nav';
import ConsultationButton from '@/app/components/ConsultationModal';

const SCHOOLS = [
  { name: '선유고', href: '/schools/seonyugo' },
  { name: '장훈고', href: '/schools/janghungo' },
  { name: '여의도고', href: '/schools/yeouido' },
  { name: '여의도여고', href: '/schools/yeouidogirls' },
  { name: '관악고', href: '/schools/gwanakgo' },
  { name: '당산서중', href: '/schools/dangsanseo' },
  { name: '당산중', href: '/schools/dangsan' },
  { name: '선유중', href: '/schools/seonyu' },
];

const SUBJECT_COLOR: Record<string, string> = {
  '수학': 'bg-blue-100 text-blue-700',
  '물리': 'bg-purple-100 text-purple-700',
  '화학': 'bg-yellow-100 text-yellow-700',
  '생명과학': 'bg-emerald-100 text-emerald-700',
  '지구과학': 'bg-orange-100 text-orange-700',
  '과학': 'bg-green-100 text-green-700',
};
function subjectColor(s: string) {
  for (const k of Object.keys(SUBJECT_COLOR)) { if (s?.includes(k)) return SUBJECT_COLOR[k]; }
  return 'bg-gray-100 text-gray-600';
}

async function fetchAll() {
  const h = { apikey: process.env.NEXT_PUBLIC_SUPABASE_URL ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! : '' };
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const opts = { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! }, cache: 'no-store' as const };

  const [t, s, r, c] = await Promise.all([
    fetch(`${base}/rest/v1/teachers?role=neq.director&select=id,name,subject,photo_url,role&order=sort_order.asc&limit=6`, opts).then(r => r.json()).catch(() => []),
    fetch(`${base}/rest/v1/success_stories?is_published=eq.true&select=id,student_label,subject,school_before,school_after,result&order=created_at.desc&limit=3`, opts).then(r => r.json()).catch(() => []),
    fetch(`${base}/rest/v1/reviews?is_published=eq.true&select=id,author,content,category&order=created_at.desc&limit=3`, opts).then(r => r.json()).catch(() => []),
    fetch(`${base}/rest/v1/columns?is_published=eq.true&select=id,title,category,summary,created_at&order=created_at.desc&limit=4`, opts).then(r => r.json()).catch(() => []),
  ]);
  return {
    teachers: Array.isArray(t) ? t : [],
    stories:  Array.isArray(s) ? s : [],
    reviews:  Array.isArray(r) ? r : [],
    columns:  Array.isArray(c) ? c : [],
  };
}

export default async function Home() {
  const { teachers, stories, reviews, columns } = await fetchAll();
  const hasSocial = stories.length > 0 || reviews.length > 0 || columns.length > 0;

  return (
    <main className="min-h-screen bg-white">
      <Nav />

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {['선유고','장훈고','여의도고','여의도여고','관악고','당산중','선유중'].map(s => (
              <span key={s} className="bg-white/15 text-white text-xs px-3 py-1 rounded-full">{s}</span>
            ))}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-4">
            당산권 학교별 내신과 입시를<br />
            <span className="text-yellow-300">책임지는</span> 수학·과학 전문 교육기관
          </h1>
          <p className="text-blue-200 text-sm md:text-base mb-8">
            학교별 맞춤 내신 분석 · 학습관리 시스템 · 월간 리포트 · 입시 전략
          </p>
          <div className="flex flex-wrap gap-3 justify-center mb-10">
            <ConsultationButton className="bg-yellow-400 text-blue-900 font-bold px-7 py-3 rounded-full hover:bg-yellow-300 transition shadow-lg" label="📞 상담 신청" />
            <Link href="/about" className="bg-white/15 text-white font-bold px-7 py-3 rounded-full border border-white/30 hover:bg-white/25 transition">학원 소개</Link>
            <Link href="/seminar" className="bg-white/10 text-white font-bold px-7 py-3 rounded-full border border-white/20 hover:bg-white/20 transition">📅 설명회</Link>
          </div>
          {/* 핵심 지표 */}
          <div className="grid grid-cols-4 gap-4 border-t border-white/20 pt-8">
            {[
              { v: '8개', l: '학교 내신 분석' },
              { v: '100%', l: '보충 수업 보장' },
              { v: '매월', l: '학습 리포트' },
              { v: '소수', l: '정예 운영' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-xl md:text-2xl font-black text-yellow-300">{item.v}</div>
                <div className="text-blue-300 text-xs mt-0.5">{item.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 학교 빠른 이동 ── */}
      <section className="bg-gray-50 border-b">
        <div className="max-w-5xl mx-auto px-6 py-4 flex flex-wrap gap-2 items-center">
          <span className="text-gray-400 text-xs font-medium mr-1">학교별 분석:</span>
          {SCHOOLS.map(s => (
            <Link key={s.name} href={s.href}
              className="bg-white text-blue-800 border border-blue-100 text-xs px-3 py-1 rounded-full hover:bg-blue-700 hover:text-white hover:border-blue-700 transition">
              {s.name}
            </Link>
          ))}
        </div>
      </section>

      {/* ── 소셜 프루프 ── */}
      {hasSocial && (
        <section className="py-12 px-6 bg-white">
          <div className="max-w-5xl mx-auto">

            {/* 성적향상사례 + 학부모후기 나란히 */}
            {(stories.length > 0 || reviews.length > 0) && (
              <div className="grid md:grid-cols-2 gap-6 mb-6">

                {/* 성적 향상 사례 */}
                {stories.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🏆</span>
                        <span className="font-bold text-gray-900">성적 향상 사례</span>
                      </div>
                      <Link href="/stories" className="text-xs text-gray-400 hover:text-blue-600">전체 보기 →</Link>
                    </div>
                    <div className="space-y-3">
                      {stories.map((s: any, i: number) => (
                        <div key={s.id} className={`rounded-2xl p-4 ${i === 0 ? 'bg-blue-900 text-white' : 'bg-gray-50 border border-gray-100'}`}>
                          <div className="flex items-center gap-2 mb-2">
                            {s.subject && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${i === 0 ? 'bg-white/20 text-white' : subjectColor(s.subject)}`}>
                                {s.subject}
                              </span>
                            )}
                            <span className={`font-bold text-sm ${i === 0 ? 'text-white' : 'text-gray-900'}`}>{s.student_label}</span>
                          </div>
                          {(s.school_before || s.school_after) && (
                            <div className="flex items-center gap-1.5 text-xs">
                              {s.school_before && <span className={i === 0 ? 'text-blue-300' : 'text-gray-400'}>{s.school_before}</span>}
                              <span className={i === 0 ? 'text-blue-400' : 'text-gray-300'}>→</span>
                              {s.school_after && <span className={`font-bold ${i === 0 ? 'text-yellow-300' : 'text-blue-700'}`}>{s.school_after}</span>}
                            </div>
                          )}
                          {s.result && <p className={`text-xs mt-1.5 ${i === 0 ? 'text-blue-200' : 'text-blue-600'}`}>🏆 {s.result}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 학부모 후기 */}
                {reviews.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">💬</span>
                        <span className="font-bold text-gray-900">학부모 후기</span>
                      </div>
                      <Link href="/reviews" className="text-xs text-gray-400 hover:text-blue-600">전체 보기 →</Link>
                    </div>
                    <div className="space-y-3">
                      {reviews.map((r: any) => (
                        <div key={r