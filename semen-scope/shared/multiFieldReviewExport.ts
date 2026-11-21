import { getMultiFieldReviewBlocker, type MultiFieldResult } from "./multiFieldReview";

export type MultiFieldReviewExportInput = {
  fields: MultiFieldResult[];
  sameSpecimenConfirmed: boolean;
  generatedAt?: Date;
};

const REVIEW_NOTICE = "Browser-local per-field technical review only. This export does not pool measurements, create a concentration estimate, or make a diagnostic, fertility, breeding, treatment, or dose-release decision.";

function csv(value: string | number | boolean | undefined) {
  const normalized = value === undefined ? "" : String(value);
  return `"${normalized.replaceAll('"', '""')}"`;
}

/** Exports retained field-specific review context without calculating or serializing pooled biological measures. */
export function buildMultiFieldReviewCsv(input: MultiFieldReviewExportInput) {
  const blocker = getMultiFieldReviewBlocker(input.fields, input.sameSpecimenConfirmed);
  const headers = ["schema", "generated_at_utc", "review_readiness", "review_blocker", "same_specimen_confirmed", "field_number", "field_label", "source", "method_signature", "motility_percent", "progressive_motility_percent", "vcl_microns_per_second", "valid_tracks", "quality_flags", "trajectory_integrity_summary", "trajectory_integrity_attention_items", "trajectory_integrity_safeguard", "review_notice"];
  const rows = input.fields.map((field, index) => [
    "semenscope.multi-field-technical-review-export.v1",
    (input.generatedAt ?? new Date()).toISOString(),
    blocker ? "not_ready" : "ready_for_technical_review",
    blocker,
    input.sameSpecimenConfirmed,
    index + 1,
    field.label,
    field.source,
    field.methodSignature,
    field.summary.motility,
    field.summary.progressiveMotility,
    field.summary.vcl,
    field.summary.validTracks,
    field.qualityFlags.join(" | "),
    field.trajectoryIntegrity?.summaryLine,
    field.trajectoryIntegrity?.attentionItems.join(" · "),
    field.trajectoryIntegrity?.safeguard,
    REVIEW_NOTICE,
  ].map(csv).join(","));
  return `${headers.join(",")}\n${rows.join("\n")}${rows.length ? "\n" : ""}`;
}
