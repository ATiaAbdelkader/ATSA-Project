export type BrowserIntakeEnvironment = {
  secureContext: boolean;
  mediaDevicesAvailable: boolean;
  getUserMediaAvailable: boolean;
  enumerateDevicesAvailable: boolean;
  mediaRecorderAvailable: boolean;
  canvasAvailable: boolean;
  mp4Playback: "" | "maybe" | "probably";
  webmPlayback: "" | "maybe" | "probably";
};

export type BrowserIntakeCapabilityItem = {
  id: "secure-context" | "camera" | "recording" | "canvas" | "mp4" | "webm";
  label: string;
  status: "available" | "review";
  note: string;
};

export type BrowserIntakeCapabilityEvidence = {
  availableCount: number;
  reviewCount: number;
  items: BrowserIntakeCapabilityItem[];
  rationale: string;
};

const isPlayable = (value: BrowserIntakeEnvironment["mp4Playback"]) => value === "probably" || value === "maybe";

export function buildBrowserIntakeCapabilityEvidence(environment: BrowserIntakeEnvironment): BrowserIntakeCapabilityEvidence {
  const cameraReady = environment.secureContext && environment.mediaDevicesAvailable && environment.getUserMediaAvailable;
  const recordingReady = cameraReady && environment.mediaRecorderAvailable;
  const items: BrowserIntakeCapabilityItem[] = [
    {
      id: "secure-context",
      label: "Secure browser context",
      status: environment.secureContext ? "available" : "review",
      note: environment.secureContext ? "Camera permissions can be requested only from a secure browser context." : "Open SemenScope over HTTPS or localhost before attempting a camera preview.",
    },
    {
      id: "camera",
      label: "Camera preview API",
      status: cameraReady ? "available" : "review",
      note: cameraReady ? "The browser can request an ordinary webcam or microscope-camera stream when you start preview." : "Camera preview is unavailable until the browser exposes media-device access in a secure context.",
    },
    {
      id: "recording",
      label: "Short clip recording",
      status: recordingReady ? "available" : "review",
      note: recordingReady ? "The browser exposes local clip recording for an active camera stream." : "Use an uploaded H.264 MP4 or WebM clip if browser recording is unavailable.",
    },
    {
      id: "canvas",
      label: "Local frame canvas",
      status: environment.canvasAvailable ? "available" : "review",
      note: environment.canvasAvailable ? "Canvas frame handling is available for browser-local footage review." : "Browser-local frame handling is unavailable in this browser environment.",
    },
    {
      id: "mp4",
      label: "H.264 MP4 playback",
      status: isPlayable(environment.mp4Playback) ? "available" : "review",
      note: isPlayable(environment.mp4Playback) ? `The browser reports ${environment.mp4Playback} support for the checked H.264 MP4 profile.` : "The checked H.264 MP4 profile was not reported as playable; use a browser-supported file or a compatible environment.",
    },
    {
      id: "webm",
      label: "WebM playback",
      status: isPlayable(environment.webmPlayback) ? "available" : "review",
      note: isPlayable(environment.webmPlayback) ? `The browser reports ${environment.webmPlayback} support for the checked WebM profile.` : "The checked WebM profile was not reported as playable; use a browser-supported file or a compatible environment.",
    },
  ];

  return {
    availableCount: items.filter(item => item.status === "available").length,
    reviewCount: items.filter(item => item.status === "review").length,
    items,
    rationale: "This permission-free capability check describes the current browser environment only. It does not request camera access, enumerate devices, capture footage, alter analysis, or establish microscope, sample, or biological suitability.",
  };
}
