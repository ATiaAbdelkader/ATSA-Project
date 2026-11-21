import { describe, expect, it } from "vitest";
import { buildCandidateDetectionLoadEvidence } from "@shared/candidateDetectionLoad";

describe("candidate detection load evidence", () => {
  it("summarizes sampled detector counts without treating them as biological cell counts", () => {
    const evidence = buildCandidateDetectionLoadEvidence([2, 0, 5, 3], 5);
    expect(evidence).toMatchObject({ processedFrames: 4, framesWithCandidates: 3, emptyCandidateFrames: 1, totalCandidates: 10, meanCandidatesPerFrame: 2.5, peakCandidatesInFrame: 5, frameCoveragePercent: 75, candidateLimitPerFrame: 5, framesAtCandidateLimit: 1, selectionCapReached: true });
    expect(evidence.rationale).toContain("selection cap of 5 candidates was reached");
    expect(evidence.rationale).toContain("does not alter candidates, trajectories, classifications");
  });

  it("returns safe empty evidence without sampled frames", () => {
    expect(buildCandidateDetectionLoadEvidence([])).toMatchObject({ processedFrames: 0, totalCandidates: 0, meanCandidatesPerFrame: 0, peakCandidatesInFrame: 0, frameCoveragePercent: 0, framesAtCandidateLimit: 0, selectionCapReached: false });
  });
});
