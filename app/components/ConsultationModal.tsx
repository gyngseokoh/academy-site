'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ConsultationButton({ className, label }: { className?: string; label?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className={className}>
        {label ?? '📞 상담 신청'}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 z-10"
            onClick={e => e.stopPropagation()}>

            {/* 닫기 */}
            <button onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-gray-300 hover:text-gray-500 text-xl leading-none">✕</button>

            <h3 className="text-xl font-bold text-gray-900 text-center mb-2">상담 신청</h3>
            <p className="text-gray-500 text-sm text-center mb-8">해당하는 항목을 선택해주세요</p>

            <div className="space-y-3">
              <Link href="/consultation" onClick={() => setOpen(false)}
                className="flex items-center gap-4 w-full bg-blue-900 text-white rounded-2xl p-5 hover:bg-blue-800 transition group">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  🌱
                </div>
                <div className="text-left">
                  <div className="font-bold text-base">신규생 상담</div>
                  <div className="text-blue-300 text-xs mt-0.5">처음 등록을 원하는 학생 · 학부모</div>
                </div>
                <span className="ml-auto text-blue-400 group-hover:translate-x-1 transition">→</span>
              </Link>

              <Link href="/consultation/current" onClick={() => setOpen(false)}
                className="flex items-center gap-4 w-full bg-gray-50 border-2 border-gray-100 text-gray-800 rounded-2xl p-5 hover:border-blue-300 hover:bg-blue-50 transition group">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                  💬
                </div>
                <div className="text-left">
                  <div className="font-bold text-base">재원생 상담</div>
                  <div className="text-gray-400 text-xs mt-0.5">현재 다니고 있는 학생 · 학부모</div>
                </div>
                <span className="ml-auto text-gray-300 group-hover:translate-x-1 group-hover:text-blue-400 transition">→</span>
              </Link>
            </div>

            <p className="text-center text-xs text-gray-400 mt-6">
              📞 전화 상담: 010-5606-3041
            </p>
          </div>
        </div>
      )}
    </>
  );
}
