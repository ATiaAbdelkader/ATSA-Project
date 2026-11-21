import { describe, expect, it } from "vitest";
import { buildConfidenceDistribution } from "../shared/confidenceDistribution";

describe("confidence distribution", () => {
  it("separates track association evidence around the active threshold", () => {
    expect(buildConfidenceDistribution([0.2, 0.45, 0.6, 0.9], 0.45)).toEqual({ total: 4, belowThreshold: 1, atOrAboveThreshold: 3, mean: 0.5375 });
  });

  it("returns a safe empty distribution", () => {
    expect(buildConfidenceDistribution([], 0.45)).toEqual({ total: 0, belowThreshold: 0, atOrAboveThreshold: 0, mean: 0 });
  });
});
