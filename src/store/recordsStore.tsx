'use client';

import React, { createContext, useContext, useReducer, useEffect, useState, ReactNode } from 'react';
import {
  DeptProgramRecord,
  ToeicRecord,
  VolunteerRecord,
  DeptStatus,
  SimpleStatus,
  Role,
  FileMeta,
  HistoryEntry,
  EmailNotification,
  Message,
  AnyRecord,
} from '../types';
import { SEED_DEPT, SEED_TOEIC, SEED_VOLUNTEER } from '../data/seed';

const STORAGE_KEY = 'bigyogwa-records-v1';

export interface RecordsState {
  dept: DeptProgramRecord[];
  toeic: ToeicRecord[];
  volunteer: VolunteerRecord[];
  notifications: EmailNotification[];
  messages: Message[];
}

const initialSeed = (): RecordsState => ({
  dept: SEED_DEPT,
  toeic: SEED_TOEIC,
  volunteer: SEED_VOLUNTEER,
  notifications: [],
  messages: [],
});

function loadInitial(): RecordsState {
  if (typeof window === 'undefined') return initialSeed();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<RecordsState>;
      return { ...initialSeed(), ...parsed, notifications: parsed.notifications ?? [], messages: parsed.messages ?? [] };
    }
  } catch {
    /* ignore */
  }
  return initialSeed();
}

export type Actor = { name: string; role: Role };

export type Action =
  | { type: 'CREATE_DEPT'; payload: Omit<DeptProgramRecord, 'id' | 'history' | 'status' | 'lastUpdate'>; actor: Actor }
  | { type: 'APPROVE_APPLICATION_PROFESSOR'; id: string; actor: Actor }
  | { type: 'APPROVE_APPLICATION_HEAD'; id: string; actor: Actor }
  | { type: 'UPLOAD_POSTER'; id: string; file: FileMeta; actor: Actor }
  | { type: 'SUBMIT_REPORT'; id: string; file: FileMeta; actor: Actor }
  | { type: 'REVIEW_POSTER_HEAD'; id: string; actor: Actor }
  | { type: 'REVIEW_REPORT_HEAD'; id: string; actor: Actor }
  | { type: 'SAVE_DRAFT_DEPT'; id: string; actor: Actor }
  | { type: 'APPROVE_FINAL_HEAD'; id: string; actor: Actor }
  | { type: 'REJECT_DEPT'; id: string; reason: string; actor: Actor }
  | { type: 'CANCEL_DEPT'; id: string; actor: Actor }
  | { type: 'RESUBMIT_DEPT'; id: string; actor: Actor }
  | { type: 'CREATE_TOEIC'; payload: Omit<ToeicRecord, 'id' | 'history' | 'status' | 'lastUpdate'>; actor: Actor }
  | { type: 'APPROVE_TOEIC_PROFESSOR'; id: string; actor: Actor }
  | { type: 'APPROVE_TOEIC_FINAL_HEAD'; id: string; actor: Actor }
  | { type: 'REJECT_TOEIC'; id: string; reason: string; actor: Actor }
  | { type: 'CANCEL_TOEIC'; id: string; actor: Actor }
  | { type: 'RESUBMIT_TOEIC'; id: string; actor: Actor }
  | { type: 'CREATE_VOLUNTEER'; payload: Omit<VolunteerRecord, 'id' | 'history' | 'status' | 'lastUpdate'>; actor: Actor }
  | { type: 'UPLOAD_CERT'; id: string; file: FileMeta; actor: Actor }
  | { type: 'APPROVE_VOLUNTEER_PROFESSOR'; id: string; actor: Actor }
  | { type: 'APPROVE_VOLUNTEER_FINAL_HEAD'; id: string; actor: Actor }
  | { type: 'REJECT_VOLUNTEER'; id: string; reason: string; actor: Actor }
  | { type: 'CANCEL_VOLUNTEER'; id: string; actor: Actor }
  | { type: 'RESUBMIT_VOLUNTEER'; id: string; actor: Actor }
  | { type: 'SET_ADMIN_COMMENT'; domain: 'dept' | 'toeic' | 'volunteer'; id: string; comment: string; actor: Actor }
  | { type: 'SET_DOCUMENT_STATUS'; domain: 'dept' | 'volunteer'; id: string; kind: 'application' | 'result'; actor: Actor }
  | { type: 'NOTIFY_PROFESSOR'; domain: 'dept' | 'toeic' | 'volunteer'; id: string; actor: Actor }
  | { type: 'MARK_NOTIFICATIONS_READ' }
  | { type: 'REASSIGN_PROFESSOR'; domain: 'dept' | 'toeic' | 'volunteer'; id: string; professor: string; actor: Actor }
  | { type: 'SEND_MESSAGE'; message: Message }
  | { type: 'MARK_MESSAGES_READ'; professor: string }
  | { type: 'RESET' }
  | { type: 'HYDRATE'; state: RecordsState };

const now = () => new Date().toISOString().slice(0, 19);
const nowDate = () => new Date().toISOString().slice(0, 10);

const entry = (step: string, actor: Actor, reason?: string): HistoryEntry => ({
  step,
  actor: actor.name,
  role: actor.role,
  at: now(),
  reason,
});

const DEPT_CERT_STATUSES = new Set<DeptStatus>(['신청 승인됨', '포스터 심사 중', '결과 보고서 검토 중', '최종 검토중']);
function deptCertStatus(r: Pick<DeptProgramRecord, 'posterFile' | 'reportFile'>): DeptStatus {
  const p = Boolean(r.posterFile);
  const rep = Boolean(r.reportFile);
  if (p && rep) return '최종 검토중';
  if (p) return '포스터 심사 중';
  if (rep) return '결과 보고서 검토 중';
  return '신청 승인됨';
}

let seq = 1000;
const nextId = (prefix: string) => `${prefix}${(seq += 1)}`;
let notifSeq = 5000;
const nextNotifId = () => `n${(notifSeq += 1)}`;
const finalSimple = (status: SimpleStatus) => status === '최종 승인' || status === '승인';

// 상태 전이 이벤트를 학생에게 보내는 목업 이메일 알림으로 변환
function findRecord(state: RecordsState, id: string): AnyRecord | undefined {
  return state.dept.find((r) => r.id === id) || state.toeic.find((r) => r.id === id) || state.volunteer.find((r) => r.id === id);
}

const NOTIFY_ACTIONS = new Set([
  'APPROVE_APPLICATION_PROFESSOR', 'APPROVE_APPLICATION_HEAD', 'APPROVE_FINAL_HEAD', 'REJECT_DEPT',
  'APPROVE_TOEIC_PROFESSOR', 'APPROVE_TOEIC_FINAL_HEAD', 'REJECT_TOEIC',
  'APPROVE_VOLUNTEER_PROFESSOR', 'APPROVE_VOLUNTEER_FINAL_HEAD', 'REJECT_VOLUNTEER',
]);

function programLabel(rec: AnyRecord): string {
  if (rec.programType === '토익') return '토익 성적';
  return (rec as DeptProgramRecord | VolunteerRecord).title || rec.programType;
}

function reducer(state: RecordsState, action: Action): RecordsState {
  const next = coreReducer(state, action);
  if (action.type === 'NOTIFY_PROFESSOR') {
    const rec = findRecord(state, action.id);
    if (rec) {
      const notif: EmailNotification = {
        id: nextNotifId(),
        to: rec.studentId,
        toName: rec.name,
        subject: `[발송 완료] '${rec.professor}' 교수님께 승인 리마인더 메일이 전송되었습니다.`,
        body: `'${rec.professor}' 교수님께 제출하신 '${programLabel(rec)}' 건에 대한 승인 검토 요청 메일이 자동 발송되었습니다.`,
        createdAt: now(),
        read: false,
      };
      return { ...next, notifications: [notif, ...next.notifications] };
    }
  }
  if ('id' in action && NOTIFY_ACTIONS.has(action.type)) {
    const before = findRecord(state, action.id);
    const after = findRecord(next, action.id);
    if (before && after && before.status !== after.status) {
      const rejected = (after.status as string) === '반려';
      const reason = 'reason' in action ? action.reason : undefined;
      const notif: EmailNotification = {
        id: nextNotifId(),
        to: after.studentId,
        toName: after.name,
        subject: `[비교과 알림] ${programLabel(after)} ${rejected ? '반려' : `상태 변경(${after.status})`}`,
        body: rejected
          ? `제출하신 '${programLabel(after)}' 건이 반려되었습니다.${reason ? ` 사유: ${reason}` : ''}`
          : `제출하신 '${programLabel(after)}' 건의 진행 상태가 '${after.status}'(으)로 변경되었습니다.`,
        createdAt: now(),
        read: false,
      };
      return { ...next, notifications: [notif, ...next.notifications] };
    }
  }
  return next;
}

function coreReducer(state: RecordsState, action: Action): RecordsState {
  switch (action.type) {
    case 'NOTIFY_PROFESSOR': {
      const touchRecord = <T extends { history: HistoryEntry[]; lastUpdate: string }>(r: T): T => ({
        ...r,
        lastUpdate: now(),
        history: [...r.history, entry('교수 승인 리마인더 발송', action.actor)]
      });
      if (action.domain === 'dept') {
        return mutDept(state, action.id, touchRecord);
      } else if (action.domain === 'toeic') {
        return mutToeic(state, action.id, touchRecord);
      } else if (action.domain === 'volunteer') {
        return mutVol(state, action.id, touchRecord);
      }
      return state;
    }
    case 'CREATE_DEPT': {
      const rec: DeptProgramRecord = {
        ...action.payload,
        id: nextId('d'),
        status: '신청 완료',
        lastUpdate: now(),
        history: [entry('신청 완료', action.actor)],
      };
      return { ...state, dept: [rec, ...state.dept] };
    }
    case 'APPROVE_APPLICATION_PROFESSOR':
      return mutDept(state, action.id, (r) =>
        r.status === '신청 완료'
          ? { ...r, status: '담당교수 승인', history: [...r.history, entry('담당교수 승인', action.actor)] }
          : r,
      );
    case 'APPROVE_APPLICATION_HEAD':
      return mutDept(state, action.id, (r) =>
        r.status === '담당교수 승인'
          ? { ...r, status: '신청 승인됨', history: [...r.history, entry('신청 승인됨', action.actor)] }
          : r,
      );
    case 'UPLOAD_POSTER':
      return mutDept(state, action.id, (r) =>
        DEPT_CERT_STATUSES.has(r.status)
          ? { ...r, posterFile: action.file, posterReviewed: false, status: deptCertStatus({ ...r, posterFile: action.file }), history: [...r.history, entry('포스터 업로드', action.actor)] }
          : r,
      );
    case 'SUBMIT_REPORT':
      return mutDept(state, action.id, (r) =>
        DEPT_CERT_STATUSES.has(r.status)
          ? { ...r, reportFile: action.file, reportReviewed: false, status: deptCertStatus({ ...r, reportFile: action.file }), history: [...r.history, entry('결과 보고서 제출', action.actor)] }
          : r,
      );
    case 'REVIEW_POSTER_HEAD':
      return mutDept(state, action.id, (r) =>
        r.posterFile && !r.posterReviewed && DEPT_CERT_STATUSES.has(r.status)
          ? { ...r, posterReviewed: true, history: [...r.history, entry('포스터 심사 완료', action.actor)] }
          : r,
      );
    case 'REVIEW_REPORT_HEAD':
      return mutDept(state, action.id, (r) =>
        r.reportFile && !r.reportReviewed && DEPT_CERT_STATUSES.has(r.status)
          ? { ...r, reportReviewed: true, history: [...r.history, entry('결과 보고서 심사 완료', action.actor)] }
          : r,
      );
    case 'APPROVE_FINAL_HEAD':
      return mutDept(state, action.id, (r) =>
        r.status === '최종 검토중' && r.posterReviewed && r.reportReviewed
          ? { ...r, status: '최종 승인', finalApprovalDate: nowDate(), history: [...r.history, entry('최종 승인', action.actor)] }
          : r,
      );
    case 'SAVE_DRAFT_DEPT':
      return mutDept(state, action.id, (r) => ({ ...r, draftSavedAt: now(), history: [...r.history, entry('임시 저장', action.actor)] }));
    case 'REJECT_DEPT': {
      const rejectStatus: DeptStatus = action.actor.role === 'PROFESSOR' ? '(담당교수에게) 반려됨' : '(학과장에게) 반려됨';
      return mutDept(state, action.id, (r) => ({ ...r, status: rejectStatus, history: [...r.history, entry(rejectStatus, action.actor, action.reason)] }));
    }
    case 'CANCEL_DEPT':
      return mutDept(state, action.id, (r) =>
        r.status === '최종 승인'
          ? { ...r, status: '최종 검토중', finalApprovalDate: '', history: [...r.history, entry('최종 승인 취소 → 최종 검토중', action.actor)] }
          : r,
      );
    case 'RESUBMIT_DEPT':
      return mutDept(state, action.id, (r) =>
        r.status === '(담당교수에게) 반려됨' || r.status === '(학과장에게) 반려됨'
          ? { ...r, status: '신청 완료', finalApprovalDate: '', history: [...r.history, entry('재신청', action.actor)] }
          : r,
      );

    case 'CREATE_TOEIC': {
      const rec: ToeicRecord = { ...action.payload, id: nextId('t'), status: '접수', lastUpdate: now(), history: [entry('접수', action.actor)] };
      return { ...state, toeic: [rec, ...state.toeic] };
    }
    case 'APPROVE_TOEIC_PROFESSOR':
      return mutToeic(state, action.id, (r) =>
        r.status === '접수' || r.status === '반려' || r.status === '검토중'
          ? { ...r, status: '1차 승인', history: [...r.history, entry('1차 승인', action.actor)] }
          : r,
      );
    case 'APPROVE_TOEIC_FINAL_HEAD':
      return mutToeic(state, action.id, (r) =>
        r.status === '1차 승인' || r.status === '검토중'
          ? { ...r, status: '최종 승인', finalApprovalDate: nowDate(), history: [...r.history, entry('최종 승인', action.actor)] }
          : r,
      );
    case 'REJECT_TOEIC':
      return mutToeic(state, action.id, (r) => ({ ...r, status: '반려', history: [...r.history, entry('반려', action.actor, action.reason)] }));
    case 'CANCEL_TOEIC':
      return mutToeic(state, action.id, (r) =>
        finalSimple(r.status) ? { ...r, status: '1차 승인', finalApprovalDate: '', history: [...r.history, entry('최종 승인 취소', action.actor)] } : r,
      );
    case 'RESUBMIT_TOEIC':
      return mutToeic(state, action.id, (r) =>
        r.status === '반려' ? { ...r, status: '접수', finalApprovalDate: '', history: [...r.history, entry('재제출', action.actor)] } : r,
      );

    case 'CREATE_VOLUNTEER': {
      const rec: VolunteerRecord = { ...action.payload, id: nextId('v'), status: '접수', lastUpdate: now(), history: [entry('접수', action.actor)] };
      return { ...state, volunteer: [rec, ...state.volunteer] };
    }
    case 'UPLOAD_CERT':
      return mutVol(state, action.id, (r) =>
        r.status === '접수' || r.status === '검토중' || r.status === '반려'
          ? { ...r, certFile: action.file, history: [...r.history, entry('인증서 업로드', action.actor)] }
          : r,
      );
    case 'APPROVE_VOLUNTEER_PROFESSOR':
      return mutVol(state, action.id, (r) =>
        r.status === '접수' || r.status === '반려' || r.status === '검토중'
          ? { ...r, status: '1차 승인', history: [...r.history, entry('1차 승인', action.actor)] }
          : r,
      );
    case 'APPROVE_VOLUNTEER_FINAL_HEAD':
      return mutVol(state, action.id, (r) =>
        r.status === '1차 승인' || r.status === '검토중'
          ? { ...r, status: '최종 승인', finalApprovalDate: nowDate(), history: [...r.history, entry('최종 승인', action.actor)] }
          : r,
      );
    case 'REJECT_VOLUNTEER':
      return mutVol(state, action.id, (r) => ({ ...r, status: '반려', history: [...r.history, entry('반려', action.actor, action.reason)] }));
    case 'CANCEL_VOLUNTEER':
      return mutVol(state, action.id, (r) =>
        finalSimple(r.status) ? { ...r, status: '1차 승인', finalApprovalDate: '', history: [...r.history, entry('최종 승인 취소', action.actor)] } : r,
      );
    case 'RESUBMIT_VOLUNTEER':
      return mutVol(state, action.id, (r) =>
        r.status === '반려' ? { ...r, status: '접수', finalApprovalDate: '', history: [...r.history, entry('재제출', action.actor)] } : r,
      );

    case 'SET_ADMIN_COMMENT': {
      const patch = (r: any) => ({ ...r, adminComment: action.comment, history: [...r.history, entry('행정실 코멘트', action.actor)] });
      if (action.domain === 'dept') return mutDept(state, action.id, patch);
      if (action.domain === 'toeic') return mutToeic(state, action.id, patch);
      return mutVol(state, action.id, patch);
    }
    case 'SET_DOCUMENT_STATUS': {
      const step = `${action.kind === 'application' ? '신청서' : '결과보고서'} 구글 드라이브 전송`;
      if (action.domain === 'dept') {
        return mutDept(state, action.id, (r) => ({
          ...r,
          documentStatus: { ...(r.documentStatus ?? {}), [action.kind]: '전송됨' as const },
          history: [...r.history, entry(step, action.actor)],
        }));
      }
      return mutVol(state, action.id, (r) => ({
        ...r,
        documentStatus: { ...(r.documentStatus ?? {}), [action.kind]: '전송됨' as const },
        history: [...r.history, entry(step, action.actor)],
      }));
    }
    case 'MARK_NOTIFICATIONS_READ':
      return { ...state, notifications: state.notifications.map((n) => (n.read ? n : { ...n, read: true })) };
    case 'REASSIGN_PROFESSOR': {
      const patch = <T extends { professor: string; history: HistoryEntry[] }>(r: T): T => {
        if (r.professor === action.professor) return r;
        return { ...r, professor: action.professor, history: [...r.history, entry(`담당교수 변경: ${r.professor || '미지정'} → ${action.professor}`, action.actor)] };
      };
      if (action.domain === 'dept') return mutDept(state, action.id, patch);
      if (action.domain === 'toeic') return mutToeic(state, action.id, patch);
      return mutVol(state, action.id, patch);
    }
    case 'SEND_MESSAGE':
      return { ...state, messages: [action.message, ...state.messages] };
    case 'MARK_MESSAGES_READ':
      return { ...state, messages: state.messages.map((m) => (m.toProfessor === action.professor && !m.read ? { ...m, read: true } : m)) };
    case 'HYDRATE':
      return action.state;
    case 'RESET':
      return initialSeed();
    default:
      return state;
  }
}

function touch<T extends { lastUpdate: string }>(r: T): T {
  return { ...r, lastUpdate: now() };
}
function mutDept(state: RecordsState, id: string, fn: (r: DeptProgramRecord) => DeptProgramRecord): RecordsState {
  return { ...state, dept: state.dept.map((r) => {
    if (r.id !== id) return r;
    const next = fn(r);
    return next === r ? r : touch(next);
  }) };
}
function mutToeic(state: RecordsState, id: string, fn: (r: ToeicRecord) => ToeicRecord): RecordsState {
  return { ...state, toeic: state.toeic.map((r) => {
    if (r.id !== id) return r;
    const next = fn(r);
    return next === r ? r : touch(next);
  }) };
}
function mutVol(state: RecordsState, id: string, fn: (r: VolunteerRecord) => VolunteerRecord): RecordsState {
  return { ...state, volunteer: state.volunteer.map((r) => {
    if (r.id !== id) return r;
    const next = fn(r);
    return next === r ? r : touch(next);
  }) };
}

interface RecordsCtx {
  state: RecordsState;
  dispatch: React.Dispatch<Action>;
  hydrated: boolean;
}
const Ctx = createContext<RecordsCtx | null>(null);

export function RecordsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialSeed);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    dispatch({ type: 'HYDRATE', state: loadInitial() });
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [hydrated, state]);

  return <Ctx.Provider value={{ state, dispatch, hydrated }}>{children}</Ctx.Provider>;
}

export function useRecords(): RecordsCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useRecords must be used within RecordsProvider');
  return c;
}
