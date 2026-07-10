import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { USERS } from '../data/seed';
import { ROLE_LABEL } from '../types';
import { useSettings } from '../store/settingsStore';
import Button from '../components/ui/Button';
import { Input, Label } from '../components/ui/Field';
import { AlertCircle } from 'lucide-react';

export default function LoginView() {
  const { login } = useAuth();
  const { state: settings } = useSettings();
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
    <div className="min-h-screen flex items-center justify-center bg-[#e9ecef] px-4 font-mono select-none">
      <div className="w-full max-w-sm flex flex-col gap-4 border border-[#222222] bg-[#ffffff] p-6">
        <div className="text-center border-b border-[#222222] pb-3">
          <h1 className="text-sm font-black text-[#1a251e] tracking-tight">
            SPECs 비교과 통합행정 포탈
          </h1>
          <p className="text-[10px] text-slate-500 font-bold mt-1">
            [삼육대학교 약학대학]
          </p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 text-[12px] text-blue-950 leading-relaxed font-semibold">
          삼육대학교 약학대학 비교과 프로그램 이수현황을 조회하고 신청할 수 있습니다.
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-700">학번 또는 ID</label>
            <Input value={id} onChange={(e) => setId(e.target.value)} placeholder="학번 또는 ID" autoFocus />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-slate-700">비밀번호 / PASSWORD</label>
            <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="비밀번호" />
          </div>
          {error && (
            <div className="flex items-center gap-1 text-xs text-[#b23b3b] font-bold">
              <AlertCircle size={12} /> {error}
            </div>
          )}
          <Button type="submit" variant="success" className="w-full text-xs py-2 mt-1">
            학사 시스템 로그인
          </Button>
        </form>

        {/* 간소화된 계정 리스트 */}
        <div className="border-t border-[#cccccc] pt-3 text-xs flex flex-col gap-2">
          <div className="text-[10px] text-slate-500 font-bold">테스트 계정 빠른 로그인 (원클릭 자동 입력)</div>
          <div className="grid grid-cols-2 gap-1.5">
            {USERS.map((u) => {
              const academicRole =
                u.role === 'STUDENT' ? '학생' :
                u.role === 'PROFESSOR' ? '담당교수' :
                u.role === 'HEAD' ? '학과장' : '행정실';
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => quick(u.id, u.pw)}
                  className="text-left border border-[#cccccc] bg-[#f8f9fa] p-2 hover:bg-[#e9ecef] cursor-pointer"
                >
                  <span className="block text-[11px] font-black text-slate-800">{academicRole}</span>
                  <span className="block text-[10px] text-slate-500 font-mono">{u.id}</span>
                </button>
              );
            })}
          </div>
        {/* Workflow Lab 진입 버튼 */}
        <a
          href="/workflow-lab/"
          className="block text-center border border-[#222222] bg-[#1a251e] text-white p-2 hover:bg-[#2d3a2f] transition-colors text-[11px] font-black tracking-tight cursor-pointer"
        >
          📋 Workflow Lab (화면구성 시뮬레이터) 바로가기 →
        </a>
        </div>
      </div>
    </div>
  );
}
