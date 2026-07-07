import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { canAccessView, ViewKey } from '../../auth/roles';
import { ROLE_LABEL, Role } from '../../types';
import { LayoutDashboard, BookOpen, Languages, HeartHandshake, BarChart3, LogOut, Menu, RotateCcw, ClipboardCheck, MessageSquare, Settings } from 'lucide-react';
import { useRecords } from '../../store/recordsStore';
import { useToast } from '../ui/Toast';
import { useSettings } from '../../store/settingsStore';

const ICONS = {
  integrated: LayoutDashboard,
  submit: ClipboardCheck,
  dept: BookOpen,
  toeic: Languages,
  volunteer: HeartHandshake,
  stats: BarChart3,
  settings: Settings,
} satisfies Record<ViewKey, React.ComponentType<{ size?: number }>>;

type NavItem = { key: ViewKey; to: string; label: string; icon: React.ComponentType<{ size?: number }> };

const MIL_ROLE_LABEL: Record<Role, string> = {
  STUDENT: '학사생도',
  PROFESSOR: '지도관(대위)',
  HEAD: '대대장(중령)',
  STAFF: '행정 준위',
};
const roleNav = (role: Role): NavItem[] => {
  const item = (key: ViewKey, to: string, label: string, icon = ICONS[key]): NavItem => ({ key, to, label, icon });
  switch (role) {
    case 'STUDENT':
      return [
        item('integrated', '/integrated', '개인 자력대장 (통합 현황)'),
        item('submit', '/submit', '지상작전 보고 (신청·제출)'),
      ];
    case 'PROFESSOR':
      return [
        item('integrated', '/integrated', '인사사령부 자력조회 (전체)'),
        item('dept', '/dept', '지상작전 교육현황 (학과내)'),
        item('toeic', '/toeic', '어학 전투력 대장 (토익)'),
        item('volunteer', '/volunteer', '대민 지원 대장 (봉사)'),
      ];
    case 'HEAD':
      return [
        item('integrated', '/integrated', '인사사령부 자력조회 (전체)'),
        item('dept', '/dept', '지상작전 교육승인 (학과내)'),
        item('toeic', '/toeic', '어학 전투력 승인 (토익)'),
        item('volunteer', '/volunteer', '대민 지원 승인 (봉사)'),
        item('stats', '/stats', '분석평가단 (통계 지표)'),
        item('settings', '/settings', '정보체계관리단 (설정)'),
      ];
    case 'STAFF':
      return [
        item('integrated', '/integrated', '인사사령부 자력조회 (전체)'),
        item('dept', '/dept', '지상작전 실무검토 (학과내)', MessageSquare),
        item('toeic', '/toeic', '어학 전투력 실무검토 (토익)', MessageSquare),
        item('volunteer', '/volunteer', '대민 지원 실무검토 (봉사)', MessageSquare),
        item('settings', '/settings', '정보체계관리단 (설정)'),
      ];
    default:
      return [];
  }
};

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { dispatch } = useRecords();
  const { toast } = useToast();
  const { state: settings } = useSettings();
  const [open, setOpen] = useState(false);

  if (!user) return null;
  const items = roleNav(user.role).filter((n) => canAccessView(user.role, n.key));

  const doLogout = () => {
    logout();
    navigate('/login');
  };
  const resetData = () => {
    if (confirm('목업 데이터를 초기 시드 상태로 되돌립니다. 계속할까요?')) {
      dispatch({ type: 'RESET' });
      toast('데이터를 초기화했습니다.', 'info');
    }
  };

  const location = useLocation();
  const activeItem = items.find((item) => item.to === location.pathname);
  const activeLabel = activeItem ? activeItem.label : '공지사항';

  return (
    <div className="flex flex-col h-screen bg-white font-sans text-slate-800 overflow-hidden select-none">
      {/* 1. SU-WINGs 최상단 흰색 헤더 영역 */}
      <header className="h-10 border-b border-[#adadad] bg-white flex items-center justify-between px-4 shrink-0 text-[11px] font-mono">
        <div className="flex items-center gap-6">
          {/* 로고 */}
          <span className="text-[#10489c] font-black italic text-base tracking-tighter cursor-pointer">SU-WINGs</span>
          {/* 시간 연장 타이머 */}
          <div className="flex items-center gap-2">
            <button className="su-btn-gray">시간연장</button>
            <span className="text-[#666666]">
              현재 남은 시간은 <span className="text-[#ff0000] font-bold">29분 58초</span> 입니다.
            </span>
          </div>
          {/* 접속 정보 */}
          <span className="text-[#999999] hidden lg:inline">
            이전 접속시각 : 2026-07-07 10:30:34, IP : 61.97.55.27
          </span>
        </div>
        {/* 우측 바로가기 링크 */}
        <div className="text-[#666666] hidden md:block">
          홈페이지 | 도서관 | 그룹웨어 | e-Class | CTL | 원격지원 | SU 수강신청
        </div>
      </header>

      {/* 2. SU-WINGs 두번째 파란색 탭 메뉴바 */}
      <header className="su-header-blue h-9 flex items-center justify-between px-4 shrink-0 text-[11px]">
        {/* 서비스 탭 버튼 */}
        <div className="flex items-end h-full">
          <div className="su-header-tab-active px-4 py-1.5 cursor-pointer text-xs">서비스</div>
        </div>
        
        {/* 부대원 정보 및 제어 단추 */}
        <div className="flex items-center gap-2 text-white">
          <span className="font-bold">{user.name} ({user.studentId ?? user.id})</span>
          <button onClick={doLogout} className="su-btn-gray font-bold">로그아웃</button>
          <button className="su-btn-gray font-bold">비밀번호변경</button>
          
          <span className="mx-2 text-slate-400">|</span>
          
          <button className="su-btn-blue px-2 py-0.5">새로고침</button>
          <button className="su-btn-blue px-2 py-0.5">✕ 탭모두닫기</button>
        </div>
      </header>

      {/* 3. 메인 분할 구조 (사이드바 트리 + 메인 콘텐츠) */}
      <div className="flex flex-1 overflow-hidden">
        {/* 좌측 폴더 트리 네비게이션 */}
        <aside className="w-56 border-r border-[#adadad] flex flex-col shrink-0 bg-[#ffffff]">
          {/* 사이드바 탭 헤더 */}
          <div className="flex bg-[#e1e6f2] border-b border-[#adadad] text-[10px] font-black shrink-0 h-7 items-center select-none">
            <div className="bg-[#1b3c73] text-white px-3 py-2 cursor-pointer">서비스</div>
            <div className="text-[#333] px-3 py-2 cursor-pointer hover:bg-[#d1d7e5]">학생</div>
            <div className="ml-auto pr-2 text-slate-500 font-bold cursor-pointer hover:text-slate-800 text-[12px] font-sans">+</div>
          </div>

          {/* 트리 메뉴 */}
          <nav className="flex-1 py-2 px-1 overflow-y-auto space-y-1 select-none bg-white font-mono text-[11px] su-tree-menu">
            <div className="space-y-0.5">
              <div className="su-tree-item font-black text-slate-800 flex items-center gap-1">
                <span>▼</span>
                <span>📁</span>
                <span>[학부] 비교과정보</span>
              </div>
              <div className="pl-3 space-y-0.5">
                {items.map((item) => (
                  <NavLink
                    key={item.key}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `su-tree-item flex items-center gap-1 ${isActive ? 'su-tree-item-active' : ''}`
                    }
                  >
                    <span>📄</span>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
            
            {/* 고증을 위한 더미 탐색기 트리 구조 */}
            <div className="su-tree-item text-slate-400 font-black flex items-center gap-1">
              <span>▶</span>
              <span>📁</span>
              <span>[학부] 학적정보</span>
            </div>
            <div className="su-tree-item text-slate-400 font-black flex items-center gap-1">
              <span>▶</span>
              <span>📁</span>
              <span>[학부] 수업정보</span>
            </div>
            <div className="su-tree-item text-slate-400 font-black flex items-center gap-1">
              <span>▶</span>
              <span>📁</span>
              <span>[학부] 성적정보</span>
            </div>
            <div className="su-tree-item text-slate-400 font-black flex items-center gap-1">
              <span>▶</span>
              <span>📁</span>
              <span>[학부] 장학정보</span>
            </div>
            <div className="su-tree-item text-slate-400 font-black flex items-center gap-1">
              <span>▶</span>
              <span>📁</span>
              <span>[학부] 등록정보</span>
            </div>
            <div className="su-tree-item text-slate-400 font-black flex items-center gap-1">
              <span>▶</span>
              <span>📁</span>
              <span>[학부] 예비군정보</span>
            </div>
          </nav>
          
          {/* 육군 교육통제지침 (고증 융합) */}
          <div className="p-2 bg-[#f1f3f5] border-t border-[#adadad] font-mono text-[9px] text-[#555555] leading-normal text-left">
            <strong>[육군교육지침-국군조직법]</strong><br />
            지상작전을 주 임무로 하고, 이를 위하여 편성되고 장비를 갖추며 필요한 교육훈련을 한다.
          </div>
        </aside>

        {/* 4. 우측 콘텐츠 패널 (상단 다중 탭 + 실제 뷰 화면) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#f4f4f4]">
          {/* 상단 다중 탭바 */}
          <div className="su-tab-bar shrink-0">
            <div className="su-tab select-none">공지사항 <span className="su-tab-close">✕</span></div>
            <div className="su-tab su-tab-active select-none">
              {activeLabel} <span className="su-tab-close">✕</span>
            </div>
          </div>
          
          {/* 실질적 화면 콘텐츠가 담기는 바닥 */}
          <main className="flex-1 overflow-auto p-3 bg-white border-t border-[#adadad]">
            <div className="mx-auto max-w-[1280px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
