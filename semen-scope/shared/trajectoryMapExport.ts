export const TRAJECTORY_MAP_EXPORT_NOTICE = "Exports the browser-local trajectory map for visual technical review only. The image is not stored by SemenScope and does not change trajectories, kinematics, classifications, or biological interpretation.";

function safeSegment(value: string) {
  return value.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "semenscope";
}

export function buildTrajectoryMapPngFilename(sampleName: string) {
  return `${safeSegment(sampleName)}-trajectory-map.png`;
}
