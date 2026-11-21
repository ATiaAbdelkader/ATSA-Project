import { describe, expect, it } from "vitest";
import { describeCameraPreCaptureDelay, getPreCaptureDelayRemainingSeconds, normalizeCameraPreCaptureDelay } from "@shared/cameraPreCaptureDelay";

describe("browser-local camera pre-capture stabilization delay", () => {
  it("keeps delay values bounded and provides a deterministic countdown", () => {
    expect(normalizeCameraPreCaptureDelay(3)).toBe(3);
    expect(normalizeCameraPreCaptureDelay(4)).toBe(0);
    expect(describeCameraPreCaptureDelay(5)).toBe("5 s stabilization delay");
    expect(getPreCaptureDelayRemainingSeconds(5_000, 3_001)).toBe(2);
  });
});
