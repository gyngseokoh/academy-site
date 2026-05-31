export const dynamic = 'force-dynamic';
import Link from 'next/link';

export default async function TeachersPage() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/teachers?select=*&order=sort_order.asc`,
    { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! }, cache: 'no-store' },
  );
  const all = await res.json();
  const teachers = Array.isArray(all) ? all.filter((t: any) => t.role === 'teacher' || t.role === 'vice_director') : [];

  return (
    <main className="min-h-screen bg-white">
      <nav className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="SKY" className="h-9 w-9 object-contain" />
          <span className="text-lg font-bold hidden sm:block">스카이수학과학입시학원</span>
        </Link>
        <div className="flex gap-4 text-sm font-medium">
          <Link href="/about" className="hover:text-blue-300 transition">학원 소개</Link>
          <Link href="/teachers" className="text-yellow-300 font-bold">선생님 소개</Link>
          <Link href="/curriculum" className="hover:text-blue-300 transition">반 소개</Link>
          <Link href="/schools" className="hover:text-blue-300 transition">학교 분석</Link>
          <Link href="/consultation" className="hover:text-blue-300 transition bg-yellow-400 text-blue-900 px-4 py-1 rounded-full font-bold">상담 신청</Link>
        </div>
      </nav>

      <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-16 px-6 text-center">
        <p className="text-blue-300 text-xs font-bold mb-2 tracking-widest uppercase">Our Teachers</p>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">선생님 소개</h1>
        <p className="text-blue-200 text-sm max-w-md mx-auto">학생 한 명 한 명을 책임지는 SKY의 전문 교사진</p>
      </section>

      <section className="max-w-4xl mx-auto py-16 px-6">
        {teachers.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {teachers.map((t: any) => (
              <div key={t.id} className="group text-center">
                <div className="relative mb-4">
                  {t.photo_url ? (
                    <img src={t.photo_url} alt={t.name}
                      className="w-full aspect-square object-cover rounded-2xl shadow-sm group-hover:shadow-md transition" />
                  ) : (
                    <div className="w-full aspect-square bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl flex items-center justify-center">
                      <span className="text-5xl text-blue-300">👤</span>
                    </div>
                  )}
                  {t.role === 'vice_director' && (
                    <span className="absolute -top-2 -right-2 bg-blue-900 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow">
                      부원장
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-0.5">{t.name} 선생님</h3>
                {t.subject && <p className="text-blue-700 text-sm font-medium">{t.subject}</p>}
                {t.bio && <p className="text-gray-400 text-xs mt-1.5 leading-relaxed line-clamp-3">{t.bio}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 py-20">선생님 정보를 준비 중입니다.</p>
        )}
      </section>

      <section className="bg-gray-50 py-14 px-6 text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">선생님과 직접 상담하고 싶으신가요?</h2>
        <p className="text-gray-500 text-sm mb-6">학생에게 맞는 선생님과 1:1 상담을 예약하세요</p>
        <Link href="/consultation"
          className="bg-blue-900 text-white font-bold px-8 py-3 rounded-full hover:bg-blue-800 transition inline-block">
          상담 신청하기
        </Link>
      </section>

      <footer className="bg-gray-900 text-gray-400 text-center py-8 text-sm">
        <p>© 2026 스카이수학과학입시학원 | 📞 010-5606-3041</p>
      </footer>
    </main>
  );
}
