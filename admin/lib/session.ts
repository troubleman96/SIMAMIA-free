import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

const COOKIE = 'simamia_admin_session';
const SESSION_SECONDS = 60 * 60 * 8;

function secret() {
  const value = process.env.SIMAMIA_ADMIN_SESSION_SECRET;
  if (!value || value.length < 32)
    throw new Error('SIMAMIA_ADMIN_SESSION_SECRET must be at least 32 characters');
  return value;
}

function signature(expires: string) {
  return createHmac('sha256', secret()).update(expires).digest('hex');
}

export async function hasAdminSession() {
  const jar = await cookies();
  const value = jar.get(COOKIE)?.value ?? '';
  const [expires, supplied] = value.split('.');
  if (!expires || !supplied || Number(expires) < Math.floor(Date.now() / 1000)) return false;
  try {
    const expected = signature(expires);
    const left = Buffer.from(supplied);
    const right = Buffer.from(expected);
    return left.length === right.length && timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

export async function createAdminSession() {
  const expires = String(Math.floor(Date.now() / 1000) + SESSION_SECONDS);
  const jar = await cookies();
  jar.set(COOKIE, `${expires}.${signature(expires)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: SESSION_SECONDS
  });
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export function passwordMatches(password: string) {
  const expected = process.env.SIMAMIA_ADMIN_PASSWORD ?? '';
  if (!expected) return false;
  const suppliedHash = createHmac('sha256', secret()).update(password).digest();
  const expectedHash = createHmac('sha256', secret()).update(expected).digest();
  return timingSafeEqual(suppliedHash, expectedHash);
}

export function emailMatches(email: string) {
  const expected = process.env.SIMAMIA_ADMIN_EMAIL ?? '';
  if (!expected) return false;
  const suppliedHash = createHmac('sha256', secret()).update(email.trim().toLowerCase()).digest();
  const expectedHash = createHmac('sha256', secret())
    .update(expected.trim().toLowerCase())
    .digest();
  return timingSafeEqual(suppliedHash, expectedHash);
}

export function isSameOrigin(request: Request) {
  const configured = process.env.ADMIN_APP_ORIGIN;
  const origin = request.headers.get('origin');
  if (!configured || !origin) return false;
  try {
    return new URL(origin).origin === new URL(configured).origin;
  } catch {
    return false;
  }
}
