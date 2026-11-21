import { describe, expect, it } from "vitest";
import { buildFootageProvenanceSummaryLine } from "@shared/analysisSummary";
import { formatCaptureTimestamp } from "@shared/footageProvenance";

describe("browser-local analysis summary provenance", () => {
  it("includes read-only camera device, capture time, and requested-duration context for camera-origin footage", () => {
    const capturedAt = "2026-08-23T12:34:56.000Z";

    const line = buildFootageProvenanceSummaryLine({
      source: "camera",
      container: "WebM",
      byteSize: 1_536,
      captureDeviceLabel: "Active microscope stream",
      capturedAt,
      requestedDurationSeconds: 5,
      actualDurationSeconds: 1.2,
      recordingStopReason: "operator",
      recorderMimeType: "video/webm;codecs=vp8,opus",
      captureFrameWidth: 1280,
      captureFrameHeight: 720,
    });

    expect(line).toContain("Footage provenance: Local camera capture · WebM · 1.5 KB");
    expect(line).toContain("capture device Active microscope stream");
    expect(line).toContain(`captured ${formatCaptureTimestamp(capturedAt)}`);
    expect(line).toContain("requested clip 5 s");
    expect(line).toContain("actual local recording 1.2 s");
    expect(line).toContain("recording stopped operator stopped");
    expect(line).toContain("recorder format video/webm;codecs=vp8,opus");
    expect(line).toContain("capture frame 1280 × 720 px");
  });
});
