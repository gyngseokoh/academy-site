'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Nav from '@/app/components/Nav';

type Seminar = {
  id: string;
  title: string;
  description: string | null;
  scheduled_at: string | null;
  location: string | null;
  max_participants: number | null;
  seminar_applications: { id: string }[];
};

export default function SeminarPage() {
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyModal, setApplyModal] = useState<Seminar | null>(null);
  const [form, setForm] = useState({ applicant_name: '', phone: '', school: '', grade: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/seminars?is_published=eq.true&select=*,seminar_applications(id)&order=scheduled_at.asc`,
      { headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! } },
    )
      .then(r => r.json())
      .then(data => { setSeminars(Array.isArray(data) ? data : []); setLoading(false); });
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyModal) return;
    setSubmitting(true);
    const res = await fetch('/api/seminar-apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seminar_id: applyModal.id, ...form }),
    });
    setSubmitting(false);
    if (res.ok) {
      setDone(true);
    } else {
      alert('신청 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const formatDate = (dt: string) => {
    const d = new Date(dt);
    return d.toLocaleString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const isFull = (s: Seminar) => s.max_participants != null && s.seminar_applications.length >= s.max_participants;

  return (
    <main className="min-h-screen bg-white">
      <Nav current="/seminar" />

      <section className="bg-gradient-to-br from-blue-900 to-blue-700 text-white py-16 px-6 text-center">
        <p className="text-blue-300 text-sm font-bold mb-2 tracking-widest">SEMINAR</p>
        <h1 className="text-3xl md:text-4xl font-bold mb-3">SKY 입시설명회</h1>
        <p className="text-blue-200 text-sm max-w-md mx-auto">
          입시 전문가와 함께하는 당산권 입시 전략 설명회
        </p>
      </section>

      <div className="max-w-3xl mx-auto py-14 px-6">
        {loading ? (
          <p className="text-center text-gray-400 py-20">불러오는 중...</p>
        ) : seminars.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg mb-2">예정된 설명회가 없습니다</p>
            <p className="text-gray-300 text-sm">다음 설명회 일정을 기다려주세요</p>
          </div>
        ) : (
          <div className="space-y-5">
            {seminars.map(s => {
              const full = isFull(s);
              const count = s.seminar_applications.length;
              return (
                <div key={s.id} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-gray-900 text-lg">{s.title}</h3>
                        {full && <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">마감</span>}
                      </div>
                      {s.scheduled_at && (
                        <p className="text-blue-700 font-medium text-sm mb-1">
                          📅 {formatDate(s.scheduled_at)}
                        </p>
                      )}
                      {s.location && <p className="text-gray-500 text-sm mb-2">📍 {s.location}</p>}
                      {s.description && <p className="text-gray-600 text-sm leading-relaxed mb-3">{s.description}</p>}
                      {s.max_participants && (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div className="bg-blue-600 h-1.5 rounded-full transition-all"
                              style={{ width: `${Math.min(100, (count / s.max_participants) * 100)}%` }} />
                          </div>
                          <span className="text-xs text-gray-400">{count}/{s.max_participants}명</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => { setApplyModal(s); setForm({ applicant_name: '', phone: '', school: '', grade: '' }); setDone(false); }}
                      disabled={full}
                      className={`px-5 py-2 rounded-full font-bold text-sm flex-shrink-0 transition
                        ${full ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-900 text-white hover:bg-blue-800'}`}>
                      {full ? '마감' : '신청하기'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-14 bg-blue-900 rounded-2xl p-8 text-center text-white">
          <h3 className="text-xl font-bold mb-2">설명회 외 개별 상담도 가능합니다</h3>
          <p className="text-blue-300 text-sm mb-6">1:1 맞춤 상담으로 우리 아이 입시 전략을 세워드립니다</p>
          <Link href="/consultation" className="bg-yellow-400 text-blue-900 font-bold px-8 py-3 rounded-full hover:bg-yellow-300 transition inline-block">
            상담 신청하기
          </Link>
        </div>
      </div>

      <footer className="bg-gray-900 text-gray-400 text-center py-8 text-sm">
        <p>© 2026 스카이수학과학입시학원 | 📞 010-5606-3041</p>
      </footer>

      {/* 신청 모달 */}
      {applyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
            {done ? (
              <div className="text-center py-4">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">신청 완료!</h3>
                <p className="text-gray-500 text-sm mb-6">설명회 전 안내 문자를 보내드립니다.</p>
                <button onClick={() => setApplyModal(null)}
                  className="bg-blue-900 text-white px-6 py-3 rounded-full font-bold hover:bg-blue-800">
                  닫기
                </button>
              </div>
            ) : (
              <>
                <h3 className="font-bold text-gray-800 text-lg mb-1">설명회 신청</h3>
                <p className="text-gray-500 text-sm mb-5">{applyModal.title}</p>
                <form onSubmit={handleApply} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">신청자 이름 *</label>
                      <input required value={form.applicant_name} onChange={e => setForm({ ...form, applicant_name: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="홍길동" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">연락처 *</label>
                      <input required type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="010-0000-0000" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">학교명</label>
                      <input value={form.school} onChange={e => setForm({ ...form, school: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="선유고" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">학년</label>
                      <select value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">선택</option>
                        {['중1','중2','중3','고1','고2','고3'].map(g => <option key={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button type="submit" disabled={submitting}
                      className="flex-1 bg-blue-900 text-white py-3 rounded-lg font-bold hover:bg-blue-800 disabled:opacity-50">
                      {submitting ? '신청 중...' : '신청 완료'}
                    </button>
                    <button type="button" onClick={() => setApplyModal(null)}
                      className="flex-1 border py-3 rounded-lg text-gray-600 hover:bg-gray-50">
                      취소
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
