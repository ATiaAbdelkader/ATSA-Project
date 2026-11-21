import { describe, expect, it } from "vitest";
import { buildCurrentRunTechnicalCopyText, CURRENT_RUN_TECHNICAL_COPY_NOTICE } from "@shared/currentRunTechnicalCopy";

describe("current-run technical summary copy", () => {
  it("builds compact browser-local review context with an explicit non-diagnostic safeguard", () => {
    const text = buildCurrentRunTechnicalCopyText({ sampleName: "Field A", species: "Bovine", source: "upload", methodFingerprint: "MTH-123", outputFingerprint: "SSO-123", trajectoryIntegritySummary: "100% nominal links", trajectoryIntegrityAttentionItems: ["1 gap-spanning link"], detectorLoadSummary: "peak 12", candidateScoreSummary: "median 24" });
    expect(text).toContain("SEMENSCOPE — CURRENT-RUN TECHNICAL SUMMARY");
    expect(text).toContain("Trajectory integrity attention: 1 gap-spanning link");
    expect(text).toContain("Candidate-score context: median 24");
    expect(CURRENT_RUN_TECHNICAL_COPY_NOTICE).toContain("does not change analysis output");
    expect(CURRENT_RUN_TECHNICAL_COPY_NOTICE).toContain("not a diagnostic");
  });
});
