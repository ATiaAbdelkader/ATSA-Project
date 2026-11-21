import { describe, expect, it } from "vitest";
import { createTemporarySessionResetState } from "@shared/temporarySessionReset";

describe("temporary browser-local session reset", () => {
  it("returns fresh empty operator context without including method, records, or footage bytes", () => {
    const first = createTemporarySessionResetState();
    const second = createTemporarySessionResetState();
    first.specimenContext.specimenId = "EJ-42";
    expect(second.specimenContext.specimenId).toBe("");
    expect(first).toMatchObject({ opticsTraceability: { objectiveMagnification: "" }, dosePlan: {} });
    expect(JSON.stringify(first)).not.toContain("tracks");
  });
});
