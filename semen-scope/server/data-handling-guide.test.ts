import { describe, expect, it } from "vitest";
import { DATA_HANDLING_GUIDE } from "@shared/dataHandlingGuide";

describe("browser-local data-handling guide", () => {
  it("distinguishes temporary context, local drafts, and authenticated immutable records without claiming database video storage", () => {
    expect(DATA_HANDLING_GUIDE.map(entry => entry.title)).toEqual(["Temporary workspace context", "Browser-local method draft", "Authenticated immutable record"]);
    expect(DATA_HANDLING_GUIDE[1].detail).toContain("exclude board evidence, footage, and analysis results");
    expect(DATA_HANDLING_GUIDE[2].detail).toContain("Video bytes are not stored in the database");
  });
});
