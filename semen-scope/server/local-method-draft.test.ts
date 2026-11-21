import { describe, expect, it } from "vitest";
import { createLocalMethodDraft, parseLocalMethodDraft } from "@shared/localMethodDraft";
import { DEFAULT_CASA_CALIBRATION, DEFAULT_CASA_THRESHOLDS } from "@shared/casa";

describe("browser-local method draft", () => {
  it("serializes a standalone species, calibration, and threshold draft", () => {
    const draft = createLocalMethodDraft({ species: "Bovine", calibration: DEFAULT_CASA_CALIBRATION, thresholds: DEFAULT_CASA_THRESHOLDS, savedAt: "2026-08-23T10:00:00.000Z" });
    expect(parseLocalMethodDraft(JSON.stringify(draft))).toMatchObject({ schema: "semenscope.browser-local-method-draft.v1", species: "Bovine", calibration: DEFAULT_CASA_CALIBRATION });
  });

  it("rejects malformed or non-positive calibration storage values", () => {
    expect(parseLocalMethodDraft("not-json")).toBeUndefined();
    expect(parseLocalMethodDraft(JSON.stringify({ schema: "semenscope.browser-local-method-draft.v1", species: "Bovine", calibration: { micronsPerPixel: 0, frameRate: 25 }, thresholds: {} }))).toBeUndefined();
  });

  it("rejects incomplete or non-finite threshold storage values", () => {
    const incomplete = { schema: "semenscope.browser-local-method-draft.v1", species: "Bovine", calibration: DEFAULT_CASA_CALIBRATION, thresholds: {} };
    const nonFinite = { schema: "semenscope.browser-local-method-draft.v1", species: "Bovine", calibration: DEFAULT_CASA_CALIBRATION, thresholds: { ...DEFAULT_CASA_THRESHOLDS, minTrackConfidence: "not-a-number" } };
    expect(parseLocalMethodDraft(JSON.stringify(incomplete))).toBeUndefined();
    expect(parseLocalMethodDraft(JSON.stringify(nonFinite))).toBeUndefined();
  });

  it("accepts a serialized exported draft with an intact threshold contract", () => {
    const exported = JSON.stringify(createLocalMethodDraft({ species: "Ovine", calibration: { ...DEFAULT_CASA_CALIBRATION, frameRate: 30 }, thresholds: DEFAULT_CASA_THRESHOLDS, savedAt: "2026-08-23T11:00:00.000Z" }));
    expect(parseLocalMethodDraft(exported)).toMatchObject({ species: "Ovine", calibration: { frameRate: 30 } });
  });
});
