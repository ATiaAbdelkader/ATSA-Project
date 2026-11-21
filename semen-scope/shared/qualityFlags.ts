export function buildQualityFlags({
  validTrackCount,
  sampledFrames,
  availableFrames,
  duration,
  meanConfidence,
  captureQuality,
  fieldStability,
}: {
  validTrackCount: number;
  sampledFrames: number;
  availableFrames: number;
  duration: number;
  meanConfidence?: number;
  captureQuality?: { status: "acceptable" | "review" | "poor"; rationale: string };
  fieldStability?: { status: "acceptable" | "review" | "poor"; rationale: string };
}) {
  const flags = [
    "Scientific review required: automated trajectory estimates are not a diagnostic result.",
    "Calibration review required: velocity and distance outputs depend on the entered µm/px and fps values.",
    `Processed ${sampledFrames} sampled frames from ${availableFrames} available frames.`,
  ];
  if (validTrackCount < 20) flags.push("Low valid-track count: consider a longer clip, adjusted sensitivity, or improved contrast before interpreting summary values.");
  if (duration < 2) flags.push("Short clip: this one-second acquisition provides a limited motion window; confirm with laboratory protocol.");
  if (meanConfidence !== undefined && meanConfidence < 0.6) flags.push("Low association confidence: review direction, speed, and distance controls before interpreting linked trajectories.");
  if (captureQuality?.status !== "acceptable") flags.push(`Capture quality ${captureQuality?.status}: ${captureQuality?.rationale}`);
  if (fieldStability?.status !== "acceptable") flags.push(`Field stability ${fieldStability?.status}: ${fieldStability?.rationale}`);
  return flags;
}
