import { Role, User, AnyRecord } from '../types';

// 화면(라우트) 접근 권한: 역할 → 접근 가능한 화면 키
export type ViewKey = 'integrated' | 'dept' | 'toeic' | 'volunteer' | 'stats';

export const VIEW_ACCESS: Record<Role, ViewKey[]> = {
  STUDENT: ['integrated', 'dept', 'toeic', 'volunteer', 'stats'],
  PROFESSOR: ['integrated', 'dept', 'toeic', 'volunteer', 'stats'],
  HEAD: ['integrated', 'dept', 'toeic', 'volunteer', 'stats'],
  STAFF: ['integrated', 'dept', 'toeic', 'volunteer', 'stats'],
};

export const canAccessView = (role: Role, view: ViewKey) => VIEW_ACCESS[role].includes(view);

// 레코드 가시성: 역할×소유 규칙 (역할×도메인 가시성 매트릭스의 단일 진실원천)
export function canView(user: User, record: AnyRecord): boolean {
  switch (user.role) {
    case 'STUDENT':
      return record.studentId === user.studentId;
    case 'PROFESSOR':
      return record.professor === user.name;
    case 'HEAD':
    case 'STAFF':
      return true;
    default:
      return false;
  }
}

// 액션 권한
export type ActionKind =
  | 'create'            // 학생: 등록/입력
  | 'approve_plan'      // 담당교수: 계획서 승인
  | 'submit_report'     // 학생: 보고서 제출
  | 'approve_report'    // 담당교수: 보고서 담당승인
  | 'approve_final'     // 학과장: 최종 승인
  | 'approve_simple'    // 학과장: 토익/봉사 승인
  | 'reject'            // 담당교수/학과장: 반려
  | 'cancel'            // 승인권자: 승인 취소
  | 'admin_comment';    // 행정실: 관리자 코멘트

export function can(user: User, action: ActionKind, record?: AnyRecord): boolean {
  const isOwnerProf = record ? record.professor === user.name : false;
  switch (action) {
    case 'create':
      return user.role === 'STUDENT';
    case 'submit_report':
      return user.role === 'STUDENT' && (record ? record.studentId === user.studentId : true);
    case 'approve_plan':
    case 'approve_report':
      return user.role === 'PROFESSOR' && isOwnerProf;
    case 'approve_final':
    case 'approve_simple':
      return user.role === 'HEAD';
    case 'reject':
      return (user.role === 'PROFESSOR' && isOwnerProf) || user.role === 'HEAD';
    case 'cancel':
      return (user.role === 'PROFESSOR' && isOwnerProf) || user.role === 'HEAD';
    case 'admin_comment':
      return user.role === 'STAFF';
    default:
      return false;
  }
}
