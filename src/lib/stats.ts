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
};

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
  if (values.length < 4) return values;

  const sorted = [...values].sort((a, b) => a - b);
  const q1 = percentile(sorted, 0.25);
  const q3 = percentile(sorted, 0.75);
  const iqr = q3 - q1;

  if (iqr === 0) return values;

  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  return values.filter((value) => value >= lower && value <= upper);
};

export const computeStats = (values: number[], lowerIsBetter = false): ComputedStats => {
  if (values.length === 0) {
    return {
      totalCount: 0,
      filteredCount: 0,
      removedOutliers: 0,
      average: 0,
      median: 0,
      best: 0,
      worst: 0
    };
  }

  const filtered = filterOutliers(values);
  const base = filtered.length > 0 ? filtered : values;
  const sorted = [...base].sort((a, b) => a - b);
  const average = sorted.reduce((sum, value) => sum + value, 0) / sorted.length;
  const median = percentile(sorted, 0.5);

  return {
    totalCount: values.length,
    filteredCount: sorted.length,
    removedOutliers: values.length - sorted.length,
    average,
    median,
    best: lowerIsBetter ? sorted[0] : sorted[sorted.length - 1],
    worst: lowerIsBetter ? sorted[sorted.length - 1] : sorted[0]
  };
};
