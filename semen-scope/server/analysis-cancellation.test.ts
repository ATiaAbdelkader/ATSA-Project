import { describe, expect, it } from "vitest";
import { ANALYSIS_CANCELLED_MESSAGE, AnalysisCancelledError, isAnalysisCancelledError, throwIfAnalysisCancelled } from "@shared/analysisCancellation";

describe("browser-local analysis cancellation", () => {
  it("interrupts only when the operator cancellation signal is requested", () => {
    expect(() => throwIfAnalysisCancelled(() => false)).not.toThrow();
    expect(() => throwIfAnalysisCancelled(() => true)).toThrow(AnalysisCancelledError);
  });

  it("provides a distinct, non-error cancellation contract for the workspace", () => {
    const error = new AnalysisCancelledError();
    expect(error.message).toBe(ANALYSIS_CANCELLED_MESSAGE);
    expect(isAnalysisCancelledError(error)).toBe(true);
    expect(isAnalysisCancelledError(new Error("Video failed"))).toBe(false);
  });
});
