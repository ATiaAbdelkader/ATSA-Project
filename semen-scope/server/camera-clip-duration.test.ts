import { describe, expect, it } from "vitest";
import { describeCameraClipDuration, getRemainingCameraClipSeconds, normalizeCameraClipDuration } from "@shared/cameraClipDuration";

describe("camera clip duration", () => {
  it("keeps supported short capture durations", () => {
    expect(normalizeCameraClipDuration(2)).toBe(2);
    expect(normalizeCameraClipDuration(5)).toBe(5);
    expect(normalizeCameraClipDuration(10)).toBe(10);
    expect(describeCameraClipDuration(5)).toBe("5 s clip");
  });

  it("falls back to the shortest bounded browser-local capture duration", () => {
    expect(normalizeCameraClipDuration(0)).toBe(2);
    expect(normalizeCameraClipDuration(30)).toBe(2);
  });

  it("returns a bounded local recording countdown without extending capture duration", () => {
    expect(getRemainingCameraClipSeconds(1_000, 5, 1_000)).toBe(5);
    expect(getRemainingCameraClipSeconds(1_000, 5, 5_100)).toBe(1);
    expect(getRemainingCameraClipSeconds(1_000, 5, 6_000)).toBe(0);
  });
});
