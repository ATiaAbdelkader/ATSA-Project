export type ProcessingPerformanceEvidence = {
  elapsedMilliseconds: number;
  processedFrames: number;
  meanMillisecondsPerFrame: number;
  processedFramesPerSecond: number;
  rationale: string;
};

/** Summarizes browser-local review-loop timing without affecting video sampling or analysis output. */
export function buildProcessingPerformanceEvidence({ elapsedMilliseconds, processedFrames }: { elapsedMilliseconds: number; processedFrames: number }): ProcessingPerformanceEvidence {
  const elapsed = Math.max(0, Number.isFinite(elapsedMilliseconds) ? elapsedMilliseconds : 0);
  const frames = Math.max(0, Math.round(Number.isFinite(processedFrames) ? processedFrames : 0));
  const meanMillisecondsPerFrame = frames ? elapsed / frames : 0;
  const processedFramesPerSecond = elapsed > 0 ? (frames * 1_000) / elapsed : 0;
  const rationale = frames
    ? `${frames} sampled frames completed through the browser-local review loop in ${elapsed.toFixed(0)} ms. This is local execution timing context only; it does not change sampling, candidates, trajectories, metrics, classifications, or biological interpretation.`
    : "No sampled frames were available for browser-local execution timing context.";
  return { elapsedMilliseconds: elapsed, processedFrames: frames, meanMillisecondsPerFrame, processedFramesPerSecond, rationale };
}
