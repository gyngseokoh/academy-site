'use client';

import Link from 'next/link';
import { useState } from 'react';

const STORY_LINKS = [
  { href: '/stories', label: '🏆 합격 사례' },
  { href: '/reviews', label: '💬 학부모 후기' },
  { href: '/columns', label: '📝 입시 칼럼' },
];

export default function Nav({ current }: { current?: string }) {
  const [storyOpen, setStoryOpen] = useState(false);

  const isStory = ['/stories', '/reviews', '/columns'].includes(current ?? '');

  return (
    <nav className="bg-blue-900 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
      <Link href="/" className="flex items-center gap-2 flex-shrink-0">
        <img src="/logo.png" alt="SKY" className="h-9 w-9 object-contain" />
        <span className="text-lg font-bold tracking-tight hidden sm:block">스카이수학과학입시학원</span>
      </Link>

      <div className="flex gap-4 text-sm font-medium items-center">
        {[
          { href: '/about', label: '학원 소개' },
          { href: '/teachers', label: '선생님' },
          { href: '/curriculum', label: '반 소개' },
          { href: '/schools', label: '학교 분석' },
        ].map(l => (
          <Link key={l.href} href={l.href}
            className={`hidden md:block hover:text-blue-300 transition ${current === l.href ? 'text-yellow-300' : ''}`}>
            {l.label}
          </Link>
        ))}

        {/* 소식·스토리 드롭다운 */}
        <div className="relative hidden md:block"
          onMouseEnter={() => setStoryOpen(true)}
          onMouseLeave={() => setStoryOpen(false)}>
          <button
            className={`flex items-center gap-1 hover:text-blue-300 transition ${isStory ? 'text-yellow-300' : ''}`}>
            소식·스토리
            <svg className={`w-3 h-3 transition-transform ${storyOpen ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {storyOpen && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 py-2 min-w-[140px] z-50">
              {STORY_LINKS.map(l => (
                <Link key={l.href} href={l.href}
                  className="flex items-center gap-2 px-4 py-2.5 text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition text-sm font-medium">
                  {l.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        <Link href="/consultation"
          className="bg-yellow-400 text-blue-900 font-bold px-4 py-1.5 rounded-full hover:bg-yellow-300 transition text-sm flex-shrink-0">
          상담 신청
        </Link>
      </div>
    </nav>
  );
}
