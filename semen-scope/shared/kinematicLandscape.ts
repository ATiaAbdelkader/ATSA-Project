export type LandscapePoint = {
  id: string;
  vcl: number;
  lin: number;
};

export type LandscapeExtent = { min: number; max: number };

function extent(values: number[]): LandscapeExtent {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) {
    const padding = Math.max(Math.abs(min) * 0.15, 1);
    return { min: min - padding, max: max + padding };
  }
  const padding = (max - min) * 0.08;
  return { min: Math.max(0, min - padding), max: max + padding };
}

export function getKinematicLandscapeExtents(points: LandscapePoint[]) {
  const valid = points.filter(point => Number.isFinite(point.vcl) && Number.isFinite(point.lin));
  if (!valid.length) return undefined;
  return { vcl: extent(valid.map(point => point.vcl)), lin: extent(valid.map(point => point.lin)) };
}

export function normalizeLandscapeValue(value: number, scale: LandscapeExtent) {
  return (value - scale.min) / (scale.max - scale.min);
}
