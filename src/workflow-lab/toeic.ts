import '../index.css';
import {
  bootDeck,
  detailRow,
  el,
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

type ToeicStatus = '접수' | '승인' | '반려' | '검토중';
type HL = 'submit' | 'approve' | 'reject' | 're-register' | null;

const MIN_SCORE = 700;

interface ToeicVM {
  status: ToeicStatus;
  finalApprovalDate: string;
  rejectReason: string;
  history: HistLine[];
}

const REC = {
  student: '학생',
  studentId: '20231234',
  grade: '3학년',
  birth: '2002-03-11',
  testDate: '2026-09-14',
  testNumber: '482913',
  score: 880,
  issue: '20260914-0021',
  validUntil: '2028-09-14',
  professor: '담당교수',
};

const issuePrefix = REC.issue.slice(0, 6);

const push = (h: HistLine[], step: string, actor: string, role: Role, at: string, reason?: string): HistLine[] => [
  ...h,
  { step, actor, role, at, reason },
];

const initial: ToeicVM = {
  status: '접수',
  finalApprovalDate: '',
  rejectReason: '',
  history: [{ step: '접수', actor: '학생', role: 'STUDENT', at: '2026-09-20T10:00:00' }],
};

const staffApprove = (s: ToeicVM): ToeicVM => ({
  ...s,
  status: '승인',
  finalApprovalDate: '2026-09-22',
  rejectReason: '',
  history: push(s.history, '승인', '행정실', 'STAFF', '2026-09-22T14:00:00'),
});
const staffReject = (s: ToeicVM): ToeicVM => ({
  ...s,
  status: '반려',
  finalApprovalDate: '',
  rejectReason: '발급번호 불일치 — YBM 조회 결과 없음',
  history: push(s.history, '반려', '행정실', 'STAFF', '2026-09-22T14:00:00', '발급번호 불일치 — YBM 조회 결과 없음'),
});
const reregister = (s: ToeicVM): ToeicVM => ({
  ...s,
  status: '접수',
  finalApprovalDate: '',
  rejectReason: '',
  history: push(s.history, '재등록', '학생', 'STUDENT', '2026-09-23T09:00:00'),
});

const field = (label: string, node: Node): HTMLElement =>
  el('div', { className: 'flex flex-col gap-1.5' }, [
    el('label', { className: 'text-[11px] font-bold text-slate-950 uppercase tracking-wider', text: label }),
    node,
  ]);
const dispInput = (value: string): HTMLElement => el('input', { className: 'w-full', attrs: { value, disabled: 'true' } });

function createScreen(): HTMLElement {
  const body = el('div', {}, [
    el('div', { className: 'grid grid-cols-2 gap-4' }, [
      field('생년월일', dispInput(REC.birth)),
      field('응시일자', dispInput(REC.testDate)),
      field('담당교수', dispInput(REC.professor)),
      field('토익 수험번호', dispInput(REC.testNumber)),
      field('TOTAL 점수', dispInput(String(REC.score))),
      field('발급번호 앞 6자리', dispInput(issuePrefix)),
    ]),
    el('p', { className: 'text-xs text-slate-400 mt-3', text: '증빙 자료 업로드 없음 — 성적표 기재 내용을 text로 입력합니다.' }),
  ]);
  const footer = el('div', { className: 'flex gap-2' }, [
    winButton('취소', { variant: 'secondary' }),
    winButton('입력', { variant: 'primary', highlight: true }),
  ]);
  return winWindow('토익 성적 입력', body, footer, 'max-w-2xl');
}

function listScreen(vm: ToeicVM, actor: Role): HTMLElement {
  const title = actor === 'STUDENT' ? '토익 정보 입력' : '토익 검토';
  const right = actor === 'STUDENT' ? winButton('+ 성적 입력', { size: 'sm' }) : null;
  const info = el('div', { className: 'flex items-start gap-2 text-xs text-slate-600 bg-amber-50 border border-amber-200 px-4 py-3 mb-5 font-bold' }, [
    `성적표 유효기간(응시일 +2년)과 성적 기준(${MIN_SCORE}점 이상)을 확인합니다. 행정실에서 검토 후 승인/반려합니다.`,
  ]);
  const table = suTable(
    ['학년', '학번', '이름', '생년월일', '응시일자', '토익 수험번호', 'TOTAL', '발급번호 앞6', '진행상태', '학과 승인', '최종 승인일', '비고'],
    [
      [
        REC.grade,
        REC.studentId,
        el('span', { className: 'text-slate-800 font-medium', text: REC.student }),
        REC.birth,
        REC.testDate,
        REC.testNumber,
        el('span', { className: 'font-semibold', text: String(REC.score) }),
        issuePrefix,
        stampBadge(vm.status),
        vm.status === '승인' ? stampBadge('승인') : vm.status === '반려' ? stampBadge('반려') : '-',
        vm.finalApprovalDate || '-',
        vm.rejectReason || '-',
      ],
    ],
  );
  return el('div', {}, [pageHeader(title, 'TOEIC', right), info, table, el('p', { className: 'text-sm text-slate-500 mt-3', text: '총 1건' })]);
}

interface DetailOpts {
  name: string;
  studentId: string;
  grade: string;
  score: number;
  status: ToeicStatus;
  finalApprovalDate: string;
  rejectReason: string;
  history: HistLine[];
}

function toeicDetail(o: DetailOpts, actor: Role, hl: HL): HTMLElement {
  const below = o.score < MIN_SCORE;
  const total = el('span', { className: below ? 'text-red-600 font-semibold' : 'font-semibold', text: `${o.score}점${below ? ' (기준 미달)' : ''}` });

  const grid = el('div', { className: 'grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4' }, [
    detailRow('학년', o.grade),
    detailRow('학번', o.studentId),
    detailRow('생년월일', REC.birth),
    detailRow('응시일자', REC.testDate),
    detailRow('토익 수험번호', REC.testNumber),
    detailRow('담당교수', REC.professor),
    detailRow('TOTAL', total),
    detailRow('발급번호 앞 6자리', issuePrefix),
    detailRow('유효기간', REC.validUntil),
    detailRow('진행상태', stampBadge(o.status)),
  ]);

  const actions = el('div', { className: 'flex flex-wrap gap-2 border-t border-slate-200 pt-4' }, [
    winButton('YBM 성적 조회', { variant: 'secondary', size: 'sm' }),
  ]);

  let reasonArea: HTMLElement | null = null;
  if (actor === 'STAFF' && (o.status === '접수' || o.status === '검토중' || o.status === '반려')) {
    reasonArea = el('div', { className: 'mb-3' }, [
      el('label', { className: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block', text: '비고 / 반려 사유' }),
      el('textarea', { className: 'w-full text-sm border border-slate-300 p-2', text: o.rejectReason, attrs: { rows: '2', placeholder: '반려 사유 또는 관리자 코멘트를 입력하세요' } }),
    ]);
    actions.appendChild(winButton('승인', { variant: 'success', size: 'sm', highlight: hl === 'approve' }));
    actions.appendChild(winButton('반려', { variant: 'danger', size: 'sm', highlight: hl === 'reject' }));
  }
  if (actor === 'STUDENT' && o.status === '반려') {
    actions.appendChild(winButton('재등록', { variant: 'primary', size: 'sm', highlight: hl === 're-register' }));
  }

  const body = el('div', {}, [
    grid,
    below
      ? el('div', { className: 'mb-4' }, [
          noticeBox('점수 기준 미달 경고 (표시 전용)', `${MIN_SCORE}점 미만이지만 승인 게이트는 상태/역할 기준으로만 결정됩니다.`, 'amber'),
        ])
      : null,
    o.status === '반려' ? noticeBox('반려됨', `사유: ${o.rejectReason || '미기재'} · 학생이 재등록해야 합니다.`, 'amber') : null,
    reasonArea,
    actions,
    el('div', { className: 'mt-5' }, [
      el('p', { className: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2', text: '진행 이력' }),
      historyList(o.history),
    ]),
  ]);
  return winWindow(`토익 성적 · ${o.name}`, body, null, 'max-w-2xl');
}

const detailFromVm = (vm: ToeicVM, actor: Role, hl: HL): HTMLElement =>
  toeicDetail(
    { name: REC.student, studentId: REC.studentId, grade: REC.grade, score: REC.score, status: vm.status, finalApprovalDate: vm.finalApprovalDate, rejectReason: vm.rejectReason, history: vm.history },
    actor,
    hl,
  );

const steps: DeckStep<ToeicVM>[] = [
  {
    actor: 'STUDENT',
    menu: '신청·제출',
    caption: '학생이 토익 성적을 입력합니다',
    note: '학생이 성적표 기재 내용(응시일·토익 수험번호·TOTAL·발급번호 앞 6자리)을 입력하고 [입력]을 누릅니다. 증빙 파일 업로드는 없습니다.',
    render: () => createScreen(),
  },
  {
    actor: 'STUDENT',
    menu: '신청·제출',
    caption: "목록에 '접수' 상태로 등록됨",
    note: '유효기간(응시일 +2년)이 자동 계산되고 상태는 「접수」로 시작합니다.',
    render: (s) => listScreen(s, 'STUDENT'),
  },
  {
    actor: 'STAFF',
    menu: '토익 검토',
    caption: '행정실 계정으로 전환',
    note: '행정실로 전환하면 토익 건이 표 형식으로 보입니다. 생년월일·발급번호 앞 6자리·학과 승인·비고 컬럼을 함께 확인합니다.',
    render: (s) => listScreen(s, 'STAFF'),
  },
  {
    actor: 'STAFF',
    menu: '토익 검토',
    caption: 'YBM 조회 후 승인/반려',
    note: 'YBM 성적 조회로 진위를 확인한 뒤 「승인」 또는 「반려」합니다. 반려 시 사유를 비고란에 기재합니다.',
    render: (s) => detailFromVm(s, 'STAFF', 'approve'),
  },
  {
    actor: 'STAFF',
    menu: '토익 검토',
    caption: '승인 완료',
    note: "상태가 「승인」(초록 도장)으로 전이되고 최종 승인일이 기록됩니다.",
    mutate: staffApprove,
    render: (s) => detailFromVm(s, 'STAFF', null),
  },
  {
    actor: 'STAFF',
    menu: '토익 검토',
    caption: '[반려 분기] 반려 및 사유 기재',
    note: '반려 시 상태는 「반려」가 되고 학생은 재등록해야 합니다. 반려 사유는 비고란에 표시됩니다.',
    mutate: staffReject,
    render: (s) => detailFromVm(s, 'STAFF', 'reject'),
  },
  {
    actor: 'STUDENT',
    menu: '신청·제출',
    caption: '[반려 분기] 학생 재등록',
    note: '반려된 건은 학생이 [재등록]하면 다시 「접수」로 돌아가 검토가 재개됩니다.',
    mutate: reregister,
    render: (s) => detailFromVm(s, 'STUDENT', 're-register'),
  },
];

bootDeck<ToeicVM>({ program: '토익 정보 입력', initial, steps });
