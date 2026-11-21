import { describe, expect, it } from "vitest";
import { buildTrajectorySpatialCoverageEvidence } from "@shared/trajectorySpatialCoverage";

describe("trajectory spatial coverage evidence", () => {
  it("summarizes retained-track centroid regions without treating coverage as density", () => {
    const evidence = buildTrajectorySpatialCoverageEvidence({
      width: 300,
      height: 300,
      tracks: [
        { id: "TRK-001", points: [{ x: 20, y: 20 }, { x: 30, y: 30 }] },
        { id: "TRK-002", points: [{ x: 50, y: 50 }] },
        { id: "TRK-003", points: [{ x: 150, y: 150 }] },
        { id: "TRK-004", points: [{ x: 290, y: 290 }] },
      ],
    });

    expect(evidence).toMatchObject({ acceptedTracks: 4, gridColumns: 3, gridRows: 3, occupiedCells: 3, totalCells: 9, maxCellTrackCount: 2, maxCellTrackSharePercent: 50, edgeCellTracks: 3 });
    expect(evidence.rationale).toContain("not a concentration or density estimate");
  });

  it("returns empty technical coverage when no track centroid is available", () => {
    const evidence = buildTrajectorySpatialCoverageEvidence({ tracks: [{ id: "TRK-001", points: [] }], width: 0, height: 0 });
    expect(evidence).toMatchObject({ acceptedTracks: 0, occupiedCells: 0, maxCellTrackSharePercent: 0, edgeCellTracks: 0 });
  });
});
