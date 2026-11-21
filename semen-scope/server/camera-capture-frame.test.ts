import { describe, expect, it } from "vitest";
import { resolveCameraCaptureFrameDimensions } from "@shared/cameraCaptureFrame";

describe("browser-local camera capture-frame resolution", () => {
  it("uses exposed preview dimensions when they are available", () => {
    expect(resolveCameraCaptureFrameDimensions({ previewWidth: 1279.7, previewHeight: 719.6, trackWidth: 640, trackHeight: 480 })).toEqual({ width: 1280, height: 720 });
  });

  it("falls back to active track settings when preview dimensions are unavailable", () => {
    expect(resolveCameraCaptureFrameDimensions({ previewWidth: 0, previewHeight: 0, trackWidth: 1920, trackHeight: 1080 })).toEqual({ width: 1920, height: 1080 });
  });

  it("does not invent dimensions when neither local source exposes a valid frame", () => {
    expect(resolveCameraCaptureFrameDimensions({ previewWidth: 640, previewHeight: 0, trackWidth: 0, trackHeight: 480 })).toEqual({ width: undefined, height: undefined });
  });
});
