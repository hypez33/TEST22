import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const saveSchema = z.object({
  data: z.any()
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ungültige Eingaben', details: parsed.error.flatten() }, { status: 400 });
  }

  await prisma.gameState.upsert({
    where: { tenantId: session.tenantId },
    update: { data: parsed.data.data },
    create: {
      tenantId: session.tenantId,
      data: parsed.data.data
    }
  });

  return NextResponse.json({ ok: true });
}
