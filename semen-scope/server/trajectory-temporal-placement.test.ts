import { describe, expect, it } from "vitest";
import { buildTrajectoryTemporalPlacementEvidence } from "@shared/trajectoryTemporalPlacement";

describe("trajectory temporal placement evidence", () => {
  it("reports retained trajectory positions in the sampled window without inferring biological starts or ends", () => {
    const evidence = buildTrajectoryTemporalPlacementEvidence({
      availableFrames: 20,
      frameStep: 4,
      tracks: [
        { id: "TRK-001", points: [{ frame: 0 }, { frame: 4 }, { frame: 16 }] },
        { id: "TRK-002", points: [{ frame: 4 }, { frame: 8 }] },
        { id: "TRK-003", points: [{ frame: 0 }, { frame: 16 }] },
      ],
    });

    expect(evidence).toMatchObject({ acceptedTracks: 3, windowStartFrame: 0, windowEndFrame: 16, tracksStartingAtWindowBoundary: 2, tracksEndingAtWindowBoundary: 2, tracksSpanningEntireWindow: 2, earliestTrackStartFrame: 0, latestTrackEndFrame: 16 });
    expect(evidence.rationale).toContain("do not establish a track's biological start or end");
  });

  it("returns safe empty observation-window context when no tracks are retained", () => {
    expect(buildTrajectoryTemporalPlacementEvidence({ tracks: [], availableFrames: 11, frameStep: 4 })).toMatchObject({ acceptedTracks: 0, windowEndFrame: 8, tracksStartingAtWindowBoundary: 0, tracksEndingAtWindowBoundary: 0 });
  });
});
