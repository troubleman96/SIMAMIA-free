import { NextResponse } from 'next/server';
import {
  clearAdminSession,
  createAdminSession,
  emailMatches,
  hasAdminSession,
  isSameOrigin,
  passwordMatches
} from '../../../lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const attempts = new Map<string, { count: number; resetAt: number }>();

export async function GET() {
  return NextResponse.json(
    { authenticated: await hasAdminSession() },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

export async function POST(request: Request) {
  if (!isSameOrigin(request))
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  const forwarded =
    request.headers.get('x-real-ip') ??
    request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim() ??
    'unknown';
  const now = Date.now();
  const current = attempts.get(forwarded);
  if (current && current.resetAt > now && current.count >= 8) {
    return NextResponse.json(
      { error: 'Too many sign-in attempts. Try again in 15 minutes.' },
      { status: 429 }
    );
  }
  let email = '';
  let password = '';
  try {
    const contentLength = Number(request.headers.get('content-length') ?? 0);
    if (contentLength > 8192)
      return NextResponse.json({ error: 'Request body is too large.' }, { status: 413 });
    const raw = await request.text();
    if (raw.length > 8192)
      return NextResponse.json({ error: 'Request body is too large.' }, { status: 413 });
    const body = JSON.parse(raw) as { email?: unknown; password?: unknown };
    if (typeof body.email === 'string') email = body.email;
    if (typeof body.password === 'string') password = body.password;
  } catch {
    return NextResponse.json({ error: 'Enter your admin email and password.' }, { status: 400 });
  }
  try {
    if (!emailMatches(email) || !passwordMatches(password)) {
      attempts.set(
        forwarded,
        current && current.resetAt > now
          ? { count: current.count + 1, resetAt: current.resetAt }
          : { count: 1, resetAt: now + 15 * 60_000 }
      );
      return NextResponse.json(
        { error: 'The email or password was not accepted.' },
        { status: 401 }
      );
    }
  } catch {
    return NextResponse.json({ error: 'Admin authentication is not configured.' }, { status: 503 });
  }
  attempts.delete(forwarded);
  await createAdminSession();
  return NextResponse.json({ authenticated: true }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request))
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  await clearAdminSession();
  return NextResponse.json({ authenticated: false }, { headers: { 'Cache-Control': 'no-store' } });
}
