import { describe, expect, it } from "vitest";
import { getStoredSnapshotDetails } from "../shared/dashboardSnapshot";

describe("persisted dashboard snapshot details", () => {
  it("exposes immutable metrics, board provenance, capture evidence, and review flags", () => {
    const details = getStoredSnapshotDetails({
      metricsJson: JSON.stringify({ motility: 72.4, vcl: 108.8 }),
      calibrationJson: JSON.stringify({ micronsPerPixel: 0.42, frameRate: 50 }),
      thresholdsJson: JSON.stringify({ minTrackFrames: 7 }),
      qualityFlagsJson: JSON.stringify(["Review calibration before interpreting velocity."]),
      videoMetadataJson: JSON.stringify({
        calibrationEvidence: {
          method: "manual-two-point-reference",
          boardIntervalMicrons: 100,
          pixelDistance: 238.1,
          micronsPerPixel: 0.42,
          angleDegrees: 0,
        },
        captureQuality: { status: "review", brightness: 112, contrast: 19, focus: 8, rationale: "Review focus." },
        temporalSampling: { availableFrames: 100, processedFrames: 25, skippedFrames: 75, frameStep: 4, samplingIntervalSeconds: 0.16, processedPercent: 25, rationale: "Every 4th estimated video frame was processed." },
        classificationComposition: { total: 10, progressive: 4, motileNonProgressive: 3, nonMotile: 3 },
        trackDurationEvidence: { acceptedTracks: 10, meanFrames: 9.7, shortestFrames: 6, longestFrames: 18 },
        trackMetricRangeEvidence: { acceptedTracks: 10, vcl: { minimum: 22, median: 74.2, maximum: 121.8, interquartileRange: 33, outlierTrackIds: ["TRK-007"] }, lin: { minimum: 18, median: 58, maximum: 91, interquartileRange: 17, outlierTrackIds: [] }, confidence: { minimum: 0.46, median: 0.74, maximum: 0.96, interquartileRange: 0.19, outlierTrackIds: [] } },
        trackLinkageContinuity: { acceptedTracks: 10, expectedFrameStep: 4, linkedSegments: 87, continuousSegments: 81, gapSpanningSegments: 6, continuityPercent: 93.1, tracksWithGaps: 4, maxSkippedFramesInSegment: 8, rationale: "81 of 87 retained point-to-point links use the nominal 4-frame sampling cadence." },
        trajectorySpatialCoverage: { acceptedTracks: 10, gridColumns: 3, gridRows: 3, occupiedCells: 6, totalCells: 9, maxCellTrackCount: 3, maxCellTrackSharePercent: 30, edgeCellTracks: 7, cells: [], rationale: "Image-region coverage context only." },
        fieldBoundaryContact: { acceptedTracks: 10, boundaryZonePercent: 5, totalPoints: 103, boundaryPoints: 17, boundaryPointPercent: 16.5, tracksWithBoundaryPoints: 4, tracksStartingInBoundary: 2, tracksEndingInBoundary: 3, rationale: "Technical image boundary context only." },
        trajectoryTemporalPlacement: { acceptedTracks: 10, windowStartFrame: 0, windowEndFrame: 96, tracksStartingAtWindowBoundary: 4, tracksEndingAtWindowBoundary: 3, tracksSpanningEntireWindow: 2, earliestTrackStartFrame: 0, latestTrackEndFrame: 96, rationale: "Technical observation window context only." },
        trackDirectionalBalance: { acceptedTracks: 10, resolvedDirectionTracks: 9, unresolvedDirectionTracks: 1, dominantOctant: "right", dominantOctantSharePercent: 44.4, octantCounts: { right: 4 }, rationale: "Technical image coordinate direction context only." },
        trajectoryIntegrity: { acceptedTracks: 10, continuityPercent: 93.1, tracksWithoutGaps: 6, tracksWithGaps: 4, windowSpanningPercent: 20, boundaryPointPercent: 16.5, attentionItems: ["6 gap-spanning links"], summaryLine: "93.1% nominal links · 6/10 tracks without observed gaps · 20.0% span the sampled window", safeguard: "Technical trajectory-integrity context only." },
        outputFingerprint: "SSO-1234ABCD",
        candidateDetectionLoad: { processedFrames: 25, framesWithCandidates: 24, emptyCandidateFrames: 1, totalCandidates: 330, meanCandidatesPerFrame: 13.2, peakCandidatesInFrame: 22, frameCoveragePercent: 96, candidateLimitPerFrame: 360, framesAtCandidateLimit: 0, selectionCapReached: false, rationale: "Detector workload only." },
        candidateScoreDistribution: { candidateCount: 330, meanScore: 12.4, medianScore: 11.8, minimumScore: 7, maximumScore: 26.1, rationale: "Detector score only." },
        processingPerformance: { elapsedMilliseconds: 1350, processedFrames: 25, meanMillisecondsPerFrame: 54, processedFramesPerSecond: 18.5, rationale: "Local loop timing only." },
        analysisScalingEvidence: { sourceWidth: 1920, sourceHeight: 1080, workingCanvasWidth: 560, workingCanvasHeight: 315, sourcePixelsPerWorkingPixelX: 3.4286, sourcePixelsPerWorkingPixelY: 3.4286, wasDownscaled: true, rationale: "Canvas provenance only." },
        detectorConfigurationEvidence: { workingCanvasWidth: 560, workingCanvasHeight: 315, detectionSensitivity: 45, samplingStridePx: 4, darknessThreshold: 42.75, contrastThreshold: 9.9, candidateLimitPerFrame: 360, rationale: "Detector config only." },
        captureQualityVariability: { sampledFrames: 25, brightnessStandardDeviation: 3.2, contrastStandardDeviation: 2.1, focusStandardDeviation: 1.5, brightnessRange: 9, contrastRange: 7, focusRange: 5, rationale: "Technical quality context only." },
        detectorLoadTimeline: { points: [{ sampleIndex: 0, frame: 0, candidateCount: 24, atSelectionCap: false }], sampledFrames: 1, candidateLimitPerFrame: 360, peakCandidates: 24, peakFrame: 0, capBoundSamples: 0, rationale: "Technical detector context only." },
        specimenContext: { specimenId: "EJ-42", donorId: "BULL-9", collectionReference: "LOT-7", collectionDateTime: "2026-08-22T11:30", chamberReference: "CH-3", preparationProtocolReference: "SOP-17", analystNote: "Prepared at 37 C." },
        opticsTraceability: { objectiveMagnification: "20×", chamberDepthMicrons: 20 },
        footageProvenance: { source: "camera", container: "WebM", byteSize: 1_572_864, captureDeviceLabel: "Microscope USB camera", capturedAt: "2026-08-23T12:34:56.000Z", captureFrameWidth: 1280, captureFrameHeight: 720, recorderMimeType: "video/webm;codecs=vp8,opus", requestedDurationSeconds: 5, actualDurationSeconds: 4.8, recordingStopReason: "operator" },
        partialCameraCaptureReviewAcknowledgedAt: "2026-08-23T12:35:00.000Z",
        analysisSessionReference: "LOCAL-20260823T123456Z-0000",
        acquisitionReadiness: { readyCount: 3, reviewCount: 1, pendingCount: 0, items: [] },
        dosePlan: { measuredConcentrationMillionsPerMl: 80, availableVolumeMl: 4, targetSpermMillionsPerDose: 20, totalSpermMillions: 320, theoreticalDoseCount: 16 },
      }),
    });

    expect(details.metrics).toMatchObject({ motility: 72.4, vcl: 108.8 });
    expect(details.calibration).toMatchObject({ micronsPerPixel: 0.42, frameRate: 50 });
    expect(details.thresholds.minTrackFrames).toBe(7);
    expect(details.calibrationEvidence?.method).toBe("manual-two-point-reference");
    expect(details.captureQuality).toMatchObject({ status: "review", focus: 8 });
    expect(details.temporalSampling).toMatchObject({ availableFrames: 100, processedFrames: 25, frameStep: 4, processedPercent: 25 });
    expect(details.classificationComposition).toEqual({ total: 10, progressive: 4, motileNonProgressive: 3, nonMotile: 3 });
    expect(details.trackDurationEvidence).toEqual({ acceptedTracks: 10, meanFrames: 9.7, shortestFrames: 6, longestFrames: 18 });
    expect(details.trackMetricRangeEvidence?.vcl).toMatchObject({ minimum: 22, median: 74.2, maximum: 121.8, outlierTrackIds: ["TRK-007"] });
    expect(details.trackLinkageContinuity).toMatchObject({ expectedFrameStep: 4, linkedSegments: 87, continuityPercent: 93.1, tracksWithGaps: 4 });
    expect(details.trajectorySpatialCoverage).toMatchObject({ occupiedCells: 6, totalCells: 9, maxCellTrackSharePercent: 30, edgeCellTracks: 7 });
    expect(details.fieldBoundaryContact).toMatchObject({ boundaryZonePercent: 5, boundaryPoints: 17, boundaryPointPercent: 16.5, tracksWithBoundaryPoints: 4 });
    expect(details.trajectoryTemporalPlacement).toMatchObject({ windowEndFrame: 96, tracksStartingAtWindowBoundary: 4, tracksEndingAtWindowBoundary: 3, tracksSpanningEntireWindow: 2 });
    expect(details.trackDirectionalBalance).toMatchObject({ resolvedDirectionTracks: 9, unresolvedDirectionTracks: 1, dominantOctant: "right", dominantOctantSharePercent: 44.4 });
    expect(details.trajectoryIntegrity).toMatchObject({ acceptedTracks: 10, continuityPercent: 93.1, tracksWithoutGaps: 6, boundaryPointPercent: 16.5, attentionItems: ["6 gap-spanning links"] });
    expect(details.outputFingerprint).toBe("SSO-1234ABCD");
    expect(details.candidateDetectionLoad).toMatchObject({ processedFrames: 25, totalCandidates: 330, meanCandidatesPerFrame: 13.2, peakCandidatesInFrame: 22, frameCoveragePercent: 96, candidateLimitPerFrame: 360, framesAtCandidateLimit: 0, selectionCapReached: false });
    expect(details.candidateScoreDistribution).toMatchObject({ candidateCount: 330, meanScore: 12.4, medianScore: 11.8, minimumScore: 7, maximumScore: 26.1 });
    expect(details.processingPerformance).toMatchObject({ elapsedMilliseconds: 1350, processedFrames: 25, meanMillisecondsPerFrame: 54, processedFramesPerSecond: 18.5 });
    expect(details.analysisScalingEvidence).toMatchObject({ sourceWidth: 1920, sourceHeight: 1080, workingCanvasWidth: 560, workingCanvasHeight: 315, wasDownscaled: true });
    expect(details.detectorConfigurationEvidence).toMatchObject({ workingCanvasWidth: 560, workingCanvasHeight: 315, detectionSensitivity: 45, samplingStridePx: 4, darknessThreshold: 42.75, contrastThreshold: 9.9, candidateLimitPerFrame: 360 });
    expect(details.captureQualityVariability).toMatchObject({ sampledFrames: 25, brightnessStandardDeviation: 3.2, contrastStandardDeviation: 2.1, focusStandardDeviation: 1.5 });
    expect(details.detectorLoadTimeline).toMatchObject({ sampledFrames: 1, candidateLimitPerFrame: 360, peakCandidates: 24, peakFrame: 0, capBoundSamples: 0 });
    expect(details.specimenContext).toMatchObject({ specimenId: "EJ-42", donorId: "BULL-9", collectionDateTime: "2026-08-22T11:30", preparationProtocolReference: "SOP-17" });
    expect(details.opticsTraceability).toMatchObject({ objectiveMagnification: "20×", chamberDepthMicrons: 20 });
    expect(details.footageProvenance).toMatchObject({ source: "camera", container: "WebM", byteSize: 1_572_864, captureDeviceLabel: "Microscope USB camera", capturedAt: "2026-08-23T12:34:56.000Z", captureFrameWidth: 1280, captureFrameHeight: 720, recorderMimeType: "video/webm;codecs=vp8,opus", requestedDurationSeconds: 5, actualDurationSeconds: 4.8, recordingStopReason: "operator" });
    expect(details.partialCameraCaptureReviewAcknowledgedAt).toBe("2026-08-23T12:35:00.000Z");
    expect(details.analysisSessionReference).toBe("LOCAL-20260823T123456Z-0000");
    expect(details.acquisitionReadiness).toMatchObject({ readyCount: 3, reviewCount: 1 });
    expect(details.dosePlan).toMatchObject({ totalSpermMillions: 320, theoreticalDoseCount: 16 });
    expect(details.flags).toEqual(["Review calibration before interpreting velocity."]);
  });

  it("falls back safely when a historical record contains malformed JSON", () => {
    const details = getStoredSnapshotDetails({
      metricsJson: "not json",
      calibrationJson: "not json",
      thresholdsJson: "not json",
      qualityFlagsJson: "not json",
      videoMetadataJson: "not json",
    });

    expect(details.metrics).toEqual({});
    expect(details.flags).toEqual([]);
    expect(details.calibration.micronsPerPixel).toBeGreaterThan(0);
    expect(details.thresholds.minTrackFrames).toBeGreaterThan(0);
    expect(details.calibrationEvidence).toBeUndefined();
  });
});
