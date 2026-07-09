import '../index.css';
import { FORM_SPECS, formToMarkdown, type FormSpec, type FormValues } from '../utils/planForm';
import { bootDeck, el, pageHeader, winButton, type DeckStep } from './core';

interface FormVM {
  specId: string;
  values: FormValues;
  payload: string | null;
  message: string;
}

const DEFAULT_VALUES: FormValues = {
  studentId: '20231234',
  name: '학생',
  dept: '약학과',
  grade: '3학년',
  programName: '임상약학 케이스 스터디 프로젝트',
  period: '2026-03-02 ~ 2026-06-30',
  professor: '담당교수',
  contact: '010-1111-2222',
  purpose: '실제 처방 사례를 분석해 임상 의사결정 역량을 기릅니다.',
  plan: '주차별 사례 조사 → 중간 점검 세미나 → 결과 발표/보고서 작성 순으로 진행합니다.',
  expectation: '사례 기반 문제해결 능력과 팀 협업 역량을 강화합니다.',
  hours: '10',
  activity: '처방 사례 수집·분석, 세미나 발표, 보고서 작성을 수행했습니다.',
  result: '표준 치료지침 대비 개선점을 정리한 발표 자료와 보고서를 산출했습니다.',
  reflection: '근거 중심 접근의 중요성을 체감했고 후속 심화 스터디를 계획합니다.',
};

const getSpec = (id: string): FormSpec => FORM_SPECS.find((s) => s.id === id) ?? FORM_SPECS[0];

const initial: FormVM = {
  specId: FORM_SPECS[0]?.id ?? 'plan',
  values: { ...DEFAULT_VALUES },
  payload: null,
  message: '입력값이 양식 그대로 Markdown으로 변환됩니다.',
};

const field = (label: string, node: Node): HTMLElement =>
  el('div', {}, [
    el('div', { className: 'flex flex-col gap-1.5' }, [
      el('label', { className: 'text-[11px] font-bold text-slate-950 uppercase tracking-wider', text: label }),
      node,
    ]),
  ]);
const dispInput = (value: string): HTMLElement => el('input', { className: 'w-full', attrs: { value, disabled: 'true' } });
const dispArea = (value: string): HTMLElement => el('textarea', { className: 'w-full', text: value, attrs: { rows: '4', disabled: 'true' } });

function renderForm(vm: FormVM, hl: 'plan-tab' | 'report-tab' | 'download' | null): HTMLElement {
  const spec = getSpec(vm.specId);

  const tabs = el(
    'div',
    { className: 'mb-5 flex items-center gap-2' },
    FORM_SPECS.map((s) => {
      const active = s.id === spec.id;
      const wantHl = (hl === 'plan-tab' && s.id === 'plan') || (hl === 'report-tab' && s.id === 'report');
      return el('button', {
        className: `border-2 border-slate-800 px-3 py-1.5 text-xs font-black ${active ? 'bg-[#3c6e91] text-white' : 'bg-white text-slate-800'} ${wantHl ? 'deck-hl' : ''}`,
        text: s.title,
        attrs: { type: 'button' },
      });
    }),
  );

  const sections = spec.sections.map((section) => {
    if (section.kind === 'table') {
      return el(
        'div',
        { className: 'grid gap-3 sm:grid-cols-2' },
        section.fields.map((f) =>
          el('div', { className: f.full ? 'sm:col-span-2' : '' }, [field(f.label, dispInput(vm.values[f.key] ?? ''))]),
        ),
      );
    }
    const key = section.fields[0]?.key ?? '';
    return field(section.heading ?? section.fields[0]?.label ?? '내용', dispArea(vm.values[key] ?? ''));
  });

  const formCol = el('div', { className: 'border-2 border-slate-800 bg-white p-5' }, [
    el('h2', { className: 'mb-4 text-sm font-black text-slate-900', text: spec.title }),
    el('div', { className: 'flex flex-col gap-6' }, sections),
  ]);

  const previewCol = el('div', { className: 'border-2 border-slate-800 bg-[#f8f8f4] p-4' }, [
    el('div', { className: 'mb-2 flex items-center gap-1.5 text-xs font-black text-slate-700', text: '변환 미리보기 (Markdown)' }),
    el('pre', {
      className: 'max-h-[420px] overflow-auto whitespace-pre-wrap break-words text-[11px] leading-5 text-slate-800 font-mono',
      text: formToMarkdown(spec, vm.values),
    }),
  ]);

  const columns = el('div', { className: 'grid gap-6 lg:grid-cols-[1fr_360px]' }, [formCol, previewCol]);

  const children: HTMLElement[] = [
    pageHeader('양식 작성', 'HWP 자동 변환', winButton('HWP 다운로드', { size: 'sm', highlight: hl === 'download' })),
    tabs,
    columns,
    el('p', { className: 'mt-4 text-[11px] font-bold text-slate-500', text: `※ ${vm.message}` }),
  ];

  if (vm.payload) {
    children.push(
      el('div', { className: 'mt-4 border-2 border-slate-800 bg-[#0f172a] p-4' }, [
        el('div', { className: 'mb-2 text-xs font-black text-[#e2e8f0]', text: '최근 HWPX 변환 payload (시뮬레이션)' }),
        el('pre', { className: 'overflow-auto whitespace-pre-wrap break-words text-[11px] leading-5 text-[#e2e8f0] font-mono', text: vm.payload }),
      ]),
    );
  }

  return el('div', {}, children);
}

const toReport = (s: FormVM): FormVM => ({ ...s, specId: 'report', message: '결과보고서 탭으로 전환했습니다. 미리보기가 즉시 다시 계산됩니다.' });
const makePayload = (s: FormVM): FormVM => {
  const spec = getSpec(s.specId);
  const payload = {
    filename: `${s.values.studentId || '학번'}-${s.values.name || '성명'}-${spec.title}`,
    preset: spec.preset,
    markdown: formToMarkdown(spec, s.values),
  };
  return { ...s, payload: JSON.stringify(payload, null, 2), message: `${spec.title} payload를 준비했습니다. 서버(kordoc)에서 HWPX로 생성됩니다.` };
};

const steps: DeckStep<FormVM>[] = [
  {
    actor: 'STUDENT',
    menu: '양식 작성 (HWP)',
    caption: '계획서 양식을 입력합니다',
    note: '학생이 계획서 탭의 각 칸을 채우면, 오른쪽 Markdown 미리보기가 실제 formToMarkdown 결과로 즉시 갱신됩니다.',
    render: (s) => renderForm(s, 'plan-tab'),
  },
  {
    actor: 'STUDENT',
    menu: '양식 작성 (HWP)',
    caption: '결과보고서 탭으로 전환',
    note: '탭을 바꾸면 FORM_SPECS의 결과보고서 양식 구조(활동 내용/성과/소감)로 폼과 미리보기가 함께 바뀝니다.',
    mutate: toReport,
    render: (s) => renderForm(s, 'report-tab'),
  },
  {
    actor: 'STUDENT',
    menu: '양식 작성 (HWP)',
    caption: 'HWP 다운로드 payload 준비',
    note: '[HWP 다운로드]를 누르면 filename·preset·markdown payload가 준비됩니다. 실제 서비스에서는 이 payload가 서버(kordoc)로 전달되어 한컴 공문서 HWPX로 생성됩니다.',
    mutate: makePayload,
    render: (s) => renderForm(s, 'download'),
  },
];

bootDeck<FormVM>({ program: '양식 작성 (HWP)', initial, steps });
