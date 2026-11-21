import { describe, expect, it } from "vitest";
import { formatChamberDepthMicrons, formatOpticsMagnification } from "@shared/opticsTraceability";

describe("optics traceability", () => {
  it("formats operator-entered optics context without deriving calibration values", () => {
    expect(formatOpticsMagnification("20×")).toBe("20×");
    expect(formatChamberDepthMicrons(20)).toBe("20 µm");
  });

  it("keeps missing or non-positive optics entries explicitly unrecorded", () => {
    expect(formatOpticsMagnification(" ")).toBe("not recorded");
    expect(formatChamberDepthMicrons(0)).toBe("not recorded");
  });
});
