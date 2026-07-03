import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({ message = '표시할 데이터가 없습니다.' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
      <Inbox size={40} strokeWidth={1.5} />
      <p className="text-sm">{message}</p>
    </div>
  );
}
