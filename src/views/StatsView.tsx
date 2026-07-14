import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import type { TooltipValueType } from 'recharts';
import { useRecords } from '../store/recordsStore';
import { STUDENTS } from '../data/seed';
import { accumulatedApprovedHours, volunteerPercent } from '../utils/volunteer';
import PageHeader from '../components/ui/PageHeader';
import { Table, THead, Th, Td } from '../components/ui/Table';
import { FieldGroup, Select, Input } from '../components/ui/Field';

// 비교과 달성률: 최종 승인된 비교과 건수만 카운트(1건=25%, 4건 이상=100%)
function deptPercent(approvedCount: number): number {
  return Math.min(approvedCount * 25, 100);
}

const COLORS = { dept: '#3b82f6', toeic: '#8b5cf6', vol: '#10b981' };
const GRADES = ['2학년', '3학년', '4학년'];

export default function StatsView() {
  const { state } = useRecords();
  const [grade, setGrade] = useState('전체');
  const [name, setName] = useState('전체');
  const [studentQuery, setStudentQuery] = useState('');

  // 학생별 이수율 (최종 승인된 데이터만 집계, 검색 시점 기준)
  const perStudent = useMemo(() => {
    return STUDENTS.map((s) => {
      // 비교과: 최종 승인 건수만 0/25/50/100%로 환산
      const deptApprovedCount = state.dept.filter((r) => r.studentId === s.studentId && r.status === '최종 승인').length;
      const deptPct = deptPercent(deptApprovedCount);

      // 토익: 최종 승인 있으면 100 else 0
      const toeicPct = state.toeic.some((r) => r.studentId === s.studentId && (r.status === '최종 승인' || r.status === '승인')) ? 100 : 0;

      // 봉사: 최종승인된 인정시간 합 기준, 선형 min(합/20, 100)%
      const volHours = accumulatedApprovedHours(state.volunteer, s.studentId);
      const volPct = volunteerPercent(volHours);

      return { ...s, deptPct, toeicPct, volPct };
    });
  }, [state]);

  const nameOptions = useMemo(() => {
    const pool = grade === '전체' ? perStudent : perStudent.filter((s) => s.grade === grade);
    return ['전체', ...pool.map((s) => s.name)];
  }, [perStudent, grade]);

  const gradeFiltered = grade === '전체' ? perStudent : perStudent.filter((s) => s.grade === grade);
  const filtered = name === '전체' ? gradeFiltered : gradeFiltered.filter((s) => s.name === name);
  // 학생 검색 자동완성: '이름 (학번)' 또는 '이름' 입력 시 해당 학생 개인 통계로 이동
  const onStudentSearch = (value: string) => {
    setStudentQuery(value);
    const q = value.trim();
    if (!q) return;
    const match = perStudent.find((s) => q === `${s.name} (${s.studentId})` || q === s.name || q === s.studentId);
    if (match) {
      setGrade(match.grade);
      setName(match.name);
    }
  };

  // 개인 3영역 막대바 조건: 학년+이름 모두 선택되어 한 학생이 특정됨
  const individual = grade !== '전체' && name !== '전체' && filtered.length === 1 ? filtered[0] : null;

  // 학년별 그룹바 데이터 (X축=학년, 그룹=비교과/토익/봉사 평균)
  const gradeChartData = useMemo(() => {
    const scope = grade === '전체' ? GRADES : [grade];
    return scope.map((g) => {
      const pool = perStudent.filter((s) => s.grade === g);
      const avg = (key: 'deptPct' | 'toeicPct' | 'volPct') =>
        pool.length ? Math.round(pool.reduce((sum, s) => sum + s[key], 0) / pool.length) : 0;
      return { grade: g, 비교과: avg('deptPct'), 토익: avg('toeicPct'), 봉사: avg('volPct') };
    });
  }, [perStudent, grade]);

  // 개인 3영역 막대바 데이터
  const individualChartData = individual
    ? [
        { name: '학과내 비교과', value: individual.deptPct, fill: COLORS.dept },
        { name: '토익', value: individual.toeicPct, fill: COLORS.toeic },
        { name: '봉사 (20h 대비)', value: Math.round(individual.volPct), fill: COLORS.vol },
      ]
    : [];

  return (
    <div>
      <PageHeader
        title="비교과 프로그램 이수현황"
        sub="통계 화면"
        right={
          <div className="flex gap-2 items-end">
            <div className="w-52">
              <FieldGroup label="학생 검색">
                <Input
                  list="stats-student-options"
                  value={studentQuery}
                  onChange={(e) => onStudentSearch(e.target.value)}
                  placeholder="이름 또는 학번 입력"
                  data-testid="stats-search"
                />
                <datalist id="stats-student-options">
                  {perStudent.map((s) => (
                    <option key={s.studentId} value={`${s.name} (${s.studentId})`} />
                  ))}
                </datalist>
              </FieldGroup>
            </div>
            <div className="w-32">
              <FieldGroup label="학년 선택">
                <Select value={grade} onChange={(e) => { setGrade(e.target.value); setName('전체'); }} data-testid="stats-grade">
                  {['전체', ...GRADES].map((g) => <option key={g}>{g}</option>)}
                </Select>
              </FieldGroup>
            </div>
            <div className="w-32">
              <FieldGroup label="이름 선택">
                <Select value={name} onChange={(e) => setName(e.target.value)} disabled={grade === '전체'} data-testid="stats-name">
                  {nameOptions.map((n) => <option key={n}>{n}</option>)}
                </Select>
              </FieldGroup>
            </div>
          </div>
        }
      />
      <p className="text-xs text-slate-500 mb-6">현황은 검색 시점 기준이며, 최종 승인된 항목만 집계합니다. 학년만 선택하면 학년별 전체 통계, 학년+이름을 선택하면 개인 통계를 보여줍니다.</p>

      {individual ? (
        // ---- 개인 3영역 막대바 ----
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm mb-8" data-testid="stats-individual-chart">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">{individual.name} ({individual.grade}) 개인 이수율</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={individualChartData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} unit="%" />
              <Tooltip formatter={(v: TooltipValueType | undefined) => [`${v ?? 0}%`, '이수율']} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={80}>
                {individualChartData.map((c, i) => <Cell key={i} fill={c.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        // ---- 학년별 그룹 막대바 ----
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm mb-8" data-testid="stats-grade-chart">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">{grade === '전체' ? '학년별 전체' : grade} 평균 이수율 (영역별)</h2>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={gradeChartData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="grade" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} unit="%" />
              <Tooltip formatter={(v: TooltipValueType | undefined) => [`${v ?? 0}%`]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="비교과" fill={COLORS.dept} radius={[4, 4, 0, 0]} />
              <Bar dataKey="토익" fill={COLORS.toeic} radius={[4, 4, 0, 0]} />
              <Bar dataKey="봉사" fill={COLORS.vol} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <Table>
        <THead>
          <Th>학년</Th><Th>학번</Th><Th>이름</Th><Th>학과내 비교과</Th><Th>토익</Th><Th>봉사 (20h 대비)</Th>
        </THead>
        <tbody data-testid="stats-tbody">
          {filtered.map((s) => (
            <tr key={s.studentId} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <Td className="text-slate-700 font-medium">{s.grade}</Td>
              <Td className="text-slate-600">{s.studentId}</Td>
              <Td className="text-slate-800 font-medium">{s.name}</Td>
              <Td><PctCell v={s.deptPct} /></Td>
              <Td><PctCell v={s.toeicPct} /></Td>
              <Td><PctCell v={Math.round(s.volPct)} /></Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

function PctCell({ v }: { v: number }) {
  const color = v >= 100 ? 'text-green-700' : v >= 50 ? 'text-blue-700' : v > 0 ? 'text-amber-700' : 'text-slate-400';
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full bg-blue-500" style={{ width: `${v}%` }} />
      </div>
      <span className={`text-xs font-semibold ${color}`}>{v}%</span>
    </div>
  );
}
