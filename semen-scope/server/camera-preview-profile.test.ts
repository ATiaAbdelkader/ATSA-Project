import { describe, expect, it } from "vitest";
import { buildCameraPreviewConstraints } from "@shared/cameraPreviewProfile";

describe("browser-local camera preview profiles", () => {
  it("uses optional ideal preview dimensions without replacing the selected device constraint", () => {
    expect(buildCameraPreviewConstraints("", "native")).toBe(true);
    expect(buildCameraPreviewConstraints("scope-1", "detail")).toEqual({ deviceId: { exact: "scope-1" }, width: { ideal: 1280 }, height: { ideal: 720 } });
    expect(buildCameraPreviewConstraints("scope-1", "compat")).toEqual({ deviceId: { exact: "scope-1" }, width: { ideal: 640 }, height: { ideal: 480 } });
  });
});
