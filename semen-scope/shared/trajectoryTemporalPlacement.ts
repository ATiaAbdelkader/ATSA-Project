import type { CasaPoint } from "./casa";

export type TrajectoryTemporalPlacementEvidence = {
  acceptedTracks: number;
  windowStartFrame: number;
  windowEndFrame: number;
  tracksStartingAtWindowBoundary: number;
  tracksEndingAtWindowBoundary: number;
  tracksSpanningEntireWindow: number;
  earliestTrackStartFrame: number;
  latestTrackEndFrame: number;
  rationale: string;
};

export type TemporalPlacementTrack = { id: string; points: Pick<CasaPoint, "frame">[] };

/**
 * Describes where retained trajectories begin and end within the sampled analysis window.
 * It is technical observation-window provenance only and does not alter a trajectory or its interpretation.
 */
export function buildTrajectoryTemporalPlacementEvidence({
  tracks,
  availableFrames,
  frameStep,
}: {
  tracks: TemporalPlacementTrack[];
  availableFrames: number;
  frameStep: number;
}): TrajectoryTemporalPlacementEvidence {
  const step = Math.max(1, Math.round(frameStep));
  const windowStartFrame = 0;
  const windowEndFrame = Math.max(0, Math.floor(Math.max(0, availableFrames - 1) / step) * step);
  let acceptedTracks = 0;
  let tracksStartingAtWindowBoundary = 0;
  let tracksEndingAtWindowBoundary = 0;
  let tracksSpanningEntireWindow = 0;
  let earliestTrackStartFrame = 0;
  let latestTrackEndFrame = 0;

  tracks.forEach(track => {
    const frames = track.points.map(point => point.frame).filter(Number.isFinite).sort((a, b) => a - b);
    if (!frames.length) return;
    acceptedTracks += 1;
    const first = frames[0];
    const last = frames.at(-1)!;
    if (acceptedTracks === 1 || first < earliestTrackStartFrame) earliestTrackStartFrame = first;
    if (acceptedTracks === 1 || last > latestTrackEndFrame) latestTrackEndFrame = last;
    const startsAtBoundary = first <= windowStartFrame;
    const endsAtBoundary = last >= windowEndFrame;
    if (startsAtBoundary) tracksStartingAtWindowBoundary += 1;
    if (endsAtBoundary) tracksEndingAtWindowBoundary += 1;
    if (startsAtBoundary && endsAtBoundary) tracksSpanningEntireWindow += 1;
  });

  const rationale = acceptedTracks
    ? `${tracksStartingAtWindowBoundary} retained tracks begin at the sampled-window start and ${tracksEndingAtWindowBoundary} end at its final sampled frame. These are observation-window positions only; they do not establish a track's biological start or end.`
    : "No retained trajectories were available to describe sampled-window placement; this is observation-window provenance only.";
  return { acceptedTracks, windowStartFrame, windowEndFrame, tracksStartingAtWindowBoundary, tracksEndingAtWindowBoundary, tracksSpanningEntireWindow, earliestTrackStartFrame, latestTrackEndFrame, rationale };
}
