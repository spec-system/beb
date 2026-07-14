import {
  bootDeck,
  detailRow,
  el,
  fileBox,
  historyList,
  noticeBox,
  pageHeader,
  stampBadge,
  suTable,
  winButton,
  winWindow,
  type DeckStep,
  type HistLine,
  type Role,
} from './core';

type VolStatus = '접수' | '승인' | '반려' | '검토중';
type HL = 'submit' | 'upload-cert' | 'approve' | 'reject' | 're-register' | null;

interface VolVM {
  status: VolStatus;
  certFile: string | null;
  finalApprovalDate: string;
  rejectReason: string;
  history: HistLine[];
}

const REC = {
  title: '어르신 복약지도 봉사',
  org: '서울시 노인복지관',
  student: '학생',
  studentId: '20231234',
  grade: '3학년',
  semester: '2학기',
  professor: '담당교수',
  recognizedHours: 8,
  accumulated: 22,
};
const TARGET = 20;

const push = (h: HistLine[], step: string, actor: string, role: Role, at: string, reason?: string): HistLine[] => [
  ...h,
  { step, actor, role, at, reason },
];

const initial: VolVM = {
  status: '접수',
  certFile: null,
  finalApprovalDate: '',
  rejectReason: '',
  history: [{ step: '접수', actor: '학생', role: 'STUDENT', at: '2026-09-30T10:00:00' }],
};

const uploadCert = (s: VolVM): VolVM => ({
  ...s,
  certFile: '복약지도_인증서.pdf',
  history: push(s.history, '인증서 업로드', '학생', 'STUDENT', '2026-09-30T10:20:00'),
});
const staffApprove = (s: VolVM): VolVM => ({
  ...s,
  status: '승인',
  finalApprovalDate: '2026-10-02',
  rejectReason: '',
  history: push(s.history, '승인', '행정실', 'STAFF', '2026-10-02T11:00:00'),
});
const staffReject = (s: VolVM): VolVM => ({
  ...s,
  status: '반려',
  finalApprovalDate: '',
  rejectReason: '인증서 서명 누락 — 담당교수 서명 확인 필요',
  history: push(s.history, '반려', '행정실', 'STAFF', '2026-10-02T11:00:00', '인증서 서명 누락 — 담당교수 서명 확인 필요'),
});
const reregister = (s: VolVM): VolVM => ({
  ...s,
  status: '접수',
  finalApprovalDate: '',
  rejectReason: '',
  history: push(s.history, '재등록', '학생', 'STUDENT', '2026-10-03T09:00:00'),
});

const field = (label: string, node: Node): HTMLElement =>
  el('div', { className: 'flex flex-col gap-1.5' }, [
    el('label', { className: 'text-[11px] font-bold text-slate-950 uppercase tracking-wider', text: label }),
    node,
  ]);
const dispInput = (value: string): HTMLElement => el('input', { className: 'w-full', attrs: { value, disabled: 'true' } });

function createScreen(): HTMLElement {
  const body = el('div', { className: 'flex flex-col gap-4' }, [
    field('봉사활동명', dispInput(REC.title)),
    field('봉사 활동 기관', dispInput(REC.org)),
    el('div', { className: 'grid grid-cols-3 gap-3' }, [
      field('학기', dispInput(REC.semester)),
      field('담당교수', dispInput(REC.professor)),
      field('인정시간', dispInput(String(REC.recognizedHours))),
    ]),
    el('p', { className: 'text-xs text-slate-400', text: '봉사클럽 관련 발급 인증서는 등록 후 상세 화면에서 업로드합니다.' }),
  ]);
  const footer = el('div', { className: 'flex gap-2' }, [
    winButton('취소', { variant: 'secondary' }),
    winButton('등록', { variant: 'primary', highlight: true }),
  ]);
  return winWindow('전공연계봉사활동 등록', body, footer, 'max-w-2xl');
}

function listScreen(vm: VolVM, actor: Role): HTMLElement {
  const title = actor === 'STUDENT' ? '봉사 인증서 업로드' : '봉사 검토';
  const right = actor === 'STUDENT' ? winButton('+ 봉사 등록', { size: 'sm' }) : null;
  const table = suTable(
    ['봉사활동명', '학년', '학번', '이름', '연도', '학기', '인정시간', '진행상태', '학과 승인', '최종승인일', '누적 봉사시간', '인증서'],
    [
      [
        el('span', { className: 'text-slate-800 font-medium', text: REC.title }),
        REC.grade,
        REC.studentId,
        REC.student,
        '2026',
        REC.semester,
        `${REC.recognizedHours}h`,
        stampBadge(vm.status),
        vm.status === '승인' ? stampBadge('승인') : vm.status === '반려' ? stampBadge('반려') : '-',
        vm.finalApprovalDate || '-',
        el('span', { className: 'text-slate-800 font-semibold', text: `${REC.accumulated}h` }),
        vm.certFile ? winButton('열기', { variant: 'ghost', size: 'sm' }) : el('span', { className: 'text-xs text-slate-400', text: '-' }),
      ],
    ],
  );
  return el('div', {}, [pageHeader(title, '전공연계봉사활동', right), table, el('p', { className: 'text-sm text-slate-500 mt-3', text: '총 1건' })]);
}

function certSection(vm: VolVM, actor: Role, hl: HL): HTMLElement {
  const wrap = el('div', { className: 'mb-4' }, [
    el('p', { className: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2', text: '봉사 인증서' }),
  ]);
  const editable = vm.status === '접수' || vm.status === '검토중' || vm.status === '반려';
  if (actor === 'STUDENT' && editable && !vm.certFile) {
    const fb = fileBox('복약지도_인증서.pdf', false, '담당교수 서명이 있는 인증서 (스캔 PDF/이미지)');
    if (hl === 'upload-cert') fb.classList.add('deck-hl');
    wrap.appendChild(fb);
  } else if (vm.certFile) {
    wrap.appendChild(
      el('div', { className: 'border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 flex items-center justify-between gap-2' }, [
        el('span', { className: 'truncate', text: vm.certFile }),
        el('div', { className: 'flex gap-1 shrink-0' }, [
          winButton('열기', { variant: 'ghost', size: 'sm' }),
          winButton('다운로드', { variant: 'ghost', size: 'sm' }),
        ]),
      ]),
    );
  } else {
    wrap.appendChild(el('p', { className: 'text-xs text-slate-400', text: '아직 인증서가 업로드되지 않았습니다.' }));
  }
  return wrap;
}

function detailScreen(vm: VolVM, actor: Role, hl: HL): HTMLElement {
  const pct = ((REC.accumulated / TARGET) * 100).toFixed(0);
  const grid = el('div', { className: 'grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4' }, [
    detailRow('학생', `${REC.student} (${REC.studentId})`),
    detailRow('학기', `2026 ${REC.semester}`),
    detailRow('봉사활동기관', REC.org),
    detailRow('담당교수', REC.professor),
    detailRow('인정시간', `${REC.recognizedHours}시간`),
    detailRow('누적시간', `${REC.accumulated}시간 (${TARGET}시간 대비 ${pct}%)`),
    detailRow('진행상태', stampBadge(vm.status)),
  ]);

  const actions = el('div', { className: 'flex flex-wrap gap-2 border-t border-slate-200 pt-4' }, [
    winButton('신청서 다운로드', { variant: 'secondary', size: 'sm' }),
    winButton('결과보고서 HWP', { variant: 'secondary', size: 'sm' }),
  ]);

  let reasonArea: HTMLElement | null = null;
  if (actor === 'STAFF' && (vm.status === '접수' || vm.status === '검토중' || vm.status === '반려')) {
    reasonArea = el('div', { className: 'mb-3' }, [
      el('label', { className: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block', text: '비고 / 반려 사유' }),
      el('textarea', { className: 'w-full text-sm border border-slate-300 p-2', text: vm.rejectReason, attrs: { rows: '2', placeholder: '반려 사유 또는 관리자 코멘트를 입력하세요' } }),
    ]);
    actions.appendChild(winButton('승인', { variant: 'success', size: 'sm', highlight: hl === 'approve' }));
    actions.appendChild(winButton('반려', { variant: 'danger', size: 'sm', highlight: hl === 'reject' }));
  }
  if (actor === 'STUDENT' && vm.status === '반려') {
    actions.appendChild(winButton('재등록', { variant: 'primary', size: 'sm', highlight: hl === 're-register' }));
  }

  const body = el('div', {}, [
    grid,
    certSection(vm, actor, hl),
    vm.status === '반려' ? noticeBox('반려됨', `사유: ${vm.rejectReason || '미기재'} · 학생이 재등록해야 합니다.`, 'amber') : null,
    reasonArea,
    actions,
    el('div', { className: 'mt-5' }, [
      el('p', { className: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2', text: '진행 이력' }),
      historyList(vm.history),
    ]),
  ]);
  return winWindow(REC.title, body, null, 'max-w-2xl');
}

const steps: DeckStep<VolVM>[] = [
  {
    actor: 'STUDENT',
    menu: '신청·제출',
    caption: '학생이 봉사활동을 등록합니다',
    note: '학생이 봉사활동명·봉사활동기관·학기·담당교수·인정시간을 입력하고 [등록]을 누릅니다.',
    render: () => createScreen(),
  },
  {
    actor: 'STUDENT',
    menu: '신청·제출',
    caption: '상세에서 인증서를 업로드합니다',
    note: '상태 「접수」에서 학생은 담당교수 서명이 있는 인증서(PDF/이미지)를 업로드합니다.',
    render: (s) => detailScreen(s, 'STUDENT', 'upload-cert'),
  },
  {
    actor: 'STUDENT',
    menu: '신청·제출',
    caption: '인증서 업로드 완료',
    note: '인증서가 첨부되어 행정실 검토 화면에서 열기/다운로드할 수 있습니다.',
    mutate: uploadCert,
    render: (s) => detailScreen(s, 'STUDENT', null),
  },
  {
    actor: 'STAFF',
    menu: '봉사 검토',
    caption: '행정실 계정으로 전환',
    note: '행정실로 전환하면 전공 연계 봉사활동 건이 표 형식으로 보입니다.',
    render: (s) => listScreen(s, 'STAFF'),
  },
  {
    actor: 'STAFF',
    menu: '봉사 검토',
    caption: '검토 후 승인/반려',
    note: '업로드된 인증서를 열기/다운로드로 확인하고 승인 또는 반려합니다. 반려 시 사유를 기재합니다.',
    render: (s) => detailScreen(s, 'STAFF', 'approve'),
  },
  {
    actor: 'STAFF',
    menu: '봉사 검토',
    caption: '승인 완료',
    note: '상태가 「승인」(초록 도장)으로 전이되고 최종 승인일과 누적 봉사시간이 반영됩니다.',
    mutate: staffApprove,
    render: (s) => detailScreen(s, 'STAFF', null),
  },
  {
    actor: 'STAFF',
    menu: '봉사 검토',
    caption: '[반려 분기] 반려 및 사유 기재',
    note: '반려 시 상태는 「반려」가 되고 학생은 재등록해야 합니다. 반려 사유가 이력과 안내 박스에 남습니다.',
    mutate: staffReject,
    render: (s) => detailScreen(s, 'STAFF', 'reject'),
  },
  {
    actor: 'STUDENT',
    menu: '신청·제출',
    caption: '[반려 분기] 학생 재등록',
    note: '반려된 건은 학생이 [재등록]하면 다시 「접수」로 돌아갑니다.',
    mutate: reregister,
    render: (s) => detailScreen(s, 'STUDENT', 're-register'),
  },
];

export function mount(root: HTMLElement): () => void {
  return bootDeck<VolVM>(root, { program: '전공연계봉사활동', initial, steps });
}
