import { describe, expect, it } from "vitest";
import { buildCandidateScoreDistributionCsv } from "@shared/candidateScoreDistributionExport";

describe("candidate-score distribution CSV export", () => {
  it("preserves existing detector-score summary with technical-only safeguards", () => {
    const csv = buildCandidateScoreDistributionCsv({
      sampleName: "Bovine field A",
      species: "Bovine",
      source: "upload",
      calibration: { micronsPerPixel: 0.5, frameRate: 25 },
      outputFingerprint: "SSO-1234ABCD",
      generatedAt: new Date("2026-08-27T12:00:00.000Z"),
      distribution: { candidateCount: 12, meanScore: 24.25, medianScore: 24, minimumScore: 10, maximumScore: 40, rationale: "Detector-score context only." },
    });

    expect(csv).toContain("semenscope.candidate-score-distribution-export.v1");
    expect(csv).toContain("candidate_count,mean_score,median_score");
    expect(csv).toContain('"24.25"');
    expect(csv).toContain('"Detector-score context only."');
    expect(csv).toContain("does not add, remove, re-rank");
    expect(csv).toContain("not a cryptographic signature");
  });
});
