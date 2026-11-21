import { describe, expect, it } from "vitest";
import { buildLaboratoryHandoffCsv, buildLaboratoryHandoffText } from "../shared/labHandoff";

const record = { id: 42, sampleName: "Bovine field A", species: "Bovine", source: "camera", videoFileName: "capture.webm", status: "review_required" as const, createdAt: new Date("2026-08-22T12:00:00.000Z") };
const details = {
  metrics: { motility: 72.4, progressiveMotility: 55.1, vcl: 108.8 },
  calibration: { micronsPerPixel: 0.4, frameRate: 50 },
  thresholds: {} as never,
  flags: ["Confirm calibration."],
  specimenContext: { specimenId: "EJ-42", donorId: "BULL-9", collectionReference: "LOT-7", collectionDateTime: "2026-08-22T11:30", chamberReference: "CH-3", preparationProtocolReference: "SOP-17", analystNote: "Prepared at 37 C." },
  opticsTraceability: { objectiveMagnification: "20×", chamberDepthMicrons: 20 },
  footageProvenance: { source: "camera" as const, container: "WebM", byteSize: 1_572_864, captureDeviceLabel: "Microscope USB camera", capturedAt: "2026-08-23T12:34:56.000Z", captureFrameWidth: 1280, captureFrameHeight: 720, recorderMimeType: "video/webm;codecs=vp8,opus", requestedDurationSeconds: 5, actualDurationSeconds: 4.8, recordingStopReason: "operator" },
  partialCameraCaptureReviewAcknowledgedAt: "2026-08-23T12:35:00.000Z",
  analysisSessionReference: "LOCAL-20260823T123456Z-0000",
  acquisitionReadiness: { readyCount: 3, reviewCount: 1, pendingCount: 0, items: [] },
  dosePlan: { measuredConcentrationMillionsPerMl: 80, availableVolumeMl: 4, targetSpermMillionsPerDose: 20, totalSpermMillions: 320, theoreticalDoseCount: 16 },
  trajectoryIntegrity: { acceptedTracks: 10, continuityPercent: 98.5, tracksWithoutGaps: 9, tracksWithGaps: 1, windowSpanningPercent: 80, boundaryPointPercent: 2, attentionItems: ["1 gap-spanning link"], summaryLine: "98.5% nominal links · 9/10 tracks without observed gaps", safeguard: "Technical trajectory-integrity context only; it does not establish tracking accuracy, alter kinematics, or infer biological outcomes." },
};

describe("laboratory handoff exports", () => {
  it("creates a human-readable handoff with traceability and a review safeguard", () => {
    const text = buildLaboratoryHandoffText(record, details);
    expect(text).toContain("Specimen ID: EJ-42");
    expect(text).toContain("Collection time (operator-entered): 2026-08-22T11:30");
    expect(text).toContain("Preparation protocol reference: SOP-17");
    expect(text).toContain("Objective magnification (operator-entered): 20×");
    expect(text).toContain("Footage container: WebM");
    expect(text).toContain("Capture device label: Microscope USB camera");
    expect(text).toContain("Camera capture time:");
    expect(text).toContain("Requested camera clip duration: 5 s");
    expect(text).toContain("Actual local camera recording duration: 4.8 s");
    expect(text).toContain("Camera recording stop reason: operator stopped");
    expect(text).toContain("Partial camera capture technical-review acknowledgement: 2026-08-23T12:35:00.000Z");
    expect(text).toContain("Camera recorder MIME format: video/webm;codecs=vp8,opus");
    expect(text).toContain("Camera capture frame: 1280 × 720 px");
    expect(text).toContain("Browser-local analysis session reference: LOCAL-20260823T123456Z-0000");
    expect(text).toContain("Planning-only theoretical doses: 16");
    expect(text).toContain("Trajectory integrity: 98.5% nominal links");
    expect(text).toContain("Trajectory integrity attention: 1 gap-spanning link");
    expect(text).toContain("Trajectory integrity safeguard: Technical trajectory-integrity context only");
    expect(text).toContain("require laboratory review");
  });

  it("creates a quoted CSV row that preserves result, method, and review fields", () => {
    const csv = buildLaboratoryHandoffCsv(record, details);
    expect(csv).toContain("record_id,saved_at_utc,review_status");
    expect(csv).toContain('"EJ-42"');
    expect(csv).toContain('"SOP-17"');
    expect(csv).toContain('"20"');
    expect(csv).toContain('"1.5 MB"');
    expect(csv).toContain('"Microscope USB camera"');
    expect(csv).toContain("camera_capture_time");
    expect(csv).toContain('"2026-08-23T12:34:56.000Z"');
    expect(csv).toContain('"5 s"');
    expect(csv).toContain("actual_local_camera_recording_duration");
    expect(csv).toContain('"4.8 s"');
    expect(csv).toContain("camera_recording_stop_reason");
    expect(csv).toContain("partial_camera_capture_technical_review_acknowledged_at");
    expect(csv).toContain('"2026-08-23T12:35:00.000Z"');
    expect(csv).toContain('"operator stopped"');
    expect(csv).toContain("camera_recorder_mime_format");
    expect(csv).toContain('"video/webm;codecs=vp8,opus"');
    expect(csv).toContain("camera_capture_frame");
    expect(csv).toContain('"1280 × 720 px"');
    expect(csv).toContain('"LOCAL-20260823T123456Z-0000"');
    expect(csv).toContain('"manual-unverified"');
    expect(csv).toContain("trajectory_integrity_summary");
    expect(csv).toContain('"98.5% nominal links · 9/10 tracks without observed gaps"');
    expect(csv).toContain("trajectory_integrity_attention_items");
    expect(csv).toContain('"1 gap-spanning link"');
    expect(csv).toContain("trajectory_integrity_safeguard");
    expect(csv).toContain('"Confirm calibration."');
  });
});
