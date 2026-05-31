import Link from 'next/link';

const SUBJECT_COLOR: Record<string, string> = {
  '수학': 'bg-blue-100 text-blue-700',
  '과학': 'bg-green-100 text-green-700',
  '수학+과학': 'bg-emerald-100 text-emerald-700',
  '물리': 'bg-purple-100 text-purple-700',
  '화학': 'bg-yellow-100 text-yellow-700',
};
const CAT_COLOR: Record<string, string> = {
  '고교학점제': 'text-blue-600',
  '수시': 'text-green-600',
  '정시': 'text-purple-600',
  '과목선택': 'text-yellow-600',
  '입결분석': 'text-gray-600',
};

type Story = { id: string; student_label: string; subject?: string; school_before?: string; school_after?: string; result?: string };
type Review = { id: string; author: string; content: string; category?: string };
type Column = { id: string; title: string; category?: string; summary?: string; created_at: string };

type Props = {
  stories: Story[];
  reviews: Review[];
  columns: Column[];
};

export default function StoryTabs({ stories, reviews, columns }: Props) {
  const hasAny = stories.length > 0 || reviews.length > 0 || columns.length > 0;
  if (!hasAny) return null;

  return (
    <div>
      {/* ① 합격 사례 */}
      {stories.length > 0 && (
        <section className="py-16 px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-blue-700 font-bold text-xs tracking-widest uppercase mb-1">Success Stories</p>
                <h2 className="text-2xl font-bold text-gray-900">합격 사례</h2>
              </div>
              <Link href="/stories" className="text-sm text-blue-700 font-bold hover:underline">전체 보기 →</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stories.map(s => (
                <div key={s.id} className="rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-blue-200 transition bg-white group">
                  {/* 과목 배지 */}
                  {s.subject && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold mb-3 inline-block ${SUBJECT_COLOR[s.subject] ?? 'bg-gray-100 text-gray-600'}`}>
                      {s.subject}
                    </span>
                  )}
                  <div className="font-bold text-gray-900 text-lg mb-3">{s.student_label}</div>
                  {/* Before → After */}
                  {(s.school_before || s.school_after) && (
                    <div className="flex items-center gap-2 mb-3">
                      {s.school_before && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">{s.school_before}</span>
                      )}
                      <span className="text-blue-400 font-bold">→</span>
                      {s.school_after && (
                        <span className="text-xs bg-blue-700 text-white px-2 py-1 rounded-lg font-bold">{s.school_after}</span>
                      )}
                    </div>
                  )}
                  {s.result && (
                    <p className="text-sm text-blue-700 font-medium border-t border-gray-50 pt-3 mt-1">
                      🏆 {s.result}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ② 학부모 후기 */}
      {reviews.length > 0 && (
        <section className="py-16 px-6 bg-amber-50">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-amber-600 font-bold text-xs tracking-widest uppercase mb-1">Parent Reviews</p>
                <h2 className="text-2xl font-bold text-gray-900">학부모 후기</h2>
              </div>
              <Link href="/reviews" className="text-sm text-amber-700 font-bold hover:underline">전체 보기 →</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {reviews.map((r, i) => (
                <div key={r.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition relative">
                  {/* 큰 따옴표 */}
                  <div className="text-5xl text-amber-200 font-black leading-none absolute top-4 right-5 select-none">"</div>
                  <div className="text-yellow-400 text-sm mb-3">★★★★★</div>
                  <p className="text-gray-700 text-sm leading-relaxed mb-5 line-clamp-4 relative z-10">
                    {r.content}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-xs font-bold flex-shrink-0">
                      {r.author[0]}
                    </div>
                    <span className="font-bold text-gray-800 text-sm">{r.author}</span>
                    {r.category && (
                      <span className="ml-auto text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{r.category}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ③ 입시 칼럼 */}
      {columns.length > 0 && (
        <section className="py-16 px-6 bg-gray-900 text-white">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-blue-400 font-bold text-xs tracking-widest uppercase mb-1">Columns</p>
                <h2 className="text-2xl font-bold">입시 칼럼</h2>
              </div>
              <Link href="/columns" className="text-sm text-blue-400 font-bold hover:underline">전체 보기 →</Link>
            </div>
            <div className="divide-y divide-white/10">
              {columns.map((c, i) => (
                <div key={c.id} className="flex items-start gap-4 py-4 hover:bg-white/5 -mx-4 px-4 rounded-xl transition group">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-800 flex items-center justify-center text-blue-300 font-black text-xs">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {c.category && (
                        <span className={`text-xs font-bold ${CAT_COLOR[c.category] ?? 'text-gray-400'}`}>
                          {c.category}
                        </span>
                      )}
                      <span className="text-gray-600 text-xs">
                        {new Date(c.created_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="font-bold group-hover:text-blue-300 transition">{c.title}</div>
                    {c.summary && <p className="text-gray-400 text-sm mt-0.5 line-clamp-1">{c.summary}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
