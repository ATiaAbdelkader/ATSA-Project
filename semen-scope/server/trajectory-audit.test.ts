import { describe, expect, it } from "vitest";
import { getTrajectoryAuditPoint } from "../shared/trajectoryAudit";

describe("trajectory audit point", () => {
  it("reports read-only frame time and calibrated positions", () => {
    expect(getTrajectoryAuditPoint({ frame: 12, x: 40, y: 16 }, 3, { frameRate: 24, micronsPerPixel: 0.5 })).toEqual({ index: 3, frame: 12, timeSeconds: 0.5, xPx: 40, yPx: 16, xMicrons: 20, yMicrons: 8 });
  });
});
