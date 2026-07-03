import React from 'react';

// 상태 → 색상 매핑 (다단계/단순 상태 모두)
const TONE: Record<string, string> = {
  '계획서 접수': 'bg-slate-100 text-slate-700 border-slate-200',
  '계획서 승인': 'bg-blue-50 text-blue-700 border-blue-200',
  '보고서 접수': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  '보고서 담당승인': 'bg-violet-50 text-violet-700 border-violet-200',
  '최종 승인': 'bg-green-50 text-green-700 border-green-200',
  '반려': 'bg-red-50 text-red-700 border-red-200',
  '접수': 'bg-slate-100 text-slate-700 border-slate-200',
  '검토중': 'bg-amber-50 text-amber-700 border-amber-200',
  '승인': 'bg-green-50 text-green-700 border-green-200',
};

export default function Badge({ status }: { status: string }) {
  const tone = TONE[status] ?? 'bg-slate-100 text-slate-700 border-slate-200';
  return (
    <span className={`inline-block px-2.5 py-1 text-[11px] font-bold rounded-full border whitespace-nowrap ${tone}`}>
      {status}
    </span>
  );
}
