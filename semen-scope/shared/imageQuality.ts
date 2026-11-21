export type FrameQualitySample = {
  brightness: number;
  contrast: number;
  focus: number;
};

export type CaptureQualityStatus = "acceptable" | "review" | "poor";

export type CaptureQuality = FrameQualitySample & {
  status: CaptureQualityStatus;
  rationale: string;
  sampledFrames: number;
};

function mean(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

export function summarizeCaptureQuality(samples: FrameQualitySample[]): CaptureQuality {
  const brightness = mean(samples.map(sample => sample.brightness));
  const contrast = mean(samples.map(sample => sample.contrast));
  const focus = mean(samples.map(sample => sample.focus));
  const sampledFrames = samples.length;

  if (!sampledFrames || contrast < 9 || focus < 4) {
    return { brightness, contrast, focus, sampledFrames, status: "poor", rationale: "Very low contrast or edge-detail signal; reacquire or check focus and illumination before interpretation." };
  }
  if (brightness < 35 || brightness > 220 || contrast < 18 || focus < 12) {
    return { brightness, contrast, focus, sampledFrames, status: "review", rationale: "Capture quality warrants review: confirm illumination, focus, and debris/background separation." };
  }
  return { brightness, contrast, focus, sampledFrames, status: "acceptable", rationale: "Technical brightness, contrast, and edge-detail indicators were within the workspace review band." };
}
