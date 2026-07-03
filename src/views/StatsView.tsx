import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useRecords } from '../store/recordsStore';
import { STUDENTS } from '../data/seed';
import PageHeader from '../components/ui/PageHeader';
import { Table, THead, Th, Td } from '../components/ui/Table';
import { FieldGroup, Select } from '../components/ui/Field';

// 비교과 진행률: 최종승인만 카운트 → 통계 화면 정의(0/25/50/100%)
// 계획서승인=25, 보고서접수=50, 최종승인=100, 그 이전=0
function deptPercent(status: string): number {
  switch (status) {
    case '최종 승인': return 100;
    case '보고서 담당승인': return 75;
    case '보고서 접수': return 50;
    case '계획서 승인': return 25;
    default: return 0;
  }
}

export default function StatsView() {
  const { state } = useRecords();
  const [grade, setGrade] = useState('전체');

  const perStudent = useMemo(() => {
    return STUDENTS.map((s) => {
      // 비교과: 학생의 레코드 중 진행률 최대값 (최종승인 100 기준)
      const deptRecs = state.dept.filter((r) => r.studentId === s.studentId);
      const deptPct = deptRecs.length ? Math.max(...deptRecs.map((r) => deptPercent(r.status))) : 0;

      // 토익: 최종 승인 있으면 100 else 0
      const toeicPct = state.toeic.some((r) => r.studentId === s.studentId && r.status === '승인') ? 100 : 0;

      // 봉사: 최종승인된 누적시간 기준, 20시간 대비 %
      const volApproved = state.volunteer.filter((r) => r.studentId === s.studentId && r.status === '승인');
      const volHours = volApproved.reduce((sum, r) => Math.max(sum, r.accumulatedHours), 0);
      const volPct = Math.min(volHours / 20, 1) * 100;

      return { ...s, deptPct, toeicPct, volPct };
    });
  }, [state]);

  const filtered = grade === '전체' ? perStudent : perStudent.filter((s) => s.grade === grade);

  const avg = (key: 'deptPct' | 'toeicPct' | 'volPct') =>
    filtered.length ? Math.round(filtered.reduce((sum, s) => sum + s[key], 0) / filtered.length) : 0;

  const chartData = [
    { name: '학과내 비교과', value: avg('deptPct'), fill: '#3b82f6' },
    { name: '토익', value: avg('toeicPct'), fill: '#8b5cf6' },
    { name: '봉사 (20h 대비)', value: avg('volPct'), fill: '#10b981' },
  ];

  return (
    <div>
      <PageHeader
        title="비교과 프로그램 이수현황"
        sub="통계 화면"
        right={
          <div className="w-40">
            <FieldGroup label="학년 선택">
              <Select value={grade} onChange={(e) => setGrade(e.target.value)}>
                {['전체', '2학년', '3학년', '4학년'].map((g) => <option key={g}>{g}</option>)}
              </Select>
            </FieldGroup>
          </div>
        }
      />
      <p className="text-xs text-slate-500 mb-6">현황은 검색 시점 기준이며, 최종 승인된 항목만 집계합니다.</p>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {chartData.map((c) => (
          <div key={c.name} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500 mb-1">{c.name} 평균 이수율</p>
            <p className="text-3xl font-bold" style={{ color: c.fill }}>{c.value}%</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm mb-8">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">
          {grade === '전체' ? '전체' : grade} 평균 이수율 막대그래프
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} unit="%" />
            <Tooltip formatter={(v: number) => [`${v}%`, '평균 이수율']} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={80}>
              {chartData.map((c, i) => <Cell key={i} fill={c.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

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
