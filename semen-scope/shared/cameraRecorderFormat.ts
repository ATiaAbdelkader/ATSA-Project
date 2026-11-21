export const PREFERRED_CAMERA_RECORDER_MIME_TYPES = [
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
] as const;

/** Returns a browser-supported local recording format, or lets MediaRecorder choose its own default. */
export function selectCameraRecorderMimeType(isTypeSupported?: (mimeType: string) => boolean) {
  if (!isTypeSupported) return undefined;
  return PREFERRED_CAMERA_RECORDER_MIME_TYPES.find(mimeType => isTypeSupported(mimeType));
}
