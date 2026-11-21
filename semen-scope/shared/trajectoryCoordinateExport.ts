import type { CasaCalibration, CasaPoint, CasaThresholds, CasaTrackMetrics } from "./casa";
import type { CalibrationBoardEvidence } from "./calibrationBoard";
import type { TrajectoryIntegrityEvidence } from "./trajectoryIntegrity";

export type CoordinateExportTrack = {
  id: string;
  points: CasaPoint[];
  metrics: CasaTrackMetrics;
};

export type TrajectoryCoordinateExportInput = {
  sampleName: string;
  species: string;
  source: string;
  calibration: CasaCalibration;
  thresholds: CasaThresholds;
  calibrationEvidence?: CalibrationBoardEvidence;
  outputFingerprint?: string;
  trajectoryIntegrity?: TrajectoryIntegrityEvidence;
  generatedAt?: Date;
  tracks: CoordinateExportTrack[];
};

const REVIEW_NOTICE = "Browser-local trajectory coordinates are automated estimates for laboratory review only; not a diagnostic, fertility, breeding, treatment, or dose-release decision.";
const FINGERPRINT_NOTICE = "Deterministic browser-local reproducibility checksum only; not a cryptographic signature, tamper-proof record, diagnostic result, or biological interpretation.";

function csv(value: string | number | boolean | undefined) {
  const normalized = value === undefined ? "" : String(value);
  return `"${normalized.replaceAll('"', '""')}"`;
}

function classification(metrics: CasaTrackMetrics) {
  return metrics.progressive ? "progressive" : metrics.motile ? "motile" : "non-motile";
}

export function buildTrajectoryCoordinateCsv(input: TrajectoryCoordinateExportInput) {
  const generatedAt = (input.generatedAt ?? new Date()).toISOString();
  const provenance = input.calibrationEvidence ? "board-referenced" : "manual-unverified";
  const headers = [
    "schema", "generated_at_utc", "sample_name", "species", "source", "calibration_provenance", "microns_per_pixel", "frame_rate", "threshold_signature", "output_fingerprint", "output_fingerprint_notice", "trajectory_integrity_summary", "trajectory_integrity_attention_items", "trajectory_integrity_notice", "track_id", "point_index", "frame", "time_seconds", "x_px", "y_px", "x_microns", "y_microns", "track_confidence", "classification", "review_notice",
  ];
  const thresholdSignature = JSON.stringify(input.thresholds);
  const rows = input.tracks.flatMap(track => track.points.map((point, pointIndex) => [
    "semenscope.trajectory-coordinate-export.v4",
    generatedAt,
    input.sampleName,
    input.species,
    input.source,
    provenance,
    input.calibration.micronsPerPixel,
    input.calibration.frameRate,
    thresholdSignature,
    input.outputFingerprint,
    FINGERPRINT_NOTICE,
    input.trajectoryIntegrity?.summaryLine,
    input.trajectoryIntegrity?.attentionItems.join(" · "),
    input.trajectoryIntegrity?.safeguard,
    track.id,
    pointIndex,
    point.frame,
    point.frame / input.calibration.frameRate,
    point.x,
    point.y,
    point.x * input.calibration.micronsPerPixel,
    point.y * input.calibration.micronsPerPixel,
    track.metrics.confidence,
    classification(track.metrics),
    REVIEW_NOTICE,
  ].map(csv).join(",")));
  return `${headers.join(",")}\n${rows.join("\n")}${rows.length ? "\n" : ""}`;
}
