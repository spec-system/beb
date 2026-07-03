import React, { useMemo, useState } from 'react';
import { useRecords } from '../store/recordsStore';
import { useAuth } from '../auth/AuthContext';
import { canView } from '../auth/roles';
import { AnyRecord, ProgramType } from '../types';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { Table, THead, Th, Td, TableEmpty } from '../components/ui/Table';
import { FieldGroup, Input, Select } from '../components/ui/Field';
import { matchText } from '../utils/filters';

interface Row {
  id: string;
  grade: string;
  studentId: string;
  name: string;
  year: string;
  semester: string;
  programType: ProgramType;
  status: string;
  lastUpdate: string;
}

export default function IntegratedView() {
  const { state } = useRecords();
  const { user } = useAuth();

  const [grade, setGrade] = useState('전체');
  const [person, setPerson] = useState('');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [semester, setSemester] = useState('전체');
  const [type, setType] = useState<'전체' | ProgramType>('전체');
  const [status, setStatus] = useState('전체');
  const [latestFirst, setLatestFirst] = useState(true);

  const all: Row[] = useMemo(() => {
    const merged: AnyRecord[] = [...state.dept, ...state.toeic, ...state.volunteer];
    return merged
      .filter((r) => (user ? canView(user, r) : false))
      .map((r) => ({
        id: r.id,
        grade: r.grade,
        studentId: r.studentId,
        name: r.name,
        year: r.year,
        semester: r.semester,
        programType: r.programType,
        status: (r as any).status,
        lastUpdate: r.lastUpdate,
      }));
  }, [state, user]);

  const rows = useMemo(() => {
    const filtered = all.filter((r) => {
      if (grade !== '전체' && r.grade !== grade) return false;
      if (!matchText(`${r.studentId} ${r.name}`, person)) return false;
      if (yearFrom && r.year < yearFrom) return false;
      if (yearTo && r.year > yearTo) return false;
      if (semester !== '전체' && r.semester !== semester) return false;
      if (type !== '전체' && r.programType !== type) return false;
      if (status !== '전체' && r.status !== status) return false;
      return true;
    });
    filtered.sort((a, b) => (latestFirst ? (a.lastUpdate < b.lastUpdate ? 1 : -1) : a.lastUpdate < b.lastUpdate ? -1 : 1));
    return filtered;
  }, [all, grade, person, yearFrom, yearTo, semester, type, status, latestFirst]);

  const reset = () => {
    setGrade('전체'); setPerson(''); setYearFrom(''); setYearTo('');
    setSemester('전체'); setType('전체'); setStatus('전체'); setLatestFirst(true);
  };

  const statusOptions = ['전체', '계획서 접수', '계획서 승인', '보고서 접수', '보고서 담당승인', '최종 승인', '접수', '검토중', '승인', '반려'];

  return (
    <div>
      <PageHeader title="비교과 프로그램 이수현황" sub="통합 조회" />

      <div className="border border-slate-200 bg-slate-50 p-5 rounded-lg mb-6 shadow-sm flex flex-col gap-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <FieldGroup label="학년">
            <Select value={grade} onChange={(e) => setGrade(e.target.value)} data-testid="filter-grade">
              {['전체', '1학년', '2학년', '3학년', '4학년', '5학년', '6학년'].map((g) => <option key={g}>{g}</option>)}
            </Select>
          </FieldGroup>
          <FieldGroup label="개인별 (학번/이름)">
            <Input value={person} onChange={(e) => setPerson(e.target.value)} placeholder="학번 또는 이름" data-testid="filter-person" />
          </FieldGroup>
          <FieldGroup label="연도 (범위)">
            <div className="flex items-center gap-2">
              <Input value={yearFrom} onChange={(e) => setYearFrom(e.target.value)} placeholder="시작" />
              <span className="text-slate-400">-</span>
              <Input value={yearTo} onChange={(e) => setYearTo(e.target.value)} placeholder="종료" />
            </div>
          </FieldGroup>
          <FieldGroup label="학기">
            <Select value={semester} onChange={(e) => setSemester(e.target.value)}>
              {['전체', '1학기', '2학기', '여름학기', '겨울학기'].map((s) => <option key={s}>{s}</option>)}
            </Select>
          </FieldGroup>
          <FieldGroup label="비교과 종류">
            <Select value={type} onChange={(e) => setType(e.target.value as any)}>
              {['전체', '학과내 비교과', '토익', '전공연계봉사활동'].map((t) => <option key={t}>{t}</option>)}
            </Select>
          </FieldGroup>
          <FieldGroup label="진행상태">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              {statusOptions.map((s) => <option key={s}>{s}</option>)}
            </Select>
          </FieldGroup>
        </div>
        <div className="flex justify-between items-center border-t border-slate-200 pt-4">
          <label className="flex items-center gap-2 font-medium text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={latestFirst} onChange={(e) => setLatestFirst(e.target.checked)} className="w-4 h-4 text-blue-600 border-slate-300 rounded" />
            최신 것 우선 정렬
          </label>
          <Button variant="secondary" size="sm" onClick={reset}>초기화</Button>
        </div>
      </div>

      <Table>
        <THead>
          <Th>학년</Th><Th>학번</Th><Th>이름</Th><Th>연도</Th><Th>학기</Th><Th>비교과 종류</Th><Th>진행상태</Th><Th>최종 업데이트</Th>
        </THead>
        <tbody data-testid="integrated-tbody">
          {rows.length === 0 ? (
            <TableEmpty colSpan={8} message="조건에 맞는 데이터가 없습니다." />
          ) : (
            rows.map((r) => (
              <tr key={`${r.programType}-${r.id}`} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <Td className="text-slate-700 font-medium">{r.grade}</Td>
                <Td className="text-slate-600">{r.studentId}</Td>
                <Td className="text-slate-800 font-medium">{r.name}</Td>
                <Td className="text-slate-600">{r.year}</Td>
                <Td className="text-slate-600">{r.semester}</Td>
                <Td className="text-slate-700">{r.programType}</Td>
                <Td><Badge status={r.status} /></Td>
                <Td className="text-slate-500 text-xs">{r.lastUpdate.replace('T', ' ')}</Td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
      <p className="text-sm text-slate-500 mt-3">총 {rows.length}건</p>
    </div>
  );
}
