import { describe, expect, it } from "vitest";
import { DEFAULT_CASA_THRESHOLDS, type CasaTrackMetrics } from "../shared/casa";
import { buildTechnicalReviewQueue } from "../shared/trackReviewQueue";

const base = (id: string, overrides: Partial<CasaTrackMetrics>): { id: string; metrics: CasaTrackMetrics } => ({ id, metrics: { id, frames: 12, vcl: 24, vsl: 18, vap: 21, lin: 75, str: 86, wob: 88, alh: 2, bcf: 5, dance: 4, mad: 10, alhMax: 3, fractalDimension: 1.1, confidence: 0.9, motile: true, motileByVslVap: true, progressive: true, ...overrides } });

describe("technical track review queue", () => {
  it("ranks transparent confidence and duration review candidates above eligible tracks", () => {
    const queue = buildTechnicalReviewQueue([base("eligible", {}), base("short-low-confidence", { frames: 3, confidence: 0.2 }), base("low-confidence", { confidence: 0.3 })], DEFAULT_CASA_THRESHOLDS);
    expect(queue.map(item => item.id)).toEqual(["short-low-confidence", "low-confidence"]);
    expect(queue[0]?.reasons).toHaveLength(2);
  });

  it("identifies a static classification with a measured technical path without biological inference", () => {
    const queue = buildTechnicalReviewQueue([base("threshold-review", { motile: false, motileByVslVap: false, progressive: false, vcl: 3 })], DEFAULT_CASA_THRESHOLDS);
    expect(queue[0]?.reasons[0]).toContain("Below active motility thresholds");
  });
});
