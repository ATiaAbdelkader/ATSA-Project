import { describe, expect, it } from "vitest";
import { buildCameraPreviewResolutionEvidence } from "@shared/cameraPreviewEvidence";

describe("browser-local camera preview resolution evidence", () => {
  it("keeps an advisory request distinct from browser-reported actual preview dimensions", () => {
    expect(buildCameraPreviewResolutionEvidence({ profileId: "detail", previewWidth: 0, previewHeight: 0, trackWidth: 1024, trackHeight: 768, trackFrameRate: 59.94, trackResizeMode: "crop-and-scale" })).toMatchObject({
      requestedLabel: "Detail 1280 × 720",
      actualLabel: "1024 × 768",
      actualWidth: 1024,
      actualHeight: 768,
      actualFrameRateLabel: "59.9 fps",
      actualResizeModeLabel: "Crop and scale",
    });
  });
});
