import { describe, expect, it } from "vitest";
import { buildAcquisitionReadiness, calculateDosePlan, EMPTY_SPECIMEN_CONTEXT } from "../shared/specimenWorkflow";

describe("specimen traceability and planning workflow", () => {
  it("calculates a theoretical dose count only from complete operator-entered measurements", () => {
    expect(calculateDosePlan({ measuredConcentrationMillionsPerMl: 80, availableVolumeMl: 4, targetSpermMillionsPerDose: 20 })).toMatchObject({ totalSpermMillions: 320, theoreticalDoseCount: 16 });
    expect(calculateDosePlan({ measuredConcentrationMillionsPerMl: 80, availableVolumeMl: 0, targetSpermMillionsPerDose: 20 })).toBeUndefined();
  });

  it("keeps missing traceability and calibration visible as review requirements", () => {
    const readiness = buildAcquisitionReadiness({ specimenContext: EMPTY_SPECIMEN_CONTEXT, width: 780, height: 580, frameRate: 25 });
    expect(readiness.items.find(item => item.id === "specimen")?.status).toBe("review");
    expect(readiness.items.find(item => item.id === "calibration")?.status).toBe("review");
    expect(readiness.items.find(item => item.id === "video")?.status).toBe("ready");
    expect(readiness.items.find(item => item.id === "capture")?.status).toBe("pending");
  });

  it("records supported evidence as ready without turning capture review into a fertility decision", () => {
    const readiness = buildAcquisitionReadiness({
      specimenContext: { ...EMPTY_SPECIMEN_CONTEXT, specimenId: "EJ-42" },
      calibrationEvidence: { method: "manual-two-point-reference", boardIntervalMicrons: 100, pixelDistance: 250, micronsPerPixel: 0.4, angleDegrees: 0 },
      width: 780,
      height: 580,
      frameRate: 25,
      captureQuality: { status: "acceptable" },
    });
    expect(readiness.readyCount).toBe(4);
    expect(readiness.reviewCount).toBe(0);
    expect(readiness.pendingCount).toBe(0);
  });
});
