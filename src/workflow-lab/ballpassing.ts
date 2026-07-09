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

// spec md §3 Work Flow (Ball Passing Model) — 실제 UI 화면으로 재현.

type Status =
  | '신청 완료 / 담당교수 검토중'
  | '담당교수 승인 / 학과장 검토중'
  | '(담당교수에게) 반려됨'
  | '(학과장에게) 반려됨'
  | '신청 승인됨'
  | '포스터 심사 중'
  | '결과 보고서 검토 중'
  | '최종 검토중'
  | '최종 승인';

type HL = 'apply' | 'approve-prof' | 'reject-prof' | 'resubmit-prof' | 'approve-head' | 'reject-head' | 'resubmit-head' | 'upload-poster' | 'submit-report' | 'review-poster' | 'review-report' | 'approve-final' | null;

interface BallVM {
  status: Status;
  posterFile: string | null;
  reportFile: string | null;
  posterReviewed: boolean;
  reportReviewed: boolean;
  history: HistLine[];
}

const RECORD = {
  title: '임상약학 케이스 스터디 프로젝트',
  student: '학생',
  studentId: '20231234',
  grade: '3학년',
  semester: '2026 1학기',
  professor: '담당교수',
  hours: 10,
  team: '팀원A(20231235), 팀원B(20231236)',
  plan: '팀을 구성해 실제 처방 사례를 분석하고, 중간 점검 세미나 후 결과 발표와 결과 보고서를 작성합니다.',
};

const push = (h: HistLine[], step: string, actor: string, role: Role, at: string, reason?: string): HistLine[] => [...h, { step, actor, role, at, reason }];

const initial: BallVM = {
  status: '신청 완료 / 담당교수 검토중',
  posterFile: null,
  reportFile: null,
  posterReviewed: false,
  reportReviewed: false,
  history: [{ step: '신청 완료', actor: '학생', role: 'STUDENT', at: '2026-03-02T09:00:00' }],
};

/* ---------- 트랜지션 ---------- */
const profApprove = (s: BallVM): BallVM => ({ ...s, status: '담당교수 승인 / 학과장 검토중', history: push(s.history, '담당교수 승인', '담당교수', 'PROFESSOR', '2026-03-04T10:00:00') });
const profReject = (s: BallVM): BallVM => ({ ...s, status: '(담당교수에게) 반려됨', history: push(s.history, '(담당교수에게) 반려됨', '담당교수', 'PROFESSOR', '2026-03-04T10:00:00', '계획서 목표·일정 구체화 필요') });
const resubmitFromProf = (s: BallVM): BallVM => ({ ...s, status: '신청 완료 / 담당교수 검토중', history: push(s.history, '재신청', '학생', 'STUDENT', '2026-03-05T09:00:00') });
const headApprove = (s: BallVM): BallVM => ({ ...s, status: '신청 승인됨', history: push(s.history, '학과장 승인', '학과장', 'HEAD', '2026-03-06T09:00:00') });
const headReject = (s: BallVM): BallVM => ({ ...s, status: '(학과장에게) 반려됨', history: push(s.history, '(학과장에게) 반려됨', '학과장', 'HEAD', '2026-03-06T09:00:00', '팀 구성·인정시간 재검토 필요') });
const resubmitFromHead = (s: BallVM): BallVM => ({ ...s, status: '신청 완료 / 담당교수 검토중', history: push(s.history, '재신청', '학생', 'STUDENT', '2026-03-07T09:00:00') });
const uploadPoster = (s: BallVM): BallVM => ({ ...s, posterFile: '케이스스터디_포스터.pdf', status: '포스터 심사 중', history: push(s.history, '포스터 업로드', '학생', 'STUDENT', '2026-05-16T10:00:00') });
const submitReport = (s: BallVM): BallVM => ({ ...s, reportFile: '케이스스터디_결과보고서.pdf', status: '최종 검토중', history: push(s.history, '결과 보고서 제출', '학생', 'STUDENT', '2026-05-18T10:00:00') });
const reviewPoster = (s: BallVM): BallVM => ({ ...s, posterReviewed: true, history: push(s.history, '포스터 심사 완료', '학과장', 'HEAD', '2026-05-19T13:00:00') });
const reviewReport = (s: BallVM): BallVM => ({ ...s, reportReviewed: true, history: push(s.history, '결과 보고서 심사 완료', '학과장', 'HEAD', '2026-05-19T13:10:00') });
const finalApprove = (s: BallVM): BallVM => ({ ...s, status: '최종 승인', history: push(s.history, '최종 승인', '학과장', 'HEAD', '2026-05-20T14:00:00') });

/* ---------- 공통 UI ---------- */
const dispInput = (value: string): HTMLElement => el('input', { className: 'w-full', attrs: { value, disabled: 'true' } });
const field = (label: string, node: Node): HTMLElement =>
  el('div', { className: 'flex flex-col gap-1.5' }, [
    el('label', { className: 'text-[11px] font-bold text-slate-950 uppercase tracking-wider', text: label }),
    node,
  ]);

function applyForm(): HTMLElement {
  const body = el('div', { className: 'flex flex-col gap-4' }, [
    field('프로그램 제목', dispInput(RECORD.title)),
    el('div', { className: 'grid grid-cols-3 gap-3' }, [
      field('학기', dispInput(RECORD.semester)),
      field('담당교수', dispInput(RECORD.professor)),
      field('인정시간', dispInput(String(RECORD.hours))),
    ]),
    field('계획서', el('textarea', { className: 'w-full', text: RECORD.plan, attrs: { rows: '3', disabled: 'true' } })),
    el('div', {}, [
      el('p', { className: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2', text: '팀원 (대표학생 외)' }),
      el('p', { className: 'text-xs text-slate-600 font-bold', text: RECORD.team }),
    ]),
  ]);
  const footer = el('div', { className: 'flex gap-2' }, [winButton('취소', { variant: 'secondary' }), winButton('신청', { variant: 'primary', highlight: true })]);
  return winWindow('학과내 비교과 신청 (대표학생)', body, footer, 'max-w-2xl');
}

function listScreen(vm: BallVM, actor: Role): HTMLElement {
  const title = actor === 'STUDENT' ? '학과내 비교과 신청·제출' : actor === 'PROFESSOR' ? '학과내 목록' : '학과내 최종승인';
  const right = actor === 'STUDENT' ? winButton('+ 신규 신청', { size: 'sm' }) : null;
  const table = suTable(
    ['제목', '학번', '이름', '학기', '인정시간', '담당교수', '진행상태', ''],
    [[
      el('span', { className: 'text-slate-800 font-medium', text: RECORD.title }),
      RECORD.studentId,
      RECORD.student,
      RECORD.semester,
      `${RECORD.hours}h`,
      RECORD.professor,
      stampBadge(vm.status),
      winButton('상세', { variant: 'ghost', size: 'sm' }),
    ]],
  );
  return el('div', {}, [pageHeader(title, '이수현황', right), table, el('p', { className: 'text-sm text-slate-500 mt-3', text: '총 1건' })]);
}

function detailLeft(): HTMLElement {
  return el('div', { className: 'space-y-3 text-sm' }, [
    detailRow('학생', `${RECORD.student} (${RECORD.studentId}) · ${RECORD.grade}`),
    detailRow('학기', RECORD.semester),
    detailRow('담당교수', RECORD.professor),
    detailRow('인정시간', `${RECORD.hours}시간`),
    detailRow('팀원', RECORD.team),
    el('div', {}, [
      el('p', { className: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1', text: '계획서' }),
      el('p', { className: 'text-sm text-slate-700 bg-slate-50 p-3 border border-slate-200 whitespace-pre-wrap', text: RECORD.plan }),
    ]),
  ]);
}

function fileLine(name: string, reviewed: boolean): HTMLElement {
  return el('div', { className: 'border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 flex items-center justify-between gap-2' }, [
    el('span', { className: 'truncate', text: name }),
    el('span', { className: `text-xs font-bold ${reviewed ? 'text-green-700' : 'text-amber-600'}`, text: reviewed ? '학과장 심사 완료' : '학과장 심사 대기' }),
  ]);
}

function detailScreen(vm: BallVM, actor: Role, hl: HL): HTMLElement {
  const left = detailLeft();
  const right = el('div', { className: 'space-y-4' }, []);

  const isRejected = vm.status === '(담당교수에게) 반려됨' || vm.status === '(학과장에게) 반려됨';
  if (isRejected) {
    const who = vm.status === '(담당교수에게) 반려됨' ? '담당교수' : '학과장';
    const reason = [...vm.history].reverse().find((h) => h.step.includes('반려'))?.reason;
    right.appendChild(noticeBox(`${who}에게 반려됨`, `사유: ${reason || '미기재'} · 대표학생이 재신청하면 다시 검토가 시작됩니다.`, 'amber'));
  }

  right.appendChild(
    el('div', { className: 'border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 space-y-2' }, [
      detailRow('진행상태', stampBadge(vm.status)),
      detailRow('신청 단계', isRejected ? '반려 — 재신청 대기' : vm.status.includes('신청') || vm.status.includes('담당교수') || vm.status.includes('학과장') ? '신청 승인 진행중' : '신청 승인 완료'),
      vm.posterFile || vm.reportFile
        ? detailRow('활동 인증', `포스터 ${vm.posterFile ? (vm.posterReviewed ? '심사완료' : '심사대기') : '미제출'} · 보고서 ${vm.reportFile ? (vm.reportReviewed ? '심사완료' : '심사대기') : '미제출'}`)
        : null,
    ]),
  );

  const showCert = !isRejected && (vm.status === '신청 승인됨' || vm.status === '포스터 심사 중' || vm.status === '결과 보고서 검토 중' || vm.status === '최종 검토중' || vm.status === '최종 승인');
  if (showCert) {
    const studentUpload = actor === 'STUDENT' && vm.status !== '최종 승인';

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

  const actions = el('div', { className: 'flex flex-wrap gap-2' }, []);
  if (actor === 'PROFESSOR' && vm.status === '신청 완료 / 담당교수 검토중') {
    actions.appendChild(winButton('신청서 승인', { variant: 'success', size: 'sm', highlight: hl === 'approve-prof' }));
    actions.appendChild(winButton('반려', { variant: 'danger', size: 'sm', highlight: hl === 'reject-prof' }));
  }
  if (actor === 'HEAD' && vm.status === '담당교수 승인 / 학과장 검토중') {
    actions.appendChild(winButton('신청서 승인', { variant: 'success', size: 'sm', highlight: hl === 'approve-head' }));
    actions.appendChild(winButton('반려', { variant: 'danger', size: 'sm', highlight: hl === 'reject-head' }));
  }
  if (actor === 'STUDENT' && vm.status === '(담당교수에게) 반려됨') {
    actions.appendChild(winButton('재신청', { variant: 'secondary', size: 'sm', highlight: hl === 'resubmit-prof' }));
  }
  if (actor === 'STUDENT' && vm.status === '(학과장에게) 반려됨') {
    actions.appendChild(winButton('재신청', { variant: 'secondary', size: 'sm', highlight: hl === 'resubmit-head' }));
  }
  if (actor === 'HEAD' && showCert && vm.status !== '최종 승인') {
    if (vm.posterFile && !vm.posterReviewed) actions.appendChild(winButton('포스터 심사 완료', { variant: 'success', size: 'sm', highlight: hl === 'review-poster' }));
    if (vm.reportFile && !vm.reportReviewed) actions.appendChild(winButton('결과 보고서 심사 완료', { variant: 'success', size: 'sm', highlight: hl === 'review-report' }));
    if (vm.status === '최종 검토중') {
      actions.appendChild(winButton('최종 승인', { variant: 'success', size: 'sm', disabled: !(vm.posterReviewed && vm.reportReviewed), highlight: hl === 'approve-final' }));
    }
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

function toeicApplyForm(): HTMLElement {
  const body = el('div', { className: 'grid grid-cols-2 gap-4' }, [
    field('생년월일', dispInput('2002-03-11')),
    field('응시일자', dispInput('2026-09-14')),
    field('토익 수험번호', dispInput('482913')),
    field('TOTAL 점수', dispInput('880')),
    field('발급번호 앞 6자리', dispInput('202609')),
  ]);
  const footer = el('div', { className: 'flex gap-2' }, [
    winButton('취소', { variant: 'secondary' }),
    winButton('입력', { variant: 'primary', highlight: true }),
  ]);
  return winWindow('토익 이수 정보 등록', body, footer, 'max-w-2xl');
}

function toeicBallList(status: string): HTMLElement {
  const table = suTable(
    ['학년', '학번', '이름', '생년월일', '응시일자', '토익 수험번호', 'TOTAL', '발급번호 앞6', '진행상태', '학과 승인', '최종 승인일', '비고'],
    [['3학년', '20231234', '학생', '2002-03-11', '2026-09-14', '482913', '880', '202609', stampBadge(status), '-', '-', '-']],
  );
  return el('div', {}, [pageHeader('토익 검토', 'TOEIC', null), table, el('p', { className: 'text-sm text-slate-500 mt-3', text: '총 1건' })]);
}

function toeicBallDetail(actor: Role, hl: 'approve' | 'reject' | 're-register' | null): HTMLElement {
  const grid = el('div', { className: 'grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4' }, [
    detailRow('학년', '3학년'),
    detailRow('학번', '20231234'),
    detailRow('생년월일', '2002-03-11'),
    detailRow('응시일자', '2026-09-14'),
    detailRow('토익 수험번호', '482913'),
    detailRow('TOTAL', '880점'),
    detailRow('발급번호 앞 6자리', '202609'),
    detailRow('진행상태', stampBadge(hl === 're-register' ? '반려' : '접수')),
  ]);
  const actions = el('div', { className: 'flex flex-wrap gap-2 border-t border-slate-200 pt-4' }, []);
  if (actor === 'STAFF') {
    actions.appendChild(winButton('YBM 성적 조회', { variant: 'secondary', size: 'sm' }));
    actions.appendChild(winButton('승인', { variant: 'success', size: 'sm', highlight: hl === 'approve' }));
    actions.appendChild(winButton('반려', { variant: 'danger', size: 'sm', highlight: hl === 'reject' }));
  }
  if (actor === 'STUDENT' && hl === 're-register') {
    actions.appendChild(winButton('재등록', { variant: 'primary', size: 'sm', highlight: true }));
  }
  const body = el('div', {}, [
    grid,
    hl === 'reject' || hl === 're-register'
      ? noticeBox('반려됨', '사유: 발급번호 불일치 — 학생이 토익 이수 정보를 재등록해야 합니다.', 'amber')
      : null,
    actions,
    el('div', { className: 'mt-5' }, [
      el('p', { className: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2', text: '진행 이력' }),
      historyList([{ step: '접수', actor: '학생', role: 'STUDENT', at: '2026-09-20T10:00:00' }]),
    ]),
  ]);
  return winWindow('토익 성적 · 학생', body, null, 'max-w-2xl');
}

function volunteerBallForm(): HTMLElement {
  const body = el('div', { className: 'flex flex-col gap-4' }, [
    field('봉사활동명', dispInput('어르신 복약지도 봉사')),
    field('봉사 활동 기관', dispInput('서울시 노인복지관')),
    el('div', { className: 'grid grid-cols-3 gap-3' }, [
      field('학기', dispInput('2학기')),
      field('담당교수', dispInput('담당교수')),
      field('인정시간', dispInput('8')),
    ]),
    fileBox('복약지도_인증서.pdf', false, '봉사클럽 관련 발급 인증서'),
  ]);
  const footer = el('div', { className: 'flex gap-2' }, [
    winButton('취소', { variant: 'secondary' }),
    winButton('등록', { variant: 'primary', highlight: true }),
  ]);
  return winWindow('전공 연계 봉사 활동 이력 등록', body, footer, 'max-w-2xl');
}

function volunteerBallList(status: string): HTMLElement {
  const table = suTable(
    ['봉사활동명', '학년', '학번', '이름', '연도', '학기', '인정시간', '진행상태', '학과 승인', '최종 승인일', '누적 봉사시간', '인증서'],
    [['어르신 복약지도 봉사', '3학년', '20231234', '학생', '2026', '2학기', '8h', stampBadge(status), '-', '-', '22h', winButton('열기', { variant: 'ghost', size: 'sm' })]],
  );
  return el('div', {}, [pageHeader('봉사 검토', '전공연계봉사활동', null), table, el('p', { className: 'text-sm text-slate-500 mt-3', text: '총 1건' })]);
}

function volunteerBallDetail(actor: Role, hl: 'approve' | 'reject' | 're-register' | null): HTMLElement {
  const grid = el('div', { className: 'grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4' }, [
    detailRow('학생', '학생 (20231234)'),
    detailRow('학기', '2026 2학기'),
    detailRow('봉사활동기관', '서울시 노인복지관'),
    detailRow('담당교수', '담당교수'),
    detailRow('인정시간', '8시간'),
    detailRow('진행상태', stampBadge(hl === 're-register' ? '반려' : '접수')),
  ]);
  const actions = el('div', { className: 'flex flex-wrap gap-2 border-t border-slate-200 pt-4' }, []);
  if (actor === 'STAFF') {
    actions.appendChild(winButton('인증서 열기', { variant: 'secondary', size: 'sm' }));
    actions.appendChild(winButton('다운로드', { variant: 'secondary', size: 'sm' }));
    actions.appendChild(winButton('승인', { variant: 'success', size: 'sm', highlight: hl === 'approve' }));
    actions.appendChild(winButton('반려', { variant: 'danger', size: 'sm', highlight: hl === 'reject' }));
  }
  if (actor === 'STUDENT' && hl === 're-register') {
    actions.appendChild(winButton('재등록', { variant: 'primary', size: 'sm', highlight: true }));
  }
  const body = el('div', {}, [
    grid,
    fileLine('복약지도_인증서.pdf', actor === 'STAFF' && hl === 'approve'),
    hl === 'reject' || hl === 're-register'
      ? noticeBox('반려됨', '사유: 인증서 서명 누락 — 학생이 전공 연계 봉사 활동 이력을 재등록해야 합니다.', 'amber')
      : null,
    actions,
    el('div', { className: 'mt-5' }, [
      el('p', { className: 'text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2', text: '진행 이력' }),
      historyList([{ step: '접수', actor: '학생', role: 'STUDENT', at: '2026-09-30T10:00:00' }]),
    ]),
  ]);
  return winWindow('어르신 복약지도 봉사', body, null, 'max-w-2xl');
}
/* ---------- 슬라이드 ---------- */
const steps: DeckStep<BallVM>[] = [
  {
    actor: 'STUDENT',
    menu: '신청·제출',
    caption: '① 대표학생이 비교과 활동을 신청',
    note: '프로그램 제목·학기·담당교수·인정시간·팀원을 입력하고 [신청]을 누르면 담당교수 화면으로 전달됩니다.',
    render: () => applyForm(),
  },
  {
    actor: 'STUDENT',
    menu: '신청·제출',
    caption: "상태: '신청 완료 / 담당교수 검토중'",
    note: '신청 즉시 목록에 나타나며, 담당교수에게 검토 요청이 전달됩니다.',
    render: (s) => listScreen(s, 'STUDENT'),
  },
  {
    actor: 'PROFESSOR',
    menu: '학과내 목록',
    caption: '② 담당교수 계정으로 전환 — 신청서 검토',
    note: '담당교수 목록에 자동 추가된 신청 건을 확인하고, 상세에서 승인 또는 반려합니다.',
    render: (s) => detailScreen(s, 'PROFESSOR', 'approve-prof'),
  },
  {
    actor: 'STUDENT',
    menu: '신청·제출',
    caption: '[반려 분기] 담당교수 반려 시',
    note: "담당교수가 반려하면 상태는 '(담당교수에게) 반려됨'이 됩니다. 학과장 반려와 구분되는 별도 상태입니다.",
    mutate: profReject,
    render: (s) => detailScreen(s, 'STUDENT', 'resubmit-prof'),
  },
  {
    actor: 'STUDENT',
    menu: '신청·제출',
    caption: '[반려 분기] 대표학생 재신청',
    note: "[재신청]을 누르면 다시 '신청 완료 / 담당교수 검토중'으로 돌아가 검토가 재개됩니다.",
    mutate: resubmitFromProf,
    render: (s) => detailScreen(s, 'STUDENT', null),
  },
  {
    actor: 'PROFESSOR',
    menu: '학과내 목록',
    caption: '담당교수 승인 완료',
    note: "본 시연은 승인 경로로 진행합니다. 상태가 '담당교수 승인 / 학과장 검토중'으로 전이됩니다.",
    mutate: profApprove,
    render: (s) => listScreen(s, 'PROFESSOR'),
  },
  {
    actor: 'HEAD',
    menu: '학과내 최종승인',
    caption: '③ 학과장이 신청서를 검토 — 승인 / 반려',
    note: '담당교수가 승인한 신청 건이 학과장 화면에 자동 추가됩니다. 검토 후 승인 또는 반려합니다.',
    render: (s) => detailScreen(s, 'HEAD', 'approve-head'),
  },
  {
    actor: 'STUDENT',
    menu: '신청·제출',
    caption: '[반려 분기] 학과장 반려 시',
    note: "학과장이 반려하면 상태는 '(학과장에게) 반려됨'이 됩니다. (담당교수 반려와 구분)",
    mutate: headReject,
    render: (s) => detailScreen(s, 'STUDENT', 'resubmit-head'),
  },
  {
    actor: 'STUDENT',
    menu: '신청·제출',
    caption: '[반려 분기] 대표학생 재신청',
    note: "[재신청]을 누르면 다시 '신청 완료 / 담당교수 검토중'으로 돌아갑니다.",
    mutate: resubmitFromHead,
    render: (s) => detailScreen(s, 'STUDENT', null),
  },
  {
    actor: 'HEAD',
    menu: '학과내 최종승인',
    caption: '학과장 승인 완료 — 활동 시작',
    note: "학과장이 승인하면 '신청 승인됨'이 되고, 대표학생의 활동 인증(포스터·결과보고서) 단계가 열립니다.",
    mutate: headApprove,
    render: (s) => detailScreen(s, 'HEAD', null),
  },
  {
    actor: 'STUDENT',
    menu: '신청·제출',
    caption: '1-1. 대표학생 포스터 파일 업로드',
    note: '상세페이지에 결과 포스터 파일을 업로드하고 제출합니다. → 학과장 화면으로 관련 정보가 넘어갑니다.',
    render: (s) => detailScreen(s, 'STUDENT', 'upload-poster'),
  },
  {
    actor: 'STUDENT',
    menu: '신청·제출',
    caption: "포스터 업로드 완료 → '포스터 심사 중'",
    note: '포스터 파일 업로드가 완료되면 학과 측 상태가 「포스터 심사 중」이 됩니다.',
    mutate: uploadPoster,
    render: (s) => detailScreen(s, 'STUDENT', null),
  },
  {
    actor: 'STUDENT',
    menu: '신청·제출',
    caption: '1-2. 대표학생 결과 보고서 제출',
    note: '상세페이지 폼에 결과 보고서를 작성/제출합니다. → 학과장 화면으로 넘어갑니다.',
    render: (s) => detailScreen(s, 'STUDENT', 'submit-report'),
  },
  {
    actor: 'STUDENT',
    menu: '신청·제출',
    caption: "포스터 + 보고서 모두 완료 → '최종 검토중'",
    note: '포스터와 결과 보고서가 모두 제출되면 학과 측 상태가 「최종 검토중」이 됩니다.',
    mutate: submitReport,
    render: (s) => detailScreen(s, 'STUDENT', null),
  },
  {
    actor: 'HEAD',
    menu: '학과내 최종승인',
    caption: '2-1. 학과장 포스터 심사',
    note: '학생이 업로드한 포스터 파일에 학과장이 접근해 확인·심사합니다.',
    render: (s) => detailScreen(s, 'HEAD', 'review-poster'),
  },
  {
    actor: 'HEAD',
    menu: '학과내 최종승인',
    caption: '포스터 심사 완료',
    note: '학과장이 포스터 심사를 완료했습니다. 다음으로 결과 보고서를 심사합니다.',
    mutate: reviewPoster,
    render: (s) => detailScreen(s, 'HEAD', 'review-report'),
  },
  {
    actor: 'HEAD',
    menu: '학과내 최종승인',
    caption: '2-2. 학과장 결과 보고서 심사',
    note: '학과장이 결과 보고서 내역을 검토·심사합니다.',
    mutate: reviewReport,
    render: (s) => detailScreen(s, 'HEAD', 'approve-final'),
  },
  {
    actor: 'HEAD',
    menu: '학과내 최종승인',
    caption: '3단계. 학과장 최종 승인',
    note: '포스터 심사 + 결과 보고서 심사가 모두 완료되어야 [최종 승인] 버튼이 활성화됩니다.',
    mutate: finalApprove,
    render: (s) => detailScreen(s, 'HEAD', null),
  },
  {
    actor: 'HEAD',
    menu: '학과내 최종승인',
    caption: '비교과 활동 완료 처리',
    note: "상태가 「최종 승인」(초록 도장)이 되고 활동 완료 처리됩니다. 워크플로우 종료([end]).",
    render: (s) => detailScreen(s, 'HEAD', null),
  },
  {
    actor: 'STUDENT',
    menu: '신청·제출',
    caption: '[토익] 학생이 토익 이수 정보를 등록',
    note: '응시일자·토익 수험번호·TOTAL 점수·발급번호 앞 6자리를 입력합니다.',
    render: () => toeicApplyForm(),
  },
  {
    actor: 'STAFF',
    menu: '토익 검토',
    caption: '[토익] 행정실에서 검토',
    note: '표 형식으로 정리된 토익 정보를 확인하고 YBM 성적 조회로 진위를 확인합니다.',
    render: () => toeicBallList('접수'),
  },
  {
    actor: 'STAFF',
    menu: '토익 검토',
    caption: '[토익] 승인 / 반려',
    note: '검토 후 승인 또는 반려합니다. 반려 시 학생이 재등록해야 하며 사유를 남깁니다.',
    render: () => toeicBallDetail('STAFF', 'approve'),
  },
  {
    actor: 'STAFF',
    menu: '토익 검토',
    caption: '[토익·반려 분기] 행정실 반려',
    note: "반려하면 상태는 '반려됨'이 되고 학생에게 재등록 액션이 돌아갑니다.",
    render: () => toeicBallDetail('STAFF', 'reject'),
  },
  {
    actor: 'STUDENT',
    menu: '신청·제출',
    caption: '[토익·반려 분기] 학생 재등록',
    note: "학생이 재등록하면 다시 '접수 / 검토중' 상태로 행정실 검토가 시작됩니다.",
    render: () => toeicBallDetail('STUDENT', 're-register'),
  },
  {
    actor: 'STAFF',
    menu: '토익 검토',
    caption: '[토익] 이수 인정 처리',
    note: '행정실이 승인하면 토익 이수 인정 처리로 종료됩니다.',
    render: () => toeicBallList('승인'),
  },
  {
    actor: 'STUDENT',
    menu: '신청·제출',
    caption: '[봉사] 학생이 전공 연계 봉사 활동 이력을 등록',
    note: '봉사 활동 기관·봉사 시간 등을 입력하고 봉사클럽 관련 발급 인증서를 업로드합니다.',
    render: () => volunteerBallForm(),
  },
  {
    actor: 'STAFF',
    menu: '봉사 검토',
    caption: '[봉사] 행정실에서 검토',
    note: '표 형식으로 정리된 이력과 업로드된 인증서를 확인합니다.',
    render: () => volunteerBallList('접수'),
  },
  {
    actor: 'STAFF',
    menu: '봉사 검토',
    caption: '[봉사] 승인 / 반려',
    note: '검토 후 승인 또는 반려합니다. 반려 시 학생이 재등록해야 하며 사유를 남깁니다.',
    render: () => volunteerBallDetail('STAFF', 'approve'),
  },
  {
    actor: 'STAFF',
    menu: '봉사 검토',
    caption: '[봉사·반려 분기] 행정실 반려',
    note: "반려하면 상태는 '반려됨'이 되고 학생에게 재등록 액션이 돌아갑니다.",
    render: () => volunteerBallDetail('STAFF', 'reject'),
  },
  {
    actor: 'STUDENT',
    menu: '신청·제출',
    caption: '[봉사·반려 분기] 학생 재등록',
    note: "학생이 재등록하면 다시 '접수 / 검토중' 상태로 행정실 검토가 시작됩니다.",
    render: () => volunteerBallDetail('STUDENT', 're-register'),
  },
  {
    actor: 'STAFF',
    menu: '봉사 검토',
    caption: '[봉사] 전공연계 봉사 시간 인정 처리',
    note: '행정실이 승인하면 전공연계 봉사 시간 인정 처리로 종료됩니다.',
    render: () => volunteerBallList('승인'),
  },
];

bootDeck<BallVM>({ program: 'Ball Passing Model', initial, steps });
