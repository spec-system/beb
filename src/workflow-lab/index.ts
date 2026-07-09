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
    href: './legacy.html',
    title: '⑤ Legacy 오프라인 프로세스',
    desc: '기존 대면·수기 서명·구글폼 스캔 프로세스(신청서 5단계 + 결과보고서 7단계)를 단계별로 정리합니다.',
  },
  {
    href: './ballpassing.html',
    title: '⑥ Ball Passing Model',
    desc: "spec md §3의 [사용자] '행동' {state} 볼 패싱 흐름도를 노드별로 진행합니다. 비교과(3.1)·토익(3.2)·봉사(3.3)를 모두 포함합니다.",
  },
  {
    href: './form.html',
    title: '④ 양식 작성 (HWP)',
    desc: '실제 FORM_SPECS/formToMarkdown 을 그대로 재사용해 계획서·결과보고서 탭 입력과 Markdown 미리보기, HWPX 변환 payload를 확인합니다.',
  },
];

function build(): HTMLElement {
  const marquee = document.createElement('marquee');
  marquee.setAttribute('scrollamount', '3');
  marquee.className = 'bg-black text-[#00ff00] border border-[#00ff00] p-1 font-mono text-[11px] block';
  marquee.textContent =
    '★★ [검사 랩] 본 화면은 삼육대학교 약학대학 비교과 통합행정 포탈의 업무 흐름을 로그인 없이 PPT처럼 시연하는 검사용 사본입니다. 실제 데이터는 변경되지 않습니다 ★★';

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
      el('h1', { className: 'text-sm font-black text-[#1a251e] tracking-tight', text: 'SU-WINGs 비교과 통합행정 포탈 · 워크플로우 검사 랩' }),
      el('p', { className: 'text-[10px] text-slate-500 font-bold mt-1', text: '[삼육대학교 약학대학]' }),
    ]),
    marquee,
    el('div', { className: 'border border-[#b23b3b] p-2.5 text-[11px] text-[#b23b3b] bg-[#fff5f5] leading-normal font-bold' }, [
      el('strong', { text: '[안내] ' }),
      '아래 6개 업무 카드를 열면 각 흐름이 실제 화면 그대로, 담당자 계정을 전환하며 한 단계씩 진행됩니다. 방향키(←/→) 또는 하단 버튼으로 슬라이드를 넘기세요.',
    ]),
    cards,
    el('div', { className: 'border-t border-[#cccccc] pt-3 text-[10px] text-slate-500 font-bold' }, [
      '상태는 메모리 전용이며 새로고침 시 초기화됩니다. · 익명 게시판/통합조회/통계/설정은 검사 범위에서 제외됩니다.',
    ]),
  ]);

  return el('div', { className: 'min-h-screen flex items-center justify-center bg-[#e9ecef] px-4 py-8 font-mono select-none' }, [box]);
}

const root = document.getElementById('deck-root') ?? document.body;
root.replaceChildren(build());
