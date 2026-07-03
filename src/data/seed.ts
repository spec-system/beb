import {
  User,
  DeptProgramRecord,
  ToeicRecord,
  VolunteerRecord,
  HistoryEntry,
} from '../types';

// ---- 로그인 계정 (하드코딩, 프론트엔드 목업) ----
export const USERS: User[] = [
  { id: 'student', pw: 'student', role: 'STUDENT', name: '김지혜', studentId: '20231234', grade: '3학년' },
  { id: 'professor', pw: 'professor', role: 'PROFESSOR', name: '김희진' },
  { id: 'head', pw: 'head', role: 'HEAD', name: '이도현' },
  { id: 'staff', pw: 'staff', role: 'STAFF', name: '박행정' },
];

export const PROFESSORS = ['김희진', '이도현', '박선영'];

const h = (step: string, actor: string, role: HistoryEntry['role'], at: string, reason?: string): HistoryEntry =>
  ({ step, actor, role, at, reason });

// ---- 학생 명부 (통계·조회용) ----
export interface StudentInfo {
  studentId: string;
  name: string;
  grade: string;
}
export const STUDENTS: StudentInfo[] = [
  { studentId: '20231234', name: '김지혜', grade: '3학년' },
  { studentId: '20231235', name: '이우진', grade: '3학년' },
  { studentId: '20231236', name: '박소영', grade: '3학년' },
  { studentId: '20231237', name: '정민호', grade: '3학년' },
  { studentId: '20231238', name: '최유나', grade: '3학년' },
  { studentId: '20231239', name: '강도윤', grade: '3학년' },
  { studentId: '20221201', name: '한서진', grade: '4학년' },
  { studentId: '20221202', name: '오지훈', grade: '4학년' },
  { studentId: '20221203', name: '윤채원', grade: '4학년' },
  { studentId: '20221204', name: '임현우', grade: '4학년' },
  { studentId: '20241101', name: '신아름', grade: '2학년' },
  { studentId: '20241102', name: '조은결', grade: '2학년' },
  { studentId: '20241103', name: '배수빈', grade: '2학년' },
  { studentId: '20241104', name: '문재원', grade: '2학년' },
];

const sInfo = (sid: string) => STUDENTS.find((s) => s.studentId === sid)!;

let deptSeq = 0;
const dept = (
  sid: string,
  title: string,
  status: DeptProgramRecord['status'],
  professor: string,
  semester: string,
  recognizedHours: number,
  opts: Partial<DeptProgramRecord> = {},
): DeptProgramRecord => {
  const s = sInfo(sid);
  deptSeq += 1;
  return {
    id: `d${deptSeq}`,
    programType: '학과내 비교과',
    grade: s.grade,
    studentId: s.studentId,
    name: s.name,
    year: '2026',
    semester,
    professor,
    title,
    plan: opts.plan ?? `${title} 수행 계획: 팀 구성 후 주제 조사, 중간 점검, 결과 발표 순으로 진행합니다.`,
    recognizedHours,
    status,
    teamMembers: opts.teamMembers ?? [],
    reportFile: opts.reportFile ?? null,
    posterSubmitted: opts.posterSubmitted ?? (Boolean(opts.reportFile) && status !== '보고서 접수'),
    professorComment: opts.professorComment ?? '',
    finalApprovalDate: opts.finalApprovalDate ?? '',
    adminComment: opts.adminComment ?? '',
    lastUpdate: opts.lastUpdate ?? '2026-05-01T09:00:00',
    history: opts.history ?? [],
  };
};

// 상태 0/25/50/100 분포가 통계에 반영되도록 다양화
export const SEED_DEPT: DeptProgramRecord[] = [
  dept('20231234', '신약개발 연구 세미나', '최종 승인', '김희진', '1학기', 10, {
    teamMembers: [{ studentId: '20231235', name: '이우진' }, { studentId: '20231236', name: '박소영' }],
    reportFile: { name: '신약개발_결과보고서.pdf', size: 482000, uploadedAt: '2026-05-18T10:00:00' },
    professorComment: '우수하게 수행함.',
    finalApprovalDate: '2026-05-20',
    lastUpdate: '2026-05-20T14:20:00',
    history: [
      h('계획서 접수', '김지혜', 'STUDENT', '2026-03-02T09:00:00'),
      h('계획서 승인', '김희진', 'PROFESSOR', '2026-03-05T11:00:00'),
      h('보고서 접수', '김지혜', 'STUDENT', '2026-05-18T10:00:00'),
      h('보고서 담당승인', '김희진', 'PROFESSOR', '2026-05-19T13:00:00'),
      h('최종 승인', '이도현', 'HEAD', '2026-05-20T14:20:00'),
    ],
  }),
  dept('20231236', '지역사회 약국 실무실습', '보고서 접수', '이도현', '1학기', 20, {
    reportFile: { name: '약국실습_보고서.pdf', size: 610000, uploadedAt: '2026-06-09T16:00:00' },
    lastUpdate: '2026-06-10T09:15:00',
    history: [
      h('계획서 접수', '박소영', 'STUDENT', '2026-03-03T09:00:00'),
      h('계획서 승인', '이도현', 'PROFESSOR', '2026-03-06T10:00:00'),
      h('보고서 접수', '박소영', 'STUDENT', '2026-06-09T16:00:00'),
    ],
  }),
  dept('20231237', '임상약학 케이스 스터디', '계획서 승인', '김희진', '1학기', 15, {
    lastUpdate: '2026-04-02T11:30:00',
    history: [
      h('계획서 접수', '정민호', 'STUDENT', '2026-03-30T09:00:00'),
      h('계획서 승인', '김희진', 'PROFESSOR', '2026-04-02T11:30:00'),
    ],
  }),
  dept('20231238', '제약 GMP 현장 탐방', '계획서 접수', '박선영', '2학기', 8, {
    lastUpdate: '2026-09-01T09:00:00',
    history: [h('계획서 접수', '최유나', 'STUDENT', '2026-09-01T09:00:00')],
  }),
  dept('20221201', '천연물 신약 탐색 프로젝트', '최종 승인', '박선영', '1학기', 12, {
    reportFile: { name: '천연물_보고서.pdf', size: 520000, uploadedAt: '2026-05-25T10:00:00' },
    finalApprovalDate: '2026-05-28',
    lastUpdate: '2026-05-28T15:00:00',
    history: [
      h('계획서 접수', '한서진', 'STUDENT', '2026-03-02T09:00:00'),
      h('계획서 승인', '박선영', 'PROFESSOR', '2026-03-04T10:00:00'),
      h('보고서 접수', '한서진', 'STUDENT', '2026-05-25T10:00:00'),
      h('보고서 담당승인', '박선영', 'PROFESSOR', '2026-05-26T13:00:00'),
      h('최종 승인', '이도현', 'HEAD', '2026-05-28T15:00:00'),
    ],
  }),
  dept('20221203', '약물상담 롤플레이 워크숍', '보고서 담당승인', '김희진', '2학기', 10, {
    reportFile: { name: '롤플레이_보고서.pdf', size: 390000, uploadedAt: '2026-10-10T10:00:00' },
    professorComment: '학과장 최종 승인 요청.',
    lastUpdate: '2026-10-12T13:00:00',
    history: [
      h('계획서 접수', '윤채원', 'STUDENT', '2026-09-05T09:00:00'),
      h('계획서 승인', '김희진', 'PROFESSOR', '2026-09-08T10:00:00'),
      h('보고서 접수', '윤채원', 'STUDENT', '2026-10-10T10:00:00'),
      h('보고서 담당승인', '김희진', 'PROFESSOR', '2026-10-12T13:00:00'),
    ],
  }),
  dept('20241101', '기초 약리학 스터디그룹', '반려', '박선영', '1학기', 6, {
    lastUpdate: '2026-04-15T10:00:00',
    history: [
      h('계획서 접수', '신아름', 'STUDENT', '2026-04-10T09:00:00'),
      h('반려', '박선영', 'PROFESSOR', '2026-04-15T10:00:00', '계획서 내용 보완 필요 (목표·일정 구체화).'),
    ],
  }),
];

let toeicSeq = 0;
const toeic = (
  sid: string,
  score: number,
  status: ToeicRecord['status'],
  opts: Partial<ToeicRecord> = {},
): ToeicRecord => {
  const s = sInfo(sid);
  toeicSeq += 1;
  const testDate = opts.testDate ?? '2026-09-14';
  return {
    id: `t${toeicSeq}`,
    programType: '토익',
    grade: s.grade,
    studentId: s.studentId,
    name: s.name,
    year: '2026',
    semester: opts.semester ?? '2학기',
    professor: opts.professor ?? '이도현',
    birthDate: opts.birthDate ?? '2002-03-11',
    testDate,
    testNumber: opts.testNumber ?? '482913',
    totalScore: score,
    issueNumber: opts.issueNumber ?? '20260914-0021',
    validUntil: opts.validUntil ?? '2028-09-14',
    status,
    finalApprovalDate: opts.finalApprovalDate ?? '',
    adminComment: opts.adminComment ?? '',
    lastUpdate: opts.lastUpdate ?? '2026-09-20T10:00:00',
    history: opts.history ?? [],
  };
};

export const SEED_TOEIC: ToeicRecord[] = [
  toeic('20231234', 880, '최종 승인', {
    finalApprovalDate: '2026-09-22',
    lastUpdate: '2026-09-22T11:00:00',
    history: [
      h('접수', '김지혜', 'STUDENT', '2026-09-20T10:00:00'),
      h('최종 승인', '이도현', 'HEAD', '2026-09-22T11:00:00'),
    ],
  }),
  toeic('20231235', 720, '접수', {
    lastUpdate: '2026-10-01T09:00:00',
    history: [h('접수', '이우진', 'STUDENT', '2026-10-01T09:00:00')],
  }),
  toeic('20231236', 910, '최종 승인', {
    finalApprovalDate: '2026-09-25',
    lastUpdate: '2026-09-25T14:00:00',
    history: [
      h('접수', '박소영', 'STUDENT', '2026-09-23T10:00:00'),
      h('최종 승인', '이도현', 'HEAD', '2026-09-25T14:00:00'),
    ],
  }),
  toeic('20221201', 650, '반려', {
    lastUpdate: '2026-08-30T10:00:00',
    adminComment: 'YBM 조회 결과 진위 불확실 — 성적표 원본 요구.',
    history: [
      h('접수', '한서진', 'STUDENT', '2026-08-28T10:00:00'),
      h('반려', '이도현', 'HEAD', '2026-08-30T10:00:00', '성적표 원본 확인 필요.'),
    ],
  }),
  toeic('20221203', 830, '최종 승인', {
    finalApprovalDate: '2026-07-05',
    lastUpdate: '2026-07-05T13:00:00',
    history: [
      h('접수', '윤채원', 'STUDENT', '2026-07-01T10:00:00'),
      h('최종 승인', '이도현', 'HEAD', '2026-07-05T13:00:00'),
    ],
  }),
];

let volSeq = 0;
const vol = (
  sid: string,
  title: string,
  status: VolunteerRecord['status'],
  recognizedHours: number,
  accumulatedHours: number,
  opts: Partial<VolunteerRecord> = {},
): VolunteerRecord => {
  const s = sInfo(sid);
  volSeq += 1;
  return {
    id: `v${volSeq}`,
    programType: '전공연계봉사활동',
    grade: s.grade,
    studentId: s.studentId,
    name: s.name,
    year: '2026',
    semester: opts.semester ?? '2학기',
    professor: opts.professor ?? '김희진',
    title,
    recognizedHours,
    accumulatedHours,
    certFile: opts.certFile ?? null,
    status,
    finalApprovalDate: opts.finalApprovalDate ?? '',
    adminComment: opts.adminComment ?? '',
    lastUpdate: opts.lastUpdate ?? '2026-10-01T09:00:00',
    history: opts.history ?? [],
  };
};

export const SEED_VOLUNTEER: VolunteerRecord[] = [
  vol('20231234', '어르신 복약지도 봉사', '최종 승인', 8, 22, {
    certFile: { name: '복약지도_인증서.pdf', size: 210000, uploadedAt: '2026-09-30T10:00:00' },
    finalApprovalDate: '2026-10-02',
    lastUpdate: '2026-10-02T11:00:00',
    history: [
      h('접수', '김지혜', 'STUDENT', '2026-09-30T10:00:00'),
      h('최종 승인', '이도현', 'HEAD', '2026-10-02T11:00:00'),
    ],
  }),
  vol('20231235', '지역아동센터 건강교실', '1차 승인', 6, 6, {
    certFile: { name: '건강교실_인증서.pdf', size: 180000, uploadedAt: '2026-10-18T09:00:00' },
    lastUpdate: '2026-10-20T09:15:00',
    adminComment: '인증서 서명 확인 요망.',
    history: [h('접수', '이우진', 'STUDENT', '2026-10-18T09:00:00')],
  }),
  vol('20231236', '보건소 금연클리닉 지원', '최종 승인', 12, 24, {
    certFile: { name: '금연클리닉_인증서.pdf', size: 240000, uploadedAt: '2026-06-01T10:00:00' },
    finalApprovalDate: '2026-06-03',
    lastUpdate: '2026-06-03T13:00:00',
    history: [
      h('접수', '박소영', 'STUDENT', '2026-06-01T10:00:00'),
      h('최종 승인', '이도현', 'HEAD', '2026-06-03T13:00:00'),
    ],
  }),
  vol('20221201', '헌혈 캠페인 운영 봉사', '최종 승인', 4, 10, {
    certFile: { name: '헌혈캠페인_인증서.pdf', size: 150000, uploadedAt: '2026-05-10T10:00:00' },
    finalApprovalDate: '2026-05-12',
    lastUpdate: '2026-05-12T10:00:00',
    history: [
      h('접수', '한서진', 'STUDENT', '2026-05-10T10:00:00'),
      h('최종 승인', '이도현', 'HEAD', '2026-05-12T10:00:00'),
    ],
  }),
  vol('20241101', '약물 오남용 예방 캠페인', '접수', 5, 5, {
    lastUpdate: '2026-10-22T09:00:00',
    history: [h('접수', '신아름', 'STUDENT', '2026-10-22T09:00:00')],
  }),
];
