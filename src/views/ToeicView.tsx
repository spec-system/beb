import React, { useMemo, useState, useCallback } from 'react';
import { useRecords } from '../store/recordsStore';
import { useAuth } from '../auth/AuthContext';
import { can, canView, canStudentEdit, isFinalApproved } from '../auth/roles';
import { ToeicRecord, SimpleStatus } from '../types';
import { PROFESSORS } from '../data/seed';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import HistoryList from '../components/HistoryList';
import { Table, THead, Th, Td, TableEmpty } from '../components/ui/Table';
import { FieldGroup, Input, Select } from '../components/ui/Field';
import { useToast } from '../components/ui/Toast';
import { Plus, Info, RotateCcw } from 'lucide-react';

const MIN_SCORE = 700;
const readyForFirst = (r: ToeicRecord) => r.status === '접수' || r.status === '검토중' || r.status === '반려';
const readyForFinal = (r: ToeicRecord) => r.status === '1차 승인' || r.status === '검토중';

const GRADES = ['2학년', '3학년', '4학년'];
const STATUSES: SimpleStatus[] = ['접수', '1차 승인', '최종 승인', '검토중', '승인', '반려'];

interface SearchFilter {
  grade: string;       // '' = 전체
  studentId: string;   // partial match
  name: string;        // partial match
  status: string;      // '' = 전체
  dateFrom: string;    // 응시일자 시작일
  dateTo: string;      // 응시일자 종료일
}

const EMPTY_FILTER: SearchFilter = {
  grade: '', studentId: '', name: '', status: '', dateFrom: '', dateTo: '',
};

export default function ToeicView() {
  const { state, dispatch } = useRecords();
  const { user } = useAuth();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<ToeicRecord | null>(null);
  const [filter, setFilter] = useState<SearchFilter>(EMPTY_FILTER);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const visibleRows = useMemo(
    () => state.toeic.filter((r) => (user ? canView(user, r) : false)).slice().sort((a, b) => (a.lastUpdate < b.lastUpdate ? 1 : -1)),
    [state.toeic, user],
  );

  const filteredRows = useMemo(() => {
    return visibleRows.filter((r) => {
      if (filter.grade && r.grade !== filter.grade) return false;
      if (filter.studentId && !r.studentId.includes(filter.studentId.trim())) return false;
      if (filter.name && !r.name.includes(filter.name.trim())) return false;
      if (filter.status && r.status !== filter.status) return false;
      if (filter.dateFrom && r.testDate < filter.dateFrom) return false;
      if (filter.dateTo && r.testDate > filter.dateTo) return false;
      return true;
    });
  }, [visibleRows, filter]);

  if (!user) return null;
  const current = detail ? state.toeic.find((r) => r.id === detail.id) ?? null : null;

  const title = user.role === 'STUDENT' ? '토익 정보 입력' : user.role === 'PROFESSOR' ? '토익 목록' : user.role === 'STAFF' ? '토익 관리자 코멘트' : '토익 최종승인';

  const isProfessor = user.role === 'PROFESSOR';
  const isHead = user.role === 'HEAD';
  const showBatchBar = isProfessor || isHead;

  // 체크박스 토글
  const toggleRow = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const allChecked = filteredRows.length > 0 && filteredRows.every((r) => selected.has(r.id));
  const someChecked = filteredRows.some((r) => selected.has(r.id)) && !allChecked;

  const toggleAll = useCallback(() => {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(filteredRows.map((r) => r.id)));
  }, [allChecked, filteredRows]);

  // 일괄 1차 승인 (PROFESSOR)
  const batchApproveFirst = () => {
    const checked = filteredRows.filter((r) => selected.has(r.id));
    if (checked.length === 0) { toast('선택된 건이 없습니다.', 'error'); return; }
    const ineligible = checked.filter((r) => !readyForFirst(r));
    if (ineligible.length > 0) {
      const first = ineligible[0].studentId;
      const rest = ineligible.length - 1;
      toast(`미만족 건 존재: 학번 ${first}${rest > 0 ? ` 외 ${rest}건` : ''}`, 'error');
      return;
    }
    const actor = { name: user.name, role: user.role };
    checked.forEach((r) => dispatch({ type: 'APPROVE_TOEIC_PROFESSOR', id: r.id, actor }));
    toast(`${checked.length}건 일괄 1차 승인했습니다.`);
    setSelected(new Set());
  };

  // 일괄 최종 승인 (HEAD)
  const batchApproveFinal = () => {
    const checked = filteredRows.filter((r) => selected.has(r.id));
    if (checked.length === 0) { toast('선택된 건이 없습니다.', 'error'); return; }
    const ineligible = checked.filter((r) => !readyForFinal(r));
    if (ineligible.length > 0) {
      const first = ineligible[0].studentId;
      const rest = ineligible.length - 1;
      toast(`미만족 건 존재: 학번 ${first}${rest > 0 ? ` 외 ${rest}건` : ''}`, 'error');
      return;
    }
    const actor = { name: user.name, role: user.role };
    checked.forEach((r) => dispatch({ type: 'APPROVE_TOEIC_FINAL_HEAD', id: r.id, actor }));
    toast(`${checked.length}건 일괄 최종 승인했습니다.`);
    setSelected(new Set());
  };

  // 일괄 승인 취소 (HEAD) — 최종 승인된 건만 취소 가능
  const batchCancel = () => {
    const checked = filteredRows.filter((r) => selected.has(r.id));
    if (checked.length === 0) { toast('선택된 건이 없습니다.', 'error'); return; }
    const ineligible = checked.filter((r) => !isFinalApproved(r));
    if (ineligible.length > 0) {
      const first = ineligible[0].studentId;
      const rest = ineligible.length - 1;
      toast(`미만족 건 존재: 학번 ${first}${rest > 0 ? ` 외 ${rest}건` : ''}`, 'error');
      return;
    }
    const actor = { name: user.name, role: user.role };
    checked.forEach((r) => dispatch({ type: 'CANCEL_TOEIC', id: r.id, actor }));
    toast(`${checked.length}건 일괄 승인 취소했습니다.`, 'info');
    setSelected(new Set());
  };

  const resetFilter = () => {
    setFilter(EMPTY_FILTER);
    setSelected(new Set());
  };

  return (
    <div>
      <PageHeader title={title} sub="TOEIC" right={can(user, 'create') && <Button onClick={() => setCreateOpen(true)}><Plus size={16} /> 성적 입력</Button>} />

      <div className="flex items-start gap-2 text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-5">
        <Info size={14} className="mt-0.5 text-amber-500 shrink-0" />
        <p>성적표 유효기간(응시일 +2년)과 성적 기준({MIN_SCORE}점 이상)을 확인합니다. 담당교수 1차 승인 후 학과장이 최종 승인합니다.</p>
      </div>

      {/* 검색바 */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 mb-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <FieldGroup label="학년">
            <Select value={filter.grade} onChange={(e) => setFilter({ ...filter, grade: e.target.value })}>
              <option value="">전체</option>
              {GRADES.map((g) => <option key={g}>{g}</option>)}
            </Select>
          </FieldGroup>
          <FieldGroup label="학번">
            <Input
              type="text"
              value={filter.studentId}
              onChange={(e) => setFilter({ ...filter, studentId: e.target.value })}
              placeholder="학번 검색"
            />
          </FieldGroup>
          <FieldGroup label="이름">
            <Input
              type="text"
              value={filter.name}
              onChange={(e) => setFilter({ ...filter, name: e.target.value })}
              placeholder="이름 검색"
            />
          </FieldGroup>
          <FieldGroup label="진행상태">
            <Select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
              <option value="">전체</option>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </FieldGroup>
          <FieldGroup label="응시일자 (시작)">
            <Input
              type="date"
              value={filter.dateFrom}
              onChange={(e) => setFilter({ ...filter, dateFrom: e.target.value })}
            />
          </FieldGroup>
          <FieldGroup label="응시일자 (종료)">
            <Input
              type="date"
              value={filter.dateTo}
              onChange={(e) => setFilter({ ...filter, dateTo: e.target.value })}
            />
          </FieldGroup>
        </div>
        <div className="flex justify-end mt-3">
          <Button variant="secondary" size="sm" onClick={resetFilter}>
            <RotateCcw size={14} /> 초기화
          </Button>
        </div>
      </div>

      {/* 일괄 승인/취소 버튼 영역 */}
      {showBatchBar && (
        <div className="flex items-center gap-2 mb-3">
          {isProfessor && (
            <Button variant="success" size="sm" onClick={batchApproveFirst} disabled={selected.size === 0}>
              일괄 1차 승인 ({selected.size})
            </Button>
          )}
          {isHead && (
            <>
              <Button variant="success" size="sm" onClick={batchApproveFinal} disabled={selected.size === 0}>
                일괄 최종 승인 ({selected.size})
              </Button>
              <Button variant="secondary" size="sm" onClick={batchCancel} disabled={selected.size === 0}>
                일괄 승인 취소 ({selected.size})
              </Button>
            </>
          )}
          {selected.size > 0 && (
            <span className="text-xs text-slate-500">{selected.size}건 선택됨</span>
          )}
        </div>
      )}

      <Table>
        <THead>
          {showBatchBar && (
            <Th className="w-10">
              <input
                type="checkbox"
                checked={allChecked}
                ref={(el) => { if (el) el.indeterminate = someChecked; }}
                onChange={toggleAll}
                className="w-4 h-4 rounded border-slate-300"
              />
            </Th>
          )}
          <Th>학년</Th><Th>학번</Th><Th>이름</Th><Th>생년월일</Th><Th>응시일자</Th><Th>수험번호</Th><Th>TOTAL</Th><Th>발급번호</Th><Th>진행상태</Th><Th>최종 승인일</Th>
        </THead>
        <tbody data-testid="toeic-tbody">
          {filteredRows.length === 0 ? (
            <TableEmpty colSpan={showBatchBar ? 12 : 11} message="검색 결과가 없습니다." />
          ) : (
            filteredRows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer select-none"
                onDoubleClick={() => setDetail(r)}
              >
                {showBatchBar && (
                  <Td className="w-10" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(r.id)}
                      onChange={() => toggleRow(r.id)}
                      className="w-4 h-4 rounded border-slate-300"
                    />
                  </Td>
                )}
                <Td className="text-slate-600">{r.grade}</Td>
                <Td className="text-slate-600">{r.studentId}</Td>
                <Td className="text-slate-800 font-medium">{r.name}</Td>
                <Td className="text-slate-600">{r.birthDate || '-'}</Td>
                <Td className="text-slate-600">{r.testDate}</Td>
                <Td className="text-slate-600">{r.testNumber}</Td>
                <Td className="text-slate-800 font-semibold">{r.totalScore}</Td>
                <Td className="text-slate-600">{r.issueNumber || '-'}</Td>
                <Td><Badge status={r.status} /></Td>
                <Td className="text-slate-500 text-xs">{r.finalApprovalDate || '-'}</Td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
      <p className="text-sm text-slate-500 mt-3">총 {filteredRows.length}건</p>

      {createOpen && <CreateModal onClose={() => setCreateOpen(false)} />}
      {current && <DetailModal record={current} onClose={() => setDetail(null)} />}
    </div>
  );
}

function CreateModal({ onClose }: { onClose: () => void }) {
  const { dispatch } = useRecords();
  const { user } = useAuth();
  const { toast } = useToast();
  const [f, setF] = useState({ birthDate: '', testDate: '', testNumber: '', totalScore: '', issueNumber: '', professor: PROFESSORS[0] });
  if (!user) return null;
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const submit = () => {
    if (!f.testDate || !f.totalScore) { toast('응시일과 점수를 입력하세요.', 'error'); return; }
    const testDate = f.testDate;
    const validUntil = testDate ? `${Number(testDate.slice(0, 4)) + 2}${testDate.slice(4)}` : '';
    dispatch({
      type: 'CREATE_TOEIC',
      actor: { name: user.name, role: user.role },
      payload: {
        programType: '토익', grade: user.grade ?? '3학년', studentId: user.studentId ?? '', name: user.name,
        year: '2026', semester: '2학기', professor: f.professor,
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
        <FieldGroup label="담당교수"><Select value={f.professor} onChange={set('professor')}>{PROFESSORS.map((p) => <option key={p}>{p}</option>)}</Select></FieldGroup>
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
  const canReject = (can(user, 'approve_first', record) && readyForFirst(record)) || (can(user, 'approve_final', record) && readyForFinal(record));

  return (
    <Modal open onClose={onClose} title={`토익 성적 · ${record.name}`} width="max-w-2xl">
      <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm mb-4">
        <Row k="학년" v={record.grade} />
        <Row k="학번" v={record.studentId} />
        <Row k="생년월일" v={record.birthDate || '-'} />
        <Row k="응시일자" v={record.testDate} />
        <Row k="수험번호" v={record.testNumber} />
        <Row k="담당교수" v={record.professor} />
        <Row k="TOTAL" v={<span className={belowStd ? 'text-red-600 font-semibold' : 'font-semibold'}>{record.totalScore}점 {belowStd && '(기준 미달)'}</span>} />
        <Row k="발급번호" v={record.issueNumber || '-'} />
        <Row k="유효기간" v={record.validUntil} />
        <Row k="진행상태" v={<Badge status={record.status} />} />
      </div>

      <div className="flex flex-wrap gap-2 border-t border-slate-200 pt-4">
        {readyForFirst(record) && can(user, 'approve_first', record) && (
          <Button variant="success" size="sm" data-testid="toeic-approve-first"
            onClick={() => { dispatch({ type: 'APPROVE_TOEIC_PROFESSOR', id: record.id, actor }); toast('토익 성적을 1차 승인했습니다.'); }}>
            1차 승인
          </Button>
        )}
        {readyForFinal(record) && can(user, 'approve_final', record) && (
          <Button variant="success" size="sm" data-testid="toeic-approve-final"
            onClick={() => { dispatch({ type: 'APPROVE_TOEIC_FINAL_HEAD', id: record.id, actor }); toast('토익 성적을 최종 승인했습니다.'); }}>
            최종 승인
          </Button>
        )}
        {isFinalApproved(record) && can(user, 'cancel', record) && (
          <Button variant="secondary" size="sm" onClick={() => { dispatch({ type: 'CANCEL_TOEIC', id: record.id, actor }); toast('최종 승인을 취소했습니다.', 'info'); }}>최종 승인 취소</Button>
        )}
        {canReject && (
          <Button variant="danger" size="sm" onClick={() => setReject(true)}>반려</Button>
        )}
        {record.status === '반려' && canStudentEdit(user, record) && (
          <Button variant="secondary" size="sm" onClick={() => { dispatch({ type: 'RESUBMIT_TOEIC', id: record.id, actor }); toast('재제출했습니다.', 'info'); }}>재제출</Button>
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
