'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { USERS } from '../data/seed';

const STORAGE_KEY = 'bigyogwa-auth-v1';

interface AuthCtx {
  user: User | null;
  hydrated: boolean;
  login: (id: string, pw: string) => { ok: boolean; error?: string };
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

function loadUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as User;
  } catch {
    /* ignore */
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setUser(loadUser());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      if (user) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, [hydrated, user]);

  const login = (id: string, pw: string) => {
    const found = USERS.find((u) => u.id === id.trim());
    if (!found) return { ok: false, error: '존재하지 않는 아이디입니다.' };
    if (found.pw !== pw) return { ok: false, error: '비밀번호가 올바르지 않습니다.' };
    setUser(found);
    return { ok: true };
  };

  const logout = () => setUser(null);

  return <Ctx.Provider value={{ user, hydrated, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth must be used within AuthProvider');
  return c;
}
