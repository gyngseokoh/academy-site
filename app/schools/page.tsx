import Link from 'next/link';

const HIGH_SCHOOLS = [
  { name: '선유고등학교', short: '선유고', slug: 'seonyugo', type: '고등', desc: '내신 난도 및 시험 출제 경향 분석' },
  { name: '장훈고등학교', short: '장훈고', slug: 'janghungo', type: '고등', desc: '내신 난도 및 시험 출제 경향 분석' },
  { name: '여의도고등학교', short: '여의도고', slug: 'yeouido', type: '고등', desc: '내신 난도 및 시험 출제 경향 분석' },
  { name: '여의도여자고등학교', short: '여의도여고', slug: 'yeouidogirls', type: '고등', desc: '내신 난도 및 시험 출제 경향 분석' },
  { name: '관악고등학교', short: '관악고', slug: 'gwanakgo', type: '고등', desc: '내신 난도 및 시험 출제 경향 분석' },
];

const MIDDLE_SCHOOLS = [
  { name: '당산서중학교', short: '당산서중', slug: 'dangsanseo', type: '중등', desc: '내신 준비 및 고등 연계 전략' },
  { name: '당산중학교', short: '당산중', slug: 'dangsan', type: '중등', desc: '내신 준비 및 고등 연계 전략' },
  { name: '선유중학교', short: '선유중', slug: 'seonyu', type: '중등', desc: '내신 준비 및 고등 연계 전략' },
];

export default function SchoolsPage() {
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
          <Link href="/consultation/current" className="hover:text-blue-300 transition">재원생 상담</Link>
        </div>
      </nav>

      {/* 헤더 */}
      <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-16 px-6 text-center">
        <p className="text-blue-300 text-sm font-bold mb-2 tracking-widest">SCHOOL ANALYSIS</p>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">당산권 학교별 분석</h1>
        <p className="text-blue-200 text-sm md:text-base max-w-xl mx-auto">
          학교마다 다른 출제 경향과 내신 전략.<br />
          SKY는 당산권 학교별 데이터를 분석하여 맞춤 전략을 제공합니다.
        </p>
      </section>

      <div className="max-w-4xl mx-auto py-16 px-6">
        {/* 고등학교 */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-blue-900 text-white text-xs font-bold px-3 py-1 rounded-full">고등학교</span>
            <h2 className="text-xl font-bold text-gray-800">당산권 고등학교</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {HIGH_SCHOOLS.map(s => (
              <Link key={s.slug} href={`/schools/${s.slug}`}
                className="group bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-blue-300 transition">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-700 transition">{s.short}</h3>
                    <p className="text-gray-400 text-xs mt-0.5">{s.name}</p>
                  </div>
                  <span className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full font-medium">{s.type}</span>
                </div>
                <p className="text-gray-500 text-sm mb-3">{s.desc}</p>
                <div className="flex gap-2 text-xs text-gray-400">
                  <span className="bg-gray-50 px-2 py-1 rounded">수학 분석</span>
                  <span className="bg-gray-50 px-2 py-1 rounded">과학 분석</span>
                  <span className="bg-gray-50 px-2 py-1 rounded">학습 전략</span>
                </div>
                <p className="text-blue-600 text-sm font-bold mt-3 group-hover:underline">분석 보기 →</p>
              </Link>
            ))}
          </div>
        </div>

        {/* 중학교 */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-gray-700 text-white text-xs font-bold px-3 py-1 rounded-full">중학교</span>
            <h2 className="text-xl font-bold text-gray-800">당산권 중학교</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MIDDLE_SCHOOLS.map(s => (
              <Link key={s.slug} href={`/schools/${s.slug}`}
                className="group bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-blue-300 transition">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-700 transition">{s.short}</h3>
                    <p className="text-gray-400 text-xs mt-0.5">{s.name}</p>
                  </div>
                  <span className="bg-gray-50 text-gray-600 text-xs px-2 py-1 rounded-full font-medium">{s.type}</span>
                </div>
                <p className="text-gray-500 text-sm mb-3">{s.desc}</p>
                <div className="flex gap-2 text-xs text-gray-400">
                  <span className="bg-gray-50 px-2 py-1 rounded">수학 분석</span>
                  <span className="bg-gray-50 px-2 py-1 rounded">과학 분석</span>
                  <span className="bg-gray-50 px-2 py-1 rounded">고등 연계</span>
                </div>
                <p className="text-blue-600 text-sm font-bold mt-3 group-hover:underline">분석 보기 →</p>
              </Link>
            ))}
          </div>
        </div>

        {/* 상담 CTA */}
        <div className="mt-16 bg-blue-900 rounded-2xl p-8 text-center text-white">
          <h3 className="text-xl font-bold mb-2">우리 아이 학교 맞춤 전략이 필요하신가요?</h3>
          <p className="text-blue-300 text-sm mb-6">학교별 분석을 바탕으로 1:1 입시 상담을 제공합니다.</p>
          <Link href="/consultation"
            className="bg-yellow-400 text-blue-900 font-bold px-8 py-3 rounded-full hover:bg-yellow-300 transition inline-block">
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
