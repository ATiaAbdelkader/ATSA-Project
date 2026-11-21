import { describe, expect, it } from "vitest";
import { describeMediaLoadError } from "../client/src/lib/analysisProcessor";

describe("browser media-load guidance", () => {
  it("provides a conversion path when a browser cannot decode a video stream", () => {
    expect(describeMediaLoadError(3)).toContain("H.264 MP4 or WebM");
  });

  it("does not expose implementation-level event-waiting details to the laboratory user", () => {
    expect(describeMediaLoadError()).not.toContain("loadedmetadata");
  });
});
