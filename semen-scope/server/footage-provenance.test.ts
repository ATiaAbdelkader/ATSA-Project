import { describe, expect, it } from "vitest";
import { formatActualCaptureDuration, formatActivePreviewFrameRate, formatActivePreviewResizeMode, formatCameraRecorderMimeType, formatCameraRecordingStopReason, formatCaptureDeviceLabel, formatCaptureFrameDimensions, formatCaptureTimestamp, formatFootageByteSize, formatPreCaptureStabilizationDelay, formatRequestedCaptureDuration, formatRequestedPreviewProfile, getFootageSourceLabel, inferFootageContainer } from "@shared/footageProvenance";

describe("active footage provenance", () => {
  it("identifies the accepted browser video containers from type or file name", () => {
    expect(inferFootageContainer("video/mp4", "field.bin")).toBe("MP4");
    expect(inferFootageContainer("", "capture.webm")).toBe("WebM");
    expect(inferFootageContainer(undefined, "field.avi")).toBe("Unspecified container");
  });

  it("formats local byte-size context and source labels without inferring biological values", () => {
    expect(formatFootageByteSize(950)).toBe("950 B");
    expect(formatFootageByteSize(1_572_864)).toBe("1.5 MB");
    expect(formatFootageByteSize(undefined)).toBe("Not available");
    expect(getFootageSourceLabel("camera")).toBe("Local camera capture");
    expect(formatCaptureDeviceLabel("Microscope USB camera")).toBe("Microscope USB camera");
    expect(formatCaptureDeviceLabel()).toBe("not recorded");
    expect(formatCaptureTimestamp("2026-08-23T12:34:56.000Z")).not.toBe("not recorded");
    expect(formatCaptureTimestamp("not-a-date")).toBe("not recorded");
    expect(formatRequestedCaptureDuration(5)).toBe("5 s");
    expect(formatRequestedCaptureDuration()).toBe("not recorded");
    expect(formatActualCaptureDuration(1.24)).toBe("1.2 s");
    expect(formatActualCaptureDuration()).toBe("not recorded");
    expect(formatCameraRecordingStopReason("operator")).toBe("operator stopped");
    expect(formatCameraRecordingStopReason("requested_duration")).toBe("requested duration reached");
    expect(formatCameraRecordingStopReason("stream_ended")).toBe("active camera stream ended");
    expect(formatCameraRecordingStopReason()).toBe("not recorded");
    expect(formatCameraRecorderMimeType("video/webm;codecs=vp8,opus")).toBe("video/webm;codecs=vp8,opus");
    expect(formatCameraRecorderMimeType()).toBe("not recorded");
    expect(formatCaptureFrameDimensions(1280, 720)).toBe("1280 × 720 px");
    expect(formatCaptureFrameDimensions()).toBe("not recorded");
    expect(formatRequestedPreviewProfile("Detail 1280 × 720")).toBe("Detail 1280 × 720");
    expect(formatRequestedPreviewProfile()).toBe("not recorded");
    expect(formatActivePreviewFrameRate(59.94)).toBe("59.9 fps");
    expect(formatActivePreviewFrameRate()).toBe("not recorded");
    expect(formatActivePreviewResizeMode("crop-and-scale")).toBe("crop and scale");
    expect(formatActivePreviewResizeMode("none")).toBe("no resizing reported");
    expect(formatActivePreviewResizeMode()).toBe("not recorded");
    expect(formatPreCaptureStabilizationDelay(3)).toBe("3 s");
    expect(formatPreCaptureStabilizationDelay(0)).toBe("none");
    expect(formatPreCaptureStabilizationDelay()).toBe("not recorded");
  });
});
