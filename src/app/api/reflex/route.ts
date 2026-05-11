import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculatePoints } from '@/lib/points';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') || 'user';

    const where =
      type === 'global'
        ? { testType: 'reflex' }
        : { testType: 'reflex', userId: userId || undefined };

    const results = await prisma.testResult.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      select: { id: true, reactionTime: true, points: true, timestamp: true, userId: true },
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Erreur reflex GET:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { reactionTime, userId } = await request.json();

    if (typeof reactionTime !== 'number') {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const points = calculatePoints('reflex', { reactionTime });

    const result = await prisma.testResult.create({
      data: { testType: 'reflex', reactionTime, points, userId: userId || null },
    });

    return NextResponse.json({ success: true, id: result.id, points });
  } catch (error) {
    console.error('Erreur reflex POST:', error);
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'ID utilisateur requis' }, { status: 400 });
    }

    await prisma.testResult.deleteMany({ where: { testType: 'reflex', userId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur reflex DELETE:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
