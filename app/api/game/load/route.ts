import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });
  }

  const gameState = await prisma.gameState.findUnique({
    where: { tenantId: session.tenantId }
  });

  if (!gameState) {
    return NextResponse.json({ error: 'Kein Spielstand vorhanden' }, { status: 404 });
  }

  return NextResponse.json({
    data: gameState.data,
    updatedAt: gameState.updatedAt
  });
}
