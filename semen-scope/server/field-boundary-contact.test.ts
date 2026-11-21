import { describe, expect, it } from "vitest";
import { buildFieldBoundaryContactEvidence } from "@shared/fieldBoundaryContact";

describe("field-boundary contact evidence", () => {
  it("summarizes retained point proximity to the image edge without excluding tracks", () => {
    const evidence = buildFieldBoundaryContactEvidence({
      width: 100,
      height: 100,
      boundaryZonePercent: 10,
      tracks: [
        { id: "TRK-001", points: [{ x: 5, y: 50 }, { x: 50, y: 50 }, { x: 95, y: 50 }] },
        { id: "TRK-002", points: [{ x: 30, y: 30 }, { x: 40, y: 40 }] },
      ],
    });

    expect(evidence).toMatchObject({ acceptedTracks: 2, totalPoints: 5, boundaryPoints: 2, boundaryPointPercent: 40, tracksWithBoundaryPoints: 1, tracksStartingInBoundary: 1, tracksEndingInBoundary: 1 });
    expect(evidence.rationale).toContain("does not reject tracks");
  });

  it("returns safe empty technical context without points", () => {
    expect(buildFieldBoundaryContactEvidence({ tracks: [{ id: "TRK-001", points: [] }], width: 0, height: 0 })).toMatchObject({ acceptedTracks: 0, totalPoints: 0, boundaryPointPercent: 0, tracksWithBoundaryPoints: 0 });
  });
});
