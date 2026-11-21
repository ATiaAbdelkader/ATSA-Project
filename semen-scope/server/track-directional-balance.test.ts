import { describe, expect, it } from "vitest";
import { buildTrackDirectionalBalanceEvidence } from "@shared/trackDirectionalBalance";

describe("track directional balance evidence", () => {
  it("summarizes first-to-last image-coordinate octants without changing tracks", () => {
    const evidence = buildTrackDirectionalBalanceEvidence([
      { id: "TRK-001", points: [{ frame: 0, x: 0, y: 0 }, { frame: 4, x: 5, y: 0 }] },
      { id: "TRK-002", points: [{ frame: 0, x: 4, y: 4 }, { frame: 4, x: 8, y: 4 }] },
      { id: "TRK-003", points: [{ frame: 0, x: 0, y: 0 }, { frame: 4, x: 0, y: 5 }] },
      { id: "TRK-004", points: [{ frame: 0, x: 3, y: 3 }, { frame: 4, x: 3.2, y: 3.2 }] },
    ]);

    expect(evidence).toMatchObject({ acceptedTracks: 4, resolvedDirectionTracks: 3, unresolvedDirectionTracks: 1, dominantOctant: "right", dominantOctantSharePercent: 66.66666666666666 });
    expect(evidence.octantCounts).toMatchObject({ right: 2, lower: 1 });
    expect(evidence.rationale).toContain("not motion compensation");
  });

  it("returns safe empty direction context without usable retained tracks", () => {
    expect(buildTrackDirectionalBalanceEvidence([])).toMatchObject({ acceptedTracks: 0, resolvedDirectionTracks: 0, unresolvedDirectionTracks: 0, dominantOctant: "none", dominantOctantSharePercent: 0 });
  });
});
