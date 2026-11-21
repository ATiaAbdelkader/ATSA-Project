import { describe, expect, it } from "vitest";
import { selectCameraRecorderMimeType } from "@shared/cameraRecorderFormat";

describe("browser-local camera recorder format selection", () => {
  it("prefers the first supported WebM format", () => {
    expect(selectCameraRecorderMimeType(mimeType => mimeType === "video/webm;codecs=vp8,opus")).toBe("video/webm;codecs=vp8,opus");
  });

  it("falls back to MediaRecorder defaults when support cannot be confirmed", () => {
    expect(selectCameraRecorderMimeType()).toBeUndefined();
    expect(selectCameraRecorderMimeType(() => false)).toBeUndefined();
  });
});
