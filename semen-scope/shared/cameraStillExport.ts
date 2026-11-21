export const CAMERA_STILL_EXPORT_NOTICE = "Downloads the captured browser-local microscope still for technical review only. The image is not stored by SemenScope and does not change calibration or analysis results.";

function safeSegment(value: string) {
  return value.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "microscope-still";
}

export function buildCameraStillPngFilename(sampleName: string, capturedAt?: string) {
  const timestamp = capturedAt && !Number.isNaN(Date.parse(capturedAt)) ? capturedAt.replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z") : "local";
  return `${safeSegment(sampleName)}-microscope-still-${timestamp}.png`;
}
