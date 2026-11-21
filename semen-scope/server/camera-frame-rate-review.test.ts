import { describe, expect, it } from "vitest";
import { buildCameraFrameRateReview } from "@shared/cameraFrameRateReview";

describe("browser-local camera frame-rate review", () => {
  it("flags material differences without altering the configured method", () => {
    expect(buildCameraFrameRateReview({ actualFrameRate: 59.94, configuredFrameRate: 60 })).toEqual({ needsReview: false });
    expect(buildCameraFrameRateReview({ actualFrameRate: 59.94, configuredFrameRate: 25 })).toEqual({
      needsReview: true,
      message: "Browser camera reports 59.9 fps while the configured analysis rate is 25 fps. No setting has been changed automatically; confirm the method before analysis.",
    });
  });
});
