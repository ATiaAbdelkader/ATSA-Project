import { describe, expect, it } from "vitest";
import { calculateTrackMetrics, DEFAULT_CASA_CALIBRATION, DEFAULT_CASA_THRESHOLDS, summarizeTracks } from "../shared/casa";

describe("CASA-style kinematic calculations", () => {
  it("calculates straight-track velocity measures in calibrated units", () => {
    const points = [0, 1, 2, 3, 4].map(frame => ({ frame, x: frame * 10, y: 0 }));
    const metric = calculateTrackMetrics(
      "T-01",
      points,
      { ...DEFAULT_CASA_CALIBRATION, frameRate: 10, micronsPerPixel: 0.5 },
      { ...DEFAULT_CASA_THRESHOLDS, motilityVclMin: 10, progressiveVapMin: 10 },
    );

    expect(metric.vcl).toBeCloseTo(50, 5);
    expect(metric.vsl).toBeCloseTo(50, 5);
    expect(metric.vap).toBeCloseTo(50, 5);
    expect(metric.lin).toBeCloseTo(100, 5);
    expect(metric.motile).toBe(true);
    expect(metric.progressive).toBe(true);
  });

  it("summarizes motility fractions across valid tracks", () => {
    const fast = calculateTrackMetrics("fast", [{ frame: 0, x: 0, y: 0 }, { frame: 1, x: 10, y: 0 }], { frameRate: 10, micronsPerPixel: 0.5 }, { ...DEFAULT_CASA_THRESHOLDS, motilityVclMin: 20, progressiveVapMin: 20 });
    const slow = calculateTrackMetrics("slow", [{ frame: 0, x: 0, y: 0 }, { frame: 1, x: 1, y: 0 }], { frameRate: 10, micronsPerPixel: 0.5 }, { ...DEFAULT_CASA_THRESHOLDS, motilityVclMin: 20, progressiveVapMin: 20 });
    const summary = summarizeTracks([fast, slow]);

    expect(summary.totalTrackedCells).toBe(2);
    expect(summary.motility).toBeCloseTo(50, 5);
    expect(summary.progressiveMotility).toBeCloseTo(50, 5);
  });

  it("returns confidence-aware extended kinematics with a configurable smoothing window", () => {
    const metric = calculateTrackMetrics(
      "extended",
      [
        { frame: 0, x: 0, y: 0 },
        { frame: 1, x: 7, y: 2 },
        { frame: 2, x: 14, y: 0 },
        { frame: 3, x: 21, y: 3 },
        { frame: 4, x: 28, y: 0 },
        { frame: 5, x: 35, y: 2 },
      ],
      { frameRate: 10, micronsPerPixel: 0.5 },
      { ...DEFAULT_CASA_THRESHOLDS, vapSmoothingWindow: 5, motilityVclMin: 5, motilityVslMin: 5, progressiveVapMin: 5 },
      0.82,
    );

    expect(metric.confidence).toBeCloseTo(0.82, 5);
    expect(metric.alhMax).toBeGreaterThanOrEqual(metric.alh);
    expect(metric.fractalDimension).toBeGreaterThanOrEqual(1);
    expect(metric.fractalDimension).toBeLessThanOrEqual(2);
    expect(metric.motileByVslVap).toBe(true);
  });
});
