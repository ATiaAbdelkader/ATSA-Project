import { describe, expect, it } from "vitest";
import { buildSelectedTrajectoryCsvFilename, SELECTED_TRAJECTORY_EXPORT_NOTICE } from "@shared/selectedTrajectoryExport";

describe("selected trajectory export", () => {
  it("creates a safe focused-review filename with a technical-only safeguard", () => {
    expect(buildSelectedTrajectoryCsvFilename("Bovine field A", "T 03")).toBe("bovine-field-a-t-03-trajectory.csv");
    expect(SELECTED_TRAJECTORY_EXPORT_NOTICE).toContain("does not change tracks");
    expect(SELECTED_TRAJECTORY_EXPORT_NOTICE).toContain("biological interpretation");
  });
});
