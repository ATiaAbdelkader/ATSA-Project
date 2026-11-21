export const CAMERA_PREVIEW_ORIENTATIONS = [
  { id: "normal", label: "Normal display", detail: "Show the browser camera preview without a display transform." },
  { id: "mirrored", label: "Mirror display", detail: "Flip only the on-screen preview horizontally for operator setup." },
] as const;

export type CameraPreviewOrientationId = (typeof CAMERA_PREVIEW_ORIENTATIONS)[number]["id"];

/** Returns a presentation class only; recording, calibration capture, and analysis retain source pixels. */
export function getCameraPreviewOrientationClass(orientation: CameraPreviewOrientationId) {
  return orientation === "mirrored" ? "camera-preview-mirrored" : "";
}
