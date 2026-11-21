export type AnalysisScalingEvidence = {
  sourceWidth: number;
  sourceHeight: number;
  workingCanvasWidth: number;
  workingCanvasHeight: number;
  sourcePixelsPerWorkingPixelX: number;
  sourcePixelsPerWorkingPixelY: number;
  wasDownscaled: boolean;
  rationale: string;
};

/** Records the existing canvas working resolution used by browser-local analysis without changing frames. */
export function buildAnalysisScalingEvidence({ sourceWidth, sourceHeight, workingCanvasWidth, workingCanvasHeight }: Omit<AnalysisScalingEvidence, "sourcePixelsPerWorkingPixelX" | "sourcePixelsPerWorkingPixelY" | "wasDownscaled" | "rationale">): AnalysisScalingEvidence {
  const sourceW = Math.max(0, Math.round(Number.isFinite(sourceWidth) ? sourceWidth : 0));
  const sourceH = Math.max(0, Math.round(Number.isFinite(sourceHeight) ? sourceHeight : 0));
  const workingW = Math.max(0, Math.round(Number.isFinite(workingCanvasWidth) ? workingCanvasWidth : 0));
  const workingH = Math.max(0, Math.round(Number.isFinite(workingCanvasHeight) ? workingCanvasHeight : 0));
  const sourcePixelsPerWorkingPixelX = workingW ? sourceW / workingW : 0;
  const sourcePixelsPerWorkingPixelY = workingH ? sourceH / workingH : 0;
  const wasDownscaled = workingW < sourceW || workingH < sourceH;
  const rationale = sourceW && sourceH && workingW && workingH
    ? `The ${sourceW}×${sourceH} source was reviewed through a ${workingW}×${workingH} browser-local canvas (${sourcePixelsPerWorkingPixelX.toFixed(3)}× horizontal and ${sourcePixelsPerWorkingPixelY.toFixed(3)}× vertical source pixels per working pixel). This is technical execution provenance only and does not modify source frames, candidates, trajectories, metrics, classifications, or biological interpretation.`
    : "Canvas scaling details were unavailable for this browser-local review.";
  return { sourceWidth: sourceW, sourceHeight: sourceH, workingCanvasWidth: workingW, workingCanvasHeight: workingH, sourcePixelsPerWorkingPixelX, sourcePixelsPerWorkingPixelY, wasDownscaled, rationale };
}
