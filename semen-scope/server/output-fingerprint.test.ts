import { describe, expect, it } from "vitest";
import { createOutputFingerprint } from "@shared/outputFingerprint";
import type { CasaSummary, CasaTrackMetrics } from "@shared/casa";

const summary = { validTracks: 2, vcl: 33.123456, lin: 52.5, meanConfidence: 0.765432 } as CasaSummary;
const metrics = (id: string, vcl: number): CasaTrackMetrics => ({ id, frames: 4, vcl, vsl: 0, vap: 0, lin: 52.5, str: 0, wob: 0, alh: 0, bcf: 0, dance: 0, mad: 0, alhMax: 0, fractalDimension: 1, confidence: 0.765432, motile: true, motileByVslVap: false, progressive: false });
const base = { metadata: { width: 640, height: 480, frameRate: 25, frameCount: 100 }, summary, frameStep: 4, processedFrames: 25 };

describe("browser-local output fingerprint", () => {
  it("is deterministic regardless of track input order", () => {
    const first = createOutputFingerprint({ ...base, tracks: [{ id: "TRK-002", points: [{ frame: 4, x: 2, y: 2 }, { frame: 8, x: 3, y: 3 }], metrics: metrics("TRK-002", 22) }, { id: "TRK-001", points: [{ frame: 0, x: 1, y: 1 }, { frame: 4, x: 2, y: 2 }], metrics: metrics("TRK-001", 44) }] });
    const second = createOutputFingerprint({ ...base, tracks: [{ id: "TRK-001", points: [{ frame: 4, x: 2, y: 2 }, { frame: 0, x: 1, y: 1 }], metrics: metrics("TRK-001", 44) }, { id: "TRK-002", points: [{ frame: 8, x: 3, y: 3 }, { frame: 4, x: 2, y: 2 }], metrics: metrics("TRK-002", 22) }] });
    expect(first).toBe(second);
    expect(first).toMatch(/^SSO-[A-F0-9]{8}$/);
  });

  it("changes when compact technical output changes", () => {
    const first = createOutputFingerprint({ ...base, tracks: [{ id: "TRK-001", points: [{ frame: 0, x: 1, y: 1 }], metrics: metrics("TRK-001", 44) }] });
    const second = createOutputFingerprint({ ...base, tracks: [{ id: "TRK-001", points: [{ frame: 0, x: 1, y: 1 }], metrics: metrics("TRK-001", 45) }] });
    expect(first).not.toBe(second);
  });
});
