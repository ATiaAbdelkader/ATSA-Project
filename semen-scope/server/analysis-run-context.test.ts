import { describe, expect, it } from "vitest";
import { DEFAULT_CASA_CALIBRATION, DEFAULT_CASA_THRESHOLDS } from "@shared/casa";
import { createBrowserLocalAnalysisRunContext } from "@shared/analysisRunContext";

describe("createBrowserLocalAnalysisRunContext", () => {
  it("clones and freezes the technical basis captured when a local analysis starts", () => {
    const calibration = { ...DEFAULT_CASA_CALIBRATION, micronsPerPixel: 0.23 };
    const thresholds = { ...DEFAULT_CASA_THRESHOLDS, minTrackConfidence: 0.72 };
    const specimenContext = { specimenId: "SP-08", donorId: "AN-14", collectionReference: "COL-3", collectionDateTime: "2026-08-23T09:00", chamberReference: "CH-1", preparationProtocolReference: "PR-2", dilutionFactor: 2, analystNote: "start state" };
    const context = createBrowserLocalAnalysisRunContext({
      sourceUrl: "blob:local-capture",
      source: "camera",
      fileName: "capture.webm",
      sampleName: "Field 08",
      species: "Bovine",
      calibration,
      thresholds,
      calibrationEvidence: { boardIntervalMicrons: 100, pixelDistance: 400, micronsPerPixel: 0.25, angleDegrees: 0, capturedAt: "2026-08-23T09:00:00.000Z", imageWidth: 1280, imageHeight: 720, method: "manual-two-point-reference" },
      footageProvenance: { source: "camera", container: "WebM", byteSize: 1234, captureDeviceLabel: "Scope A" },
      specimenContext,
      opticsTraceability: { objectiveMagnification: "40×", chamberDepthMicrons: 20 },
      dosePlan: { measuredConcentrationMillionsPerMl: 40, availableVolumeMl: 2, targetSpermMillionsPerDose: 10 },
      partialCameraCaptureReviewAcknowledgedAt: "2026-08-23T09:02:00.000Z",
    });

    calibration.micronsPerPixel = 9;
    thresholds.minTrackConfidence = 0.1;
    specimenContext.analystNote = "later edit";

    expect(context.calibration.micronsPerPixel).toBe(0.23);
    expect(context.thresholds.minTrackConfidence).toBe(0.72);
    expect(context.specimenContext.analystNote).toBe("start state");
    expect(context.partialCameraCaptureReviewAcknowledgedAt).toBe("2026-08-23T09:02:00.000Z");
    expect(context.calibrationProvenance).toBe("board-referenced");
    expect(context.methodFingerprint).toMatch(/^SS-BOV-/);
    expect(Object.isFrozen(context)).toBe(true);
    expect(Object.isFrozen(context.footageProvenance)).toBe(true);
  });
});
