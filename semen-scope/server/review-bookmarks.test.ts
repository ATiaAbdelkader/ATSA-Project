import { describe, expect, it } from "vitest";
import { addReviewBookmark, createReviewBookmark, normalizeReviewBookmarkOperatorLabel, removeReviewBookmark, updateReviewBookmarkOperatorLabel } from "@shared/reviewBookmarks";

describe("browser-local review bookmarks", () => {
  it("rounds to calibrated frames and retains unique chronological bookmark references", () => {
    const later = createReviewBookmark({ currentTimeSeconds: 1.02, frameRate: 25 });
    const earlier = createReviewBookmark({ currentTimeSeconds: 0.08, frameRate: 25 });
    expect(later).toMatchObject({ id: "frame-26", frame: 26, timeSeconds: 1.04 });
    expect(addReviewBookmark([later], earlier).map(item => item.frame)).toEqual([2, 26]);
    expect(addReviewBookmark([earlier], earlier)).toHaveLength(1);
  });

  it("normalizes optional browser-local operator labels without changing bookmark frame identity", () => {
    const bookmark = createReviewBookmark({ currentTimeSeconds: 1.04, frameRate: 25, operatorLabel: "  check   field edge  " });
    expect(bookmark).toMatchObject({ id: "frame-26", label: "Frame 26 · 1.040 s", operatorLabel: "check field edge" });
    expect(normalizeReviewBookmarkOperatorLabel(" ")).toBeUndefined();
    expect(normalizeReviewBookmarkOperatorLabel("x".repeat(90))).toHaveLength(80);
    expect(addReviewBookmark([bookmark], { ...bookmark, operatorLabel: "ignored duplicate" })).toEqual([bookmark]);
  });

  it("removes only the selected local technical review bookmark", () => {
    const first = createReviewBookmark({ currentTimeSeconds: .2, frameRate: 25 });
    const second = createReviewBookmark({ currentTimeSeconds: .4, frameRate: 25 });
    expect(removeReviewBookmark([first, second], first.id)).toEqual([second]);
    expect(removeReviewBookmark([first, second], "missing")).toEqual([first, second]);
  });

  it("updates only the optional browser-local note without changing configured frame identity", () => {
    const bookmark = createReviewBookmark({ currentTimeSeconds: .2, frameRate: 25, operatorLabel: "initial note" });
    expect(updateReviewBookmarkOperatorLabel([bookmark], bookmark.id, "  revised   note ")).toEqual([{ ...bookmark, operatorLabel: "revised note" }]);
    expect(updateReviewBookmarkOperatorLabel([bookmark], bookmark.id, " ")).toEqual([{ ...bookmark, operatorLabel: undefined }]);
  });
});
