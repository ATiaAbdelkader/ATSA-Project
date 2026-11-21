import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const db = vi.hoisted(() => ({
  getLabSettings: vi.fn(),
  listAnalysisRecords: vi.fn(),
  saveAnalysisRecord: vi.fn(),
  saveLabSettings: vi.fn(),
}));

vi.mock("./db", () => db);

import { appRouter } from "./routers";

const evidence = {
  boardIntervalMicrons: 100,
  pixelDistance: 200,
  micronsPerPixel: 0.5,
  angleDegrees: 0,
  capturedAt: "2026-08-22T00:00:00.000Z",
  imageWidth: 640,
  imageHeight: 480,
  method: "manual-two-point-reference" as const,
};

function context(): TrpcContext {
  return {
    user: {
      id: 91,
      openId: "calibration-test-owner",
      email: null,
      name: "Calibration test user",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("calibration evidence persistence procedures", () => {
  beforeEach(() => vi.clearAllMocks());

  it("saves and returns board evidence through the actual settings procedure", async () => {
    const settingsJson = JSON.stringify({ calibration: { micronsPerPixel: 0.5, frameRate: 25 }, thresholds: {}, species: "Bovine", calibrationEvidence: evidence });
    db.saveLabSettings.mockResolvedValue(undefined);
    db.getLabSettings.mockResolvedValue({ settingsJson });
    const caller = appRouter.createCaller(context());

    await expect(caller.analysis.settings.save({ settingsJson })).resolves.toEqual({ success: true });
    await expect(caller.analysis.settings.get()).resolves.toEqual({ settingsJson });
    expect(db.saveLabSettings).toHaveBeenCalledWith(91, settingsJson);
    expect(JSON.parse((await caller.analysis.settings.get())!.settingsJson).calibrationEvidence).toEqual(evidence);
  });

  it("passes board evidence in immutable analysis metadata to the real save procedure", async () => {
    db.saveAnalysisRecord.mockResolvedValue(undefined);
    const videoMetadataJson = JSON.stringify({ width: 780, height: 580, duration: 1, frameRate: 25, frameCount: 25, calibrationEvidence: evidence });
    const caller = appRouter.createCaller(context());

    await expect(caller.analysis.save({
      sampleName: "Board-calibrated reference field",
      species: "Bovine",
      source: "camera",
      videoFileName: "board-calibrated.webm",
      videoUrl: null,
      videoMetadataJson,
      calibrationJson: JSON.stringify({ micronsPerPixel: 0.5, frameRate: 25 }),
      thresholdsJson: "{}",
      metricsJson: "{}",
      tracksJson: "[]",
      qualityFlagsJson: "[]",
      status: "review_required",
    })).resolves.toEqual({ success: true });

    expect(db.saveAnalysisRecord).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 91, videoMetadataJson }));
    const savedInput = db.saveAnalysisRecord.mock.calls[0][0];
    expect(JSON.parse(savedInput.videoMetadataJson).calibrationEvidence).toEqual(evidence);
  });
});
