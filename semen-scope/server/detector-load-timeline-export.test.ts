import { describe, expect, it } from "vitest";
import { buildDetectorLoadTimelineCsv } from "@shared/detectorLoadTimelineExport";

describe("detector-load timeline CSV export", () => {
  it("preserves sampled detector workload with technical-only safeguards", () => {
    const csv = buildDetectorLoadTimelineCsv({
      sampleName: "Bovine field A",
      species: "Bovine",
      source: "upload",
      calibration: { micronsPerPixel: 0.5, frameRate: 25 },
      outputFingerprint: "SSO-1234ABCD",
      generatedAt: new Date("2026-08-27T12:00:00.000Z"),
      timeline: { points: [{ sampleIndex: 0, frame: 4, candidateCount: 12, atSelectionCap: false }, { sampleIndex: 1, frame: 8, candidateCount: 360, atSelectionCap: true }], sampledFrames: 2, candidateLimitPerFrame: 360, peakCandidates: 360, peakFrame: 8, capBoundSamples: 1, rationale: "Technical only." },
    });

    expect(csv).toContain("semenscope.detector-load-timeline-export.v1");
    expect(csv).toContain("candidate_limit_per_frame");
    expect(csv).toContain('"360"');
    expect(csv).toContain('"true"');
    expect(csv).toContain("not a concentration, cell-count");
    expect(csv).toContain("not a cryptographic signature");
  });
});
