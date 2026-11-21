import { normalizeReviewBookmarkOperatorLabel, type ReviewBookmark } from "@shared/reviewBookmarks";
import type { TechnicalReviewWindow } from "@shared/reviewWindow";

export const REVIEW_ANNOTATIONS_EXPORT_NOTICE = "Exports browser-local technical review annotations only. It contains no footage and does not change tracks, calibration, analysis output, classifications, or biological interpretation.";
export const REVIEW_ANNOTATIONS_IMPORT_NOTICE = "Imports browser-local technical review annotations only after compatible frame-rate, output, and track checks. It does not change video, calibration, analysis output, classifications, or biological interpretation.";
export const REVIEW_ANNOTATIONS_ACTIVE_ANALYSIS_BLOCKER = "Complete or cancel the active local analysis before importing technical review annotations so live playback remains synchronized.";
export const MAX_TECHNICAL_REVIEW_ANNOTATIONS_BYTES = 256 * 1024;

export function getReviewAnnotationsImportBlocker(isAnalyzing: boolean) {
  return isAnalyzing ? REVIEW_ANNOTATIONS_ACTIVE_ANALYSIS_BLOCKER : undefined;
}

export function getReviewAnnotationsFileSizeBlocker(sizeBytes: number) {
  if (!Number.isFinite(sizeBytes) || sizeBytes < 0) return "The local technical annotation file size is invalid.";
  return sizeBytes > MAX_TECHNICAL_REVIEW_ANNOTATIONS_BYTES
    ? "The local technical annotation file is too large. Technical review annotations must be 256 KiB or smaller and contain no footage."
    : undefined;
}

export function getReviewAnnotationsDurationBlocker(input: { bookmarks: ReviewBookmark[]; reviewWindow?: TechnicalReviewWindow; durationSeconds: number }) {
  if (!Number.isFinite(input.durationSeconds) || input.durationSeconds <= 0) return "The active local footage duration is unavailable, so technical review annotations were not applied.";
  const annotationTimes = [
    ...input.bookmarks.map(bookmark => bookmark.timeSeconds),
    input.reviewWindow?.startTimeSeconds,
    input.reviewWindow?.endTimeSeconds,
  ].filter((timeSeconds): timeSeconds is number => typeof timeSeconds === "number");
  return annotationTimes.some(timeSeconds => timeSeconds > input.durationSeconds + 0.0005)
    ? "The annotation file contains a bookmark or review-window boundary outside the active local footage duration."
    : undefined;
}

export function createClearedTechnicalReviewAnnotations() {
  return { bookmarks: [] as ReviewBookmark[], reviewWindow: undefined as TechnicalReviewWindow | undefined, reviewedTrackIds: [] as string[] };
}

export function buildTechnicalReviewAnnotationStatus(input: { bookmarks: ReviewBookmark[]; reviewWindow?: TechnicalReviewWindow; reviewedTrackCount: number }) {
  const bookmarkCount = input.bookmarks.length;
  const hasReviewWindow = Boolean(input.reviewWindow);
  const reviewedTrackCount = Math.max(0, Math.floor(input.reviewedTrackCount));
  const summaryParts = [
    `${bookmarkCount} bookmark${bookmarkCount === 1 ? "" : "s"}`,
    hasReviewWindow ? "review window set" : "no review window",
    `${reviewedTrackCount} track${reviewedTrackCount === 1 ? "" : "s"} marked`,
  ];
  return { bookmarkCount, hasReviewWindow, reviewedTrackCount, hasAnnotations: Boolean(bookmarkCount || hasReviewWindow || reviewedTrackCount), summary: summaryParts.join(" · ") };
}

function safeSegment(value: string) {
  return value.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").toLowerCase() || "semenscope";
}

export function buildTechnicalReviewAnnotationsJson(input: { sampleName: string; configuredFrameRate: number; outputFingerprint: string; bookmarks: ReviewBookmark[]; reviewWindow?: TechnicalReviewWindow; reviewedTrackIds: string[] }) {
  return JSON.stringify({
    format: "SemenScope browser-local technical review annotations v1",
    sampleName: input.sampleName,
    configuredFrameRate: input.configuredFrameRate,
    outputFingerprint: input.outputFingerprint,
    bookmarks: input.bookmarks.map(bookmark => ({ id: bookmark.id, label: bookmark.label, frame: bookmark.frame, timeSeconds: bookmark.timeSeconds, operatorLabel: bookmark.operatorLabel ?? null })),
    reviewWindow: input.reviewWindow ?? null,
    reviewedTrackIds: [...input.reviewedTrackIds].sort(),
    safeguard: REVIEW_ANNOTATIONS_EXPORT_NOTICE,
  }, null, 2);
}

export function buildTechnicalReviewAnnotationsFilename(sampleName: string) {
  return `${safeSegment(sampleName)}-technical-review-annotations.json`;
}

function isFiniteNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isFrameTimeAligned(frame: number, timeSeconds: number, configuredFrameRate: number) {
  return Math.abs(timeSeconds - frame / configuredFrameRate) <= 0.0005;
}

export function parseTechnicalReviewAnnotationsJson(content: string) {
  if (content.length > MAX_TECHNICAL_REVIEW_ANNOTATIONS_BYTES) throw new Error("The local technical annotation file is too large. Technical review annotations must be 256 KiB or smaller and contain no footage.");
  const parsed: unknown = JSON.parse(content);
  if (!parsed || typeof parsed !== "object") throw new Error("The annotation file is not a SemenScope technical review export.");
  const value = parsed as Record<string, unknown>;
  if (value.format !== "SemenScope browser-local technical review annotations v1" || !isFiniteNonNegativeNumber(value.configuredFrameRate) || value.configuredFrameRate <= 0 || typeof value.outputFingerprint !== "string" || !value.outputFingerprint.trim() || !Array.isArray(value.bookmarks) || !Array.isArray(value.reviewedTrackIds)) throw new Error("The annotation file has an unsupported technical review format.");
  const configuredFrameRate = value.configuredFrameRate;
  const importedBookmarkIds = new Set<string>();
  const importedBookmarkFrames = new Set<number>();
  let precedingBookmarkFrame = -1;
  const bookmarks = value.bookmarks.map((bookmark): ReviewBookmark => {
    if (!bookmark || typeof bookmark !== "object") throw new Error("The annotation file contains an invalid bookmark.");
    const item = bookmark as Record<string, unknown>;
    if (typeof item.id !== "string" || typeof item.label !== "string" || !Number.isInteger(item.frame) || !isFiniteNonNegativeNumber(item.frame) || !isFiniteNonNegativeNumber(item.timeSeconds) || !isFrameTimeAligned(item.frame, item.timeSeconds, configuredFrameRate) || (item.operatorLabel !== null && item.operatorLabel !== undefined && typeof item.operatorLabel !== "string")) throw new Error("The annotation file contains an invalid or frame-time misaligned bookmark.");
    if (item.id !== `frame-${item.frame}` || item.label !== `Frame ${item.frame} · ${item.timeSeconds.toFixed(3)} s`) throw new Error("The annotation file contains a non-canonical configured-frame bookmark reference.");
    const rawOperatorLabel = typeof item.operatorLabel === "string" ? item.operatorLabel : undefined;
    const operatorLabel = normalizeReviewBookmarkOperatorLabel(rawOperatorLabel);
    if (rawOperatorLabel !== undefined && operatorLabel !== rawOperatorLabel) throw new Error("The annotation file contains a non-canonical bookmark operator label.");
    if (importedBookmarkIds.has(item.id) || importedBookmarkFrames.has(item.frame) || item.frame <= precedingBookmarkFrame) throw new Error("The annotation file must contain unique, chronologically ordered bookmarks.");
    importedBookmarkIds.add(item.id);
    importedBookmarkFrames.add(item.frame);
    precedingBookmarkFrame = item.frame;
    return { id: item.id, label: item.label, frame: item.frame, timeSeconds: item.timeSeconds, operatorLabel };
  });
  const reviewWindow = value.reviewWindow === null || value.reviewWindow === undefined ? undefined : (() => {
    if (!value.reviewWindow || typeof value.reviewWindow !== "object") throw new Error("The annotation file contains an invalid review window.");
    const window = value.reviewWindow as Record<string, unknown>;
    if (!Number.isInteger(window.startFrame) || !isFiniteNonNegativeNumber(window.startFrame) || !isFiniteNonNegativeNumber(window.startTimeSeconds) || !isFrameTimeAligned(window.startFrame, window.startTimeSeconds, configuredFrameRate)) throw new Error("The annotation file contains an invalid or frame-time misaligned review window.");
    if (window.endFrame === undefined && window.endTimeSeconds === undefined) return { startFrame: window.startFrame, startTimeSeconds: window.startTimeSeconds } satisfies TechnicalReviewWindow;
    if (!Number.isInteger(window.endFrame) || !isFiniteNonNegativeNumber(window.endFrame) || !isFiniteNonNegativeNumber(window.endTimeSeconds) || !isFrameTimeAligned(window.endFrame, window.endTimeSeconds, configuredFrameRate) || window.endFrame <= window.startFrame) throw new Error("The annotation file contains an invalid or frame-time misaligned review window.");
    return { startFrame: window.startFrame, startTimeSeconds: window.startTimeSeconds, endFrame: window.endFrame, endTimeSeconds: window.endTimeSeconds } satisfies TechnicalReviewWindow;
  })();
  const reviewedTrackIds = value.reviewedTrackIds.map(id => {
    if (typeof id !== "string" || !id.trim() || id !== id.trim()) throw new Error("The annotation file contains an invalid reviewed-track identifier.");
    return id;
  });
  const canonicalReviewedTrackIds = [...reviewedTrackIds].sort();
  if (new Set(reviewedTrackIds).size !== reviewedTrackIds.length || canonicalReviewedTrackIds.some((trackId, index) => trackId !== reviewedTrackIds[index])) throw new Error("The annotation file must contain unique, sorted reviewed-track identifiers.");
  return { configuredFrameRate, outputFingerprint: value.outputFingerprint, bookmarks, reviewWindow, reviewedTrackIds };
}
