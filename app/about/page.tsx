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

async function getDirector() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/teachers?role=eq.director&select=*&limit=1`,
      { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! }, cache: 'no-store' },
    );
    const data = await res.json();
    return Array.isArray(data) && data.length > 0 ? data[0] : null;
  } catch { return null; }
}

export default async function AboutPage() {
  const [s, director] = await Promise.all([getSettings(), getDirector()]);

  const philosophy = [
    { icon: '🔍', n: 1, fallbackTitle: '개념 중심', fallbackDesc: '암기보다 이해를 먼저. 개념이 탄탄해야 어떤 문제도 풀 수 있습니다.' },
    { icon: '📈', n: 2, fallbackTitle: '데이터 기반', fallbackDesc: '출결, 테스트, 과제 데이터를 분석해 학생별 취약점을 정확히 파악합니다.' },
    { icon: '🤝', n: 3, fallbackTitle: '소통과 신뢰', fallbackDesc: '선생님·학생·학부모 삼자가 함께 소통하며 목표를 향해 나아갑니다.' },
  ];

  return (
    <main className="min-h-screen bg-white">
      {/* 네비 */}
      <nav className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="SKY" className="h-9 w-9 object-contain" />
          <span className="text-lg font-bold hidden sm:block">스카이수학과학입시학원</span>
        </Link>
        <div className="flex gap-4 text-sm font-medium">
          <Link href="/about" className="text-yellow-300 font-bold">학원 소개</Link>
          <Link href="/teachers" className="hover:text-blue-300 transition">선생님 소개</Link>
          <Link href="/curriculum" className="hover:text-blue-300 transition">반 소개</Link>
          <Link href="/schools" className="hover:text-blue-300 transition">학교 분석</Link>
          <Link href="/consultation" className="hover:text-blue-300 transition bg-yellow-400 text-blue-900 px-4 py-1 rounded-full font-bold">상담 신청</Link>
        </div>
      </nav>

      {/* 히어로 — 좌우 분할 레이아웃 */}
      <section className="bg-blue-900 text-white">
        <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-yellow-400 text-xs font-bold tracking-widest uppercase mb-4">About SKY</p>
            <h1 className="text-4xl md:text-5xl font-black leading-tight mb-6">
              당산권을 책임지는<br />
              수학·과학<br />
              <span className="text-yellow-300">전문 학원</span>
            </h1>
            <p className="text-blue-200 leading-relaxed mb-8 text-sm md:text-base">
              {s['about_hero_desc'] || '단순한 수업이 아닙니다. 학교별 내신 분석부터 입시 전략, 월간 리포트까지—학생 한 명 한 명의 성장을 책임지는 교육을 실천합니다.'}
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/consultation" className="bg-yellow-400 text-blue-900 font-bold px-6 py-3 rounded-full hover:bg-yellow-300 transition text-sm">
                상담 신청하기
              </Link>
              <Link href="/curriculum" className="border border-white/40 text-white font-bold px-6 py-3 rounded-full hover:bg-white/10 transition text-sm">
                반 소개 보기
              </Link>
            </div>
          </div>
          {/* 오른쪽 — 핵심 지표 */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { num: '8개', label: '당산권\n학교 분석' },
              { num: '100%', label: '결석 보충\n수업 보장' },
              { num: '매월', label: '학부모\n학습 리포트' },
              { num: '소수', label: '정예\n수업 운영' },
            ].map((item, i) => (
              <div key={i} className="bg-white/10 rounded-2xl p-6 text-center backdrop-blur-sm border border-white/10">
                <div className="text-3xl font-black text-yellow-300 mb-2">{item.num}</div>
                <div className="text-blue-200 text-xs leading-relaxed whitespace-pre-line">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 원장 인사말 */}
      {director && (
        <section className="bg-white py-20 px-6 border-b">
          <div className="max-w-4xl mx-auto">
            <p className="text-blue-700 font-bold text-xs tracking-widest uppercase mb-2">Director</p>
            <h2 className="text-2xl font-bold text-gray-900 mb-10">원장 인사말</h2>
            <div className="flex flex-col md:flex-row gap-10 items-start">
              <div className="flex-shrink-0 text-center">
                {director.photo_url ? (
                  <img src={director.photo_url} alt={director.name}
                    className="w-40 h-40 object-cover rounded-2xl shadow-md" />
                ) : (
                  <div className="w-40 h-40 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center shadow-md">
                    <span className="text-6xl text-blue-300">👤</span>
                  </div>
                )}
                <div className="mt-3 font-bold text-gray-900">{director.name}</div>
                <div className="text-blue-700 text-sm">원장</div>
                {director.subject && <div className="text-gray-400 text-xs mt-0.5">{director.subject}</div>}
              </div>
              <div className="flex-1">
                <div className="text-4xl text-blue-100 font-black leading-none mb-3">"</div>
                {director.bio ? (
                  <p className="text-gray-700 leading-relaxed text-base whitespace-pre-line">{director.bio}</p>
                ) : (
                  <p className="text-gray-700 leading-relaxed text-base">
                    SKY수학과학입시학원은 단순히 문제를 푸는 법을 가르치는 것이 아니라,
                    학생이 스스로 생각하는 힘을 기르는 것을 목표로 합니다.<br /><br />
                    당산권 학교들의 출제 경향을 누구보다 잘 알고 있으며,
                    모든 학생의 성장 과정을 데이터로 기록하고 학부모님과 투명하게 소통합니다.<br /><br />
                    믿고 맡겨주시면, 끝까지 책임지겠습니다.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 교육 철학 — 세로 타임라인 스타일 */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <p className="text-blue-700 font-bold text-xs tracking-widest uppercase mb-2">Philosophy</p>
            <h2 className="text-2xl font-bold text-gray-900">우리의 교육 철학</h2>
          </div>
          <div className="space-y-0">
            {philosophy.map(({ icon, n, fallbackTitle, fallbackDesc }, i) => (
              <div key={n} className={`flex gap-8 items-stretch ${i < philosophy.length - 1 ? 'pb-0' : ''}`}>
                {/* 번호 + 라인 */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-blue-700 text-white flex items-center justify-center font-black text-lg flex-shrink-0">
                    {String(n).padStart(2, '0')}
                  </div>
                  {i < philosophy.length - 1 && (
                    <div className="w-0.5 bg-blue-100 flex-1 my-2" style={{ minHeight: 40 }} />
                  )}
                </div>
                {/* 내용 */}
                <div className={`pb-10 flex-1 ${i === philosophy.length - 1 ? 'pb-0' : ''}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{icon}</span>
                    <h3 className="text-xl font-bold text-gray-900">
                      {s[`about_philosophy_${n}_title`] || fallbackTitle}
                    </h3>
                  </div>
                  <p className="text-gray-500 leading-relaxed">
                    {s[`about_philosophy_${n}_desc`] || fallbackDesc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SKY 차별점 — 컴팩트 리스트 */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-12">
            <p className="text-blue-700 font-bold text-xs tracking-widest uppercase mb-2">Why SKY</p>
            <h2 className="text-2xl font-bold text-gray-900">SKY만의 차별점</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-px bg-gray-100 rounded-2xl overflow-hidden border border-gray-100">
            {[
              { icon: '🎯', title: '학교별 맞춤 내신 전략', desc: '당산권 8개 학교 출제 경향 분석 · 학교별 최적화 전략' },
              { icon: '📊', title: '체계적인 학습관리', desc: '출결 · 숙제 · 테스트 · 보충 데이터 일괄 관리' },
              { icon: '📋', title: '월간 학습 리포트', desc: '학습 태도 · 집중도 · 테스트 결과 학부모 보고' },
              { icon: '🏫', title: '입시연구소 운영', desc: '수시 · 정시 · 고교학점제 전략 지속 연구' },
              { icon: '👥', title: '소수 정예 수업', desc: '반별 정원 제한 — 개인별 집중 지도 보장' },
              { icon: '🔄', title: '결석 보충 시스템', desc: '모든 결석 수업 100% 보충 실시' },
            ].map((item, i) => (
              <div key={i} className="bg-white p-6 flex items-start gap-4 hover:bg-blue-50 transition">
                <span className="text-2xl flex-shrink-0">{item.icon}</span>
                <div>
                  <div className="font-bold text-gray-900 mb-1">{item.title}</div>
                  <div className="text-gray-500 text-sm">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 입학 프로세스 — 가로 스텝 */}
      <section className="bg-blue-900 text-white py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-yellow-400 text-xs font-bold tracking-widest uppercase mb-2">Process</p>
            <h2 className="text-2xl font-bold">입학부터 목표 달성까지</h2>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {[
              { step: '01', title: '입학 상담', desc: '현재 수준 파악' },
              { step: '02', title: '수준 진단', desc: '진단 테스트' },
              { step: '03', title: '맞춤 배치', desc: '최적 반 배정' },
              { step: '04', title: '수업 시작', desc: '내신 맞춤 수업' },
              { step: '05', title: '월간 리포트', desc: '학부모 보고' },
              { step: '06', title: '목표 달성', desc: '끝까지 함께' },
            ].map((p, i) => (
              <div key={i} className="text-center relative">
                <div className="w-10 h-10 rounded-full bg-yellow-400 text-blue-900 font-black text-sm flex items-center justify-center mx-auto mb-3">
                  {p.step}
                </div>
                <div className="font-bold text-sm mb-1">{p.title}</div>
                <div className="text-blue-300 text-xs">{p.desc}</div>
                {i < 5 && (
                  <div className="hidden md:block absolute top-5 left-[60%] w-[80%] h-0.5 bg-white/20" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 연락처 */}
      <section className="py-16 px-6 border-t">
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl mb-3">📍</div>
            <div className="font-bold text-gray-900 mb-1">주소</div>
            <div className="text-gray-500 text-sm">{s['contact_address'] || '서울시 영등포구 당산동'}</div>
          </div>
          <div>
            <div className="text-3xl mb-3">📞</div>
            <div className="font-bold text-gray-900 mb-1">전화</div>
            <div className="text-gray-500 text-sm">{s['contact_phone'] || '010-5606-3041'}</div>
          </div>
          <div>
            <div className="text-3xl mb-3">🕐</div>
            <div className="font-bold text-gray-900 mb-1">운영 시간</div>
            <div className="text-gray-500 text-sm">
              {s['contact_hours_weekday'] || '평일 14:00 ~ 22:00'}<br />
              {s['contact_hours_saturday'] || '토요일 10:00 ~ 18:00'}
            </div>
          </div>
        </div>
        <div className="text-center mt-10">
          <Link href="/consultation"
            className="bg-blue-900 text-white font-bold px-10 py-4 rounded-full hover:bg-blue-800 transition inline-block">
            📞 무료 상담 신청
          </Link>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-8 px-6 text-center text-sm">
        <p>© 2026 스카이수학과학입시학원 | 📞 010-5606-3041 · 당산동</p>
      </footer>
    </main>
  );
}
