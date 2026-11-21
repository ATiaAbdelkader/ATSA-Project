export interface CameraFrameRateReviewInput {
  actualFrameRate?: number;
  configuredFrameRate: number;
}

export interface CameraFrameRateReview {
  needsReview: boolean;
  message?: string;
}

/** Flags a material browser-reported camera-rate difference without changing the configured method. */
export function buildCameraFrameRateReview({ actualFrameRate, configuredFrameRate }: CameraFrameRateReviewInput): CameraFrameRateReview {
  if (!Number.isFinite(actualFrameRate) || !actualFrameRate || actualFrameRate <= 0 || !Number.isFinite(configuredFrameRate) || configuredFrameRate <= 0) return { needsReview: false };
  if (Math.abs(actualFrameRate - configuredFrameRate) < 0.5) return { needsReview: false };
  const actual = Math.round(actualFrameRate * 10) / 10;
  return { needsReview: true, message: `Browser camera reports ${actual} fps while the configured analysis rate is ${configuredFrameRate} fps. No setting has been changed automatically; confirm the method before analysis.` };
}
