import { describe, expect, it } from "vitest";
import { resolveReviewFrameStep, resolveReviewTimestampSeek } from "@shared/frameReview";

describe("browser-local frame review", () => {
  it("steps one calibrated frame while clamping to the available local video range", () => {
    expect(resolveReviewFrameStep({ currentTimeSeconds: 0, durationSeconds: 2, frameRate: 25, direction: -1 })).toEqual({ frame: 0, timeSeconds: 0 });
    expect(resolveReviewFrameStep({ currentTimeSeconds: 0.08, durationSeconds: 2, frameRate: 25, direction: 1 })).toEqual({ frame: 3, timeSeconds: 0.12 });
    expect(resolveReviewFrameStep({ currentTimeSeconds: 2, durationSeconds: 2, frameRate: 25, direction: 1 })).toEqual({ frame: 49, timeSeconds: 1.96 });
  });

  it("aligns operator-entered review time to configured frames and local boundaries", () => {
    expect(resolveReviewTimestampSeek({ requestedTimeSeconds: 0.21, durationSeconds: 2, frameRate: 25 })).toEqual({ frame: 5, timeSeconds: 0.2 });
    expect(resolveReviewTimestampSeek({ requestedTimeSeconds: 7, durationSeconds: 2, frameRate: 25 })).toEqual({ frame: 49, timeSeconds: 1.96 });
    expect(resolveReviewTimestampSeek({ requestedTimeSeconds: -1, durationSeconds: 2, frameRate: 25 })).toEqual({ frame: 0, timeSeconds: 0 });
  });
});
