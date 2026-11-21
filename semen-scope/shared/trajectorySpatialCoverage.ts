import type { CasaPoint } from "./casa";

export type SpatialCoverageCell = { row: number; column: number; trackCount: number };

export type TrajectorySpatialCoverageEvidence = {
  acceptedTracks: number;
  gridColumns: number;
  gridRows: number;
  occupiedCells: number;
  totalCells: number;
  maxCellTrackCount: number;
  maxCellTrackSharePercent: number;
  edgeCellTracks: number;
  cells: SpatialCoverageCell[];
  rationale: string;
};

export type SpatialCoverageTrack = { id: string; points: Pick<CasaPoint, "x" | "y">[] };

/**
 * Describes retained-track centroid coverage across image regions for technical review.
 * It is not a concentration, density, viability, or biological inference and never changes trajectories.
 */
export function buildTrajectorySpatialCoverageEvidence({
  tracks,
  width,
  height,
  gridColumns = 3,
  gridRows = 3,
}: {
  tracks: SpatialCoverageTrack[];
  width: number;
  height: number;
  gridColumns?: number;
  gridRows?: number;
}): TrajectorySpatialCoverageEvidence {
  const columns = Math.max(1, Math.round(gridColumns));
  const rows = Math.max(1, Math.round(gridRows));
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const cells = Array.from({ length: rows * columns }, (_, index) => ({ row: Math.floor(index / columns), column: index % columns, trackCount: 0 }));
  let acceptedTracks = 0;
  let edgeCellTracks = 0;

  tracks.forEach(track => {
    const points = track.points.filter(point => Number.isFinite(point.x) && Number.isFinite(point.y));
    if (!points.length) return;
    acceptedTracks += 1;
    const centroidX = points.reduce((sum, point) => sum + point.x, 0) / points.length;
    const centroidY = points.reduce((sum, point) => sum + point.y, 0) / points.length;
    const column = Math.min(columns - 1, Math.max(0, Math.floor((centroidX / safeWidth) * columns)));
    const row = Math.min(rows - 1, Math.max(0, Math.floor((centroidY / safeHeight) * rows)));
    cells[row * columns + column].trackCount += 1;
    if (row === 0 || row === rows - 1 || column === 0 || column === columns - 1) edgeCellTracks += 1;
  });

  const occupiedCells = cells.filter(cell => cell.trackCount > 0).length;
  const maxCellTrackCount = Math.max(...cells.map(cell => cell.trackCount), 0);
  const maxCellTrackSharePercent = acceptedTracks ? (maxCellTrackCount / acceptedTracks) * 100 : 0;
  const rationale = acceptedTracks
    ? `${occupiedCells} of ${cells.length} image regions contain retained-track centroids; the largest region contains ${maxCellTrackCount} of ${acceptedTracks} centroids. This is frame-coverage context only, not a concentration or density estimate.`
    : `No retained-track centroids were available for image-region coverage context; this is not a concentration or density estimate.`;
  return { acceptedTracks, gridColumns: columns, gridRows: rows, occupiedCells, totalCells: cells.length, maxCellTrackCount, maxCellTrackSharePercent, edgeCellTracks, cells, rationale };
}
