import { describe, expect, it } from "vitest";
import { attachCalibrationEvidence, estimateCalibrationBoardScale, getCalibrationProvenance } from "../shared/calibrationBoard";

describe("calibration board scale estimation", () => {
  it("returns an auditable micrometres-per-pixel estimate from two known references", () => {
    const result = estimateCalibrationBoardScale({
      first: { x: 100, y: 80 },
      second: { x: 300, y: 80 },
      boardIntervalMicrons: 100,
      imageWidth: 640,
      imageHeight: 480,
      capturedAt: "2026-08-22T00:00:00.000Z",
    });
    expect(result?.micronsPerPixel).toBeCloseTo(0.5, 8);
    expect(result?.pixelDistance).toBe(200);
    expect(result?.method).toBe("manual-two-point-reference");
  });

  it("rejects a non-positive interval or an implausibly short reference distance", () => {
    expect(estimateCalibrationBoardScale({ first: { x: 10, y: 10 }, second: { x: 15, y: 10 }, boardIntervalMicrons: 100, imageWidth: 640, imageHeight: 480 })).toBeUndefined();
    expect(estimateCalibrationBoardScale({ first: { x: 10, y: 10 }, second: { x: 50, y: 10 }, boardIntervalMicrons: 0, imageWidth: 640, imageHeight: 480 })).toBeUndefined();
  });

  it("attaches the same board evidence to settings and result payloads for persistence", () => {
    const evidence = estimateCalibrationBoardScale({ first: { x: 0, y: 0 }, second: { x: 200, y: 0 }, boardIntervalMicrons: 100, imageWidth: 640, imageHeight: 480, capturedAt: "2026-08-22T00:00:00.000Z" });
    const settings = attachCalibrationEvidence({ species: "Bovine", calibration: { micronsPerPixel: 0.5 } }, evidence);
    const metadata = attachCalibrationEvidence({ width: 780, height: 580, captureQuality: "review" }, evidence);

    expect(JSON.parse(JSON.stringify(settings)).calibrationEvidence).toEqual(evidence);
    expect(JSON.parse(JSON.stringify(metadata)).calibrationEvidence).toEqual(evidence);
  });

  it("distinguishes board-referenced and manual-unverified scale provenance", () => {
    const evidence = estimateCalibrationBoardScale({ first: { x: 0, y: 0 }, second: { x: 100, y: 0 }, boardIntervalMicrons: 100, imageWidth: 640, imageHeight: 480 });
    expect(getCalibrationProvenance(evidence)).toBe("board-referenced");
    expect(getCalibrationProvenance()).toBe("manual-unverified");
  });
});
