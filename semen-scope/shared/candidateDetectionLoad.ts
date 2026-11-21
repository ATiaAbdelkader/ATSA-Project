export type CandidateDetectionLoadEvidence = {
  processedFrames: number;
  framesWithCandidates: number;
  emptyCandidateFrames: number;
  totalCandidates: number;
  meanCandidatesPerFrame: number;
  peakCandidatesInFrame: number;
  frameCoveragePercent: number;
  candidateLimitPerFrame: number;
  framesAtCandidateLimit: number;
  selectionCapReached: boolean;
  rationale: string;
};

/** Summarizes sampled detector output load for technical review without modifying candidates or tracks. */
export function buildCandidateDetectionLoadEvidence(candidateCounts: number[], candidateLimitPerFrame = 360): CandidateDetectionLoadEvidence {
  const counts = candidateCounts.map(value => Math.max(0, Math.round(Number.isFinite(value) ? value : 0)));
  const candidateLimit = Math.max(1, Math.round(candidateLimitPerFrame));
  const processedFrames = counts.length;
  const totalCandidates = counts.reduce((total, count) => total + count, 0);
  const framesWithCandidates = counts.filter(count => count > 0).length;
  const emptyCandidateFrames = processedFrames - framesWithCandidates;
  const meanCandidatesPerFrame = processedFrames ? totalCandidates / processedFrames : 0;
  const peakCandidatesInFrame = Math.max(0, ...counts);
  const frameCoveragePercent = processedFrames ? (framesWithCandidates / processedFrames) * 100 : 0;
  const framesAtCandidateLimit = counts.filter(count => count >= candidateLimit).length;
  const selectionCapReached = framesAtCandidateLimit > 0;
  const rationale = processedFrames
    ? `${totalCandidates} candidate detections were produced across ${processedFrames} sampled frames; ${framesWithCandidates} frames contained one or more candidates.${selectionCapReached ? ` The detector selection cap of ${candidateLimit} candidates was reached in ${framesAtCandidateLimit} sampled frames.` : ` The detector selection cap of ${candidateLimit} candidates was not reached.`} This is detector workload context only and does not alter candidates, trajectories, classifications, or biological interpretation.`
    : "No sampled frames were available for candidate-detection workload context.";
  return { processedFrames, framesWithCandidates, emptyCandidateFrames, totalCandidates, meanCandidatesPerFrame, peakCandidatesInFrame, frameCoveragePercent, candidateLimitPerFrame: candidateLimit, framesAtCandidateLimit, selectionCapReached, rationale };
}
