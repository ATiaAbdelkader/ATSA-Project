import type { CasaSummary } from "./casa";
import type { TrajectoryIntegrityEvidence } from "./trajectoryIntegrity";

export type MultiFieldResult = {
  id: string;
  label: string;
  source: "upload" | "camera" | "reference";
  methodSignature: string;
  summary: CasaSummary;
  qualityFlags: string[];
  trajectoryIntegrity?: Pick<TrajectoryIntegrityEvidence, "summaryLine" | "safeguard" | "attentionItems">;
};

export type AggregateMetric = {
  mean: number;
  sampleStandardDeviation: number;
  min: number;
  max: number;
};

export type MultiFieldReview = {
  fieldCount: number;
  totalFlagCount: number;
  metrics: Record<"motility" | "progressiveMotility" | "vcl" | "validTracks", AggregateMetric>;
  trajectoryIntegrityContexts: Array<{ fieldLabel: string; summaryLine: string; attentionItems: string[]; safeguard: string }>;
  reviewNotes: string[];
};

function aggregate(values: number[]): AggregateMetric {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.length > 1 ? values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1) : 0;
  return { mean, sampleStandardDeviation: Math.sqrt(variance), min: Math.min(...values), max: Math.max(...values) };
}

export function getMultiFieldReviewBlocker(fields: MultiFieldResult[], sameSpecimenConfirmed: boolean) {
  if (fields.length < 2) return "Add at least two independently captured fields before calculating repeatability.";
  if (fields.some(field => field.source === "reference")) return "Bundled reference footage is demonstration material and cannot be used as a clinical multi-field replicate.";
  if (new Set(fields.map(field => field.methodSignature)).size > 1) return "Selected fields use different species, calibration, or threshold methods. Reanalyze them under one approved draft before comparing repeatability.";
  if (!sameSpecimenConfirmed) return "Confirm that all selected fields are independent views of the same prepared specimen before calculating repeatability.";
  return undefined;
}

export function buildMultiFieldReview(fields: MultiFieldResult[], sameSpecimenConfirmed: boolean): MultiFieldReview | undefined {
  const blocker = getMultiFieldReviewBlocker(fields, sameSpecimenConfirmed);
  if (blocker) return undefined;
  const reviewNotes = [
    "Technical repeatability review only; results are not a pooled concentration estimate or a fertility, breeding, treatment, or dose-release decision.",
    "Review field-specific flags, calibration provenance, sample preparation, and laboratory protocol before use.",
  ];
  return {
    fieldCount: fields.length,
    totalFlagCount: fields.reduce((sum, field) => sum + field.qualityFlags.length, 0),
    metrics: {
      motility: aggregate(fields.map(field => field.summary.motility)),
      progressiveMotility: aggregate(fields.map(field => field.summary.progressiveMotility)),
      vcl: aggregate(fields.map(field => field.summary.vcl)),
      validTracks: aggregate(fields.map(field => field.summary.validTracks)),
    },
    trajectoryIntegrityContexts: fields.flatMap(field => field.trajectoryIntegrity ? [{ fieldLabel: field.label, summaryLine: field.trajectoryIntegrity.summaryLine, attentionItems: field.trajectoryIntegrity.attentionItems, safeguard: field.trajectoryIntegrity.safeguard }] : []),
    reviewNotes,
  };
}
