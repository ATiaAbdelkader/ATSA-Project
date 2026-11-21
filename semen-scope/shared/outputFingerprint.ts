import type { CasaPoint, CasaSummary, CasaTrackMetrics } from "./casa";

export type OutputFingerprintTrack = { id: string; points: CasaPoint[]; metrics: CasaTrackMetrics };

function fnv1a(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).toUpperCase().padStart(8, "0");
}

function rounded(value: number) {
  return Number.isFinite(value) ? Number(value.toFixed(4)) : 0;
}

/**
 * Creates a deterministic, browser-local checksum of compact technical output fields.
 * This supports repeatability review only; it is not a cryptographic signature, a tamper-proof record, or a biological result.
 */
export function createOutputFingerprint({
  metadata,
  summary,
  frameStep,
  processedFrames,
  tracks,
}: {
  metadata: { width: number; height: number; frameRate: number; frameCount: number };
  summary: CasaSummary;
  frameStep: number;
  processedFrames: number;
  tracks: OutputFingerprintTrack[];
}) {
  const compactTracks = [...tracks].sort((a, b) => a.id.localeCompare(b.id)).map(track => {
    const orderedPoints = [...track.points].sort((a, b) => a.frame - b.frame);
    return {
      id: track.id,
      pointCount: orderedPoints.length,
      firstFrame: orderedPoints[0]?.frame ?? 0,
      lastFrame: orderedPoints.at(-1)?.frame ?? 0,
      metrics: {
        frames: track.metrics.frames,
        vcl: rounded(track.metrics.vcl),
        lin: rounded(track.metrics.lin),
        confidence: rounded(track.metrics.confidence),
        progressive: track.metrics.progressive,
        motile: track.metrics.motile,
      },
    };
  });
  const payload = JSON.stringify({ schema: "semenscope-output-fingerprint-v1", metadata, frameStep: Math.max(1, Math.round(frameStep)), processedFrames: Math.max(0, Math.round(processedFrames)), summary: { validTracks: summary.validTracks, vcl: rounded(summary.vcl), lin: rounded(summary.lin), meanConfidence: rounded(summary.meanConfidence) }, tracks: compactTracks });
  return `SSO-${fnv1a(payload)}`;
}
