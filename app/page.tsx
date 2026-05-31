import Link from 'next/link';

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

const FEATURES = [
  {
    icon: '🏫',
    title: '학교별 내신 분석',
    desc: '선유고·장훈고·여의도고 등 당산권 학교별 시험 출제 경향과 내신 전략을 제공합니다.',
    link: '/schools',
    linkText: '학교 분석 보기',
  },
  {
    icon: '📊',
    title: '학습관리 시스템',
    desc: '출결·숙제·테스트·보충까지 학생별 맞춤 학습을 체계적으로 관리합니다.',
    link: '/consultation',
    linkText: '상담 신청하기',
  },
  {
    icon: '📋',
    title: '월간 학습 리포트',
    desc: '매달 학습 태도·집중도·테스트 결과를 담은 리포트를 학부모께 제공합니다.',
    link: '/consultation',
    linkText: '상담 신청하기',
  },
  {
    icon: '🎯',
    title: '입시연구소 운영',
    desc: '고교학점제·수시·정시 전략과 학교별 입결 분석 자료를 제공합니다.',
    link: '/consultation',
    linkText: '입시 상담하기',
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* 네비게이션 */}
      <nav className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="SKY" className="h-9 w-9 object-contain" />
          <span className="text-lg font-bold tracking-tight hidden sm:block">스카이수학과학입시학원</span>
        </Link>
        <div className="flex gap-5 text-sm font-medium">
          <Link href="/schools" className="hover:text-blue-300 transition">학교 분석</Link>
          <Link href="/columns" className="hover:text-blue-300 transition">입시 칼럼</Link>
          <Link href="/stories" className="hover:text-blue-300 transition">합격 사례</Link>
          <Link href="/teachers" className="hover:text-blue-300 transition">선생님 소개</Link>
          <Link href="/consultation" className="hover:text-blue-300 transition">상담 신청</Link>
        </div>
      </nav>

      {/* Hero 섹션 */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white">
        <div className="max-w-5xl mx-auto px-6 py-28 text-center">
          {/* 학교 태그 */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {['선유고', '장훈고', '여의도고', '여의도여고', '관악고'].map(school => (
              <span key={school} className="bg-white/15 text-white text-xs px-3 py-1 rounded-full font-medium">
                {school}
              </span>
            ))}
          </div>

          {/* 메인 헤드라인 */}
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-6">
            당산권 학교별 내신과 입시를<br />
            <span className="text-yellow-300">책임지는</span> 수학·과학 전문 교육기관
          </h1>

          <p className="text-blue-200 text-base md:text-lg mb-12 leading-relaxed">
            학교별 맞춤 내신 분석 · 학습관리 시스템 · 월간 리포트 · 입시 전략 제공
          </p>

          {/* CTA 버튼 */}
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/consultation"
              className="bg-yellow-400 text-blue-900 font-bold px-8 py-4 rounded-full hover:bg-yellow-300 transition text-sm md:text-base shadow-lg">
              📞 상담 신청
            </Link>
            <Link href="/schools"
              className="bg-white/15 text-white font-bold px-8 py-4 rounded-full border-2 border-white/40 hover:bg-white/25 transition text-sm md:text-base">
              🏫 학교 분석 보기
            </Link>
            <Link href="/seminar"
              className="bg-white/10 text-white font-bold px-8 py-4 rounded-full border border-white/30 hover:bg-white/20 transition text-sm md:text-base">
              📅 설명회 신청
            </Link>
          </div>
        </div>
      </section>

      {/* 당산권 학교 빠른 이동 */}
      <section className="bg-gray-50 border-b">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-gray-500 text-sm font-medium mr-2">학교별 분석:</span>
            {SCHOOLS.map(s => (
              <Link key={s.name} href={s.href}
                className="bg-white text-blue-800 border border-blue-100 text-sm px-4 py-1.5 rounded-full font-medium hover:bg-blue-700 hover:text-white hover:border-blue-700 transition">
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SKY만의 차별점 */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-blue-700 font-bold text-sm mb-2 tracking-widest uppercase">Why SKY</p>
            <h2 className="text-3xl font-bold text-gray-900">SKY만의 차별점</h2>
            <p className="text-gray-500 mt-3">단순 수업이 아닌, 입시 전략부터 학습 관리까지</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-8 hover:shadow-lg hover:border-blue-200 transition group">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{f.desc}</p>
                <Link href={f.link}
                  className="text-blue-700 text-sm font-bold group-hover:underline">
                  {f.linkText} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 상담 CTA 배너 */}
      <section className="bg-blue-900 text-white py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            "당산권 입시하면 SKY"
          </h2>
          <p className="text-blue-300 mb-8 text-sm md:text-base">
            지금 바로 상담을 신청하고 우리 아이에게 맞는 학습 전략을 받아보세요.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/consultation"
              className="bg-yellow-400 text-blue-900 font-bold px-8 py-3 rounded-full hover:bg-yellow-300 transition">
              신규생 상담 신청
            </Link>
            <Link href="/consultation/current"
              className="bg-white/15 text-white font-bold px-8 py-3 rounded-full border border-white/30 hover:bg-white/25 transition">
              재원생 상담 신청
            </Link>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="SKY" className="h-8 w-8 object-contain" />
            <span className="text-white font-bold text-sm">스카이수학과학입시학원</span>
          </div>
          <div className="text-sm text-center">
            <p>© 2026 스카이수학과학입시학원</p>
            <p className="mt-1">📞 010-5606-3041 · 당산동</p>
          </div>
          <div className="flex gap-4 text-sm flex-wrap justify-center">
            <Link href="/schools" className="hover:text-white transition">학교 분석</Link>
            <Link href="/columns" className="hover:text-white transition">입시 칼럼</Link>
            <Link href="/stories" className="hover:text-white transition">합격 사례</Link>
            <Link href="/reviews" className="hover:text-white transition">학부모 후기</Link>
            <Link href="/teachers" className="hover:text-white transition">선생님 소개</Link>
            <Link href="/consultation" className="hover:text-white transition">상담 신청</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
