import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { attachSessionCookie, createSessionToken, verifyPassword } from '@/lib/auth';

const loginSchema = z.object({
  username: z
    .string()
    .min(3, 'Username zu kurz')
    .max(32, 'Username zu lang')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Nur Buchstaben, Zahlen, -, _ erlaubt'),
  password: z.string().min(6, 'Passwort zu kurz').max(128, 'Passwort zu lang')
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingaben', details: parsed.error.flatten() }, { status: 400 });
  }

  const { username, password } = parsed.data;
  const user = await prisma.user.findUnique({
    where: { username }
  });

  if (!user) {
    return NextResponse.json({ error: 'Ungültige Zugangsdaten' }, { status: 401 });
  }

  const passwordValid = await verifyPassword(password, user.passwordHash);
  if (!passwordValid) {
    return NextResponse.json({ error: 'Ungültige Zugangsdaten' }, { status: 401 });
  }

  const token = await createSessionToken({
    tenantId: user.tenantId,
    userId: user.id,
    username: user.username
  });

  const res = NextResponse.json({
    tenantId: user.tenantId,
    userId: user.id,
    username: user.username
  });
  attachSessionCookie(res, token);
  return res;
}
