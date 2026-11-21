import { describe, expect, it } from "vitest";
import { clearTechnicalReviewedTracks, isTechnicalReviewedTrack, toggleTechnicalReviewedTrack } from "@shared/trackReviewMark";

describe("browser-local technical reviewed-track markers", () => {
  it("toggles only local marker identifiers without altering track data", () => {
    const marked = toggleTechnicalReviewedTrack(["track-3"], "track-1");
    expect(marked).toEqual(["track-1", "track-3"]);
    expect(isTechnicalReviewedTrack(marked, "track-1")).toBe(true);
    expect(toggleTechnicalReviewedTrack(marked, "track-1")).toEqual(["track-3"]);
    expect(clearTechnicalReviewedTracks()).toEqual([]);
  });
});
