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
  | '계획서 접수'
  | '계획서 승인'
  | '보고서 접수'
  | '보고서 담당승인'
  | '최종 승인'
  | '반려';

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

// 승인/전이 이력 (비파괴: 항상 append)
export interface HistoryEntry {
  step: string;      // 전이 결과 상태 또는 액션명
  actor: string;     // 수행자 이름
  role: Role;        // 수행자 역할
  at: string;        // ISO 타임스탬프
  reason?: string;   // 반려/취소 사유
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
}

export interface DeptProgramRecord extends RecordBase {
  programType: '학과내 비교과';
  title: string;
  plan: string;               // 계획서 (text)
  recognizedHours: number;
  status: DeptStatus;
  teamMembers: TeamMember[];
  reportFile: FileMeta | null; // 보고서 PDF (파일메타만)
  posterSubmitted: boolean;     // 결과보고서 첫 페이지 포스터 제출 확인
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
