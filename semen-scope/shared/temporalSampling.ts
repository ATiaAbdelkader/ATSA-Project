export type TemporalSamplingEvidence = {
  availableFrames: number;
  processedFrames: number;
  skippedFrames: number;
  frameStep: number;
  samplingIntervalSeconds: number;
  processedPercent: number;
  rationale: string;
};

export function buildTemporalSamplingEvidence({
  availableFrames,
  processedFrames,
  frameStep,
  frameRate,
}: {
  availableFrames: number;
  processedFrames: number;
  frameStep: number;
  frameRate: number;
}): TemporalSamplingEvidence {
  const total = Math.max(0, Math.round(availableFrames));
  const processed = Math.min(total, Math.max(0, Math.round(processedFrames)));
  const step = Math.max(1, Math.round(frameStep));
  const safeFrameRate = Number.isFinite(frameRate) && frameRate > 0 ? frameRate : 1;
  const skippedFrames = Math.max(0, total - processed);
  const processedPercent = total ? (processed / total) * 100 : 0;
  const samplingIntervalSeconds = step / safeFrameRate;
  const rationale = step === 1
    ? "Every available frame was processed in the browser-local review path."
    : `Every ${step}th estimated video frame was processed; intervening frames were not transformed or added to trajectories.`;
  return { availableFrames: total, processedFrames: processed, skippedFrames, frameStep: step, samplingIntervalSeconds, processedPercent, rationale };
}
