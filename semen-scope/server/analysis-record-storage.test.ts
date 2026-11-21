import { analysisRecords } from "../drizzle/schema";
import { describe, expect, it } from "vitest";

describe("analysis record trajectory storage", () => {
  it("uses MEDIUMTEXT for complete CASA-style trajectory payloads", () => {
    expect(analysisRecords.tracksJson.getSQLType()).toBe("mediumtext");
  });

  it("accommodates a representative full track payload beyond TEXT capacity", () => {
    const tracks = Array.from({ length: 440 }, (_, trackIndex) => ({
      id: `TRK-${String(trackIndex).padStart(3, "0")}`,
      points: Array.from({ length: 25 }, (_, frame) => ({
        frame,
        x: 123.456789,
        y: 456.789123,
        score: 24.125,
      })),
      metrics: { vcl: 12.45, vsl: 5.4, vap: 8.2, lin: 44.1, str: 61.2 },
    }));

    expect(JSON.stringify(tracks).length).toBeGreaterThan(65_535);
  });
});
