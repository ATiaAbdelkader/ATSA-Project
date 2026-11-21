import { describe, expect, it } from "vitest";
import { buildTrackLinkageContinuityEvidence } from "@shared/trackLinkageContinuity";

describe("track linkage continuity evidence", () => {
  it("reports observed nominal-cadence and gap-spanning retained links without editing them", () => {
    const evidence = buildTrackLinkageContinuityEvidence([
      { id: "TRK-001", points: [{ frame: 0 }, { frame: 3 }, { frame: 6 }, { frame: 12 }] },
      { id: "TRK-002", points: [{ frame: 3 }, { frame: 6 }, { frame: 9 }] },
    ], 3);

    expect(evidence).toMatchObject({ acceptedTracks: 2, expectedFrameStep: 3, linkedSegments: 5, continuousSegments: 4, gapSpanningSegments: 1, continuityPercent: 80, tracksWithGaps: 1, maxSkippedFramesInSegment: 3 });
    expect(evidence.rationale).toContain("4 of 5");
  });

  it("returns safe zeroed continuity evidence when no retained links exist", () => {
    expect(buildTrackLinkageContinuityEvidence([{ id: "TRK-001", points: [{ frame: 0 }] }], 0)).toMatchObject({ acceptedTracks: 1, expectedFrameStep: 1, linkedSegments: 0, continuityPercent: 0, tracksWithGaps: 0 });
  });
});
