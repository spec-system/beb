import React, { useMemo, useState } from 'react';
import { useRecords } from '../store/recordsStore';
import { useAuth } from '../auth/AuthContext';
import { can, canView, canStudentEdit } from '../auth/roles';
import { DeptProgramRecord, TeamMember } from '../types';
import { PROFESSORS } from '../data/seed';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import FileDropField from '../components/ui/FileDropField';
import HistoryList from '../components/HistoryList';
import { Table, THead, Th, Td, TableEmpty } from '../components/ui/Table';
import { FieldGroup, Input, Textarea, Select } from '../components/ui/Field';
import { useToast } from '../components/ui/Toast';
import { Plus, Trash2, Eye } from 'lucide-react';

export default function DeptProgramView() {
  const { state, dispatch } = useRecords();
  const { user } = useAuth();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<DeptProgramRecord | null>(null);

  const rows = useMemo(
    () =>
      state.dept
        .filter((r) => (user ? canView(user, r) : false))
        .slice()
        .sort((a, b) => (a.lastUpdate < b.lastUpdate ? 1 : -1)),
    [state.dept, user],
  );

  if (!user) return null;
  const current = detail ? state.dept.find((r) => r.id === detail.id) ?? null : null;

  return (
    <div>
      <PageHeader
        title={user.role === 'STUDENT' ? '학과내 비교과 신청·제출' : user.role === 'PROFESSOR' ? '학과내 목록' : user.role === 'STAFF' ? '학과내 관리자 코멘트' : '학과내 최종승인'}
        sub="이수현황"
        right={can(user, 'create') && <Button onClick={() => setCreateOpen(true)}><Plus size={16} /> 신규 등록</Button>}
      />

      <Table>
        <THead>
          <Th>제목</Th><Th>학번</Th><Th>이름</Th><Th>학기</Th><Th>인정시간</Th><Th>담당교수</Th><Th>진행상태</Th><Th>비고</Th><Th>최종 승인일</Th><Th></Th>
        </THead>
        <tbody data-testid="dept-tbody">
          {rows.length === 0 ? (
            <TableEmpty colSpan={10} message="등록된 학과내 비교과가 없습니다." />
          ) : (
            rows.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <Td className="text-slate-800 font-medium">{r.title}</Td>
                <Td className="text-slate-600">{r.studentId}</Td>
                <Td className="text-slate-700">{r.name}</Td>
                <Td className="text-slate-600">{r.semester}</Td>
                <Td className="text-slate-600">{r.recognizedHours}h</Td>
                <Td className="text-slate-600">{r.professor}</Td>
                <Td><Badge status={r.status} /></Td>
                <Td className="max-w-[160px] truncate text-xs text-slate-500"><span title={r.adminComment || ''}>{r.adminComment || '-'}</span></Td>
                <Td className="text-slate-500 text-xs">{r.finalApprovalDate || '-'}</Td>
                <Td>
                  <Button variant="ghost" size="sm" onClick={() => setDetail(r)} data-testid={`dept-detail-${r.id}`}><Eye size={14} /> 상세</Button>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
      <p className="text-sm text-slate-500 mt-3">총 {rows.length}건</p>

      {createOpen && <CreateModal onClose={() => setCreateOpen(false)} />}
      {current && <DetailModal record={current} onClose={() => setDetail(null)} />}
    </div>
  );
}

function CreateModal({ onClose }: { onClose: () => void }) {
  const { dispatch } = useRecords();
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [semester, setSemester] = useState('1학기');
  const [professor, setProfessor] = useState(PROFESSORS[0]);
  const [hours, setHours] = useState('10');
  const [plan, setPlan] = useState('');
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [tmSid, setTmSid] = useState('');
  const [tmName, setTmName] = useState('');

  if (!user) return null;

  const addMember = () => {
    if (!tmSid.trim() || !tmName.trim()) return;
    setTeam((prev) => [...prev, { studentId: tmSid.trim(), name: tmName.trim() }]);
    setTmSid(''); setTmName('');
  };
  const removeMember = (i: number) => setTeam((prev) => prev.filter((_, idx) => idx !== i));

  const submit = () => {
    if (!title.trim() || !plan.trim()) {
      toast('제목과 계획서를 입력하세요.', 'error');
      return;
    }
    dispatch({
      type: 'CREATE_DEPT',
      actor: { name: user.name, role: user.role },
      payload: {
        programType: '학과내 비교과',
        grade: user.grade ?? '3학년',
        studentId: user.studentId ?? '',
        name: user.name,
        year: '2026',
        semester,
        professor,
        title: title.trim(),
        plan: plan.trim(),
        recognizedHours: Number(hours) || 0,
        teamMembers: team,
        reportFile: null,
        posterSubmitted: false,
        professorComment: '',
        finalApprovalDate: '',
        adminComment: '',
      },
    });
    toast('학과내 비교과를 등록했습니다. (계획서 접수)');
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="학과내 비교과 신규 등록"
      footer={<><Button variant="secondary" onClick={onClose}>취소</Button><Button onClick={submit} data-testid="dept-create-submit">등록</Button></>}
    >
      <div className="flex flex-col gap-4">
        <FieldGroup label="프로그램 제목">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 신약개발 연구 세미나" data-testid="dept-title" />
        </FieldGroup>
        <div className="grid grid-cols-3 gap-3">
          <FieldGroup label="학기">
            <Select value={semester} onChange={(e) => setSemester(e.target.value)}>
              {['1학기', '2학기', '여름학기', '겨울학기'].map((s) => <option key={s}>{s}</option>)}
            </Select>
          </FieldGroup>
          <FieldGroup label="담당교수">
            <Input list="dept-professor-options" value={professor} onChange={(e) => setProfessor(e.target.value)} placeholder="교수명 검색 또는 직접입력" />
            <datalist id="dept-professor-options">
              {PROFESSORS.map((p) => <option key={p} value={p} />)}
            </datalist>
          </FieldGroup>
          <FieldGroup label="인정시간">
            <Input type="number" value={hours} onChange={(e) => setHours(e.target.value)} />
          </FieldGroup>
        </div>
        <FieldGroup label="계획서 (text)">
          <Textarea rows={4} value={plan} onChange={(e) => setPlan(e.target.value)} placeholder="프로그램 계획을 입력하세요" data-testid="dept-plan" />
        </FieldGroup>

        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">팀원 (대표학생 외)</p>
          <div className="flex gap-2 mb-2">
            <Input value={tmSid} onChange={(e) => setTmSid(e.target.value)} placeholder="학번" />
            <Input value={tmName} onChange={(e) => setTmName(e.target.value)} placeholder="이름" />
            <Button variant="secondary" size="sm" onClick={addMember}>추가</Button>
          </div>
          {team.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {team.map((m, i) => (
                <li key={i} className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                  {m.name} ({m.studentId})
                  <button onClick={() => removeMember(i)} className="text-slate-400 hover:text-red-600"><Trash2 size={12} /></button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}

function DetailModal({ record, onClose }: { record: DeptProgramRecord; onClose: () => void }) {
  const { dispatch } = useRecords();
  const { user } = useAuth();
  const { toast } = useToast();
  const [adminComment, setAdminComment] = useState(record.adminComment);
  const [professorComment, setProfessorComment] = useState(record.professorComment);
  const [reject, setReject] = useState(false);
  const [cancel, setCancel] = useState(false);
  const actor = user ? { name: user.name, role: user.role } : null;
  if (!user || !actor) return null;

  const isOwnerStudent = record.studentId === user.studentId;
  const latestRejectReason = [...record.history].reverse().find((h) => h.step === '반려' && h.reason)?.reason;
  const hasPoster = Boolean(record.posterSubmitted);

  const act = (fn: () => void, msg: string) => { fn(); toast(msg); };

  

  return (
    <Modal open onClose={onClose} title={record.title} width="max-w-3xl">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3 text-sm">
          <Row k="학생" v={`${record.name} (${record.studentId}) · ${record.grade}`} />
          <Row k="학기" v={`${record.year} ${record.semester}`} />
          <Row k="담당교수" v={record.professor} />
          <Row k="인정시간" v={`${record.recognizedHours}시간`} />
          <Row k="진행상태" v={<Badge status={record.status} />} />
          <Row k="팀원" v={record.teamMembers.length ? record.teamMembers.map((m) => `${m.name}(${m.studentId})`).join(', ') : '없음'} />
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">계획서</p>
            <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 border border-slate-200 whitespace-pre-wrap">{record.plan}</p>
          </div>
          {record.professorComment && <Row k="담당교수 코멘트" v={record.professorComment} />}
          {record.adminComment && <Row k="행정실 코멘트" v={record.adminComment} />}
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">보고서 (PDF)</p>
            {(record.status === '계획서 승인' || record.status === '반려') && can(user, 'submit_report', record) && isOwnerStudent ? (
              <FileDropField
                value={record.reportFile}
                accept="application/pdf"
                hint="서명 페이지 1장 + 발표포스터 1장 합본 PDF"
                onSelect={(file) => {
                  if (!file.name.toLowerCase().endsWith('.pdf')) {
                    toast('결과보고서는 단일 PDF 파일만 업로드할 수 있습니다.', 'error');
                    return;
                  }
                  act(
                    () => dispatch({ type: 'SUBMIT_REPORT', id: record.id, file, actor }),
                    '보고서를 제출했습니다. (보고서 접수)',
                  );
                }}
              />
            ) : record.reportFile ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                {record.reportFile.name}
              </div>
            ) : (
              <p className="text-xs text-slate-400">아직 보고서가 제출되지 않았습니다.</p>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 space-y-2">
            <Row k="보고서 파일" v={record.reportFile ? `${record.reportFile.name} · ${Math.round(record.reportFile.size / 1024)}KB` : '미제출'} />
            <Row k="포스터 확인" v={hasPoster ? '확인됨' : '미확인'} />
            <Row k="최신 반려사유" v={latestRejectReason || '-'} />
          </div>

          {/* 액션 버튼 (역할 게이팅) */}
          <div className="flex flex-wrap gap-2">
            {record.status === '계획서 접수' && can(user, 'approve_plan', record) && (
              <Button variant="success" size="sm" data-testid="approve-plan"
                onClick={() => act(() => dispatch({ type: 'APPROVE_PLAN', id: record.id, actor }), '계획서를 승인했습니다.')}>
                계획서 승인
              </Button>
            )}
            {record.status === '보고서 접수' && can(user, 'approve_report', record) && (
              <label className="flex w-full items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={hasPoster}
                  onChange={(e) => act(() => dispatch({ type: 'SET_POSTER_SUBMITTED', id: record.id, checked: e.target.checked, actor }), e.target.checked ? '포스터 제출을 확인했습니다.' : '포스터 제출 확인을 해제했습니다.')}
                />
                결과보고서 첫 페이지 포스터 제출 여부 확인
              </label>
            )}
            {record.status === '보고서 접수' && can(user, 'approve_report', record) && (
              <Button variant="success" size="sm" data-testid="approve-report" disabled={!hasPoster}
                onClick={() => act(() => dispatch({ type: 'APPROVE_REPORT_PROFESSOR', id: record.id, comment: professorComment, actor }), '보고서를 담당승인했습니다.')}>
                보고서 담당승인
              </Button>
            )}
            {record.status === '보고서 담당승인' && can(user, 'approve_final', record) && (
              <Button variant="success" size="sm" data-testid="approve-final"
                onClick={() => act(() => dispatch({ type: 'APPROVE_FINAL_HEAD', id: record.id, actor }), '최종 승인했습니다.')}>
                학과장 최종승인
              </Button>
            )}
            {can(user, 'reject', record) && record.status !== '최종 승인' && record.status !== '반려' && (
              <Button variant="danger" size="sm" onClick={() => setReject(true)}>반려</Button>
            )}
            {can(user, 'cancel', record) && (record.status === '최종 승인' || record.status === '보고서 담당승인' || record.status === '계획서 승인' || record.status === '보고서 접수') && (
              <Button variant="secondary" size="sm" onClick={() => setCancel(true)}>승인 취소</Button>
            )}

            {record.status === '반려' && canStudentEdit(user, record) && (
              <Button variant="secondary" size="sm" onClick={() => act(() => dispatch({ type: 'RESUBMIT_DEPT', id: record.id, actor }), '재제출했습니다.')}>재제출</Button>
            )}
            {can(user, 'admin_comment', record) && (
              <div className="w-full mt-2">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">행정실 코멘트</p>
                <div className="flex gap-2">
                  <Input value={adminComment} onChange={(e) => setAdminComment(e.target.value)} placeholder="비고 코멘트 입력" />
                  <Button size="sm" onClick={() => act(() => dispatch({ type: 'SET_ADMIN_COMMENT', domain: 'dept', id: record.id, comment: adminComment, actor }), '코멘트를 저장했습니다.')}>저장</Button>
                </div>
              </div>
            )}
            {record.status === '보고서 접수' && can(user, 'approve_report', record) && (
              <div className="w-full">
                <Textarea rows={2} value={professorComment} onChange={(e) => setProfessorComment(e.target.value)} placeholder="담당교수 코멘트 (선택)" />
              </div>
            )}
          </div>

          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">진행 이력</p>
            <HistoryList history={record.history} />
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={reject} title="반려" message="이 프로그램을 반려합니다. 사유를 입력하세요." confirmLabel="반려" variant="danger" withReason
        onClose={() => setReject(false)}
        onConfirm={(reason) => { dispatch({ type: 'REJECT_DEPT', id: record.id, reason: reason ?? '', actor }); toast('반려 처리했습니다.', 'info'); setReject(false); }}
      />
      <ConfirmDialog
        open={cancel} title="승인 취소" message="최종 승인 건을 직전 단계로 되돌립니다. 계속할까요?" confirmLabel="승인 취소" variant="secondary"
        onClose={() => setCancel(false)}
        onConfirm={() => { dispatch({ type: 'CANCEL_DEPT', id: record.id, actor }); toast('승인을 취소했습니다.', 'info'); setCancel(false); }}
      />
    </Modal>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider w-24 shrink-0 pt-0.5">{k}</span>
      <span className="text-sm text-slate-700">{v}</span>
    </div>
  );
}
