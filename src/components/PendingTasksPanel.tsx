import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecords } from '../store/recordsStore';
import { useAuth } from '../auth/AuthContext';
import { isAssignedProfessor, isFinalApproved } from '../auth/roles';
import { AnyRecord } from '../types';

interface Card {
  key: string;
  label: string;
  count: number;
  to: string;
}

// 관리자(교수/학과장/행정실) 로그인 시 상단에 표시하는 처리대기 요약.
// 학생은 렌더하지 않는다.
export default function PendingTasksPanel() {
  const { state } = useRecords();
  const { user } = useAuth();
  const navigate = useNavigate();

  const cards = useMemo<Card[]>(() => {
    if (!user || user.role === 'STUDENT') return [];
    const list: Card[] = [];

    if (user.role === 'PROFESSOR') {
      const assigned = (r: AnyRecord) => isAssignedProfessor(user, r);
      const deptApp = state.dept.filter((r) => assigned(r) && r.status === '신청 완료').length;
      const toeic = state.toeic.filter((r) => assigned(r) && r.status === '접수').length;
      const vol = state.volunteer.filter((r) => assigned(r) && r.status === '접수').length;
      list.push({ key: 'dept-app', label: '신청서 담당 승인 대기', count: deptApp, to: '/dept' });
      list.push({ key: 'toeic', label: '토익 1차 승인 대기', count: toeic, to: '/toeic' });
      list.push({ key: 'vol', label: '봉사 1차 승인 대기', count: vol, to: '/volunteer' });
    } else if (user.role === 'HEAD') {
      const deptFinal = state.dept.filter((r) => ['담당교수 승인', '포스터 심사 중', '결과 보고서 검토 중', '최종 검토중'].includes(r.status)).length;
      const toeic = state.toeic.filter((r) => r.status === '1차 승인').length;
      const vol = state.volunteer.filter((r) => r.status === '1차 승인').length;
      list.push({ key: 'dept-final', label: '학과장 승인·심사 대기', count: deptFinal, to: '/dept' });
      list.push({ key: 'toeic', label: '토익 최종승인 대기', count: toeic, to: '/toeic' });
      list.push({ key: 'vol', label: '봉사 최종승인 대기', count: vol, to: '/volunteer' });
    } else if (user.role === 'STAFF') {
      const noComment = (r: AnyRecord) => !r.adminComment && !isFinalApproved(r);
      const dept = state.dept.filter(noComment).length;
      const toeic = state.toeic.filter(noComment).length;
      const vol = state.volunteer.filter(noComment).length;
      list.push({ key: 'dept', label: '비교과 코멘트 미작성', count: dept, to: '/dept' });
      list.push({ key: 'toeic', label: '토익 코멘트 미작성', count: toeic, to: '/toeic' });
      list.push({ key: 'vol', label: '봉사 코멘트 미작성', count: vol, to: '/volunteer' });
    }
    return list;
  }, [state, user]);

  if (!user || user.role === 'STUDENT') return null;

  const total = cards.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm" data-testid="pending-tasks-panel">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-slate-800">처리해야 할 작업</h2>
        <span className="text-xs text-slate-500">{total > 0 ? `총 ${total}건 대기` : '처리할 항목 없음'}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c) => (
          <button
            key={c.key}
            onClick={() => navigate(c.to)}
            className={`text-left rounded-lg border p-3 transition-colors ${c.count > 0 ? 'border-amber-300 bg-amber-50 hover:bg-amber-100' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}
            data-testid={`pending-card-${c.key}`}
          >
            <div className={`text-2xl font-black ${c.count > 0 ? 'text-amber-700' : 'text-slate-400'}`}>{c.count}</div>
            <div className="text-xs text-slate-600 mt-1">{c.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
