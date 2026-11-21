export type ReviewBookmark = { id: string; frame: number; timeSeconds: number; label: string; operatorLabel?: string };

export function normalizeReviewBookmarkOperatorLabel(value?: string) {
  const normalized = value?.replace(/\s+/g, " ").trim().slice(0, 80);
  return normalized || undefined;
}

export function createReviewBookmark(input: { currentTimeSeconds: number; frameRate: number; operatorLabel?: string }): ReviewBookmark {
  const frameRate = Math.max(1, Number.isFinite(input.frameRate) ? input.frameRate : 1);
  const frame = Math.max(0, Math.round((Number.isFinite(input.currentTimeSeconds) ? input.currentTimeSeconds : 0) * frameRate));
  const timeSeconds = frame / frameRate;
  return { id: `frame-${frame}`, frame, timeSeconds, label: `Frame ${frame} · ${timeSeconds.toFixed(3)} s`, operatorLabel: normalizeReviewBookmarkOperatorLabel(input.operatorLabel) };
}

/** Retains unique, chronological local review references without changing the video or analysis. */
export function addReviewBookmark(bookmarks: ReviewBookmark[], bookmark: ReviewBookmark) {
  return bookmarks.some(item => item.id === bookmark.id) ? bookmarks : [...bookmarks, bookmark].sort((left, right) => left.frame - right.frame);
}

/** Removes one local technical review reference without changing the video or analysis. */
export function removeReviewBookmark(bookmarks: ReviewBookmark[], bookmarkId: string) {
  return bookmarks.filter(bookmark => bookmark.id !== bookmarkId);
}

/** Updates only the optional browser-local technical note; frame identity and timing remain unchanged. */
export function updateReviewBookmarkOperatorLabel(bookmarks: ReviewBookmark[], bookmarkId: string, operatorLabel?: string) {
  const normalizedOperatorLabel = normalizeReviewBookmarkOperatorLabel(operatorLabel);
  return bookmarks.map(bookmark => bookmark.id === bookmarkId ? { ...bookmark, operatorLabel: normalizedOperatorLabel } : bookmark);
}
