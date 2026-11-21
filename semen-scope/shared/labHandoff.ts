import type { StoredSnapshotDetails } from "./dashboardSnapshot";
import { formatChamberDepthMicrons, formatOpticsMagnification } from "./opticsTraceability";
import { formatActualCaptureDuration, formatActivePreviewFrameRate, formatActivePreviewResizeMode, formatCameraRecorderMimeType, formatCameraRecordingStopReason, formatCaptureDeviceLabel, formatCaptureFrameDimensions, formatCaptureTimestamp, formatFootageByteSize, formatPreCaptureStabilizationDelay, formatRequestedCaptureDuration, formatRequestedPreviewProfile, getFootageSourceLabel } from "./footageProvenance";

export type LabHandoffRecord = {
  id: number;
  sampleName: string;
  species: string;
  source: string;
  videoFileName: string;
  status: "complete" | "review_required";
  createdAt: Date | string;
};

function formatValue(value?: string | number | null) {
  return value === undefined || value === null || value === "" ? "not recorded" : String(value);
}

function csvField(value?: string | number | null) {
  const normalized = formatValue(value).replaceAll('"', '""');
  return `"${normalized}"`;
}

function savedAt(value: Date | string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "not recorded" : date.toISOString();
}

export function buildLaboratoryHandoffText(record: LabHandoffRecord, details: StoredSnapshotDetails) {
  const specimen = details.specimenContext;
  const readiness = details.acquisitionReadiness;
  const plan = details.dosePlan && "theoreticalDoseCount" in details.dosePlan ? details.dosePlan : undefined;
  const provenance = details.calibrationEvidence ? "board-referenced" : "manual-unverified";
  return [
    "SEMENSCOPE — LABORATORY HANDOFF SUMMARY",
    "Automated estimates require laboratory review and are not a diagnostic, fertility, breeding, treatment, or dose-release decision.",
    "",
    `Record: #${record.id}`,
    `Saved (UTC): ${savedAt(record.createdAt)}`,
    `Review status: ${record.status.replace("_", " ")}`,
    `Sample: ${record.sampleName}`,
    `Species: ${record.species}`,
    `Source: ${record.source}`,
    `Specimen ID: ${formatValue(specimen?.specimenId)}`,
    `Donor / animal ID: ${formatValue(specimen?.donorId)}`,
    `Collection reference: ${formatValue(specimen?.collectionReference)}`,
    `Collection time (operator-entered): ${formatValue(specimen?.collectionDateTime)}`,
    `Chamber reference: ${formatValue(specimen?.chamberReference)}`,
    `Preparation protocol reference: ${formatValue(specimen?.preparationProtocolReference)}`,
    `Footage source context: ${details.footageProvenance ? getFootageSourceLabel(details.footageProvenance.source) : "not recorded"}`,
    `Footage container: ${formatValue(details.footageProvenance?.container)}`,
    `Footage local bytes: ${formatFootageByteSize(details.footageProvenance?.byteSize)}`,
    `Capture device label: ${formatCaptureDeviceLabel(details.footageProvenance?.captureDeviceLabel)}`,
    `Camera capture time: ${formatCaptureTimestamp(details.footageProvenance?.capturedAt)}`,
    `Camera capture frame: ${formatCaptureFrameDimensions(details.footageProvenance?.captureFrameWidth, details.footageProvenance?.captureFrameHeight)}`,
    `Requested camera preview profile: ${formatRequestedPreviewProfile(details.footageProvenance?.requestedPreviewProfile)}`,
    `Active camera preview frame rate: ${formatActivePreviewFrameRate(details.footageProvenance?.activePreviewFrameRate)}`,
    `Active camera preview resize mode: ${formatActivePreviewResizeMode(details.footageProvenance?.activePreviewResizeMode)}`,
    `Camera pre-capture stabilization delay: ${formatPreCaptureStabilizationDelay(details.footageProvenance?.preCaptureStabilizationDelaySeconds)}`,
    `Camera recorder MIME format: ${formatCameraRecorderMimeType(details.footageProvenance?.recorderMimeType)}`,
    `Requested camera clip duration: ${formatRequestedCaptureDuration(details.footageProvenance?.requestedDurationSeconds)}`,
    `Actual local camera recording duration: ${formatActualCaptureDuration(details.footageProvenance?.actualDurationSeconds)}`,
    `Camera recording stop reason: ${formatCameraRecordingStopReason(details.footageProvenance?.recordingStopReason)}`,
    `Partial camera capture technical-review acknowledgement: ${formatValue(details.partialCameraCaptureReviewAcknowledgedAt)}`,
    `Browser-local analysis session reference: ${formatValue(details.analysisSessionReference)}`,
    `Objective magnification (operator-entered): ${formatOpticsMagnification(details.opticsTraceability?.objectiveMagnification)}`,
    `Chamber depth (operator-entered): ${formatChamberDepthMicrons(details.opticsTraceability?.chamberDepthMicrons)}`,
    `Calibration provenance: ${provenance}`,
    `Scale: ${details.calibration.micronsPerPixel} µm/px at ${details.calibration.frameRate} fps`,
    `Method fingerprint: ${formatValue(details.methodFingerprint)}`,
    `Trajectory integrity: ${formatValue(details.trajectoryIntegrity?.summaryLine)}`,
    `Trajectory integrity attention: ${details.trajectoryIntegrity?.attentionItems.length ? details.trajectoryIntegrity.attentionItems.join(" · ") : "not recorded"}`,
    `Trajectory integrity safeguard: ${formatValue(details.trajectoryIntegrity?.safeguard)}`,
    `Motility: ${formatValue(details.metrics.motility)} %`,
    `Progressive motility: ${formatValue(details.metrics.progressiveMotility)} %`,
    `VCL: ${formatValue(details.metrics.vcl)} µm/s`,
    `Capture-quality status: ${formatValue(details.captureQuality?.status)}`,
    `Readiness: ${readiness ? `${readiness.readyCount} ready, ${readiness.reviewCount} review, ${readiness.pendingCount} pending` : "not recorded"}`,
    `Planning-only theoretical doses: ${plan ? plan.theoreticalDoseCount : "not recorded"}`,
    "",
    "REVIEW FLAGS",
    ...(details.flags.length ? details.flags.map(flag => `- ${flag}`) : ["- No stored flags."]),
  ].join("\n");
}

export function buildLaboratoryHandoffCsv(record: LabHandoffRecord, details: StoredSnapshotDetails) {
  const specimen = details.specimenContext;
  const readiness = details.acquisitionReadiness;
  const plan = details.dosePlan && "theoreticalDoseCount" in details.dosePlan ? details.dosePlan : undefined;
  const headers = ["record_id", "saved_at_utc", "review_status", "sample_name", "species", "source", "video_file", "specimen_id", "donor_animal_id", "collection_reference", "collection_time_operator_entered", "chamber_reference", "preparation_protocol_reference", "footage_source_context", "footage_container", "footage_local_bytes", "capture_device_label", "camera_capture_time", "camera_capture_frame", "requested_camera_preview_profile", "active_camera_preview_frame_rate", "active_camera_preview_resize_mode", "camera_pre_capture_stabilization_delay", "camera_recorder_mime_format", "requested_camera_clip_duration", "actual_local_camera_recording_duration", "camera_recording_stop_reason", "partial_camera_capture_technical_review_acknowledged_at", "browser_local_analysis_session_reference", "objective_magnification_operator_entered", "chamber_depth_microns_operator_entered", "calibration_provenance", "microns_per_pixel", "frame_rate", "method_fingerprint", "trajectory_integrity_summary", "trajectory_integrity_attention_items", "trajectory_integrity_safeguard", "motility_percent", "progressive_motility_percent", "vcl_microns_per_second", "capture_quality_status", "readiness_ready_count", "readiness_review_count", "readiness_pending_count", "planning_theoretical_doses", "review_flags", "laboratory_review_notice"];
  const values = [
    record.id,
    savedAt(record.createdAt),
    record.status,
    record.sampleName,
    record.species,
    record.source,
    record.videoFileName,
    specimen?.specimenId,
    specimen?.donorId,
    specimen?.collectionReference,
    specimen?.collectionDateTime,
    specimen?.chamberReference,
    specimen?.preparationProtocolReference,
    details.footageProvenance ? getFootageSourceLabel(details.footageProvenance.source) : undefined,
    details.footageProvenance?.container,
    formatFootageByteSize(details.footageProvenance?.byteSize),
    formatCaptureDeviceLabel(details.footageProvenance?.captureDeviceLabel),
    details.footageProvenance?.capturedAt,
    formatCaptureFrameDimensions(details.footageProvenance?.captureFrameWidth, details.footageProvenance?.captureFrameHeight),
    formatRequestedPreviewProfile(details.footageProvenance?.requestedPreviewProfile),
    formatActivePreviewFrameRate(details.footageProvenance?.activePreviewFrameRate),
    formatActivePreviewResizeMode(details.footageProvenance?.activePreviewResizeMode),
    formatPreCaptureStabilizationDelay(details.footageProvenance?.preCaptureStabilizationDelaySeconds),
    formatCameraRecorderMimeType(details.footageProvenance?.recorderMimeType),
    formatRequestedCaptureDuration(details.footageProvenance?.requestedDurationSeconds),
    formatActualCaptureDuration(details.footageProvenance?.actualDurationSeconds),
    formatCameraRecordingStopReason(details.footageProvenance?.recordingStopReason),
    details.partialCameraCaptureReviewAcknowledgedAt,
    details.analysisSessionReference,
    details.opticsTraceability?.objectiveMagnification,
    details.opticsTraceability?.chamberDepthMicrons,
    details.calibrationEvidence ? "board-referenced" : "manual-unverified",
    details.calibration.micronsPerPixel,
    details.calibration.frameRate,
    details.methodFingerprint,
    details.trajectoryIntegrity?.summaryLine,
    details.trajectoryIntegrity?.attentionItems.join(" · "),
    details.trajectoryIntegrity?.safeguard,
    details.metrics.motility,
    details.metrics.progressiveMotility,
    details.metrics.vcl,
    details.captureQuality?.status,
    readiness?.readyCount,
    readiness?.reviewCount,
    readiness?.pendingCount,
    plan?.theoreticalDoseCount,
    details.flags.join(" | "),
    "Automated estimates require laboratory review; not a diagnostic, fertility, breeding, treatment, or dose-release decision.",
  ];
  return `${headers.join(",")}\n${values.map(csvField).join(",")}\n`;
}
