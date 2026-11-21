export type ConfidenceDistribution = {
  total: number;
  belowThreshold: number;
  atOrAboveThreshold: number;
  mean: number;
};

export function buildConfidenceDistribution(confidences: number[], threshold: number): ConfidenceDistribution {
  const total = confidences.length;
  const belowThreshold = confidences.filter(value => value < threshold).length;
  const mean = total ? confidences.reduce((sum, value) => sum + value, 0) / total : 0;
  return { total, belowThreshold, atOrAboveThreshold: total - belowThreshold, mean };
}
