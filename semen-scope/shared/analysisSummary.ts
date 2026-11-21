import {
  formatActualCaptureDuration,
  formatActivePreviewFrameRate,
  formatActivePreviewResizeMode,
  formatCameraRecorderMimeType,
  formatCameraRecordingStopReason,
  formatCaptureDeviceLabel,
  formatCaptureFrameDimensions,
  formatCaptureTimestamp,
  formatFootageByteSize,
  formatRequestedCaptureDuration,
  formatRequestedPreviewProfile,
  formatPreCaptureStabilizationDelay,
  getFootageSourceLabel,
  type FootageProvenance,
} from "./footageProvenance";

/**
 * Builds the technical footage-context line used in browser-local analysis
 * summaries. This is provenance only and does not interpret specimen data.
 */
export function buildFootageProvenanceSummaryLine(footageProvenance: FootageProvenance) {
  const cameraContext = footageProvenance.source === "camera"
    ? ` · capture device ${formatCaptureDeviceLabel(footageProvenance.captureDeviceLabel)} · captured ${formatCaptureTimestamp(footageProvenance.capturedAt)} · capture frame ${formatCaptureFrameDimensions(footageProvenance.captureFrameWidth, footageProvenance.captureFrameHeight)} · requested preview ${formatRequestedPreviewProfile(footageProvenance.requestedPreviewProfile)} · active preview rate ${formatActivePreviewFrameRate(footageProvenance.activePreviewFrameRate)} · active resize mode ${formatActivePreviewResizeMode(footageProvenance.activePreviewResizeMode)} · pre-capture stabilization ${formatPreCaptureStabilizationDelay(footageProvenance.preCaptureStabilizationDelaySeconds)} · recorder format ${formatCameraRecorderMimeType(footageProvenance.recorderMimeType)} · requested clip ${formatRequestedCaptureDuration(footageProvenance.requestedDurationSeconds)} · actual local recording ${formatActualCaptureDuration(footageProvenance.actualDurationSeconds)} · recording stopped ${formatCameraRecordingStopReason(footageProvenance.recordingStopReason)}`
    : "";

  return `Footage provenance: ${getFootageSourceLabel(footageProvenance.source)} · ${footageProvenance.container} · ${formatFootageByteSize(footageProvenance.byteSize)}${cameraContext}`;
}
