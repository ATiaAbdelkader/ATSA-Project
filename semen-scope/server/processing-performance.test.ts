import { describe, expect, it } from "vitest";
import { buildProcessingPerformanceEvidence } from "@shared/processingPerformance";

describe("processing performance evidence", () => {
  it("summarizes local review-loop timing without changing analysis output", () => {
    const evidence = buildProcessingPerformanceEvidence({ elapsedMilliseconds: 250, processedFrames: 10 });
    expect(evidence).toMatchObject({ elapsedMilliseconds: 250, processedFrames: 10, meanMillisecondsPerFrame: 25, processedFramesPerSecond: 40 });
    expect(evidence.rationale).toContain("does not change sampling, candidates, trajectories");
  });

  it("returns safe empty evidence without sampled frames", () => {
    expect(buildProcessingPerformanceEvidence({ elapsedMilliseconds: 0, processedFrames: 0 })).toMatchObject({ elapsedMilliseconds: 0, processedFrames: 0, meanMillisecondsPerFrame: 0, processedFramesPerSecond: 0 });
  });
});
