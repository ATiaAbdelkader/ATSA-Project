import type { FootageProvenance } from "./footageProvenance";

export function requiresPartialCameraCaptureAcknowledgement(
  footageProvenance: FootageProvenance | undefined,
  acknowledged: boolean,
  acknowledgedMethodFingerprint?: string,
  activeMethodFingerprint?: string,
) {
  return footageProvenance?.source === "camera"
    && footageProvenance.recordingStopReason === "stream_ended"
    && (!acknowledged || acknowledgedMethodFingerprint !== activeMethodFingerprint);
}
