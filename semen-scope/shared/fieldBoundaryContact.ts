import type { CasaPoint } from "./casa";

export type FieldBoundaryContactEvidence = {
  acceptedTracks: number;
  boundaryZonePercent: number;
  totalPoints: number;
  boundaryPoints: number;
  boundaryPointPercent: number;
  tracksWithBoundaryPoints: number;
  tracksStartingInBoundary: number;
  tracksEndingInBoundary: number;
  rationale: string;
};

export type BoundaryContactTrack = { id: string; points: Pick<CasaPoint, "x" | "y">[] };

/**
 * Describes retained trajectory proximity to the image boundary for technical review.
 * It does not reject trajectories, alter quality flags, or infer biological meaning from edge contact.
 */
export function buildFieldBoundaryContactEvidence({
  tracks,
  width,
  height,
  boundaryZonePercent = 5,
}: {
  tracks: BoundaryContactTrack[];
  width: number;
  height: number;
  boundaryZonePercent?: number;
}): FieldBoundaryContactEvidence {
  const zonePercent = Math.min(25, Math.max(1, boundaryZonePercent));
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const xMargin = safeWidth * (zonePercent / 100);
  const yMargin = safeHeight * (zonePercent / 100);
  const inBoundaryZone = (point: Pick<CasaPoint, "x" | "y">) => point.x <= xMargin || point.x >= safeWidth - xMargin || point.y <= yMargin || point.y >= safeHeight - yMargin;
  let acceptedTracks = 0;
  let totalPoints = 0;
  let boundaryPoints = 0;
  let tracksWithBoundaryPoints = 0;
  let tracksStartingInBoundary = 0;
  let tracksEndingInBoundary = 0;

  tracks.forEach(track => {
    const points = track.points.filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));
    if (!points.length) return;
    acceptedTracks += 1;
    totalPoints += points.length;
    const boundaryCount = points.filter(inBoundaryZone).length;
    boundaryPoints += boundaryCount;
    if (boundaryCount) tracksWithBoundaryPoints += 1;
    if (inBoundaryZone(points[0])) tracksStartingInBoundary += 1;
    if (inBoundaryZone(points.at(-1)!)) tracksEndingInBoundary += 1;
  });

  const boundaryPointPercent = totalPoints ? (boundaryPoints / totalPoints) * 100 : 0;
  const rationale = totalPoints
    ? `${boundaryPoints} of ${totalPoints} retained trajectory points fall within the outer ${zonePercent}% image boundary zone. The observation is technical frame context only and does not reject tracks or change measurements.`
    : `No retained trajectory points were available to assess the outer ${zonePercent}% image boundary zone; this is technical frame context only.`;
  return { acceptedTracks, boundaryZonePercent: zonePercent, totalPoints, boundaryPoints, boundaryPointPercent, tracksWithBoundaryPoints, tracksStartingInBoundary, tracksEndingInBoundary, rationale };
}
