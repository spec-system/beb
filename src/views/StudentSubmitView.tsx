import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Languages, HeartHandshake, FilePen } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';

const CARDS = [
  {
    to: '/dept',
    title: '학과내 비교과 신청·제출',
    description: '대표학생으로 프로그램을 등록하고 팀원, 계획서, 결과보고서 PDF를 제출합니다.',
    icon: BookOpen,
  },
  {
    to: '/form',
    title: '양식 작성 (HWP 변환)',
    description: '정해진 양식 칸에 입력하면 한컴(HWPX) 문서로 자동 변환·다운로드됩니다.',
    icon: FilePen,
  },
  {
    to: '/toeic',
    title: '토익 정보 입력',
    description: '응시일자, 수험번호, 점수, 발급번호 등 성적표 기재 정보를 입력합니다.',
    icon: Languages,
  },
  {
    to: '/volunteer',
    title: '봉사 인증서 업로드',
    description: '전공연계봉사활동을 등록하고 담당교수 서명 인증서를 업로드합니다.',
    icon: HeartHandshake,
  },
];

export default function StudentSubmitView() {
  return (
    <div>
      <PageHeader title="신청·제출" sub="학생 제출 포털" />
      <div className="grid gap-4 md:grid-cols-4">
        {CARDS.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="border-2 border-slate-800 bg-white p-5 shadow-[4px_4px_0_rgba(0,0,0,0.2)] hover:bg-[#edf4ee] block select-none cursor-pointer"
          >
            <card.icon size={20} className="mb-3 text-[#3c6e91]" />
            <h2 className="mb-2 text-sm font-black text-slate-900">{card.title}</h2>
            <p className="text-xs leading-5 text-slate-600 font-bold">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
