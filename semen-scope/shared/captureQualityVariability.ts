import type { FrameQualitySample } from "./imageQuality";

export type CaptureQualityVariability = {
  sampledFrames: number;
  brightnessStandardDeviation: number;
  contrastStandardDeviation: number;
  focusStandardDeviation: number;
  brightnessRange: number;
  contrastRange: number;
  focusRange: number;
  rationale: string;
};

function standardDeviation(values: number[]) {
  if (!values.length) return 0;
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.sqrt(values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length);
}

function range(values: number[]) {
  return values.length ? Math.max(...values) - Math.min(...values) : 0;
}

/** Summarizes dispersion of already-measured sampled frame quality without changing frame treatment. */
export function buildCaptureQualityVariability(samples: FrameQualitySample[]): CaptureQualityVariability {
  const brightness = samples.map(sample => sample.brightness);
  const contrast = samples.map(sample => sample.contrast);
  const focus = samples.map(sample => sample.focus);
  const sampledFrames = samples.length;
  const brightnessStandardDeviation = standardDeviation(brightness);
  const contrastStandardDeviation = standardDeviation(contrast);
  const focusStandardDeviation = standardDeviation(focus);
  const brightnessRange = range(brightness);
  const contrastRange = range(contrast);
  const focusRange = range(focus);
  const rationale = sampledFrames
    ? `Dispersion is calculated from ${sampledFrames} already-measured browser-local sampled frames: brightness SD ${brightnessStandardDeviation.toFixed(2)}, contrast SD ${contrastStandardDeviation.toFixed(2)}, and focus SD ${focusStandardDeviation.toFixed(2)}. This is technical frame-quality context only and does not modify frames, candidates, trajectories, metrics, classifications, or biological interpretation.`
    : "No sampled frame-quality measurements were available for a variability summary.";
  return { sampledFrames, brightnessStandardDeviation, contrastStandardDeviation, focusStandardDeviation, brightnessRange, contrastRange, focusRange, rationale };
}
