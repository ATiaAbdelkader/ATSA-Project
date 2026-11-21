export const SELECTED_TRAJECTORY_EXPORT_NOTICE = "Exports the selected browser-local trajectory for focused technical review only. It does not change tracks, kinematics, classifications, or biological interpretation.";

function safeSegment(value: string) {
  return value.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "semenscope";
}

export function buildSelectedTrajectoryCsvFilename(sampleName: string, trackId: string) {
  return `${safeSegment(sampleName)}-${safeSegment(trackId)}-trajectory.csv`;
}
