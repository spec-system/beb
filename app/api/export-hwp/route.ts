import { generateHwpx } from '../../../server/hwpx.mjs';

export const runtime = 'nodejs';

const METHOD_NOT_ALLOWED = { error: 'POST만 허용됩니다.' };
const JSON_HEADERS = { 'Content-Type': 'application/json; charset=utf-8' };

function methodNotAllowed(includeBody = true): Response {
  return new Response(includeBody ? JSON.stringify(METHOD_NOT_ALLOWED) : null, {
    status: 405,
    headers: JSON_HEADERS,
  });
}

function errorResponse(error: unknown): Response {
  return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
    status: 400,
    headers: JSON_HEADERS,
  });
}

export async function POST(request: Request): Promise<Response> {
  try {
    const rawBody = await request.text();
    const parsedBody = JSON.parse(rawBody || '{}');
    const body = typeof parsedBody === 'string' ? JSON.parse(parsedBody || '{}') : parsedBody || {};
    const { markdown, filename = 'document', preset } = body;
    const buf = await generateHwpx(markdown, preset);
    const safe = String(filename).replace(/[\\/:*?"<>|\u0000-\u001F\u007F]/g, '_') || 'document';

    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(safe)}.hwpx`,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export function GET(): Response {
  return methodNotAllowed();
}

export function OPTIONS(): Response {
  return methodNotAllowed();
}

export function PUT(): Response {
  return methodNotAllowed();
}

export function PATCH(): Response {
  return methodNotAllowed();
}

export function DELETE(): Response {
  return methodNotAllowed();
}

export function HEAD(): Response {
  return methodNotAllowed(false);
}
