export type TechnicalReviewWindow = { startFrame: number; startTimeSeconds: number; endFrame?: number; endTimeSeconds?: number };

export function createTechnicalReviewWindowStart(input: { timeSeconds: number; frameRate: number }) {
  const frameRate = Math.max(1, Number.isFinite(input.frameRate) ? input.frameRate : 1);
  const startFrame = Math.max(0, Math.round((Number.isFinite(input.timeSeconds) ? input.timeSeconds : 0) * frameRate));
  return { startFrame, startTimeSeconds: startFrame / frameRate } satisfies TechnicalReviewWindow;
}

export function addTechnicalReviewWindowEnd(window: TechnicalReviewWindow, input: { timeSeconds: number; frameRate: number }) {
  const frameRate = Math.max(1, Number.isFinite(input.frameRate) ? input.frameRate : 1);
  const endFrame = Math.max(0, Math.round((Number.isFinite(input.timeSeconds) ? input.timeSeconds : 0) * frameRate));
  if (endFrame <= window.startFrame) return undefined;
  return { ...window, endFrame, endTimeSeconds: endFrame / frameRate } satisfies TechnicalReviewWindow;
}

export function formatTechnicalReviewWindow(window: TechnicalReviewWindow) {
  const start = `frame ${window.startFrame} · ${window.startTimeSeconds.toFixed(3)} s`;
  if (window.endFrame === undefined || window.endTimeSeconds === undefined) return `Start ${start}; select a later end frame.`;
  return `${start} to frame ${window.endFrame} · ${window.endTimeSeconds.toFixed(3)} s`;
}

export function getTechnicalReviewWindowBoundary(window: TechnicalReviewWindow, boundary: "start" | "end") {
  if (boundary === "end" && window.endFrame !== undefined && window.endTimeSeconds !== undefined) return { frame: window.endFrame, timeSeconds: window.endTimeSeconds };
  return { frame: window.startFrame, timeSeconds: window.startTimeSeconds };
}

export function shouldRestartTechnicalReviewWindow(window: TechnicalReviewWindow, currentTimeSeconds: number) {
  return window.endTimeSeconds !== undefined && Number.isFinite(currentTimeSeconds) && currentTimeSeconds >= window.endTimeSeconds;
}
