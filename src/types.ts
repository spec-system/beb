// 도메인 타입 정의 (프론트엔드 전용 목업)

export type Role = 'STUDENT' | 'PROFESSOR' | 'HEAD' | 'STAFF';

export const ROLE_LABEL: Record<Role, string> = {
  STUDENT: '학생',
  PROFESSOR: '담당교수',
  HEAD: '학과장',
  STAFF: '행정실',
};

export interface User {
  id: string;
  pw: string;
  role: Role;
  name: string;
  // 학생 계정 전용
  studentId?: string;
  grade?: string;
}

export type ProgramType = '학과내 비교과' | '토익' | '전공연계봉사활동';

// 학과내 비교과 다단계 승인 상태
export type DeptStatus =
  | '신청 완료'
  | '담당교수 승인'
  | '신청 승인됨'
  | '포스터 심사 중'
  | '결과 보고서 검토 중'
  | '최종 검토중'
  | '최종 승인'
  | '(담당교수에게) 반려됨'
  | '(학과장에게) 반려됨';

// 토익 / 봉사 승인 상태
export type SimpleStatus = '접수' | '1차 승인' | '최종 승인' | '검토중' | '승인' | '반려';

export interface TeamMember {
  studentId: string;
  name: string;
}

export interface FileMeta {
  name: string;
  size: number; // bytes
  uploadedAt: string;
}
export type DocumentKind = 'application' | 'result';

export interface DocumentStatus {
  application?: '전송됨';
  result?: '전송됨';
}


// 승인/전이 이력 (비파괴: 항상 append)
export interface HistoryEntry {
  step: string;      // 전이 결과 상태 또는 액션명
  actor: string;     // 수행자 이름
  role: Role;        // 수행자 역할
  at: string;        // ISO 타임스탬프
  reason?: string;   // 반려/취소 사유
}

// 이메일 알림 목업 (승인/반려 이벤트 시 학생에게 발송된 것으로 기록)
export interface EmailNotification {
  id: string;
  to: string;          // 수신 학번
  toName: string;      // 수신 학생명
  subject: string;
  body: string;
  createdAt: string;
  read: boolean;
}

// 학생 → 담당교수 쪽지 (목업)
export interface Message {
  id: string;
  fromId: string;       // 보낸 학생 학번
  fromName: string;     // 보낸 학생 이름
  toProfessor: string;  // 수신 교수 이름
  body: string;
  createdAt: string;
  read: boolean;
}

interface RecordBase {
  id: string;
  grade: string;
  studentId: string;
  name: string;
  year: string;
  semester: string;
  programType: ProgramType;
  professor: string;      // 담당교수 이름 (게이팅 키)
  lastUpdate: string;     // 최신순 정렬 키 (ISO)
  adminComment: string;   // 행정실 관리자 코멘트
  history: HistoryEntry[];
  documentStatus?: DocumentStatus;
}

export interface DeptProgramRecord extends RecordBase {
  programType: '학과내 비교과';
  title: string;
  plan: string;               // 계획서 (text)
  recognizedHours: number;
  status: DeptStatus;
  teamMembers: TeamMember[];
  reportFile: FileMeta | null; // 보고서 PDF (파일메타만)
  posterFile: FileMeta | null;   // 결과 포스터 파일 (학과장 심사 대상)
  posterReviewed: boolean;        // 학과장 포스터 심사 완료
  reportReviewed: boolean;        // 학과장 결과보고서 심사 완료
  draftSavedAt: string;           // 임시 저장 시각 (부가 기능)
  professorComment: string;
  finalApprovalDate: string;
}

export interface ToeicRecord extends RecordBase {
  programType: '토익';
  birthDate: string;
  testDate: string;
  testNumber: string;   // 수험번호 앞 6자리
  totalScore: number;
  issueNumber: string;
  validUntil: string;   // 성적표 유효기간 (응시일+2년)
  status: SimpleStatus;
  finalApprovalDate: string;
}

export interface VolunteerRecord extends RecordBase {
  programType: '전공연계봉사활동';
  title: string;
  recognizedHours: number;
  accumulatedHours: number;
  certFile: FileMeta | null; // 봉사 인증서 (파일메타만)
  status: SimpleStatus;
  finalApprovalDate: string;
}

export type AnyRecord = DeptProgramRecord | ToeicRecord | VolunteerRecord;

export interface BoardComment {
  id: string;
  postId: string;
  content: string;
  createdAt: string;
  authorId: string; // 작성자 판별용 (익명 표시하되 본인글 삭제용)
}

export interface BoardPost {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  authorId: string; // 작성자 판별용 (익명 표시하되 본인글 삭제용)
  views: number;
  comments: BoardComment[];
}
