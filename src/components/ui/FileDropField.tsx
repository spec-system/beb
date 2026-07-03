import React, { useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2 } from 'lucide-react';
import { FileMeta } from '../../types';

interface Props {
  value: FileMeta | null;
  onSelect: (meta: FileMeta) => void;
  accept?: string;
  hint?: string;
}

const fmtSize = (b: number) => (b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`);

export default function FileDropField({ value, onSelect, accept = 'application/pdf', hint }: Props) {
  const ref = useRef<HTMLInputElement>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    // 프론트엔드 전용: 실제 업로드 없이 파일명·크기 메타만 저장
    onSelect({ name: f.name, size: f.size, uploadedAt: new Date().toISOString().slice(0, 19) });
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="w-full flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-slate-500 hover:border-blue-400 hover:bg-blue-50/40 transition-colors"
      >
        {value ? (
          <>
            <CheckCircle2 className="text-green-600" size={24} />
            <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <FileText size={14} /> {value.name}
            </span>
            <span className="text-xs text-slate-400">{fmtSize(value.size)} · 선택됨 (파일 변경하려면 클릭)</span>
          </>
        ) : (
          <>
            <UploadCloud size={24} />
            <span className="text-sm font-medium">클릭하여 파일 선택</span>
            {hint && <span className="text-xs text-slate-400">{hint}</span>}
          </>
        )}
      </button>
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={onChange} />
    </div>
  );
}
