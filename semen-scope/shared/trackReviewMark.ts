/** Toggles an operator's browser-local technical review marker without changing the track itself. */
export function toggleTechnicalReviewedTrack(trackIds: string[], trackId: string) {
  return trackIds.includes(trackId) ? trackIds.filter(id => id !== trackId) : [...trackIds, trackId].sort();
}

export function isTechnicalReviewedTrack(trackIds: string[], trackId: string) {
  return trackIds.includes(trackId);
}

export function clearTechnicalReviewedTracks() {
  return [] as string[];
}
