export const CURRENT_FRAME_EXPORT_NOTICE = "Downloads the current browser-local frame for technical review only. The image is not stored by SemenScope and is not a diagnostic, fertility, breeding, treatment, or dose-release result.";

function safeSegment(value: string) {
  return value.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "semenscope-frame";
}

/** Builds a deterministic local filename without embedding specimen identifiers outside the user-provided label. */
export function buildCurrentFramePngFilename(sampleName: string, currentTimeSeconds: number) {
  const milliseconds = Math.max(0, Math.round(Number.isFinite(currentTimeSeconds) ? currentTimeSeconds * 1_000 : 0));
  return `${safeSegment(sampleName)}-frame-${milliseconds}ms.png`;
}
