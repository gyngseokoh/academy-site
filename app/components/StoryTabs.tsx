'use client';

import Link from 'next/link';
import { useState } from 'react';

const CATEGORY_COLORS: Record<string, string> = {
  '성적향상': 'bg-green-100 text-green-700',
  '관리만족도': 'bg-blue-100 text-blue-700',
  '입시상담': 'bg-purple-100 text-purple-700',
  '학습습관변화': 'bg-yellow-100 text-yellow-700',
  '고교학점제': 'bg-blue-100 text-blue-700',
  '수시': 'bg-green-100 text-green-700',
  '정시': 'bg-purple-100 text-purple-700',
  '수학': 'bg-blue-100 text-blue-700',
  '과학': 'bg-green-100 text-green-700',
  '수학+과학': 'bg-emerald-100 text-emerald-700',
};

type Story = { id: string; student_label: string; subject?: string; school_before?: string; school_after?: string; result?: string; content?: string };
type Review = { id: string; author: string; content: string; category?: string };
type Column = { id: string; title: string; category?: string; summary?: string; created_at: string };

type Props = {
  stories: Story[];
  reviews: Review[];
  columns: Column[];
};

const TABS = [
  { key: 'stories', label: '🏆 합격 사례', href: '/stories' },
  { key: 'reviews', label: '💬 학부모 후기', href: '/reviews' },
  { key: 'columns', label: '📝 입시 칼럼', href: '/columns' },
] as const;

export default function StoryTabs({ stories, reviews, columns }: Props) {
  const [tab, setTab] = useState<'stories' | 'reviews' | 'columns'>('stories');

  const hasAny = stories.length > 0 || reviews.length > 0 || columns.length > 0;
  if (!hasAny) return null;

  // 초기 탭을 데이터 있는 첫 번째로
  const firstWithData = stories.length > 0 ? 'stories' : reviews.length > 0 ? 'reviews' : 'columns';
  const activeTab = tab;

  const currentHref = TABS.find(t => t.key === activeTab)?.href ?? '/stories';

  return (
    <section className="bg-gray-50 py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-blue-700 font-bold text-xs tracking-widest uppercase mb-2">Stories</p>
          <h2 className="text-3xl font-bold text-gray-900">SKY의 이야기</h2>
          <p className="text-gray-500 mt-2 text-sm">합격 사례, 학부모 후기, 입시 칼럼을 확인하세요</p>
        </div>

        {/* 탭 버튼 */}
        <div className="flex justify-center gap-2 mb-8">
          {TABS.map(t => {
            const count = t.key === 'stories' ? stories.length : t.key === 'reviews' ? reviews.length : columns.length;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`px-5 py-2 rounded-full text-sm font-bold transition border ${
                  activeTab === t.key
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                }`}>
                {t.label}
                {count > 0 && <span className={`ml-1.5 text-xs ${activeTab === t.key ? 'opacity-70' : 'text-gray-400'}`}>{count}</span>}
              </button>
            );
          })}
        </div>

        {/* 합격 사례 */}
        {activeTab === 'stories' && (
          stories.length === 0 ? (
            <p className="text-center text-gray-400 py-10">등록된 합격 사례가 없습니다.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {stories.map(s => (
                <div key={s.id} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">🏆</span>
                    {s.subject && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[s.subject] ?? 'bg-gray-100 text-gray-600'}`}>
                        {s.subject}
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-gray-900 mb-2">{s.student_label}</div>
                  {(s.school_before || s.school_after) && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                      {s.school_before && <span className="bg-gray-100 px-2 py-0.5 rounded">{s.school_before}</span>}
                      {s.school_before && s.school_after && <span>→</span>}
                      {s.school_after && <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">{s.school_after}</span>}
                    </div>
                  )}
                  {s.result && <p className="text-blue-700 text-sm font-medium">{s.result}</p>}
                </div>
              ))}
            </div>
          )
        )}

        {/* 학부모 후기 */}
        {activeTab === 'reviews' && (
          reviews.length === 0 ? (
            <p className="text-center text-gray-400 py-10">등록된 후기가 없습니다.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {reviews.map(r => (
                <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-md transition">
                  <div className="text-yellow-400 text-lg mb-3">★★★★★</div>
                  <p className="text-gray-700 text-sm leading-relaxed mb-4 line-clamp-4">"{r.content}"</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-800 text-sm">{r.author}</span>
                    {r.category && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[r.category] ?? 'bg-gray-100 text-gray-600'}`}>
                        {r.category}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* 입시 칼럼 */}
        {activeTab === 'columns' && (
          columns.length === 0 ? (
            <p className="text-center text-gray-400 py-10">등록된 칼럼이 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {columns.map(c => (
                <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 font-black text-sm">
                    📝
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {c.category && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[c.category] ?? 'bg-gray-100 text-gray-600'}`}>
                          {c.category}
                        </span>
                      )}
                      <span className="text-gray-300 text-xs">{new Date(c.created_at).toLocaleDateString('ko-KR')}</span>
                    </div>
                    <div className="font-bold text-gray-900">{c.title}</div>
                    {c.summary && <p className="text-gray-500 text-sm mt-0.5 line-clamp-1">{c.summary}</p>}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        <div className="text-center mt-8">
          <Link href={currentHref} className="text-blue-700 font-bold text-sm hover:underline">
            전체 보기 →
          </Link>
        </div>
      </div>
    </section>
  );
}
