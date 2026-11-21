import { describe, expect, it } from "vitest";
import { buildMultiFieldReviewCsv } from "@shared/multiFieldReviewExport";

describe("multi-field technical review CSV export", () => {
  it("preserves per-field context and an unpooled technical-only safeguard", () => {
    const csv = buildMultiFieldReviewCsv({
      generatedAt: new Date("2026-08-27T12:00:00.000Z"),
      sameSpecimenConfirmed: false,
      fields: [{ id: "a", label: "Field A", source: "upload", methodSignature: "bovine|0.5|25", summary: { motility: 60, progressiveMotility: 40, vcl: 80, validTracks: 12 } as never, qualityFlags: ["Review focus"], trajectoryIntegrity: { summaryLine: "100.0% nominal links", attentionItems: ["1 gap-spanning link"], safeguard: "Technical trajectory-integrity context only." } }],
    });

    expect(csv).toContain("semenscope.multi-field-technical-review-export.v1");
    expect(csv).toContain("review_readiness");
    expect(csv).toContain('"not_ready"');
    expect(csv).toContain('"Field A"');
    expect(csv).toContain('"1 gap-spanning link"');
    expect(csv).toContain("does not pool measurements");
  });
});
