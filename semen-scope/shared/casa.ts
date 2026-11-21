export type CasaPoint = {
  frame: number;
  x: number;
  y: number;
  score?: number;
};

export type CasaThresholds = {
  motilityVclMin: number;
  motilityVslMin: number;
  progressiveStrMin: number;
  progressiveVapMin: number;
  maxLinkDistancePx: number;
  maxTurnDegrees: number;
  maxMissedFrames: number;
  linkDirectionWeight: number;
  linkDistanceWeight: number;
  linkSpeedWeight: number;
  minTrackConfidence: number;
  detectionSensitivity: number;
  minTrackFrames: number;
  vapSmoothingWindow: number;
  visualTrailLength: number;
};

export type CasaCalibration = {
  micronsPerPixel: number;
  frameRate: number;
};

export type CasaTrackMetrics = {
  id: string;
  frames: number;
  vcl: number;
  vsl: number;
  vap: number;
  lin: number;
  str: number;
  wob: number;
  alh: number;
  bcf: number;
  dance: number;
  mad: number;
  alhMax: number;
  fractalDimension: number;
  confidence: number;
  motile: boolean;
  motileByVslVap: boolean;
  progressive: boolean;
};

export type CasaSummary = {
  totalTrackedCells: number;
  validTracks: number;
  motility: number;
  progressiveMotility: number;
  vcl: number;
  vsl: number;
  vap: number;
  lin: number;
  str: number;
  wob: number;
  alh: number;
  bcf: number;
  dance: number;
  mad: number;
  alhMax: number;
  fractalDimension: number;
  meanConfidence: number;
  vslVapMotility: number;
};

export const DEFAULT_CASA_THRESHOLDS: CasaThresholds = {
  motilityVclMin: 10,
  motilityVslMin: 4,
  progressiveStrMin: 70,
  progressiveVapMin: 25,
  maxLinkDistancePx: 18,
  maxTurnDegrees: 120,
  maxMissedFrames: 2,
  linkDirectionWeight: 0.45,
  linkDistanceWeight: 0.35,
  linkSpeedWeight: 0.2,
  minTrackConfidence: 0.45,
  detectionSensitivity: 30,
  minTrackFrames: 6,
  vapSmoothingWindow: 5,
  visualTrailLength: 12,
};

export const DEFAULT_CASA_CALIBRATION: CasaCalibration = {
  micronsPerPixel: 0.5,
  frameRate: 25,
};

const EPSILON = 1e-8;

function distance(a: CasaPoint, b: CasaPoint) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function mean(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function movingAverage(points: CasaPoint[], radius = 2): CasaPoint[] {
  if (points.length <= radius * 2 + 1) return points.map(point => ({ ...point }));
  return points.map((point, index) => {
    if (index < radius || index >= points.length - radius) return { ...point };
    const from = Math.max(0, index - radius);
    const to = Math.min(points.length, index + radius + 1);
    const window = points.slice(from, to);
    return {
      frame: point.frame,
      x: mean(window.map(item => item.x)),
      y: mean(window.map(item => item.y)),
    };
  });
}

function normalizeDegrees(angle: number) {
  let normalized = angle;
  while (normalized > Math.PI) normalized -= 2 * Math.PI;
  while (normalized < -Math.PI) normalized += 2 * Math.PI;
  return normalized * (180 / Math.PI);
}

function signedLateralDeviation(point: CasaPoint, averaged: CasaPoint[], index: number) {
  const before = averaged[Math.max(0, index - 1)] ?? averaged[index];
  const after = averaged[Math.min(averaged.length - 1, index + 1)] ?? averaged[index];
  const dx = after.x - before.x;
  const dy = after.y - before.y;
  const magnitude = Math.hypot(dx, dy);
  if (magnitude < EPSILON) return 0;
  return ((point.x - averaged[index].x) * -dy + (point.y - averaged[index].y) * dx) / magnitude;
}

export function calculateTrackMetrics(
  id: string,
  points: CasaPoint[],
  calibration: CasaCalibration,
  thresholds: CasaThresholds,
  confidence = 1,
): CasaTrackMetrics {
  if (points.length < 2) {
    return {
      id,
      frames: points.length,
      vcl: 0,
      vsl: 0,
      vap: 0,
      lin: 0,
      str: 0,
      wob: 0,
      alh: 0,
      bcf: 0,
      dance: 0,
      mad: 0,
      alhMax: 0,
      fractalDimension: 1,
      confidence,
      motile: false,
      motileByVslVap: false,
      progressive: false,
    };
  }

  const ordered = [...points].sort((a, b) => a.frame - b.frame);
  const framesElapsed = Math.max(1, ordered.at(-1)!.frame - ordered[0].frame);
  const elapsedSeconds = framesElapsed / Math.max(calibration.frameRate, EPSILON);
  const micronsPerPixel = Math.max(calibration.micronsPerPixel, EPSILON);
  const curvilinearPixels = ordered.slice(1).reduce((sum, point, index) => sum + distance(ordered[index], point), 0);
  const straightPixels = distance(ordered[0], ordered.at(-1)!);
  const averaged = movingAverage(ordered, Math.max(1, Math.floor(thresholds.vapSmoothingWindow / 2)));
  const averagePixels = averaged.slice(1).reduce((sum, point, index) => sum + distance(averaged[index], point), 0);

  const vcl = (curvilinearPixels * micronsPerPixel) / elapsedSeconds;
  const vsl = (straightPixels * micronsPerPixel) / elapsedSeconds;
  const vap = (averagePixels * micronsPerPixel) / elapsedSeconds;
  const lin = vcl > EPSILON ? (vsl / vcl) * 100 : 0;
  const str = vap > EPSILON ? (vsl / vap) * 100 : 0;
  const wob = vcl > EPSILON ? (vap / vcl) * 100 : 0;

  const deviations = ordered.map((point, index) => Math.abs(signedLateralDeviation(point, averaged, index)));
  const alh = mean(deviations) * 2 * micronsPerPixel;
  const alhMax = Math.max(...deviations, 0) * 2 * micronsPerPixel;
  const signedDeviations = ordered.map((point, index) => signedLateralDeviation(point, averaged, index));
  let crossings = 0;
  let previousSign = 0;
  signedDeviations.forEach(value => {
    const sign = Math.abs(value) < 0.25 ? 0 : Math.sign(value);
    if (sign !== 0 && previousSign !== 0 && sign !== previousSign) crossings += 1;
    if (sign !== 0) previousSign = sign;
  });
  const bcf = crossings / elapsedSeconds;
  const angles = ordered.slice(1).map((point, index) => Math.atan2(point.y - ordered[index].y, point.x - ordered[index].x));
  const mad = mean(angles.slice(1).map((angle, index) => Math.abs(normalizeDegrees(angle - angles[index]))));
  const dance = vcl * alh;
  const motile = vcl >= thresholds.motilityVclMin;
  const motileByVslVap = vsl >= thresholds.motilityVslMin && vap >= thresholds.progressiveVapMin;
  const progressive = motile && str >= thresholds.progressiveStrMin && vap >= thresholds.progressiveVapMin;
  const pathRatio = curvilinearPixels / Math.max(straightPixels, EPSILON);
  const fractalDimension = pathRatio <= 1 + EPSILON
    ? 1
    : Math.min(2, Math.max(1, Math.log(Math.max(2, ordered.length - 1)) / Math.log(pathRatio)));

  return { id, frames: ordered.length, vcl, vsl, vap, lin, str, wob, alh, bcf, dance, mad, alhMax, fractalDimension, confidence, motile, motileByVslVap, progressive };
}

export function summarizeTracks(metrics: CasaTrackMetrics[]): CasaSummary {
  const valid = metrics.filter(metric => metric.frames >= 2);
  const motile = valid.filter(metric => metric.motile);
  const progressive = valid.filter(metric => metric.progressive);
  const metricAverage = (field: keyof Pick<CasaTrackMetrics, "vcl" | "vsl" | "vap" | "lin" | "str" | "wob" | "alh" | "bcf" | "dance" | "mad" | "alhMax" | "fractalDimension" | "confidence">) =>
    mean(valid.map(metric => metric[field] as number));

  return {
    totalTrackedCells: metrics.length,
    validTracks: valid.length,
    motility: valid.length ? (motile.length / valid.length) * 100 : 0,
    progressiveMotility: valid.length ? (progressive.length / valid.length) * 100 : 0,
    vcl: metricAverage("vcl"),
    vsl: metricAverage("vsl"),
    vap: metricAverage("vap"),
    lin: metricAverage("lin"),
    str: metricAverage("str"),
    wob: metricAverage("wob"),
    alh: metricAverage("alh"),
    bcf: metricAverage("bcf"),
    dance: metricAverage("dance"),
    mad: metricAverage("mad"),
    alhMax: metricAverage("alhMax"),
    fractalDimension: metricAverage("fractalDimension"),
    meanConfidence: metricAverage("confidence"),
    vslVapMotility: valid.length ? (valid.filter(metric => metric.motileByVslVap).length / valid.length) * 100 : 0,
  };
}

export function roundMetric(value: number, digits = 1) {
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
}
