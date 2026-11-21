export type TrackDurationEvidence = {
  acceptedTracks: number;
  meanFrames: number;
  shortestFrames: number;
  longestFrames: number;
};

export function buildTrackDurationEvidence(frames: number[]): TrackDurationEvidence {
  const values = frames.filter(value => Number.isFinite(value) && value >= 0);
  if (!values.length) return { acceptedTracks: 0, meanFrames: 0, shortestFrames: 0, longestFrames: 0 };
  return {
    acceptedTracks: values.length,
    meanFrames: values.reduce((sum, value) => sum + value, 0) / values.length,
    shortestFrames: Math.min(...values),
    longestFrames: Math.max(...values),
  };
}
