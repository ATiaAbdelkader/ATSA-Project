import { describe, expect, it } from "vitest";
import { analysisSnapshotSchema } from "../shared/analysis-contract";

describe("analysis record persistence contract", () => {
  it("accepts a complete immutable analysis snapshot", () => {
    const result = analysisSnapshotSchema.safeParse({
      sampleName: "Bovine intake A-01",
      species: "Bovine",
      source: "upload",
      videoFileName: "field.mp4",
      videoUrl: null,
      videoMetadataJson: "{}",
      calibrationJson: "{}",
      thresholdsJson: "{}",
      metricsJson: "{}",
      tracksJson: "[]",
      qualityFlagsJson: "[]",
      status: "review_required",
    });

    expect(result.success).toBe(true);
  });

  it("rejects incomplete records before persistence", () => {
    const result = analysisSnapshotSchema.safeParse({ sampleName: "", species: "Bovine" });
    expect(result.success).toBe(false);
  });
});
