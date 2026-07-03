import React from 'react';
import EmptyState from './EmptyState';

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-auto border border-slate-200 rounded-lg bg-white shadow-sm">
      <table className="w-full text-sm text-left border-collapse">{children}</table>
    </div>
  );
}

export function Th({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return <th className={`py-3 px-4 whitespace-nowrap ${className}`}>{children}</th>;
}
export function Td({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return <td className={`py-3 px-4 ${className}`}>{children}</td>;
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
        {children}
      </tr>
    </thead>
  );
}

export function TableEmpty({ colSpan, message }: { colSpan: number; message?: string }) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <EmptyState message={message} />
      </td>
    </tr>
  );
}
