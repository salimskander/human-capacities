import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'ID utilisateur requis' }, { status: 400 });
    }

    // Get all users' best points per test
    const allResults = await prisma.testResult.findMany({
      where: { userId: { not: null } },
      select: { userId: true, testType: true, points: true },
    });

    const userBest: Record<string, number> = {};
    for (const r of allResults) {
      if (!r.userId) continue;
      const key = `${r.userId}::${r.testType}`;
      userBest[key] = Math.max(userBest[key] ?? 0, r.points ?? 0);
    }

    // Sum per user
    const totals: Record<string, number> = {};
    for (const [key, pts] of Object.entries(userBest)) {
      const uid = key.split('::')[0];
      totals[uid] = (totals[uid] ?? 0) + pts;
    }

    const myTotal = totals[userId] ?? 0;
    const sorted = Object.values(totals).sort((a, b) => b - a);
    const rank = sorted.findIndex((pts) => pts <= myTotal) + 1;
    const totalPlayers = sorted.length;

    // Per-test best for this user
    const testPoints: Record<string, number> = {};
    for (const [key, pts] of Object.entries(userBest)) {
      const [uid, testType] = key.split('::');
      if (uid === userId) testPoints[testType] = pts;
    }

    return NextResponse.json({ totalPoints: myTotal, rank, totalPlayers, testPoints });
  } catch (error) {
    console.error('Erreur user/rank GET:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
