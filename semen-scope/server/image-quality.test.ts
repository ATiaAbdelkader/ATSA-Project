import { describe, expect, it } from "vitest";
import { summarizeCaptureQuality } from "../shared/imageQuality";

describe("capture quality review", () => {
  it("classifies technically balanced frame samples as acceptable", () => {
    const quality = summarizeCaptureQuality([
      { brightness: 115, contrast: 31, focus: 20 },
      { brightness: 120, contrast: 29, focus: 18 },
    ]);
    expect(quality.status).toBe("acceptable");
    expect(quality.sampledFrames).toBe(2);
  });

  it("flags weak contrast or edge detail for review", () => {
    const quality = summarizeCaptureQuality([{ brightness: 110, contrast: 7, focus: 3 }]);
    expect(quality.status).toBe("poor");
    expect(quality.rationale).toContain("focus");
  });
});
