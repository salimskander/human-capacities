export type NumericResult = {
  value: number;
  timestamp?: string | Date;
};

export type ComputedStats = {
  totalCount: number;
  filteredCount: number;
  removedOutliers: number;
  average: number;
  median: number;
  best: number;
  worst: number;
  latest: number;
  first: number;
  percentile25: number;
  percentile75: number;
  standardDeviation: number;
};

export type ComparisonStats = {
  latestPercentile: number;
  bestPercentile: number;
  medianPercentile: number;
  estimatedWorldRank: number | null;
  estimatedWorldTopPercent: number | null;
  averageGap: number;
  medianGap: number;
  latestGap: number;
  benchmarkScore: number;
};

export type ProgressionStats = {
  firstScore: number;
  latestScore: number;
  absoluteChange: number;
  percentChange: number;
  recentAverage: number;
  previousAverage: number;
  trendDelta: number;
  trendDirection: 'up' | 'down' | 'stable';
};

export type OverviewAnalytics = {
  user: ComputedStats;
  global: ComputedStats;
  comparison: ComparisonStats;
  progression: ProgressionStats;
};

const EMPTY_STATS: ComputedStats = {
  totalCount: 0,
  filteredCount: 0,
  removedOutliers: 0,
  average: 0,
  median: 0,
  best: 0,
  worst: 0,
  latest: 0,
  first: 0,
  percentile25: 0,
  percentile75: 0,
  standardDeviation: 0
};

const EMPTY_COMPARISON: ComparisonStats = {
  latestPercentile: 0,
  bestPercentile: 0,
  medianPercentile: 0,
  estimatedWorldRank: null,
  estimatedWorldTopPercent: null,
  averageGap: 0,
  medianGap: 0,
  latestGap: 0,
  benchmarkScore: 0
};

const EMPTY_PROGRESSION: ProgressionStats = {
  firstScore: 0,
  latestScore: 0,
  absoluteChange: 0,
  percentChange: 0,
  recentAverage: 0,
  previousAverage: 0,
  trendDelta: 0,
  trendDirection: 'stable'
};

const round = (value: number, digits = 2): number => {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const sanitizeValues = (values: number[]): number[] =>
  values.filter((value) => Number.isFinite(value));

const percentile = (sortedValues: number[], p: number): number => {
  if (sortedValues.length === 0) return 0;
  const index = (sortedValues.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sortedValues[lower];
  const weight = index - lower;
  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
};

export const filterOutliers = (values: number[]): number[] => {
  if (values.length < 4) return sanitizeValues(values);

  const sorted = sanitizeValues(values).sort((a, b) => a - b);
  const q1 = percentile(sorted, 0.25);
  const q3 = percentile(sorted, 0.75);
  const iqr = q3 - q1;

  if (iqr === 0) return sorted;

  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;

  return sorted.filter((value) => value >= lower && value <= upper);
};

export const computeStats = (
  values: number[],
  lowerIsBetter = false,
  orderedValues?: number[]
): ComputedStats => {
  const cleanValues = sanitizeValues(values);
  const chronological = sanitizeValues(orderedValues ?? cleanValues);

  if (cleanValues.length === 0) {
    return EMPTY_STATS;
  }

  const filtered = filterOutliers(cleanValues);
  const base = filtered.length > 0 ? filtered : cleanValues;
  const sorted = [...base].sort((a, b) => a - b);
  const average = sorted.reduce((sum, value) => sum + value, 0) / sorted.length;
  const variance =
    sorted.reduce((sum, value) => sum + (value - average) ** 2, 0) / sorted.length;
  const first = chronological[0] ?? sorted[0];
  const latest = chronological[chronological.length - 1] ?? sorted[sorted.length - 1];

  return {
    totalCount: cleanValues.length,
    filteredCount: sorted.length,
    removedOutliers: cleanValues.length - sorted.length,
    average: round(average),
    median: round(percentile(sorted, 0.5)),
    best: round(lowerIsBetter ? sorted[0] : sorted[sorted.length - 1]),
    worst: round(lowerIsBetter ? sorted[sorted.length - 1] : sorted[0]),
    latest: round(latest),
    first: round(first),
    percentile25: round(percentile(sorted, 0.25)),
    percentile75: round(percentile(sorted, 0.75)),
    standardDeviation: round(Math.sqrt(variance))
  };
};

export const computePercentileRank = (
  values: number[],
  target: number,
  lowerIsBetter = false
): number => {
  const cleanValues = sanitizeValues(values);

  if (cleanValues.length === 0 || !Number.isFinite(target)) {
    return 0;
  }

  const betterOrEqualCount = cleanValues.filter((value) =>
    lowerIsBetter ? value >= target : value <= target
  ).length;

  return round((betterOrEqualCount / cleanValues.length) * 100, 1);
};

export const computeProgressionStats = (
  orderedValues: number[],
  lowerIsBetter = false
): ProgressionStats => {
  const cleanValues = sanitizeValues(orderedValues);

  if (cleanValues.length === 0) {
    return EMPTY_PROGRESSION;
  }

  const firstScore = cleanValues[0];
  const latestScore = cleanValues[cleanValues.length - 1];
  const absoluteChange = latestScore - firstScore;
  const denominator = Math.abs(firstScore) || 1;
  const percentChange = (absoluteChange / denominator) * 100;

  const splitIndex = Math.max(1, Math.floor(cleanValues.length / 2));
  const previousSlice = cleanValues.slice(0, splitIndex);
  const recentSlice = cleanValues.slice(splitIndex);
  const previousAverage =
    previousSlice.reduce((sum, value) => sum + value, 0) / previousSlice.length;
  const recentAverage =
    (recentSlice.length > 0 ? recentSlice : previousSlice).reduce((sum, value) => sum + value, 0) /
    (recentSlice.length > 0 ? recentSlice.length : previousSlice.length);
  const rawTrendDelta = recentAverage - previousAverage;
  const trendDelta = lowerIsBetter ? -rawTrendDelta : rawTrendDelta;
  const trendDirection =
    Math.abs(trendDelta) < 0.01 ? 'stable' : trendDelta > 0 ? 'up' : 'down';

  return {
    firstScore: round(firstScore),
    latestScore: round(latestScore),
    absoluteChange: round(lowerIsBetter ? -absoluteChange : absoluteChange),
    percentChange: round(lowerIsBetter ? -(percentChange) : percentChange, 1),
    recentAverage: round(recentAverage),
    previousAverage: round(previousAverage),
    trendDelta: round(trendDelta),
    trendDirection
  };
};

export const computeOverviewAnalytics = (
  userValues: number[],
  globalValues: number[],
  lowerIsBetter = false
): OverviewAnalytics => {
  const orderedUserValues = sanitizeValues(userValues);
  const cleanGlobalValues = sanitizeValues(globalValues);
  const user = computeStats(orderedUserValues, lowerIsBetter, orderedUserValues);
  const global = computeStats(cleanGlobalValues, lowerIsBetter);
  const progression = computeProgressionStats(orderedUserValues, lowerIsBetter);

  if (orderedUserValues.length === 0 || cleanGlobalValues.length === 0) {
    return {
      user,
      global,
      comparison: {
        ...EMPTY_COMPARISON,
        benchmarkScore: lowerIsBetter ? global.median : global.average
      },
      progression
    };
  }

  const latestScore = orderedUserValues[orderedUserValues.length - 1];
  const benchmarkScore = lowerIsBetter ? global.median : global.average;
  const latestPercentile = computePercentileRank(cleanGlobalValues, latestScore, lowerIsBetter);
  const bestPercentile = computePercentileRank(cleanGlobalValues, user.best, lowerIsBetter);
  const medianPercentile = computePercentileRank(cleanGlobalValues, user.median, lowerIsBetter);
  const estimatedWorldRank = Math.max(
    1,
    Math.round(((100 - bestPercentile) / 100) * cleanGlobalValues.length) + 1
  );
  const estimatedWorldTopPercent = round(100 - bestPercentile, 1);

  return {
    user,
    global,
    comparison: {
      latestPercentile,
      bestPercentile,
      medianPercentile,
      estimatedWorldRank,
      estimatedWorldTopPercent,
      averageGap: round(user.average - global.average),
      medianGap: round(user.median - global.median),
      latestGap: round(latestScore - benchmarkScore),
      benchmarkScore: round(benchmarkScore)
    },
    progression
  };
};
