import { describe, expect, it } from "vitest";
import { getKinematicLandscapeExtents, normalizeLandscapeValue } from "../shared/kinematicLandscape";

describe("kinematic landscape scaling", () => {
  it("creates padded VCL and LIN extents for a local track distribution", () => {
    const extents = getKinematicLandscapeExtents([{ id: "a", vcl: 10, lin: 20 }, { id: "b", vcl: 30, lin: 60 }]);
    expect(extents?.vcl.min).toBeLessThan(10);
    expect(extents?.vcl.max).toBeGreaterThan(30);
    expect(normalizeLandscapeValue(10, extents!.vcl)).toBeGreaterThan(0);
    expect(normalizeLandscapeValue(30, extents!.vcl)).toBeLessThan(1);
  });

  it("keeps a usable scale when all local tracks share one value", () => {
    const extents = getKinematicLandscapeExtents([{ id: "a", vcl: 20, lin: 50 }, { id: "b", vcl: 20, lin: 50 }]);
    expect(extents).toEqual({ vcl: { min: 17, max: 23 }, lin: { min: 42.5, max: 57.5 } });
  });
});
