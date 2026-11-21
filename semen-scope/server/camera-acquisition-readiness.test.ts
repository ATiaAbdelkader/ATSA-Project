import { describe, expect, it } from "vitest";
import { buildCameraAcquisitionReadiness } from "@shared/cameraAcquisitionReadiness";

describe("browser-local camera acquisition readiness", () => {
  it("summarizes review-only camera setup evidence without blocking capture", () => {
    const readiness = buildCameraAcquisitionReadiness({ previewActive: true, actualResolutionAvailable: true, actualFrameRateAvailable: true, frameRateNeedsReview: true, calibrationBoardReferenced: false });
    expect(readiness.reviewCount).toBe(2);
    expect(readiness.summary).toBe("2 setup items need technical review");
    expect(readiness.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "preview", status: "ready" }),
      expect.objectContaining({ id: "frame-rate", status: "review" }),
      expect.objectContaining({ id: "calibration", status: "review" }),
    ]));
  });
});
