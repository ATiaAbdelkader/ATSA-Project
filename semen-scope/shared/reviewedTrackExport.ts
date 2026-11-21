export const REVIEWED_TRACK_EXPORT_NOTICE = "Exports only browser-local operator review markers and existing trajectory metrics for technical review. It does not change tracks, kinematics, classifications, calibration, or biological interpretation.";

export type ReviewedTrackExportRow = {
  id: string;
  metrics: { frames: number; confidence: number; progressive: boolean; motile: boolean; vcl: number; vsl: number; vap: number; lin: number; str: number };
};

function escapeCsv(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function safeSegment(value: string) {
  return value.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "semenscope";
}

function formatClassification(track: ReviewedTrackExportRow) {
  return track.metrics.progressive ? "Progressive" : track.metrics.motile ? "Motile non-progressive" : "Non-motile";
}

export function buildReviewedTrackCsv(input: { sampleName: string; frameRate: number; reviewedTrackIds: string[]; tracks: ReviewedTrackExportRow[] }) {
  const reviewed = input.tracks.filter(track => input.reviewedTrackIds.includes(track.id));
  const rows = [
    ["Sample", "Track ID", "Frames", "Confidence", "Existing classification", "VCL (µm/s)", "VSL (µm/s)", "VAP (µm/s)", "LIN", "STR", "Configured frame rate (fps)"],
    ...reviewed.map(track => [input.sampleName, track.id, track.metrics.frames, track.metrics.confidence.toFixed(3), formatClassification(track), track.metrics.vcl.toFixed(3), track.metrics.vsl.toFixed(3), track.metrics.vap.toFixed(3), track.metrics.lin.toFixed(3), track.metrics.str.toFixed(3), input.frameRate]),
    ["Safeguard", REVIEWED_TRACK_EXPORT_NOTICE, "", "", "", "", "", "", "", "", ""],
  ];
  return rows.map(row => row.map(escapeCsv).join(",")).join("\n");
}

export function buildReviewedTrackCsvFilename(sampleName: string) {
  return `${safeSegment(sampleName)}-technical-reviewed-tracks.csv`;
}
