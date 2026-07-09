import { DeptProgramRecord, DocumentKind, VolunteerRecord } from '../types';
import { SignatureImg } from '../store/settingsStore';
import { triggerDownload } from './download';
import { downloadHwpx } from './hwp';

type DocumentRecord = DeptProgramRecord | VolunteerRecord;

const encoder = new TextEncoder();

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

const RELS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i += 1) {
  let c = i;
  for (let j = 0; j < 8; j += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[i] = c >>> 0;
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function concat(parts: Uint8Array[]): Uint8Array {
  const size = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

function u16(value: number): Uint8Array {
  return new Uint8Array([value & 0xff, (value >>> 8) & 0xff]);
}

function u32(value: number): Uint8Array {
  return new Uint8Array([value & 0xff, (value >>> 8) & 0xff, (value >>> 16) & 0xff, (value >>> 24) & 0xff]);
}

function zipStore(files: { name: string; content: string }[]): Blob {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const name = encoder.encode(file.name);
    const data = encoder.encode(file.content);
    const crc = crc32(data);

    const local = concat([
      u32(0x04034b50),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(name.length),
      u16(0),
      name,
      data,
    ]);

    localParts.push(local);
    centralParts.push(
      concat([
        u32(0x02014b50),
        u16(20),
        u16(20),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(crc),
        u32(data.length),
        u32(data.length),
        u16(name.length),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(0),
        u32(offset),
        name,
      ]),
    );
    offset += local.length;
  }

  const localBytes = concat(localParts);
  const centralBytes = concat(centralParts);
  const end = concat([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(files.length),
    u16(files.length),
    u32(centralBytes.length),
    u32(localBytes.length),
    u16(0),
  ]);

  return new Blob([concat([localBytes, centralBytes, end])], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

function xmlEscape(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function paragraph(label: string, value?: unknown): string {
  return `<w:p><w:r><w:t>${xmlEscape(label)}: ${xmlEscape(value || '-')}</w:t></w:r></w:p>`;
}

function title(text: string): string {
  return `<w:p><w:r><w:rPr><w:b/><w:sz w:val="32"/></w:rPr><w:t>${xmlEscape(text)}</w:t></w:r></w:p>`;
}

function documentLabel(kind: DocumentKind): string {
  return kind === 'application' ? '신청서' : '결과보고서';
}

interface FieldRow {
  label: string;
  value: string;
}

function fmt(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
}

function recordFieldRows(record: DocumentRecord, kind: DocumentKind, signature?: SignatureImg): FieldRow[] {
  const rows: FieldRow[] = [
    { label: '문서', value: documentLabel(kind) },
    { label: '프로그램 유형', value: fmt(record.programType) },
    { label: '프로그램명', value: fmt(record.title) },
    { label: '학생', value: `${record.name} (${record.studentId})` },
    { label: '학년', value: fmt(record.grade) },
    { label: '연도/학기', value: `${record.year} / ${record.semester}` },
    { label: '담당교수', value: fmt(record.professor) },
    { label: '인정시간', value: fmt(record.recognizedHours) },
    { label: '진행상태', value: fmt(record.status) },
    { label: '최종 승인일', value: 'finalApprovalDate' in record ? fmt(record.finalApprovalDate) : '-' },
    { label: '행정실 코멘트', value: fmt(record.adminComment) },
    { label: '신청서 전송 상태', value: fmt(record.documentStatus?.application) },
    { label: '결과보고서 전송 상태', value: fmt(record.documentStatus?.result) },
  ];

  if ('teamMembers' in record) {
    rows.push(
      { label: '팀 구성원', value: fmt(record.teamMembers.map((m) => `${m.name}(${m.studentId})`).join(', ')) },
      { label: '계획서', value: fmt(record.plan) },
      { label: '보고서 파일', value: fmt(record.reportFile?.name) },
      { label: '포스터 파일', value: record.posterFile ? '제출' : '미제출' },
    );
  } else {
    rows.push(
      { label: '누적 봉사시간', value: fmt(record.accumulatedHours) },
      { label: '봉사 인증서', value: fmt(record.certFile?.name) },
    );
  }

  rows.push(
    { label: '서명 등록 교수', value: fmt(signature?.professorName) },
    { label: '서명 파일', value: fmt(signature?.fileName) },
    { label: '서명 등록일', value: signature?.uploadedAt ? new Date(signature.uploadedAt).toLocaleString('ko-KR') : '-' },
  );

  return rows;
}

function recordRows(record: DocumentRecord, kind: DocumentKind, signature?: SignatureImg): string[] {
  return recordFieldRows(record, kind, signature).map((r) => paragraph(r.label, r.value));
}

export function createRecordDocxBlob(record: DocumentRecord, kind: DocumentKind, signature?: SignatureImg): Blob {
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${title(`${record.programType} ${documentLabel(kind)}`)}
    ${recordRows(record, kind, signature).join('\n    ')}
    <w:p><w:r><w:t>※ 본 문서는 프론트엔드 목업에서 자동 생성되었습니다.</w:t></w:r></w:p>
    <w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr>
  </w:body>
</w:document>`;

  return zipStore([
    { name: '[Content_Types].xml', content: CONTENT_TYPES },
    { name: '_rels/.rels', content: RELS },
    { name: 'word/document.xml', content: documentXml },
  ]);
}

export function downloadRecordDocx(record: DocumentRecord, kind: DocumentKind, signature?: SignatureImg): void {
  const safe = `${record.studentId}-${record.name}-${documentLabel(kind)}`.replace(/[\\/:*?"<>|]/g, '_');
  triggerDownload(createRecordDocxBlob(record, kind, signature), `${safe}.docx`);
}

// ── HWP(HWPX) 변환 ──────────────────────────────────────────────
// 서버에는 HWP 바이너리를 저장하지 않는다. 레코드(텍스트/JSON)만 저장하고,
// 다운로드 시점에 마크다운으로 직렬화 → 서버(kordoc)에서 HWPX를 즉석 생성한다.

const mdCell = (value: string): string => value.replace(/\|/g, '\\|').replace(/\r?\n+/g, ' ').trim() || '-';

export function recordToMarkdown(record: DocumentRecord, kind: DocumentKind, signature?: SignatureImg): string {
  const rows = recordFieldRows(record, kind, signature);
  const lines: string[] = [
    `# ${record.programType} ${documentLabel(kind)}`,
    '',
    '| 항목 | 내용 |',
    '| --- | --- |',
    ...rows.map((r) => `| ${mdCell(r.label)} | ${mdCell(r.value)} |`),
    '',
  ];

  if ('plan' in record && record.plan?.trim()) {
    lines.push(kind === 'result' ? '## 결과 요약' : '## 계획 내용', '', record.plan.trim(), '');
  }

  return lines.join('\n').trim() + '\n';
}

export async function downloadRecordHwpx(record: DocumentRecord, kind: DocumentKind, signature?: SignatureImg): Promise<void> {
  const safe = `${record.studentId}-${record.name}-${documentLabel(kind)}`;
  const preset = kind === 'application' ? '계획서' : '보고서';
  await downloadHwpx(recordToMarkdown(record, kind, signature), safe, preset);
}
