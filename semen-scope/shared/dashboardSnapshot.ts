import { DEFAULT_CASA_CALIBRATION, DEFAULT_CASA_THRESHOLDS, type CasaCalibration, type CasaThresholds } from "./casa";
import type { CalibrationBoardEvidence } from "./calibrationBoard";
import type { AcquisitionReadiness, DosePlanInput, DosePlanResult, SpecimenContext } from "./specimenWorkflow";
import type { OpticsTraceability } from "./opticsTraceability";
import type { FootageProvenance } from "./footageProvenance";

export type StoredSnapshotDetails = {
  metrics: Record<string, number>;
  calibration: CasaCalibration;
  thresholds: CasaThresholds;
  flags: string[];
  calibrationEvidence?: CalibrationBoardEvidence;
  captureQuality?: {
    status?: "acceptable" | "review" | "poor";
    brightness?: number;
    contrast?: number;
    focus?: number;
    rationale?: string;
  };
  fieldStability?: {
    status?: "acceptable" | "review" | "poor";
    meanShiftPx?: number;
    maxShiftPx?: number;
    sampledPairs?: number;
    rationale?: string;
  };
  methodFingerprint?: string;
  confidenceDistribution?: {
    total: number;
    belowThreshold: number;
    atOrAboveThreshold: number;
    mean: number;
  };
  temporalSampling?: {
    availableFrames: number;
    processedFrames: number;
    skippedFrames: number;
    frameStep: number;
    samplingIntervalSeconds: number;
    processedPercent: number;
    rationale: string;
  };
  classificationComposition?: {
    total: number;
    progressive: number;
    motileNonProgressive: number;
    nonMotile: number;
  };
  trackDurationEvidence?: {
    acceptedTracks: number;
    meanFrames: number;
    shortestFrames: number;
    longestFrames: number;
  };
  trackMetricRangeEvidence?: {
    acceptedTracks: number;
    vcl: { minimum: number; median: number; maximum: number; interquartileRange: number; outlierTrackIds: string[] };
    lin: { minimum: number; median: number; maximum: number; interquartileRange: number; outlierTrackIds: string[] };
    confidence: { minimum: number; median: number; maximum: number; interquartileRange: number; outlierTrackIds: string[] };
  };
  trackLinkageContinuity?: {
    acceptedTracks: number;
    expectedFrameStep: number;
    linkedSegments: number;
    continuousSegments: number;
    gapSpanningSegments: number;
    continuityPercent: number;
    tracksWithGaps: number;
    maxSkippedFramesInSegment: number;
    rationale: string;
  };
  trajectorySpatialCoverage?: {
    acceptedTracks: number;
    gridColumns: number;
    gridRows: number;
    occupiedCells: number;
    totalCells: number;
    maxCellTrackCount: number;
    maxCellTrackSharePercent: number;
    edgeCellTracks: number;
    cells: Array<{ row: number; column: number; trackCount: number }>;
    rationale: string;
  };
  fieldBoundaryContact?: {
    acceptedTracks: number;
    boundaryZonePercent: number;
    totalPoints: number;
    boundaryPoints: number;
    boundaryPointPercent: number;
    tracksWithBoundaryPoints: number;
    tracksStartingInBoundary: number;
    tracksEndingInBoundary: number;
    rationale: string;
  };
  trajectoryTemporalPlacement?: {
    acceptedTracks: number;
    windowStartFrame: number;
    windowEndFrame: number;
    tracksStartingAtWindowBoundary: number;
    tracksEndingAtWindowBoundary: number;
    tracksSpanningEntireWindow: number;
    earliestTrackStartFrame: number;
    latestTrackEndFrame: number;
    rationale: string;
  };
  trackDirectionalBalance?: {
    acceptedTracks: number;
    resolvedDirectionTracks: number;
    unresolvedDirectionTracks: number;
    dominantOctant: string;
    dominantOctantSharePercent: number;
    octantCounts: Record<string, number>;
    rationale: string;
  };
  trajectoryIntegrity?: {
    acceptedTracks: number;
    continuityPercent: number;
    tracksWithoutGaps: number;
    tracksWithGaps: number;
    windowSpanningPercent: number;
    boundaryPointPercent: number;
    attentionItems: string[];
    summaryLine: string;
    safeguard: string;
  };
  outputFingerprint?: string;
  candidateDetectionLoad?: {
    processedFrames: number;
    framesWithCandidates: number;
    emptyCandidateFrames: number;
    totalCandidates: number;
    meanCandidatesPerFrame: number;
    peakCandidatesInFrame: number;
    frameCoveragePercent: number;
    candidateLimitPerFrame: number;
    framesAtCandidateLimit: number;
    selectionCapReached: boolean;
    rationale: string;
  };
  candidateScoreDistribution?: {
    candidateCount: number;
    meanScore: number;
    medianScore: number;
    minimumScore: number;
    maximumScore: number;
    rationale: string;
  };
  processingPerformance?: {
    elapsedMilliseconds: number;
    processedFrames: number;
    meanMillisecondsPerFrame: number;
    processedFramesPerSecond: number;
    rationale: string;
  };
  analysisScalingEvidence?: {
    sourceWidth: number;
    sourceHeight: number;
    workingCanvasWidth: number;
    workingCanvasHeight: number;
    sourcePixelsPerWorkingPixelX: number;
    sourcePixelsPerWorkingPixelY: number;
    wasDownscaled: boolean;
    rationale: string;
  };
  detectorConfigurationEvidence?: {
    workingCanvasWidth: number;
    workingCanvasHeight: number;
    detectionSensitivity: number;
    samplingStridePx: number;
    darknessThreshold: number;
    contrastThreshold: number;
    candidateLimitPerFrame: number;
    rationale: string;
  };
  captureQualityVariability?: {
    sampledFrames: number;
    brightnessStandardDeviation: number;
    contrastStandardDeviation: number;
    focusStandardDeviation: number;
    brightnessRange: number;
    contrastRange: number;
    focusRange: number;
    rationale: string;
  };
  detectorLoadTimeline?: {
    points: Array<{ sampleIndex: number; frame: number; candidateCount: number; atSelectionCap: boolean }>;
    sampledFrames: number;
    candidateLimitPerFrame: number;
    peakCandidates: number;
    peakFrame: number | null;
    capBoundSamples: number;
    rationale: string;
  };
  specimenContext?: SpecimenContext;
  footageProvenance?: FootageProvenance;
  partialCameraCaptureReviewAcknowledgedAt?: string;
  analysisSessionReference?: string;
  opticsTraceability?: OpticsTraceability;
  acquisitionReadiness?: AcquisitionReadiness;
  dosePlan?: DosePlanResult | DosePlanInput;
};

type PersistedSnapshotJson = {
  videoMetadataJson: string;
  calibrationJson: string;
  thresholdsJson: string;
  metricsJson: string;
  qualityFlagsJson: string;
};

export function parseJsonValue<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function getStoredSnapshotDetails(record: PersistedSnapshotJson): StoredSnapshotDetails {
  const metadata = parseJsonValue<Record<string, unknown>>(record.videoMetadataJson, {});
  return {
    metrics: parseJsonValue<Record<string, number>>(record.metricsJson, {}),
    calibration: { ...DEFAULT_CASA_CALIBRATION, ...parseJsonValue<Partial<CasaCalibration>>(record.calibrationJson, {}) },
    thresholds: { ...DEFAULT_CASA_THRESHOLDS, ...parseJsonValue<Partial<CasaThresholds>>(record.thresholdsJson, {}) },
    flags: parseJsonValue<string[]>(record.qualityFlagsJson, []),
    calibrationEvidence: metadata.calibrationEvidence as CalibrationBoardEvidence | undefined,
    captureQuality: metadata.captureQuality as StoredSnapshotDetails["captureQuality"],
    fieldStability: metadata.fieldStability as StoredSnapshotDetails["fieldStability"],
    methodFingerprint: metadata.methodFingerprint as string | undefined,
    confidenceDistribution: metadata.confidenceDistribution as StoredSnapshotDetails["confidenceDistribution"],
    temporalSampling: metadata.temporalSampling as StoredSnapshotDetails["temporalSampling"],
    classificationComposition: metadata.classificationComposition as StoredSnapshotDetails["classificationComposition"],
    trackDurationEvidence: metadata.trackDurationEvidence as StoredSnapshotDetails["trackDurationEvidence"],
    trackMetricRangeEvidence: metadata.trackMetricRangeEvidence as StoredSnapshotDetails["trackMetricRangeEvidence"],
    trackLinkageContinuity: metadata.trackLinkageContinuity as StoredSnapshotDetails["trackLinkageContinuity"],
    trajectorySpatialCoverage: metadata.trajectorySpatialCoverage as StoredSnapshotDetails["trajectorySpatialCoverage"],
    fieldBoundaryContact: metadata.fieldBoundaryContact as StoredSnapshotDetails["fieldBoundaryContact"],
    trajectoryTemporalPlacement: metadata.trajectoryTemporalPlacement as StoredSnapshotDetails["trajectoryTemporalPlacement"],
    trackDirectionalBalance: metadata.trackDirectionalBalance as StoredSnapshotDetails["trackDirectionalBalance"],
    trajectoryIntegrity: metadata.trajectoryIntegrity as StoredSnapshotDetails["trajectoryIntegrity"],
    outputFingerprint: metadata.outputFingerprint as string | undefined,
    candidateDetectionLoad: metadata.candidateDetectionLoad as StoredSnapshotDetails["candidateDetectionLoad"],
    candidateScoreDistribution: metadata.candidateScoreDistribution as StoredSnapshotDetails["candidateScoreDistribution"],
    processingPerformance: metadata.processingPerformance as StoredSnapshotDetails["processingPerformance"],
    analysisScalingEvidence: metadata.analysisScalingEvidence as StoredSnapshotDetails["analysisScalingEvidence"],
    detectorConfigurationEvidence: metadata.detectorConfigurationEvidence as StoredSnapshotDetails["detectorConfigurationEvidence"],
    captureQualityVariability: metadata.captureQualityVariability as StoredSnapshotDetails["captureQualityVariability"],
    detectorLoadTimeline: metadata.detectorLoadTimeline as StoredSnapshotDetails["detectorLoadTimeline"],
    specimenContext: metadata.specimenContext as SpecimenContext | undefined,
    footageProvenance: metadata.footageProvenance as FootageProvenance | undefined,
    partialCameraCaptureReviewAcknowledgedAt: metadata.partialCameraCaptureReviewAcknowledgedAt as string | undefined,
    analysisSessionReference: metadata.analysisSessionReference as string | undefined,
    opticsTraceability: metadata.opticsTraceability as OpticsTraceability | undefined,
    acquisitionReadiness: metadata.acquisitionReadiness as AcquisitionReadiness | undefined,
    dosePlan: metadata.dosePlan as DosePlanResult | DosePlanInput | undefined,
  };
}
