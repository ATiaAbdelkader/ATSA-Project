import { resolveCameraCaptureFrameDimensions } from "@shared/cameraCaptureFrame";
import { CAMERA_PREVIEW_PROFILES, type CameraPreviewProfileId } from "@shared/cameraPreviewProfile";

export interface CameraPreviewResolutionEvidenceInput {
  profileId: CameraPreviewProfileId;
  previewWidth?: number;
  previewHeight?: number;
  trackWidth?: number;
  trackHeight?: number;
  trackFrameRate?: number;
  trackResizeMode?: string;
}

export interface CameraPreviewResolutionEvidence {
  requestedLabel: string;
  actualLabel: string;
  actualWidth?: number;
  actualHeight?: number;
  actualFrameRate?: number;
  actualFrameRateLabel: string;
  actualResizeModeLabel: string;
  safeguard: string;
}

/** Keeps the browser-reported actual stream dimensions separate from advisory request constraints. */
export function buildCameraPreviewResolutionEvidence(input: CameraPreviewResolutionEvidenceInput): CameraPreviewResolutionEvidence {
  const requested = CAMERA_PREVIEW_PROFILES.find(profile => profile.id === input.profileId) ?? CAMERA_PREVIEW_PROFILES[0];
  const actual = resolveCameraCaptureFrameDimensions(input);
  const actualLabel = actual.width && actual.height ? `${actual.width} × ${actual.height}` : "Not exposed by this browser";
  const actualFrameRateLabel = Number.isFinite(input.trackFrameRate) && input.trackFrameRate! > 0 ? `${Math.round(input.trackFrameRate! * 10) / 10} fps` : "Not exposed by this browser";
  const actualResizeModeLabel = input.trackResizeMode === "crop-and-scale" ? "Crop and scale" : input.trackResizeMode === "none" ? "No resizing reported" : "Not exposed by this browser";
  return {
    requestedLabel: requested.label,
    actualLabel,
    actualWidth: actual.width,
    actualHeight: actual.height,
    actualFrameRate: Number.isFinite(input.trackFrameRate) && input.trackFrameRate! > 0 ? input.trackFrameRate : undefined,
    actualFrameRateLabel,
    actualResizeModeLabel,
    safeguard: "Requested resolution is advisory. Browser-reported stream settings are shown for technical review only; confirm calibration and configured analysis rate after a camera or resolution change.",
  };
}
