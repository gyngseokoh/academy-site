export const dynamic = 'force-dynamic';
import Link from 'next/link';
import Nav from '@/app/components/Nav';
import StoryTabs from '@/app/components/StoryTabs';

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
  { icon: '🏫', title: '학교별 내신 분석', desc: '당산권 8개 학교별 출제 경향 · 맞춤 전략' },
  { icon: '📊', title: '학습관리 시스템', desc: '출결 · 숙제 · 테스트 · 보충 일괄 관리' },
  { icon: '📋', title: '월간 학습 리포트', desc: '매달 학부모께 학습 현황 투명하게 보고' },
  { icon: '🎯', title: '입시연구소 운영', desc: '수시 · 정시 · 고교학점제 전략 연구' },
  { icon: '👥', title: '소수 정예 수업', desc: '정원 제한으로 개인별 집중 지도' },
  { icon: '🔄', title: '결석 보충 시스템', desc: '모든 결석 수업 100% 보충 보장' },
];

async function getTeachers() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/teachers?select=id,name,subject,bio,photo_url,role&role=neq.director&order=sort_order.asc&limit=4`,
      { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! }, cache: 'no-store' },
    );
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

async function getClasses() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/classes?is_active=eq.true&select=id,name,subject,teachers(name),class_schedules(day_of_week,start_time,end_time),class_enrollments(id)&order=subject.asc,name.asc&limit=6`,
      { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! }, cache: 'no-store' },
    );
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

async function getReviews() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/reviews?is_published=eq.true&select=id,author,content,category&order=created_at.desc&limit=3`,
      { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! }, cache: 'no-store' },
    );
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

async function getStories() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/success_stories?is_published=eq.true&select=id,student_label,subject,school_before,school_after,result&order=created_at.desc&limit=3`,
      { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! }, cache: 'no-store' },
    );
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

async function getColumns() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/columns?is_published=eq.true&select=id,title,category,summary,created_at&order=created_at.desc&limit=3`,
      { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! }, cache: 'no-store' },
    );
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const SUBJECT_COLOR: Record<string, string> = {
  '수학': 'bg-blue-100 text-blue-700',
  '물리': 'bg-purple-100 text-purple-700',
  '화학': 'bg-yellow-100 text-yellow-700',
  '생명과학': 'bg-emerald-100 text-emerald-700',
  '지구과학': 'bg-orange-100 text-orange-700',
  '과학': 'bg-green-100 text-green-700',
};
function subjectColor(subject: string) {
  for (const k of Object.keys(SUBJECT_COLOR)) {
    if (subject?.includes(k)) return SUBJECT_COLOR[k];
  }
  return 'bg-gray-100 text-gray-600';
}

export default async function Home() {
  const [teachers, classes, reviews, stories, columns] = await Promise.all([
    getTeachers(), getClasses(), getReviews(), getStories(), getColumns(),
  ]);

  return (
    <main className="min-h-screen bg-white">
      <Nav />

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white">
        <div className="max-w-5xl mx-auto px-6 py-28 text-center">
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {['선유고', '장훈고', '여의도고', '여의도여고', '관악고', '당산중', '선유중'].map(school => (
              <span key={school} className="bg-white/15 text-white text-xs px-3 py-1 rounded-full font-medium">
                {school}
              </span>
            ))}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-6">
            당산권 학교별 내신과 입시를<br />
            <span className="text-yellow-300">책임지는</span> 수학·과학 전문 교육기관
          </h1>
          <p className="text-blue-200 text-base md:text-lg mb-12 leading-relaxed">
            학교별 맞춤 내신 분석 · 학습관리 시스템 · 월간 리포트 · 입시 전략
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/consultation"
              className="bg-yellow-400 text-blue-900 font-bold px-8 py-4 rounded-full hover:bg-yellow-300 transition text-sm md:text-base shadow-lg">
              📞 상담 신청
            </Link>
            <Link href="/about"
              className="bg-white/15 text-white font-bold px-8 py-4 rounded-full border-2 border-white/40 hover:bg-white/25 transition text-sm md:text-base">
              학원 소개 보기
            </Link>
            <Link href="/seminar"
              className="bg-white/10 text-white font-bold px-8 py-4 rounded-full border border-white/30 hover:bg-white/20 transition text-sm md:text-base">
              📅 설명회 신청
            </Link>
          </div>
        </div>
      </section>

      {/* 학교 빠른 이동 */}
      <section className="bg-gray-50 border-b">
        <div className="max-w-5xl mx-auto px-6 py-5">
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

      {/* SKY 차별점 */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-blue-700 font-bold text-xs tracking-widest uppercase mb-2">Why SKY</p>
            <h2 className="text-3xl font-bold text-gray-900">SKY만의 차별점</h2>
            <p className="text-gray-500 mt-3 text-sm">단순 수업이 아닌, 입시 전략부터 학습 관리까지</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-6 hover:bg-blue-50 hover:shadow-md transition group border border-transparent hover:border-blue-100">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-gray-900 mb-1 text-sm md:text-base">{f.title}</h3>
                <p className="text-gray-500 text-xs md:text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/about" className="text-blue-700 font-bold text-sm hover:underline">
              자세히 알아보기 →
            </Link>
          </div>
        </div>
      </section>

      {/* 선생님 소개 */}
      {teachers.length > 0 && (
        <section className="bg-gray-50 py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-blue-700 font-bold text-xs tracking-widest uppercase mb-2">Our Teachers</p>
              <h2 className="text-3xl font-bold text-gray-900">선생님 소개</h2>
              <p className="text-gray-500 mt-3 text-sm">학생 한 명 한 명을 책임지는 SKY의 전문 교사진</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {teachers.map((t: any) => (
                <div key={t.id} className="text-center group">
                  <div className="relative mb-3">
                    {t.photo_url ? (
                      <img src={t.photo_url} alt={t.name}
                        className="w-full aspect-square object-cover rounded-2xl shadow-sm group-hover:shadow-md transition" />
                    ) : (
                      <div className="w-full aspect-square bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
                        <span className="text-4xl text-blue-300">👤</span>
                      </div>
                    )}
                    {(t.role === 'director' || t.role === 'vice_director') && (
                      <span className="absolute -top-2 -right-2 bg-blue-900 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {t.role === 'director' ? '원장' : '부원장'}
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-gray-900 text-sm">{t.name} 선생님</div>
                  {t.subject && <div className="text-blue-700 text-xs mt-0.5">{t.subject}</div>}
                  {t.bio && <div className="text-gray-400 text-xs mt-1 line-clamp-2 leading-relaxed">{t.bio}</div>}
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/teachers" className="text-blue-700 font-bold text-sm hover:underline">
                전체 선생님 보기 →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 반 소개 */}
      {classes.length > 0 && (
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-blue-700 font-bold text-xs tracking-widest uppercase mb-2">Curriculum</p>
              <h2 className="text-3xl font-bold text-gray-900">개설 반 안내</h2>
              <p className="text-gray-500 mt-3 text-sm">수준과 목표에 맞는 반을 선택하세요</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((cls: any) => {
                const schedule = cls.class_schedules?.[0];
                return (
                  <div key={cls.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-blue-200 transition">
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-bold text-gray-900">{cls.name}</div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${subjectColor(cls.subject)}`}>
                        {cls.subject}
                      </span>
                    </div>
                    {cls.teachers && (
                      <div className="text-xs text-gray-500 mb-1">{cls.teachers.name} 선생님</div>
                    )}
                    {schedule && (
                      <div className="text-xs text-gray-400">
                        🕐 {DAYS[schedule.day_of_week]} {schedule.start_time.slice(0,5)}~{schedule.end_time.slice(0,5)}
                      </div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">재원 {cls.class_enrollments?.length ?? 0}명</div>
                  </div>
                );
              })}
            </div>
            <div className="text-center mt-8">
              <Link href="/curriculum" className="text-blue-700 font-bold text-sm hover:underline">
                전체 반 보기 →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* SKY의 이야기 — 합격사례·후기·칼럼 탭 */}
      <StoryTabs stories={stories} reviews={reviews} columns={columns} />

      {/* 상담 CTA */}
      <section className="bg-blue-900 text-white py-16 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">"당산권 입시하면 SKY"</h2>
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
            <Link href="/about" className="hover:text-white transition">학원 소개</Link>
            <Link href="/teachers" className="hover:text-white transition">선생님 소개</Link>
            <Link href="/curriculum" className="hover:text-white transition">반 소개</Link>
            <Link href="/schools" className="hover:text-white transition">학교 분석</Link>
            <Link href="/reviews" className="hover:text-white transition">학부모 후기</Link>
            <Link href="/consultation" className="hover:text-white transition">상담 신청</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
