export interface PlanarPoint {
  x: number;
  y: number;
}

const EPSILON = 1e-8;

export function movingAveragePath(points: PlanarPoint[], radius: number): PlanarPoint[] {
  if (radius <= 0 || points.length <= radius * 2 + 1) {
    return points.map(point => ({ x: point.x, y: point.y }));
  }

  return points.map((point, index) => {
    if (index < radius || index >= points.length - radius) {
      return { x: point.x, y: point.y };
    }
    const window = points.slice(index - radius, index + radius + 1);
    return {
      x: window.reduce((sum, item) => sum + item.x, 0) / window.length,
      y: window.reduce((sum, item) => sum + item.y, 0) / window.length,
    };
  });
}

function signedLateralDeviation(
  point: PlanarPoint,
  averaged: PlanarPoint[],
  index: number
): number {
  const before = averaged[Math.max(0, index - 1)] ?? averaged[index];
  const after = averaged[Math.min(averaged.length - 1, index + 1)] ?? averaged[index];
  const dx = after.x - before.x;
  const dy = after.y - before.y;
  const magnitude = Math.hypot(dx, dy);
  if (magnitude < EPSILON) return 0;
  return ((point.x - averaged[index].x) * -dy + (point.y - averaged[index].y) * dx) / magnitude;
}

/**
 * Beat cross frequency from sign changes of the lateral head deviation around
 * the smoothed average path. Deterministic and derived only from the track.
 */
export function computeBeatCrossFrequency(
  path: PlanarPoint[],
  smoothed: PlanarPoint[],
  fps: number,
  durationSeconds?: number
): number {
  if (path.length < 3 || smoothed.length !== path.length || fps <= 0) return 0;

  let crossings = 0;
  let previousSign = 0;
  for (let index = 0; index < path.length; index++) {
    const deviation = signedLateralDeviation(path[index], smoothed, index);
    const sign = Math.abs(deviation) < 0.25 ? 0 : Math.sign(deviation);
    if (sign !== 0 && previousSign !== 0 && sign !== previousSign) crossings += 1;
    if (sign !== 0) previousSign = sign;
  }

  const duration = durationSeconds ?? (path.length - 1) / fps;
  return duration > 0 ? crossings / duration : 0;
}

function normalizeDegrees(angle: number): number {
  let normalized = angle;
  while (normalized > Math.PI) normalized -= 2 * Math.PI;
  while (normalized < -Math.PI) normalized += 2 * Math.PI;
  return normalized * (180 / Math.PI);
}

/**
 * Mean absolute change in direction between consecutive path segments.
 * Deterministic and independent of frame rate.
 */
export function computeMeanAngularDisplacement(path: PlanarPoint[]): number {
  if (path.length < 3) return 0;

  const angles = path.slice(1).map((point, index) =>
    Math.atan2(point.y - path[index].y, point.x - path[index].x)
  );
  if (angles.length < 2) return 0;

  const deltas = angles
    .slice(1)
    .map((angle, index) => Math.abs(normalizeDegrees(angle - angles[index])));
  return deltas.reduce((sum, value) => sum + value, 0) / deltas.length;
}
