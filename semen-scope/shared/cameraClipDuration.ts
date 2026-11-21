export const CAMERA_CLIP_DURATIONS_SECONDS = [2, 5, 10] as const;

export type CameraClipDurationSeconds = typeof CAMERA_CLIP_DURATIONS_SECONDS[number];

export function normalizeCameraClipDuration(value: number): CameraClipDurationSeconds {
  return CAMERA_CLIP_DURATIONS_SECONDS.includes(value as CameraClipDurationSeconds) ? value as CameraClipDurationSeconds : CAMERA_CLIP_DURATIONS_SECONDS[0];
}

export function describeCameraClipDuration(value: number) {
  const seconds = normalizeCameraClipDuration(value);
  return `${seconds} s clip`;
}

export function getRemainingCameraClipSeconds(startedAtMs: number, durationSeconds: number, nowMs: number) {
  return Math.max(0, Math.ceil((startedAtMs + normalizeCameraClipDuration(durationSeconds) * 1_000 - nowMs) / 1_000));
}
