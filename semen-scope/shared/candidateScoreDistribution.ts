export type CandidateScoreDistributionEvidence = {
  candidateCount: number;
  meanScore: number;
  medianScore: number;
  minimumScore: number;
  maximumScore: number;
  rationale: string;
};

/** Summarizes already-selected detector contrast scores for technical review without changing selection. */
export function buildCandidateScoreDistributionEvidence(scores: number[]): CandidateScoreDistributionEvidence {
  const values = scores.filter(Number.isFinite).map(value => Math.max(0, value)).sort((a, b) => a - b);
  const candidateCount = values.length;
  const meanScore = candidateCount ? values.reduce((total, value) => total + value, 0) / candidateCount : 0;
  const middle = Math.floor(candidateCount / 2);
  const medianScore = candidateCount ? (candidateCount % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2) : 0;
  const minimumScore = values[0] ?? 0;
  const maximumScore = values.at(-1) ?? 0;
  const rationale = candidateCount
    ? `${candidateCount} already-selected candidates contributed detector contrast scores. The range is ${minimumScore.toFixed(1)}–${maximumScore.toFixed(1)} with median ${medianScore.toFixed(1)}. This is detector-score context only and does not add, remove, re-rank, or alter candidates, tracks, classifications, or biological interpretation.`
    : "No selected candidate scores were available for technical detector-score context.";
  return { candidateCount, meanScore, medianScore, minimumScore, maximumScore, rationale };
}
