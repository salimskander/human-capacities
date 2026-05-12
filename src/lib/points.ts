export type PointsInput = {
  score?: number | null;
  reactionTime?: number | null;
  wpm?: number | null;
  accuracy?: number | null;
  avgMsPerTile?: number | null;
};

// Logarithmic diminishing returns: score / max → 1000 pts, but hard to reach top
function logPts(score: number, max: number): number {
  if (score <= 0) return 0;
  return Math.min(1000, Math.round(1000 * Math.log1p(score) / Math.log1p(max)));
}

export function calculatePoints(testType: string, data: PointsInput): number {
  switch (testType) {
    case 'reflex': {
      // Linear: 200ms → 1000pts, 600ms+ → 0pts (already feels exponential to player)
      const rt = data.reactionTime ?? 9999;
      return Math.max(0, Math.min(1000, Math.round(1000 * Math.max(0, 600 - rt) / 400)));
    }
    case 'chimpTest': {
      const score = data.score ?? 0;
      const avgMs = data.avgMsPerTile ?? 9999;
      // 700pts from level reached (log curve, max=15 → 1000 theoretical)
      const levelPts = Math.min(700, Math.round(700 * Math.log1p(score) / Math.log1p(15)));
      // 300pts from speed: <300ms/tile → 300pts, 2000ms/tile → 0pts
      const speedPts = Math.max(0, Math.min(300, Math.round(300 * (2000 - avgMs) / 1700)));
      return Math.min(1000, levelPts + speedPts);
    }
    case 'numberMemory': {
      // Max 10 digits = 1000pts
      return logPts(data.score ?? 0, 10);
    }
    case 'visualMemory': {
      // Max 14 levels = 1000pts
      return logPts(data.score ?? 0, 14);
    }
    case 'verbalMemory': {
      // Max 100 words = 1000pts
      return logPts(data.score ?? 0, 100);
    }
    case 'sequenceMemory': {
      // Max 12 levels = 1000pts
      return logPts(data.score ?? 0, 12);
    }
    case 'symbolMemory': {
      // Max 7 levels = 1000pts
      return logPts(data.score ?? 0, 7);
    }
    case 'typingSpeed': {
      // Max 125 wpm = 1000pts
      return logPts(data.wpm ?? 0, 125);
    }
    default:
      return 0;
  }
}

export const TOTAL_MAX_POINTS = 8000;

export const TEST_NAMES: Record<string, string> = {
  reflex: 'Réflexes',
  chimpTest: 'Chimp Test',
  numberMemory: 'Mémoire des chiffres',
  visualMemory: 'Mémoire visuelle',
  verbalMemory: 'Mémoire verbale',
  sequenceMemory: 'Mémoire de séquence',
  symbolMemory: 'Mémoire des symboles',
  typingSpeed: 'Vitesse de frappe',
};
