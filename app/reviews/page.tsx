export const dynamic = 'force-dynamic';
import Link from 'next/link';

const CATEGORY_COLORS: Record<string, string> = {
  '성적향상': 'bg-green-100 text-green-700',
  '관리만족도': 'bg-blue-100 text-blue-700',
  '입시상담': 'bg-purple-100 text-purple-700',
  '학습습관변화': 'bg-yellow-100 text-yellow-700',
};

export default async function ReviewsPage() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/reviews?is_published=eq.true&select=*&order=sort_order.asc`,
    { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! }, cache: 'no-store' },
  );
  const reviews = await res.json();
  const list = Array.isArray(reviews) ? reviews : [];

  return (
    <main className="min-h-screen bg-white">
      <nav className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="SKY" className="h-9 w-9 object-contain" />
          <span className="text-lg font-bold hidden sm:block">스카이수학과학입시학원</span>
        </Link>
        <div className="flex gap-5 text-sm font-medium">
          <Link href="/schools" className="hover:text-blue-300">학교 분석</Link>
          <Link href="/teachers" className="hover:text-blue-300">선생님 소개</Link>
          <Link href="/consultation" className="hover:text-blue-300">신규생 상담</Link>
        </div>
      </nav>

      <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-16 px-6 text-center">
        <p className="text-blue-300 text-sm font-bold mb-2 tracking-widest">REVIEWS</p>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">학부모 후기</h1>
        <p className="text-blue-200 text-sm max-w-md mx-auto">SKY 학부모님들의 생생한 후기를 확인하세요</p>
      </section>

      <div className="max-w-4xl mx-auto py-14 px-6">
        {list.length === 0 ? (
          <p className="text-center text-gray-400 py-20">준비 중입니다.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {list.map((r: any) => (
              <div key={r.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-yellow-400">{'★'.repeat(r.rating ?? 5)}</span>
                  {r.category && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[r.category] ?? 'bg-gray-100 text-gray-600'}`}>
                      {r.category}
                    </span>
                  )}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">"{r.content}"</p>
                <p className="text-gray-400 text-xs font-medium">— {r.author}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-14 bg-blue-900 rounded-2xl p-8 text-center text-white">
          <h3 className="text-xl font-bold mb-2">직접 경험해보세요</h3>
          <p className="text-blue-300 text-sm mb-6">지금 상담을 신청하고 SKY의 차별화된 교육을 경험해보세요</p>
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
