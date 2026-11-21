import type { CasaCalibration, CasaPoint } from "./casa";

export type TrajectoryAuditPoint = {
  index: number;
  frame: number;
  timeSeconds: number;
  xPx: number;
  yPx: number;
  xMicrons: number;
  yMicrons: number;
};

export function getTrajectoryAuditPoint(point: CasaPoint, index: number, calibration: CasaCalibration): TrajectoryAuditPoint {
  return { index, frame: point.frame, timeSeconds: point.frame / calibration.frameRate, xPx: point.x, yPx: point.y, xMicrons: point.x * calibration.micronsPerPixel, yMicrons: point.y * calibration.micronsPerPixel };
}
