import { describe, expect, it } from "vitest";
import { DEFAULT_CASA_CALIBRATION, DEFAULT_CASA_THRESHOLDS } from "../shared/casa";
import { createMethodFingerprint } from "../shared/methodFingerprint";

describe("method fingerprint", () => {
  it("is deterministic for the same species, calibration, and threshold snapshot", () => {
    const input = { species: "Bovine", calibration: DEFAULT_CASA_CALIBRATION, thresholds: DEFAULT_CASA_THRESHOLDS };
    expect(createMethodFingerprint(input)).toBe(createMethodFingerprint(input));
    expect(createMethodFingerprint(input)).toMatch(/^SS-BOV-[A-F0-9]{8}$/);
  });

  it("changes when a reproducibility-relevant method value changes", () => {
    const baseline = createMethodFingerprint({ species: "Bovine", calibration: DEFAULT_CASA_CALIBRATION, thresholds: DEFAULT_CASA_THRESHOLDS });
    const changed = createMethodFingerprint({ species: "Bovine", calibration: { ...DEFAULT_CASA_CALIBRATION, micronsPerPixel: 0.6 }, thresholds: DEFAULT_CASA_THRESHOLDS });
    expect(changed).not.toBe(baseline);
  });
});
