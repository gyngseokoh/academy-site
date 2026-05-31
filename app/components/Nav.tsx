import Link from 'next/link';

export default function Nav({ current }: { current?: string }) {
  const links = [
    { href: '/about', label: '학원 소개' },
    { href: '/teachers', label: '선생님 소개' },
    { href: '/curriculum', label: '반 소개' },
    { href: '/schools', label: '학교 분석' },
  ];
  return (
    <nav className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
      <Link href="/" className="flex items-center gap-2">
        <img src="/logo.png" alt="SKY" className="h-9 w-9 object-contain" />
        <span className="text-lg font-bold tracking-tight hidden sm:block">스카이수학과학입시학원</span>
      </Link>
      <div className="flex gap-4 text-sm font-medium items-center">
        {links.map(l => (
          <Link key={l.href} href={l.href}
            className={`hover:text-blue-300 transition hidden md:block ${current === l.href ? 'text-yellow-300' : ''}`}>
            {l.label}
          </Link>
        ))}
        <Link href="/consultation"
          className="bg-yellow-400 text-blue-900 font-bold px-4 py-1.5 rounded-full hover:bg-yellow-300 transition text-sm">
          상담 신청
        </Link>
      </div>
    </nav>
  );
}
