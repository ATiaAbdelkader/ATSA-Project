export type LuminanceGrid = {
  columns: number;
  rows: number;
  xSpacingPx: number;
  ySpacingPx: number;
  values: number[];
};

export type FieldStabilityStatus = "acceptable" | "review" | "poor";

export type FieldStability = {
  meanShiftPx: number;
  maxShiftPx: number;
  sampledPairs: number;
  status: FieldStabilityStatus;
  rationale: string;
};

function mean(values: number[]) {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;
}

export function estimateGlobalGridShiftPx(previous: LuminanceGrid, current: LuminanceGrid) {
  if (previous.columns !== current.columns || previous.rows !== current.rows) return 0;
  let bestScore = Number.POSITIVE_INFINITY;
  let bestShift = 0;
  for (let yOffset = -2; yOffset <= 2; yOffset += 1) {
    for (let xOffset = -2; xOffset <= 2; xOffset += 1) {
      let difference = 0;
      let count = 0;
      for (let y = 0; y < previous.rows; y += 1) {
        const currentY = y + yOffset;
        if (currentY < 0 || currentY >= current.rows) continue;
        for (let x = 0; x < previous.columns; x += 1) {
          const currentX = x + xOffset;
          if (currentX < 0 || currentX >= current.columns) continue;
          difference += Math.abs(previous.values[y * previous.columns + x] - current.values[currentY * current.columns + currentX]);
          count += 1;
        }
      }
      const score = count ? difference / count : Number.POSITIVE_INFINITY;
      if (score < bestScore) {
        bestScore = score;
        bestShift = Math.hypot(xOffset * previous.xSpacingPx, yOffset * previous.ySpacingPx);
      }
    }
  }
  return bestShift;
}

export function summarizeFieldStability(shiftsPx: number[]): FieldStability {
  const meanShiftPx = mean(shiftsPx);
  const maxShiftPx = Math.max(...shiftsPx, 0);
  const sampledPairs = shiftsPx.length;
  if (!sampledPairs || meanShiftPx >= 10) return { meanShiftPx, maxShiftPx, sampledPairs, status: "poor", rationale: sampledPairs ? "Sustained estimated global field movement may compromise one-field trajectory interpretation; reacquire with stable stage positioning." : "Field stability could not be estimated from the sampled frames." };
  if (meanShiftPx >= 4 || maxShiftPx >= 35) return { meanShiftPx, maxShiftPx, sampledPairs, status: "review", rationale: "Estimated global field movement warrants a stage-stability and focal-plane review before interpreting one-field trajectories." };
  return { meanShiftPx, maxShiftPx, sampledPairs, status: "acceptable", rationale: "Reduced luminance-grid comparisons indicated limited global field movement across sampled frames." };
}
