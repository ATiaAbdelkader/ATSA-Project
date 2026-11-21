export type CameraDeviceDescriptor = {
  deviceId: string;
  groupId?: string;
  kind: string;
  label: string;
};

export type CameraDeviceOption = {
  deviceId: string;
  label: string;
};

export function buildCameraDeviceOptions(devices: CameraDeviceDescriptor[]): CameraDeviceOption[] {
  return devices
    .filter(device => device.kind === "videoinput" && Boolean(device.deviceId))
    .map((device, index) => ({ deviceId: device.deviceId, label: device.label.trim() || `Camera ${index + 1}` }));
}
