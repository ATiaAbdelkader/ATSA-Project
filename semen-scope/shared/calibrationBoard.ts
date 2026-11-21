export type CalibrationBoardPoint = { x: number; y: number };

export type CalibrationBoardEvidence = {
  boardIntervalMicrons: number;
  pixelDistance: number;
  micronsPerPixel: number;
  angleDegrees: number;
  capturedAt: string;
  imageWidth: number;
  imageHeight: number;
  method: "manual-two-point-reference";
};

export function attachCalibrationEvidence<T extends object>(payload: T, calibrationEvidence?: CalibrationBoardEvidence): T & { calibrationEvidence?: CalibrationBoardEvidence } {
  return calibrationEvidence ? { ...payload, calibrationEvidence } : payload;
}

export function getCalibrationProvenance(calibrationEvidence?: CalibrationBoardEvidence) {
  return calibrationEvidence ? "board-referenced" as const : "manual-unverified" as const;
}

export function estimateCalibrationBoardScale({
  first,
  second,
  boardIntervalMicrons,
  imageWidth,
  imageHeight,
  capturedAt = new Date().toISOString(),
}: {
  first: CalibrationBoardPoint;
  second: CalibrationBoardPoint;
  boardIntervalMicrons: number;
  imageWidth: number;
  imageHeight: number;
  capturedAt?: string;
}): CalibrationBoardEvidence | undefined {
  const pixelDistance = Math.hypot(second.x - first.x, second.y - first.y);
  if (!Number.isFinite(boardIntervalMicrons) || boardIntervalMicrons <= 0 || pixelDistance < 12) return undefined;
  return {
    boardIntervalMicrons,
    pixelDistance,
    micronsPerPixel: boardIntervalMicrons / pixelDistance,
    angleDegrees: Math.atan2(second.y - first.y, second.x - first.x) * (180 / Math.PI),
    capturedAt,
    imageWidth,
    imageHeight,
    method: "manual-two-point-reference",
  };
}
