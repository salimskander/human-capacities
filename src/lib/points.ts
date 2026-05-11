export type PointsInput = {
  score?: number | null;
  reactionTime?: number | null;
  wpm?: number | null;
  accuracy?: number | null;
};

export function calculatePoints(testType: string, data: PointsInput): number {
  switch (testType) {
    case 'reflex': {
      const rt = data.reactionTime ?? 9999;
      // 200ms → 1000pts, 300ms → 750pts, 400ms → 500pts, 600ms+ → 0pts
      return Math.max(0, Math.min(1000, Math.round(1000 * Math.max(0, 600 - rt) / 400)));
    }
    case 'chimpTest': {
      // score = displayed level (1, 2, 3 …)
      const score = data.score ?? 0;
      return Math.min(1000, Math.round(score * 67));
    }
    case 'numberMemory': {
      // score = number of digits successfully memorised
      const score = data.score ?? 0;
      return Math.min(1000, Math.round(score * 100));
    }
    case 'visualMemory': {
      // score = level reached
      const score = data.score ?? 0;
      return Math.min(1000, Math.round(score * 70));
    }
    case 'verbalMemory': {
      // score = words correctly remembered
      const score = data.score ?? 0;
      return Math.min(1000, Math.round(score * 10));
    }
    case 'sequenceMemory': {
      // score = levels completed
      const score = data.score ?? 0;
      return Math.min(1000, Math.round(score * 80));
    }
    case 'symbolMemory': {
      // score = levels completed (level - 1)
      const score = data.score ?? 0;
      return Math.min(1000, Math.round(score * 150));
    }
    case 'typingSpeed': {
      // wpm weighted by accuracy
      const wpm = data.wpm ?? 0;
      return Math.min(1000, Math.round(wpm * 8));
    }
    default:
      return 0;
  }
}

export const TOTAL_MAX_POINTS = 8000;

export const TEST_POINT_LABELS: Record<string, string> = {
  reflex: '1000 pts à 200ms, 0 à ≥600ms',
  chimpTest: '67 pts / niveau',
  numberMemory: '100 pts / chiffre',
  visualMemory: '70 pts / niveau',
  verbalMemory: '10 pts / mot',
  sequenceMemory: '80 pts / niveau',
  symbolMemory: '150 pts / niveau',
  typingSpeed: '8 pts / mot par minute',
};

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
