import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import {
  DeptProgramRecord,
  ToeicRecord,
  VolunteerRecord,
  DeptStatus,
  SimpleStatus,
  Role,
  FileMeta,
  HistoryEntry,
} from '../types';
import { SEED_DEPT, SEED_TOEIC, SEED_VOLUNTEER } from '../data/seed';

const STORAGE_KEY = 'bigyogwa-records-v1';

export interface RecordsState {
  dept: DeptProgramRecord[];
  toeic: ToeicRecord[];
  volunteer: VolunteerRecord[];
}

const initialSeed = (): RecordsState => ({
  dept: SEED_DEPT,
  toeic: SEED_TOEIC,
  volunteer: SEED_VOLUNTEER,
});

function loadInitial(): RecordsState {
  if (typeof window === 'undefined') return initialSeed();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as RecordsState;
  } catch {
    /* ignore */
  }
  return initialSeed();
}

export type Actor = { name: string; role: Role };

export type Action =
  | { type: 'CREATE_DEPT'; payload: Omit<DeptProgramRecord, 'id' | 'history' | 'status' | 'lastUpdate'>; actor: Actor }
  | { type: 'APPROVE_PLAN'; id: string; actor: Actor }
  | { type: 'SUBMIT_REPORT'; id: string; file: FileMeta; actor: Actor }
  | { type: 'APPROVE_REPORT_PROFESSOR'; id: string; comment?: string; actor: Actor }
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
  | { type: 'RESET' };

const now = () => new Date().toISOString().slice(0, 19);
const nowDate = () => new Date().toISOString().slice(0, 10);

const entry = (step: string, actor: Actor, reason?: string): HistoryEntry => ({
  step,
  actor: actor.name,
  role: actor.role,
  at: now(),
  reason,
});

const DEPT_PREV: Record<DeptStatus, DeptStatus | null> = {
  '계획서 접수': null,
  '계획서 승인': '계획서 접수',
  '보고서 접수': '계획서 승인',
  '보고서 담당승인': '보고서 접수',
  '최종 승인': '보고서 담당승인',
  '반려': null,
};

let seq = 1000;
const nextId = (prefix: string) => `${prefix}${(seq += 1)}`;
const finalSimple = (status: SimpleStatus) => status === '최종 승인' || status === '승인';

function reducer(state: RecordsState, action: Action): RecordsState {
  switch (action.type) {
    case 'CREATE_DEPT': {
      const rec: DeptProgramRecord = {
        ...action.payload,
        id: nextId('d'),
        status: '계획서 접수',
        lastUpdate: now(),
        history: [entry('계획서 접수', action.actor)],
      };
      return { ...state, dept: [rec, ...state.dept] };
    }
    case 'APPROVE_PLAN':
      return mutDept(state, action.id, (r) =>
        r.status === '계획서 접수'
          ? { ...r, status: '계획서 승인', history: [...r.history, entry('계획서 승인', action.actor)] }
          : r,
      );
    case 'SUBMIT_REPORT':
      return mutDept(state, action.id, (r) =>
        r.status === '계획서 승인' || r.status === '반려'
          ? { ...r, status: '보고서 접수', reportFile: action.file, history: [...r.history, entry('보고서 접수', action.actor)] }
          : r,
      );
    case 'APPROVE_REPORT_PROFESSOR':
      return mutDept(state, action.id, (r) =>
        r.status === '보고서 접수'
          ? { ...r, status: '보고서 담당승인', professorComment: action.comment ?? r.professorComment, history: [...r.history, entry('보고서 담당승인', action.actor)] }
          : r,
      );
    case 'APPROVE_FINAL_HEAD':
      return mutDept(state, action.id, (r) =>
        r.status === '보고서 담당승인'
          ? { ...r, status: '최종 승인', finalApprovalDate: nowDate(), history: [...r.history, entry('최종 승인', action.actor)] }
          : r,
      );
    case 'REJECT_DEPT':
      return mutDept(state, action.id, (r) => ({ ...r, status: '반려', history: [...r.history, entry('반려', action.actor, action.reason)] }));
    case 'CANCEL_DEPT':
      return mutDept(state, action.id, (r) => {
        if (r.status !== '최종 승인') return r;
        const prev = DEPT_PREV[r.status];
        if (!prev) return r;
        return { ...r, status: prev, finalApprovalDate: '', history: [...r.history, entry(`최종 승인 취소 → ${prev}`, action.actor)] };
      });
    case 'RESUBMIT_DEPT':
      return mutDept(state, action.id, (r) =>
        r.status === '반려' ? { ...r, status: '계획서 접수', finalApprovalDate: '', history: [...r.history, entry('재제출', action.actor)] } : r,
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
  return { ...state, dept: state.dept.map((r) => (r.id === id ? touch(fn(r)) : r)) };
}
function mutToeic(state: RecordsState, id: string, fn: (r: ToeicRecord) => ToeicRecord): RecordsState {
  return { ...state, toeic: state.toeic.map((r) => (r.id === id ? touch(fn(r)) : r)) };
}
function mutVol(state: RecordsState, id: string, fn: (r: VolunteerRecord) => VolunteerRecord): RecordsState {
  return { ...state, volunteer: state.volunteer.map((r) => (r.id === id ? touch(fn(r)) : r)) };
}

interface RecordsCtx {
  state: RecordsState;
  dispatch: React.Dispatch<Action>;
}
const Ctx = createContext<RecordsCtx | null>(null);

export function RecordsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadInitial);
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export function useRecords(): RecordsCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useRecords must be used within RecordsProvider');
  return c;
}
