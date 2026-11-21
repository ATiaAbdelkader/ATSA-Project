export type TrackReviewFilter = "all" | "progressive" | "motile" | "non_motile";

type TrackForReviewFilter = { metrics: { progressive: boolean; motile: boolean } };

export function filterTrackReviewRows<T extends TrackForReviewFilter>(tracks: T[], filter: TrackReviewFilter) {
  if (filter === "all") return tracks;
  if (filter === "progressive") return tracks.filter(track => track.metrics.progressive);
  if (filter === "motile") return tracks.filter(track => track.metrics.motile && !track.metrics.progressive);
  return tracks.filter(track => !track.metrics.motile);
}
