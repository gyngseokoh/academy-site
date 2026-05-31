export const dynamic = 'force-dynamic';
import Link from 'next/link';

const NAV = (
  <nav className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
    <Link href="/" className="flex items-center gap-2">
      <img src="/logo.png" alt="SKY" className="h-9 w-9 object-contain" />
      <span className="text-lg font-bold hidden sm:block">스카이수학과학입시학원</span>
    </Link>
    <div className="flex gap-5 text-sm font-medium">
      <Link href="/schools" className="hover:text-blue-300 transition">학교 분석</Link>
      <Link href="/teachers" className="hover:text-blue-300 transition">선생님 소개</Link>
      <Link href="/consultation" className="hover:text-blue-300 transition">신규생 상담</Link>
    </div>
  </nav>
);

export default async function StoriesPage() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/success_stories?is_published=eq.true&select=*&order=created_at.desc`,
    { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! }, cache: 'no-store' },
  );
  const stories = await res.json();
  const list = Array.isArray(stories) ? stories : [];

  return (
    <main className="min-h-screen bg-white">
      {NAV}
      <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-16 px-6 text-center">
        <p className="text-blue-300 text-sm font-bold mb-2 tracking-widest">SUCCESS STORIES</p>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">합격 사례</h1>
        <p className="text-blue-200 text-sm max-w-md mx-auto">SKY 학생들의 성장 스토리를 소개합니다</p>
      </section>

      <div className="max-w-4xl mx-auto py-14 px-6">
        {list.length === 0 ? (
          <p className="text-center text-gray-400 py-20">준비 중입니다.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {list.map((s: any) => (
              <div key={s.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🏆</span>
                  {s.subject && <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full font-medium">{s.subject}</span>}
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-1">{s.student_label}</h3>
                {s.result && <p className="text-blue-700 font-medium text-sm mb-3">{s.result}</p>}
                {(s.school_before || s.school_after) && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    {s.school_before && <span className="bg-gray-50 px-2 py-1 rounded">{s.school_before}</span>}
                    {s.school_before && s.school_after && <span>→</span>}
                    {s.school_after && <span className="bg-green-50 text-green-700 px-2 py-1 rounded font-medium">{s.school_after}</span>}
                  </div>
                )}
                {s.content && <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">{s.content}</p>}
              </div>
            ))}
          </div>
        )}

        <div className="mt-14 bg-blue-900 rounded-2xl p-8 text-center text-white">
          <h3 className="text-xl font-bold mb-2">우리 아이도 SKY와 함께라면</h3>
          <p className="text-blue-300 text-sm mb-6">지금 상담을 신청하고 맞춤 전략을 받아보세요</p>
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
