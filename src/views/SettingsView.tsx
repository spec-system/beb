import React, { useMemo, useState } from 'react';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { FieldGroup, Input, Select, Textarea } from '../components/ui/Field';
import { Table, THead, Th, Td } from '../components/ui/Table';
import { PROFESSORS, STUDENTS } from '../data/seed';
import { useSettings, StudentStatus } from '../store/settingsStore';
import { useToast } from '../components/ui/Toast';

const GRADES = ['1학년', '2학년', '3학년', '4학년'];
const STATUSES: StudentStatus[] = ['재학', '유급', '휴학'];

export default function SettingsView() {
  const { state, dispatch } = useSettings();
  const { toast } = useToast();
  const [deadlineLabel, setDeadlineLabel] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeBody, setNoticeBody] = useState('');
  const [signatureProfessor, setSignatureProfessor] = useState(PROFESSORS[0]);

  const students = useMemo(() => {
    const names = new Map(STUDENTS.map((s) => [s.studentId, s.name]));
    return Object.values(state.studentOverrides)
      .map((override) => ({ ...override, name: names.get(override.studentId) ?? '-' }))
      .sort((a, b) => a.studentId.localeCompare(b.studentId));
  }, [state.studentOverrides]);

  const addDeadline = () => {
    if (!deadlineLabel.trim() || !deadlineDate) {
      toast('마감명과 날짜를 입력하세요.', 'error');
      return;
    }
    dispatch({ type: 'ADD_DEADLINE', deadline: { id: `dl-${Date.now()}`, label: deadlineLabel.trim(), dueDate: deadlineDate } });
    setDeadlineLabel('');
    setDeadlineDate('');
    toast('마감 배너를 등록했습니다.', 'success');
  };

  const addNotice = () => {
    if (!noticeTitle.trim() || !noticeBody.trim()) {
      toast('공지 제목과 내용을 입력하세요.', 'error');
      return;
    }
    dispatch({
      type: 'ADD_NOTICE',
      notice: { id: `nt-${Date.now()}`, title: noticeTitle.trim(), body: noticeBody.trim(), createdAt: new Date().toISOString() },
    });
    setNoticeTitle('');
    setNoticeBody('');
    toast('공지 배너를 등록했습니다.', 'success');
  };

  const onSignatureFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      dispatch({
        type: 'SET_SIGNATURE',
        signature: {
          professorName: signatureProfessor,
          dataUrl: String(reader.result ?? ''),
          fileName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      });
      toast('교수 서명을 등록했습니다.', 'success');
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="설정" sub="학생 예외 정보, 마감/공지 배너, 교수 서명 이미지를 관리합니다." />

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">학생 정보 예외 처리</h2>
          <p className="text-sm text-slate-500">학년, 학적 상태, 근태 메모를 수정합니다.</p>
        </div>
        <Table>
          <THead>
            <Th>학번</Th>
            <Th>이름</Th>
            <Th>학년</Th>
            <Th>상태</Th>
            <Th>근태 메모</Th>
          </THead>
          <tbody>
            {students.map((student) => (
              <tr key={student.studentId} className="border-t border-slate-100">
                <Td className="font-mono text-slate-600">{student.studentId}</Td>
                <Td className="font-semibold">{student.name}</Td>
                <Td>
                  <Select
                    value={student.grade}
                    onChange={(e) => dispatch({ type: 'UPDATE_STUDENT', override: { ...student, grade: e.target.value } })}
                  >
                    {GRADES.map((grade) => <option key={grade}>{grade}</option>)}
                  </Select>
                </Td>
                <Td>
                  <Select
                    value={student.status}
                    onChange={(e) => dispatch({ type: 'UPDATE_STUDENT', override: { ...student, status: e.target.value as StudentStatus } })}
                  >
                    {STATUSES.map((status) => <option key={status}>{status}</option>)}
                  </Select>
                </Td>
                <Td>
                  <Textarea
                    value={student.attendanceMemo}
                    onChange={(e) => dispatch({ type: 'UPDATE_STUDENT', override: { ...student, attendanceMemo: e.target.value } })}
                    rows={2}
                    placeholder="근태 특이사항"
                  />
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">마감일 배너</h2>
            <p className="text-sm text-slate-500">상단 공지 영역에 표시됩니다.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <FieldGroup label="마감명">
              <Input value={deadlineLabel} onChange={(e) => setDeadlineLabel(e.target.value)} placeholder="예: 결과보고서 제출 마감" />
              </FieldGroup>
            </div>
            <FieldGroup label="날짜">
              <Input type="date" value={deadlineDate} onChange={(e) => setDeadlineDate(e.target.value)} />
            </FieldGroup>
          </div>
          <Button onClick={addDeadline}>마감 추가</Button>
          <div className="space-y-2">
            {state.deadlines.map((deadline) => (
              <div key={deadline.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 p-3 text-sm">
                <span><b>{deadline.label}</b> · {deadline.dueDate}</span>
                <Button variant="ghost" onClick={() => dispatch({ type: 'REMOVE_DEADLINE', id: deadline.id })}>삭제</Button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">공지 배너</h2>
            <p className="text-sm text-slate-500">로그인 화면과 대시보드 상단에 표시됩니다.</p>
          </div>
          <FieldGroup label="제목">
            <Input value={noticeTitle} onChange={(e) => setNoticeTitle(e.target.value)} placeholder="공지 제목" />
          </FieldGroup>
          <FieldGroup label="내용">
            <Textarea value={noticeBody} onChange={(e) => setNoticeBody(e.target.value)} rows={3} placeholder="공지 내용" />
          </FieldGroup>
          <Button onClick={addNotice}>공지 추가</Button>
          <div className="space-y-2">
            {state.notices.map((notice) => (
              <div key={notice.id} className="rounded-lg bg-slate-50 p-3 text-sm space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <b>{notice.title}</b>
                    <p className="text-slate-600">{notice.body}</p>
                  </div>
                  <Button variant="ghost" onClick={() => dispatch({ type: 'REMOVE_NOTICE', id: notice.id })}>삭제</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">교수 서명 이미지</h2>
          <p className="text-sm text-slate-500">상세 화면과 자동 생성 문서에 표시할 서명 이미지를 등록합니다.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <FieldGroup label="담당교수">
            <Select value={signatureProfessor} onChange={(e) => setSignatureProfessor(e.target.value)}>
              {PROFESSORS.map((professor) => <option key={professor}>{professor}</option>)}
            </Select>
          </FieldGroup>
          <div className="sm:col-span-2">
            <FieldGroup label="서명 이미지">
            <Input type="file" accept="image/*" onChange={(e) => onSignatureFile(e.target.files?.[0])} />
            </FieldGroup>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {state.signatures.map((signature) => (
            <div key={signature.professorName} className="rounded-lg border border-slate-200 p-3 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <b>{signature.professorName}</b>
                  <p className="text-xs text-slate-500">{signature.fileName}</p>
                </div>
                <Button variant="ghost" onClick={() => dispatch({ type: 'REMOVE_SIGNATURE', professorName: signature.professorName })}>삭제</Button>
              </div>
              <img src={signature.dataUrl} alt={`${signature.professorName} 서명`} className="h-20 max-w-full object-contain rounded bg-slate-50" />
              <p className="text-xs text-slate-500">등록일: {signature.uploadedAt ? new Date(signature.uploadedAt).toLocaleString('ko-KR') : '-'}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
