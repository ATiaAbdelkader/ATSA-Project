import { describe, expect, it } from "vitest";
import { buildBrowserIntakeCapabilityEvidence } from "@shared/browserIntakeCapability";

describe("browser intake capability evidence", () => {
  it("reports an available browser-local camera, recording, canvas, and checked media path without requesting permissions", () => {
    const evidence = buildBrowserIntakeCapabilityEvidence({ secureContext: true, mediaDevicesAvailable: true, getUserMediaAvailable: true, enumerateDevicesAvailable: true, mediaRecorderAvailable: true, canvasAvailable: true, mp4Playback: "probably", webmPlayback: "maybe" });
    expect(evidence).toMatchObject({ availableCount: 6, reviewCount: 0 });
    expect(evidence.items.find(item => item.id === "camera")).toMatchObject({ status: "available" });
    expect(evidence.rationale).toContain("does not request camera access");
  });

  it("preserves safe review guidance for insecure or unsupported environments", () => {
    const evidence = buildBrowserIntakeCapabilityEvidence({ secureContext: false, mediaDevicesAvailable: false, getUserMediaAvailable: false, enumerateDevicesAvailable: false, mediaRecorderAvailable: false, canvasAvailable: false, mp4Playback: "", webmPlayback: "" });
    expect(evidence).toMatchObject({ availableCount: 0, reviewCount: 6 });
    expect(evidence.items.find(item => item.id === "secure-context")?.note).toContain("HTTPS or localhost");
    expect(evidence.items.find(item => item.id === "recording")?.note).toContain("uploaded H.264 MP4 or WebM");
  });
});
