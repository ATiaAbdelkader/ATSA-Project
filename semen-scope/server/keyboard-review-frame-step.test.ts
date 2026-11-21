import { describe, expect, it } from "vitest";
import { getKeyboardReviewFrameStepDirection } from "@shared/keyboardReviewFrameStep";

describe("browser-local keyboard review frame stepping", () => {
  it("maps unmodified bracket keys to configured-frame review steps", () => {
    expect(getKeyboardReviewFrameStepDirection({ key: "[", altKey: false, ctrlKey: false, metaKey: false, targetIsEditable: false })).toBe(-1);
    expect(getKeyboardReviewFrameStepDirection({ key: "]", altKey: false, ctrlKey: false, metaKey: false, targetIsEditable: false })).toBe(1);
  });

  it("preserves editable fields and modified browser shortcuts", () => {
    expect(getKeyboardReviewFrameStepDirection({ key: "[", altKey: false, ctrlKey: false, metaKey: false, targetIsEditable: true })).toBeUndefined();
    expect(getKeyboardReviewFrameStepDirection({ key: "]", altKey: false, ctrlKey: true, metaKey: false, targetIsEditable: false })).toBeUndefined();
  });
});
