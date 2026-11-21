export function shouldWarnBeforeBrowserExit({ recording, analyzing, preCaptureStabilizing, localTechnicalAnnotations }: { recording: boolean; analyzing: boolean; preCaptureStabilizing: boolean; localTechnicalAnnotations?: boolean }) {
  return recording || analyzing || preCaptureStabilizing || Boolean(localTechnicalAnnotations);
}
