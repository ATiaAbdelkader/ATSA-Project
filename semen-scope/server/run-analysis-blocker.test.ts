import { describe, expect, it } from "vitest";
import { getRunAnalysisDisabledReason } from "@shared/runAnalysisBlocker";

describe("Run analysis blocking guidance", () => {
  it("prioritizes active local work safeguards before a browser-local decode error", () => {
    expect(getRunAnalysisDisabledReason({ recording: true, partialCameraCaptureReviewRequired: true, mediaError: "Could not decode." })).toContain("active local camera recording");
    expect(getRunAnalysisDisabledReason({ recording: false, partialCameraCaptureReviewRequired: true, mediaError: "Could not decode." })).toContain("partial camera clip");
  });

  it("locks analysis with recovery guidance when active footage has a local media error", () => {
    expect(getRunAnalysisDisabledReason({ recording: false, partialCameraCaptureReviewRequired: false, mediaError: "This video codec is not supported." })).toBe("Replace the active footage with a browser-decodable H.264 MP4 or WebM clip before starting analysis");
    expect(getRunAnalysisDisabledReason({ recording: false, partialCameraCaptureReviewRequired: false })).toBeUndefined();
  });
});
