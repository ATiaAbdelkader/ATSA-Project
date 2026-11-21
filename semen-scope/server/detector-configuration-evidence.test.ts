import { describe, expect, it } from "vitest";
import { buildDetectorConfigurationEvidence } from "@shared/detectorConfigurationEvidence";

describe("detector configuration evidence", () => {
  it("records the existing detector sampling geometry and thresholds", () => {
    const evidence = buildDetectorConfigurationEvidence({ workingCanvasWidth: 560, workingCanvasHeight: 416, detectionSensitivity: 45 });
    expect(evidence).toMatchObject({ samplingStridePx: 4, darknessThreshold: 42.75, contrastThreshold: 9.9, candidateLimitPerFrame: 360 });
    expect(evidence.rationale).toContain("does not change detection, candidates, trajectories");
  });

  it("returns safe geometry for unavailable dimensions", () => {
    expect(buildDetectorConfigurationEvidence({ workingCanvasWidth: 0, workingCanvasHeight: 0, detectionSensitivity: 0 })).toMatchObject({ samplingStridePx: 4, darknessThreshold: 108, contrastThreshold: 7, candidateLimitPerFrame: 360 });
  });
});
