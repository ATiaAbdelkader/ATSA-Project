import type { CasaCalibration } from "./casa";
import type { DetectorLoadTimeline } from "./detectorLoadTimeline";

export type DetectorLoadTimelineExportInput = {
  sampleName: string;
  species: string;
  source: string;
  calibration: CasaCalibration;
  outputFingerprint?: string;
  timeline: DetectorLoadTimeline;
  generatedAt?: Date;
};

const REVIEW_NOTICE = "Browser-local sampled detector-load values are technical workload context for laboratory review only; they are not a concentration, cell-count, diagnostic, fertility, breeding, treatment, or dose-release decision and do not change analysis output.";
const FINGERPRINT_NOTICE = "Deterministic browser-local reproducibility checksum only; not a cryptographic signature, tamper-proof record, diagnostic result, or biological interpretation.";

function csv(value: string | number | boolean | undefined | null) {
  const normalized = value === undefined || value === null ? "" : String(value);
  return `"${normalized.replaceAll('"', '""')}"`;
}

/** Serializes the existing sampled detector-load timeline for browser-local technical review without changing candidates or tracks. */
export function buildDetectorLoadTimelineCsv(input: DetectorLoadTimelineExportInput) {
  const generatedAt = (input.generatedAt ?? new Date()).toISOString();
  const headers = [
    "schema", "generated_at_utc", "sample_name", "species", "source", "microns_per_pixel", "frame_rate", "output_fingerprint", "output_fingerprint_notice", "candidate_limit_per_frame", "sample_index", "source_frame", "time_seconds", "candidate_count", "at_selection_cap", "review_notice",
  ];
  const rows = input.timeline.points.map(point => [
    "semenscope.detector-load-timeline-export.v1",
    generatedAt,
    input.sampleName,
    input.species,
    input.source,
    input.calibration.micronsPerPixel,
    input.calibration.frameRate,
    input.outputFingerprint,
    FINGERPRINT_NOTICE,
    input.timeline.candidateLimitPerFrame,
    point.sampleIndex,
    point.frame,
    point.frame / input.calibration.frameRate,
    point.candidateCount,
    point.atSelectionCap,
    REVIEW_NOTICE,
  ].map(csv).join(","));
  return `${headers.join(",")}\n${rows.join("\n")}${rows.length ? "\n" : ""}`;
}
