import '../index.css';
import { bootDeck, el, type DeckStep, type Role } from './core';

// spec md §1 Legacy Work Flow (기존 오프라인 프로세스) — 대면·수기 서명·구글폼 스캔.
interface LegacyVM {
  k: number;
}

interface Step {
  actor: Role;
  menu: string;
  text: string;
}

const APP_STEPS: Step[] = [
  { actor: 'STUDENT', menu: '신청·제출', text: '학생들이 비교과 프로그램 신청서를 작성' },
  { actor: 'PROFESSOR', menu: '학과내 목록', text: '담당 교수님을 찾아가 승인을 받고 서명을 받음' },
  { actor: 'HEAD', menu: '학과내 최종승인', text: '학과장님을 찾아가 승인을 받고 서명을 받음' },
  { actor: 'STUDENT', menu: '신청·제출', text: '서명 받은 원본 신청서를 학사 관리 구글폼에 스캔하여 제출' },
  { actor: 'STAFF', menu: '전체조회', text: '학사에서 기본 형식·서명 여부 등을 검토하여 신청 승인 처리' },
];

const REPORT_STEPS: Step[] = [
  { actor: 'STUDENT', menu: '신청·제출', text: '학생들이 비교과 결과 포스터를 전시' },
  { actor: 'HEAD', menu: '학과내 최종승인', text: '학과장님이 전시된 결과 포스터를 심사' },
  { actor: 'STUDENT', menu: '신청·제출', text: '학생들이 결과보고서를 작성' },
  { actor: 'PROFESSOR', menu: '학과내 목록', text: '담당 교수님을 찾아가 승인을 받고 서명을 받음' },
  { actor: 'HEAD', menu: '학과내 최종승인', text: '학과장님을 찾아가 승인을 받고 서명을 받음' },
  { actor: 'STUDENT', menu: '신청·제출', text: '서명 받은 원본을 학사 관리 구글폼에 스캔하여 제출' },
  { actor: 'STAFF', menu: '전체조회', text: '학사에서 기본 형식·서명 여부 등을 검토하여 승인 처리' },
];

function panel(title: string, steps: Step[], active: number): HTMLElement {
  const list = el(
    'ol',
    { className: 'space-y-2' },
    steps.map((st, i) => {
      const on = i === active;
      return el('li', { className: `flex items-start gap-3 border border-slate-400 bg-white p-3 ${on ? 'deck-hl' : ''}` }, [
        el('span', { className: 'font-black text-[#10489c]', text: `${i + 1}.` }),
        el('span', { className: 'text-sm font-bold text-slate-800', text: st.text }),
        on ? el('span', { className: 'ml-auto stamp-badge stamp-orange shrink-0', text: '진행' }) : null,
      ]);
    }),
  );
  return el('div', { className: 'border-2 border-slate-800 bg-[#f8f8f4] p-5' }, [
    el('h2', { className: 'text-sm font-black text-slate-900 mb-3', text: title }),
    list,
    el('p', { className: 'text-[11px] font-bold text-slate-500 mt-3', text: '※ 기존 오프라인(대면 방문·수기 서명·구글폼 스캔) 프로세스입니다. 본 시스템은 이 전 과정을 온라인으로 전자화합니다.' }),
  ]);
}

const steps: DeckStep<LegacyVM>[] = [
  ...APP_STEPS.map((st, i): DeckStep<LegacyVM> => ({
    actor: st.actor,
    menu: st.menu,
    caption: `1.1 신청서 승인 (오프라인) — ${i + 1}/${APP_STEPS.length}단계`,
    note: st.text,
    render: () => panel('1.1 비교과 프로그램 신청서 승인 과정 (기존 오프라인)', APP_STEPS, i),
  })),
  ...REPORT_STEPS.map((st, i): DeckStep<LegacyVM> => ({
    actor: st.actor,
    menu: st.menu,
    caption: `1.2 결과보고서 승인 (오프라인) — ${i + 1}/${REPORT_STEPS.length}단계`,
    note: st.text,
    render: () => panel('1.2 비교과 프로그램 결과보고서 승인 과정 (기존 오프라인)', REPORT_STEPS, i),
  })),
];

bootDeck<LegacyVM>({ program: 'Legacy 오프라인 프로세스', initial: { k: 0 }, steps });
