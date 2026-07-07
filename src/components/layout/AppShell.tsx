import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { canAccessView, ViewKey } from '../../auth/roles';
import { ROLE_LABEL, Role } from '../../types';
import { LayoutDashboard, BookOpen, Languages, HeartHandshake, BarChart3, LogOut, Menu, RotateCcw, ClipboardCheck, MessageSquare, Settings, Bell } from 'lucide-react';
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

const roleNav = (role: Role): NavItem[] => {
  const item = (key: ViewKey, to: string, label: string, icon = ICONS[key]): NavItem => ({ key, to, label, icon });
  switch (role) {
    case 'STUDENT':
      return [
        item('integrated', '/integrated', '내 현황'),
        item('submit', '/submit', '신청·제출'),
      ];
    case 'PROFESSOR':
      return [
        item('integrated', '/integrated', '전체 목록'),
        item('dept', '/dept', '학과내 목록'),
        item('toeic', '/toeic', '토익 목록'),
        item('volunteer', '/volunteer', '봉사 목록'),
      ];
    case 'HEAD':
      return [
        item('integrated', '/integrated', '전체조회'),
        item('dept', '/dept', '학과내 최종승인'),
        item('toeic', '/toeic', '토익 최종승인'),
        item('volunteer', '/volunteer', '봉사 최종승인'),
        item('stats', '/stats', '통계'),
        item('settings', '/settings', '설정'),
      ];
    case 'STAFF':
      return [
        item('integrated', '/integrated', '전체조회'),
        item('dept', '/dept', '학과내 코멘트', MessageSquare),
        item('toeic', '/toeic', '토익 코멘트', MessageSquare),
        item('volunteer', '/volunteer', '봉사 코멘트', MessageSquare),
        item('settings', '/settings', '설정'),
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
        </div>
      </header>

      {/* 2. SU-WINGs 두번째 파란색 탭 메뉴바 */}
      <header className="su-header-blue h-9 flex items-center justify-between px-4 shrink-0 text-[11px]">
        {/* 서비스 탭 버튼 */}
        <div className="flex items-end h-full">
          <div className="su-header-tab-active px-4 py-1.5 cursor-pointer text-xs">서비스</div>
        </div>
        
        {/* 사용자 정보 및 제어 단추 */}
        <div className="flex items-center gap-2 text-white">
          <span className="font-bold">{user.name} ({user.studentId ?? user.id})</span>
          <NotificationBell />
          <button onClick={doLogout} className="su-btn-gray font-bold">로그아웃</button>
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
          </nav>
        </aside>

        {/* 4. 우측 콘텐츠 패널 (상단 다중 탭 + 실제 뷰 화면) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#f4f4f4]">
          {/* 상단 다중 탭바 */}
          <div className="su-tab-bar shrink-0">
            <div className="su-tab su-tab-active select-none">
              {activeLabel} <span className="su-tab-close">✕</span>
            </div>
          </div>
          
          {/* 90년대 식 적-청 점멸 긴급 배너 */}
          <div className="bg-yellow-100 border-b border-[#adadad] px-3 py-1.5 shrink-0 select-none flex items-center gap-2">
            <span className="flash-warning shrink-0 text-xs font-bold">◆ 긴급 지침 ◆</span>
            <marquee className="w-full text-[#b23b3b] font-bold text-xs" scrollamount="2.5">
              [제출 마감] 2026학년도 비교과 결과보고서 최종 제출 마감 기한 엄수 바랍니다!!! 학과 사무실 공지사항 참조 요망!!! 전산 정보 점검 실시 예정!!!
            </marquee>
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
function NotificationBell() {
  const { user } = useAuth();
  const { state, dispatch } = useRecords();
  const [open, setOpen] = useState(false);
  if (!user) return null;

  // 학생은 본인 수신분만, 그 외(교수/학과장/행정실)는 전체 발송 이력 열람
  const mine =
    user.role === 'STUDENT'
      ? state.notifications.filter((n) => n.to === user.studentId)
      : state.notifications;
  const unread = mine.filter((n) => !n.read).length;

  const toggle = () => {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen && unread > 0) dispatch({ type: 'MARK_NOTIFICATIONS_READ' });
  };

  return (
    <div className="relative">
      <button
        onClick={toggle}
        className="su-btn-gray font-bold relative flex items-center gap-1"
        data-testid="notif-bell"
        aria-label="이메일 알림"
      >
        <Bell size={13} />
        알림
        {unread > 0 && (
          <span
            className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center"
            data-testid="notif-count"
          >
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div
          className="absolute right-0 top-8 z-50 w-80 max-h-96 overflow-auto border border-slate-500 bg-white text-slate-900 shadow-lg text-[12px]"
          data-testid="notif-panel"
        >
          <div className="px-3 py-2 border-b border-slate-300 font-bold bg-[#e1e6f2] flex items-center justify-between">
            <span>이메일 알림 ({mine.length})</span>
            <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-800">✕</button>
          </div>
          {mine.length === 0 ? (
            <div className="px-3 py-6 text-center text-slate-400">수신한 알림이 없습니다.</div>
          ) : (
            mine.map((n) => (
              <div key={n.id} className="px-3 py-2 border-b border-slate-100">
                <div className="font-bold text-slate-800">{n.subject}</div>
                <div className="text-slate-600 mt-0.5">{n.body}</div>
                <div className="text-[10px] text-slate-400 mt-1">
                  받는사람: {n.toName}({n.to}) · {n.createdAt.replace('T', ' ')}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
