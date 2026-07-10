import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useRecords } from '../store/recordsStore';
import { useAuth } from '../auth/AuthContext';
import { canView } from '../auth/roles';
import { AnyRecord, ProgramType, User, Message } from '../types';
import PageHeader from '../components/ui/PageHeader';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import HistoryList from '../components/HistoryList';
import { Eye } from 'lucide-react';
import { Table, THead, Th, Td, TableEmpty } from '../components/ui/Table';
import { FieldGroup, Input, Select, Textarea } from '../components/ui/Field';
import { matchText } from '../utils/filters';
import { useToast } from '../components/ui/Toast';
import { PROFESSORS } from '../data/seed';
import PendingTasksPanel from '../components/PendingTasksPanel';

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
  adminComment: string;
  lastUpdate: string;
  record: AnyRecord;
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

type Chip = {
  key: string;
  label: string;
  onRemove: () => void;
};

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
    row.adminComment,
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

let dropdownZSeq = 30;
const nextDropdownZ = () => (dropdownZSeq += 1);

function MultiSelectDropdown({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const allSelected = selected.length === 0;
  const summary = allSelected ? '전체' : `${selected.length}개 선택`;
  const ref = useRef<HTMLDetailsElement>(null);
  const [z, setZ] = useState(30);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // 열릴 때마다 z-index를 올려 마지막에 연 드롭다운이 항상 위로 오게 함
    const onToggle = () => { if (el.open) setZ(nextDropdownZ()); };
    // 드롭다운 바깥을 클릭하면 닫기
    const onDocMouseDown = (e: MouseEvent) => {
      if (el.open && !el.contains(e.target as Node)) el.open = false;
    };
    el.addEventListener('toggle', onToggle);
    document.addEventListener('mousedown', onDocMouseDown);
    return () => {
      el.removeEventListener('toggle', onToggle);
      document.removeEventListener('mousedown', onDocMouseDown);
    };
  }, []);

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
      return;
    }
    onChange([...selected, value]);
  };

  return (
    <details ref={ref} style={{ zIndex: z }} className="group relative w-full">
      <summary className="flex h-5 cursor-pointer list-none items-center justify-between border border-slate-400 bg-white px-2 py-0 text-[11px] text-slate-800">
        <span className="truncate">{summary}</span>
        <span className="text-[9px] text-[#2b5597] group-open:rotate-180">▼</span>
      </summary>
      <div className="absolute z-20 mt-1 w-44 border border-slate-400 bg-white p-1.5 shadow-md">
        <label className="mb-0.5 flex cursor-pointer items-center gap-1.5 px-1 py-0.5 text-[11px] text-slate-800 hover:bg-[#edf2fa]">
          <input type="checkbox" checked={allSelected} onChange={() => onChange([])} className="h-3 w-3 border-slate-400 text-blue-900" />
          전체
        </label>
        <div className="max-h-36 overflow-y-auto border-t border-slate-200 pt-0.5">
          {options.map((option) => (
            <label key={option} className="flex cursor-pointer items-center gap-1.5 px-1 py-0.5 text-[11px] text-slate-800 hover:bg-[#edf2fa]">
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() => toggle(option)}
                className="h-3 w-3 border-slate-400 text-blue-900"
              />
              <span className="truncate">{option}</span>
            </label>
          ))}
        </div>
      </div>
    </details>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex h-7 items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 text-xs font-medium text-blue-950 hover:border-blue-400"
      title="선택 해제"
    >
      {label}
      <span className="text-blue-700">×</span>
    </button>
  );
}


function GraduationCalculator({ user }: { user: User }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 50);
    return () => clearInterval(timer);
  }, []);

  const studentId = user?.studentId;
  const grade = user?.grade;

  // 입학/졸업 연도 및 날짜 계산 (약학대학 6년제 기준)
  const currentYear = now.getFullYear();
  let startYear = currentYear - 2; // 기본값: 3학년 가정 (2024년 입학)

  if (studentId && studentId.length >= 4) {
    const parsed = parseInt(studentId.slice(0, 4), 10);
    if (!isNaN(parsed) && parsed > 1900 && parsed < 2100) {
      startYear = parsed;
    }
  } else if (grade) {
    const match = grade.match(/(\d)학년/);
    if (match) {
      const g = parseInt(match[1], 10);
      startYear = currentYear - (g - 1);
    }
  }

  const admissionDate = new Date(startYear, 2, 2, 0, 0, 0); // 3월 2일
  const graduationDate = new Date(startYear + 6, 1, 28, 23, 59, 59); // 약대 6년제: 6년 뒤 2월 28일

  const totalMs = graduationDate.getTime() - admissionDate.getTime();
  const elapsedMs = now.getTime() - admissionDate.getTime();
  const remainingMs = graduationDate.getTime() - now.getTime();

  const isGraduated = remainingMs <= 0;
  const percent = isGraduated ? 100 : Math.max(0, Math.min(100, (elapsedMs / totalMs) * 100));

  const totalDays = Math.round(totalMs / (1000 * 60 * 60 * 24));
  const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
  const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

  let academicStatus = '재학생';
  if (isGraduated) {
    academicStatus = '졸업생';
  } else if (grade) {
    if (grade.includes('1학년')) academicStatus = '1학년';
    else if (grade.includes('2학년')) academicStatus = '2학년';
    else if (grade.includes('3학년')) academicStatus = '3학년';
    else if (grade.includes('4학년')) academicStatus = '4학년';
    else if (grade.includes('5학년')) academicStatus = '5학년';
    else if (grade.includes('6학년')) academicStatus = '6학년';
  } else {
    const diffYears = now.getFullYear() - startYear;
    academicStatus = `${Math.min(Math.max(diffYears + 1, 1), 6)}학년`;
  }

  // 개월차 계산
  const month = now.getMonth() + 1;
  const monthsElapsed = month >= 3 ? month - 2 : month + 10;

  // 카운트다운 계산
  const diff = Math.max(0, remainingMs);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  let statusEmoji = 'SY';
  let speechBubble = '';
  if (isGraduated) {
    statusEmoji = 'OK';
    speechBubble = '졸업과 약사 면허 취득을 축하합니다. 앞으로의 활동을 응원합니다.';
  } else {
    speechBubble = `${academicStatus} 비교과 이수 현황을 확인하고 필요한 신청과 제출 일정을 차분히 관리하세요.`;
  }

  const formatNum = (num: number) => String(num).padStart(2, '0');

  return (
    <div className="bg-slate-50 border border-[#a6b9d0] rounded p-4 mb-3 select-none flex flex-col md:flex-row gap-4 items-center">
      {/* 캐릭터 및 말풍선 영역 */}
      <div className="flex items-center gap-3 w-full md:w-1/3 border-b md:border-b-0 md:border-r border-slate-200 pb-3 md:pb-0 md:pr-4">
        <div className="flex flex-col items-center justify-center bg-white border border-slate-200 rounded-full w-14 h-14 shadow-inner text-xl">
          {statusEmoji}
        </div>
        <div className="flex-1 bg-white border border-slate-200 rounded p-2 relative min-h-[50px] flex flex-col justify-center">
          <div className="absolute left-[-5px] top-1/2 translate-y-[-5px] w-2 h-2 bg-white border-l border-b border-slate-200 rotate-45 hidden md:block"></div>
          <div className="absolute top-[-5px] left-6 w-2 h-2 bg-white border-t border-l border-slate-200 rotate-45 block md:hidden"></div>
          <div className="font-bold text-[#1b3c67] text-[10px] mb-0.5">
            {isGraduated ? '삼육이 (졸업생)' : `삼육이 (${academicStatus} ${monthsElapsed}개월차)`}
          </div>
          <p className="text-[10px] text-slate-600 leading-normal">
            {speechBubble}
          </p>
        </div>
      </div>

      {/* 실시간 계산기 메인 영역 */}
      <div className="flex-1 w-full">
        <div className="flex justify-between items-baseline mb-1">
          <div>
            <span className="text-[10px] font-bold text-slate-500 mr-2">졸업구분</span>
            <span className="text-xs font-black text-slate-800">
              {isGraduated ? '학업 완료 (졸업)' : `D-${days}`}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-500 mr-1.5">진행률</span>
            <span className="text-[13px] font-black text-[#1b3c67] font-mono">
              {percent.toFixed(5)}%
            </span>
          </div>
        </div>

        {/* 프로그레스 바 */}
        <div className="w-full bg-slate-200 rounded h-3 relative mb-2 border border-slate-300 shadow-inner">
          <div
            className="bg-gradient-to-r from-blue-500 to-[#1b3c67] h-full rounded transition-all duration-75"
            style={{ width: `${percent}%` }}
          />
          {/* 게이지 끝 학사모 포인터 - 부모 기준 left 위치 지정 */}
          {percent > 2 && percent < 98 && (
            <span
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-[11px] pointer-events-none transition-all duration-75"
              style={{ left: `${percent}%` }}
            >
              🎓
            </span>
          )}
        </div>

        {/* 상세 일정 정보 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[9px] text-slate-600 bg-white p-1.5 border border-slate-200 rounded">
          <div>
            <span className="font-bold block text-slate-400">입학일</span>
            <span className="font-mono">{startYear}.03.02</span>
          </div>
          <div>
            <span className="font-bold block text-slate-400">졸업예정일</span>
            <span className="font-mono">{startYear + 6}.02.28</span>
          </div>
          <div>
            <span className="font-bold block text-slate-400">총 재학일수</span>
            <span>{totalDays}일</span>
          </div>
          <div>
            <span className="font-bold block text-slate-400">경과/남은일수</span>
            <span>
              {elapsedDays}일 / <span className="text-rose-600 font-bold">{isGraduated ? '0' : remainingDays}일</span>
            </span>
          </div>
        </div>

        {/* 남은 시간 카운터 (실시간) */}
        {!isGraduated && (
          <div className="mt-1 text-right text-[9px] text-slate-500 font-mono">
            ⏱ 남은 시간: <span className="font-bold text-slate-700">{days}</span>일{' '}
            <span className="font-bold text-slate-700">{formatNum(hours)}</span>시간{' '}
            <span className="font-bold text-slate-700">{formatNum(minutes)}</span>분{' '}
            <span className="font-bold text-[#1b3c67]">{formatNum(seconds)}</span>초
          </div>
        )}
      </div>
    </div>
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
  const [detail, setDetail] = useState<AnyRecord | null>(null);
  const [msgOpen, setMsgOpen] = useState(false);

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
        adminComment: r.adminComment,
        lastUpdate: r.lastUpdate,
        record: r,
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

  const isStudent = user?.role === 'STUDENT';
  const title = isStudent ? '내 현황' : '전체 목록';
  const sub = isStudent ? '내 비교과 신청 및 이수 현황' : '비교과 프로그램 통합 조회';

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

  const chips: Chip[] = [
    ...grades.map((value) => ({ key: `grade-${value}`, label: `학년 ${value}`, onRemove: () => setGrades(grades.filter((item) => item !== value)) })),
    ...admissionYears.map((value) => ({ key: `admission-${value}`, label: `${value}학번`, onRemove: () => setAdmissionYears(admissionYears.filter((item) => item !== value)) })),
    ...(yearFrom ? [{ key: 'year-from', label: `${yearFrom}년부터`, onRemove: () => setYearFrom('') }] : []),
    ...(yearTo ? [{ key: 'year-to', label: `${yearTo}년까지`, onRemove: () => setYearTo('') }] : []),
    ...semesters.map((value) => ({ key: `semester-${value}`, label: value, onRemove: () => setSemesters(semesters.filter((item) => item !== value)) })),
    ...types.map((value) => ({ key: `type-${value}`, label: value, onRemove: () => setTypes(types.filter((item) => item !== value)) })),
    ...statuses.map((value) => ({ key: `status-${value}`, label: value, onRemove: () => setStatuses(statuses.filter((item) => item !== value)) })),
    ...(query ? [{ key: 'query', label: `검색 ${query}`, onRemove: () => setQuery('') }] : []),
  ];

  return (
    <div className="p-1 font-mono text-[11px] bg-white">
      {/* 바로가기 경로 및 제어 버튼바 */}
      <div className="flex items-center justify-between border-b border-[#adadad] pb-2 mb-2 select-none">
        <div className="flex items-center gap-1 text-[10px] text-[#666666]">
          <span>🏠</span>
          <span>&gt;</span>
          <span>서비스</span>
          <span>&gt;</span>
          <span>학생</span>
          <span>&gt;</span>
          <span>비교과관리</span>
          <span>&gt;</span>
          <span className="font-bold text-[#1b3c67]">비교과 통합대장 조회</span>
        </div>
        <div className="flex gap-1">
          <button className="su-btn-blue px-3 py-0.5 text-[11px]">Q 조회</button>
          <button onClick={reset} className="su-btn-gray px-3 py-0.5 text-[11px]">초기화</button>
        </div>
      </div>
      {isStudent && user && <GraduationCalculator user={user} />}
      {!isStudent && <PendingTasksPanel />}
      {isStudent && (
        <div className="flex justify-end mb-2">
          <Button variant="secondary" size="sm" onClick={() => setMsgOpen(true)} data-testid="msg-open">담당교수께 쪽지</Button>
        </div>
      )}
      {msgOpen && user && <MessageModal user={user} onClose={() => setMsgOpen(false)} />}

      {/* SU-WINGs 연청색 격자형 조회 조건 테이블 */}
      <div className="integrated-filter-panel border border-[#a6b9d0] mb-3">
        <table className="su-form-table integrated-filter-table">
          <tbody>
            <tr>
              <th className="su-required">학년</th>
              <td>
                <MultiSelectDropdown options={GRADE_OPTIONS} selected={grades} onChange={setGrades} />
              </td>
              <th className="su-required">학번</th>
              <td>
                <MultiSelectDropdown options={admissionYearOptions} selected={admissionYears} onChange={setAdmissionYears} />
              </td>
              <th>연도 범위</th>
              <td>
                <div className="flex items-center gap-1">
                  <Input value={yearFrom} onChange={(e) => setYearFrom(e.target.value)} placeholder="2024" className="w-16 h-5 p-1 text-xs" />
                  <span>~</span>
                  <Input value={yearTo} onChange={(e) => setYearTo(e.target.value)} placeholder="2026" className="w-16 h-5 p-1 text-xs" />
                </div>
              </td>
              <th>검색(학번/성명)</th>
              <td>
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="학번, 이름, 상태 검색" className="w-full h-5 p-1 text-xs" />
              </td>
            </tr>
            <tr>
              <th className="su-required">학기</th>
              <td>
                <MultiSelectDropdown options={SEMESTER_OPTIONS} selected={semesters} onChange={setSemesters} />
              </td>
              <th className="su-required">비교과 종류</th>
              <td>
                <MultiSelectDropdown options={TYPE_OPTIONS} selected={types} onChange={setTypes} />
              </td>
              <th>진행상태</th>
              <td>
                <MultiSelectDropdown options={statusOptions} selected={statuses} onChange={setStatuses} />
              </td>
              <th>정렬 기준</th>
              <td>
                <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="w-full h-6 px-1 py-0 text-xs leading-none">
                  <option value="latest-desc">최신순</option>
                  <option value="latest-asc">오래된순</option>
                  <option value="student-asc">학번 오름차순</option>
                  <option value="student-desc">학번 내림차순</option>
                  <option value="name-asc">이름 오름차순</option>
                  <option value="name-desc">이름 내림차순</option>
                  <option value="year-desc">활동연도 내림차순</option>
                  <option value="year-asc">활동연도 오름차순</option>
                </Select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 조회 결과 수량 지표 */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[#1b3c67] font-black">● 조회 내역</span>
        <span className="text-[10px] text-slate-700 bg-[#e1e6f2] px-1.5 py-0.5 border border-[#adadad] font-bold">{rows.length}건</span>
      </div>
      <Table>
        <THead>
          <Th>학년</Th>
          <Th>학번</Th>
          <Th>이름</Th>
          <Th>연도</Th>
          <Th>학기</Th>
          <Th>비교과 종류</Th>
          <Th>진행상태</Th>
          <Th>비고</Th>
          <Th></Th>
        </THead>
        <tbody data-testid="integrated-tbody">
          {rows.length === 0 ? (
            <TableEmpty colSpan={9} message="조건에 맞는 데이터가 없습니다." />
          ) : (
            rows.map((r) => (
              <tr key={`${r.programType}-${r.id}`}>
                <Td className="font-medium">{r.grade}</Td>
                <Td className="font-mono">{r.studentId}</Td>
                <Td className="font-semibold">{r.name}</Td>
                <Td>{r.year}</Td>
                <Td>{r.semester}</Td>
                <Td>{r.programType}</Td>
                <Td><Badge status={r.status} /></Td>
                <Td className="max-w-[160px] truncate text-xs"><span title={r.adminComment}>{r.adminComment || '-'}</span></Td>
                <Td><Button variant="ghost" size="sm" onClick={() => setDetail(r.record)}><Eye size={14} /> 상세</Button></Td>
              </tr>
            ))
          )}
        </tbody>
      </Table>
      {detail && <IntegratedDetailModal record={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}


function IntegratedDetailModal({ record: initialRecord, onClose }: { record: AnyRecord; onClose: () => void }) {
  const { state, dispatch } = useRecords();
  const { user } = useAuth();
  const { toast } = useToast();

  const record = useMemo(() => {
    const list = [...state.dept, ...state.toeic, ...state.volunteer];
    return list.find(r => r.id === initialRecord.id) || initialRecord;
  }, [state, initialRecord]);
  const latestRejectReason = [...record.history].reverse().find((h) => (h.step === '반려' || h.step === '(담당교수에게) 반려됨' || h.step === '(학과장에게) 반려됨') && h.reason)?.reason;
  const title = record.programType === '학과내 비교과'
    ? record.title
    : record.programType === '전공연계봉사활동'
      ? record.title
      : `토익 성적 · ${record.name}`;

  const isStudent = user?.role === 'STUDENT';
  const isOwn = record.studentId === user?.studentId;
  const isPendingApproval =
    record.programType === '학과내 비교과'
      ? record.status === '신청 완료'
      : (record.status === '접수' || record.status === '검토중');
  const showReminderBtn = isStudent && isOwn && isPendingApproval;
  const alreadyNotified = record.history.some((h) => h.step === '교수 승인 리마인더 발송');

  const handleSendReminder = () => {
    if (!user) return;
    let domain: 'dept' | 'toeic' | 'volunteer' = 'dept';
    if (record.programType === '토익') domain = 'toeic';
    else if (record.programType === '전공연계봉사활동') domain = 'volunteer';

    dispatch({
      type: 'NOTIFY_PROFESSOR',
      domain,
      id: record.id,
      actor: { name: user.name, role: user.role }
    });
    toast('담당 교수님께 승인 요청 알림 메일을 발송했습니다.', 'success');
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      width="max-w-3xl"
      footer={
        <div className="flex justify-between w-full">
          <div>
            {showReminderBtn && (
              <Button
                variant={alreadyNotified ? 'secondary' : 'primary'}
                disabled={alreadyNotified}
                onClick={handleSendReminder}
              >
                {alreadyNotified ? '⏳ 리마인더 발송 완료' : '🔔 교수님께 승인 리마인더 발송'}
              </Button>
            )}
          </div>
          <Button variant="secondary" onClick={onClose}>
            닫기
          </Button>
        </div>
      }
    >
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3 text-sm">
          <DetailRow k="학생" v={`${record.name} (${record.studentId}) · ${record.grade}`} />
          <DetailRow k="구분" v={record.programType} />
          <DetailRow k="학기" v={`${record.year} ${record.semester}`} />
          <DetailRow k="담당교수" v={record.professor} />
          <DetailRow k="진행상태" v={<Badge status={record.status} />} />
          <DetailRow k="최신 반려사유" v={latestRejectReason || '-'} />
          {record.adminComment && <DetailRow k="행정실 코멘트" v={record.adminComment} />}

          {record.programType === '학과내 비교과' && (
            <>
              <DetailRow k="인정시간" v={`${record.recognizedHours}시간`} />
              <DetailRow k="팀원" v={record.teamMembers.length ? record.teamMembers.map((m) => `${m.name}(${m.studentId})`).join(', ') : '없음'} />
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">계획서</p>
                <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3 border border-slate-200 whitespace-pre-wrap">{record.plan}</p>
              </div>
              <DetailRow k="담당교수 코멘트" v={record.professorComment || '-'} />
              <DetailRow k="보고서 파일" v={record.reportFile ? `${record.reportFile.name} · ${Math.round(record.reportFile.size / 1024)}KB` : '미제출'} />
              <DetailRow k="포스터" v={record.posterFile ? (record.posterReviewed ? '심사 완료' : '심사 대기') : '미제출'} />
              <DetailRow k="보고서 심사" v={record.reportFile ? (record.reportReviewed ? '심사 완료' : '심사 대기') : '미제출'} />
            </>
          )}

          {record.programType === '토익' && (
            <>
              <DetailRow k="응시일자" v={record.testDate} />
              <DetailRow k="수험번호" v={record.testNumber} />
              <DetailRow k="TOTAL" v={`${record.totalScore}점`} />
              <DetailRow k="발급번호" v={record.issueNumber || '-'} />
              <DetailRow k="유효기간" v={record.validUntil} />
            </>
          )}

          {record.programType === '전공연계봉사활동' && (
            <>
              <DetailRow k="인정시간" v={`${record.recognizedHours}시간`} />
              <DetailRow k="누적시간" v={`${record.accumulatedHours}시간`} />
              <DetailRow k="인증서" v={record.certFile ? `${record.certFile.name} · ${Math.round(record.certFile.size / 1024)}KB` : '미제출'} />
            </>
          )}
        </div>

        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">전체 진행 이력</p>
          <HistoryList history={record.history} />
        </div>
      </div>
    </Modal>
  );
}

function DetailRow({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider w-24 shrink-0 pt-0.5">{k}</span>
      <span className="text-sm text-slate-700">{v}</span>
    </div>
  );
}

function MessageModal({ user, onClose }: { user: User; onClose: () => void }) {
  const { dispatch } = useRecords();
  const { toast } = useToast();
  const [professor, setProfessor] = useState(PROFESSORS[0]);
  const [body, setBody] = useState('');

  const send = () => {
    if (!professor.trim() || !body.trim()) {
      toast('받는 교수와 내용을 입력하세요.', 'error');
      return;
    }
    const message: Message = {
      id: `msg-${Date.now()}`,
      fromId: user.studentId ?? '',
      fromName: user.name,
      toProfessor: professor.trim(),
      body: body.trim(),
      createdAt: new Date().toISOString(),
      read: false,
    };
    dispatch({ type: 'SEND_MESSAGE', message });
    toast(`${professor.trim()} 교수님께 쪽지를 보냈습니다.`, 'success');
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="담당교수께 쪽지 보내기"
      footer={<><Button variant="secondary" onClick={onClose}>취소</Button><Button onClick={send} data-testid="msg-send">보내기</Button></>}
    >
      <div className="flex flex-col gap-4">
        <FieldGroup label="받는 교수">
          <Input list="msg-professor-options" value={professor} onChange={(e) => setProfessor(e.target.value)} placeholder="교수명 검색 또는 직접입력" data-testid="msg-professor" />
          <datalist id="msg-professor-options">
            {PROFESSORS.map((p) => <option key={p} value={p} />)}
          </datalist>
        </FieldGroup>
        <FieldGroup label="내용">
          <Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="쪽지 내용을 입력하세요" data-testid="msg-body" />
        </FieldGroup>
      </div>
    </Modal>
  );
}
