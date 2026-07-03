import React from 'react';

export default function PageHeader({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap justify-between items-end gap-3 mb-6">
      <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
        {title}
        {sub && <span className="text-slate-400 text-lg font-normal"> / {sub}</span>}
      </h1>
      {right}
    </div>
  );
}
