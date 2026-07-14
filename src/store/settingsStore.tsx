'use client';

import React, { createContext, useContext, useReducer, useEffect, useState, ReactNode } from 'react';
import { STUDENTS } from '../data/seed';

const STORAGE_KEY = 'bigyogwa-settings-v1';

export type StudentStatus = '재학' | '유급' | '휴학';

// 학생 정보 예외 처리 오버레이 (학년/상태/근태메모)
export interface StudentOverride {
  studentId: string;
  grade: string;
  status: StudentStatus;
  attendanceMemo: string;
}

export interface Deadline {
  id: string;
  label: string;
  dueDate: string; // YYYY-MM-DD
}

export interface Notice {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

export interface SignatureImg {
  professorName: string;
  dataUrl: string; // base64 data URL (localStorage 저장)
  fileName?: string;
  uploadedAt?: string;
}

export interface SettingsState {
  studentOverrides: Record<string, StudentOverride>;
  deadlines: Deadline[];
  notices: Notice[];
  signatures: SignatureImg[];
}

const seed = (): SettingsState => ({
  studentOverrides: Object.fromEntries(
    STUDENTS.map((s) => [s.studentId, { studentId: s.studentId, grade: s.grade, status: '재학' as StudentStatus, attendanceMemo: '' }]),
  ),
  deadlines: [
    { id: 'dl1', label: '2학기 결과보고서 제출 마감', dueDate: '2026-12-15' },
    { id: 'dl2', label: '토익 성적표 제출 마감', dueDate: '2026-11-30' },
  ],
  notices: [
    { id: 'n1', title: '봉사 인증서 서명 필수', body: '외부 봉사 인증서는 담당교수 서명 후 업로드해야 인정됩니다.', createdAt: '2026-10-01T09:00:00' },
  ],
  signatures: [],
});

function loadInitial(): SettingsState {
  if (typeof window === 'undefined') return seed();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SettingsState;
      // 시드 학생 중 오버레이 누락분 보강 (스키마 진화 대비)
      const merged = seed();
      return {
        studentOverrides: { ...merged.studentOverrides, ...parsed.studentOverrides },
        deadlines: parsed.deadlines ?? merged.deadlines,
        notices: parsed.notices ?? merged.notices,
        signatures: parsed.signatures ?? merged.signatures,
      };
    }
  } catch {
    /* ignore */
  }
  return seed();
}

export type SettingsAction =
  | { type: 'UPDATE_STUDENT'; override: StudentOverride }
  | { type: 'ADD_DEADLINE'; deadline: Deadline }
  | { type: 'REMOVE_DEADLINE'; id: string }
  | { type: 'ADD_NOTICE'; notice: Notice }
  | { type: 'REMOVE_NOTICE'; id: string }
  | { type: 'SET_SIGNATURE'; signature: SignatureImg }
  | { type: 'REMOVE_SIGNATURE'; professorName: string }
  | { type: 'RESET' }
  | { type: 'HYDRATE'; state: SettingsState };

function reducer(state: SettingsState, action: SettingsAction): SettingsState {
  switch (action.type) {
    case 'UPDATE_STUDENT':
      return { ...state, studentOverrides: { ...state.studentOverrides, [action.override.studentId]: action.override } };
    case 'ADD_DEADLINE':
      return { ...state, deadlines: [...state.deadlines, action.deadline] };
    case 'REMOVE_DEADLINE':
      return { ...state, deadlines: state.deadlines.filter((d) => d.id !== action.id) };
    case 'ADD_NOTICE':
      return { ...state, notices: [action.notice, ...state.notices] };
    case 'REMOVE_NOTICE':
      return { ...state, notices: state.notices.filter((n) => n.id !== action.id) };
    case 'SET_SIGNATURE':
      return {
        ...state,
        signatures: [...state.signatures.filter((s) => s.professorName !== action.signature.professorName), action.signature],
      };
    case 'REMOVE_SIGNATURE':
      return { ...state, signatures: state.signatures.filter((s) => s.professorName !== action.professorName) };
    case 'HYDRATE':
      return action.state;
    case 'RESET':
      return seed();
    default:
      return state;
  }
}

interface SettingsCtx {
  state: SettingsState;
  dispatch: React.Dispatch<SettingsAction>;
  hydrated: boolean;
}
const Ctx = createContext<SettingsCtx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, seed);
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

export function useSettings(): SettingsCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useSettings must be used within SettingsProvider');
  return c;
}
