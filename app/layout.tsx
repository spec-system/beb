import type { Metadata } from 'next';
import '../src/index.css';

export const metadata: Metadata = {
  title: 'SPECs 비교과 통합행정 포탈',
  description: '삼육대학교 약학대학 비교과 통합행정 포탈',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
