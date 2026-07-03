import React, { useMemo, useState } from 'react';
import { useRecords } from '../store/recordsStore';
import { useAuth } from '../auth/AuthContext';
import { can, canView } from '../auth/roles';
import { ToeicRecord } from '../types';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import HistoryList from '../components/HistoryList';
import { Table, THead, Th, Td, TableEmpty } from '../components/ui/Table';
import { FieldGroup, Input } from '../components/ui/Field';
import { useToast } from '../components/ui/Toast';
import { Plus, Eye, Info } from 'lucide-react';

const MIN_SCORE = 700; // 승인 기준 예시

export default function ToeicView() {
  const { state } = useRecords();
  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<ToeicRecord | null>(null);

  const rows = useMemo(
    () => state.toeic.filter((r) => (user ? canView(user, r) : false)).slice().sort((a, b) => (a.lastUpdate < b.lastUpdate ? 1 : -1)),
    [state.toeic, user],
  );
  if (!user) return null;
  const current = detail ? state.toeic.find((r) => r.id === detail.id) ?? null : null;

  return (
    <div>
      <PageHeader title="토익 이수 현황" sub="TOEIC" right={can(user, 'create') && <Button onClick={() => setCreateOpen(true)}><Plus size={16} /> 성적 입력</Button>} />

      <div className="flex items-start gap-2 text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-5">
        <Info size={14} className="mt-0.5 text-amber-500 shrink-0" />
        <p>성적표 유효기간(응시일 +2년)과 성적 기준({MIN_SCORE}점 이상)을 확인 후 승인합니다. YBM 조회 시 진위가 불확실하면 성적표 원본을 요구할 수 있습니다.</p>
      </div>

      <Table>
        <THead>
          <Th>학번</Th><Th>이름</Th><Th>응시일</Th><Th>수험번호</Th><Th>TOTAL</Th><Th>유효기간</Th><Th>진행상태</Th><Th>최종 승인일</Th><Th></Th>
        </THead>
        <tbody data-testid="toeic-tbody">
          {rows.length === 0 ? (
            <TableEmpty colSpan={9} message="입력된 토익 성적이 없습니다." />
          ) : (
            rows.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <Td className="text-slate-600">{r.studentId}</Td>
                <Td className="text-slate-800 font-medium">{r.name}</Td>
                <Td className="text-slate-600">{r.testDate}</Td>
                <Td className="text-slate-600">{r.testNumber}</Td>
                <Td className="text-slate-800 font-semibold">{r.totalScore}</Td>
                <Td className="text-slate-500 text-xs">{r.validUntil}</Td>
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
  const [f, setF] = useState({ birthDate: '', testDate: '', testNumber: '', totalScore: '', issueNumber: '' });
  if (!user) return null;
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const submit = () => {
    if (!f.testDate || !f.totalScore) { toast('응시일과 점수를 입력하세요.', 'error'); return; }
    const testDate = f.testDate;
    const validUntil = testDate ? `${Number(testDate.slice(0, 4)) + 2}${testDate.slice(4)}` : '';
    dispatch({
      type: 'CREATE_TOEIC',
      actor: { name: user.name, role: user.role },
      payload: {
        programType: '토익', grade: user.grade ?? '3학년', studentId: user.studentId ?? '', name: user.name,
        year: '2026', semester: '2학기', professor: '이도현',
        birthDate: f.birthDate, testDate, testNumber: f.testNumber, totalScore: Number(f.totalScore) || 0,
        issueNumber: f.issueNumber, validUntil, finalApprovalDate: '', adminComment: '',
      },
    });
    toast('토익 성적을 입력했습니다. (접수)');
    onClose();
  };

  return (
    <Modal open onClose={onClose} title="토익 성적 입력" footer={<><Button variant="secondary" onClick={onClose}>취소</Button><Button onClick={submit} data-testid="toeic-create-submit">입력</Button></>}>
      <div className="grid grid-cols-2 gap-4">
        <FieldGroup label="생년월일"><Input type="date" value={f.birthDate} onChange={set('birthDate')} /></FieldGroup>
        <FieldGroup label="응시일자"><Input type="date" value={f.testDate} onChange={set('testDate')} /></FieldGroup>
        <FieldGroup label="수험번호 (앞 6자리)"><Input value={f.testNumber} onChange={set('testNumber')} placeholder="482913" /></FieldGroup>
        <FieldGroup label="TOTAL 점수"><Input type="number" value={f.totalScore} onChange={set('totalScore')} placeholder="850" /></FieldGroup>
        <FieldGroup label="발급번호"><Input value={f.issueNumber} onChange={set('issueNumber')} /></FieldGroup>
      </div>
      <p className="text-xs text-slate-400 mt-3">증빙 자료 업로드 없음 — 성적표 기재 내용을 text로 입력합니다.</p>
    </Modal>
  );
}

function DetailModal({ record, onClose }: { record: ToeicRecord; onClose: () => void }) {
  const { dispatch } = useRecords();
  const { user } = useAuth();
  const { toast } = useToast();
  const [comment, setComment] = useState(record.adminComment);
  const [reject, setReject] = useState(false);
  if (!user) return null;
  const actor = { name: user.name, role: user.role };
  const belowStd = record.totalScore < MIN_SCORE;

  return (
    <Modal open onClose={onClose} title={`토익 성적 · ${record.name}`} width="max-w-2xl">
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4">
        <Row k="학번" v={record.studentId} /><Row k="생년월일" v={record.birthDate || '-'} />
        <Row k="응시일자" v={record.testDate} /><Row k="수험번호" v={record.testNumber} />
        <Row k="TOTAL" v={<span className={belowStd ? 'text-red-600 font-semibold' : 'font-semibold'}>{record.totalScore}점 {belowStd && '(기준 미달)'}</span>} />
        <Row k="발급번호" v={record.issueNumber || '-'} />
        <Row k="유효기간" v={record.validUntil} /><Row k="진행상태" v={<Badge status={record.status} />} />
      </div>

      <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
        {(record.status === '접수' || record.status === '검토중') && can(user, 'approve_simple') && (
          <Button variant="success" size="sm" data-testid="toeic-approve"
            onClick={() => { dispatch({ type: 'APPROVE_TOEIC', id: record.id, actor }); toast('토익 성적을 승인했습니다.'); }}>
            승인
          </Button>
        )}
        {record.status === '승인' && can(user, 'cancel') && (
          <Button variant="secondary" size="sm" onClick={() => { dispatch({ type: 'CANCEL_TOEIC', id: record.id, actor }); toast('승인을 취소했습니다.', 'info'); }}>승인 취소</Button>
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
            <Button size="sm" onClick={() => { dispatch({ type: 'SET_ADMIN_COMMENT', domain: 'toeic', id: record.id, comment, actor }); toast('코멘트를 저장했습니다.'); }}>저장</Button>
          </div>
        </div>
      )}
      {record.adminComment && !can(user, 'admin_comment') && <p className="mt-3 text-sm text-slate-600">행정실 코멘트: {record.adminComment}</p>}

      <div className="mt-5">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">진행 이력</p>
        <HistoryList history={record.history} />
      </div>

      <ConfirmDialog open={reject} title="반려" message="성적을 반려합니다. 사유를 입력하세요." confirmLabel="반려" variant="danger" withReason
        onClose={() => setReject(false)}
        onConfirm={(reason) => { dispatch({ type: 'REJECT_TOEIC', id: record.id, reason: reason ?? '', actor }); toast('반려 처리했습니다.', 'info'); setReject(false); }} />
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
