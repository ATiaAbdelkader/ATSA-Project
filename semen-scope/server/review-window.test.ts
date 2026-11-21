import { describe, expect, it } from "vitest";
import { addTechnicalReviewWindowEnd, createTechnicalReviewWindowStart, formatTechnicalReviewWindow, getTechnicalReviewWindowBoundary, shouldRestartTechnicalReviewWindow } from "@shared/reviewWindow";

describe("browser-local technical review window", () => {
  it("keeps review-only bounds chronological and aligned to configured frames", () => {
    const start = createTechnicalReviewWindowStart({ timeSeconds: 0.21, frameRate: 25 });
    expect(start).toEqual({ startFrame: 5, startTimeSeconds: 0.2 });
    expect(addTechnicalReviewWindowEnd(start, { timeSeconds: 0.2, frameRate: 25 })).toBeUndefined();
    const complete = addTechnicalReviewWindowEnd(start, { timeSeconds: 0.61, frameRate: 25 });
    expect(complete).toEqual({ startFrame: 5, startTimeSeconds: 0.2, endFrame: 15, endTimeSeconds: 0.6 });
    expect(formatTechnicalReviewWindow(complete!)).toBe("frame 5 · 0.200 s to frame 15 · 0.600 s");
    expect(getTechnicalReviewWindowBoundary(complete!, "start")).toEqual({ frame: 5, timeSeconds: 0.2 });
    expect(getTechnicalReviewWindowBoundary(complete!, "end")).toEqual({ frame: 15, timeSeconds: 0.6 });
    expect(shouldRestartTechnicalReviewWindow(complete!, 0.59)).toBe(false);
    expect(shouldRestartTechnicalReviewWindow(complete!, 0.6)).toBe(true);
  });
});
