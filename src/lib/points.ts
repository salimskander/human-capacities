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
      // Inverse-square from 101ms (world record). Below 101ms = suspicious, caller should reject.
      const rt = data.reactionTime ?? 9999;
      if (rt <= 0 || rt < 101) return 0;
      return Math.min(1000, Math.round(1000 * Math.sqrt(101 / rt)));
    }
    case 'chimpTest': {
      const score = data.score ?? 0;
      const avgMs = data.avgMsPerTile ?? 9999;
      // 700pts from level reached (log curve, max=15)
      const levelPts = Math.min(700, Math.round(700 * Math.log1p(score) / Math.log1p(15)));
      // 300pts from speed: inverse-square decay on avgMs/tile.
      // Threshold = 150ms/tile → at level 1 (4 tiles) max at 600ms, 601ms → 299pts.
      // Score scales naturally: level 5 (5 tiles) max at 750ms, etc.
      const minMsPerTile = 150;
      const speedPts = Math.round(300 * Math.min(1, Math.pow(minMsPerTile / Math.max(avgMs, 1), 2)));
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
