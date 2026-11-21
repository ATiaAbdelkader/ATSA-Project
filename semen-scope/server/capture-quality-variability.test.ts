import { describe, expect, it } from "vitest";
import { buildCaptureQualityVariability } from "@shared/captureQualityVariability";

describe("capture quality variability", () => {
  it("summarizes already-measured frame-quality dispersion without frame changes", () => {
    const evidence = buildCaptureQualityVariability([{ brightness: 10, contrast: 4, focus: 2 }, { brightness: 14, contrast: 8, focus: 6 }]);
    expect(evidence).toMatchObject({ sampledFrames: 2, brightnessStandardDeviation: 2, contrastStandardDeviation: 2, focusStandardDeviation: 2, brightnessRange: 4, contrastRange: 4, focusRange: 4 });
    expect(evidence.rationale).toContain("does not modify frames, candidates, trajectories");
  });

  it("returns a safe empty summary", () => {
    expect(buildCaptureQualityVariability([])).toMatchObject({ sampledFrames: 0, brightnessStandardDeviation: 0, contrastStandardDeviation: 0, focusStandardDeviation: 0 });
  });
});
