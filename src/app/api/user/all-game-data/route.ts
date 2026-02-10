import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const TEST_TYPES = [
  'chimpTest',
  'typingSpeed',
  'visualMemory',
  'numberMemory',
  'verbalMemory',
  'sequenceMemory',
  'symbolMemory',
  'reflex'
] as const;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'ID utilisateur requis' }, { status: 400 });
    }

    const results = await prisma.testResult.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' }
    });

    const grouped = Object.fromEntries(TEST_TYPES.map((type) => [type, [] as unknown[]])) as Record<string, unknown[]>;

    for (const row of results) {
      if (!grouped[row.testType]) {
        continue;
      }
      grouped[row.testType].push({
        id: row.id,
        score: row.score,
        wpm: row.wpm,
        accuracy: row.accuracy,
        reactionTime: row.reactionTime,
        timestamp: row.timestamp
      });
    }

    return NextResponse.json(grouped);
  } catch (error) {
    console.error('Erreur lors de la récupération de toutes les données de jeux:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
