export function getKeyboardReviewFrameStepDirection(input: { key: string; altKey: boolean; ctrlKey: boolean; metaKey: boolean; targetIsEditable: boolean }) {
  if (input.altKey || input.ctrlKey || input.metaKey || input.targetIsEditable) return undefined;
  if (input.key === "[") return -1 as const;
  if (input.key === "]") return 1 as const;
  return undefined;
}
