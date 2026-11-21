import type { TechnicalReviewWindow } from "./reviewWindow";

export const REVIEW_WINDOW_EXPORT_NOTICE = "Exports the browser-local technical review window only. The CSV does not contain footage, does not alter analysis output, and is not a diagnostic, fertility, breeding, treatment, or dose-release result.";

function csvField(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function safeSegment(value: string) {
  return value.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "semenscope-review-window";
}

export function buildTechnicalReviewWindowCsv(window: TechnicalReviewWindow, input: { sampleName: string; frameRate: number }) {
  const headers = ["sample_name", "start_frame", "start_time_seconds", "end_frame", "end_time_seconds", "configured_frame_rate", "technical_review_notice"];
  const values = [input.sampleName, window.startFrame, window.startTimeSeconds.toFixed(3), window.endFrame ?? "", window.endTimeSeconds?.toFixed(3) ?? "", input.frameRate, "Browser-local technical review window only; does not alter analysis output."];
  return `${headers.join(",")}\n${values.map(csvField).join(",")}\n`;
}

export function buildTechnicalReviewWindowCsvFilename(sampleName: string) {
  return `${safeSegment(sampleName)}-technical-review-window.csv`;
}
