export function createBrowserLocalAnalysisSessionReference(date = new Date(), random = Math.random()) {
  const timestamp = date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const suffix = Math.floor(Math.max(0, Math.min(0.999999, random)) * 1_679_616).toString(36).padStart(4, "0").slice(-4).toUpperCase();
  return `LOCAL-${timestamp}-${suffix}`;
}

export const ANALYSIS_SESSION_REFERENCE_NOTICE = "Browser-local session reference for audit context only; it is not a unique identifier, signature, authentication token, or biological result.";
