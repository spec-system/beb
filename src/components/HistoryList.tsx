import React from 'react';
import { HistoryEntry, ROLE_LABEL } from '../types';

export default function HistoryList({ history }: { history: HistoryEntry[] }) {
  if (!history.length) return <p className="text-xs text-slate-400">이력이 없습니다.</p>;
  return (
    <ol className="relative border-l border-slate-200 ml-2 space-y-3">
      {history.map((e, i) => (
        <li key={i} className="ml-4">
          <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-blue-500" />
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-sm font-medium text-slate-800">{e.step}</span>
            <span className="text-xs text-slate-500">{e.actor} ({ROLE_LABEL[e.role]})</span>
            <span className="text-[11px] text-slate-400">{e.at.replace('T', ' ')}</span>
          </div>
          {e.reason && <p className="text-xs text-red-600 mt-0.5">사유: {e.reason}</p>}
        </li>
      ))}
    </ol>
  );
}
