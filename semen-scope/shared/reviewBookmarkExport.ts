import type { ReviewBookmark } from "./reviewBookmarks";

export const REVIEW_BOOKMARK_EXPORT_NOTICE = "Exports browser-local technical review bookmarks only. The CSV does not contain footage, does not alter analysis output, and is not a diagnostic, fertility, breeding, treatment, or dose-release result.";

function csvField(value: string | number | undefined) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function safeSegment(value: string) {
  return value.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "semenscope-bookmarks";
}

export function buildReviewBookmarkCsv(bookmarks: ReviewBookmark[], input: { sampleName: string; frameRate: number }) {
  const headers = ["sample_name", "bookmark_frame", "bookmark_time_seconds", "configured_frame_rate", "operator_label", "technical_review_notice"];
  const rows = bookmarks.map(bookmark => [input.sampleName, bookmark.frame, bookmark.timeSeconds.toFixed(3), input.frameRate, bookmark.operatorLabel, "Browser-local technical review bookmark only; does not alter analysis output."]);
  return `${headers.join(",")}\n${rows.map(row => row.map(csvField).join(",")).join("\n")}\n`;
}

export function buildReviewBookmarkCsvFilename(sampleName: string) {
  return `${safeSegment(sampleName)}-technical-review-bookmarks.csv`;
}
