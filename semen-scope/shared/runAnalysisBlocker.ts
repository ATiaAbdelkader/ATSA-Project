export type RunAnalysisBlockerInput = {
  recording: boolean;
  partialCameraCaptureReviewRequired: boolean;
  mediaError?: string;
};

export function getRunAnalysisDisabledReason({ recording, partialCameraCaptureReviewRequired, mediaError }: RunAnalysisBlockerInput) {
  if (recording) return "Stop the active local camera recording before starting analysis";
  if (partialCameraCaptureReviewRequired) return "Acknowledge technical review of the partial camera clip before starting analysis";
  if (mediaError) return "Replace the active footage with a browser-decodable H.264 MP4 or WebM clip before starting analysis";
  return undefined;
}
