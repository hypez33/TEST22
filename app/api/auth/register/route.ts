import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { attachSessionCookie, createSessionToken, hashPassword } from '@/lib/auth';

const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username zu kurz')
    .max(32, 'Username zu lang')
    .regex(/^[a-zA-Z0-9._@-]+$/, 'Nur Buchstaben, Zahlen, ., _, -, @ erlaubt'),
  password: z.string().min(6, 'Passwort zu kurz').max(128, 'Passwort zu lang')
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingaben', details: parsed.error.flatten().formErrors }, { status: 400 });
  }

  const { username, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: 'Username ist bereits vergeben' }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: `${username}` }
      });
      const user = await tx.user.create({
        data: {
          username,
          passwordHash,
          tenantId: tenant.id
        }
      });
      await tx.gameState.create({
        data: {
          tenantId: tenant.id,
          data: {}
        }
      });
      return { tenant, user };
    });

    const token = await createSessionToken({
      tenantId: result.tenant.id,
      userId: result.user.id,
      username: result.user.username
    });
    const res = NextResponse.json({
      tenantId: result.tenant.id,
      userId: result.user.id,
      username: result.user.username
    });
    attachSessionCookie(res, token);
    return res;
  } catch (error) {
    console.error('Registrierung fehlgeschlagen', error);
    return NextResponse.json({ error: 'Registrierung fehlgeschlagen' }, { status: 500 });
  }
}
