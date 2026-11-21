import { describe, expect, it } from "vitest";
import { DEFAULT_CASA_CALIBRATION, DEFAULT_CASA_THRESHOLDS, type CasaTrackMetrics } from "../shared/casa";
import { buildTrajectoryCoordinateCsv } from "../shared/trajectoryCoordinateExport";

const metrics: CasaTrackMetrics = { id: "track-1", frames: 2, vcl: 30, vsl: 20, vap: 25, lin: 67, str: 80, wob: 83, alh: 2, bcf: 4, dance: 6, mad: 7, alhMax: 3, fractalDimension: 1.1, confidence: 0.88, motile: true, motileByVslVap: true, progressive: true };

describe("trajectory coordinate export", () => {
  it("exports point-level coordinates with calibration and method context", () => {
    const csv = buildTrajectoryCoordinateCsv({
      sampleName: "Field A", species: "Bovine", source: "camera", calibration: { ...DEFAULT_CASA_CALIBRATION, micronsPerPixel: 0.5, frameRate: 25 }, thresholds: DEFAULT_CASA_THRESHOLDS, outputFingerprint: "SSO-1234ABCD", trajectoryIntegrity: { acceptedTracks: 1, continuityPercent: 100, tracksWithoutGaps: 1, tracksWithGaps: 0, windowSpanningPercent: 100, boundaryPointPercent: 0, attentionItems: ["1 gap-spanning link"], summaryLine: "100.0% nominal links · 1/1 tracks without observed gaps · 100.0% span the sampled window", safeguard: "Technical trajectory-integrity context only; it does not establish tracking accuracy, alter kinematics, or infer biological outcomes." }, generatedAt: new Date("2026-08-22T12:00:00.000Z"),
      tracks: [{ id: "T-1", metrics, points: [{ frame: 0, x: 10, y: 20 }, { frame: 5, x: 14, y: 24 }] }],
    });
    expect(csv).toContain("track_id,point_index,frame,time_seconds,x_px,y_px,x_microns,y_microns");
    expect(csv).toContain('"T-1","1","5","0.2","14","24","7","12"');
    expect(csv).toContain('"manual-unverified"');
    expect(csv).toContain('"SSO-1234ABCD"');
    expect(csv).toContain("not a cryptographic signature");
    expect(csv).toContain("trajectory_integrity_summary");
    expect(csv).toContain("100.0% nominal links");
    expect(csv).toContain("trajectory_integrity_attention_items");
    expect(csv).toContain("1 gap-spanning link");
    expect(csv).toContain("does not establish tracking accuracy");
    expect(csv).toContain("laboratory review only");
  });

  it("marks board-backed calibration provenance when evidence exists", () => {
    const csv = buildTrajectoryCoordinateCsv({ sampleName: "Field B", species: "Ovine", source: "upload", calibration: DEFAULT_CASA_CALIBRATION, thresholds: DEFAULT_CASA_THRESHOLDS, calibrationEvidence: { method: "manual-two-point-reference", boardIntervalMicrons: 100, pixelDistance: 200, micronsPerPixel: 0.5, angleDegrees: 0 }, tracks: [{ id: "T-1", metrics, points: [{ frame: 0, x: 0, y: 0 }] }] });
    expect(csv).toContain('"board-referenced"');
  });
});
