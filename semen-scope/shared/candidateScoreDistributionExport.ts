import type { CasaCalibration } from "./casa";
import type { CandidateScoreDistributionEvidence } from "./candidateScoreDistribution";

export type CandidateScoreDistributionExportInput = {
  sampleName: string;
  species: string;
  source: string;
  calibration: CasaCalibration;
  outputFingerprint?: string;
  distribution: CandidateScoreDistributionEvidence;
  generatedAt?: Date;
};

const REVIEW_NOTICE = "Browser-local candidate-score summary is technical detector context for laboratory review only; it does not add, remove, re-rank, or alter candidates, trajectories, metrics, classifications, or biological interpretation.";
const FINGERPRINT_NOTICE = "Deterministic browser-local reproducibility checksum only; not a cryptographic signature, tamper-proof record, diagnostic result, or biological interpretation.";

function csv(value: string | number | undefined) {
  const normalized = value === undefined ? "" : String(value);
  return `"${normalized.replaceAll('"', '""')}"`;
}

/** Serializes the existing detector-score distribution summary without exposing, changing, or re-ranking candidates. */
export function buildCandidateScoreDistributionCsv(input: CandidateScoreDistributionExportInput) {
  const headers = ["schema", "generated_at_utc", "sample_name", "species", "source", "microns_per_pixel", "frame_rate", "output_fingerprint", "output_fingerprint_notice", "candidate_count", "mean_score", "median_score", "minimum_score", "maximum_score", "detector_score_rationale", "review_notice"];
  const row = [
    "semenscope.candidate-score-distribution-export.v1",
    (input.generatedAt ?? new Date()).toISOString(),
    input.sampleName,
    input.species,
    input.source,
    input.calibration.micronsPerPixel,
    input.calibration.frameRate,
    input.outputFingerprint,
    FINGERPRINT_NOTICE,
    input.distribution.candidateCount,
    input.distribution.meanScore,
    input.distribution.medianScore,
    input.distribution.minimumScore,
    input.distribution.maximumScore,
    input.distribution.rationale,
    REVIEW_NOTICE,
  ];
  return `${headers.join(",")}\n${row.map(csv).join(",")}\n`;
}
