import { describe, expect, it } from "vitest";
import { buildCameraStillPngFilename, CAMERA_STILL_EXPORT_NOTICE } from "@shared/cameraStillExport";

describe("browser-local camera still export", () => {
  it("builds a safe local PNG filename with an explicit non-storage safeguard", () => {
    expect(buildCameraStillPngFilename("Microscope capture · 2 s", "2026-08-27T10:40:00.000Z")).toBe("microscope-capture-2-s-microscope-still-20260827T104000Z.png");
    expect(buildCameraStillPngFilename("", undefined)).toBe("microscope-still-microscope-still-local.png");
    expect(CAMERA_STILL_EXPORT_NOTICE).toContain("not stored by SemenScope");
  });
});
