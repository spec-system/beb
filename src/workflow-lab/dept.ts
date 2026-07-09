import '../index.css';
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

// spec md 2.1 신청서 승인 + 2.2 활동 인증 흐름을 실제 recordsStore 전이와 동일하게 재현.
type DeptStatus =
  | '신청 완료'
  | '담당교수 승인'
  | '신청 승인됨'
  | '포스터 심사 중'
  | '결과 보고서 검토 중'
  | '최종 검토중'
  | '최종 승인'
  | '(담당교수에게) 반려됨'
  | '(학과장에게) 반려됨';

type HL =
  | 'create'
  | 'approve-app-prof'
  | 'reject-prof'
  | 'resubmit'
  | 'approve-app-head'
  | 'reject-head'
  | 'upload-poster'
  | 'submit-report'
  | 'save-draft'
  | 'review-poster'
  | 'review-report'
  | 'approve-final'
  | 'cancel'
  | null;

interface DeptVM {
  status: DeptStatus;
  posterFile: string | null;
  reportFile: string | null;
  posterReviewed: boolean;
  reportReviewed: boolean;
  finalApprovalDate: string;
  history: HistLine[];
}

const RECORD = {
  title: '임상약학 케이스 스터디 프로젝트',
  student: '학생',
  studentId: '20231234',
  grade: '3학년',
  semester: '1학기',
  professor: '담당교수',
  hours: 10,
  team: '팀원A(20231235), 팀원B(20231236)',
  plan: '팀을 구성해 실제 처방 사례를 분석하고, 중간 점검 세미나 후 결과 발표와 결과 보고서를 작성합니다.',
};

const CERT: DeptStatus[] = ['신청 승인됨', '포스터 심사 중', '결과 보고서 검토 중', '최종 검토중'];
const isCert = (s: DeptStatus) => CERT.includes(s);
const isRejected = (s: DeptStatus) => s === '(담당교수에게) 반려됨' || s === '(학과장에게) 반려됨';
function certStatus(poster: string | null, report: string | null): DeptStatus {
  if (poster && report) return '최종 검토중';
  if (poster) return '포스터 심사 중';
  if (report) return '결과 보고서 검토 중';
  return '신청 승인됨';
}

const push = (h: HistLine[], step: string, actor: string, role: Role, at: string, reason?: string): HistLine[] => [
  ...h,
  { step, actor, role, at, reason },
];

const initial: DeptVM = {
  status: '신청 완료',
  posterFile: null,
  reportFile: null,
  posterReviewed: false,
  reportReviewed: false,
  finalApprovalDate: '',
  history: [{ step: '신청 완료', actor: '학생', role: 'STUDENT', at: '2026-03-02T09:00:00' }],
};

/* ---------- 트랜지션 (recordsStore 리듀서와 동일) ---------- */
const approveAppProf = (s: DeptVM): DeptVM => ({ ...s, status: '담당교수 승인', history: push(s.history, '담당교수 승인', '담당교수', 'PROFESSOR', '2026-03-05T11:00:00') });
const approveAppHead = (s: DeptVM): DeptVM => ({ ...s, status: '신청 승인됨', history: push(s.history, '신청 승인됨', '학과장', 'HEAD', '2026-03-06T09:00:00') });
const uploadPoster = (s: DeptVM): DeptVM => {
  const posterFile = '케이스스터디_포스터.pdf';
  return { ...s, posterFile, posterReviewed: false, status: certStatus(posterFile, s.reportFile), history: push(s.history, '포스터 업로드', '학생', 'STUDENT', '2026-05-16T10:00:00') };
};
const submitReport = (s: DeptVM): DeptVM => {
  const reportFile = '케이스스터디_결과보고서.pdf';
  return { ...s, reportFile, reportReviewed: false, status: certStatus(s.posterFile, reportFile), history: push(s.history, '결과 보고서 제출', '학생', 'STUDENT', '2026-05-18T10:00:00') };
};
const reviewPoster = (s: DeptVM): DeptVM => ({ ...s, posterReviewed: true, history: push(s.history, '포스터 심사 완료', '학과장', 'HEAD', '2026-05-19T13:00:00') });
const reviewReport = (s: DeptVM): DeptVM => ({ ...s, reportReviewed: true, history: push(s.history, '결과 보고서 심사 완료', '학과장', 'HEAD', '2026-05-19T13:10:00') });
const approveFinal = (s: DeptVM): DeptVM => ({ ...s, status: '최종 승인', finalApprovalDate: '2026-05-20', history: push(s.history, '최종 승인', '학과장', 'HEAD', '2026-05-20T14:20:00') });
const cancelFinal = (s: DeptVM): DeptVM => ({ ...s, status: '최종 검토중', finalApprovalDate: '', history: push(s.history, '최종 승인 취소 → 최종 검토중', '학과장', 'HEAD', '2026-05-20T15:00:00') });

// 반려/재신청 예시용 리터럴 VM (본 시연 체인 상태를 바꾸지 않고 분기만 보여줌)
const rejectedByProf: DeptVM = {
  status: '(담당교수에게) 반려됨',
  posterFile: null,
  reportFile: null,
  posterReviewed: false,
  reportReviewed: false,
  finalApprovalDate: '',
  history: [
    { step: '신청 완료', actor: '학생', role: 'STUDENT', at: '2026-03-02T09:00:00' },
    { step: '(담당교수에게) 반려됨', actor: '담당교수', role: 'PROFESSOR', at: '2026-03-04T10:00:00', reason: '계획서 목표·일정 구체화 필요.' },
  ],
};
const rejectedByHead: DeptVM = {
  status: '(학과장에게) 반려됨',
  posterFile: null,
  reportFile: null,
  posterReviewed: false,
  reportReviewed: false,
  finalApprovalDate: '',
  history: [
    { step: '신청 완료', actor: '학생', role: 'STUDENT', at: '2026-03-02T09:00:00' },
    { step: '담당교수 승인', actor: '담당교수', role: 'PROFESSOR', at: '2026-03-05T11:00:00' },
    { step: '(학과장에게) 반려됨', actor: '학과장', role: 'HEAD', at: '2026-03-06T09:00:00', reason: '팀 구성·인정시간 재검토 필요.' },
  ],
};

/* ---------- 화면 ---------- */
const dispInput = (value: string): HTMLElement => el('input', { className: 'w-full', attrs: { value, disabled: 'true' } });
const field = (label: string, node: Node): HTMLElement =>
  el('div', { className: 'flex flex-col gap-1.5' }, [
    el('label', { className: 'text-[11px] font-bold text-slate-950 uppercase tracking-wider', text: label }),
    node,
  ]);

function createScreen(): HTMLElement {
  const body = el('div', { className: 'flex flex-col gap-4' }, [
    field('프로그램 제목', dispInput(RECORD.title)),
    el('div', { className: 'grid grid-cols-3 gap-3' }, [
      field('학기', dispInput(RECORD.semester)),
      field('담당교수', dispInput(RECORD.professor)),
      field('인정시간', dispInput(String(RECORD.hours))),
    ]),
    field('계획서 (text)', el('textarea', { className: 'w-full', text: RECORD.plan, attrs: { rows: '3', disabled: 'true' } })),
    el('div', {}, [
      el('p', { className: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2', text: '팀원 (대표학생 외)' }),
      el('p', { className: 'text-xs text-slate-600 font-bold', text: RECORD.team }),
    ]),
  ]);
  const footer = el('div', { className: 'flex gap-2' }, [winButton('취소', { variant: 'secondary' }), winButton('신청', { variant: 'primary', highlight: true })]);
  return winWindow('학과내 비교과 신청 (대표학생)', body, footer, 'max-w-2xl');
}

function listScreen(vm: DeptVM, actor: Role): HTMLElement {
  const title = actor === 'STUDENT' ? '학과내 비교과 신청·제출' : actor === 'PROFESSOR' ? '학과내 목록' : '학과내 최종승인';
  const right = actor === 'STUDENT' ? winButton('+ 신규 신청', { size: 'sm' }) : null;
  const table = suTable(
    ['제목', '학번', '이름', '학기', '인정시간', '담당교수', '진행상태', '최종 승인일', ''],
    [[
      el('span', { className: 'text-slate-800 font-medium', text: `${RECORD.title} 팀 3명` }),
      RECORD.studentId,
      RECORD.student,
      RECORD.semester,
      `${RECORD.hours}h`,
      RECORD.professor,
      stampBadge(vm.status),
      vm.finalApprovalDate || '-',
      winButton('상세', { variant: 'ghost', size: 'sm' }),
    ]],
  );
  return el('div', {}, [pageHeader(title, '이수현황', right), table, el('p', { className: 'text-sm text-slate-500 mt-3', text: '총 1건' })]);
}

function fileLine(name: string, reviewed: boolean): HTMLElement {
  return el('div', { className: 'border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 flex items-center justify-between gap-2' }, [
    el('span', { className: 'truncate', text: name }),
    el('span', { className: `text-xs font-bold ${reviewed ? 'tone-success' : 'tone-warn'}`, text: reviewed ? '학과장 심사 완료' : '학과장 심사 대기' }),
  ]);
}

function detailScreen(vm: DeptVM, actor: Role, hl: HL): HTMLElement {
  const left = el('div', { className: 'space-y-3 text-sm' }, [
    detailRow('학생', `${RECORD.student} (${RECORD.studentId}) · ${RECORD.grade}`),
    detailRow('학기', `2026 ${RECORD.semester}`),
    detailRow('담당교수', RECORD.professor),
    detailRow('인정시간', `${RECORD.hours}시간`),
    detailRow('진행상태', stampBadge(vm.status)),
    detailRow('팀원', RECORD.team),
    el('div', {}, [
      el('p', { className: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1', text: '계획서' }),
      el('p', { className: 'text-sm text-slate-700 bg-slate-50 p-3 border border-slate-200 whitespace-pre-wrap', text: RECORD.plan }),
    ]),
  ]);

  const right = el('div', { className: 'space-y-4' }, []);

  // 반려 배너
  if (isRejected(vm.status)) {
    const who = vm.status === '(담당교수에게) 반려됨' ? '담당교수' : '학과장';
    const reason = [...vm.history].reverse().find((h) => isRejected(h.step as DeptStatus))?.reason;
    right.appendChild(noticeBox(`${who}에게 반려됨`, `사유: ${reason || '미기재'} · 대표학생이 재신청하면 다시 '신청 완료' 상태로 검토가 시작됩니다.`, 'amber'));
  }

  // 신청 단계 문서 (계획서 = 신청서)
  right.appendChild(
    el('div', { className: 'border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 space-y-2' }, [
      detailRow('신청 단계', vm.status === '신청 완료' ? '담당교수 검토중' : vm.status === '담당교수 승인' ? '학과장 검토중' : isRejected(vm.status) ? '반려 — 재신청 대기' : '신청 승인 완료'),
      isCert(vm.status) || vm.status === '최종 승인'
        ? detailRow('활동 인증', `포스터 ${vm.posterFile ? (vm.posterReviewed ? '심사완료' : '심사대기') : '미제출'} · 보고서 ${vm.reportFile ? (vm.reportReviewed ? '심사완료' : '심사대기') : '미제출'}`)
        : null,
    ]),
  );

  // 활동 인증 단계 (신청 승인 이후): 포스터 + 결과보고서
  if (isCert(vm.status) || vm.status === '최종 승인') {
    const studentUpload = actor === 'STUDENT' && vm.status !== '최종 승인';
    // 포스터
    const posterWrap = el('div', {}, [el('p', { className: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2', text: '결과 포스터 (1-1)' })]);
    if (studentUpload && !vm.posterFile) {
      const fb = fileBox('케이스스터디_포스터.pdf', false, '전시한 결과 포스터 파일');
      if (hl === 'upload-poster') fb.classList.add('deck-hl');
      posterWrap.appendChild(fb);
    } else if (vm.posterFile) {
      posterWrap.appendChild(fileLine(vm.posterFile, vm.posterReviewed));
    } else {
      posterWrap.appendChild(el('p', { className: 'text-xs text-slate-400', text: '아직 포스터가 업로드되지 않았습니다.' }));
    }
    right.appendChild(posterWrap);
    // 결과 보고서
    const reportWrap = el('div', {}, [el('p', { className: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2', text: '결과 보고서 (1-2)' })]);
    if (studentUpload && !vm.reportFile) {
      const fb = fileBox('케이스스터디_결과보고서.pdf', false, '결과 보고서 PDF');
      if (hl === 'submit-report') fb.classList.add('deck-hl');
      reportWrap.appendChild(fb);
    } else if (vm.reportFile) {
      reportWrap.appendChild(fileLine(vm.reportFile, vm.reportReviewed));
    } else {
      reportWrap.appendChild(el('p', { className: 'text-xs text-slate-400', text: '아직 결과 보고서가 제출되지 않았습니다.' }));
    }
    right.appendChild(reportWrap);
  }

  // 액션 버튼
  const actions = el('div', { className: 'flex flex-wrap gap-2' }, []);
  if (actor === 'PROFESSOR' && vm.status === '신청 완료') {
    actions.appendChild(winButton('신청서 승인 (담당교수)', { variant: 'success', size: 'sm', highlight: hl === 'approve-app-prof' }));
    actions.appendChild(winButton('반려', { variant: 'danger', size: 'sm', highlight: hl === 'reject-prof' }));
  }
  if (actor === 'HEAD' && vm.status === '담당교수 승인') {
    actions.appendChild(winButton('신청서 승인 (학과장)', { variant: 'success', size: 'sm', highlight: hl === 'approve-app-head' }));
    actions.appendChild(winButton('반려', { variant: 'danger', size: 'sm', highlight: hl === 'reject-head' }));
  }
  if (actor === 'STUDENT' && isRejected(vm.status)) {
    actions.appendChild(winButton('재신청', { variant: 'secondary', size: 'sm', highlight: hl === 'resubmit' }));
  }
  if (actor === 'STUDENT' && isCert(vm.status) && vm.status !== '최종 승인') {
    actions.appendChild(winButton('임시 저장', { variant: 'secondary', size: 'sm', highlight: hl === 'save-draft' }));
  }
  if (actor === 'HEAD' && isCert(vm.status)) {
    if (vm.posterFile && !vm.posterReviewed) actions.appendChild(winButton('포스터 심사 완료 (2-1)', { variant: 'success', size: 'sm', highlight: hl === 'review-poster' }));
    if (vm.reportFile && !vm.reportReviewed) actions.appendChild(winButton('결과 보고서 심사 완료 (2-2)', { variant: 'success', size: 'sm', highlight: hl === 'review-report' }));
    if (vm.status === '최종 검토중') {
      actions.appendChild(winButton('최종 승인 (3단계)', { variant: 'success', size: 'sm', disabled: !(vm.posterReviewed && vm.reportReviewed), highlight: hl === 'approve-final' }));
    }
  }
  if (actor === 'HEAD' && vm.status === '최종 승인') {
    actions.appendChild(winButton('승인 취소', { variant: 'secondary', size: 'sm', highlight: hl === 'cancel' }));
  }
  if (actions.childNodes.length) right.appendChild(actions);

  right.appendChild(
    el('div', {}, [
      el('p', { className: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2', text: '진행 이력' }),
      historyList(vm.history),
    ]),
  );

  return winWindow(RECORD.title, el('div', { className: 'grid md:grid-cols-2 gap-6' }, [left, right]), null, 'max-w-3xl');
}

/* ---------- 슬라이드 (spec md §2.1 + §2.2 전체 흐름) ---------- */
const steps: DeckStep<DeptVM>[] = [
  { actor: 'STUDENT', menu: '신청·제출', caption: '① 대표학생이 비교과 활동을 신청', note: '상세 폼에 프로그램 제목·학기·담당교수·인정시간·팀원을 입력하고 [신청]을 누릅니다. → 담당교수 화면으로 신청 항목이 전달됩니다.', render: () => createScreen() },
  { actor: 'STUDENT', menu: '신청·제출', caption: "상태: '신청 완료' (담당교수 검토중)", note: '신청 즉시 목록에 「신청 완료」로 나타나고, 학과 측 상태는 담당교수 검토중입니다.', render: (s) => listScreen(s, 'STUDENT') },
  { actor: 'PROFESSOR', menu: '학과내 목록', caption: '② 담당교수 계정으로 전환', note: '담당교수로 전환하면 배정된 신청 건이 자동으로 목록에 추가됩니다.', render: (s) => listScreen(s, 'PROFESSOR') },
  { actor: 'PROFESSOR', menu: '학과내 목록', caption: '담당교수가 신청서를 검토 — 승인 / 반려', note: '상세에서 신청 내역을 검토하고 승인 또는 반려합니다. (서명은 사전 등록 서명을 사용) 이번 단계 액션은 「신청서 승인」입니다.', render: (s) => detailScreen(s, 'PROFESSOR', 'approve-app-prof') },
  { actor: 'PROFESSOR', menu: '학과내 목록', caption: '[반려 분기] 담당교수 반려 시', note: "담당교수가 반려하면 상태는 '(담당교수에게) 반려됨'이 됩니다. 학과장 반려와 구분되는 별도 상태입니다.", render: () => detailScreen(rejectedByProf, 'PROFESSOR', 'reject-prof') },
  { actor: 'STUDENT', menu: '신청·제출', caption: '[반려 분기] 대표학생 재신청', note: "반려된 건은 대표학생이 [재신청]하면 다시 '신청 완료'로 돌아가 검토가 재개됩니다.", render: () => detailScreen(rejectedByProf, 'STUDENT', 'resubmit') },
  { actor: 'PROFESSOR', menu: '학과내 목록', caption: '담당교수 승인 완료', note: "본 시연은 승인 경로로 진행합니다. 상태가 '담당교수 승인'(학과장 검토중)으로 전이되고 학과장 화면으로 전달됩니다.", mutate: approveAppProf, render: (s) => detailScreen(s, 'PROFESSOR', null) },
  { actor: 'HEAD', menu: '학과내 최종승인', caption: '③ 학과장이 신청서를 검토 — 승인 / 반려', note: '담당교수가 승인한 신청 건이 학과장 화면에 자동 추가됩니다. 검토 후 승인 또는 반려합니다.', render: (s) => detailScreen(s, 'HEAD', 'approve-app-head') },
  { actor: 'HEAD', menu: '학과내 최종승인', caption: '[반려 분기] 학과장 반려 시', note: "학과장이 반려하면 상태는 '(학과장에게) 반려됨'이 됩니다. (담당교수 반려와 구분)", render: () => detailScreen(rejectedByHead, 'HEAD', 'reject-head') },
  { actor: 'HEAD', menu: '학과내 최종승인', caption: '신청 승인됨 — 활동 시작', note: "학과장이 승인하면 신청이 최종 확정되어 '신청 승인됨'이 되고, 대표학생의 활동 인증(포스터·결과보고서) 단계가 열립니다.", mutate: approveAppHead, render: (s) => detailScreen(s, 'HEAD', null) },

  { actor: 'STUDENT', menu: '신청·제출', caption: '1-1. 대표학생 포스터 파일 업로드', note: '상세페이지에 결과 포스터 파일을 업로드하고 제출합니다. → 학과장 화면으로 관련 정보가 넘어갑니다.', render: (s) => detailScreen(s, 'STUDENT', 'upload-poster') },
  { actor: 'STUDENT', menu: '신청·제출', caption: "포스터 업로드 완료 → '포스터 심사 중'", note: '포스터 파일 업로드가 완료되면 학과 측 상태가 「포스터 심사 중」이 됩니다.', mutate: uploadPoster, render: (s) => detailScreen(s, 'STUDENT', null) },
  { actor: 'STUDENT', menu: '신청·제출', caption: '1-2. 대표학생 결과 보고서 제출', note: '상세페이지 폼에 결과 보고서를 작성/제출합니다. → 학과장 화면으로 넘어갑니다.', render: (s) => detailScreen(s, 'STUDENT', 'submit-report') },
  { actor: 'STUDENT', menu: '신청·제출', caption: '부가 기능: 임시 저장', note: '결과 보고서 작성 중 [임시 저장]으로 작성 내용을 저장해 두었다가 이어서 제출할 수 있습니다.', render: (s) => detailScreen(s, 'STUDENT', 'save-draft') },
  { actor: 'STUDENT', menu: '신청·제출', caption: "포스터 + 보고서 모두 완료 → '최종 검토중'", note: '포스터와 결과 보고서가 모두 제출되면 학과 측 상태가 「최종 검토중」이 됩니다.', mutate: submitReport, render: (s) => detailScreen(s, 'STUDENT', null) },

  { actor: 'HEAD', menu: '학과내 최종승인', caption: '2-1. 학과장 포스터 심사', note: '학생이 업로드한 포스터 파일에 학과장이 접근해 확인·심사합니다. (또는 실제 전시된 포스터를 확인·심사)', render: (s) => detailScreen(s, 'HEAD', 'review-poster') },
  { actor: 'HEAD', menu: '학과내 최종승인', caption: '포스터 심사 완료', note: '학과장이 포스터 심사를 완료했습니다. 다음으로 결과 보고서를 심사합니다.', mutate: reviewPoster, render: (s) => detailScreen(s, 'HEAD', 'review-report') },
  { actor: 'HEAD', menu: '학과내 최종승인', caption: '2-2. 학과장 결과 보고서 심사', note: '학과장이 결과 보고서 내역을 검토·심사합니다.', mutate: reviewReport, render: (s) => detailScreen(s, 'HEAD', 'approve-final') },
  { actor: 'HEAD', menu: '학과내 최종승인', caption: '3단계. 학과장 최종 승인', note: '포스터 심사 + 결과 보고서 심사가 모두 완료되어야 [최종 승인] 버튼이 활성화됩니다. 최종 승인을 체크합니다.', mutate: approveFinal, render: (s) => detailScreen(s, 'HEAD', null) },
  { actor: 'HEAD', menu: '학과내 최종승인', caption: '비교과 활동 완료 처리', note: "상태가 「최종 승인」(초록 도장)이 되고 최종 승인일이 기록됩니다. 활동 완료 처리 — 워크플로우 종료([end]).", render: (s) => detailScreen(s, 'HEAD', 'cancel') },
  { actor: 'HEAD', menu: '학과내 최종승인', caption: '취소 가능 — 최종 검토중으로 복귀', note: '최종 승인은 취소할 수 있습니다. 취소하면 직전 「최종 검토중」 단계로 되돌아갑니다.', mutate: cancelFinal, render: (s) => detailScreen(s, 'HEAD', null) },
];

bootDeck<DeptVM>({ program: '학과내 비교과 (신청→인증)', initial, steps });
