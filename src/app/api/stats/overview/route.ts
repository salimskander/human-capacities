import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { computeStats } from '@/lib/stats';

type TestConfig = {
  label: string;
  testType: string;
  valueField: 'score' | 'wpm' | 'reactionTime';
  lowerIsBetter?: boolean;
  unit: string;
};

const TESTS: TestConfig[] = [
  { label: 'Test du Chimpanzé', testType: 'chimpTest', valueField: 'score', unit: 'niveau' },
  { label: 'Vitesse de frappe', testType: 'typingSpeed', valueField: 'wpm', unit: 'wpm' },
  { label: 'Mémoire visuelle', testType: 'visualMemory', valueField: 'score', unit: 'niveau' },
  { label: 'Mémoire des chiffres', testType: 'numberMemory', valueField: 'score', unit: 'chiffres' },
  { label: 'Mémoire verbale', testType: 'verbalMemory', valueField: 'score', unit: 'mots' },
  { label: 'Mémoire de séquence', testType: 'sequenceMemory', valueField: 'score', unit: 'niveau' },
  { label: 'Mémoire des symboles', testType: 'symbolMemory', valueField: 'score', unit: 'niveau' },
  { label: 'Réflexes', testType: 'reflex', valueField: 'reactionTime', lowerIsBetter: true, unit: 'ms' }
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'ID utilisateur requis' }, { status: 400 });
    }

    const response = await Promise.all(
      TESTS.map(async (test) => {
        const [userRows, globalRows] = await Promise.all([
          prisma.testResult.findMany({ where: { testType: test.testType, userId }, orderBy: { timestamp: 'desc' } }),
          prisma.testResult.findMany({ where: { testType: test.testType }, orderBy: { timestamp: 'desc' } })
        ]);

        const userValues = userRows
          .map((row) => row[test.valueField])
          .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

        const globalValues = globalRows
          .map((row) => row[test.valueField])
          .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

        return {
          ...test,
          user: computeStats(userValues, Boolean(test.lowerIsBetter)),
          global: computeStats(globalValues, Boolean(test.lowerIsBetter))
        };
      })
    );

    return NextResponse.json({ tests: response });
  } catch (error) {
    console.error('Erreur lors du calcul des statistiques du dashboard:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
