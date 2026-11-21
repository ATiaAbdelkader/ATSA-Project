export function resolveReviewFrameStep(input: { currentTimeSeconds: number; durationSeconds: number; frameRate: number; direction: -1 | 1 }) {
  const frameRate = Math.max(1, Number.isFinite(input.frameRate) ? input.frameRate : 1);
  const durationSeconds = Math.max(0, Number.isFinite(input.durationSeconds) ? input.durationSeconds : 0);
  const maxFrame = Math.max(0, Math.floor(Math.max(0, durationSeconds - Number.EPSILON) * frameRate));
  const currentFrame = Math.min(maxFrame, Math.max(0, Math.round((Number.isFinite(input.currentTimeSeconds) ? input.currentTimeSeconds : 0) * frameRate)));
  const frame = Math.min(maxFrame, Math.max(0, currentFrame + input.direction));
  return { frame, timeSeconds: frame / frameRate };
}

/** Resolves an operator-entered review timestamp to the nearest configured frame within local-video bounds. */
export function resolveReviewTimestampSeek(input: { requestedTimeSeconds: number; durationSeconds: number; frameRate: number }) {
  const frameRate = Math.max(1, Number.isFinite(input.frameRate) ? input.frameRate : 1);
  const durationSeconds = Math.max(0, Number.isFinite(input.durationSeconds) ? input.durationSeconds : 0);
  const maxFrame = Math.max(0, Math.floor(Math.max(0, durationSeconds - Number.EPSILON) * frameRate));
  const frame = Math.min(maxFrame, Math.max(0, Math.round((Number.isFinite(input.requestedTimeSeconds) ? input.requestedTimeSeconds : 0) * frameRate)));
  return { frame, timeSeconds: frame / frameRate };
}
