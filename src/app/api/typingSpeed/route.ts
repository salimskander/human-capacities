import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const type = searchParams.get('type') || 'user';

  try {
    const where = type === 'global' ? { testType: 'typingSpeed' } : { testType: 'typingSpeed', userId: userId || undefined };

    const results = await prisma.testResult.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        wpm: true,
        accuracy: true,
        timestamp: true,
        userId: true
      }
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Erreur lors de la récupération:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { wpm, accuracy, userId } = await request.json();

    if (typeof wpm !== 'number' || typeof accuracy !== 'number') {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const result = await prisma.testResult.create({
      data: {
        testType: 'typingSpeed',
        wpm,
        accuracy,
        userId: userId || null
      }
    });

    return NextResponse.json({ success: true, id: result.id });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error);
    return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'ID utilisateur requis' }, { status: 400 });
    }

    await prisma.testResult.deleteMany({
      where: {
        testType: 'typingSpeed',
        userId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
