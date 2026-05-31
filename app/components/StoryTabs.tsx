import Link from 'next/link';

const SUBJECT_COLOR: Record<string, string> = {
  '수학': 'bg-blue-100 text-blue-700 border-blue-200',
  '과학': 'bg-green-100 text-green-700 border-green-200',
  '수학+과학': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  '물리': 'bg-purple-100 text-purple-700 border-purple-200',
  '화학': 'bg-yellow-100 text-yellow-700 border-yellow-200',
};

type Story = { id: string; student_label: string; subject?: string; school_before?: string; school_after?: string; result?: string };
type Review = { id: string; author: string; content: string; category?: string };
type Column = { id: string; title: string; category?: string; summary?: string; created_at: string };

export default function StorySection({
  stories, reviews, columns,
}: {
  stories: Story[]; reviews: Review[]; columns: Column[];
}) {
  const hasAny = stories.length > 0 || reviews.length > 0 || columns.length > 0;
  if (!hasAny) return null;

  return (
    <>
      {/* ━━━ 합격 사례 ━━━ */}
      {stories.length > 0 && (
        <section className="py-20 px-6 bg-white">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <div>
                <span className="text-xs font-bold text-blue-600 tracking-widest uppercase">Success Stories</span>
                <h2 className="text-2xl font-bold text-gray-900 mt-1">합격 사례</h2>
              </div>
              <Link href="/stories" className="text-sm text-gray-400 hover:text-blue-600 transition font-medium">
                전체 보기 →
              </Link>
            </div>

            {/* 첫 번째 카드가 Featured, 나머지는 작게 */}
            <div className="grid md:grid-cols-3 gap-5">
              {stories.map((s, i) => (
                i === 0 ? (
                  /* Featured card */
                  <div key={s.id} className="md:col-span-1 bg-blue-900 text-white rounded-3xl p-8 flex flex-col justify-between min-h-[220px]">
                    <div>
                      {s.subject && (
                        <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-medium mb-4 inline-block">
                          {s.subject}
                        </span>
                      )}
                      <div className="text-xl font-bold mb-4 leading-tight">{s.student_label}</div>
                      {(s.school_before || s.school_after) && (
                        <div className="flex items-center gap-2 text-sm mb-2">
                          {s.school_before && <span className="text-blue-300">{s.school_before}</span>}
                          {s.school_before && s.school_after && <span className="text-blue-400">→</span>}
                          {s.school_after && <span className="text-yellow-300 font-bold">{s.school_after}</span>}
                        </div>
                      )}
                    </div>
                    {s.result && (
                      <div className="bg-white/10 rounded-xl px-4 py-3 text-sm text-blue-100 mt-4">
                        🏆 {s.result}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Small cards */
                  <div key={s.id} className="bg-gray-50 rounded-3xl p-6 hover:bg-blue-50 hover:shadow-md transition border border-gray-100">
                    {s.subject && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium mb-3 inline-block border ${SUBJECT_COLOR[s.subject] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {s.subject}
                      </span>
                    )}
                    <div className="font-bold text-gray-900 mb-3">{s.student_label}</div>
                    {(s.school_before || s.school_after) && (
                      <div className="flex items-center gap-1.5 text-xs mb-3">
                        {s.school_before && <span className="bg-gray-200 text-gray-500 px-2 py-0.5 rounded">{s.school_before}</span>}
                        {s.school_before && s.school_after && <span className="text-blue-400 font-bold">→</span>}
                        {s.school_after && <span className="bg-blue-700 text-white px-2 py-0.5 rounded font-bold">{s.school_after}</span>}
                      </div>
                    )}
                    {s.result && <p className="text-blue-600 text-sm font-medium">{s.result}</p>}
                  </div>
                )
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ━━━ 학부모 후기 ━━━ */}
      {reviews.length > 0 && (
        <section className="py-20 px-6" style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' }}>
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <div>
                <span className="text-xs font-bold text-amber-600 tracking-widest uppercase">Parent Reviews</span>
                <h2 className="text-2xl font-bold text-gray-900 mt-1">학부모 후기</h2>
              </div>
              <Link href="/reviews" className="text-sm text-gray-400 hover:text-amber-600 transition font-medium">
                전체 보기 →
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {reviews.map((r) => (
                <div key={r.id} className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition relative overflow-hidden">
                  {/* 배경 따옴표 */}
                  <div className="absolute -top-2 -right-1 text-8xl text-amber-100 font-black leading-none select-none pointer-events-none">"</div>
                  <div className="relative">
                    <div className="flex mb-3">
                      {[1,2,3,4,5].map(n => (
                        <svg key={n} className="w-4 h-4 text-amber-400 fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                      ))}
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed mb-5 line-clamp-4">{r.content}</p>
                    <div className="flex items-center gap-2.5 pt-3 border-t border-gray-100">
                      <div className="w-8 h-8 rounded-full bg-amber-400 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {r.author[0]}
                      </div>
                      <div>
                        <div className="font-bold text-gray-800 text-sm">{r.author}</div>
                        {r.category && <div className="text-xs text-amber-600">{r.category}</div>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ━━━ 입시 칼럼 ━━━ */}
      {columns.length > 0 && (
        <section className="py-16 px-6 bg-gray-950" style={{ background: '#0f172a' }}>
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-xs font-bold text-blue-400 tracking-widest uppercase">Columns</span>
                <h2 className="text-2xl font-bold text-white mt-1">입시 칼럼</h2>
              </div>
              <Link href="/columns" className="text-sm text-gray-500 hover:text-blue-400 transition font-medium">
                전체 보기 →
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {columns.map((c, i) => (
                <div key={c.id} className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/40 rounded-2xl p-5 transition">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-black text-blue-400/60">{String(i + 1).padStart(2, '0')}</span>
                    {c.category && (
                      <span className="text-xs text-blue-400 font-medium bg-blue-900/50 px-2 py-0.5 rounded-full">
                        {c.category}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-white text-base mb-2 group-hover:text-blue-300 transition leading-snug">
                    {c.title}
                  </h3>
                  {c.summary && (
                    <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{c.summary}</p>
                  )}
                  <div className="text-gray-600 text-xs mt-3">
                    {new Date(c.created_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
