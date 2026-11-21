export const CAMERA_PRE_CAPTURE_DELAYS_SECONDS = [0, 3, 5] as const;

export function normalizeCameraPreCaptureDelay(value: number) {
  return CAMERA_PRE_CAPTURE_DELAYS_SECONDS.includes(value as (typeof CAMERA_PRE_CAPTURE_DELAYS_SECONDS)[number]) ? value : 0;
}

export function describeCameraPreCaptureDelay(value: number) {
  const seconds = normalizeCameraPreCaptureDelay(value);
  return seconds ? `${seconds} s stabilization delay` : "Start recording immediately";
}

export function getPreCaptureDelayRemainingSeconds(deadlineMs: number, nowMs: number) {
  return Math.max(0, Math.ceil((deadlineMs - nowMs) / 1_000));
}
