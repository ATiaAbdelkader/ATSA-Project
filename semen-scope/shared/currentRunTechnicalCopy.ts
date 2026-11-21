export type CurrentRunTechnicalCopyInput = {
  sampleName: string;
  species: string;
  source: string;
  methodFingerprint: string;
  outputFingerprint: string;
  trajectoryIntegritySummary: string;
  trajectoryIntegrityAttentionItems: string[];
  detectorLoadSummary: string;
  candidateScoreSummary: string;
};

export const CURRENT_RUN_TECHNICAL_COPY_NOTICE = "Copies browser-local technical review context for reviewer transfer only. It does not change analysis output and is not a diagnostic, fertility, breeding, treatment, or dose-release result.";

/** Builds a compact review-only transfer text from already-computed browser-local evidence. */
export function buildCurrentRunTechnicalCopyText(input: CurrentRunTechnicalCopyInput) {
  return [
    "SEMENSCOPE — CURRENT-RUN TECHNICAL SUMMARY",
    CURRENT_RUN_TECHNICAL_COPY_NOTICE,
    "",
    `Sample: ${input.sampleName}`,
    `Species: ${input.species}`,
    `Source: ${input.source}`,
    `Method fingerprint: ${input.methodFingerprint}`,
    `Output fingerprint: ${input.outputFingerprint}`,
    `Trajectory integrity: ${input.trajectoryIntegritySummary}`,
    `Trajectory integrity attention: ${input.trajectoryIntegrityAttentionItems.join("; ") || "none recorded"}`,
    `Detector load: ${input.detectorLoadSummary}`,
    `Candidate-score context: ${input.candidateScoreSummary}`,
  ].join("\n");
}
