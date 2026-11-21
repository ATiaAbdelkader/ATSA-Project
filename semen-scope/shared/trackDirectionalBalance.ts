import type { CasaPoint } from "./casa";

export const IMAGE_DIRECTION_OCTANTS = ["right", "lower-right", "lower", "lower-left", "left", "upper-left", "upper", "upper-right"] as const;
export type ImageDirectionOctant = (typeof IMAGE_DIRECTION_OCTANTS)[number];

export type TrackDirectionalBalanceEvidence = {
  acceptedTracks: number;
  resolvedDirectionTracks: number;
  unresolvedDirectionTracks: number;
  dominantOctant: ImageDirectionOctant | "none";
  dominantOctantSharePercent: number;
  octantCounts: Record<ImageDirectionOctant, number>;
  rationale: string;
};

export type DirectionalBalanceTrack = { id: string; points: Pick<CasaPoint, "x" | "y" | "frame">[] };

function emptyCounts(): Record<ImageDirectionOctant, number> {
  return Object.fromEntries(IMAGE_DIRECTION_OCTANTS.map(octant => [octant, 0])) as Record<ImageDirectionOctant, number>;
}

/**
 * Describes net first-to-last trajectory directions in image coordinates for technical review.
 * It does not compensate motion, alter trajectories, or infer specimen behavior or biological outcomes.
 */
export function buildTrackDirectionalBalanceEvidence(tracks: DirectionalBalanceTrack[], minimumNetDisplacementPx = 1): TrackDirectionalBalanceEvidence {
  const octantCounts = emptyCounts();
  let acceptedTracks = 0;
  let resolvedDirectionTracks = 0;
  let unresolvedDirectionTracks = 0;

  tracks.forEach(track => {
    const points = track.points.filter(point => Number.isFinite(point.x) && Number.isFinite(point.y)).sort((a, b) => a.frame - b.frame);
    if (!points.length) return;
    acceptedTracks += 1;
    const first = points[0];
    const last = points.at(-1)!;
    const dx = last.x - first.x;
    const dy = last.y - first.y;
    if (Math.hypot(dx, dy) < minimumNetDisplacementPx) {
      unresolvedDirectionTracks += 1;
      return;
    }
    const octantIndex = ((Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) % 8) + 8) % 8;
    octantCounts[IMAGE_DIRECTION_OCTANTS[octantIndex]] += 1;
    resolvedDirectionTracks += 1;
  });

  const dominantOctant = IMAGE_DIRECTION_OCTANTS.reduce((best, octant) => octantCounts[octant] > octantCounts[best] ? octant : best, IMAGE_DIRECTION_OCTANTS[0]);
  const dominantCount = octantCounts[dominantOctant];
  const dominantOctantSharePercent = resolvedDirectionTracks ? (dominantCount / resolvedDirectionTracks) * 100 : 0;
  const rationale = resolvedDirectionTracks
    ? `${dominantCount} of ${resolvedDirectionTracks} retained tracks have first-to-last image-coordinate displacement in the ${dominantOctant} octant. This is technical trajectory direction context only and is not motion compensation or a biological interpretation.`
    : "No retained tracks exceeded the technical net-displacement threshold for image-coordinate direction context.";
  return { acceptedTracks, resolvedDirectionTracks, unresolvedDirectionTracks, dominantOctant: resolvedDirectionTracks ? dominantOctant : "none", dominantOctantSharePercent, octantCounts, rationale };
}
