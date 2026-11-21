import { describe, expect, it } from "vitest";
import { buildQualityFlags } from "../shared/qualityFlags";

describe("scientific-use quality guardrails", () => {
  it("always includes review and calibration safeguards", () => {
    const flags = buildQualityFlags({ validTrackCount: 30, sampledFrames: 25, availableFrames: 25, duration: 3 });
    expect(flags).toContain("Scientific review required: automated trajectory estimates are not a diagnostic result.");
    expect(flags).toContain("Calibration review required: velocity and distance outputs depend on the entered µm/px and fps values.");
  });

  it("flags short and low-track footage for laboratory review", () => {
    const flags = buildQualityFlags({ validTrackCount: 4, sampledFrames: 8, availableFrames: 25, duration: 1 });
    expect(flags.some(flag => flag.startsWith("Low valid-track count"))).toBe(true);
    expect(flags.some(flag => flag.startsWith("Short clip"))).toBe(true);
  });
});
