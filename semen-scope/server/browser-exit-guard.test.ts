import { describe, expect, it } from "vitest";
import { shouldWarnBeforeBrowserExit } from "@shared/browserExitGuard";

describe("browser-local capture exit safeguard", () => {
  it("includes active pre-capture stabilization without changing normal idle behavior", () => {
    expect(shouldWarnBeforeBrowserExit({ recording: false, analyzing: false, preCaptureStabilizing: false })).toBe(false);
    expect(shouldWarnBeforeBrowserExit({ recording: false, analyzing: false, preCaptureStabilizing: true })).toBe(true);
    expect(shouldWarnBeforeBrowserExit({ recording: false, analyzing: false, preCaptureStabilizing: false, localTechnicalAnnotations: true })).toBe(true);
  });
});
