import { describe, expect, it } from "vitest";
import { buildTemporalSamplingEvidence } from "@shared/temporalSampling";

describe("temporal sampling evidence", () => {
  it("records processed coverage and sampling interval without changing source frames", () => {
    expect(buildTemporalSamplingEvidence({ availableFrames: 100, processedFrames: 25, frameStep: 4, frameRate: 20 })).toEqual(expect.objectContaining({
      availableFrames: 100,
      processedFrames: 25,
      skippedFrames: 75,
      frameStep: 4,
      samplingIntervalSeconds: 0.2,
      processedPercent: 25,
    }));
  });

  it("uses a one-frame interval when input frame step is invalid", () => {
    const evidence = buildTemporalSamplingEvidence({ availableFrames: 10, processedFrames: 10, frameStep: 0, frameRate: 25 });
    expect(evidence.frameStep).toBe(1);
    expect(evidence.rationale).toContain("Every available frame");
  });
});
