import { describe, expect, it } from "vitest";
import { getReviewPlaybackRateAfterFootageChange, resolveReviewPlaybackRate } from "@shared/reviewPlayback";

describe("browser-local review playback", () => {
  it("accepts only supported review rates and safely defaults to real-time", () => {
    expect(resolveReviewPlaybackRate(0.5)).toBe(0.5);
    expect(resolveReviewPlaybackRate(2)).toBe(2);
    expect(resolveReviewPlaybackRate(1.25)).toBe(1);
    expect(getReviewPlaybackRateAfterFootageChange()).toBe(1);
  });
});
