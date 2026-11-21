export type DetectorConfigurationEvidence = {
  workingCanvasWidth: number;
  workingCanvasHeight: number;
  detectionSensitivity: number;
  samplingStridePx: number;
  darknessThreshold: number;
  contrastThreshold: number;
  candidateLimitPerFrame: number;
  rationale: string;
};

/** Captures the existing browser-local detector configuration without changing its candidate decisions. */
export function buildDetectorConfigurationEvidence({ workingCanvasWidth, workingCanvasHeight, detectionSensitivity, candidateLimitPerFrame = 360 }: { workingCanvasWidth: number; workingCanvasHeight: number; detectionSensitivity: number; candidateLimitPerFrame?: number }): DetectorConfigurationEvidence {
  const width = Math.max(0, Math.round(Number.isFinite(workingCanvasWidth) ? workingCanvasWidth : 0));
  const height = Math.max(0, Math.round(Number.isFinite(workingCanvasHeight) ? workingCanvasHeight : 0));
  const sensitivity = Math.max(0, Number.isFinite(detectionSensitivity) ? detectionSensitivity : 0);
  const samplingStridePx = Math.max(4, Math.floor(Math.min(width, height) / 130));
  const darknessThreshold = Math.max(38, 108 - sensitivity * 1.45);
  const contrastThreshold = Math.max(7, sensitivity * 0.22);
  const candidateLimit = Math.max(1, Math.round(Number.isFinite(candidateLimitPerFrame) ? candidateLimitPerFrame : 360));
  const rationale = width && height
    ? `The browser-local candidate detector used a ${samplingStridePx}px sampling stride on a ${width}×${height} working canvas, darkness threshold ${darknessThreshold.toFixed(2)}, contrast threshold ${contrastThreshold.toFixed(2)}, and selection cap ${candidateLimit} per sampled frame. This is configuration provenance only and does not change detection, candidates, trajectories, metrics, classifications, or biological interpretation.`
    : "Detector configuration details were unavailable because the working canvas dimensions were not available.";
  return { workingCanvasWidth: width, workingCanvasHeight: height, detectionSensitivity: sensitivity, samplingStridePx, darknessThreshold, contrastThreshold, candidateLimitPerFrame: candidateLimit, rationale };
}
