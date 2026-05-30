import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* 네비게이션 */}
      <nav className="bg-blue-700 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">⭐ 스카이수학과학입시학원</h1>
        <div className="flex gap-6 text-sm">
          <Link href="/" className="hover:underline">홈</Link>
          <Link href="/teachers" className="hover:underline">선생님 소개</Link>
          <Link href="/consultation" className="hover:underline">신규생 상담</Link>
          <Link href="/consultation/current" className="hover:underline">재원생 상담</Link>
        </div>
      </nav>

      {/* 히어로 섹션 */}
      <section className="bg-blue-700 text-white text-center py-24 px-6">
        <h2 className="text-4xl font-bold mb-4">
          최고의 교육, 스카이수학과학입시학원
        </h2>
        <p className="text-xl mb-10 text-blue-100">
          학생 한 명 한 명을 소중히 생각하는 학원입니다
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/consultation"
            className="bg-white text-blue-700 font-bold px-8 py-3 rounded-full hover:bg-blue-50 transition"
          >
            신규생 상담 신청
          </Link>
          <Link
            href="/consultation/current"
            className="bg-blue-600 text-white font-bold px-8 py-3 rounded-full border-2 border-white hover:bg-blue-500 transition"
          >
            재원생 상담 신청
          </Link>
        </div>
      </section>

      {/* 상담 안내 섹션 */}
      <section className="py-16 px-6 max-w-4xl mx-auto">
        <h3 className="text-2xl font-bold text-center mb-10 text-gray-800">
          상담 안내
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/consultation"
            className="border-2 border-blue-100 rounded-2xl p-8 hover:border-blue-400 hover:shadow-md transition"
          >
            <div className="text-4xl mb-4">🎓</div>
            <h4 className="font-bold text-xl text-gray-800 mb-2">신규생 상담</h4>
            <p className="text-gray-500 text-sm">
              원장 선생님과 1:1 입학 상담을 예약하세요.<br />
              학생 수준 파악 및 수업 방향을 안내해드립니다.
            </p>
            <span className="mt-4 inline-block text-blue-600 text-sm font-bold">상담 신청하기 →</span>
          </Link>
          <Link
            href="/consultation/current"
            className="border-2 border-blue-100 rounded-2xl p-8 hover:border-blue-400 hover:shadow-md transition"
          >
            <div className="text-4xl mb-4">💬</div>
            <h4 className="font-bold text-xl text-gray-800 mb-2">재원생 상담</h4>
            <p className="text-gray-500 text-sm">
              담당 선생님과 개별 상담을 예약하세요.<br />
              학습 진도, 성적 관리 등을 상담할 수 있습니다.
            </p>
            <span className="mt-4 inline-block text-blue-600 text-sm font-bold">상담 신청하기 →</span>
          </Link>
        </div>
      </section>

      {/* 특징 섹션 */}
      <section className="py-16 px-6 max-w-4xl mx-auto bg-gray-50 rounded-3xl mb-10">
        <h3 className="text-2xl font-bold text-center mb-10 text-gray-800">
          스카이수학과학입시학원의 특징
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 rounded-xl bg-white">
            <div className="text-4xl mb-4">👨‍🏫</div>
            <h4 className="font-bold text-lg mb-2">전문 선생님</h4>
            <p className="text-gray-600 text-sm">풍부한 경험을 가진 전문 강사진</p>
          </div>
          <div className="text-center p-6 rounded-xl bg-white">
            <div className="text-4xl mb-4">📚</div>
            <h4 className="font-bold text-lg mb-2">맞춤형 교육</h4>
            <p className="text-gray-600 text-sm">학생 수준에 맞는 개인별 맞춤 지도</p>
          </div>
          <div className="text-center p-6 rounded-xl bg-white">
            <div className="text-4xl mb-4">📈</div>
            <h4 className="font-bold text-lg mb-2">성적 향상</h4>
            <p className="text-gray-600 text-sm">체계적인 관리로 확실한 성과</p>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="bg-gray-800 text-gray-400 text-center py-8">
        <p>© 2026 스카이수학과학입시학원 | 문의: 010-5606-3041</p>
      </footer>
    </main>
  );
}
