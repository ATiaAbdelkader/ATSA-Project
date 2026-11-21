import type { CasaTrackMetrics } from "./casa";

export type TrackMetricRange = {
  minimum: number;
  median: number;
  maximum: number;
  interquartileRange: number;
  outlierTrackIds: string[];
};

export type TrackMetricRangeEvidence = {
  acceptedTracks: number;
  vcl: TrackMetricRange;
  lin: TrackMetricRange;
  confidence: TrackMetricRange;
};

function median(values: number[]) {
  if (!values.length) return 0;
  const middle = Math.floor(values.length / 2);
  return values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
}

function summarizeRange(tracks: CasaTrackMetrics[], valueFor: (track: CasaTrackMetrics) => number): TrackMetricRange {
  const values = tracks
    .map(track => ({ id: track.id, value: valueFor(track) }))
    .filter(item => Number.isFinite(item.value));
  if (!values.length) return { minimum: 0, median: 0, maximum: 0, interquartileRange: 0, outlierTrackIds: [] };

  const ordered = [...values].sort((a, b) => a.value - b.value);
  const numeric = ordered.map(item => item.value);
  const midpoint = Math.floor(numeric.length / 2);
  const lowerHalf = numeric.slice(0, midpoint);
  const upperHalf = numeric.slice(Math.ceil(numeric.length / 2));
  const q1 = median(lowerHalf.length ? lowerHalf : numeric);
  const q3 = median(upperHalf.length ? upperHalf : numeric);
  const interquartileRange = Math.max(0, q3 - q1);
  const lowerFence = q1 - interquartileRange * 1.5;
  const upperFence = q3 + interquartileRange * 1.5;
  const outlierTrackIds = interquartileRange > 0
    ? values.filter(item => item.value < lowerFence || item.value > upperFence).map(item => item.id)
    : [];

  return {
    minimum: numeric[0],
    median: median(numeric),
    maximum: numeric.at(-1) ?? 0,
    interquartileRange,
    outlierTrackIds,
  };
}

/**
 * Describes the numerical spread of retained track metrics for technical review.
 * It is read-only evidence: no track is removed, reclassified, or remeasured.
 */
export function buildTrackMetricRangeEvidence(tracks: CasaTrackMetrics[]): TrackMetricRangeEvidence {
  return {
    acceptedTracks: tracks.length,
    vcl: summarizeRange(tracks, track => track.vcl),
    lin: summarizeRange(tracks, track => track.lin),
    confidence: summarizeRange(tracks, track => track.confidence),
  };
}
