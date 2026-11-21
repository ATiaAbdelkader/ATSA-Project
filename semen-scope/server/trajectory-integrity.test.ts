import { describe, expect, it } from "vitest";
import { buildTrajectoryIntegrityEvidence } from "@shared/trajectoryIntegrity";

describe("trajectory integrity evidence", () => {
  it("consolidates existing technical signals without changing tracks", () => {
    const evidence = buildTrajectoryIntegrityEvidence(
      { acceptedTracks: 4, expectedFrameStep: 3, linkedSegments: 20, continuousSegments: 18, gapSpanningSegments: 2, continuityPercent: 90, tracksWithGaps: 2, maxSkippedFramesInSegment: 6, rationale: "" },
      { acceptedTracks: 4, windowStartFrame: 0, windowEndFrame: 60, tracksStartingAtWindowBoundary: 1, tracksEndingAtWindowBoundary: 2, tracksSpanningEntireWindow: 2, earliestTrackStartFrame: 0, latestTrackEndFrame: 60, rationale: "" },
      { acceptedTracks: 4, boundaryZonePercent: 5, totalPoints: 100, boundaryPoints: 8, boundaryPointPercent: 8, tracksWithBoundaryPoints: 2, tracksStartingInBoundary: 1, tracksEndingInBoundary: 1, rationale: "" },
    );
    expect(evidence).toMatchObject({ acceptedTracks: 4, continuityPercent: 90, tracksWithoutGaps: 2, tracksWithGaps: 2, windowSpanningPercent: 50, boundaryPointPercent: 8 });
    expect(evidence.attentionItems).toEqual(["2 gap-spanning links", "tracks touch the sampled-window boundary", "8 points in the outer image zone"]);
    expect(evidence.safeguard).toContain("alter kinematics");
  });

  it("returns a safe zero-track scorecard without division errors", () => {
    const evidence = buildTrajectoryIntegrityEvidence(
      { acceptedTracks: 0, expectedFrameStep: 1, linkedSegments: 0, continuousSegments: 0, gapSpanningSegments: 0, continuityPercent: 0, tracksWithGaps: 0, maxSkippedFramesInSegment: 0, rationale: "" },
      { acceptedTracks: 0, windowStartFrame: 0, windowEndFrame: 0, tracksStartingAtWindowBoundary: 0, tracksEndingAtWindowBoundary: 0, tracksSpanningEntireWindow: 0, earliestTrackStartFrame: 0, latestTrackEndFrame: 0, rationale: "" },
      { acceptedTracks: 0, boundaryZonePercent: 5, totalPoints: 0, boundaryPoints: 0, boundaryPointPercent: 0, tracksWithBoundaryPoints: 0, tracksStartingInBoundary: 0, tracksEndingInBoundary: 0, rationale: "" },
    );
    expect(evidence).toMatchObject({ acceptedTracks: 0, tracksWithoutGaps: 0, windowSpanningPercent: 0, attentionItems: [] });
  });
});
