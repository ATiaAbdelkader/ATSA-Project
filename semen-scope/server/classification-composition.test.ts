import { describe, expect, it } from "vitest";
import { buildClassificationComposition } from "@shared/classificationComposition";

describe("classification composition", () => {
  it("summarizes the existing classifications without recomputing them", () => {
    const tracks = [
      { progressive: true, motile: true },
      { progressive: false, motile: true },
      { progressive: false, motile: false },
    ] as never[];
    expect(buildClassificationComposition(tracks)).toEqual({ total: 3, progressive: 1, motileNonProgressive: 1, nonMotile: 1 });
  });
});
