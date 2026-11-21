import { describe, expect, it } from "vitest";
import { getCameraPreviewOrientationClass } from "@shared/cameraPreviewOrientation";

describe("browser-local camera preview orientation", () => {
  it("returns a display-only class only for an operator-selected mirror preview", () => {
    expect(getCameraPreviewOrientationClass("normal")).toBe("");
    expect(getCameraPreviewOrientationClass("mirrored")).toBe("camera-preview-mirrored");
  });
});
