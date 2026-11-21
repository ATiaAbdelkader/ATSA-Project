import type { CasaThresholds, CasaTrackMetrics } from "./casa";

export type TechnicalReviewTrack = { id: string; metrics: CasaTrackMetrics };
export type TechnicalReviewCandidate = { id: string; confidence: number; frames: number; reasons: string[]; priority: number };

export function buildTechnicalReviewQueue(tracks: TechnicalReviewTrack[], thresholds: Pick<CasaThresholds, "minTrackConfidence" | "minTrackFrames">) {
  return tracks.map(track => {
    const reasons: string[] = [];
    let priority = 0;
    if (track.metrics.confidence < thresholds.minTrackConfidence) {
      reasons.push(`Link confidence ${track.metrics.confidence.toFixed(2)} is below the active ${thresholds.minTrackConfidence.toFixed(2)} threshold`);
      priority += 4 + (thresholds.minTrackConfidence - track.metrics.confidence);
    }
    if (track.metrics.frames < thresholds.minTrackFrames) {
      reasons.push(`Linked for ${track.metrics.frames} frames; active minimum is ${thresholds.minTrackFrames}`);
      priority += 3 + (thresholds.minTrackFrames - track.metrics.frames) / Math.max(1, thresholds.minTrackFrames);
    }
    if (!track.metrics.motile && track.metrics.vcl > 0) {
      reasons.push("Below active motility thresholds despite measured path movement");
      priority += 1;
    }
    return { id: track.id, confidence: track.metrics.confidence, frames: track.metrics.frames, reasons, priority };
  }).filter(candidate => candidate.reasons.length > 0).sort((a, b) => b.priority - a.priority || a.confidence - b.confidence || a.frames - b.frames || a.id.localeCompare(b.id));
}
