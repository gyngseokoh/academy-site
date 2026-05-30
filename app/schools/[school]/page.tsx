import Link from 'next/link';
import { notFound } from 'next/navigation';

const SCHOOL_DATA: Record<string, {
  name: string; fullName: string; type: '고등' | '중등';
  color: string; tags: string[];
  sections: { title: string; content: string }[];
}> = {
  seonyugo: {
    name: '선유고', fullName: '선유고등학교', type: '고등',
    color: 'blue',
    tags: ['수학', '과학', '내신관리', '입시'],
    sections: [
      { title: '학교 특징', content: '내용을 입력해주세요.' },
      { title: '내신 난도', content: '내용을 입력해주세요.' },
      { title: '수학 출제 경향', content: '내용을 입력해주세요.' },
      { title: '과학 출제 경향', content: '내용을 입력해주세요.' },
      { title: '입결 분석', content: '내용을 입력해주세요.' },
      { title: 'SKY 학습 전략', content: '내용을 입력해주세요.' },
    ],
  },
  janghungo: {
    name: '장훈고', fullName: '장훈고등학교', type: '고등',
    color: 'indigo',
    tags: ['수학', '과학', '내신관리', '입시'],
    sections: [
      { title: '학교 특징', content: '내용을 입력해주세요.' },
      { title: '내신 난도', content: '내용을 입력해주세요.' },
      { title: '수학 출제 경향', content: '내용을 입력해주세요.' },
      { title: '과학 출제 경향', content: '내용을 입력해주세요.' },
      { title: '입결 분석', content: '내용을 입력해주세요.' },
      { title: 'SKY 학습 전략', content: '내용을 입력해주세요.' },
    ],
  },
  yeouido: {
    name: '여의도고', fullName: '여의도고등학교', type: '고등',
    color: 'blue',
    tags: ['수학', '과학', '내신관리', '입시'],
    sections: [
      { title: '학교 특징', content: '내용을 입력해주세요.' },
      { title: '내신 난도', content: '내용을 입력해주세요.' },
      { title: '수학 출제 경향', content: '내용을 입력해주세요.' },
      { title: '과학 출제 경향', content: '내용을 입력해주세요.' },
      { title: '입결 분석', content: '내용을 입력해주세요.' },
      { title: 'SKY 학습 전략', content: '내용을 입력해주세요.' },
    ],
  },
  yeouidogirls: {
    name: '여의도여고', fullName: '여의도여자고등학교', type: '고등',
    color: 'purple',
    tags: ['수학', '과학', '내신관리', '입시'],
    sections: [
      { title: '학교 특징', content: '내용을 입력해주세요.' },
      { title: '내신 난도', content: '내용을 입력해주세요.' },
      { title: '수학 출제 경향', content: '내용을 입력해주세요.' },
      { title: '과학 출제 경향', content: '내용을 입력해주세요.' },
      { title: '입결 분석', content: '내용을 입력해주세요.' },
      { title: 'SKY 학습 전략', content: '내용을 입력해주세요.' },
    ],
  },
  gwanakgo: {
    name: '관악고', fullName: '관악고등학교', type: '고등',
    color: 'green',
    tags: ['수학', '과학', '내신관리', '입시'],
    sections: [
      { title: '학교 특징', content: '내용을 입력해주세요.' },
      { title: '내신 난도', content: '내용을 입력해주세요.' },
      { title: '수학 출제 경향', content: '내용을 입력해주세요.' },
      { title: '과학 출제 경향', content: '내용을 입력해주세요.' },
      { title: '입결 분석', content: '내용을 입력해주세요.' },
      { title: 'SKY 학습 전략', content: '내용을 입력해주세요.' },
    ],
  },
  dangsanseo: {
    name: '당산서중', fullName: '당산서중학교', type: '중등',
    color: 'gray',
    tags: ['수학', '과학', '내신관리', '고등준비'],
    sections: [
      { title: '학교 특징', content: '내용을 입력해주세요.' },
      { title: '내신 난도', content: '내용을 입력해주세요.' },
      { title: '수학 출제 경향', content: '내용을 입력해주세요.' },
      { title: '과학 출제 경향', content: '내용을 입력해주세요.' },
      { title: '고등 연계 전략', content: '내용을 입력해주세요.' },
      { title: 'SKY 학습 전략', content: '내용을 입력해주세요.' },
    ],
  },
  dangsan: {
    name: '당산중', fullName: '당산중학교', type: '중등',
    color: 'gray',
    tags: ['수학', '과학', '내신관리', '고등준비'],
    sections: [
      { title: '학교 특징', content: '내용을 입력해주세요.' },
      { title: '내신 난도', content: '내용을 입력해주세요.' },
      { title: '수학 출제 경향', content: '내용을 입력해주세요.' },
      { title: '과학 출제 경향', content: '내용을 입력해주세요.' },
      { title: '고등 연계 전략', content: '내용을 입력해주세요.' },
      { title: 'SKY 학습 전략', content: '내용을 입력해주세요.' },
    ],
  },
  seonyu: {
    name: '선유중', fullName: '선유중학교', type: '중등',
    color: 'gray',
    tags: ['수학', '과학', '내신관리', '고등준비'],
    sections: [
      { title: '학교 특징', content: '내용을 입력해주세요.' },
      { title: '내신 난도', content: '내용을 입력해주세요.' },
      { title: '수학 출제 경향', content: '내용을 입력해주세요.' },
      { title: '과학 출제 경향', content: '내용을 입력해주세요.' },
      { title: '고등 연계 전략', content: '내용을 입력해주세요.' },
      { title: 'SKY 학습 전략', content: '내용을 입력해주세요.' },
    ],
  },
};

export default function SchoolPage({ params }: { params: { school: string } }) {
  const data = SCHOOL_DATA[params.school];
  if (!data) notFound();

  const isHigh = data.type === '고등';

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
      <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 text-blue-300 text-sm mb-4">
            <Link href="/schools" className="hover:text-white transition">학교 분석</Link>
            <span>/</span>
            <span>{data.name}</span>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${isHigh ? 'bg-yellow-400 text-blue-900' : 'bg-white/20 text-white'}`}>
              {data.type}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{data.name} 분석</h1>
          <p className="text-blue-200 text-sm">{data.fullName} · SKY수학과학입시학원 학교별 맞춤 분석</p>
          <div className="flex flex-wrap gap-2 mt-4">
            {data.tags.map(tag => (
              <span key={tag} className="bg-white/15 text-white text-xs px-3 py-1 rounded-full">{tag}</span>
            ))}
          </div>
        </div>
      </section>

      {/* 콘텐츠 */}
      <div className="max-w-4xl mx-auto py-14 px-6">
        {/* 준비 중 안내 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4 mb-10 flex items-center gap-3">
          <span className="text-yellow-500 text-xl">✏️</span>
          <p className="text-yellow-700 text-sm">
            <span className="font-bold">{data.name} 상세 분석 자료</span>를 준비 중입니다.
            아래 항목들에 학교별 데이터를 순차적으로 업데이트할 예정입니다.
          </p>
        </div>

        {/* 섹션들 */}
        <div className="space-y-6">
          {data.sections.map((section, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-700 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {i + 1}
                </span>
                {section.title}
              </h2>
              <p className="text-gray-400 text-sm italic">{section.content}</p>
            </div>
          ))}
        </div>

        {/* 다른 학교 */}
        <div className="mt-12">
          <h3 className="font-bold text-gray-700 mb-4 text-sm">다른 학교 분석 보기</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(SCHOOL_DATA)
              .filter(([slug]) => slug !== params.school)
              .map(([slug, s]) => (
                <Link key={slug} href={`/schools/${slug}`}
                  className="bg-gray-50 text-gray-700 border border-gray-200 text-sm px-4 py-2 rounded-full hover:bg-blue-700 hover:text-white hover:border-blue-700 transition">
                  {s.name}
                </Link>
              ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-blue-900 rounded-2xl p-8 text-center text-white">
          <h3 className="text-xl font-bold mb-2">{data.name} 맞춤 전략 상담 받기</h3>
          <p className="text-blue-300 text-sm mb-6">학교 분석 데이터를 바탕으로 1:1 입시 상담을 제공합니다.</p>
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
