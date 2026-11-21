import { describe, expect, it } from "vitest";
import { buildTechnicalReviewAnnotationStatus, buildTechnicalReviewAnnotationsFilename, buildTechnicalReviewAnnotationsJson, createClearedTechnicalReviewAnnotations, getReviewAnnotationsDurationBlocker, getReviewAnnotationsFileSizeBlocker, getReviewAnnotationsImportBlocker, MAX_TECHNICAL_REVIEW_ANNOTATIONS_BYTES, parseTechnicalReviewAnnotationsJson, REVIEW_ANNOTATIONS_ACTIVE_ANALYSIS_BLOCKER } from "@shared/reviewAnnotationsExport";

describe("browser-local technical review annotations export", () => {
  it("serializes local bookmarks, a review window, and reviewed IDs without footage", () => {
    const json = buildTechnicalReviewAnnotationsJson({ sampleName: "Field 03", configuredFrameRate: 25, outputFingerprint: "output-abc", bookmarks: [{ id: "frame-5", label: "Frame 5 · 0.200 s", frame: 5, timeSeconds: .2, operatorLabel: "Debris check" }], reviewWindow: { startFrame: 5, startTimeSeconds: .2, endFrame: 15, endTimeSeconds: .6 }, reviewedTrackIds: ["T-2", "T-1"] });
    expect(JSON.parse(json)).toMatchObject({ sampleName: "Field 03", configuredFrameRate: 25, outputFingerprint: "output-abc", bookmarks: [{ operatorLabel: "Debris check" }], reviewWindow: { endFrame: 15 }, reviewedTrackIds: ["T-1", "T-2"] });
    expect(json).toContain("contains no footage");
    expect(buildTechnicalReviewAnnotationsFilename("Field 03")).toBe("field-03-technical-review-annotations.json");
  });

  it("parses only structurally valid local technical annotations", () => {
    const valid = buildTechnicalReviewAnnotationsJson({ sampleName: "Field 03", configuredFrameRate: 25, outputFingerprint: "output-abc", bookmarks: [{ id: "frame-5", label: "Frame 5 · 0.200 s", frame: 5, timeSeconds: .2 }], reviewedTrackIds: ["T-2"] });
    const parsed = parseTechnicalReviewAnnotationsJson(valid);
    expect(parsed).toMatchObject({ configuredFrameRate: 25, outputFingerprint: "output-abc", bookmarks: [{ frame: 5 }], reviewedTrackIds: ["T-2"] });
    expect(() => parseTechnicalReviewAnnotationsJson('{"format":"wrong"}')).toThrow("unsupported technical review format");
    expect(() => parseTechnicalReviewAnnotationsJson(JSON.stringify({ ...JSON.parse(valid), outputFingerprint: null }))).toThrow("unsupported technical review format");
    expect(() => parseTechnicalReviewAnnotationsJson(JSON.stringify({ ...JSON.parse(valid), bookmarks: [{ id: "f-5", label: "Frame 5", frame: 5, timeSeconds: .4 }] }))).toThrow("frame-time misaligned bookmark");
    expect(() => parseTechnicalReviewAnnotationsJson(JSON.stringify({ ...JSON.parse(valid), bookmarks: [{ id: "frame-5", label: "Frame 5 · 0.200 s", frame: 5, timeSeconds: .2, operatorLabel: "  Debris check  " }] }))).toThrow("non-canonical bookmark operator label");
    expect(() => parseTechnicalReviewAnnotationsJson(JSON.stringify({ ...JSON.parse(valid), bookmarks: [{ id: "frame-5", label: "Frame 5 · 0.200 s", frame: 5, timeSeconds: .2 }, { id: "frame-5", label: "Frame 5 · 0.200 s", frame: 5, timeSeconds: .2 }] }))).toThrow("unique, chronologically ordered bookmarks");
    expect(() => parseTechnicalReviewAnnotationsJson(JSON.stringify({ ...JSON.parse(valid), bookmarks: [{ id: "frame-10", label: "Frame 10 · 0.400 s", frame: 10, timeSeconds: .4 }, { id: "frame-5", label: "Frame 5 · 0.200 s", frame: 5, timeSeconds: .2 }] }))).toThrow("unique, chronologically ordered bookmarks");
    expect(() => parseTechnicalReviewAnnotationsJson(JSON.stringify({ ...JSON.parse(valid), bookmarks: [{ id: "frame-5", label: "Frame 5", frame: 5, timeSeconds: .2 }] }))).toThrow("non-canonical configured-frame bookmark reference");
    expect(() => parseTechnicalReviewAnnotationsJson(JSON.stringify({ ...JSON.parse(valid), reviewedTrackIds: ["T-2", "T-1"] }))).toThrow("unique, sorted reviewed-track identifiers");
    expect(() => parseTechnicalReviewAnnotationsJson(JSON.stringify({ ...JSON.parse(valid), reviewedTrackIds: ["T-2", "T-2"] }))).toThrow("unique, sorted reviewed-track identifiers");
  });

  it("blocks local annotation imports while synchronized analysis is active", () => {
    expect(getReviewAnnotationsImportBlocker(true)).toBe(REVIEW_ANNOTATIONS_ACTIVE_ANALYSIS_BLOCKER);
    expect(getReviewAnnotationsImportBlocker(false)).toBeUndefined();
  });

  it("limits local technical annotation files to compact metadata-only exports", () => {
    expect(getReviewAnnotationsFileSizeBlocker(MAX_TECHNICAL_REVIEW_ANNOTATIONS_BYTES)).toBeUndefined();
    expect(getReviewAnnotationsFileSizeBlocker(MAX_TECHNICAL_REVIEW_ANNOTATIONS_BYTES + 1)).toContain("256 KiB or smaller");
    expect(() => parseTechnicalReviewAnnotationsJson(" ".repeat(MAX_TECHNICAL_REVIEW_ANNOTATIONS_BYTES + 1))).toThrow("256 KiB or smaller");
  });

  it("rejects local annotation references outside the active footage duration", () => {
    expect(getReviewAnnotationsDurationBlocker({ durationSeconds: 1, bookmarks: [{ id: "f-5", label: "Frame 5", frame: 5, timeSeconds: .2 }] })).toBeUndefined();
    expect(getReviewAnnotationsDurationBlocker({ durationSeconds: .3, bookmarks: [{ id: "f-10", label: "Frame 10", frame: 10, timeSeconds: .4 }] })).toContain("outside the active local footage duration");
    expect(getReviewAnnotationsDurationBlocker({ durationSeconds: 1, bookmarks: [], reviewWindow: { startFrame: 5, startTimeSeconds: .2, endFrame: 30, endTimeSeconds: 1.2 } })).toContain("outside the active local footage duration");
  });

  it("creates a complete empty browser-local technical annotation set", () => {
    expect(createClearedTechnicalReviewAnnotations()).toEqual({ bookmarks: [], reviewWindow: undefined, reviewedTrackIds: [] });
  });

  it("summarizes browser-local technical annotation state without analysis data", () => {
    expect(buildTechnicalReviewAnnotationStatus({ bookmarks: [], reviewedTrackCount: 0 })).toMatchObject({ hasAnnotations: false, summary: "0 bookmarks · no review window · 0 tracks marked" });
    expect(buildTechnicalReviewAnnotationStatus({ bookmarks: [{ id: "f-5", label: "Frame 5", frame: 5, timeSeconds: .2 }], reviewWindow: { startFrame: 5, startTimeSeconds: .2 }, reviewedTrackCount: 1 })).toMatchObject({ bookmarkCount: 1, hasReviewWindow: true, reviewedTrackCount: 1, hasAnnotations: true, summary: "1 bookmark · review window set · 1 track marked" });
  });
});
