export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { notFound } from 'next/navigation';

const SCHOOL_SLUGS: Record<string, { name: string; fullName: string; type: string }> = {
  seonyugo: { name: '선유고', fullName: '선유고등학교', type: '고등' },
  janghungo: { name: '장훈고', fullName: '장훈고등학교', type: '고등' },
  yeouido: { name: '여의도고', fullName: '여의도고등학교', type: '고등' },
  yeouidogirls: { name: '여의도여고', fullName: '여의도여자고등학교', type: '고등' },
  gwanakgo: { name: '관악고', fullName: '관악고등학교', type: '고등' },
  dangsanseo: { name: '당산서중', fullName: '당산서중학교', type: '중등' },
  dangsan: { name: '당산중', fullName: '당산중학교', type: '중등' },
  seonyu: { name: '선유중', fullName: '선유중학교', type: '중등' },
};

const FIELDS = [
  { key: 'characteristics', label: '학교 특징', icon: '🏫' },
  { key: 'difficulty', label: '내신 난도', icon: '📊' },
  { key: 'math_tendency', label: '수학 출제 경향', icon: '📐' },
  { key: 'science_tendency', label: '과학 출제 경향', icon: '🔬' },
  { key: 'entrance', label: '입결 분석', icon: '🎯' },
  { key: 'strategy', label: 'SKY 학습 전략', icon: '💡' },
];

export default async function SchoolPage({ params }: { params: { school: string } }) {
  const meta = SCHOOL_SLUGS[params.school];
  if (!meta) notFound();

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/school_contents?school_slug=eq.${params.school}&select=*`,
    { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! }, cache: 'no-store' },
  );
  const data = await res.json();
  const content = Array.isArray(data) && data.length > 0 ? data[0] : null;

  const otherSlugs = Object.entries(SCHOOL_SLUGS).filter(([slug]) => slug !== params.school);

  return (
    <main className="min-h-screen bg-white">
      <nav className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="SKY" className="h-9 w-9 object-contain" />
          <span className="text-lg font-bold hidden sm:block">스카이수학과학입시학원</span>
        </Link>
        <div className="flex gap-5 text-sm font-medium">
          <Link href="/schools" className="text-yellow-300 font-bold">학교 분석</Link>
          <Link href="/teachers" className="hover:text-blue-300 transition">선생님 소개</Link>
          <Link href="/consultation" className="hover:text-blue-300 transition">신규생 상담</Link>
        </div>
      </nav>

      <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-blue-300 text-sm mb-4">
            <Link href="/schools" className="hover:text-white transition">학교 분석</Link>
            <span>/</span>
            <span>{meta.name}</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold px-2 py-1 rounded-full bg-yellow-400 text-blue-900">{meta.type}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{meta.name} 분석</h1>
          <p className="text-blue-200 text-sm">{meta.fullName} · SKY수학과학입시학원 학교별 맞춤 분석</p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto py-14 px-6">
        {!content ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4 mb-10 flex items-center gap-3">
            <span className="text-yellow-500 text-xl">✏️</span>
            <p className="text-yellow-700 text-sm">
              <span className="font-bold">{meta.name} 상세 분석 자료</span>를 준비 중입니다. 순차적으로 업데이트 예정입니다.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {FIELDS.map((f, i) => content[f.key] ? (
              <div key={f.key} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span>{f.icon}</span> {f.label}
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{content[f.key]}</p>
              </div>
            ) : null)}
          </div>
        )}

        <div className="mt-10">
          <h3 className="font-bold text-gray-700 mb-3 text-sm">다른 학교 분석 보기</h3>
          <div className="flex flex-wrap gap-2">
            {otherSlugs.map(([slug, s]) => (
              <Link key={slug} href={`/schools/${slug}`}
                className="bg-gray-50 text-gray-700 border border-gray-200 text-sm px-4 py-2 rounded-full hover:bg-blue-700 hover:text-white hover:border-blue-700 transition">
                {s.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-12 bg-blue-900 rounded-2xl p-8 text-center text-white">
          <h3 className="text-xl font-bold mb-2">{meta.name} 맞춤 전략 상담 받기</h3>
          <p className="text-blue-300 text-sm mb-6">학교 분석을 바탕으로 1:1 입시 상담을 제공합니다.</p>
          <Link href="/consultation" className="bg-yellow-400 text-blue-900 font-bold px-8 py-3 rounded-full hover:bg-yellow-300 transition inline-block">
            상담 신청하기
          </Link>
        </div>
      </div>

      <footer className="bg-gray-900 text-gray-400 text-center py-8 text-sm">
        <p>© 2026 스카이수학과학입시학원 | 📞 010-5606-3041</p>
      </footer>
    </main>
  );
}
