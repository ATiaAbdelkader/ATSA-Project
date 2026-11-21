export const REVIEW_PLAYBACK_RATES = [0.5, 1, 2] as const;

export function resolveReviewPlaybackRate(value: number) {
  return REVIEW_PLAYBACK_RATES.includes(value as (typeof REVIEW_PLAYBACK_RATES)[number]) ? value : 1;
}

/** Replacement footage begins local technical review at normal speed. */
export function getReviewPlaybackRateAfterFootageChange() {
  return 1;
}
