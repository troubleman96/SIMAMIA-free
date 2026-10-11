import { NextResponse } from 'next/server';
import { hasAdminSession, isSameOrigin } from '../../../../../lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ path: string[] }> };

async function proxy(request: Request, context: Context) {
  if (!(await hasAdminSession()))
    return NextResponse.json({ error: 'Admin sign-in required' }, { status: 401 });
  if (request.method !== 'GET' && !isSameOrigin(request))
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  const token = process.env.SIMAMIA_ADMIN_API_TOKEN;
  if (!token || token.length < 32)
    return NextResponse.json({ error: 'Admin API is not configured' }, { status: 503 });
  const { path } = await context.params;
  if (!path.length || path.some((part) => part === '.' || part === '..' || part.includes('/'))) {
    return NextResponse.json({ error: 'Invalid API path' }, { status: 400 });
  }
  const base = (process.env.SIMAMIA_API_URL ?? 'http://api:8080/api/v1').replace(/\/$/, '');
  const target = new URL(`${base}/admin/${path.map(encodeURIComponent).join('/')}`);
  target.search = new URL(request.url).search;
  let body: string | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const contentLength = Number(request.headers.get('content-length') ?? 0);
    if (contentLength > 1_048_576)
      return NextResponse.json({ error: 'Request body exceeds 1 MiB' }, { status: 413 });
    const reader = request.body?.getReader();
    if (reader) {
      const chunks: Uint8Array[] = [];
      let total = 0;
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        total += part.value.byteLength;
        if (total > 1_048_576) {
          await reader.cancel();
          return NextResponse.json({ error: 'Request body exceeds 1 MiB' }, { status: 413 });
        }
        chunks.push(part.value);
      }
      body = Buffer.concat(chunks).toString('utf8');
    }
  }
  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers: {
        'X-Simamia-Admin-Key': token,
        ...(body ? { 'Content-Type': 'application/json' } : {})
      },
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(12_000)
    });
    const responseBody = await upstream.text();
    return new NextResponse(responseBody, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('content-type') ?? 'application/json',
        'Cache-Control': 'no-store'
      }
    });
  } catch {
    return NextResponse.json({ error: 'Simamia API is unavailable' }, { status: 502 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
