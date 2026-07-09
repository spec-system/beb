import React from 'react';

// 상태 → 색상 매핑 (다단계/단순 상태 모두)
const TONE: Record<string, string> = {
  '신청 완료': 'stamp-badge stamp-blue',
  '담당교수 승인': 'stamp-badge stamp-blue',
  '신청 승인됨': 'stamp-badge stamp-orange',
  '포스터 심사 중': 'stamp-badge stamp-orange',
  '결과 보고서 검토 중': 'stamp-badge stamp-orange',
  '최종 검토중': 'stamp-badge stamp-orange',
  '최종 승인': 'stamp-badge stamp-green',
  '(담당교수에게) 반려됨': 'stamp-badge stamp-red',
  '(학과장에게) 반려됨': 'stamp-badge stamp-red',
  '반려': 'stamp-badge stamp-red',
  '접수': 'stamp-badge stamp-blue',
  '검토중': 'stamp-badge stamp-orange',
  '1차 승인': 'stamp-badge stamp-orange',
  '승인': 'stamp-badge stamp-green',
};

export default function Badge({ status }: { status: string }) {
  const tone = TONE[status] ?? 'stamp-badge stamp-blue';
  return (
    <span className={tone}>
      {status}
    </span>
  );
}
