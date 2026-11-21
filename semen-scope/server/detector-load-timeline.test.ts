import { describe, expect, it } from "vitest";
import { buildDetectorLoadTimeline } from "@shared/detectorLoadTimeline";

describe("detector load timeline", () => {
  it("retains sampled candidate counts in chronology without detector changes", () => {
    const evidence = buildDetectorLoadTimeline({ candidateCounts: [2, 360, 5], sampledFrames: [0, 4, 8] });
    expect(evidence).toMatchObject({ sampledFrames: 3, candidateLimitPerFrame: 360, peakCandidates: 360, peakFrame: 4, capBoundSamples: 1 });
    expect(evidence.points).toEqual([{ sampleIndex: 0, frame: 0, candidateCount: 2, atSelectionCap: false }, { sampleIndex: 1, frame: 4, candidateCount: 360, atSelectionCap: true }, { sampleIndex: 2, frame: 8, candidateCount: 5, atSelectionCap: false }]);
    expect(evidence.rationale).toContain("does not alter candidates, trajectories");
  });

  it("returns safe empty evidence", () => {
    expect(buildDetectorLoadTimeline({ candidateCounts: [], sampledFrames: [] })).toMatchObject({ sampledFrames: 0, peakCandidates: 0, peakFrame: null, capBoundSamples: 0 });
  });
});
