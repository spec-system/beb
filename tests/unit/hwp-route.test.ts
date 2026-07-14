import { beforeEach, describe, expect, it, vi } from 'vitest';

const generateHwpx = vi.hoisted(() => vi.fn());

vi.mock('../../server/hwpx.mjs', () => ({ generateHwpx }));

import { DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT } from '../../app/api/export-hwp/route';

describe('HWP export route', () => {
  beforeEach(() => {
    generateHwpx.mockReset();
    generateHwpx.mockResolvedValue(new Uint8Array([1, 2, 3]));
  });

  it('rejects every non-POST method with the JSON contract', async () => {
    const handlers = [GET, OPTIONS, PUT, PATCH, DELETE];

    for (const handler of handlers) {
      const response = handler();

      expect(response.status).toBe(405);
      expect(response.headers.get('content-type')).toContain('application/json');
      await expect(response.json()).resolves.toEqual({ error: 'POST만 허용됩니다.' });
    }
  });

  it('returns an empty 405 response for HEAD', async () => {
    const response = HEAD();

    expect(response.status).toBe(405);
    expect(response.headers.get('content-type')).toContain('application/json');
    await expect(response.text()).resolves.toBe('');
  });

  it('serializes the request, sanitizes the filename, and returns HWPX bytes', async () => {
    const response = await POST(
      new Request('http://localhost/api/export-hwp', {
        method: 'POST',
        body: JSON.stringify({ markdown: '# 내용', filename: '보고서/2026', preset: '보고서' }),
      }),
    );

    expect(generateHwpx).toHaveBeenCalledWith('# 내용', '보고서');
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/octet-stream');
    expect(response.headers.get('content-disposition')).toBe("attachment; filename*=UTF-8''%EB%B3%B4%EA%B3%A0%EC%84%9C_2026.hwpx");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
  });

  it('returns a JSON 400 response when conversion fails', async () => {
    generateHwpx.mockRejectedValueOnce(new Error('conversion failed'));

    const response = await POST(
      new Request('http://localhost/api/export-hwp', {
        method: 'POST',
        body: JSON.stringify({ markdown: '# 내용' }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'conversion failed' });
  });
});
