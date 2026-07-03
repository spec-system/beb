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
  admissionYear: string;
  name: string;
  year: string;
  semester: string;
  programType: ProgramType;
  status: string;
  lastUpdate: string;
}

type SortKey =
  | 'latest-desc'
  | 'latest-asc'
  | 'student-asc'
  | 'student-desc'
  | 'name-asc'
  | 'name-desc'
  | 'year-asc'
  | 'year-desc';

const GRADE_OPTIONS = ['1학년', '2학년', '3학년', '4학년', '5학년', '6학년'];
const SEMESTER_OPTIONS = ['1학기', '2학기', '여름학기', '겨울학기'];
const TYPE_OPTIONS: ProgramType[] = ['학과내 비교과', '토익', '전공연계봉사활동'];

function byUnique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b, 'ko-KR', { numeric: true }));
}

function includesOrAll(selected: string[], value: string) {
  return selected.length === 0 || selected.includes(value);
}

function searchBlob(row: Row) {
  return [
    row.grade,
    row.studentId,
    row.admissionYear,
    row.name,
    row.year,
    row.semester,
    row.programType,
    row.status,
    row.lastUpdate.replace('T', ' '),
  ].join(' ');
}

function compareRows(sort: SortKey, a: Row, b: Row) {
  const text = (left: string, right: string) => left.localeCompare(right, 'ko-KR', { numeric: true });

  switch (sort) {
    case 'latest-asc':
      return text(a.lastUpdate, b.lastUpdate);
    case 'student-asc':
      return text(a.studentId, b.studentId);
    case 'student-desc':
      return text(b.studentId, a.studentId);
    case 'name-asc':
      return text(a.name, b.name);
    case 'name-desc':
      return text(b.name, a.name);
    case 'year-asc':
      return text(`${a.year}-${a.semester}`, `${b.year}-${b.semester}`);
    case 'year-desc':
      return text(`${b.year}-${b.semester}`, `${a.year}-${a.semester}`);
    case 'latest-desc':
    default:
      return text(b.lastUpdate, a.lastUpdate);
  }
}

function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const allSelected = selected.length === 0;

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
      return;
    }
    onChange([...selected, value]);
  };

  return (
    <FieldGroup label={label}>
      <div className="border border-slate-300 bg-white rounded p-2 min-h-[42px] max-h-32 overflow-y-auto shadow-sm">
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer mb-1">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => onChange([])}
            className="w-4 h-4 text-blue-600 border-slate-300 rounded"
          />
          전체
        </label>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          {options.map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={allSelected || selected.includes(option)}
                onChange={() => toggle(option)}
                className="w-4 h-4 text-blue-600 border-slate-300 rounded"
              />
              <span className="truncate">{option}</span>
            </label>
          ))}
        </div>
      </div>
    </FieldGroup>
  );
}

export default function IntegratedView() {
  const { state } = useRecords();
  const { user } = useAuth();

  const [grades, setGrades] = useState<string[]>([]);
  const [admissionYears, setAdmissionYears] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [semesters, setSemesters] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>('latest-desc');

  const all: Row[] = useMemo(() => {
    const merged: AnyRecord[] = [...state.dept, ...state.toeic, ...state.volunteer];
    return merged
      .filter((r) => (user ? canView(user, r) : false))
      .map((r) => ({
        id: r.id,
        grade: r.grade,
        studentId: r.studentId,
        admissionYear: r.studentId.slice(0, 2),
        name: r.name,
        year: r.year,
        semester: r.semester,
        programType: r.programType,
        status: r.status,
        lastUpdate: r.lastUpdate,
      }));
  }, [state, user]);

  const admissionYearOptions = useMemo(() => byUnique(all.map((r) => r.admissionYear)), [all]);
  const statusOptions = useMemo(() => byUnique(all.map((r) => r.status)), [all]);

  const rows = useMemo(() => {
    const filtered = all.filter((r) => {
      if (!includesOrAll(grades, r.grade)) return false;
      if (!includesOrAll(admissionYears, r.admissionYear)) return false;
      if (yearFrom && r.year < yearFrom) return false;
      if (yearTo && r.year > yearTo) return false;
      if (!includesOrAll(semesters, r.semester)) return false;
      if (!includesOrAll(types, r.programType)) return false;
      if (!includesOrAll(statuses, r.status)) return false;
      if (!matchText(searchBlob(r), query)) return false;
      return true;
    });
    filtered.sort((a, b) => compareRows(sort, a, b));
    return filtered;
  }, [admissionYears, all, grades, query, semesters, sort, statuses, types, yearFrom, yearTo]);

  const reset = () => {
    setGrades([]);
    setAdmissionYears([]);
    setQuery('');
    setYearFrom('');
    setYearTo('');
    setSemesters([]);
    setTypes([]);
    setStatuses([]);
    setSort('latest-desc');
  };

  return (
    <div>
      <PageHeader title={user?.role === 'STUDENT' ? '내 현황' : user?.role === 'PROFESSOR' ? '배정 검토함' : '비교과 프로그램 이수현황'} sub={user?.role === 'STAFF' ? '전체조회 · 관리자 코멘트' : '통합 조회'} />

      <div className="border border-slate-200 bg-slate-50 p-5 rounded-lg mb-6 shadow-sm flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <FieldGroup label="검색">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="학년, 학번, 이름, 연도, 학기, 종류, 상태 검색" data-testid="filter-search" />
          </FieldGroup>
          <MultiSelectFilter label="학년" options={GRADE_OPTIONS} selected={grades} onChange={setGrades} />
          <MultiSelectFilter label="학번 (입학연도)" options={admissionYearOptions} selected={admissionYears} onChange={setAdmissionYears} />
          <FieldGroup label="연도 (범위)">
            <div className="flex items-center gap-2">
              <Input value={yearFrom} onChange={(e) => setYearFrom(e.target.value)} placeholder="2024" inputMode="numeric" />
              <span className="text-slate-400">-</span>
              <Input value={yearTo} onChange={(e) => setYearTo(e.target.value)} placeholder="2026" inputMode="numeric" />
            </div>
          </FieldGroup>
          <MultiSelectFilter label="학기" options={SEMESTER_OPTIONS} selected={semesters} onChange={setSemesters} />
          <MultiSelectFilter label="비교과 종류" options={TYPE_OPTIONS} selected={types} onChange={setTypes} />
          <MultiSelectFilter label="진행상태" options={statusOptions} selected={statuses} onChange={setStatuses} />
          <FieldGroup label="정렬">
            <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} data-testid="sort-integrated">
              <option value="latest-desc">최신순</option>
              <option value="latest-asc">오래된순</option>
              <option value="student-asc">학번 오름차순</option>
              <option value="student-desc">학번 내림차순</option>
              <option value="name-asc">이름 오름차순</option>
              <option value="name-desc">이름 내림차순</option>
              <option value="year-desc">활동연도 내림차순</option>
              <option value="year-asc">활동연도 오름차순</option>
            </Select>
          </FieldGroup>
        </div>
        <div className="flex justify-between items-center border-t border-slate-200 pt-4">
          <p className="text-sm text-slate-500">필터 미선택 항목은 전체 데이터로 조회됩니다.</p>
          <Button variant="secondary" size="sm" onClick={reset}>초기화</Button>
        </div>
      </div>

      <Table>
        <THead>
          <Th>학년</Th><Th>학번</Th><Th>이름</Th><Th>연도</Th><Th>학기</Th><Th>비교과 종류</Th><Th>진행상태</Th>
        </THead>
        <tbody data-testid="integrated-tbody">
          {rows.length === 0 ? (
            <TableEmpty colSpan={7} message="조건에 맞는 데이터가 없습니다." />
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
              </tr>
            ))
          )}
        </tbody>
      </Table>
      <p className="text-sm text-slate-500 mt-3">총 {rows.length}건</p>
    </div>
  );
}
