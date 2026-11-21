import { describe, expect, it } from "vitest";
import { buildTrackMetricRangeEvidence } from "@shared/trackMetricRangeEvidence";
import type { CasaTrackMetrics } from "@shared/casa";

function track(id: string, vcl: number, lin: number, confidence: number): CasaTrackMetrics {
  return { id, frames: 8, vcl, vsl: 0, vap: 0, lin, str: 0, wob: 0, alh: 0, bcf: 0, dance: 0, mad: 0, alhMax: 0, fractalDimension: 1, confidence, motile: false, motileByVslVap: false, progressive: false };
}

describe("per-track metric-range evidence", () => {
  it("summarizes retained-track numeric ranges and exposes only deterministic review candidates", () => {
    const evidence = buildTrackMetricRangeEvidence([
      track("TRK-001", 10, 30, 0.5),
      track("TRK-002", 11, 31, 0.6),
      track("TRK-003", 12, 32, 0.7),
      track("TRK-004", 13, 33, 0.8),
      track("TRK-005", 14, 34, 0.9),
      track("TRK-006", 100, 80, 0.95),
    ]);

    expect(evidence.acceptedTracks).toBe(6);
    expect(evidence.vcl).toMatchObject({ minimum: 10, median: 12.5, maximum: 100, outlierTrackIds: ["TRK-006"] });
    expect(evidence.lin).toMatchObject({ minimum: 30, median: 32.5, maximum: 80, outlierTrackIds: ["TRK-006"] });
    expect(evidence.confidence).toMatchObject({ minimum: 0.5, median: 0.75, maximum: 0.95, outlierTrackIds: [] });
  });

  it("uses zeroed empty evidence without mutating or excluding tracks", () => {
    expect(buildTrackMetricRangeEvidence([])).toEqual({
      acceptedTracks: 0,
      vcl: { minimum: 0, median: 0, maximum: 0, interquartileRange: 0, outlierTrackIds: [] },
      lin: { minimum: 0, median: 0, maximum: 0, interquartileRange: 0, outlierTrackIds: [] },
      confidence: { minimum: 0, median: 0, maximum: 0, interquartileRange: 0, outlierTrackIds: [] },
    });
  });
});
