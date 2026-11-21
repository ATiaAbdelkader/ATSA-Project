import { describe, expect, it } from "vitest";
import { buildReviewBookmarkCsv, buildReviewBookmarkCsvFilename, REVIEW_BOOKMARK_EXPORT_NOTICE } from "@shared/reviewBookmarkExport";

describe("browser-local review bookmark export", () => {
  it("writes labels and calibrated references as technical-only CSV without footage", () => {
    const csv = buildReviewBookmarkCsv([{ id: "frame-5", frame: 5, timeSeconds: 0.2, label: "Frame 5 · 0.200 s", operatorLabel: "check field edge" }], { sampleName: "Field A", frameRate: 25 });
    expect(csv).toContain('"Field A","5","0.200","25","check field edge"');
    expect(csv).toContain("technical_review_notice");
    expect(buildReviewBookmarkCsvFilename("Field A")).toBe("field-a-technical-review-bookmarks.csv");
    expect(REVIEW_BOOKMARK_EXPORT_NOTICE).toContain("does not contain footage");
  });
});
