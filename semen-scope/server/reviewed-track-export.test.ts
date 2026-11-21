import { describe, expect, it } from "vitest";
import { buildReviewedTrackCsv, buildReviewedTrackCsvFilename } from "@shared/reviewedTrackExport";

describe("browser-local reviewed-track CSV export", () => {
  it("exports only marked existing tracks with a technical-only safeguard", () => {
    const csv = buildReviewedTrackCsv({ sampleName: "Field 03", frameRate: 25, reviewedTrackIds: ["T-2"], tracks: [{ id: "T-1", metrics: { frames: 4, confidence: .71, progressive: false, motile: true, vcl: 10, vsl: 7, vap: 8, lin: .7, str: .8 } }, { id: "T-2", metrics: { frames: 8, confidence: .91, progressive: true, motile: true, vcl: 20, vsl: 15, vap: 16, lin: .75, str: .9 } }] });
    expect(csv).toContain('"T-2"');
    expect(csv).not.toContain('"T-1"');
    expect(csv).toContain("browser-local operator review markers");
    expect(buildReviewedTrackCsvFilename("Field 03")).toBe("field-03-technical-reviewed-tracks.csv");
  });
});
