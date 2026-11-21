export type FootageSource = "reference" | "upload" | "camera";
export type CameraRecordingStopReason = "operator" | "requested_duration" | "stream_ended";

export type FootageProvenance = {
  source: FootageSource;
  container: string;
  byteSize?: number;
  captureDeviceLabel?: string;
  capturedAt?: string;
  requestedDurationSeconds?: number;
  actualDurationSeconds?: number;
  recordingStopReason?: CameraRecordingStopReason;
  recorderMimeType?: string;
  captureFrameWidth?: number;
  captureFrameHeight?: number;
  requestedPreviewProfile?: string;
  activePreviewFrameRate?: number;
  activePreviewResizeMode?: string;
  preCaptureStabilizationDelaySeconds?: number;
};

export function inferFootageContainer(mimeType: string | undefined, fileName: string) {
  const normalizedMime = mimeType?.toLowerCase() ?? "";
  const normalizedName = fileName.toLowerCase();
  if (normalizedMime.includes("mp4") || normalizedName.endsWith(".mp4")) return "MP4";
  if (normalizedMime.includes("webm") || normalizedName.endsWith(".webm")) return "WebM";
  return "Unspecified container";
}

export function formatFootageByteSize(byteSize: number | undefined) {
  if (!Number.isFinite(byteSize) || !byteSize || byteSize < 0) return "Not available";
  if (byteSize < 1_024) return `${Math.round(byteSize)} B`;
  if (byteSize < 1_024 * 1_024) return `${(byteSize / 1_024).toFixed(1)} KB`;
  return `${(byteSize / (1_024 * 1_024)).toFixed(1)} MB`;
}

export function getFootageSourceLabel(source: FootageSource) {
  return source === "reference" ? "Bundled reference" : source === "camera" ? "Local camera capture" : "Local file upload";
}

export function formatCaptureDeviceLabel(value?: string) {
  return value?.trim() || "not recorded";
}

export function formatCaptureTimestamp(value?: string) {
  if (!value || Number.isNaN(Date.parse(value))) return "not recorded";
  return new Date(value).toLocaleString();
}

export function formatRequestedCaptureDuration(value?: number) {
  return Number.isFinite(value) && value && value > 0 ? `${Math.round(value)} s` : "not recorded";
}

export function formatActualCaptureDuration(value?: number) {
  if (!Number.isFinite(value) || !value || value <= 0) return "not recorded";
  const rounded = Math.round(value * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)} s`;
}

export function formatCameraRecordingStopReason(value?: CameraRecordingStopReason) {
  if (value === "operator") return "operator stopped";
  if (value === "requested_duration") return "requested duration reached";
  if (value === "stream_ended") return "active camera stream ended";
  return "not recorded";
}

export function formatCameraRecorderMimeType(value?: string) {
  return value?.trim() || "not recorded";
}

export function formatCaptureFrameDimensions(width?: number, height?: number) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || !width || !height || width <= 0 || height <= 0) return "not recorded";
  return `${Math.round(width)} × ${Math.round(height)} px`;
}

export function formatRequestedPreviewProfile(value?: string) {
  return value?.trim() || "not recorded";
}

export function formatActivePreviewFrameRate(value?: number) {
  if (!Number.isFinite(value) || !value || value <= 0) return "not recorded";
  const rounded = Math.round(value * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)} fps`;
}

export function formatActivePreviewResizeMode(value?: string) {
  if (value === "crop-and-scale") return "crop and scale";
  if (value === "none") return "no resizing reported";
  return "not recorded";
}

export function formatPreCaptureStabilizationDelay(value?: number) {
  if (!Number.isFinite(value) || value === undefined || value < 0) return "not recorded";
  return value > 0 ? `${Math.round(value)} s` : "none";
}
