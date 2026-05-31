export const dynamic = 'force-dynamic';
import Link from 'next/link';

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];

const SUBJECT_CONFIG: Record<string, { color: string; bg: string; border: string; icon: string; desc: string }> = {
  '수학': {
    color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200',
    icon: '📐',
    desc: '개념 이해부터 심화 문제까지. 학교별 출제 경향을 분석한 맞춤 내신 수업과 수능 수학을 함께 대비합니다.',
  },
  '과학': {
    color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200',
    icon: '🔬',
    desc: '물리·화학·생명과학·지구과학 전 영역. 탐구 기반 수업으로 개념과 실전을 동시에 잡습니다.',
  },
  '물리': {
    color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200',
    icon: '⚡',
    desc: '수능 물리학Ⅰ·Ⅱ 및 내신 물리 전문 수업. 공식 암기가 아닌 원리 이해 중심으로 접근합니다.',
  },
  '화학': {
    color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200',
    icon: '🧪',
    desc: '화학Ⅰ·Ⅱ 내신 및 수능 대비. 반응식과 계산 문제를 체계적으로 정리합니다.',
  },
  '생명과학': {
    color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200',
    icon: '🧬',
    desc: '생명과학Ⅰ·Ⅱ 내신 및 수능 대비. 방대한 개념을 체계적으로 정리하고 기출을 완벽 분석합니다.',
  },
  '지구과학': {
    color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200',
    icon: '🌍',
    desc: '지구과학Ⅰ·Ⅱ 내신 및 수능 대비. 다양한 자료 해석 능력을 집중 훈련합니다.',
  },
};

const DEFAULT_CONFIG = {
  color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200',
  icon: '📚',
  desc: '체계적인 커리큘럼으로 내신과 수능을 함께 대비합니다.',
};

function getConfig(subject: string) {
  for (const key of Object.keys(SUBJECT_CONFIG)) {
    if (subject?.includes(key)) return SUBJECT_CONFIG[key];
  }
  return DEFAULT_CONFIG;
}

function formatSchedule(schedules: { day_of_week: number; start_time: string; end_time: string }[]) {
  return schedules
    .sort((a, b) => a.day_of_week - b.day_of_week)
    .map(s => `${DAYS[s.day_of_week]} ${s.start_time.slice(0, 5)}~${s.end_time.slice(0, 5)}`)
    .join(' / ');
}

export default async function CurriculumPage() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/classes?is_active=eq.true&select=*,teachers(id,name,subject,bio,photo_url),class_schedules(day_of_week,start_time,end_time),class_enrollments(id)&order=subject.asc,name.asc`,
    {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
      cache: 'no-store',
    },
  );
  const classes = await res.json();

  // 과목별 그룹핑
  const grouped: Record<string, any[]> = {};
  if (Array.isArray(classes)) {
    classes.forEach((cls: any) => {
      const subject = cls.subject || '기타';
      if (!grouped[subject]) grouped[subject] = [];
      grouped[subject].push(cls);
    });
  }

  const subjectOrder = ['수학', '물리', '화학', '생명과학', '지구과학', '과학', '기타'];
  const sortedSubjects = Object.keys(grouped).sort(
    (a, b) => {
      const ai = subjectOrder.findIndex(s => a.includes(s));
      const bi = subjectOrder.findIndex(s => b.includes(s));
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    }
  );

  return (
    <main className="min-h-screen bg-white">
      {/* 네비게이션 */}
      <nav className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="SKY" className="h-9 w-9 object-contain" />
          <span className="text-lg font-bold hidden sm:block">스카이수학과학입시학원</span>
        </Link>
        <div className="flex gap-4 text-sm font-medium">
          <Link href="/about" className="hover:text-blue-300 transition">학원 소개</Link>
          <Link href="/curriculum" className="text-yellow-300 font-bold">반 소개</Link>
          <Link href="/schools" className="hover:text-blue-300 transition">학교 분석</Link>
          <Link href="/teachers" className="hover:text-blue-300 transition">선생님</Link>
          <Link href="/consultation" className="hover:text-blue-300 transition">상담 신청</Link>
        </div>
      </nav>

      {/* 히어로 */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white py-20 px-6 text-center">
        <p className="text-yellow-300 text-xs font-bold tracking-widest uppercase mb-4">Curriculum</p>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">반 소개</h1>
        <p className="text-blue-200 text-base max-w-xl mx-auto leading-relaxed">
          학생의 수준과 목표에 맞는 반을 선택하세요.<br />
          모든 반은 학교별 내신 분석을 기반으로 운영됩니다.
        </p>
      </section>

      {/* 과목 탭 앵커 */}
      {sortedSubjects.length > 0 && (
        <div className="sticky top-16 z-40 bg-white border-b shadow-sm">
          <div className="max-w-5xl mx-auto px-6 py-3 flex gap-3 overflow-x-auto">
            {sortedSubjects.map(subject => {
              const cfg = getConfig(subject);
              return (
                <a key={subject} href={`#${subject}`}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold border transition hover:shadow-sm ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                  <span>{cfg.icon}</span> {subject}
                </a>
              );
            })}
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto py-12 px-6 space-y-16">
        {sortedSubjects.length === 0 ? (
          <div className="text-center py-24 text-gray-400">
            <p className="text-4xl mb-4">📚</p>
            <p>반 정보를 준비 중입니다.</p>
            <Link href="/consultation" className="mt-6 inline-block text-blue-700 font-bold hover:underline">
              상담으로 문의하기 →
            </Link>
          </div>
        ) : (
          sortedSubjects.map(subject => {
            const cfg = getConfig(subject);
            const subjectClasses = grouped[subject];
            return (
              <section key={subject} id={subject}>
                {/* 과목 헤더 */}
                <div className={`rounded-2xl p-6 mb-6 border ${cfg.bg} ${cfg.border}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{cfg.icon}</span>
                    <h2 className={`text-2xl font-bold ${cfg.color}`}>{subject}</h2>
                    <span className="text-gray-400 text-sm ml-auto">{subjectClasses.length}개 반 운영 중</span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{cfg.desc}</p>
                </div>

                {/* 반 카드 목록 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {subjectClasses.map((cls: any) => (
                    <div key={cls.id} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-blue-200 transition group">
                      {/* 반 이름 + 학생 수 */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition">
                            {cls.name}
                          </h3>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                            {cls.subject}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-gray-700">{cls.class_enrollments?.length ?? 0}명</div>
                          <div className="text-xs text-gray-400">재원중</div>
                        </div>
                      </div>

                      {/* 수업 시간 */}
                      {cls.class_schedules?.length > 0 && (
                        <div className="flex items-start gap-2 mb-3">
                          <span className="text-gray-400 text-sm flex-shrink-0">🕐</span>
                          <span className="text-sm text-gray-600">{formatSchedule(cls.class_schedules)}</span>
                        </div>
                      )}

                      {/* 담당 선생님 */}
                      {cls.teachers && (
                        <div className="flex items-center gap-3 pt-3 border-t border-gray-50">
                          {cls.teachers.photo_url ? (
                            <img src={cls.teachers.photo_url} alt={cls.teachers.name}
                              className="w-9 h-9 rounded-full object-cover" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-400 text-sm font-bold flex-shrink-0">
                              {cls.teachers.name?.[0]}
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-bold text-gray-800">{cls.teachers.name} 선생님</div>
                            {cls.teachers.subject && (
                              <div className="text-xs text-gray-400">{cls.teachers.subject}</div>
                            )}
                          </div>
                        </div>
                      )}

                      {!cls.teachers && (
                        <div className="pt-3 border-t border-gray-50 text-xs text-gray-400">
                          담당 선생님 배정 예정
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>

      {/* 하단 CTA */}
      <section className="bg-blue-900 text-white py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-3">어떤 반이 맞는지 모르겠다면?</h2>
          <p className="text-blue-300 text-sm mb-8">
            상담을 통해 현재 수준을 진단하고 가장 적합한 반을 추천해드립니다.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/consultation"
              className="bg-yellow-400 text-blue-900 font-bold px-8 py-3 rounded-full hover:bg-yellow-300 transition">
              신규생 상담 신청
            </Link>
            <Link href="/teachers"
              className="bg-white/15 text-white font-bold px-8 py-3 rounded-full border border-white/30 hover:bg-white/25 transition">
              선생님 소개 보기
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-8 px-6 text-center text-sm">
        <p>© 2026 스카이수학과학입시학원 | 📞 010-5606-3041 · 당산동</p>
      </footer>
    </main>
  );
}
