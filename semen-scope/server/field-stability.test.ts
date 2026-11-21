import { describe, expect, it } from "vitest";
import { estimateGlobalGridShiftPx, summarizeFieldStability, type LuminanceGrid } from "../shared/fieldStability";

function grid(values: number[]): LuminanceGrid {
  return { columns: 4, rows: 3, xSpacingPx: 5, ySpacingPx: 5, values };
}

describe("field stability", () => {
  it("estimates a global luminance-grid displacement without changing trajectory data", () => {
    const previous = grid([1, 9, 3, 4, 5, 8, 7, 6, 2, 1, 4, 8]);
    const current = grid([9, 3, 4, 0, 8, 7, 6, 0, 1, 4, 8, 0]);
    expect(estimateGlobalGridShiftPx(previous, current)).toBe(5);
  });

  it("classifies low, review, and high technical global movement", () => {
    expect(summarizeFieldStability([1, 2, 3]).status).toBe("acceptable");
    expect(summarizeFieldStability([5, 6, 4]).status).toBe("review");
    expect(summarizeFieldStability([12, 11, 14]).status).toBe("poor");
  });
});
