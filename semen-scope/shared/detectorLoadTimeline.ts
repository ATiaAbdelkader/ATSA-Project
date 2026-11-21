export type DetectorLoadTimelinePoint = {
  sampleIndex: number;
  frame: number;
  candidateCount: number;
  atSelectionCap: boolean;
};

export type DetectorLoadTimeline = {
  points: DetectorLoadTimelinePoint[];
  sampledFrames: number;
  candidateLimitPerFrame: number;
  peakCandidates: number;
  peakFrame: number | null;
  capBoundSamples: number;
  rationale: string;
};

/** Preserves the sampled candidate-count sequence as technical review context without changing detection. */
export function buildDetectorLoadTimeline({ candidateCounts, sampledFrames, candidateLimitPerFrame = 360 }: { candidateCounts: number[]; sampledFrames: number[]; candidateLimitPerFrame?: number }): DetectorLoadTimeline {
  const candidateLimit = Math.max(1, Math.round(Number.isFinite(candidateLimitPerFrame) ? candidateLimitPerFrame : 360));
  const points = candidateCounts.map((count, sampleIndex) => {
    const candidateCount = Math.max(0, Math.round(Number.isFinite(count) ? count : 0));
    return { sampleIndex, frame: Math.max(0, Math.round(Number.isFinite(sampledFrames[sampleIndex]) ? sampledFrames[sampleIndex] : sampleIndex)), candidateCount, atSelectionCap: candidateCount >= candidateLimit };
  });
  const peakCandidates = Math.max(0, ...points.map(point => point.candidateCount));
  const peakPoint = points.find(point => point.candidateCount === peakCandidates);
  const capBoundSamples = points.filter(point => point.atSelectionCap).length;
  const rationale = points.length
    ? `${points.length} sampled detector counts are retained in chronological order; peak load was ${peakCandidates} candidates at source frame ${peakPoint?.frame ?? 0}, with ${capBoundSamples} samples at the ${candidateLimit}-candidate selection cap. This is detector workload context only and does not alter candidates, trajectories, classifications, or biological interpretation.`
    : "No sampled detector counts were available for a technical detector-load timeline.";
  return { points, sampledFrames: points.length, candidateLimitPerFrame: candidateLimit, peakCandidates, peakFrame: peakPoint?.frame ?? null, capBoundSamples, rationale };
}
