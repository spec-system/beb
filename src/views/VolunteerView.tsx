import React, { useMemo, useState } from 'react';
import { useRecords } from '../store/recordsStore';
import { useAuth } from '../auth/AuthContext';
import { can, canView } from '../auth/roles';
import { VolunteerRecord } from '../types';
import { PROFESSORS } from '../data/seed';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import FileDropField from '../components/ui/FileDropField';
import HistoryList from '../components/HistoryList';
import { Table, THead, Th, Td, TableEmpty } from '../components/ui/Table';
import { FieldGroup, Input, Select } from '../components/ui/Field';
import { useToast } from '../components/ui/Toast';
import { Plus, Eye } from 'lucide-react';

export default function VolunteerView() {
  const { state } = useRecords();
  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<VolunteerRecord | null>(null);

  const rows = useMemo(
    () => state.volunteer.filter((r) => (user ? canView(user, r) : false)).slice().sort((a, b) => (a.lastUpdate < b.lastUpdate ? 1 : -1)),
    [state.volunteer, user],
  );
  if (!user) return null;
  const current = detail ? state.volunteer.find((r) => r.id === detail.id) ?? null : null;

  return (
    <div>
      <PageHeader title="전공연계봉사활동" sub="봉사 이수현황" right={can(user, 'create') && <Button onClick={() => setCreateOpen(true)}><Plus size={16} /> 봉사 등록</Button>} />

      <Table>
        <THead>
          <Th>봉사활동명</Th><Th>학번</Th><Th>이름</Th><Th>학기</Th><Th>인정시간</Th><Th>누적시간</Th><Th>진행상태</Th><Th>최종 승인일</Th><Th></Th>
        </THead>
        <tbody data-testid="vol-tbody">
          {rows.length === 0 ? (
            <TableEmpty colSpan={9} message="등록된 봉사활동이 없습니다." />
          ) : (
            rows.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <Td className="text-slate-800 font-medium">{r.title}</Td>
                <Td className="text-slate-600">{r.studentId}</Td>
                <Td className="text-slate-700">{r.name}</Td>
                <Td className="text-slate-600">{r.semester}</Td>
                <Td className="text-slate-600">{r.recognizedHours}h</Td>
                <Td className="text-slate-800 font-semibold">{r.accumulatedHours}h</Td>
                <Td><Badge status={r.status} /></Td>
                <Td className="text-slate-500 text-xs">{r.finalApprovalDate || '-'}</Td>
                <Td><Button variant="ghost" size="sm" onClick={() => setDetail(r)}><Eye size={14} /> 상세</Button></Td>
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
  const [semester, setSemester] = useState('2학기');
  const [professor, setProfessor] = useState(PROFESSORS[0]);
  const [hours, setHours] = useState('8');
  if (!user) return null;

  const submit = () => {
    if (!title.trim()) { toast('봉사활동명을 입력하세요.', 'error'); return; }
    dispatch({
      type: 'CREATE_VOLUNTEER',
      actor: { name: user.name, role: user.role },
      payload: {
        programType: '전공연계봉사활동', grade: user.grade ?? '3학년', studentId: user.studentId ?? '', name: user.name,
        year: '2026', semester, professor, title: title.trim(), recognizedHours: Number(hours) || 0,
        accumulatedHours: Number(hours) || 0, certFile: null, finalApprovalDate: '', adminComment: '',
      },
    });
    toast('봉사활동을 등록했습니다. (접수)');
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="전공연계봉사활동 등록" footer={<><Button variant="secondary" onClick={onClose}>취소</Button><Button onClick={submit} data-testid="vol-create-submit">등록</Button></>}>
      <div className="flex flex-col gap-4">
        <FieldGroup label="봉사활동명"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 어르신 복약지도 봉사" data-testid="vol-title" /></FieldGroup>
        <div className="grid grid-cols-3 gap-3">
          <FieldGroup label="학기"><Select value={semester} onChange={(e) => setSemester(e.target.value)}>{['1학기', '2학기', '여름학기', '겨울학기'].map((s) => <option key={s}>{s}</option>)}</Select></FieldGroup>
          <FieldGroup label="담당교수"><Select value={professor} onChange={(e) => setProfessor(e.target.value)}>{PROFESSORS.map((p) => <option key={p}>{p}</option>)}</Select></FieldGroup>
          <FieldGroup label="인정시간"><Input type="number" value={hours} onChange={(e) => setHours(e.target.value)} /></FieldGroup>
        </div>
        <p className="text-xs text-slate-400">인증서는 등록 후 상세 화면에서 업로드(파일 선택)합니다.</p>
      </div>
    </Modal>
  );
}

function DetailModal({ record, onClose }: { record: VolunteerRecord; onClose: () => void }) {
  const { dispatch } = useRecords();
  const { user } = useAuth();
  const { toast } = useToast();
  const [comment, setComment] = useState(record.adminComment);
  const [reject, setReject] = useState(false);
  if (!user) return null;
  const actor = { name: user.name, role: user.role };
  const isOwnerStudent = record.studentId === user.studentId;
  const pct = Math.min(record.accumulatedHours / 20, 1) * 100;

  return (
    <Modal open onClose={onClose} title={record.title} width="max-w-2xl">
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4">
        <Row k="학생" v={`${record.name} (${record.studentId})`} />
        <Row k="학기" v={`${record.year} ${record.semester}`} />
        <Row k="담당교수" v={record.professor} />
        <Row k="인정시간" v={`${record.recognizedHours}시간`} />
        <Row k="누적시간" v={`${record.accumulatedHours}시간 (20시간 대비 ${pct.toFixed(0)}%)`} />
        <Row k="진행상태" v={<Badge status={record.status} />} />
      </div>

      <div className="mb-4">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">봉사 인증서</p>
        {can(user, 'submit_report', record) && isOwnerStudent && record.status !== '승인' ? (
          <FileDropField
            value={record.certFile}
            accept="application/pdf,image/*"
            hint="담당교수 서명이 있는 인증서 (스캔 PDF/이미지)"
            onSelect={(file) => {
              dispatch({ type: 'UPLOAD_CERT', id: record.id, file, actor }); toast('인증서를 업로드했습니다.'); // no-op guard removed below
            }}
          />
        ) : record.certFile ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">{record.certFile.name}</div>
        ) : (
          <p className="text-xs text-slate-400">아직 인증서가 업로드되지 않았습니다.</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
        {(record.status === '접수' || record.status === '검토중') && can(user, 'approve_simple') && (
          <Button variant="success" size="sm" data-testid="vol-approve"
            onClick={() => { dispatch({ type: 'APPROVE_VOLUNTEER', id: record.id, actor }); toast('봉사활동을 승인했습니다.'); }}>승인</Button>
        )}
        {record.status === '승인' && can(user, 'cancel') && (
          <Button variant="secondary" size="sm" onClick={() => { dispatch({ type: 'CANCEL_VOLUNTEER', id: record.id, actor }); toast('승인을 취소했습니다.', 'info'); }}>승인 취소</Button>
        )}
        {(record.status === '접수' || record.status === '검토중') && can(user, 'approve_simple') && (
          <Button variant="danger" size="sm" onClick={() => setReject(true)}>반려</Button>
        )}
      </div>

      {can(user, 'admin_comment') && (
        <div className="mt-4">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">행정실 코멘트</p>
          <div className="flex gap-2">
            <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="비고 코멘트" />
            <Button size="sm" onClick={() => { dispatch({ type: 'SET_ADMIN_COMMENT', domain: 'volunteer', id: record.id, comment, actor }); toast('코멘트를 저장했습니다.'); }}>저장</Button>
          </div>
        </div>
      )}
      {record.adminComment && !can(user, 'admin_comment') && <p className="mt-3 text-sm text-slate-600">행정실 코멘트: {record.adminComment}</p>}

      <div className="mt-5">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">진행 이력</p>
        <HistoryList history={record.history} />
      </div>

      <ConfirmDialog open={reject} title="반려" message="봉사활동을 반려합니다. 사유를 입력하세요." confirmLabel="반려" variant="danger" withReason
        onClose={() => setReject(false)}
        onConfirm={(reason) => { dispatch({ type: 'REJECT_VOLUNTEER', id: record.id, reason: reason ?? '', actor }); toast('반려 처리했습니다.', 'info'); setReject(false); }} />
    </Modal>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider w-20 shrink-0 pt-0.5">{k}</span>
      <span className="text-sm text-slate-700">{v}</span>
    </div>
  );
}
