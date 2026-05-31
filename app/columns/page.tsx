export const dynamic = 'force-dynamic';
import Link from 'next/link';
import Nav from '@/app/components/Nav';

const CAT_COLORS: Record<string, string> = {
  '고교학점제': 'bg-blue-100 text-blue-700',
  '수시': 'bg-green-100 text-green-700',
  '정시': 'bg-purple-100 text-purple-700',
  '과목선택': 'bg-yellow-100 text-yellow-700',
  '면접': 'bg-red-100 text-red-600',
  '입결분석': 'bg-gray-100 text-gray-700',
};

export default async function ColumnsPage() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/columns?is_published=eq.true&select=*&order=created_at.desc`,
    { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! }, cache: 'no-store' },
  );
  const columns = await res.json();
  const list = Array.isArray(columns) ? columns : [];

  return (
    <main className="min-h-screen bg-white">
      <Nav current="/columns" />
      <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-16 px-6 text-center">
        <p className="text-blue-300 text-xs font-bold mb-2 tracking-widest uppercase">Columns</p>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">SKY 입시 칼럼</h1>
        <p className="text-blue-200 text-sm max-w-md mx-auto">입시 전문가가 전하는 수시·정시·내신 전략</p>
      </section>
      <div className="max-w-4xl mx-auto py-14 px-6">
        {list.length === 0 ? (
          <p className="text-center text-gray-400 py-20">준비 중입니다.</p>
        ) : (
          <div className="space-y-4">
            {list.map((c: any) => (
              <div key={c.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
                <div className="flex items-center gap-2 mb-2">
                  {c.category && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CAT_COLORS[c.category] ?? 'bg-gray-100 text-gray-600'}`}>{c.category}</span>}
                  <span className="text-gray-300 text-xs">{new Date(c.created_at).toLocaleDateString('ko-KR')}</span>
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{c.title}</h3>
                {c.summary && <p className="text-gray-500 text-sm mb-3">{c.summary}</p>}
                {c.content && <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line border-t pt-3 mt-3">{c.content}</p>}
              </div>
            ))}
          </div>
        )}
        <div className="mt-14 bg-blue-900 rounded-2xl p-8 text-center text-white">
          <h3 className="text-xl font-bold mb-2">입시 전략 상담 받기</h3>
          <p className="text-blue-300 text-sm mb-6">칼럼 내용을 바탕으로 우리 아이 맞춤 전략을 상담해드립니다</p>
          <Link href="/consultation" className="bg-yellow-400 text-blue-900 font-bold px-8 py-3 rounded-full hover:bg-yellow-300 transition inline-block">상담 신청하기</Link>
        </div>
      </div>
      <footer className="bg-gray-900 text-gray-400 text-center py-8 text-sm"><p>© 2026 스카이수학과학입시학원 | 📞 010-5606-3041</p></footer>
    </main>
  );
}
