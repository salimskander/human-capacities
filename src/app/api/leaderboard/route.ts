import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ALL_TESTS = [
  'chimpTest',
  'typingSpeed',
  'visualMemory',
  'numberMemory',
  'verbalMemory',
  'sequenceMemory',
  'symbolMemory',
  'reflex',
] as const;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10), 100);

    // Fetch all results that have a userId and points stored
    const allResults = await prisma.testResult.findMany({
      where: { userId: { not: null } },
      select: { userId: true, testType: true, points: true },
    });

    // Aggregate: per user, per testType → take best (max) points
    const userBest: Record<string, Record<string, number>> = {};
    for (const r of allResults) {
      if (!r.userId) continue;
      const pts = r.points ?? 0;
      if (!userBest[r.userId]) userBest[r.userId] = {};
      userBest[r.userId][r.testType] = Math.max(userBest[r.userId][r.testType] ?? 0, pts);
    }

    // Sum best points per user
    const totals = Object.entries(userBest)
      .map(([userId, tests]) => ({
        userId,
        totalPoints: Object.values(tests).reduce((sum, p) => sum + p, 0),
        testsCompleted: Object.keys(tests).filter((t) => ALL_TESTS.includes(t as (typeof ALL_TESTS)[number])).length,
        testPoints: tests,
      }))
      .filter((e) => e.totalPoints > 0)
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, limit);

    // Fetch usernames from UserProfile table
    const userIds = totals.map((e) => e.userId);
    const profiles =
      userIds.length > 0
        ? await prisma.userProfile.findMany({
            where: { firebaseUid: { in: userIds } },
            select: { firebaseUid: true, username: true },
          })
        : [];

    const profileMap = Object.fromEntries(profiles.map((p: { firebaseUid: string; username: string | null }) => [p.firebaseUid, p.username]));

    const entries = totals.map((e, i) => ({
      rank: i + 1,
      username: profileMap[e.userId] || `Joueur ${e.userId.slice(-6).toUpperCase()}`,
      totalPoints: e.totalPoints,
      testsCompleted: e.testsCompleted,
      testPoints: e.testPoints,
    }));

    const totalPlayers = Object.keys(userBest).length;

    return NextResponse.json({ entries, totalPlayers });
  } catch (error) {
    console.error('Erreur leaderboard GET:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
