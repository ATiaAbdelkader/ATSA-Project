import { describe, expect, it } from "vitest";
import { buildMultiFieldReview, getMultiFieldReviewBlocker } from "../shared/multiFieldReview";

const summary = (motility: number, progressiveMotility: number, vcl: number, validTracks: number) => ({
  totalTrackedCells: validTracks + 2, validTracks, motility, progressiveMotility, vcl, vsl: 12, vap: 18, lin: 50, str: 60, wob: 55, alh: 2, bcf: 3, dance: 5, mad: 4, alhMax: 3, fractalDimension: 1.1, meanConfidence: 0.8, vslVapMotility: 40,
});

describe("multi-field repeatability review", () => {
  it("summarizes local non-reference fields with sample standard deviation", () => {
    const fields = [
      { id: "a", label: "Field A", source: "camera" as const, methodSignature: "bovine|0.5|25|draft-a", summary: summary(50, 30, 80, 100), qualityFlags: ["Review focus."], trajectoryIntegrity: { summaryLine: "100.0% nominal links · 10/10 tracks without observed gaps", attentionItems: ["1 gap-spanning link"], safeguard: "Technical trajectory-integrity context only." } },
      { id: "b", label: "Field B", source: "upload" as const, methodSignature: "bovine|0.5|25|draft-a", summary: summary(70, 50, 120, 140), qualityFlags: [] },
    ];
    const review = buildMultiFieldReview(fields, true);
    expect(review).toMatchObject({ fieldCount: 2, totalFlagCount: 1 });
    expect(review?.metrics.motility).toMatchObject({ mean: 60, sampleStandardDeviation: Math.sqrt(200), min: 50, max: 70 });
    expect(review?.metrics.validTracks).toMatchObject({ mean: 120, min: 100, max: 140 });
    expect(review?.trajectoryIntegrityContexts).toEqual([{ fieldLabel: "Field A", summaryLine: "100.0% nominal links · 10/10 tracks without observed gaps", attentionItems: ["1 gap-spanning link"], safeguard: "Technical trajectory-integrity context only." }]);
  });

  it("requires independent same-specimen confirmation and excludes demonstration clips", () => {
    const clinical = [{ id: "a", label: "Field A", source: "camera" as const, methodSignature: "bovine|0.5|25|draft-a", summary: summary(50, 30, 80, 100), qualityFlags: [] }, { id: "b", label: "Field B", source: "upload" as const, methodSignature: "bovine|0.5|25|draft-a", summary: summary(70, 50, 120, 140), qualityFlags: [] }];
    expect(getMultiFieldReviewBlocker(clinical, false)).toContain("Confirm");
    expect(buildMultiFieldReview(clinical, false)).toBeUndefined();
    expect(getMultiFieldReviewBlocker([{ ...clinical[0], source: "reference" as const }, clinical[1]], true)).toContain("reference footage");
    expect(getMultiFieldReviewBlocker([{ ...clinical[0], methodSignature: "bovine|0.5|25|draft-b" }, clinical[1]], true)).toContain("different species, calibration, or threshold methods");
  });
});
