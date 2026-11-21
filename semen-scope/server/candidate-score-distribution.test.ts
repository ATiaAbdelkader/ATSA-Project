import { describe, expect, it } from "vitest";
import { buildCandidateScoreDistributionEvidence } from "@shared/candidateScoreDistribution";

describe("candidate score distribution evidence", () => {
  it("summarizes existing selected detector scores without changing candidate selection", () => {
    const evidence = buildCandidateScoreDistributionEvidence([8, 2, 6, 4]);
    expect(evidence).toMatchObject({ candidateCount: 4, meanScore: 5, medianScore: 5, minimumScore: 2, maximumScore: 8 });
    expect(evidence.rationale).toContain("does not add, remove, re-rank, or alter candidates");
  });

  it("returns safe empty technical context without selected scores", () => {
    expect(buildCandidateScoreDistributionEvidence([])).toMatchObject({ candidateCount: 0, meanScore: 0, medianScore: 0, minimumScore: 0, maximumScore: 0 });
  });
});
