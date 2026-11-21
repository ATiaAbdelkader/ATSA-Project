import {
  calculateTrackMetrics,
  summarizeTracks,
  type CasaCalibration,
  type CasaPoint,
  type CasaThresholds,
} from "@shared/casa";
import { buildQualityFlags } from "@shared/qualityFlags";
import { summarizeCaptureQuality, type CaptureQuality, type FrameQualitySample } from "@shared/imageQuality";
import { estimateGlobalGridShiftPx, summarizeFieldStability, type FieldStability, type LuminanceGrid } from "@shared/fieldStability";
import { buildConfidenceDistribution, type ConfidenceDistribution } from "@shared/confidenceDistribution";
import { buildTemporalSamplingEvidence, type TemporalSamplingEvidence } from "@shared/temporalSampling";
import { buildClassificationComposition, type ClassificationComposition } from "@shared/classificationComposition";
import { buildTrackDurationEvidence, type TrackDurationEvidence } from "@shared/trackDurationEvidence";
import { buildTrackMetricRangeEvidence, type TrackMetricRangeEvidence } from "@shared/trackMetricRangeEvidence";
import { buildTrackLinkageContinuityEvidence, type TrackLinkageContinuityEvidence } from "@shared/trackLinkageContinuity";
import { buildTrajectorySpatialCoverageEvidence, type TrajectorySpatialCoverageEvidence } from "@shared/trajectorySpatialCoverage";
import { buildFieldBoundaryContactEvidence, type FieldBoundaryContactEvidence } from "@shared/fieldBoundaryContact";
import { buildTrajectoryTemporalPlacementEvidence, type TrajectoryTemporalPlacementEvidence } from "@shared/trajectoryTemporalPlacement";
import { buildTrackDirectionalBalanceEvidence, type TrackDirectionalBalanceEvidence } from "@shared/trackDirectionalBalance";
import { buildTrajectoryIntegrityEvidence, type TrajectoryIntegrityEvidence } from "@shared/trajectoryIntegrity";
import { createOutputFingerprint } from "@shared/outputFingerprint";
import { buildCandidateDetectionLoadEvidence, type CandidateDetectionLoadEvidence } from "@shared/candidateDetectionLoad";
import { buildCandidateScoreDistributionEvidence, type CandidateScoreDistributionEvidence } from "@shared/candidateScoreDistribution";
import { buildProcessingPerformanceEvidence, type ProcessingPerformanceEvidence } from "@shared/processingPerformance";
import { buildAnalysisScalingEvidence, type AnalysisScalingEvidence } from "@shared/analysisScalingEvidence";
import { buildDetectorConfigurationEvidence, type DetectorConfigurationEvidence } from "@shared/detectorConfigurationEvidence";
import { buildCaptureQualityVariability, type CaptureQualityVariability } from "@shared/captureQualityVariability";
import { buildDetectorLoadTimeline, type DetectorLoadTimeline } from "@shared/detectorLoadTimeline";
import { AnalysisCancelledError, throwIfAnalysisCancelled } from "@shared/analysisCancellation";

export type VideoMetadata = {
  width: number;
  height: number;
  duration: number;
  frameRate: number;
  frameCount: number;
};

export type ProcessedTrack = {
  id: string;
  points: CasaPoint[];
  color: string;
  metrics: ReturnType<typeof calculateTrackMetrics>;
};

export type AnalysisOutput = {
  metadata: VideoMetadata;
  tracks: ProcessedTrack[];
  summary: ReturnType<typeof summarizeTracks>;
  qualityFlags: string[];
  captureQuality: CaptureQuality;
  fieldStability: FieldStability;
  confidenceDistribution: ConfidenceDistribution;
  temporalSampling: TemporalSamplingEvidence;
  classificationComposition: ClassificationComposition;
  trackDurationEvidence: TrackDurationEvidence;
  trackMetricRangeEvidence: TrackMetricRangeEvidence;
  trackLinkageContinuity: TrackLinkageContinuityEvidence;
  trajectorySpatialCoverage: TrajectorySpatialCoverageEvidence;
  fieldBoundaryContact: FieldBoundaryContactEvidence;
  trajectoryTemporalPlacement: TrajectoryTemporalPlacementEvidence;
  trackDirectionalBalance: TrackDirectionalBalanceEvidence;
  trajectoryIntegrity: TrajectoryIntegrityEvidence;
  outputFingerprint: string;
  candidateDetectionLoad: CandidateDetectionLoadEvidence;
  candidateScoreDistribution: CandidateScoreDistributionEvidence;
  processingPerformance: ProcessingPerformanceEvidence;
  analysisScalingEvidence: AnalysisScalingEvidence;
  detectorConfigurationEvidence: DetectorConfigurationEvidence;
  captureQualityVariability: CaptureQualityVariability;
  detectorLoadTimeline: DetectorLoadTimeline;
};

export type AnalysisProgress = {
  progress: number;
  stage: string;
  frame: number;
  processedFrames: number;
  totalFrames: number;
  playbackTime: number;
  activeTracks: number;
  candidates: number;
  liveTracks: ProcessedTrack[];
  candidatePoints: Array<Pick<CasaPoint, "x" | "y">>;
  frameQuality?: CaptureQuality;
  fieldStability?: FieldStability;
};

type PendingTrack = {
  id: string;
  points: CasaPoint[];
  misses: number;
  color: string;
  associationScores: number[];
};

const TRACK_COLORS = ["#78e8c8", "#f6d365", "#f9a8d4", "#8bd3ff", "#c4b5fd", "#fda4af", "#a7f3d0"];

export function describeMediaLoadError(code?: number) {
  if (code === 3) return "The video stream could not be decoded. Use an H.264 MP4 or WebM file, then try again.";
  if (code === 4) return "This video codec or container is not supported by the browser. Use an H.264 MP4 or WebM file, then try again.";
  if (code === 2) return "The video could not be loaded. Check the connection and try the file again.";
  if (code === 1) return "Video loading was interrupted. Please select the clip again and retry.";
  return "Video metadata could not be loaded. Use an H.264 MP4 or WebM file, then try again.";
}

function waitForVideoMetadata(video: HTMLVideoElement, timeoutMs = 15_000, shouldCancel?: () => boolean) {
  if (video.readyState >= HTMLMediaElement.HAVE_METADATA) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      window.clearTimeout(timeout);
      window.clearInterval(cancellationWatch);
      video.removeEventListener("loadedmetadata", onReady);
      video.removeEventListener("loadeddata", onReady);
      video.removeEventListener("canplay", onReady);
      video.removeEventListener("error", onError);
    };
    const onReady = () => {
      if (video.readyState < HTMLMediaElement.HAVE_METADATA) return;
      cleanup();
      resolve();
    };
    const onError = () => {
      const code = video.error?.code;
      cleanup();
      reject(new Error(describeMediaLoadError(code)));
    };
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Video metadata loading timed out. Use an H.264 MP4 or WebM file, then try again."));
    }, timeoutMs);
    const cancellationWatch = window.setInterval(() => {
      if (!shouldCancel?.()) return;
      cleanup();
      reject(new AnalysisCancelledError());
    }, 40);
    video.addEventListener("loadedmetadata", onReady, { once: true });
    video.addEventListener("loadeddata", onReady, { once: true });
    video.addEventListener("canplay", onReady, { once: true });
    video.addEventListener("error", onError, { once: true });
  });
}

function seekVideo(video: HTMLVideoElement, time: number, shouldCancel?: () => boolean) {
  if (Math.abs(video.currentTime - time) < 0.001) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const onSeeked = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("Unable to seek to a video frame for analysis."));
    };
    const cleanup = () => {
      window.clearInterval(cancellationWatch);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
    };
    video.addEventListener("seeked", onSeeked, { once: true });
    video.addEventListener("error", onError, { once: true });
    video.currentTime = time;
    const cancellationWatch = window.setInterval(() => {
      if (!shouldCancel?.()) return;
      cleanup();
      reject(new AnalysisCancelledError());
    }, 40);
  });
}

function luma(data: Uint8ClampedArray, offset: number) {
  return 0.2126 * data[offset] + 0.7152 * data[offset + 1] + 0.0722 * data[offset + 2];
}

function measureFrameQuality(context: CanvasRenderingContext2D, width: number, height: number): FrameQualitySample {
  const { data } = context.getImageData(0, 0, width, height);
  const sampleStep = Math.max(2, Math.floor(Math.min(width, height) / 180));
  let count = 0;
  let brightnessSum = 0;
  let brightnessSquareSum = 0;
  let edgeSum = 0;
  let edgeCount = 0;
  for (let y = sampleStep; y < height - sampleStep; y += sampleStep) {
    for (let x = sampleStep; x < width - sampleStep; x += sampleStep) {
      const center = luma(data, (y * width + x) * 4);
      brightnessSum += center;
      brightnessSquareSum += center * center;
      count += 1;
      const right = luma(data, (y * width + x + sampleStep) * 4);
      const down = luma(data, ((y + sampleStep) * width + x) * 4);
      edgeSum += Math.abs(center - right) + Math.abs(center - down);
      edgeCount += 2;
    }
  }
  const brightness = count ? brightnessSum / count : 0;
  const variance = count ? Math.max(0, brightnessSquareSum / count - brightness * brightness) : 0;
  return { brightness, contrast: Math.sqrt(variance), focus: edgeCount ? edgeSum / edgeCount : 0 };
}

function sampleLuminanceGrid(context: CanvasRenderingContext2D, width: number, height: number): LuminanceGrid {
  const { data } = context.getImageData(0, 0, width, height);
  const columns = Math.max(12, Math.min(30, Math.floor(width / 26)));
  const rows = Math.max(8, Math.min(22, Math.floor(height / 26)));
  const xSpacingPx = width / columns;
  const ySpacingPx = height / rows;
  const values: number[] = [];
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      const px = Math.min(width - 1, Math.max(0, Math.floor((x + 0.5) * xSpacingPx)));
      const py = Math.min(height - 1, Math.max(0, Math.floor((y + 0.5) * ySpacingPx)));
      values.push(luma(data, (py * width + px) * 4));
    }
  }
  return { columns, rows, xSpacingPx, ySpacingPx, values };
}

function localMinimaCandidates(context: CanvasRenderingContext2D, width: number, height: number, configuration: DetectorConfigurationEvidence) {
  const { data } = context.getImageData(0, 0, width, height);
  const candidates: Array<{ x: number; y: number; score: number }> = [];
  const stride = configuration.samplingStridePx;
  const darknessThreshold = configuration.darknessThreshold;

  for (let y = stride * 2; y < height - stride * 2; y += stride) {
    for (let x = stride * 2; x < width - stride * 2; x += stride) {
      const offset = (y * width + x) * 4;
      const center = luma(data, offset);
      if (center > darknessThreshold) continue;
      const north = luma(data, ((y - stride) * width + x) * 4);
      const south = luma(data, ((y + stride) * width + x) * 4);
      const west = luma(data, (y * width + x - stride) * 4);
      const east = luma(data, (y * width + x + stride) * 4);
      const localMean = (north + south + west + east) / 4;
      const contrast = localMean - center;
      if (contrast < configuration.contrastThreshold) continue;
      if (center <= north && center <= south && center <= west && center <= east) {
        candidates.push({ x, y, score: contrast });
      }
    }
  }

  const selected: Array<{ x: number; y: number; score: number }> = [];
  candidates
    .sort((a, b) => b.score - a.score)
    .forEach(candidate => {
      if (selected.length >= configuration.candidateLimitPerFrame) return;
      const overlaps = selected.some(item => Math.hypot(item.x - candidate.x, item.y - candidate.y) < stride * 2.1);
      if (!overlaps) selected.push(candidate);
    });
  return selected;
}

function linkCandidates(
  tracks: PendingTrack[],
  candidates: Array<{ x: number; y: number; score: number }>,
  frame: number,
  scale: number,
  thresholds: CasaThresholds,
) {
  const remaining = new Set(candidates.map((_, index) => index));
  tracks.forEach(track => {
    if (track.misses > thresholds.maxMissedFrames || track.points.length === 0) {
      track.misses += 1;
      return;
    }
    const previous = track.points.at(-1)!;
    let bestIndex = -1;
    let bestScore = -Infinity;
    const prior = track.points.at(-2);
    const frameGap = Math.max(1, frame - previous.frame);
    const maxDistance = thresholds.maxLinkDistancePx * frameGap;
    const priorDx = prior ? previous.x - prior.x : 0;
    const priorDy = prior ? previous.y - prior.y : 0;
    const priorSpeed = Math.hypot(priorDx, priorDy);
    const normalizedWeights = Math.max(0.001, thresholds.linkDirectionWeight + thresholds.linkDistanceWeight + thresholds.linkSpeedWeight);
    remaining.forEach(index => {
      const candidate = candidates[index];
      const candidateX = candidate.x * scale;
      const candidateY = candidate.y * scale;
      const dx = candidateX - previous.x;
      const dy = candidateY - previous.y;
      const distance = Math.hypot(dx, dy);
      if (distance > maxDistance) return;
      const directionCosine = priorSpeed > 0 && distance > 0 ? (priorDx * dx + priorDy * dy) / (priorSpeed * distance) : 1;
      const turnDegrees = Math.acos(Math.max(-1, Math.min(1, directionCosine))) * (180 / Math.PI);
      if (priorSpeed > 0 && turnDegrees > thresholds.maxTurnDegrees) return;
      const directionScore = Math.exp(-((turnDegrees / Math.max(1, thresholds.maxTurnDegrees / 2)) ** 2));
      const distanceScore = Math.exp(-((distance / Math.max(1, maxDistance)) ** 2));
      const speedScore = priorSpeed > 0 ? Math.exp(-(((distance - priorSpeed) / Math.max(1, maxDistance)) ** 2)) : 1;
      const score = (thresholds.linkDirectionWeight * directionScore + thresholds.linkDistanceWeight * distanceScore + thresholds.linkSpeedWeight * speedScore) / normalizedWeights;
      if (score > bestScore) {
        bestIndex = index;
        bestScore = score;
      }
    });
    if (bestIndex >= 0) {
      const candidate = candidates[bestIndex];
      track.points.push({ frame, x: candidate.x * scale, y: candidate.y * scale, score: candidate.score * bestScore });
      track.associationScores.push(bestScore);
      track.misses = 0;
      remaining.delete(bestIndex);
    } else {
      track.misses += 1;
    }
  });

  remaining.forEach(index => {
    const candidate = candidates[index];
    tracks.push({
      id: `TRK-${String(tracks.length + 1).padStart(3, "0")}`,
      points: [{ frame, x: candidate.x * scale, y: candidate.y * scale, score: candidate.score }],
      misses: 0,
      color: TRACK_COLORS[tracks.length % TRACK_COLORS.length],
      associationScores: [],
    });
  });
}

export async function getVideoMetadata(sourceUrl: string, fallbackFrameRate: number) {
  const video = document.createElement("video");
  video.preload = "metadata";
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = "anonymous";
  const metadataReady = waitForVideoMetadata(video);
  video.src = sourceUrl;
  video.load();
  await metadataReady;
  return {
    width: video.videoWidth,
    height: video.videoHeight,
    duration: video.duration,
    frameRate: fallbackFrameRate,
    frameCount: Math.max(1, Math.round(video.duration * fallbackFrameRate)),
  } satisfies VideoMetadata;
}

export async function analyzeMicroscopeVideo({
  sourceUrl,
  calibration,
  thresholds,
  onProgress,
  shouldCancel,
}: {
  sourceUrl: string;
  calibration: CasaCalibration;
  thresholds: CasaThresholds;
  onProgress?: (update: AnalysisProgress) => void;
  shouldCancel?: () => boolean;
}): Promise<AnalysisOutput> {
  const timingStartedAt = performance.now();
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = "anonymous";
  throwIfAnalysisCancelled(shouldCancel);
  const metadataReady = waitForVideoMetadata(video, 15_000, shouldCancel);
  video.src = sourceUrl;
  video.load();
  await metadataReady;
  throwIfAnalysisCancelled(shouldCancel);

  const metadata: VideoMetadata = {
    width: video.videoWidth,
    height: video.videoHeight,
    duration: video.duration,
    frameRate: calibration.frameRate,
    frameCount: Math.max(1, Math.round(video.duration * calibration.frameRate)),
  };
  const maxDimension = 560;
  const scale = Math.max(metadata.width, metadata.height) / Math.min(maxDimension, Math.max(metadata.width, metadata.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(metadata.width / scale));
  canvas.height = Math.max(1, Math.round(metadata.height / scale));
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Your browser does not support the canvas analysis path.");
  const analysisScalingEvidence = buildAnalysisScalingEvidence({ sourceWidth: metadata.width, sourceHeight: metadata.height, workingCanvasWidth: canvas.width, workingCanvasHeight: canvas.height });
  const detectorConfigurationEvidence = buildDetectorConfigurationEvidence({ workingCanvasWidth: canvas.width, workingCanvasHeight: canvas.height, detectionSensitivity: thresholds.detectionSensitivity });

  const frameStep = Math.max(1, Math.ceil(metadata.frameCount / 42));
  const sampledFrames = Array.from({ length: Math.ceil(metadata.frameCount / frameStep) }, (_, index) => index * frameStep).filter(frame => frame < metadata.frameCount);
  const tracks: PendingTrack[] = [];
  const qualitySamples: FrameQualitySample[] = [];
  const fieldStabilityShifts: number[] = [];
  const candidateCounts: number[] = [];
  const candidateScores: number[] = [];
  let previousLuminanceGrid: LuminanceGrid | undefined;
  onProgress?.({
    progress: 4,
    stage: "Preparing calibrated frames",
    frame: 0,
    processedFrames: 0,
    totalFrames: sampledFrames.length,
    playbackTime: 0,
    activeTracks: 0,
    candidates: 0,
    liveTracks: [],
    candidatePoints: [],
    frameQuality: undefined,
  });

  for (let index = 0; index < sampledFrames.length; index += 1) {
    throwIfAnalysisCancelled(shouldCancel);
    const frame = sampledFrames[index];
    await seekVideo(video, Math.min(video.duration - 0.001, frame / calibration.frameRate), shouldCancel);
    throwIfAnalysisCancelled(shouldCancel);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    qualitySamples.push(measureFrameQuality(context, canvas.width, canvas.height));
    const luminanceGrid = sampleLuminanceGrid(context, canvas.width, canvas.height);
    if (previousLuminanceGrid) fieldStabilityShifts.push(estimateGlobalGridShiftPx(previousLuminanceGrid, luminanceGrid));
    previousLuminanceGrid = luminanceGrid;
    const candidates = localMinimaCandidates(context, canvas.width, canvas.height, detectorConfigurationEvidence);
    candidateCounts.push(candidates.length);
    candidateScores.push(...candidates.map(candidate => candidate.score));
    linkCandidates(tracks, candidates, frame, scale, thresholds);
    const processedFrames = index + 1;
    onProgress?.({
      progress: 8 + Math.round((processedFrames / sampledFrames.length) * 72),
      stage: `Linking frame ${processedFrames} of ${sampledFrames.length}`,
      frame,
      processedFrames,
      totalFrames: sampledFrames.length,
      playbackTime: video.currentTime,
      activeTracks: tracks.filter(track => track.misses <= thresholds.maxMissedFrames).length,
      candidates: candidates.length,
      liveTracks: tracks.filter(track => track.misses <= thresholds.maxMissedFrames).slice(-80).map(track => ({
        id: track.id,
        points: track.points,
        color: track.color,
        metrics: calculateTrackMetrics(track.id, track.points, calibration, thresholds, track.associationScores.length ? track.associationScores.reduce((sum, score) => sum + score, 0) / track.associationScores.length : 0),
      })),
      candidatePoints: candidates.slice(0, 120).map(candidate => ({ x: candidate.x * scale, y: candidate.y * scale })),
      frameQuality: summarizeCaptureQuality(qualitySamples),
      fieldStability: summarizeFieldStability(fieldStabilityShifts),
    });
    const liveFrameDelay = Math.min(80, Math.max(16, (1_000 / calibration.frameRate) * frameStep));
    await new Promise(resolve => window.setTimeout(resolve, liveFrameDelay));
  }

  throwIfAnalysisCancelled(shouldCancel);

  const eligibleTracks = tracks
    .filter(track => track.points.length >= thresholds.minTrackFrames)
    .map(track => ({
      id: track.id,
      points: track.points,
      color: track.color,
      metrics: calculateTrackMetrics(track.id, track.points, calibration, thresholds, track.associationScores.length ? track.associationScores.reduce((sum, score) => sum + score, 0) / track.associationScores.length : 0),
    }));
  const confidenceDistribution = buildConfidenceDistribution(eligibleTracks.map(track => track.metrics.confidence), thresholds.minTrackConfidence);
  const temporalSampling = buildTemporalSamplingEvidence({ availableFrames: metadata.frameCount, processedFrames: sampledFrames.length, frameStep, frameRate: calibration.frameRate });
  const processedTracks = eligibleTracks
    .filter(track => track.metrics.confidence >= thresholds.minTrackConfidence)
    .sort((a, b) => b.metrics.vcl - a.metrics.vcl);
  const classificationComposition = buildClassificationComposition(processedTracks.map(track => track.metrics));
  const trackDurationEvidence = buildTrackDurationEvidence(processedTracks.map(track => track.metrics.frames));
  const trackMetricRangeEvidence = buildTrackMetricRangeEvidence(processedTracks.map(track => track.metrics));
  const trackLinkageContinuity = buildTrackLinkageContinuityEvidence(processedTracks.map(track => ({ id: track.id, points: track.points })), frameStep);
  const trajectorySpatialCoverage = buildTrajectorySpatialCoverageEvidence({ tracks: processedTracks.map(track => ({ id: track.id, points: track.points })), width: metadata.width, height: metadata.height });
  const fieldBoundaryContact = buildFieldBoundaryContactEvidence({ tracks: processedTracks.map(track => ({ id: track.id, points: track.points })), width: metadata.width, height: metadata.height });
  const trajectoryTemporalPlacement = buildTrajectoryTemporalPlacementEvidence({ tracks: processedTracks.map(track => ({ id: track.id, points: track.points })), availableFrames: metadata.frameCount, frameStep });
  const trackDirectionalBalance = buildTrackDirectionalBalanceEvidence(processedTracks.map(track => ({ id: track.id, points: track.points })));
  const summary = summarizeTracks(processedTracks.map(track => track.metrics));
  const outputFingerprint = createOutputFingerprint({ metadata, summary, frameStep, processedFrames: sampledFrames.length, tracks: processedTracks });
  const candidateDetectionLoad = buildCandidateDetectionLoadEvidence(candidateCounts);
  const detectorLoadTimeline = buildDetectorLoadTimeline({ candidateCounts, sampledFrames });
  const candidateScoreDistribution = buildCandidateScoreDistributionEvidence(candidateScores);
  const processingPerformance = buildProcessingPerformanceEvidence({ elapsedMilliseconds: performance.now() - timingStartedAt, processedFrames: sampledFrames.length });
  const captureQuality = summarizeCaptureQuality(qualitySamples);
  const captureQualityVariability = buildCaptureQualityVariability(qualitySamples);
  const fieldStability = summarizeFieldStability(fieldStabilityShifts);
  const trajectoryIntegrity = buildTrajectoryIntegrityEvidence(trackLinkageContinuity, trajectoryTemporalPlacement, fieldBoundaryContact);
  const qualityFlags = buildQualityFlags({
    validTrackCount: processedTracks.length,
    sampledFrames: sampledFrames.length,
    availableFrames: metadata.frameCount,
    duration: metadata.duration,
    meanConfidence: summary.meanConfidence,
    captureQuality,
    fieldStability,
  });
  onProgress?.({
    progress: 100,
    stage: "Analysis complete — laboratory review required",
    frame: metadata.frameCount - 1,
    processedFrames: sampledFrames.length,
    totalFrames: sampledFrames.length,
    playbackTime: metadata.duration,
    activeTracks: processedTracks.length,
    candidates: 0,
    liveTracks: processedTracks.slice(0, 80),
    candidatePoints: [],
    frameQuality: captureQuality,
    fieldStability,
  });

  return { metadata, tracks: processedTracks, summary, qualityFlags, captureQuality, fieldStability, confidenceDistribution, temporalSampling, classificationComposition, trackDurationEvidence, trackMetricRangeEvidence, trackLinkageContinuity, trajectorySpatialCoverage, fieldBoundaryContact, trajectoryTemporalPlacement, trackDirectionalBalance, trajectoryIntegrity, outputFingerprint, candidateDetectionLoad, candidateScoreDistribution, processingPerformance, analysisScalingEvidence, detectorConfigurationEvidence, captureQualityVariability, detectorLoadTimeline };
}
