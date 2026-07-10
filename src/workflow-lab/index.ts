import '../index.css';
import { el } from './core';

interface Card {
  href: string;
  title: string;
  desc: string;
}

const CARDS: Card[] = [
  {
    href: './dept.html',
    title: '① 학과내 비교과 신청·제출',
    desc: '신청 완료 → 담당교수 승인 → 학과장 신청 승인 → 포스터 업로드 → 결과보고서 제출 → 학과장 포스터·보고서 심사 → 최종 승인. 담당교수/학과장 반려(2종)·재신청·임시저장·승인취소까지 spec md 흐름을 그대로 시연합니다.',
  },
  {
    href: './toeic.html',
    title: '② 토익 정보 입력',
    desc: '접수 → 행정실 검토·승인/반려. 생년월일·발급번호 앞 6자리·학과 승인·비고 컬럼과 반려 사유/재등록 흐름을 확인합니다.',
  },
  {
    href: './volunteer.html',
    title: '③ 전공연계봉사활동',
    desc: '접수 → 인증서 업로드 → 행정실 검토·승인/반려. 봉사 활동 기관, 인증서 열기/다운로드, 반려 사유/재등록 흐름을 확인합니다.',
  },
  {
    href: './form.html',
    title: '④ 양식 작성 (HWP)',
    desc: '실제 FORM_SPECS/formToMarkdown 을 그대로 재사용해 계획서·결과보고서 탭 입력과 Markdown 미리보기, HWPX 변환 payload를 확인합니다.',
  },
];

function build(): HTMLElement {
  const banner = el('div', { className: 'portal-banner' }, [
    el('span', { className: 'portal-banner-pill', text: '검사 랩' }),
    el('span', { text: '삼육대학교 약학대학 비교과 통합행정 포탈의 업무 흐름을 로그인 없이 시연하는 검사용 사본입니다. 실제 데이터는 변경되지 않습니다.' }),
  ]);

  const cards = el(
    'div',
    { className: 'portal-grid' },
    CARDS.map((c) =>
      el('a', { className: 'portal-card', attrs: { href: c.href } }, [
        el('div', { className: 'portal-card-title', text: c.title }),
        el('div', { className: 'portal-card-desc', text: c.desc }),
      ]),
    ),
  );

  const box = el('div', { className: 'w-full max-w-3xl flex flex-col gap-4 border border-[#222222] bg-white p-6' }, [
    el('div', { className: 'text-center border-b border-[#222222] pb-3' }, [
      el('h1', { className: 'text-sm font-black text-[#1a251e] tracking-tight', text: 'SPECs 비교과 통합행정 포탈 · 워크플로우 검사 랩' }),
      el('p', { className: 'text-[10px] text-slate-500 font-bold mt-1', text: '[삼육대학교 약학대학]' }),
    ]),
    banner,
    el('div', { className: 'portal-guide' }, [
      el('strong', { text: '안내 ' }),
      '아래 4개 업무 카드를 열면 각 흐름이 실제 화면 그대로, 담당자 계정을 전환하며 한 단계씩 진행됩니다. 방향키(←/→) 또는 하단 버튼으로 슬라이드를 넘기세요.',
    ]),
    cards,
    el('div', { className: 'border-t border-[#cccccc] pt-3 text-[10px] text-slate-500 font-bold' }, [
      '상태는 메모리 전용이며 새로고침 시 초기화됩니다. · 통합조회/통계/설정은 검사 범위에서 제외됩니다.',
    ]),
  ]);

  return el('div', { className: 'portal-shell min-h-screen flex items-center justify-center px-4 py-8 font-sans select-none' }, [box]);
}

const root = document.getElementById('deck-root') ?? document.body;
root.replaceChildren(build());
