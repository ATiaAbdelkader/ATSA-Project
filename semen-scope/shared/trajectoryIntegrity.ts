import type { FieldBoundaryContactEvidence } from "./fieldBoundaryContact";
import type { TrackLinkageContinuityEvidence } from "./trackLinkageContinuity";
import type { TrajectoryTemporalPlacementEvidence } from "./trajectoryTemporalPlacement";

export type TrajectoryIntegrityEvidence = {
  acceptedTracks: number;
  continuityPercent: number;
  tracksWithoutGaps: number;
  tracksWithGaps: number;
  windowSpanningPercent: number;
  boundaryPointPercent: number;
  attentionItems: string[];
  summaryLine: string;
  safeguard: string;
};

/** Consolidates existing read-only trajectory evidence; it never edits, rejects, or reclassifies a track. */
export function buildTrajectoryIntegrityEvidence(
  linkage: TrackLinkageContinuityEvidence,
  placement: TrajectoryTemporalPlacementEvidence,
  boundary: FieldBoundaryContactEvidence,
): TrajectoryIntegrityEvidence {
  const acceptedTracks = Math.max(0, linkage.acceptedTracks);
  const tracksWithoutGaps = Math.max(0, acceptedTracks - linkage.tracksWithGaps);
  const windowSpanningPercent = acceptedTracks ? (placement.tracksSpanningEntireWindow / acceptedTracks) * 100 : 0;
  const attentionItems: string[] = [];
  if (linkage.gapSpanningSegments > 0) attentionItems.push(`${linkage.gapSpanningSegments} gap-spanning link${linkage.gapSpanningSegments === 1 ? "" : "s"}`);
  if (placement.tracksStartingAtWindowBoundary > 0 || placement.tracksEndingAtWindowBoundary > 0) attentionItems.push("tracks touch the sampled-window boundary");
  if (boundary.boundaryPoints > 0) attentionItems.push(`${boundary.boundaryPoints} point${boundary.boundaryPoints === 1 ? "" : "s"} in the outer image zone`);
  return {
    acceptedTracks,
    continuityPercent: linkage.continuityPercent,
    tracksWithoutGaps,
    tracksWithGaps: linkage.tracksWithGaps,
    windowSpanningPercent,
    boundaryPointPercent: boundary.boundaryPointPercent,
    attentionItems,
    summaryLine: `${linkage.continuityPercent.toFixed(1)}% nominal links · ${tracksWithoutGaps}/${acceptedTracks} tracks without observed gaps · ${windowSpanningPercent.toFixed(1)}% span the sampled window`,
    safeguard: "Technical trajectory-integrity context only; it does not establish tracking accuracy, alter kinematics, or infer biological outcomes.",
  };
}
