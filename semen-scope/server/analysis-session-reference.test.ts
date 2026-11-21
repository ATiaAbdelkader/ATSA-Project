import { describe, expect, it } from "vitest";
import { ANALYSIS_SESSION_REFERENCE_NOTICE, createBrowserLocalAnalysisSessionReference } from "@shared/analysisSessionReference";

describe("browser-local analysis session reference", () => {
  it("formats a concise local trace reference from supplied time and random context", () => {
    expect(createBrowserLocalAnalysisSessionReference(new Date("2026-08-23T12:34:56.000Z"), 0)).toBe("LOCAL-20260823T123456Z-0000");
  });

  it("carries a clear non-authenticity and non-biological safeguard", () => {
    expect(ANALYSIS_SESSION_REFERENCE_NOTICE).toContain("not a unique identifier, signature, authentication token, or biological result");
  });
});
