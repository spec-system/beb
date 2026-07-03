import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { USERS } from '../data/seed';
import { ROLE_LABEL } from '../types';
import Button from '../components/ui/Button';
import { Input, Label } from '../components/ui/Field';
import { GraduationCap, AlertCircle } from 'lucide-react';

export default function LoginView() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = login(id, pw);
    if (res.ok) navigate('/');
    else setError(res.error ?? '로그인에 실패했습니다.');
  };

  const quick = (uid: string, upw: string) => {
    setId(uid);
    setPw(upw);
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white mb-3 shadow-md">
            <GraduationCap size={26} />
          </div>
          <h1 className="text-lg font-semibold text-slate-900">삼육대학교 약학대학</h1>
          <p className="text-sm text-slate-500">비교과 프로그램 이수현황 관리</p>
        </div>

        <form onSubmit={submit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>아이디</Label>
            <Input value={id} onChange={(e) => setId(e.target.value)} placeholder="아이디" autoFocus />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>비밀번호</Label>
            <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="비밀번호" />
          </div>
          {error && (
            <div className="flex items-center gap-1.5 text-sm text-red-600">
              <AlertCircle size={14} /> {error}
            </div>
          )}
          <Button type="submit" className="w-full">로그인</Button>
        </form>

        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">데모 계정 (클릭하여 자동 입력)</p>
          <div className="grid grid-cols-2 gap-2">
            {USERS.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => quick(u.id, u.pw)}
                className="text-left rounded-md border border-slate-200 px-3 py-2 hover:bg-slate-50 transition-colors"
              >
                <span className="block text-sm font-medium text-slate-800">{ROLE_LABEL[u.role]}</span>
                <span className="block text-xs text-slate-400">{u.id} / {u.pw}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
