import { describe, expect, it } from "vitest";
import { buildTechnicalReviewWindowCsv, buildTechnicalReviewWindowCsvFilename, REVIEW_WINDOW_EXPORT_NOTICE } from "@shared/reviewWindowExport";

describe("browser-local technical review-window export", () => {
  it("exports configured local window bounds and technical-only context without footage", () => {
    const csv = buildTechnicalReviewWindowCsv({ startFrame: 5, startTimeSeconds: 0.2, endFrame: 15, endTimeSeconds: 0.6 }, { sampleName: "Field A", frameRate: 25 });
    expect(csv).toContain('"Field A","5","0.200","15","0.600","25"');
    expect(csv).toContain("technical_review_notice");
    expect(buildTechnicalReviewWindowCsvFilename("Field A")).toBe("field-a-technical-review-window.csv");
    expect(REVIEW_WINDOW_EXPORT_NOTICE).toContain("does not contain footage");
  });
});
