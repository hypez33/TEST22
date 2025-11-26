import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';

export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? 'budlife_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
const JWT_ISSUER = 'budlife-auth';

const cookieSecure =
  process.env.COOKIE_SECURE === 'true'
    ? true
    : process.env.COOKIE_SECURE === 'false'
      ? false
      : process.env.NODE_ENV === 'production';

export type SessionPayload = {
  userId: string;
  tenantId: string;
  username: string;
};

function getJwtSecret() {
  const secret = process.env.AUTH_SECRET ?? 'change-me-in-prod';
  if (process.env.NODE_ENV === 'production' && !process.env.AUTH_SECRET) {
    throw new Error('AUTH_SECRET is required in production for session signing.');
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function createSessionToken(session: SessionPayload) {
  return new SignJWT(session)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getJwtSecret());
}

export function attachSessionCookie(res: NextResponse, token: string) {
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: cookieSecure,
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS
  });
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE_NAME, '', {
    maxAge: 0,
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: cookieSecure
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE_NAME);
  if (!cookie?.value) return null;

  try {
    const { payload } = await jwtVerify(cookie.value, getJwtSecret(), { issuer: JWT_ISSUER });
    const tenantId = payload.tenantId as string | undefined;
    const userId = payload.userId as string | undefined;
    const username = payload.username as string | undefined;
    if (!tenantId || !userId || !username) return null;
    return { tenantId, userId, username };
  } catch {
    return null;
  }
}
