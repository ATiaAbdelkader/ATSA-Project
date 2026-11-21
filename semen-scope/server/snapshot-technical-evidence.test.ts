import { describe, expect, it } from "vitest";
import { buildSnapshotTechnicalEvidence } from "@shared/snapshotTechnicalEvidence";
import type { StoredSnapshotDetails } from "@shared/dashboardSnapshot";

describe("saved snapshot technical evidence archive", () => {
  it("renders compact technical provenance entries without turning them into biological conclusions", () => {
    const details = {
      metrics: {}, calibration: { micronsPerPixel: 0.5, frameRate: 25 }, thresholds: {} as StoredSnapshotDetails["thresholds"], flags: [],
      temporalSampling: { availableFrames: 100, processedFrames: 25, skippedFrames: 75, frameStep: 4, samplingIntervalSeconds: 0.16, processedPercent: 25, rationale: "" },
      trackLinkageContinuity: { acceptedTracks: 5, expectedFrameStep: 4, linkedSegments: 20, continuousSegments: 18, gapSpanningSegments: 2, continuityPercent: 90, tracksWithGaps: 1, maxSkippedFramesInSegment: 4, rationale: "" },
      trajectoryIntegrity: { acceptedTracks: 5, continuityPercent: 90, tracksWithoutGaps: 4, tracksWithGaps: 1, windowSpanningPercent: 40, boundaryPointPercent: 20, attentionItems: ["2 gap-spanning links"], summaryLine: "90.0% nominal links · 4/5 tracks without observed gaps · 40.0% span the sampled window", safeguard: "Technical context only." },
      trajectorySpatialCoverage: { acceptedTracks: 5, gridColumns: 3, gridRows: 3, occupiedCells: 4, totalCells: 9, maxCellTrackCount: 2, maxCellTrackSharePercent: 40, edgeCellTracks: 3, cells: [], rationale: "" },
      fieldBoundaryContact: { acceptedTracks: 5, boundaryZonePercent: 5, totalPoints: 30, boundaryPoints: 6, boundaryPointPercent: 20, tracksWithBoundaryPoints: 2, tracksStartingInBoundary: 1, tracksEndingInBoundary: 1, rationale: "" },
    } as StoredSnapshotDetails;
    const entries = buildSnapshotTechnicalEvidence(details);

    expect(entries.map(entry => entry.id)).toEqual(["sampling", "linkage", "trajectory-integrity", "spatial", "boundary"]);
    expect(entries.find(entry => entry.id === "spatial")?.safeguard).toContain("not a concentration or density estimate");
    expect(entries.find(entry => entry.id === "linkage")?.detail).toContain("90.0% nominal links");
    expect(entries.find(entry => entry.id === "trajectory-integrity")?.detail).toContain("4/5 tracks without observed gaps");
    expect(entries.find(entry => entry.id === "trajectory-integrity")?.detail).toContain("technical attention: 2 gap-spanning links");
  });
});
