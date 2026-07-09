// Workflow Lab — 실제 SU-WINGs 화면 스킨 위에서 각 업무 흐름을 PPT처럼 한 단계씩
// 진행시키는 프레젠테이션 엔진. 실제 앱과 동일한 index.css(win7/su/stamp 스킨)를
// 그대로 재사용해 디자인·상태 전이를 현행 제품과 동일하게 재현한다.
import '../index.css';
import './workflow-lab.css';

export type Role = 'STUDENT' | 'PROFESSOR' | 'HEAD' | 'STAFF';

export const ROLE_LABEL: Record<Role, string> = {
  STUDENT: '학생',
  PROFESSOR: '담당교수',
  HEAD: '학과장',
  STAFF: '행정실',
};

// 실제 seed.ts USERS 기준 계정 매핑
export const ROLE_USER: Record<Role, { name: string; account: string }> = {
  STUDENT: { name: '학생', account: '20231234' },
  PROFESSOR: { name: '담당교수', account: 'professor' },
  HEAD: { name: '학과장', account: 'head' },
  STAFF: { name: '행정실', account: 'staff' },
};

// 실제 AppShell roleNav 를 축약해 재현한 좌측 트리 메뉴
const ROLE_NAV: Record<Role, string[]> = {
  STUDENT: ['내 현황', '신청·제출', '양식 작성 (HWP)', '익명 게시판', '갈러그 게임'],
  PROFESSOR: ['전체 목록', '학과내 목록', '토익 목록', '봉사 목록'],
  HEAD: ['전체조회', '학과내 최종승인', '토익 최종승인', '봉사 최종승인', '통계', '설정'],
  STAFF: ['전체조회', '학과내 코멘트', '토익 코멘트', '봉사 코멘트', '설정'],
};

/* =========================================================
   DOM 헬퍼
   ========================================================= */
type Child = Node | string | null | undefined | false;

interface ElOpts {
  className?: string;
  text?: string;
  html?: string;
  attrs?: Record<string, string>;
  onClick?: (e: MouseEvent) => void;
}

export function el(tag: string, opts: ElOpts = {}, children: Child[] = []): HTMLElement {
  const node = document.createElement(tag);
  if (opts.className) node.className = opts.className;
  if (opts.text !== undefined) node.textContent = opts.text;
  if (opts.html !== undefined) node.innerHTML = opts.html;
  if (opts.attrs) for (const [k, v] of Object.entries(opts.attrs)) node.setAttribute(k, v);
  if (opts.onClick) node.addEventListener('click', opts.onClick);
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

function clone<T>(v: T): T {
  return typeof structuredClone === 'function' ? structuredClone(v) : (JSON.parse(JSON.stringify(v)) as T);
}
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/* =========================================================
   실제 컴포넌트 룩앤필 재현 (Badge / Button / Table / Modal / History)
   ========================================================= */
const STAMP: Record<string, string> = {
  '신청 완료': 'stamp-blue',
  '담당교수 승인': 'stamp-blue',
  '신청 승인됨': 'stamp-orange',
  '포스터 심사 중': 'stamp-orange',
  '결과 보고서 검토 중': 'stamp-orange',
  '최종 검토중': 'stamp-orange',
  '(담당교수에게) 반려됨': 'stamp-red',
  '(학과장에게) 반려됨': 'stamp-red',
  '최종 승인': 'stamp-green',
  '반려': 'stamp-red',
  '접수': 'stamp-blue',
  '검토중': 'stamp-orange',
  '1차 승인': 'stamp-orange',
  '승인': 'stamp-green',
};

export function stampBadge(status: string): HTMLElement {
  return el('span', { className: `stamp-badge ${STAMP[status] ?? 'stamp-blue'}`, text: status });
}

export type BtnVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
const BTN_VARIANT: Record<BtnVariant, string> = {
  primary: 'win7-btn win7-btn-primary',
  secondary: 'win7-btn win7-btn-secondary',
  danger: 'win7-btn win7-btn-danger',
  success: 'win7-btn win7-btn-success',
  ghost: 'bg-transparent text-slate-700 border border-transparent font-bold',
};

export function winButton(
  label: string,
  opts: { variant?: BtnVariant; size?: 'sm' | 'md'; disabled?: boolean; highlight?: boolean } = {},
): HTMLButtonElement {
  const size = opts.size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  const b = el('button', {
    className: `inline-flex items-center justify-center gap-1.5 ${BTN_VARIANT[opts.variant ?? 'primary']} ${size} ${
      opts.disabled ? 'opacity-40 cursor-not-allowed' : ''
    } ${opts.highlight ? 'deck-hl' : ''}`,
    text: label,
    attrs: { type: 'button' },
  }) as HTMLButtonElement;
  if (opts.disabled) b.disabled = true;
  return b;
}

export function pageHeader(title: string, sub?: string, right?: Node | null): HTMLElement {
  const h1 = el('h1', { className: 'text-2xl font-semibold text-slate-900 tracking-tight' }, [
    title,
    sub ? el('span', { className: 'text-slate-400 text-lg font-normal', text: ` / ${sub}` }) : null,
  ]);
  return el('div', { className: 'flex flex-wrap justify-between items-end gap-3 mb-6' }, [h1, right ?? null]);
}

export function suTable(headers: Child[], rows: Child[][]): HTMLElement {
  const htr = el('tr', {}, headers.map((h) => el('th', { className: 'py-3 px-4 whitespace-nowrap' }, [h])));
  const body = el(
    'tbody',
    {},
    rows.map((cells) =>
      el(
        'tr',
        { className: 'border-b border-slate-100' },
        cells.map((c) => el('td', { className: 'py-3 px-4' }, [c])),
      ),
    ),
  );
  const table = el('table', { className: 'su-grid-table w-full border-collapse' }, [el('thead', {}, [htr]), body]);
  return el('div', { className: 'overflow-auto border border-[#999999] bg-white' }, [table]);
}

export function winWindow(title: string, body: Node, footer?: Node | null, width = 'max-w-3xl'): HTMLElement {
  return el('div', { className: `win7-window w-full ${width} mx-auto` }, [
    el('div', { className: 'win7-titlebar flex items-center justify-between px-3 py-1.5 select-none' }, [
      el('span', { className: 'text-xs font-bold tracking-tight', text: title }),
      el('span', { className: 'win7-close-btn flex items-center justify-center', text: '✕' }),
    ]),
    el('div', { className: 'bg-[#f0f3f5] p-5 border-b border-slate-300' }, [body]),
    footer
      ? el('div', { className: 'flex justify-end gap-2 bg-[#e5ebf0] px-4 py-2 border-t border-white' }, [footer])
      : null,
  ]);
}

export function detailRow(k: string, v: Child): HTMLElement {
  return el('div', { className: 'flex gap-2' }, [
    el('span', { className: 'text-[11px] font-bold text-slate-400 uppercase tracking-wider w-24 shrink-0 pt-0.5', text: k }),
    el('span', { className: 'text-sm text-slate-700' }, [v]),
  ]);
}

export interface HistLine {
  step: string;
  actor: string;
  role: Role;
  at: string;
  reason?: string;
}

export function historyList(history: HistLine[]): HTMLElement {
  if (!history.length) return el('p', { className: 'text-xs text-slate-400', text: '이력이 없습니다.' });
  return el(
    'ol',
    { className: 'relative border-l border-slate-200 ml-2 space-y-3' },
    history.map((e) =>
      el('li', { className: 'ml-4' }, [
        el('span', { className: 'absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-blue-500' }),
        el('div', { className: 'flex flex-wrap items-baseline gap-x-2' }, [
          el('span', { className: 'text-sm font-medium text-slate-800', text: e.step }),
          el('span', { className: 'text-xs text-slate-500', text: `${e.actor} (${ROLE_LABEL[e.role]})` }),
          el('span', { className: 'text-[11px] text-slate-400', text: e.at.replace('T', ' ') }),
        ]),
        e.reason ? el('p', { className: 'text-xs text-red-600 mt-0.5', text: `사유: ${e.reason}` }) : null,
      ]),
    ),
  );
}

export function noticeBox(strong: string, body: string, tone: 'amber' | 'slate' = 'slate'): HTMLElement {
  const cls =
    tone === 'amber'
      ? 'rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-slate-700'
      : 'rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700';
  return el('div', { className: `${cls} space-y-1` }, [
    el('strong', { className: 'block text-slate-800', text: strong }),
    el('p', { className: 'text-xs text-slate-500', text: body }),
  ]);
}

export function fileBox(fileName: string, done: boolean, hint?: string): HTMLElement {
  return el(
    'div',
    { className: 'w-full flex flex-col items-center gap-1 border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-slate-500' },
    [
      el('span', { className: 'text-sm font-medium text-slate-700', text: done ? `✓ ${fileName}` : '클릭하여 파일 선택' }),
      hint ? el('span', { className: 'text-xs text-slate-400', text: hint }) : null,
    ],
  );
}

export function checkboxRow(label: string, checked: boolean, disabled: boolean, highlight = false): HTMLElement {
  const box = el('span', {
    className: `inline-flex h-4 w-4 items-center justify-center border border-slate-600 text-[10px] font-black ${
      checked ? 'bg-[#1b3c67] text-white' : 'bg-white text-transparent'
    }`,
    text: checked ? '✓' : ' ',
  });
  return el(
    'label',
    {
      className: `flex w-full items-center gap-2 border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-slate-700 ${
        disabled ? 'opacity-50' : ''
      } ${highlight ? 'deck-hl' : ''}`,
    },
    [box, label],
  );
}

/* =========================================================
   SU-WINGs 크롬 (상단 흰바 / 파란바 / 좌측 트리 / 탭바 / 긴급배너)
   ========================================================= */
function topWhiteBar(): HTMLElement {
  return el('header', { className: 'h-10 border-b border-[#adadad] bg-white flex items-center px-4 shrink-0 text-[11px]' }, [
    el('span', { className: 'text-[#10489c] font-black italic text-base tracking-tighter', text: 'SU-WINGs' }),
  ]);
}

function blueBar(actor: Role): HTMLElement {
  const u = ROLE_USER[actor];
  return el('header', { className: 'su-header-blue h-9 flex items-center justify-between px-4 shrink-0 text-[11px]' }, [
    el('div', { className: 'flex items-end h-full' }, [
      el('div', { className: 'su-header-tab-active px-4 py-1.5 text-xs', text: '서비스' }),
    ]),
    el('div', { className: 'flex items-center gap-2 text-white' }, [
      el('span', { className: 'font-bold', text: `${u.name} (${u.account}) · ${ROLE_LABEL[actor]}` }),
      el('span', { className: 'su-btn-gray font-bold', text: '알림' }),
      el('span', { className: 'su-btn-gray font-bold', text: '로그아웃' }),
    ]),
  ]);
}

function sidebar(actor: Role, activeMenu: string): HTMLElement {
  const items = ROLE_NAV[actor].map((label) =>
    el('div', { className: `su-tree-item flex items-center gap-1 ${label === activeMenu ? 'su-tree-item-active' : ''}` }, [
      el('span', { text: '📄' }),
      label,
    ]),
  );
  return el('aside', { className: 'w-56 border-r border-[#adadad] flex flex-col shrink-0 bg-white' }, [
    el('div', { className: 'flex bg-[#e1e6f2] border-b border-[#adadad] text-[10px] font-black shrink-0 h-7 items-center' }, [
      el('div', { className: 'bg-[#1b3c73] text-white px-3 py-2', text: '서비스' }),
      el('div', { className: 'text-[#333] px-3 py-2', text: ROLE_LABEL[actor] }),
    ]),
    el('nav', { className: 'flex-1 py-2 px-1 overflow-y-auto space-y-1 bg-white font-mono text-[11px] su-tree-menu' }, items),
  ]);
}

function tabBar(activeMenu: string): HTMLElement {
  return el('div', { className: 'su-tab-bar shrink-0' }, [
    el('div', { className: 'su-tab su-tab-active select-none' }, [
      activeMenu,
      el('span', { className: 'su-tab-close', text: ' ✕' }),
    ]),
  ]);
}

function urgentMarquee(): HTMLElement {
  const m = document.createElement('marquee');
  m.setAttribute('scrollamount', '2.5');
  m.className = 'w-full text-[#b23b3b] font-bold text-xs';
  m.textContent =
    '[제출 마감] 2026학년도 비교과 결과보고서 최종 제출 마감 기한 엄수 바랍니다!!! 학과 사무실 공지사항 참조 요망!!! 전산 정보 점검 실시 예정!!!';
  return el('div', { className: 'bg-yellow-100 border-b border-[#adadad] px-3 py-1.5 shrink-0 flex items-center gap-2' }, [
    el('span', { className: 'flash-warning shrink-0 text-xs font-bold', text: '◆ 긴급 지침 ◆' }),
    m,
  ]);
}

/* =========================================================
   PPT 덱 엔진
   ========================================================= */
export interface DeckStep<S> {
  actor: Role;
  menu: string;
  caption: string;
  note: string;
  mutate?: (prev: S) => S;
  render: (state: S) => Node;
}

export interface DeckConfig<S> {
  program: string;
  initial: S;
  steps: DeckStep<S>[];
}

interface NavApi {
  index: number;
  total: number;
  auto: boolean;
  go: (i: number) => void;
  next: () => void;
  prev: () => void;
  toggleAuto: () => void;
}

function presenterPanel<S>(config: DeckConfig<S>, step: DeckStep<S>, nav: NavApi): HTMLElement {
  const u = ROLE_USER[step.actor];
  return el('div', { className: 'deck-note shrink-0' }, [
    el('div', { className: 'deck-note-head' }, [
      el('span', { className: 'deck-actor-chip', text: `${ROLE_LABEL[step.actor]} · ${u.name}` }),
      el('span', { className: 'deck-step-count', text: `STEP ${nav.index + 1} / ${nav.total}` }),
      el('span', { className: 'deck-prog-title', text: config.program }),
    ]),
    el('div', { className: 'deck-note-caption', text: step.caption }),
    el('div', { className: 'deck-note-body', text: step.note }),
  ]);
}

function controlBar<S>(config: DeckConfig<S>, nav: NavApi): HTMLElement {
  const dots = el(
    'div',
    { className: 'deck-dots' },
    config.steps.map((_, i) =>
      el('button', {
        className: `deck-dot ${i === nav.index ? 'active' : ''} ${i < nav.index ? 'done' : ''}`,
        attrs: { type: 'button', title: `${i + 1}` },
        onClick: () => nav.go(i),
      }),
    ),
  );
  const prev = el('button', {
    className: 'win7-btn win7-btn-secondary px-4 py-1.5 text-sm',
    text: '◀ 이전',
    attrs: { type: 'button' },
    onClick: () => nav.prev(),
  }) as HTMLButtonElement;
  if (nav.index === 0) prev.disabled = true;
  const next = el('button', {
    className: 'win7-btn win7-btn-primary px-4 py-1.5 text-sm',
    text: nav.index === nav.total - 1 ? '처음으로 ⟲' : '다음 ▶',
    attrs: { type: 'button' },
    onClick: () => (nav.index === nav.total - 1 ? nav.go(0) : nav.next()),
  });
  const auto = el('button', {
    className: `win7-btn ${nav.auto ? 'win7-btn-danger' : 'win7-btn-success'} px-4 py-1.5 text-sm`,
    text: nav.auto ? '⏸ 자동재생 정지' : '▶ 자동재생',
    attrs: { type: 'button' },
    onClick: () => nav.toggleAuto(),
  });
  const home = el('a', { className: 'win7-btn win7-btn-secondary px-4 py-1.5 text-sm no-underline', attrs: { href: './index.html' }, text: '⌂ 랩 홈' });

  return el('div', { className: 'deck-controls shrink-0' }, [
    el('div', { className: 'flex items-center gap-2' }, [prev, next, auto]),
    dots,
    home,
  ]);
}

function buildChrome<S>(config: DeckConfig<S>, step: DeckStep<S>, state: S, nav: NavApi): HTMLElement {
  const content = el('main', { className: 'flex-1 overflow-auto p-3 bg-white border-t border-[#adadad]' }, [
    el('div', { className: 'mx-auto max-w-[1280px]' }, [step.render(state)]),
  ]);

  const contentColumn = el('div', { className: 'flex-1 flex flex-col overflow-hidden bg-[#f4f4f4]' }, [
    tabBar(step.menu),
    urgentMarquee(),
    presenterPanel(config, step, nav),
    content,
  ]);

  return el('div', { className: 'deck-shell flex flex-col h-screen bg-white font-sans text-slate-800 overflow-hidden' }, [
    topWhiteBar(),
    blueBar(step.actor),
    el('div', { className: 'flex flex-1 overflow-hidden' }, [sidebar(step.actor, step.menu), contentColumn]),
    controlBar(config, nav),
  ]);
}

export function bootDeck<S>(config: DeckConfig<S>): void {
  const states: S[] = [];
  let cur = clone(config.initial);
  config.steps.forEach((step, i) => {
    cur = step.mutate ? step.mutate(clone(cur)) : cur;
    states[i] = clone(cur);
  });

  let index = 0;
  let timer: number | null = null;
  const root = document.getElementById('deck-root') ?? document.body;

  const stopAuto = () => {
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  };
  const toggleAuto = () => {
    if (timer !== null) {
      stopAuto();
      render();
      return;
    }
    timer = window.setInterval(() => {
      if (index >= config.steps.length - 1) {
        stopAuto();
        render();
        return;
      }
      index += 1;
      render();
    }, 3200);
    render();
  };

  function render() {
    const nav: NavApi = {
      index,
      total: config.steps.length,
      auto: timer !== null,
      go: (i) => {
        index = clamp(i, 0, config.steps.length - 1);
        stopAuto();
        render();
      },
      next: () => {
        if (index < config.steps.length - 1) {
          index += 1;
          render();
        }
      },
      prev: () => {
        if (index > 0) {
          index -= 1;
          render();
        }
      },
      toggleAuto,
    };
    root.replaceChildren(buildChrome(config, config.steps[index], states[index], nav));
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
      e.preventDefault();
      stopAuto();
      if (index < config.steps.length - 1) index += 1;
      render();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      stopAuto();
      if (index > 0) index -= 1;
      render();
    }
  });

  render();
}
