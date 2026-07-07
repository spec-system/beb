import { Role, User, AnyRecord } from '../types';

// 화면(라우트) 접근 권한: 역할 → 접근 가능한 화면 키
export type ViewKey = 'integrated' | 'submit' | 'dept' | 'toeic' | 'volunteer' | 'stats' | 'settings' | 'board';

export const VIEW_ACCESS: Record<Role, ViewKey[]> = {
  STUDENT: ['integrated', 'submit', 'dept', 'toeic', 'volunteer', 'board'],
  PROFESSOR: ['integrated', 'dept', 'toeic', 'volunteer'],
  HEAD: ['integrated', 'dept', 'toeic', 'volunteer', 'stats', 'settings'],
  STAFF: ['integrated', 'dept', 'toeic', 'volunteer', 'settings'],
};

export const canAccessView = (role: Role, view: ViewKey) => VIEW_ACCESS[role].includes(view);

export const isAssignedProfessor = (user: User, record: AnyRecord): boolean =>
  user.role === 'PROFESSOR' && record.professor === user.name;

export const isOwnRecord = (user: User, record: AnyRecord): boolean =>
  user.role === 'STUDENT' && record.studentId === user.studentId;

export const isFinalApproved = (record: AnyRecord): boolean => {
  if (record.programType === '학과내 비교과') return record.status === '최종 승인';
  return record.status === '최종 승인' || record.status === '승인';
};

export const canStudentEdit = (user: User, record: AnyRecord): boolean =>
  isOwnRecord(user, record) && !isFinalApproved(record);

// 레코드 가시성: 학생=본인, 담당교수=record.professor 배정 건, 학과장/행정실=전체
export function canView(user: User, record: AnyRecord): boolean {
  switch (user.role) {
    case 'STUDENT':
      return record.studentId === user.studentId;
    case 'PROFESSOR':
      return true;
    case 'HEAD':
    case 'STAFF':
      return true;
    default:
      return false;
  }
}

// 액션 권한: spec의 메뉴·데이터·버튼 권한표의 단일 진실원천
export type ActionKind =
  | 'create'
  | 'edit'
  | 'submit_report'
  | 'approve_plan'
  | 'approve_report'
  | 'approve_first'
  | 'approve_final'
  | 'approve_simple'
  | 'reject'
  | 'cancel'
  | 'admin_comment';

export function can(user: User, action: ActionKind, record?: AnyRecord): boolean {
  const assigned = record ? isAssignedProfessor(user, record) : false;
  const ownEditable = record ? canStudentEdit(user, record) : user.role === 'STUDENT';

  switch (action) {
    case 'create':
      return user.role === 'STUDENT';
    case 'edit':
    case 'submit_report':
      return ownEditable;
    case 'approve_plan':
    case 'approve_report':
    case 'approve_first':
      return assigned;
    case 'approve_final':
    case 'approve_simple':
      return user.role === 'HEAD';
    case 'reject':
      return assigned || user.role === 'HEAD';
    case 'cancel':
      return user.role === 'HEAD' && (!record || isFinalApproved(record));
    case 'admin_comment':
      return user.role === 'STAFF';
    default:
      return false;
  }
}
