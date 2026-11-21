import { describe, expect, it } from "vitest";
import { buildTrackDurationEvidence } from "@shared/trackDurationEvidence";

describe("accepted-track duration evidence", () => {
  it("summarizes observed accepted-track frame counts without modifying them", () => {
    expect(buildTrackDurationEvidence([6, 10, 14])).toEqual({ acceptedTracks: 3, meanFrames: 10, shortestFrames: 6, longestFrames: 14 });
  });
});
