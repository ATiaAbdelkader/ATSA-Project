import { describe, expect, it } from "vitest";
import { buildTrajectoryMapPngFilename, TRAJECTORY_MAP_EXPORT_NOTICE } from "@shared/trajectoryMapExport";

describe("trajectory-map export", () => {
  it("creates a safe PNG filename with a local technical-review safeguard", () => {
    expect(buildTrajectoryMapPngFilename("Bovine field A")).toBe("bovine-field-a-trajectory-map.png");
    expect(TRAJECTORY_MAP_EXPORT_NOTICE).toContain("not stored by SemenScope");
    expect(TRAJECTORY_MAP_EXPORT_NOTICE).toContain("does not change trajectories");
  });
});
