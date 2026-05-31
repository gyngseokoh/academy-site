'use client';

import { createContext, useCallback, useContext, useState, useRef, ReactNode } from 'react';

type ToastKind = 'success' | 'error' | 'info';
type ToastItem = { id: number; msg: string; kind: ToastKind };

const KIND_STYLE: Record<ToastKind, string> = {
  success: 'bg-green-600',
  error: 'bg-red-500',
  info: 'bg-gray-800',
};

/**
 * 가벼운 토스트 훅. 컴포넌트 어디서든:
 *   const { toast, ToastHost } = useToast();
 *   toast('저장되었습니다');           // success
 *   toast('실패했습니다', 'error');
 *   return <>{ToastHost}...</>
 */
export function useToast() {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const toast = (msg: string, kind: ToastKind = 'success') => {
    const id = ++idRef.current;
    setItems((prev) => [...prev, { id, msg, kind }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 2600);
  };

  const ToastHost = (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none">
      {items.map((t) => (
        <div
          key={t.id}
          className={`${KIND_STYLE[t.kind]} text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-lg animate-[fadeIn_.15s_ease-out]`}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );

  return { toast, ToastHost };
}
