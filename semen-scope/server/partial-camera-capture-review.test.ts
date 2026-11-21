import { describe, expect, it } from "vitest";
import { requiresPartialCameraCaptureAcknowledgement } from "@shared/partialCameraCaptureReview";

describe("partial local camera capture acknowledgement", () => {
  it("requires an acknowledgement only for an unreviewed camera clip retained after stream termination", () => {
    expect(requiresPartialCameraCaptureAcknowledgement({ source: "camera", container: "WebM", recordingStopReason: "stream_ended" }, false)).toBe(true);
    expect(requiresPartialCameraCaptureAcknowledgement({ source: "camera", container: "WebM", recordingStopReason: "stream_ended" }, true, "SS-BOV-A", "SS-BOV-A")).toBe(false);
    expect(requiresPartialCameraCaptureAcknowledgement({ source: "camera", container: "WebM", recordingStopReason: "stream_ended" }, true, "SS-BOV-A", "SS-BOV-B")).toBe(true);
    expect(requiresPartialCameraCaptureAcknowledgement({ source: "camera", container: "WebM", recordingStopReason: "requested_duration" }, false)).toBe(false);
    expect(requiresPartialCameraCaptureAcknowledgement({ source: "upload", container: "MP4" }, false)).toBe(false);
  });
});
