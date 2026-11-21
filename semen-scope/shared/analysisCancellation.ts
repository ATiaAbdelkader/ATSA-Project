export const ANALYSIS_CANCELLED_MESSAGE = "Analysis cancelled by operator.";

export class AnalysisCancelledError extends Error {
  constructor() {
    super(ANALYSIS_CANCELLED_MESSAGE);
    this.name = "AnalysisCancelledError";
  }
}

export function throwIfAnalysisCancelled(shouldCancel?: () => boolean) {
  if (shouldCancel?.()) throw new AnalysisCancelledError();
}

export function isAnalysisCancelledError(error: unknown) {
  return error instanceof AnalysisCancelledError || (error instanceof Error && error.name === "AnalysisCancelledError");
}
