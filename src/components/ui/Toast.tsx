import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';
interface ToastItem { id: number; kind: ToastKind; message: string; }

interface ToastCtx { toast: (message: string, kind?: ToastKind) => void; }
const Ctx = createContext<ToastCtx | null>(null);

const ICON = { success: CheckCircle2, error: AlertCircle, info: Info };
const TONE = {
  success: 'border-green-200 bg-green-50 text-green-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 3200);
  }, []);

  const remove = (id: number) => setItems((prev) => prev.filter((t) => t.id !== id));

  return (
    <Ctx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[60] flex flex-col gap-3 w-80 max-w-[calc(100vw-3rem)]">
        {items.map((t) => {
          const Icon = ICON[t.kind];
          const title = t.kind === 'success' ? '성공 (SUCCESS)' : t.kind === 'error' ? '시스템 오류 (ERROR)' : '통보 (INFO)';
          return (
            <div
              key={t.id}
              className="pointer-events-auto win7-window flex flex-col shadow-xl animate-[fadeIn_.15s_ease-out] w-full"
            >
              <div className="win7-titlebar flex items-center justify-between px-2.5 py-1.5 select-none text-[11px]">
                <span className="font-bold tracking-tight">{title}</span>
                <button onClick={() => remove(t.id)} className="win7-close-btn flex items-center justify-center cursor-pointer" style={{ width: '18px', height: '14px' }}>
                  <X size={8} strokeWidth={3} />
                </button>
              </div>
              <div className="bg-[#f0f3f5] p-3 flex items-start gap-2.5 text-xs text-slate-800">
                <Icon size={16} className="mt-0.5 shrink-0 text-slate-600" />
                <span className="flex-1 leading-normal font-bold">{t.message}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useToast must be used within ToastProvider');
  return c;
}
