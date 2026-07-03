// 텍스트 부분 일치 (학번/이름 필터)
export function matchText(hay: string, needle: string): boolean {
  if (!needle.trim()) return true;
  return hay.toLowerCase().includes(needle.trim().toLowerCase());
}
