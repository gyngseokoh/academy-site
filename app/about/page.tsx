export const dynamic = 'force-dynamic';
import Link from 'next/link';

async function getSettings(): Promise<Record<string, string>> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/site_settings?select=key,value`,
      { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! }, cache: 'no-store' },
    );
    const rows: { key: string; value: string }[] = await res.json();
    const obj: Record<string, string> = {};
    if (Array.isArray(rows)) rows.forEach(r => { obj[r.key] = r.value; });
    return obj;
  } catch { return {}; }
}

const FEATURES = [
  {
    icon: '🎯',
    title: '학교별 맞춤 내신 전략',
    desc: '선유고·장훈고·여의도고 등 당산권 학교별 출제 경향을 분석해 각 학교에 최적화된 내신 전략을 제공합니다. 같은 단원도 학교마다 출제 방식이 다릅니다.',
  },
  {
    icon: '📊',
    title: '체계적인 학습관리 시스템',
    desc: '출결·숙제·테스트·보충까지 모든 학습 데이터를 기록하고 관리합니다. 단순히 수업만 하는 것이 아니라 학생의 성장 과정을 함께 추적합니다.',
  },
  {
    icon: '📋',
    title: '월간 학습 리포트',
    desc: '매달 학습 태도·집중도·테스트 결과·향후 계획을 담은 상세 리포트를 학부모께 제공합니다. 우리 아이가 지금 어떻게 성장하고 있는지 투명하게 공유합니다.',
  },
  {
    icon: '🏫',
    title: '입시연구소 운영',
    desc: '고교학점제·수시·정시 전략과 학교별 입결 분석 자료를 지속적으로 연구합니다. 입시 트렌드 변화에 선제적으로 대응해 학생에게 최적의 전략을 제시합니다.',
  },
  {
    icon: '👥',
    title: '소수 정예 수업',
    desc: '반별 정원을 제한해 선생님이 학생 한 명 한 명에게 집중할 수 있는 환경을 만듭니다. 모르는 부분은 그냥 넘어가지 않습니다.',
  },
  {
    icon: '🔄',
    title: '결석 보충 시스템',
    desc: '불가피하게 결석한 수업은 반드시 보충합니다. 한 번의 결석도 학습 공백으로 이어지지 않도록 체계적인 보충 수업 시스템을 운영합니다.',
  },
];

const PROCESS = [
  { step: '01', title: '입학 상담', desc: '현재 학습 상태와 목표를 파악하고 최적의 반을 안내합니다.' },
  { step: '02', title: '수준 진단', desc: '진단 테스트로 정확한 현재 위치를 파악합니다.' },
  { step: '03', title: '맞춤 배치', desc: '진단 결과에 따라 가장 적합한 반에 배치됩니다.' },
  { step: '04', title: '학습 시작', desc: '학교별 내신 분석을 바탕으로 체계적인 수업이 시작됩니다.' },
  { step: '05', title: '월간 리포트', desc: '매달 학습 현황을 학부모께 상세히 보고합니다.' },
  { step: '06', title: '목표 달성', desc: '내신 향상·입시 성공까지 끝까지 함께합니다.' },
];

const STATS = [
  { value: '8개', label: '당산권 학교 분석' },
  { value: '100%', label: '보충 수업 실시' },
  { value: '매월', label: '학습 리포트 발송' },
  { value: '소수', label: '정예 운영' },
];

export default async function AboutPage() {
  const s = await getSettings();
  return (
    <main className="min-h-screen bg-white">
      {/* 네비게이션 */}
      <nav className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="SKY" className="h-9 w-9 object-contain" />
          <span className="text-lg font-bold hidden sm:block">스카이수학과학입시학원</span>
        </Link>
        <div className="flex gap-4 text-sm font-medium">
          <Link href="/about" className="text-yellow-300 font-bold">학원 소개</Link>
          <Link href="/curriculum" className="hover:text-blue-300 transition">반 소개</Link>
          <Link href="/schools" className="hover:text-blue-300 transition">학교 분석</Link>
          <Link href="/teachers" className="hover:text-blue-300 transition">선생님</Link>
          <Link href="/consultation" className="hover:text-blue-300 transition">상담 신청</Link>
        </div>
      </nav>

      {/* 히어로 */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white py-24 px-6 text-center">
        <p className="text-yellow-300 text-xs font-bold tracking-widest mb-4 uppercase">About SKY</p>
        <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
          당산권 수학·과학 전문<br />
          <span className="text-yellow-300">스카이수학과학입시학원</span>
        </h1>
        <p className="text-blue-200 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
          {s['about_hero_desc'] || '단순한 수업이 아닙니다. 학교별 내신 분석부터 입시 전략, 월간 리포트까지—학생 한 명 한 명의 성장을 책임지는 교육을 실천합니다.'}
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/consultation"
            className="bg-yellow-400 text-blue-900 font-bold px-8 py-3 rounded-full hover:bg-yellow-300 transition">
            상담 신청하기
          </Link>
          <Link href="/curriculum"
            className="bg-white/15 text-white font-bold px-8 py-3 rounded-full border border-white/30 hover:bg-white/25 transition">
            반 소개 보기
          </Link>
        </div>
      </section>

      {/* 숫자로 보는 SKY */}
      <section className="bg-blue-50 py-12 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map((s, i) => (
            <div key={i}>
              <div className="text-3xl font-bold text-blue-700 mb-1">{s.value}</div>
              <div className="text-gray-500 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 교육 철학 */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-blue-700 font-bold text-xs tracking-widest uppercase mb-2">Philosophy</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">우리의 교육 철학</h2>
            <p className="text-gray-500 max-w-2xl mx-auto leading-relaxed">
              SKY는 점수를 올리는 학원이 아닙니다.<br />
              학생이 <strong className="text-blue-700">스스로 생각하고 문제를 해결하는 힘</strong>을 기르는 곳입니다.<br />
              내신과 입시는 그 과정에서 자연스럽게 따라오는 결과입니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '🔍', n: 1 },
              { icon: '📈', n: 2 },
              { icon: '🤝', n: 3 },
            ].map(({ icon, n }) => (
              <div key={n} className="bg-blue-900 text-white rounded-2xl p-8 text-center">
                <div className="text-4xl mb-4">{icon}</div>
                <h3 className="text-xl font-bold mb-3">
                  {s[`about_philosophy_${n}_title`] || ['개념 중심', '데이터 기반', '소통과 신뢰'][n - 1]}
                </h3>
                <p className="text-blue-200 text-sm leading-relaxed">
                  {s[`about_philosophy_${n}_desc`] || [
                    '암기보다 이해를 먼저. 개념이 탄탄해야 어떤 문제도 풀 수 있습니다.',
                    '출결, 테스트, 과제 데이터를 분석해 학생별 취약점을 정확히 파악합니다.',
                    '선생님·학생·학부모 삼자가 함께 소통하며 목표를 향해 나아갑니다.',
                  ][n - 1]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SKY만의 차별점 */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-blue-700 font-bold text-xs tracking-widest uppercase mb-2">Why SKY</p>
            <h2 className="text-3xl font-bold text-gray-900">SKY만의 6가지 차별점</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition">
                <div className="flex items-start gap-4">
                  <span className="text-3xl flex-shrink-0">{f.icon}</span>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 입학 프로세스 */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-blue-700 font-bold text-xs tracking-widest uppercase mb-2">Process</p>
            <h2 className="text-3xl font-bold text-gray-900">입학부터 목표 달성까지</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {PROCESS.map((p, i) => (
              <div key={i} className="relative bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-md transition">
                <div className="text-blue-100 font-black text-5xl absolute top-4 right-4 leading-none">{p.step}</div>
                <div className="relative">
                  <div className="text-blue-700 font-bold text-sm mb-1">Step {p.step}</div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{p.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 위치 & 연락처 */}
      <section className="bg-blue-900 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-yellow-300 text-xs font-bold tracking-widest uppercase mb-3">Location</p>
            <h2 className="text-2xl font-bold mb-6">오시는 길</h2>
            <div className="space-y-3 text-blue-200 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">📍</span>
                <div>
                  <div className="text-white font-bold mb-0.5">주소</div>
                  <div>{s['contact_address'] || '서울시 영등포구 당산동'}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">📞</span>
                <div>
                  <div className="text-white font-bold mb-0.5">전화</div>
                  <div>{s['contact_phone'] || '010-5606-3041'}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">🕐</span>
                <div>
                  <div className="text-white font-bold mb-0.5">운영 시간</div>
                  <div>{s['contact_hours_weekday'] || '평일 14:00 ~ 22:00'}</div>
                  <div>{s['contact_hours_saturday'] || '토요일 10:00 ~ 18:00'}</div>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center">
            <p className="text-blue-200 text-sm mb-6">지금 바로 상담을 신청하고<br />우리 아이에게 맞는 학습 전략을 받아보세요.</p>
            <Link href="/consultation"
              className="bg-yellow-400 text-blue-900 font-bold px-10 py-4 rounded-full hover:bg-yellow-300 transition inline-block text-lg">
              📞 무료 상담 신청
            </Link>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-6 text-center text-sm">
        <p>© 2026 스카이수학과학입시학원 | 📞 010-5606-3041 · 당산동</p>
      </footer>
    </main>
  );
}
