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
      <div className="fixed bottom-6 right-6 z-[60] flex flex-col gap-2 w-80 max-w-[calc(100vw-3rem)]">
        {items.map((t) => {
          const Icon = ICON[t.kind];
          return (
            <div
              key={t.id}
              className={`flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm shadow-lg animate-[fadeIn_.15s_ease-out] ${TONE[t.kind]}`}
            >
              <Icon size={16} className="mt-0.5 shrink-0" />
              <span className="flex-1 leading-snug">{t.message}</span>
              <button onClick={() => remove(t.id)} className="text-current/60 hover:text-current"><X size={14} /></button>
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
