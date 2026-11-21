import type { CasaPoint } from "./casa";

export type TrackLinkageContinuityEvidence = {
  acceptedTracks: number;
  expectedFrameStep: number;
  linkedSegments: number;
  continuousSegments: number;
  gapSpanningSegments: number;
  continuityPercent: number;
  tracksWithGaps: number;
  maxSkippedFramesInSegment: number;
  rationale: string;
};

export type LinkageTrack = { id: string; points: Pick<CasaPoint, "frame">[] };

/**
 * Summarizes observed gaps between retained trajectory points using the analysis cadence.
 * This is read-only provenance: it never changes candidate association, a stored point, or a classification.
 */
export function buildTrackLinkageContinuityEvidence(tracks: LinkageTrack[], expectedFrameStep: number): TrackLinkageContinuityEvidence {
  const step = Math.max(1, Math.round(expectedFrameStep));
  let linkedSegments = 0;
  let continuousSegments = 0;
  let gapSpanningSegments = 0;
  let maxSkippedFramesInSegment = 0;
  const tracksWithGaps = new Set<string>();

  tracks.forEach(track => {
    const points = [...track.points].filter(point => Number.isFinite(point.frame)).sort((a, b) => a.frame - b.frame);
    points.slice(1).forEach((point, index) => {
      const frameDelta = point.frame - points[index].frame;
      if (frameDelta <= 0) return;
      linkedSegments += 1;
      if (frameDelta <= step) {
        continuousSegments += 1;
        return;
      }
      gapSpanningSegments += 1;
      tracksWithGaps.add(track.id);
      maxSkippedFramesInSegment = Math.max(maxSkippedFramesInSegment, frameDelta - step);
    });
  });

  const continuityPercent = linkedSegments ? (continuousSegments / linkedSegments) * 100 : 0;
  const rationale = linkedSegments
    ? `${continuousSegments} of ${linkedSegments} retained point-to-point links use the nominal ${step}-frame sampling cadence; larger observed gaps remain linked and are shown only for technical review.`
    : `No retained point-to-point links were available to assess the nominal ${step}-frame sampling cadence.`;
  return { acceptedTracks: tracks.length, expectedFrameStep: step, linkedSegments, continuousSegments, gapSpanningSegments, continuityPercent, tracksWithGaps: tracksWithGaps.size, maxSkippedFramesInSegment, rationale };
}
