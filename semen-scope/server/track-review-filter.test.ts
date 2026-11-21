import { describe, expect, it } from "vitest";
import { filterTrackReviewRows } from "@shared/trackReviewFilter";

describe("browser-local track review filters", () => {
  const rows = [
    { id: "progressive", metrics: { progressive: true, motile: true } },
    { id: "motile", metrics: { progressive: false, motile: true } },
    { id: "non-motile", metrics: { progressive: false, motile: false } },
  ];

  it("filters existing reported classes without changing the tracks", () => {
    expect(filterTrackReviewRows(rows, "all").map(item => item.id)).toEqual(["progressive", "motile", "non-motile"]);
    expect(filterTrackReviewRows(rows, "progressive").map(item => item.id)).toEqual(["progressive"]);
    expect(filterTrackReviewRows(rows, "motile").map(item => item.id)).toEqual(["motile"]);
    expect(filterTrackReviewRows(rows, "non_motile").map(item => item.id)).toEqual(["non-motile"]);
    expect(rows).toHaveLength(3);
  });
});
