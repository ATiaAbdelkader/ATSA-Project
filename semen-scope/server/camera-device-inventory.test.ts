import { describe, expect, it } from "vitest";
import { buildCameraDeviceOptions } from "@shared/cameraDeviceInventory";

describe("camera device inventory", () => {
  it("keeps only local video-input entries and preserves disclosed labels", () => {
    expect(buildCameraDeviceOptions([
      { deviceId: "audio-1", kind: "audioinput", label: "Microphone" },
      { deviceId: "camera-1", kind: "videoinput", label: "Microscope camera" },
      { deviceId: "camera-2", kind: "videoinput", label: "USB camera" },
    ])).toEqual([
      { deviceId: "camera-1", label: "Microscope camera" },
      { deviceId: "camera-2", label: "USB camera" },
    ]);
  });

  it("provides stable generic labels when the browser withholds device names before permission", () => {
    expect(buildCameraDeviceOptions([{ deviceId: "camera-1", kind: "videoinput", label: "" }])).toEqual([{ deviceId: "camera-1", label: "Camera 1" }]);
  });
});
