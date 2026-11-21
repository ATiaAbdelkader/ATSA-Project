export interface CameraCaptureFrameCandidate {
  previewWidth?: number;
  previewHeight?: number;
  trackWidth?: number;
  trackHeight?: number;
}

function hasValidFrame(width?: number, height?: number) {
  return Number.isFinite(width) && Number.isFinite(height) && Boolean(width && height && width > 0 && height > 0);
}

/** Selects preview dimensions when available, with active-track settings as a browser-local fallback. */
export function resolveCameraCaptureFrameDimensions(candidate: CameraCaptureFrameCandidate) {
  if (hasValidFrame(candidate.previewWidth, candidate.previewHeight)) {
    return { width: Math.round(candidate.previewWidth!), height: Math.round(candidate.previewHeight!) };
  }
  if (hasValidFrame(candidate.trackWidth, candidate.trackHeight)) {
    return { width: Math.round(candidate.trackWidth!), height: Math.round(candidate.trackHeight!) };
  }
  return { width: undefined, height: undefined };
}
