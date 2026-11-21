import { describe, expect, it } from "vitest";
import { buildAnalysisScalingEvidence } from "@shared/analysisScalingEvidence";

describe("analysis scaling evidence", () => {
  it("records existing canvas dimensions without altering frames", () => {
    const evidence = buildAnalysisScalingEvidence({ sourceWidth: 1920, sourceHeight: 1080, workingCanvasWidth: 560, workingCanvasHeight: 315 });
    expect(evidence).toMatchObject({ sourceWidth: 1920, sourceHeight: 1080, workingCanvasWidth: 560, workingCanvasHeight: 315, sourcePixelsPerWorkingPixelX: 1920 / 560, sourcePixelsPerWorkingPixelY: 1080 / 315, wasDownscaled: true });
    expect(evidence.rationale).toContain("does not modify source frames, candidates, trajectories");
  });

  it("returns safe unavailable evidence for invalid dimensions", () => {
    expect(buildAnalysisScalingEvidence({ sourceWidth: 0, sourceHeight: 0, workingCanvasWidth: 0, workingCanvasHeight: 0 })).toMatchObject({ sourcePixelsPerWorkingPixelX: 0, sourcePixelsPerWorkingPixelY: 0, wasDownscaled: false });
  });
});
