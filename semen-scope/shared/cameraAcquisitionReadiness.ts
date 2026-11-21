export type CameraReadinessStatus = "ready" | "review";

export interface CameraAcquisitionReadinessInput {
  previewActive: boolean;
  actualResolutionAvailable: boolean;
  actualFrameRateAvailable: boolean;
  frameRateNeedsReview: boolean;
  calibrationBoardReferenced: boolean;
}

export interface CameraAcquisitionReadinessItem {
  id: "preview" | "stream-settings" | "frame-rate" | "calibration";
  label: string;
  detail: string;
  status: CameraReadinessStatus;
}

export function buildCameraAcquisitionReadiness(input: CameraAcquisitionReadinessInput) {
  const items: CameraAcquisitionReadinessItem[] = [
    { id: "preview", label: "Camera preview", status: input.previewActive ? "ready" : "review", detail: input.previewActive ? "Browser-local preview is active." : "Start a browser-local preview before capture." },
    { id: "stream-settings", label: "Stream settings", status: input.actualResolutionAvailable && input.actualFrameRateAvailable ? "ready" : "review", detail: input.actualResolutionAvailable && input.actualFrameRateAvailable ? "Browser-reported dimensions and frame rate are available." : "One or more browser-reported stream settings are unavailable." },
    { id: "frame-rate", label: "Frame-rate method", status: input.frameRateNeedsReview ? "review" : "ready", detail: input.frameRateNeedsReview ? "Reported camera rate differs from the configured analysis rate; confirm the method manually." : "No material reported-versus-configured frame-rate difference is present." },
    { id: "calibration", label: "Calibration evidence", status: input.calibrationBoardReferenced ? "ready" : "review", detail: input.calibrationBoardReferenced ? "Board-referenced calibration is attached to the active method." : "Confirm the active manual calibration after camera or resolution changes." },
  ];
  const reviewCount = items.filter(item => item.status === "review").length;
  return { items, reviewCount, summary: reviewCount ? `${reviewCount} setup item${reviewCount === 1 ? " needs" : "s need"} technical review` : "Camera acquisition context is ready for technical review" };
}
