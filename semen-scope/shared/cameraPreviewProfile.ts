export const CAMERA_PREVIEW_PROFILES = [
  { id: "native", label: "Camera native", detail: "Use the camera’s browser-selected default resolution." },
  { id: "detail", label: "Detail 1280 × 720", detail: "Request a 1280 × 720 preview where the camera supports it." },
  { id: "compat", label: "Compatibility 640 × 480", detail: "Request a 640 × 480 preview where the camera supports it." },
] as const;

export type CameraPreviewProfileId = (typeof CAMERA_PREVIEW_PROFILES)[number]["id"];

export function buildCameraPreviewConstraints(deviceId: string, profileId: CameraPreviewProfileId): boolean | MediaTrackConstraints {
  const device = deviceId ? { deviceId: { exact: deviceId } } : {};
  if (profileId === "native") return deviceId ? device : true;
  const dimensions = profileId === "detail" ? { width: { ideal: 1280 }, height: { ideal: 720 } } : { width: { ideal: 640 }, height: { ideal: 480 } };
  return { ...device, ...dimensions };
}
