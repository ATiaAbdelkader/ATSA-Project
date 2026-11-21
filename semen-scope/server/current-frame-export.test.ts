import { describe, expect, it } from "vitest";
import { buildCurrentFramePngFilename, CURRENT_FRAME_EXPORT_NOTICE } from "@shared/currentFrameExport";

describe("current browser-local frame export", () => {
  it("creates a safe deterministic PNG name and preserves its technical-review safeguard", () => {
    expect(buildCurrentFramePngFilename("Bovine field A", 1.2346)).toBe("bovine-field-a-frame-1235ms.png");
    expect(buildCurrentFramePngFilename("", Number.NaN)).toBe("semenscope-frame-frame-0ms.png");
    expect(CURRENT_FRAME_EXPORT_NOTICE).toContain("not stored by SemenScope");
    expect(CURRENT_FRAME_EXPORT_NOTICE).toContain("not a diagnostic");
  });
});
