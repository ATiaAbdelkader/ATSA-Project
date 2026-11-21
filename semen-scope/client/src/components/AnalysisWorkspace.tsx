import { MetricChart } from "@/components/MetricChart";
import { MetricStrip } from "@/components/MetricStrip";
import "./FootageProvenance.css";
import "./LocalMethodDraft.css";
import "./AnalysisSessionReference.css";
import "./ActiveCameraPreview.css";
import "./PartialCameraCaptureReview.css";
import { KinematicLandscape } from "@/components/KinematicLandscape";
import { TrackCanvas } from "@/components/TrackCanvas";
import { TrajectoryAudit } from "@/components/TrajectoryAudit";
import { ConfidenceDistribution } from "@/components/ConfidenceDistribution";
import { TemporalSamplingEvidence } from "@/components/TemporalSamplingEvidence";
import { ClassificationComposition } from "@/components/ClassificationComposition";
import { TrackDurationEvidence } from "@/components/TrackDurationEvidence";
import { TrackMetricRangeEvidence } from "@/components/TrackMetricRangeEvidence";
import { TrackLinkageContinuity } from "@/components/TrackLinkageContinuity";
import { TrajectoryIntegrity } from "@/components/TrajectoryIntegrity";
import { TrajectorySpatialCoverage } from "@/components/TrajectorySpatialCoverage";
import { FieldBoundaryContact } from "@/components/FieldBoundaryContact";
import { TrajectoryTemporalPlacement } from "@/components/TrajectoryTemporalPlacement";
import { TrackDirectionalBalance } from "@/components/TrackDirectionalBalance";
import { OutputFingerprint } from "@/components/OutputFingerprint";
import { CandidateDetectionLoad } from "@/components/CandidateDetectionLoad";
import { CandidateScoreDistribution } from "@/components/CandidateScoreDistribution";
import { ProcessingPerformance } from "@/components/ProcessingPerformance";
import { TechnicalEvidenceNavigator } from "@/components/TechnicalEvidenceNavigator";
import { AnalysisScalingEvidence } from "@/components/AnalysisScalingEvidence";
import { DetectorConfigurationEvidence } from "@/components/DetectorConfigurationEvidence";
import { CaptureQualityVariability } from "@/components/CaptureQualityVariability";
import { DetectorLoadTimeline } from "@/components/DetectorLoadTimeline";
import { BrowserIntakeCapability } from "@/components/BrowserIntakeCapability";
import { DataHandlingGuide } from "@/components/DataHandlingGuide";
import { analyzeMicroscopeVideo, getVideoMetadata, type AnalysisOutput, type AnalysisProgress, type ProcessedTrack, type VideoMetadata } from "@/lib/analysisProcessor";
import { trpc } from "@/lib/trpc";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { DEFAULT_CASA_CALIBRATION, DEFAULT_CASA_THRESHOLDS, roundMetric, type CasaCalibration, type CasaThresholds } from "@shared/casa";
import { attachCalibrationEvidence, estimateCalibrationBoardScale, getCalibrationProvenance, type CalibrationBoardEvidence, type CalibrationBoardPoint } from "@shared/calibrationBoard";
import { getStoredSnapshotDetails, type StoredSnapshotDetails } from "@shared/dashboardSnapshot";
import { buildSnapshotTechnicalEvidence } from "@shared/snapshotTechnicalEvidence";
import { buildLaboratoryHandoffCsv, buildLaboratoryHandoffText } from "@shared/labHandoff";
import { buildMultiFieldReview, getMultiFieldReviewBlocker, type MultiFieldResult, type MultiFieldReview } from "@shared/multiFieldReview";
import { buildAcquisitionReadiness, calculateDosePlan, EMPTY_DOSE_PLAN, EMPTY_SPECIMEN_CONTEXT, type DosePlanInput, type SpecimenContext } from "@shared/specimenWorkflow";
import { buildTrajectoryCoordinateCsv } from "@shared/trajectoryCoordinateExport";
import { buildDetectorLoadTimelineCsv } from "@shared/detectorLoadTimelineExport";
import { buildCandidateScoreDistributionCsv } from "@shared/candidateScoreDistributionExport";
import { buildMultiFieldReviewCsv } from "@shared/multiFieldReviewExport";
import { buildCurrentFramePngFilename, CURRENT_FRAME_EXPORT_NOTICE } from "@shared/currentFrameExport";
import { buildCurrentRunTechnicalCopyText, CURRENT_RUN_TECHNICAL_COPY_NOTICE } from "@shared/currentRunTechnicalCopy";
import { getKeyboardReviewFrameStepDirection } from "@shared/keyboardReviewFrameStep";
import { buildSelectedTrajectoryCsvFilename, SELECTED_TRAJECTORY_EXPORT_NOTICE } from "@shared/selectedTrajectoryExport";
import { buildTrajectoryMapPngFilename, TRAJECTORY_MAP_EXPORT_NOTICE } from "@shared/trajectoryMapExport";
import { resolveReviewFrameStep, resolveReviewTimestampSeek } from "@shared/frameReview";
import { addReviewBookmark, createReviewBookmark, removeReviewBookmark, updateReviewBookmarkOperatorLabel, type ReviewBookmark } from "@shared/reviewBookmarks";
import { buildReviewBookmarkCsv, buildReviewBookmarkCsvFilename, REVIEW_BOOKMARK_EXPORT_NOTICE } from "@shared/reviewBookmarkExport";
import { addTechnicalReviewWindowEnd, createTechnicalReviewWindowStart, formatTechnicalReviewWindow, getTechnicalReviewWindowBoundary, shouldRestartTechnicalReviewWindow, type TechnicalReviewWindow } from "@shared/reviewWindow";
import { buildTechnicalReviewWindowCsv, buildTechnicalReviewWindowCsvFilename, REVIEW_WINDOW_EXPORT_NOTICE } from "@shared/reviewWindowExport";
import { filterTrackReviewRows, type TrackReviewFilter } from "@shared/trackReviewFilter";
import { clearTechnicalReviewedTracks, isTechnicalReviewedTrack, toggleTechnicalReviewedTrack } from "@shared/trackReviewMark";
import { buildReviewedTrackCsv, buildReviewedTrackCsvFilename, REVIEWED_TRACK_EXPORT_NOTICE } from "@shared/reviewedTrackExport";
import { buildTechnicalReviewAnnotationStatus, buildTechnicalReviewAnnotationsFilename, buildTechnicalReviewAnnotationsJson, createClearedTechnicalReviewAnnotations, getReviewAnnotationsDurationBlocker, getReviewAnnotationsFileSizeBlocker, getReviewAnnotationsImportBlocker, parseTechnicalReviewAnnotationsJson, REVIEW_ANNOTATIONS_EXPORT_NOTICE, REVIEW_ANNOTATIONS_IMPORT_NOTICE } from "@shared/reviewAnnotationsExport";
import { getReviewPlaybackRateAfterFootageChange, resolveReviewPlaybackRate, REVIEW_PLAYBACK_RATES } from "@shared/reviewPlayback";
import { buildTechnicalReviewQueue } from "@shared/trackReviewQueue";
import { createMethodFingerprint } from "@shared/methodFingerprint";
import { createBrowserLocalAnalysisRunContext, type BrowserLocalAnalysisRunContext } from "@shared/analysisRunContext";
import { buildBrowserIntakeCapabilityEvidence } from "@shared/browserIntakeCapability";
import { isAnalysisCancelledError } from "@shared/analysisCancellation";
import { CAMERA_CLIP_DURATIONS_SECONDS, describeCameraClipDuration, getRemainingCameraClipSeconds, normalizeCameraClipDuration } from "@shared/cameraClipDuration";
import { resolveCameraCaptureFrameDimensions } from "@shared/cameraCaptureFrame";
import { buildCameraDeviceOptions, type CameraDeviceOption } from "@shared/cameraDeviceInventory";
import { selectCameraRecorderMimeType } from "@shared/cameraRecorderFormat";
import { buildCameraPreviewConstraints, CAMERA_PREVIEW_PROFILES, type CameraPreviewProfileId } from "@shared/cameraPreviewProfile";
import { buildCameraPreviewResolutionEvidence, type CameraPreviewResolutionEvidence } from "@shared/cameraPreviewEvidence";
import { buildCameraFrameRateReview } from "@shared/cameraFrameRateReview";
import { buildCameraAcquisitionReadiness } from "@shared/cameraAcquisitionReadiness";
import { CAMERA_PREVIEW_ORIENTATIONS, getCameraPreviewOrientationClass, type CameraPreviewOrientationId } from "@shared/cameraPreviewOrientation";
import { buildCameraStillPngFilename, CAMERA_STILL_EXPORT_NOTICE } from "@shared/cameraStillExport";
import { CAMERA_PRE_CAPTURE_DELAYS_SECONDS, describeCameraPreCaptureDelay, getPreCaptureDelayRemainingSeconds, normalizeCameraPreCaptureDelay } from "@shared/cameraPreCaptureDelay";
import { shouldWarnBeforeBrowserExit } from "@shared/browserExitGuard";
import { formatActualCaptureDuration, formatActivePreviewFrameRate, formatActivePreviewResizeMode, formatCameraRecorderMimeType, formatCameraRecordingStopReason, formatCaptureDeviceLabel, formatCaptureFrameDimensions, formatCaptureTimestamp, formatFootageByteSize, formatPreCaptureStabilizationDelay, formatRequestedCaptureDuration, formatRequestedPreviewProfile, getFootageSourceLabel, inferFootageContainer, type CameraRecordingStopReason, type FootageProvenance } from "@shared/footageProvenance";
import { requiresPartialCameraCaptureAcknowledgement } from "@shared/partialCameraCaptureReview";
import { getRunAnalysisDisabledReason } from "@shared/runAnalysisBlocker";
import { buildFootageProvenanceSummaryLine } from "@shared/analysisSummary";
import { EMPTY_OPTICS_TRACEABILITY, formatChamberDepthMicrons, formatOpticsMagnification, type OpticsTraceability } from "@shared/opticsTraceability";
import { createLocalMethodDraft, LOCAL_METHOD_DRAFT_STORAGE_KEY, parseLocalMethodDraft } from "@shared/localMethodDraft";
import { createTemporarySessionResetState } from "@shared/temporarySessionReset";
import { getDashboardViewFromSearch, type DashboardView } from "@shared/dashboardView";
import { ANALYSIS_SESSION_REFERENCE_NOTICE, createBrowserLocalAnalysisSessionReference } from "@shared/analysisSessionReference";
import {
  Activity,
  AlertTriangle,
  Aperture,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  ChevronRight,
  CircleAlert,
  Database,
  Download,
  FileVideo,
  FlaskConical,
  History,
  Info,
  Loader2,
  Microscope,
  Pause,
  Play,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Upload,
  Video,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type MouseEvent } from "react";
import { toast } from "sonner";

type SourceType = "reference" | "upload" | "camera";

type SampleSource = {
  id: string;
  label: string;
  url: string;
  descriptor: string;
};

const REFERENCE_SAMPLES: SampleSource[] = [
  { id: "S-01", label: "Reference field 01", url: "/manus-storage/reference-1-h264_d72c1665.mp4", descriptor: "1.00 s · 780 × 580 · H.264" },
  { id: "S-02", label: "Reference field 02", url: "/manus-storage/reference-2-h264_d073ff0b.mp4", descriptor: "1.00 s · 780 × 580 · H.264" },
  { id: "S-03", label: "Reference field 03", url: "/manus-storage/reference-3-h264_2a900d9c.mp4", descriptor: "1.00 s · 780 × 580 · H.264" },
  { id: "S-04", label: "Reference field 04", url: "/manus-storage/reference-4-h264_a07c7d9f.mp4", descriptor: "1.00 s · 780 × 580 · H.264" },
  { id: "S-05", label: "Reference field 05", url: "/manus-storage/reference-5-h264_d8c4efae.mp4", descriptor: "1.00 s · 780 × 580 · H.264" },
];

const REFERENCE_POSTERS: Record<string, string> = {
  "S-03": "/manus-storage/reference-field-03-poster_b4795b7d.png",
};

const SPECIES = ["Bovine", "Equine", "Canine", "Porcine", "Ovine", "Caprine", "Other"];

function parseSettings(value: string) {
  try {
    const parsed = JSON.parse(value) as { calibration?: CasaCalibration; thresholds?: CasaThresholds; species?: string; calibrationEvidence?: CalibrationBoardEvidence };
    return {
      calibration: { ...DEFAULT_CASA_CALIBRATION, ...parsed.calibration },
      thresholds: { ...DEFAULT_CASA_THRESHOLDS, ...parsed.thresholds },
      species: parsed.species || "Bovine",
      calibrationEvidence: parsed.calibrationEvidence,
    };
  } catch {
    return undefined;
  }
}

function formatDuration(duration?: number) {
  if (!duration || !Number.isFinite(duration)) return "—";
  return `${duration.toFixed(2)} s`;
}

function getDashboardViewFromUrl(): DashboardView {
  if (typeof window === "undefined") return "workspace";
  return getDashboardViewFromSearch(window.location.search);
}

type PersistedAnalysisRecord = {
  id: number;
  sampleName: string;
  species: string;
  source: SourceType;
  videoFileName: string;
  videoMetadataJson: string;
  calibrationJson: string;
  thresholdsJson: string;
  metricsJson: string;
  qualityFlagsJson: string;
  status: "complete" | "review_required";
  createdAt: Date | string;
};

function formatSavedDate(value: Date | string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Saved date unavailable" : date.toLocaleString();
}

function SnapshotStatus({ record, details }: { record: PersistedAnalysisRecord; details: StoredSnapshotDetails }) {
  const provenance = getCalibrationProvenance(details.calibrationEvidence);
  return <><div className="snapshot-status-row">
    <span className="snapshot-status"><CircleAlert size={13} />{record.status.replace("_", " ")}</span>
    <span className={`snapshot-provenance ${provenance === "board-referenced" ? "verified" : "manual"}`}>{provenance === "board-referenced" ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}{provenance === "board-referenced" ? "Board-referenced scale" : "Manual scale"}</span>
    {details.methodFingerprint && <span className="snapshot-method-fingerprint">{details.methodFingerprint}</span>}
    {details.classificationComposition && <span className="snapshot-classification-composition">{details.classificationComposition.progressive} progressive · {details.classificationComposition.motileNonProgressive} motile · {details.classificationComposition.nonMotile} non-motile</span>}
    {details.trackDurationEvidence && <span className="snapshot-track-duration">{details.trackDurationEvidence.meanFrames.toFixed(1)} mean frames · {details.trackDurationEvidence.shortestFrames}-{details.trackDurationEvidence.longestFrames} frame span</span>}
    {details.trackMetricRangeEvidence && <span className="snapshot-metric-range">VCL {details.trackMetricRangeEvidence.vcl.minimum.toFixed(1)}–{details.trackMetricRangeEvidence.vcl.maximum.toFixed(1)} µm/s · {details.trackMetricRangeEvidence.vcl.outlierTrackIds.length} candidate review</span>}
    {details.trackLinkageContinuity && <span className="snapshot-linkage-continuity">{details.trackLinkageContinuity.continuityPercent.toFixed(1)}% nominal links · technical only, no reclassification</span>}
    {details.trajectorySpatialCoverage && <span className="snapshot-spatial-coverage">{details.trajectorySpatialCoverage.occupiedCells}/{details.trajectorySpatialCoverage.totalCells} image regions · technical only, not density</span>}
    {details.fieldBoundaryContact && <span className="snapshot-boundary-contact">{details.fieldBoundaryContact.boundaryPointPercent.toFixed(1)}% outer-boundary points · technical only, no rejection</span>}
    {details.trajectoryTemporalPlacement && <span className="snapshot-temporal-placement">{details.trajectoryTemporalPlacement.tracksStartingAtWindowBoundary} starts / {details.trajectoryTemporalPlacement.tracksEndingAtWindowBoundary} ends at window boundary · technical only</span>}
    {details.trackDirectionalBalance && <span className="snapshot-directional-balance">{details.trackDirectionalBalance.dominantOctant} image octant · technical only, not compensation</span>}
    {details.trajectoryIntegrity && <span className="snapshot-trajectory-integrity">{details.trajectoryIntegrity.summaryLine} · technical only, not a biological result</span>}
    {details.outputFingerprint && <span className="snapshot-output-fingerprint">{details.outputFingerprint} · reproducibility only</span>}
    {details.candidateDetectionLoad && <span className="snapshot-candidate-load">{details.candidateDetectionLoad.meanCandidatesPerFrame.toFixed(1)} candidates / sampled frame · {details.candidateDetectionLoad.framesAtCandidateLimit} cap-bound · technical only</span>}
    {details.candidateScoreDistribution && <span className="snapshot-candidate-score">median score {details.candidateScoreDistribution.medianScore.toFixed(1)} · technical only</span>}
    {details.processingPerformance && <span className="snapshot-processing-performance">{details.processingPerformance.elapsedMilliseconds.toFixed(0)} ms local loop · technical only</span>}
    {details.analysisScalingEvidence && <span className="snapshot-analysis-scaling">{details.analysisScalingEvidence.sourceWidth}×{details.analysisScalingEvidence.sourceHeight} → {details.analysisScalingEvidence.workingCanvasWidth}×{details.analysisScalingEvidence.workingCanvasHeight} canvas · technical only</span>}
    {details.detectorConfigurationEvidence && <span className="snapshot-detector-configuration">{details.detectorConfigurationEvidence.samplingStridePx}px stride · cap {details.detectorConfigurationEvidence.candidateLimitPerFrame} · technical only</span>}
    {details.captureQualityVariability && <span className="snapshot-quality-variability">brightness SD {details.captureQualityVariability.brightnessStandardDeviation.toFixed(2)} · technical only</span>}
    {details.detectorLoadTimeline && <span className="snapshot-detector-timeline">peak {details.detectorLoadTimeline.peakCandidates} at frame {details.detectorLoadTimeline.peakFrame ?? "—"} · technical only</span>}
  </div><SnapshotTechnicalEvidence details={details} /></>;
}

function SnapshotTechnicalEvidence({ details }: { details: StoredSnapshotDetails }) {
  const entries = buildSnapshotTechnicalEvidence(details);
  if (!entries.length) return null;
  return <section className="snapshot-technical-evidence" aria-label="Persisted technical evidence"><div className="snapshot-evidence-heading"><div><p className="eyebrow">PERSISTED TECHNICAL EVIDENCE</p><h3>Immutable review archive</h3></div><small>Read-only technical provenance. These entries do not change saved tracks, metrics, classifications, or biological interpretation.</small></div><div className="snapshot-evidence-grid">{entries.map(entry => <article key={entry.id}><strong>{entry.title}</strong><span>{entry.detail}</span><small>{entry.safeguard}</small></article>)}</div></section>;
}

function SampleHistoryView({
  records,
  isAuthenticated,
  selectedRecordId,
  onSelectRecord,
  onUseMethod,
  onOpenQuality,
  onDownload,
  onDownloadHandoff,
  onCopyHandoff,
  onOpenWorkspace,
}: {
  records: PersistedAnalysisRecord[];
  isAuthenticated: boolean;
  selectedRecordId?: number;
  onSelectRecord: (id: number) => void;
  onUseMethod: (record: PersistedAnalysisRecord) => void;
  onOpenQuality: (id: number) => void;
  onDownload: (record: PersistedAnalysisRecord) => void;
  onDownloadHandoff: (record: PersistedAnalysisRecord) => void;
  onCopyHandoff: (record: PersistedAnalysisRecord) => void;
  onOpenWorkspace: () => void;
}) {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<"all" | SourceType>("all");
  const persistedRecordsState = trpc.analysis.list.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const normalizedQuery = query.trim().toLowerCase();
  const filteredRecords = records.filter(record => {
    const matchesQuery = !normalizedQuery || `${record.sampleName} ${record.species} ${record.videoFileName}`.toLowerCase().includes(normalizedQuery);
    return matchesQuery && (source === "all" || record.source === source);
  });
  const selected = filteredRecords.find(record => record.id === selectedRecordId) ?? filteredRecords[0];
  const selectedDetails = selected ? getStoredSnapshotDetails(selected) : undefined;
  const comparisonRows = filteredRecords.slice(0, 4).map((record, index) => {
    const metrics = getStoredSnapshotDetails(record).metrics;
    const previous = filteredRecords[index + 1] ? getStoredSnapshotDetails(filteredRecords[index + 1]).metrics : undefined;
    const delta = previous && Number.isFinite(metrics.motility) && Number.isFinite(previous.motility) ? metrics.motility - previous.motility : undefined;
    return { record, metrics, delta };
  });

  if (isAuthenticated && persistedRecordsState.isLoading) return <section className="dashboard-tab-view"><div className="tab-loading-state"><Loader2 className="spin" size={24} /><strong>Loading saved laboratory snapshots</strong><span>Retrieving records for this signed-in laboratory profile.</span></div></section>;
  if (isAuthenticated && persistedRecordsState.isError) return <section className="dashboard-tab-view"><div className="tab-error-state"><CircleAlert size={25} /><h2>Saved history could not be loaded</h2><p>Check the connection and try again. Existing local analysis work has not been changed.</p><button className="primary-action" onClick={() => persistedRecordsState.refetch()}><RefreshCcw size={17} />Try again</button></div></section>;

  return <section className="dashboard-tab-view">
    <div className="tab-hero">
      <div><p className="eyebrow">PERSISTED RECORDS · IMMUTABLE SNAPSHOTS</p><h1>Sample <em>history.</em></h1><p>Browse stored analyses by sample, source, and date. Each snapshot preserves the method, calibration, technical flags, and automated estimates recorded when it was saved.</p></div>
      <div className="method-note"><History size={18} /><p><strong>Review handoff.</strong> Opening a saved record never alters it. Loading its method creates an editable draft in the analysis workspace; it does not replace the original snapshot.</p></div>
    </div>

    {!isAuthenticated ? <div className="tab-empty-state"><Database size={28} /><h2>Sign in to view laboratory records</h2><p>Saved results are scoped to the signed-in laboratory profile. Analyses remain browser-local until they are explicitly saved.</p><button className="primary-action" onClick={startLogin}>Sign in to access history</button></div> : records.length === 0 ? <div className="tab-empty-state"><History size={28} /><h2>No saved analyses yet</h2><p>Run an analysis in the workspace and save its immutable result snapshot to begin longitudinal review.</p><button className="primary-action" onClick={onOpenWorkspace}><FlaskConical size={17} />Open analysis workspace</button></div> : <>
      <div className="history-toolbar panel"><label className="history-search"><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search sample, species, or file" aria-label="Search saved analysis records" /></label><div className="source-filters" aria-label="Filter history by source">{(["all", "reference", "upload", "camera"] as const).map(item => <button key={item} className={source === item ? "active" : ""} onClick={() => setSource(item)}>{item === "all" ? "All sources" : item}</button>)}</div></div>
      <div className="history-workbench">
        <div className="panel saved-record-list"><div className="panel-heading compact"><div><p className="eyebrow">SAVED SNAPSHOTS</p><h2>{filteredRecords.length} matching record{filteredRecords.length === 1 ? "" : "s"}</h2></div><span>latest first</span></div><div className="saved-record-scroll">{filteredRecords.map(record => { const details = getStoredSnapshotDetails(record); return <button key={record.id} className={`saved-record-row ${selected?.id === record.id ? "selected" : ""}`} onClick={() => onSelectRecord(record.id)}><span className="record-source-dot"><FileVideo size={14} /></span><span><strong>{record.sampleName}</strong><small>{record.species} · {record.source} · {formatSavedDate(record.createdAt)}</small><SnapshotStatus record={record} details={details} /></span><ChevronRight size={15} /></button>; })}{filteredRecords.length === 0 && <div className="no-filter-results"><Search size={20} /><span>No snapshots match the current filters.</span></div>}</div></div>
        {selected && selectedDetails && <article className="panel saved-record-detail"><div className="panel-heading"><div><p className="eyebrow">REVIEWED SNAPSHOT</p><h2>{selected.sampleName}</h2></div><span className="snapshot-id">#{selected.id}</span></div><div className="snapshot-detail-body"><SnapshotStatus record={selected} details={selectedDetails} /><div className="snapshot-facts"><span>Species<strong>{selected.species}</strong></span><span>Source<strong>{selected.source}</strong></span><span>Saved<strong>{formatSavedDate(selected.createdAt)}</strong></span><span>File<strong>{selected.videoFileName}</strong></span></div><div className="saved-metric-grid"><span>Total motility<strong>{roundMetric(selectedDetails.metrics.motility ?? 0)}<small>%</small></strong></span><span>Progressive<strong>{roundMetric(selectedDetails.metrics.progressiveMotility ?? 0)}<small>%</small></strong></span><span>VCL<strong>{roundMetric(selectedDetails.metrics.vcl ?? 0)}<small>µm/s</small></strong></span><span>Valid tracks<strong>{roundMetric(selectedDetails.metrics.validTracks ?? 0)}</strong></span></div>{selectedDetails.temporalSampling && <TemporalSamplingEvidence evidence={selectedDetails.temporalSampling} />}{(selectedDetails.specimenContext || selectedDetails.opticsTraceability || selectedDetails.acquisitionReadiness || selectedDetails.dosePlan) && <div className="snapshot-workflow-evidence"><div><p className="eyebrow">SPECIMEN + ACQUISITION EVIDENCE</p><h3>{selectedDetails.specimenContext?.specimenId || selectedDetails.specimenContext?.donorId || "No specimen ID recorded"}</h3><span>{selectedDetails.specimenContext?.donorId ? `Donor / animal: ${selectedDetails.specimenContext.donorId}` : "Donor / animal not recorded"}</span><span>{selectedDetails.specimenContext?.collectionReference ? `Collection: ${selectedDetails.specimenContext.collectionReference}` : "Collection reference not recorded"}</span><span>{selectedDetails.specimenContext?.collectionDateTime ? `Collection time (entered): ${selectedDetails.specimenContext.collectionDateTime}` : "Collection time not recorded"}</span><span>{selectedDetails.specimenContext?.preparationProtocolReference ? `Preparation protocol: ${selectedDetails.specimenContext.preparationProtocolReference}` : "Preparation protocol not recorded"}</span><span>{`Objective (entered): ${formatOpticsMagnification(selectedDetails.opticsTraceability?.objectiveMagnification)}`}</span><span>{`Chamber depth (entered): ${formatChamberDepthMicrons(selectedDetails.opticsTraceability?.chamberDepthMicrons)}`}</span></div><div className="snapshot-readiness">{selectedDetails.acquisitionReadiness ? <><strong>{selectedDetails.acquisitionReadiness.readyCount} readiness items ready</strong><span>{selectedDetails.acquisitionReadiness.reviewCount} review · {selectedDetails.acquisitionReadiness.pendingCount} pending</span></> : <span>Readiness evidence not recorded in this historical snapshot.</span>}</div>{selectedDetails.dosePlan && "theoreticalDoseCount" in selectedDetails.dosePlan ? <div className="snapshot-dose-plan"><strong>{roundMetric(selectedDetails.dosePlan.theoreticalDoseCount, 1)} planning-only doses</strong><span>Calculated only from operator-entered concentration, volume, and target.</span></div> : <div className="snapshot-dose-plan"><span>No complete dose-planning inputs were stored.</span></div>}</div>}<div className="snapshot-flag-summary"><AlertTriangle size={15} /><span><strong>{selectedDetails.flags.length} review flag{selectedDetails.flags.length === 1 ? "" : "s"}</strong>{selectedDetails.flags[0] ? <small>{selectedDetails.flags[0]}</small> : <small>No stored flags were found in this record.</small>}</span></div><div className="snapshot-actions"><button onClick={() => onUseMethod(selected)}><SlidersHorizontal size={15} />Use method as draft</button><button onClick={() => onOpenQuality(selected.id)}><ClipboardCheck size={15} />Open quality review</button><button onClick={() => onCopyHandoff(selected)}><Copy size={15} />Copy handoff</button><button onClick={() => onDownloadHandoff(selected)}><Download size={15} />Export handoff CSV</button><button onClick={() => onDownload(selected)}><Download size={15} />Export record manifest</button></div></div></article>}
      </div>
      {comparisonRows.length > 1 && <div className="panel snapshot-comparison"><div className="panel-heading compact"><div><p className="eyebrow">QUICK COMPARISON</p><h2>Saved motility estimates</h2></div><span>same-lab review</span></div><div className="comparison-table-wrap"><table className="comparison-table"><thead><tr><th>Saved snapshot</th><th>Species</th><th>Motility</th><th>Progressive</th><th>VCL</th><th>Δ motility to prior</th></tr></thead><tbody>{comparisonRows.map(({ record, metrics, delta }) => <tr key={record.id}><td>{record.sampleName}<small className="table-subtle">{formatSavedDate(record.createdAt)}</small></td><td>{record.species}</td><td>{roundMetric(metrics.motility ?? 0)}%</td><td>{roundMetric(metrics.progressiveMotility ?? 0)}%</td><td>{roundMetric(metrics.vcl ?? 0)} µm/s</td><td>{delta === undefined ? <span className="comparison-none">—</span> : <span className={delta >= 0 ? "comparison-up" : "comparison-down"}>{delta >= 0 ? "+" : ""}{roundMetric(delta)} pp</span>}</td></tr>)}</tbody></table></div></div>}
    </>}
  </section>;
}

function MethodControlsView({
  calibration,
  thresholds,
  species,
  calibrationEvidence,
  methodFingerprint,
  isAuthenticated,
  saving,
  onSpeciesChange,
  onMicronsChange,
  onFrameRateChange,
  onThresholdChange,
  onOpenCalibration,
  onSave,
}: {
  calibration: CasaCalibration;
  thresholds: CasaThresholds;
  species: string;
  calibrationEvidence?: CalibrationBoardEvidence;
  methodFingerprint: string;
  isAuthenticated: boolean;
  saving: boolean;
  onSpeciesChange: (value: string) => void;
  onMicronsChange: (value: number) => void;
  onFrameRateChange: (value: number) => void;
  onThresholdChange: (key: keyof CasaThresholds, value: number) => void;
  onOpenCalibration: () => void;
  onSave: () => void;
}) {
  const provenance = getCalibrationProvenance(calibrationEvidence);
  return <section className="dashboard-tab-view">
    <div className="tab-hero"><div><p className="eyebrow">LABORATORY PRESET · REPRODUCIBLE METHOD</p><h1>Method <em>controls.</em></h1><p>Maintain a transparent draft of the camera calibration and CASA-style thresholds. Save the current method profile for this laboratory, then retain its values with each immutable analysis record.</p></div><div className="method-note"><ShieldCheck size={18} /><p><strong>Protocol safeguard.</strong> Changes apply to the active draft only. Validate all cut-offs under the applicable species and laboratory method before interpreting results.</p></div></div>
    <div className="method-overview-grid"><article className={`method-provenance-card ${provenance === "board-referenced" ? "board" : "manual"}`}><div><p className="eyebrow">CALIBRATION PROVENANCE</p><h2>{provenance === "board-referenced" ? "Board-referenced scale" : "Manual scale only"}</h2></div>{provenance === "board-referenced" ? <CheckCircle2 size={22} /> : <AlertTriangle size={22} />}<strong>{roundMetric(calibration.micronsPerPixel, 5)} µm / px</strong><p>{calibrationEvidence ? `${calibrationEvidence.boardIntervalMicrons} µm measured over ${roundMetric(calibrationEvidence.pixelDistance)} px using ${calibrationEvidence.method}.` : "No calibration-board evidence is attached to this draft. Velocity and distance estimates require laboratory confirmation."}</p><button onClick={onOpenCalibration}><Aperture size={15} />{calibrationEvidence ? "Review board calibration" : "Open calibration wizard"}</button></article><article className="panel method-save-card"><p className="eyebrow">SAVED LAB PRESET</p><h2>{isAuthenticated ? "Ready to save" : "Sign in required"}</h2><p>{isAuthenticated ? "Store the current calibration, species context, provenance, and threshold values in your laboratory profile." : "Authentication protects laboratory-specific method presets and stored result snapshots."}</p><button className="primary-action" onClick={onSave} disabled={saving}>{saving ? <Loader2 className="spin" size={17} /> : <Save size={17} />}{isAuthenticated ? "Save method preset" : "Sign in to save"}</button></article><article className="panel method-save-card"><p className="eyebrow">REPRODUCIBILITY SNAPSHOT</p><h2>{species} · {calibration.frameRate} fps</h2><p>Association is motion-aware weighted direction, distance, and speed matching. Each saved analysis stores a separate threshold and calibration snapshot.</p><strong className="method-fingerprint"><Database size={14} />{methodFingerprint}</strong><span className="method-footnote">Deterministic local fingerprint of this species, calibration, and threshold draft.</span></article></div>
    <div className="method-controls-grid">
      <article className="panel method-form-panel"><div className="panel-heading"><div><p className="eyebrow">ACQUISITION CONTEXT</p><h2>Calibration and species</h2></div><Settings2 size={18} /></div><div className="method-form-body"><label>Species<select value={species} onChange={event => onSpeciesChange(event.target.value)}>{SPECIES.map(item => <option key={item}>{item}</option>)}</select></label><div className="method-field-pair"><label>µm / pixel<input type="number" min="0.01" step="0.01" value={calibration.micronsPerPixel} onChange={event => onMicronsChange(Number(event.target.value) || 0.01)} /></label><label>Frames / sec<input type="number" min="1" step="1" value={calibration.frameRate} onChange={event => onFrameRateChange(Number(event.target.value) || 1)} /></label></div><div className="method-info-callout"><Info size={15} /><span>Changing µm/px manually clears board provenance, because the reference image may no longer support the active scale.</span></div></div></article>
      <article className="panel method-form-panel"><div className="panel-heading"><div><p className="eyebrow">CORE ANALYSIS CUT-OFFS</p><h2>Detection and motility</h2></div><SlidersHorizontal size={18} /></div><div className="method-form-body threshold-form"><label>Detection sensitivity <output>{thresholds.detectionSensitivity}</output><input type="range" min="10" max="55" value={thresholds.detectionSensitivity} onChange={event => onThresholdChange("detectionSensitivity", Number(event.target.value))} /></label><label>Maximum link distance <output>{thresholds.maxLinkDistancePx} px</output><input type="range" min="6" max="42" value={thresholds.maxLinkDistancePx} onChange={event => onThresholdChange("maxLinkDistancePx", Number(event.target.value))} /></label><div className="method-field-pair"><label>Motile VCL min<input type="number" value={thresholds.motilityVclMin} onChange={event => onThresholdChange("motilityVclMin", Number(event.target.value))} /></label><label>Motile VSL min<input type="number" value={thresholds.motilityVslMin} onChange={event => onThresholdChange("motilityVslMin", Number(event.target.value))} /></label><label>Progressive STR min<input type="number" value={thresholds.progressiveStrMin} onChange={event => onThresholdChange("progressiveStrMin", Number(event.target.value))} /></label><label>Progressive VAP min<input type="number" value={thresholds.progressiveVapMin} onChange={event => onThresholdChange("progressiveVapMin", Number(event.target.value))} /></label></div></div></article>
      <article className="panel method-form-panel advanced-control-card"><div className="panel-heading"><div><p className="eyebrow">TRACK ASSOCIATION</p><h2>Advanced reproducibility controls</h2></div><Activity size={18} /></div><div className="method-form-body"><div className="method-field-pair"><label>VAP window<input type="number" min="3" max="21" step="2" value={thresholds.vapSmoothingWindow} onChange={event => onThresholdChange("vapSmoothingWindow", Number(event.target.value))} /></label><label>Visual trail frames<input type="number" min="2" max="60" value={thresholds.visualTrailLength} onChange={event => onThresholdChange("visualTrailLength", Number(event.target.value))} /></label><label>Min track frames<input type="number" min="2" value={thresholds.minTrackFrames} onChange={event => onThresholdChange("minTrackFrames", Number(event.target.value))} /></label><label>Max missed frames<input type="number" min="0" max="12" value={thresholds.maxMissedFrames} onChange={event => onThresholdChange("maxMissedFrames", Number(event.target.value))} /></label><label>Max turn degrees<input type="number" min="15" max="180" value={thresholds.maxTurnDegrees} onChange={event => onThresholdChange("maxTurnDegrees", Number(event.target.value))} /></label><label>Min confidence<input type="number" min="0" max="1" step="0.05" value={thresholds.minTrackConfidence} onChange={event => onThresholdChange("minTrackConfidence", Number(event.target.value))} /></label></div><div className="weight-control-grid"><label>Direction weight <output>{roundMetric(thresholds.linkDirectionWeight, 2)}</output><input type="range" min="0" max="1" step="0.05" value={thresholds.linkDirectionWeight} onChange={event => onThresholdChange("linkDirectionWeight", Number(event.target.value))} /></label><label>Distance weight <output>{roundMetric(thresholds.linkDistanceWeight, 2)}</output><input type="range" min="0" max="1" step="0.05" value={thresholds.linkDistanceWeight} onChange={event => onThresholdChange("linkDistanceWeight", Number(event.target.value))} /></label><label>Speed weight <output>{roundMetric(thresholds.linkSpeedWeight, 2)}</output><input type="range" min="0" max="1" step="0.05" value={thresholds.linkSpeedWeight} onChange={event => onThresholdChange("linkSpeedWeight", Number(event.target.value))} /></label></div><p className="method-protocol-note">The saved method manifest records smoothing, visual trail length, occlusion tolerance, turn angle, confidence threshold, and weighted association settings alongside each result. Maintain an approved protocol outside the application.</p></div></article>
    </div>
  </section>;
}

function QualityReviewView({
  records,
  isAuthenticated,
  selectedRecordId,
  onSelectRecord,
  onOpenHistory,
  onUseMethod,
}: {
  records: PersistedAnalysisRecord[];
  isAuthenticated: boolean;
  selectedRecordId?: number;
  onSelectRecord: (id: number) => void;
  onOpenHistory: (id: number) => void;
  onUseMethod: (record: PersistedAnalysisRecord) => void;
}) {
  const [reviewFilter, setReviewFilter] = useState<"all" | "calibration" | "capture" | "tracking">("all");
  const persistedRecordsState = trpc.analysis.list.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const recordsWithDetails = records.map(record => ({ record, details: getStoredSnapshotDetails(record) }));
  const filtered = recordsWithDetails.filter(({ details }) => {
    const content = details.flags.join(" ").toLowerCase();
    if (reviewFilter === "calibration") return content.includes("calibration");
    if (reviewFilter === "capture") return content.includes("capture") || Boolean(details.captureQuality && details.captureQuality.status !== "acceptable");
    if (reviewFilter === "tracking") return content.includes("track") || content.includes("confidence") || content.includes("clip");
    return true;
  });
  const selected = filtered.find(item => item.record.id === selectedRecordId) ?? filtered[0];

  if (isAuthenticated && persistedRecordsState.isLoading) return <section className="dashboard-tab-view"><div className="tab-loading-state"><Loader2 className="spin" size={24} /><strong>Loading saved quality evidence</strong><span>Retrieving capture and calibration safeguards from saved laboratory records.</span></div></section>;
  if (isAuthenticated && persistedRecordsState.isError) return <section className="dashboard-tab-view"><div className="tab-error-state"><CircleAlert size={25} /><h2>Quality evidence could not be loaded</h2><p>Check the connection and try again. No review decision has been recorded.</p><button className="primary-action" onClick={() => persistedRecordsState.refetch()}><RefreshCcw size={17} />Try again</button></div></section>;

    return <section className="dashboard-tab-view"><div className="tab-hero"><div><p className="eyebrow">SCIENTIFIC SAFEGUARDS · TECHNICAL REVIEW</p><h1>Quality <em>review.</em></h1><p>Review calibration provenance, acquisition evidence, field stability, and track-level flags before using automated motion estimates in a laboratory workflow. This workspace does not issue diagnostic or fertility decisions.</p></div><div className="method-note"><ClipboardCheck size={18} /><p><strong>Required reviewer action.</strong> Read flags in the context of the saved optics, sample handling, image quality, field stability, and species protocol. Retain the immutable snapshot as the audit record.</p></div></div>
    {!isAuthenticated ? <div className="tab-empty-state"><ShieldCheck size={28} /><h2>Sign in to review saved evidence</h2><p>Quality review is based on the real flags and technical evidence stored with each saved laboratory record.</p><button className="primary-action" onClick={startLogin}>Sign in to access quality review</button></div> : records.length === 0 ? <div className="tab-empty-state"><ShieldCheck size={28} /><h2>No saved quality evidence yet</h2><p>Run and save an analysis to create a record of calibration provenance, capture quality, field stability, and automated review flags.</p></div> : <><div className="quality-summary-strip"><span><ShieldCheck size={17} /><strong>{records.length}</strong> saved records awaiting laboratory review</span><span><AlertTriangle size={17} /><strong>{recordsWithDetails.reduce((sum, item) => sum + item.details.flags.length, 0)}</strong> stored review flags</span><span><Aperture size={17} /><strong>{recordsWithDetails.filter(item => getCalibrationProvenance(item.details.calibrationEvidence) === "board-referenced").length}</strong> board-referenced snapshots</span></div><div className="quality-filter-row" aria-label="Filter quality review records">{(["all", "calibration", "capture", "tracking"] as const).map(item => <button key={item} className={reviewFilter === item ? "active" : ""} onClick={() => setReviewFilter(item)}>{item === "all" ? "All flags" : `${item[0].toUpperCase()}${item.slice(1)} focus`}</button>)}</div><div className="quality-workbench"><div className="panel quality-record-list"><div className="panel-heading compact"><div><p className="eyebrow">REVIEW QUEUE</p><h2>{filtered.length} record{filtered.length === 1 ? "" : "s"}</h2></div><span>review required</span></div><div className="saved-record-scroll">{filtered.map(({ record, details }) => <button key={record.id} className={`saved-record-row ${selected?.record.id === record.id ? "selected" : ""}`} onClick={() => onSelectRecord(record.id)}><span className="record-source-dot warning"><AlertTriangle size={14} /></span><span><strong>{record.sampleName}</strong><small>{formatSavedDate(record.createdAt)}</small><span className="inline-flag-count">{details.flags.length} flag{details.flags.length === 1 ? "" : "s"} · {details.captureQuality?.status || "quality not recorded"}</span></span><ChevronRight size={15} /></button>)}{filtered.length === 0 && <div className="no-filter-results"><ShieldCheck size={20} /><span>No saved records match this quality focus.</span></div>}</div></div>{selected && <article className="panel quality-detail"><div className="panel-heading"><div><p className="eyebrow">REVIEW EVIDENCE</p><h2>{selected.record.sampleName}</h2></div><span className="snapshot-id">#{selected.record.id}</span></div><div className="quality-detail-body"><SnapshotStatus record={selected.record} details={selected.details} /><div className="quality-capture-card"><div><p>CAPTURE QUALITY</p><strong>{selected.details.captureQuality?.status || "Not recorded"}</strong></div><span>Brightness {roundMetric(selected.details.captureQuality?.brightness ?? 0)}<br />Contrast {roundMetric(selected.details.captureQuality?.contrast ?? 0)}<br />Focus {roundMetric(selected.details.captureQuality?.focus ?? 0)}</span><small>{selected.details.captureQuality?.rationale || "No capture-quality rationale was stored with this historical snapshot."}</small></div><div className="quality-capture-card"><div><p>FIELD STABILITY</p><strong>{selected.details.fieldStability?.status || "Not recorded"}</strong></div><span>Mean shift {roundMetric(selected.details.fieldStability?.meanShiftPx ?? 0)} px<br />Max shift {roundMetric(selected.details.fieldStability?.maxShiftPx ?? 0)} px<br />Pairs {selected.details.fieldStability?.sampledPairs ?? 0}</span><small>{selected.details.fieldStability?.rationale || "No field-stability rationale was stored with this historical snapshot."}</small></div><div className="review-flag-stack">{selected.details.flags.length ? selected.details.flags.map(flag => <p key={flag}><CircleAlert size={15} />{flag}</p>) : <p><Info size={15} />No review flags were stored with this record.</p>}</div><div className="review-checklist"><strong>Laboratory handoff checklist</strong><span>1. Confirm calibration and optics match the approved protocol.</span><span>2. Check capture-quality, field-stability evidence, and representative trajectories.</span><span>3. Compare the immutable method snapshot before recording any laboratory conclusion.</span></div><div className="snapshot-actions"><button onClick={() => onOpenHistory(selected.record.id)}><History size={15} />Open full snapshot</button><button onClick={() => onUseMethod(selected.record)}><SlidersHorizontal size={15} />Use method as draft</button></div></div></article>}</div></>}</section>;
}

function FieldReviewView({
  fields,
  sameSpecimenConfirmed,
  blocker,
  review,
  onSameSpecimenChange,
  onRemoveField,
  onDownload,
  onOpenWorkspace,
}: {
  fields: MultiFieldResult[];
  sameSpecimenConfirmed: boolean;
  blocker?: string;
  review?: MultiFieldReview;
  onSameSpecimenChange: (confirmed: boolean) => void;
  onRemoveField: (fieldId: string) => void;
  onDownload: () => void;
  onOpenWorkspace: () => void;
}) {
  return <section className="dashboard-tab-view field-review-view">
    <div className="tab-hero field-review-hero">
      <div><p className="eyebrow">BROWSER-LOCAL · TECHNICAL REPEATABILITY</p><h1>Field <em>review.</em></h1><p>Compare independently captured views from one prepared specimen. This local workspace supports technical repeatability review only; it does not pool biological measures or create a diagnostic conclusion.</p></div>
      <div className="method-note"><ClipboardCheck size={18} /><p><strong>Local session only.</strong> Field entries stay in this browser until you reset the temporary session. Footage is not transferred or stored by this tab.</p></div>
    </div>
    <article className="panel field-review-panel" aria-label="Browser-local multi-field technical review">
      <div className="panel-heading"><div><p className="eyebrow">ACTIVE FIELD SET</p><h2>{fields.length} selected field{fields.length === 1 ? "" : "s"}</h2></div><button className="multi-field-add" onClick={onOpenWorkspace}><FlaskConical size={14} />Add analyzed field</button></div>
      {fields.length === 0 ? <div className="tab-empty-state field-review-empty"><Microscope size={28} /><h2>No fields selected</h2><p>Run an analysis in the workspace, then add an independently captured field here for browser-local technical repeatability review.</p><button className="primary-action" onClick={onOpenWorkspace}><FlaskConical size={17} />Open analysis workspace</button></div> : <>
        <div className="multi-field-actions"><button className="multi-field-add" onClick={onDownload}><Download size={14} />Export field review CSV</button></div>
        <div className="multi-field-list field-review-list">{fields.map((field, index) => <div key={field.id}><span><strong>{index + 1}. {field.label}</strong><small>{field.source} · {field.summary.validTracks} valid tracks · {field.qualityFlags.length} flag{field.qualityFlags.length === 1 ? "" : "s"}</small>{field.trajectoryIntegrity && <><small className="multi-field-trajectory-integrity">Trajectory integrity: {field.trajectoryIntegrity.summaryLine}</small><small className="multi-field-trajectory-integrity-attention">Technical attention: {field.trajectoryIntegrity.attentionItems.join(" · ") || "none recorded"}</small><small className="multi-field-trajectory-integrity-safeguard">{field.trajectoryIntegrity.safeguard}</small></>}</span><button onClick={() => onRemoveField(field.id)} aria-label={`Remove ${field.label} from repeatability review`}><X size={13} /></button></div>)}</div>
        <label className="same-specimen-check"><input type="checkbox" checked={sameSpecimenConfirmed} onChange={event => onSameSpecimenChange(event.target.checked)} disabled={fields.length < 2} /><span>I confirm these are independent fields from the same prepared specimen.</span></label>
        {blocker ? <p className="multi-field-blocker"><AlertTriangle size={13} />{blocker}</p> : review && <div className="multi-field-summary field-review-summary"><div className="multi-field-summary-head"><strong>{review.fieldCount} fields · {review.totalFlagCount} total flags</strong><span>mean ± sample SD · range</span></div>{(["motility", "progressiveMotility", "vcl", "validTracks"] as const).map(metric => { const value = review.metrics[metric]; const label = metric === "motility" ? "Motility" : metric === "progressiveMotility" ? "Progressive" : metric === "vcl" ? "VCL" : "Valid tracks"; const unit = metric === "motility" || metric === "progressiveMotility" ? "%" : metric === "vcl" ? "µm/s" : ""; return <div key={metric}><span>{label}</span><strong>{roundMetric(value.mean, 1)} ± {roundMetric(value.sampleStandardDeviation, 1)} {unit}</strong><small>{roundMetric(value.min, 1)}–{roundMetric(value.max, 1)} {unit}</small></div>; })}<p><ShieldCheck size={13} />Technical repeatability only. Review all field flags and protocol controls; do not treat the aggregate as concentration, dose-release, or fertility evidence.</p></div>}
      </>}
    </article>
  </section>;
}

function TechnicalAuditView({
  analysis,
  methodFingerprint,
  annotationSummary,
  hasAnnotations,
  footageProvenance,
  multiFieldCount,
  onOpenWorkspace,
  onOpenFields,
}: {
  analysis?: AnalysisOutput;
  methodFingerprint: string;
  annotationSummary: string;
  hasAnnotations: boolean;
  footageProvenance: FootageProvenance;
  multiFieldCount: number;
  onOpenWorkspace: () => void;
  onOpenFields: () => void;
}) {
  if (!analysis) return <section className="dashboard-tab-view technical-audit-view"><div className="tab-hero"><div><p className="eyebrow">BROWSER-LOCAL · TECHNICAL AUDIT</p><h1>Technical <em>audit.</em></h1><p>Review current-run method, capture, linking, and operator-review context in one place. This tab does not create a clinical, fertility, breeding, treatment, or biological conclusion.</p></div><div className="method-note"><ShieldCheck size={18} /><p><strong>Local review surface.</strong> No footage is uploaded or stored by this tab; it only displays evidence already held in the current browser session.</p></div></div><div className="tab-empty-state technical-audit-empty"><ClipboardCheck size={28} /><h2>No local analysis to audit</h2><p>Run an analysis in the workspace to populate its technical evidence and review context.</p><button className="primary-action" onClick={onOpenWorkspace}><FlaskConical size={17} />Open analysis workspace</button></div></section>;
  const technicalEvidence = [
    { label: "Capture quality", value: analysis.captureQuality.status, detail: `Brightness ${roundMetric(analysis.captureQuality.brightness)} · contrast ${roundMetric(analysis.captureQuality.contrast)} · focus ${roundMetric(analysis.captureQuality.focus)}` },
    { label: "Field stability", value: analysis.fieldStability.status, detail: `Mean shift ${roundMetric(analysis.fieldStability.meanShiftPx)} px · max ${roundMetric(analysis.fieldStability.maxShiftPx)} px` },
    { label: "Trajectory integrity", value: analysis.trajectoryIntegrity.summaryLine, detail: analysis.trajectoryIntegrity.attentionItems.join(" · ") || "No additional technical attention items recorded" },
  ];
  return <section className="dashboard-tab-view technical-audit-view">
    <div className="tab-hero"><div><p className="eyebrow">BROWSER-LOCAL · TECHNICAL AUDIT</p><h1>Technical <em>audit.</em></h1><p>Centralized current-run technical evidence and local review context. It reports existing browser-local estimates and review flags; it does not change trajectories, calibration, classifications, or biological interpretation.</p></div><div className="method-note"><ShieldCheck size={18} /><p><strong>Review only.</strong> Verify the displayed evidence under the applicable laboratory protocol before recording any laboratory conclusion.</p></div></div>
    <div className="technical-audit-actions"><button className="primary-action" onClick={onOpenWorkspace}><FlaskConical size={16} />Open technical review controls</button><button className="secondary-action" onClick={onOpenFields}><ClipboardCheck size={16} />Field review · {multiFieldCount}</button></div>
    <div className="technical-audit-grid" aria-label="Current browser-local technical audit evidence">
      <article><p>OUTPUT REFERENCE</p><strong>{analysis.outputFingerprint}</strong><small>Deterministic technical output reference for the active local analysis; not a signature or biological result.</small></article>
      <article><p>METHOD REFERENCE</p><strong>{methodFingerprint}</strong><small>Active species, calibration, and threshold context used for this local run.</small></article>
      <article><p>LOCAL REVIEW STATE</p><strong>{annotationSummary}</strong><small>{hasAnnotations ? "Current browser-local technical annotations are present; they do not alter analysis output." : "No browser-local technical annotations are currently set."}</small></article>
      <article><p>FOOTAGE CONTEXT</p><strong>{getFootageSourceLabel(footageProvenance.source)} · {footageProvenance.container}</strong><small>{formatFootageByteSize(footageProvenance.byteSize)} local intake context; footage bytes are not stored by this tab.</small></article>
    </div>
    <article className="panel technical-audit-evidence"><div className="panel-heading"><div><p className="eyebrow">CURRENT-RUN EVIDENCE</p><h2>Capture, field, and linkage review</h2></div><Activity size={18} /></div><div className="technical-audit-evidence-list">{technicalEvidence.map(item => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.detail}</small></div>)}</div>{analysis.qualityFlags.length ? <div className="technical-audit-flags"><strong>Reviewer attention</strong>{analysis.qualityFlags.map(flag => <p key={flag}><CircleAlert size={14} />{flag}</p>)}</div> : <p className="technical-audit-no-flags"><CheckCircle2 size={14} />No current-run quality flags were returned. Review all technical evidence and protocol controls before use.</p>}</article>
  </section>;
}

export function AnalysisWorkspace() {
  const { user, isAuthenticated } = useAuth();
  const [activeView, setActiveView] = useState<DashboardView>(getDashboardViewFromUrl);
  const [selectedRecordId, setSelectedRecordId] = useState<number>();
  const [sourceType, setSourceType] = useState<SourceType>("reference");
  const [activeSample, setActiveSample] = useState(REFERENCE_SAMPLES[2]);
  const [sourceUrl, setSourceUrl] = useState(REFERENCE_SAMPLES[2].url);
  const [fileName, setFileName] = useState("3.mp4");
  const [footageProvenance, setFootageProvenance] = useState<FootageProvenance>({ source: "reference", container: "MP4" });
  const [sampleName, setSampleName] = useState("Reference field 03");
  const [species, setSpecies] = useState("Bovine");
  const [metadata, setMetadata] = useState<VideoMetadata>({ width: 780, height: 580, duration: 1, frameRate: 25, frameCount: 25 });
  const [mediaError, setMediaError] = useState<string>();
  const [calibration, setCalibration] = useState<CasaCalibration>(DEFAULT_CASA_CALIBRATION);
  const [thresholds, setThresholds] = useState<CasaThresholds>(DEFAULT_CASA_THRESHOLDS);
  const [analysis, setAnalysis] = useState<AnalysisOutput>();
  const [analysisRunContext, setAnalysisRunContext] = useState<BrowserLocalAnalysisRunContext>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisCancelled, setAnalysisCancelled] = useState(false);
  const [analysisSessionReference, setAnalysisSessionReference] = useState<string>();
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("Select a sample and run a locally processed analysis.");
  const [liveProgress, setLiveProgress] = useState<AnalysisProgress>();
  const [selectedTrack, setSelectedTrack] = useState<ProcessedTrack>();
  const [devices, setDevices] = useState<CameraDeviceOption[]>([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [cameraPreviewProfile, setCameraPreviewProfile] = useState<CameraPreviewProfileId>("native");
  const [cameraPreviewOrientation, setCameraPreviewOrientation] = useState<CameraPreviewOrientationId>("normal");
  const [cameraStream, setCameraStream] = useState<MediaStream>();
  const [cameraPreviewResolutionEvidence, setCameraPreviewResolutionEvidence] = useState<CameraPreviewResolutionEvidence>();
  const [activeCameraLabel, setActiveCameraLabel] = useState<string>();
  const [recording, setRecording] = useState(false);
  const [preCaptureDelaySeconds, setPreCaptureDelaySeconds] = useState(0);
  const [preCaptureRemainingSeconds, setPreCaptureRemainingSeconds] = useState(0);
  const [recordingRemainingSeconds, setRecordingRemainingSeconds] = useState(0);
  const [recordingErrorNotice, setRecordingErrorNotice] = useState<string>();
  const [partialCameraCaptureAcknowledged, setPartialCameraCaptureAcknowledged] = useState(true);
  const [partialCameraCaptureReviewAcknowledgedAt, setPartialCameraCaptureReviewAcknowledgedAt] = useState<string>();
  const [partialCameraCaptureReviewMethodFingerprint, setPartialCameraCaptureReviewMethodFingerprint] = useState<string>();
  const [cameraPreviewErrorNotice, setCameraPreviewErrorNotice] = useState<string>();
  const [captureDurationSeconds, setCaptureDurationSeconds] = useState(2);
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window === "undefined" || window.innerWidth > 900);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [localDraftSavedAt, setLocalDraftSavedAt] = useState<string>();
  const [stillPreview, setStillPreview] = useState<string>();
  const [stillCapturedAt, setStillCapturedAt] = useState<string>();
  const [calibrationWizardOpen, setCalibrationWizardOpen] = useState(false);
  const [boardImage, setBoardImage] = useState<{ url: string; width: number; height: number }>();
  const [boardPoints, setBoardPoints] = useState<CalibrationBoardPoint[]>([]);
  const [boardIntervalMicrons, setBoardIntervalMicrons] = useState(100);
  const [calibrationEvidence, setCalibrationEvidence] = useState<CalibrationBoardEvidence>();
  const [specimenContext, setSpecimenContext] = useState<SpecimenContext>(EMPTY_SPECIMEN_CONTEXT);
  const [opticsTraceability, setOpticsTraceability] = useState<OpticsTraceability>(EMPTY_OPTICS_TRACEABILITY);
  const [dosePlan, setDosePlan] = useState<DosePlanInput>(EMPTY_DOSE_PLAN);
  const [multiFieldResults, setMultiFieldResults] = useState<MultiFieldResult[]>([]);
  const [sameSpecimenConfirmed, setSameSpecimenConfirmed] = useState(false);
  const [reviewBookmarks, setReviewBookmarks] = useState<ReviewBookmark[]>([]);
  const [reviewBookmarkOperatorLabel, setReviewBookmarkOperatorLabel] = useState("");
  const [editingReviewBookmarkId, setEditingReviewBookmarkId] = useState<string>();
  const [editingReviewBookmarkOperatorLabel, setEditingReviewBookmarkOperatorLabel] = useState("");
  const [reviewSeekTime, setReviewSeekTime] = useState("0");
  const [technicalReviewWindow, setTechnicalReviewWindow] = useState<TechnicalReviewWindow>();
  const [isTechnicalReviewWindowLooping, setIsTechnicalReviewWindowLooping] = useState(false);
  const [technicalReviewedTrackIds, setTechnicalReviewedTrackIds] = useState<string[]>([]);
  const [trackReviewFilter, setTrackReviewFilter] = useState<TrackReviewFilter>("all");
  const [reviewPlaybackRate, setReviewPlaybackRate] = useState(1);
  const selectedCameraLabel = devices.find(device => device.deviceId === selectedDevice)?.label;
  const activeCameraSelectionDiffers = Boolean(cameraStream && selectedDevice && activeCameraLabel && selectedCameraLabel && activeCameraLabel !== selectedCameraLabel);
  const calibrationProvenance = getCalibrationProvenance(calibrationEvidence);
  const cameraFrameRateReview = useMemo(() => buildCameraFrameRateReview({ actualFrameRate: cameraPreviewResolutionEvidence?.actualFrameRate, configuredFrameRate: calibration.frameRate }), [calibration.frameRate, cameraPreviewResolutionEvidence?.actualFrameRate]);
  const cameraAcquisitionReadiness = useMemo(() => buildCameraAcquisitionReadiness({ previewActive: Boolean(cameraStream), actualResolutionAvailable: Boolean(cameraPreviewResolutionEvidence?.actualWidth && cameraPreviewResolutionEvidence?.actualHeight), actualFrameRateAvailable: Boolean(cameraPreviewResolutionEvidence?.actualFrameRate), frameRateNeedsReview: cameraFrameRateReview.needsReview, calibrationBoardReferenced: calibrationProvenance === "board-referenced" }), [calibrationProvenance, cameraFrameRateReview.needsReview, cameraPreviewResolutionEvidence?.actualFrameRate, cameraPreviewResolutionEvidence?.actualHeight, cameraPreviewResolutionEvidence?.actualWidth, cameraStream]);
  const sidebarDismissRef = useRef<HTMLButtonElement>(null);
  const navigationToggleRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const previousSidebarOpenRef = useRef(sidebarOpen);
  useEffect(() => {
    if (!sidebarOpen) return;
    const handleSidebarKeyboardNavigation = (event: KeyboardEvent) => {
      if (window.innerWidth > 900) return;
      if (event.key === "Escape") {
        setSidebarOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusableControls = Array.from(sidebarRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex='-1'])") ?? []);
      const firstControl = focusableControls[0];
      const lastControl = focusableControls.at(-1);
      if (!firstControl || !lastControl) return;
      if (event.shiftKey && document.activeElement === firstControl) {
        event.preventDefault();
        lastControl.focus();
      } else if (!event.shiftKey && document.activeElement === lastControl) {
        event.preventDefault();
        firstControl.focus();
      }
    };
    window.addEventListener("keydown", handleSidebarKeyboardNavigation);
    return () => window.removeEventListener("keydown", handleSidebarKeyboardNavigation);
  }, [sidebarOpen]);
  useEffect(() => {
    const wasSidebarOpen = previousSidebarOpenRef.current;
    previousSidebarOpenRef.current = sidebarOpen;
    if (wasSidebarOpen === sidebarOpen || window.innerWidth > 900) return;
    window.requestAnimationFrame(() => (sidebarOpen ? sidebarDismissRef.current : navigationToggleRef.current)?.focus());
  }, [sidebarOpen]);
  useEffect(() => {
    if (!shouldWarnBeforeBrowserExit({ recording, analyzing: isAnalyzing, preCaptureStabilizing: preCaptureRemainingSeconds > 0, localTechnicalAnnotations: Boolean(reviewBookmarks.length || technicalReviewWindow || technicalReviewedTrackIds.length) })) return;
    const warnBeforeExit = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeExit);
    return () => window.removeEventListener("beforeunload", warnBeforeExit);
  }, [isAnalyzing, preCaptureRemainingSeconds, recording, reviewBookmarks, technicalReviewWindow, technicalReviewedTrackIds]);
  const cancelAnalysisRef = useRef(false);
  const browserIntakeCapability = useMemo(() => {
    const probe = document.createElement("video");
    return buildBrowserIntakeCapabilityEvidence({
      secureContext: window.isSecureContext,
      mediaDevicesAvailable: Boolean(navigator.mediaDevices),
      getUserMediaAvailable: Boolean(navigator.mediaDevices?.getUserMedia),
      enumerateDevicesAvailable: Boolean(navigator.mediaDevices?.enumerateDevices),
      mediaRecorderAvailable: typeof MediaRecorder !== "undefined",
      canvasAvailable: Boolean(document.createElement("canvas").getContext("2d")),
      mp4Playback: probe.canPlayType('video/mp4; codecs="avc1.42E01E"') as "" | "maybe" | "probably",
      webmPlayback: probe.canPlayType('video/webm; codecs="vp8, vorbis"') as "" | "maybe" | "probably",
    });
  }, []);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingStopReasonRef = useRef<CameraRecordingStopReason | undefined>(undefined);
  const recordingFailedRef = useRef(false);
  const localDraftInputRef = useRef<HTMLInputElement>(null);
  const reviewAnnotationsInputRef = useRef<HTMLInputElement>(null);
  const recordingStopTimerRef = useRef<number | undefined>(undefined);
  const recordingCountdownTimerRef = useRef<number | undefined>(undefined);
  const preCaptureStartTimerRef = useRef<number | undefined>(undefined);
  const preCaptureCountdownTimerRef = useRef<number | undefined>(undefined);
  const startRecordingAfterDelayRef = useRef(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const calibrationBoardInputRef = useRef<HTMLInputElement>(null);
  const runAnalysisButtonRef = useRef<HTMLButtonElement>(null);
  const cameraStartButtonRef = useRef<HTMLButtonElement>(null);
  const restoreCameraStartFocusRef = useRef(false);

  const recordsQuery = trpc.analysis.list.useQuery(undefined, { enabled: isAuthenticated });
  const settingsQuery = trpc.analysis.settings.get.useQuery(undefined, { enabled: isAuthenticated });
  const saveAnalysis = trpc.analysis.save.useMutation({ onSuccess: () => recordsQuery.refetch() });
  const saveSettings = trpc.analysis.settings.save.useMutation();
  const activeSettings = useMemo(() => attachCalibrationEvidence({ calibration, thresholds, species }, calibrationEvidence), [calibration, thresholds, species, calibrationEvidence]);
  const storedRecords = (recordsQuery.data ?? []) as PersistedAnalysisRecord[];
  const currentDosePlan = useMemo(() => calculateDosePlan(dosePlan), [dosePlan]);
  const acquisitionReadiness = useMemo(() => buildAcquisitionReadiness({ specimenContext, calibrationEvidence, width: metadata.width, height: metadata.height, frameRate: metadata.frameRate, captureQuality: analysis?.captureQuality }), [analysis?.captureQuality, calibrationEvidence, metadata.frameRate, metadata.height, metadata.width, specimenContext]);
  const multiFieldMethodSignature = useMemo(() => JSON.stringify({ species, calibration, thresholds }), [calibration, species, thresholds]);
  const methodFingerprint = useMemo(() => createMethodFingerprint({ species, calibration, thresholds }), [calibration, species, thresholds]);
  const multiFieldBlocker = useMemo(() => getMultiFieldReviewBlocker(multiFieldResults, sameSpecimenConfirmed), [multiFieldResults, sameSpecimenConfirmed]);
  const multiFieldReview = useMemo(() => buildMultiFieldReview(multiFieldResults, sameSpecimenConfirmed), [multiFieldResults, sameSpecimenConfirmed]);
  const selectDashboardView = (view: DashboardView) => {
    if (recording && view !== "workspace") {
      toast.warning("Stop the active local camera recording before leaving the analysis workspace.");
      return;
    }
    setActiveView(view);
    const url = new URL(window.location.href);
    if (view === "workspace") url.searchParams.delete("view");
    else url.searchParams.set("view", view);
    window.history.replaceState(null, "", url);
  };
  const boardEstimate = useMemo(() => boardImage && boardPoints.length === 2 ? estimateCalibrationBoardScale({ first: boardPoints[0], second: boardPoints[1], boardIntervalMicrons, imageWidth: boardImage.width, imageHeight: boardImage.height }) : undefined, [boardImage, boardPoints, boardIntervalMicrons]);
  const visibleTracks = isAnalyzing ? liveProgress?.liveTracks ?? [] : analysis?.tracks ?? [];
  const reviewThresholds = analysisRunContext?.thresholds ?? thresholds;
  const reviewCalibration = analysisRunContext?.calibration ?? calibration;
  const completedRunContextDiffers = Boolean(analysis && analysisRunContext && !isAnalyzing && (analysisRunContext.sampleName !== sampleName || analysisRunContext.species !== species || analysisRunContext.source !== sourceType || analysisRunContext.fileName !== fileName || analysisRunContext.methodFingerprint !== methodFingerprint));
  const technicalReviewQueue = useMemo(() => analysis ? buildTechnicalReviewQueue(analysis.tracks, reviewThresholds) : [], [analysis, reviewThresholds]);
  const filteredReviewTracks = useMemo(() => analysis ? filterTrackReviewRows(analysis.tracks, trackReviewFilter) : [], [analysis, trackReviewFilter]);
  const technicalReviewedTrackCount = useMemo(() => analysis ? technicalReviewedTrackIds.filter(trackId => analysis.tracks.some(track => track.id === trackId)).length : 0, [analysis, technicalReviewedTrackIds]);
  const technicalReviewAnnotationStatus = useMemo(() => buildTechnicalReviewAnnotationStatus({ bookmarks: reviewBookmarks, reviewWindow: technicalReviewWindow, reviewedTrackCount: technicalReviewedTrackCount }), [reviewBookmarks, technicalReviewWindow, technicalReviewedTrackCount]);
  const selectTrajectory = (trackId: string) => {
    const track = visibleTracks.find(item => item.id === trackId);
    if (track) setSelectedTrack(track);
  };
  const toggleLocalTechnicalTrackReview = (trackId: string) => {
    if (isAnalyzing) return toast.warning("Complete or cancel the active local analysis before marking a technical track review.");
    setTechnicalReviewedTrackIds(current => toggleTechnicalReviewedTrack(current, trackId));
  };
  const clearLocalTechnicalTrackReview = () => {
    if (isAnalyzing) return toast.warning("Complete or cancel the active local analysis before clearing technical track-review markers.");
    setTechnicalReviewedTrackIds(clearTechnicalReviewedTracks());
    toast.info("Browser-local technical reviewed-track markers cleared. Analysis output is unchanged.");
  };
  const clearLocalTechnicalReviewAnnotations = () => {
    if (isAnalyzing) return toast.warning("Complete or cancel the active local analysis before clearing technical review annotations so live playback remains synchronized.");
    if (!reviewBookmarks.length && !technicalReviewWindow && !technicalReviewedTrackCount) return toast.info("There are no browser-local technical review annotations to clear.");
    const cleared = createClearedTechnicalReviewAnnotations();
    setReviewBookmarks(cleared.bookmarks);
    setReviewBookmarkOperatorLabel("");
    setEditingReviewBookmarkId(undefined);
    setEditingReviewBookmarkOperatorLabel("");
    setTechnicalReviewWindow(cleared.reviewWindow);
    setIsTechnicalReviewWindowLooping(false);
    setTechnicalReviewedTrackIds(cleared.reviewedTrackIds);
    toast.info("Browser-local technical review annotations cleared. Footage and analysis output are unchanged.");
  };
  const downloadTechnicalReviewedTracks = () => {
    if (!analysis || !technicalReviewedTrackCount) return toast.error("Mark one or more local technical review tracks before exporting them.");
    const csv = buildReviewedTrackCsv({ sampleName, frameRate: reviewCalibration.frameRate, reviewedTrackIds: technicalReviewedTrackIds, tracks: analysis.tracks });
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = buildReviewedTrackCsvFilename(sampleName);
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    toast.info(REVIEWED_TRACK_EXPORT_NOTICE);
  };
  const downloadTechnicalReviewAnnotations = () => {
    if (!reviewBookmarks.length && !technicalReviewWindow && !technicalReviewedTrackCount) return toast.error("Add a local technical bookmark, review window, or reviewed track before exporting annotations.");
    const outputFingerprint = analysis?.outputFingerprint;
    if (!outputFingerprint) return toast.error("Run a browser-local analysis before exporting technical review annotations so the file can be bound to its output.");
    const content = buildTechnicalReviewAnnotationsJson({ sampleName, configuredFrameRate: reviewCalibration.frameRate, outputFingerprint, bookmarks: reviewBookmarks, reviewWindow: technicalReviewWindow, reviewedTrackIds: technicalReviewedTrackIds });
    const url = URL.createObjectURL(new Blob([content], { type: "application/json;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = buildTechnicalReviewAnnotationsFilename(sampleName);
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    toast.info(REVIEW_ANNOTATIONS_EXPORT_NOTICE);
  };
  const importTechnicalReviewAnnotations = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    const importBlocker = getReviewAnnotationsImportBlocker(isAnalyzing);
    if (importBlocker) return toast.warning(importBlocker);
    if (!file) return;
    const fileSizeBlocker = getReviewAnnotationsFileSizeBlocker(file.size);
    if (fileSizeBlocker) return toast.error(fileSizeBlocker);
    const outputFingerprint = analysis?.outputFingerprint;
    if (!outputFingerprint) return toast.error("Run a browser-local analysis before importing technical review annotations so the file can be matched to its output.");
    try {
      const imported = parseTechnicalReviewAnnotationsJson(await file.text());
      if (Math.abs(imported.configuredFrameRate - reviewCalibration.frameRate) > 0.0001) throw new Error("The annotation file uses a different configured frame rate. Confirm the active review method before importing.");
      if (imported.outputFingerprint !== outputFingerprint) throw new Error("The annotation file belongs to a different analysis output and was not applied.");
      const durationBlocker = getReviewAnnotationsDurationBlocker({ bookmarks: imported.bookmarks, reviewWindow: imported.reviewWindow, durationSeconds: metadata.duration });
      if (durationBlocker) throw new Error(durationBlocker);
      const knownTrackIds = new Set(analysis?.tracks.map(track => track.id) ?? []);
      if (imported.reviewedTrackIds.some(trackId => !knownTrackIds.has(trackId))) throw new Error("The annotation file references tracks that are not present in the active analysis output.");
      setReviewBookmarks(imported.bookmarks);
      setEditingReviewBookmarkId(undefined);
      setEditingReviewBookmarkOperatorLabel("");
      setTechnicalReviewWindow(imported.reviewWindow);
      setIsTechnicalReviewWindowLooping(false);
      setTechnicalReviewedTrackIds(imported.reviewedTrackIds);
      toast.success(REVIEW_ANNOTATIONS_IMPORT_NOTICE);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The local technical annotation file could not be imported.");
    }
  };
  useEffect(() => {
    setReviewBookmarks([]);
    setReviewBookmarkOperatorLabel("");
    setEditingReviewBookmarkId(undefined);
    setEditingReviewBookmarkOperatorLabel("");
    setReviewSeekTime("0");
    setTechnicalReviewWindow(undefined);
    setIsTechnicalReviewWindowLooping(false);
    const resetRate = getReviewPlaybackRateAfterFootageChange();
    setReviewPlaybackRate(resetRate);
    if (videoRef.current) videoRef.current.playbackRate = resetRate;
  }, [sourceUrl]);
  useEffect(() => {
    if (!isTechnicalReviewWindowLooping || isAnalyzing || !technicalReviewWindow?.endTimeSeconds) return;
    const video = videoRef.current;
    if (!video) return;
    const loopWithinTechnicalReviewWindow = () => {
      if (!shouldRestartTechnicalReviewWindow(technicalReviewWindow, video.currentTime)) return;
      video.currentTime = technicalReviewWindow.startTimeSeconds;
      if (video.paused) void video.play().catch(() => undefined);
    };
    video.addEventListener("timeupdate", loopWithinTechnicalReviewWindow);
    return () => video.removeEventListener("timeupdate", loopWithinTechnicalReviewWindow);
  }, [isAnalyzing, isTechnicalReviewWindowLooping, technicalReviewWindow]);
  useEffect(() => {
    setTrackReviewFilter("all");
    setTechnicalReviewedTrackIds([]);
  }, [analysis?.outputFingerprint]);
  const seekTrajectoryPoint = (frame: number) => {
    if (isAnalyzing) return toast.error("Complete the current analysis before seeking to an audit point so live playback remains synchronized.");
    const video = videoRef.current;
    if (!video) return toast.error("The active video preview is unavailable for trajectory audit.");
    const time = Math.min(Math.max(0, frame / reviewCalibration.frameRate), Math.max(0, metadata.duration - 0.001));
    video.pause();
    video.currentTime = time;
    toast.success(`Active video positioned at frame ${frame} (${time.toFixed(3)} s) for read-only trajectory review.`);
  };
  const stepReviewFrame = (direction: -1 | 1) => {
    if (isAnalyzing) return toast.warning("Complete or cancel the active local analysis before stepping frames so live playback remains synchronized.");
    const video = videoRef.current;
    if (!video || !metadata.width) return toast.error("The active video preview is unavailable for frame review.");
    const target = resolveReviewFrameStep({ currentTimeSeconds: video.currentTime, durationSeconds: metadata.duration, frameRate: reviewCalibration.frameRate, direction });
    video.pause();
    video.currentTime = target.timeSeconds;
    toast.info(`Local technical review positioned at frame ${target.frame} (${target.timeSeconds.toFixed(3)} s).`);
  };
  useEffect(() => {
    const handleTechnicalReviewKeyDown = (event: KeyboardEvent) => {
      const element = event.target instanceof Element ? event.target : undefined;
      const direction = getKeyboardReviewFrameStepDirection({ key: event.key, altKey: event.altKey, ctrlKey: event.ctrlKey, metaKey: event.metaKey, targetIsEditable: Boolean(element?.closest("input, textarea, select, [contenteditable='true']")) });
      if (!direction || isAnalyzing || mediaError || !metadata.width) return;
      event.preventDefault();
      stepReviewFrame(direction);
    };
    window.addEventListener("keydown", handleTechnicalReviewKeyDown);
    return () => window.removeEventListener("keydown", handleTechnicalReviewKeyDown);
  }, [isAnalyzing, mediaError, metadata.width, stepReviewFrame]);
  const seekReviewTimestamp = () => {
    if (isAnalyzing) return toast.warning("Complete or cancel the active local analysis before seeking so live playback remains synchronized.");
    const video = videoRef.current;
    if (!video || !metadata.width) return toast.error("The active video preview is unavailable for local timestamp review.");
    const target = resolveReviewTimestampSeek({ requestedTimeSeconds: Number(reviewSeekTime), durationSeconds: metadata.duration, frameRate: reviewCalibration.frameRate });
    video.pause();
    video.currentTime = target.timeSeconds;
    setReviewSeekTime(target.timeSeconds.toFixed(3));
    toast.info(`Local technical review positioned at frame ${target.frame} (${target.timeSeconds.toFixed(3)} s).`);
  };
  const setTechnicalReviewWindowStart = () => {
    if (isAnalyzing) return toast.warning("Complete or cancel the active local analysis before marking a review window so live playback remains synchronized.");
    const video = videoRef.current;
    if (!video || !metadata.width) return toast.error("The active video preview is unavailable for technical review window marking.");
    const window = createTechnicalReviewWindowStart({ timeSeconds: video.currentTime, frameRate: reviewCalibration.frameRate });
    setTechnicalReviewWindow(window);
    toast.info(`Technical review window start marked at frame ${window.startFrame}. This does not change analysis output.`);
  };
  const setTechnicalReviewWindowEnd = () => {
    if (isAnalyzing) return toast.warning("Complete or cancel the active local analysis before marking a review window so live playback remains synchronized.");
    const video = videoRef.current;
    if (!video || !metadata.width || !technicalReviewWindow) return toast.error("Mark a technical review-window start before selecting a later end frame.");
    const window = addTechnicalReviewWindowEnd(technicalReviewWindow, { timeSeconds: video.currentTime, frameRate: reviewCalibration.frameRate });
    if (!window) return toast.warning("Select an end frame later than the local technical review-window start.");
    setTechnicalReviewWindow(window);
    toast.info(`Technical review window end marked at frame ${window.endFrame}. This does not change analysis output.`);
  };
  const toggleTechnicalReviewWindowLoop = () => {
    if (isAnalyzing) return toast.warning("Complete or cancel the active local analysis before looping a review window so live playback remains synchronized.");
    const video = videoRef.current;
    if (!video || !technicalReviewWindow?.endTimeSeconds) return toast.error("Complete a local technical review window before enabling its loop.");
    const nextLooping = !isTechnicalReviewWindowLooping;
    setIsTechnicalReviewWindowLooping(nextLooping);
    if (nextLooping) {
      video.currentTime = technicalReviewWindow.startTimeSeconds;
      void video.play().catch(() => undefined);
      toast.info("Local technical review-window loop enabled. This does not change analysis output.");
    } else {
      toast.info("Local technical review-window loop paused.");
    }
  };
  const seekTechnicalReviewWindowBoundary = (boundary: "start" | "end") => {
    if (isAnalyzing) return toast.warning("Complete or cancel the active local analysis before seeking a review-window boundary so live playback remains synchronized.");
    const video = videoRef.current;
    if (!video || !technicalReviewWindow) return toast.error("Mark a local technical review window before seeking its boundary.");
    const target = getTechnicalReviewWindowBoundary(technicalReviewWindow, boundary);
    video.pause();
    video.currentTime = target.timeSeconds;
    setReviewSeekTime(target.timeSeconds.toFixed(3));
    toast.info(`Local technical review positioned at the window ${boundary}, frame ${target.frame}.`);
  };
  const downloadTechnicalReviewWindowCsv = () => {
    if (!technicalReviewWindow) return toast.error("Mark a browser-local technical review window before exporting it.");
    const csv = buildTechnicalReviewWindowCsv(technicalReviewWindow, { sampleName, frameRate: reviewCalibration.frameRate });
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = buildTechnicalReviewWindowCsvFilename(sampleName);
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    toast.info(REVIEW_WINDOW_EXPORT_NOTICE);
  };
  const setLocalReviewPlaybackRate = (requestedRate: number) => {
    if (isAnalyzing) return toast.warning("Complete or cancel the active local analysis before changing review speed so live playback remains synchronized.");
    const video = videoRef.current;
    if (!video || !metadata.width) return toast.error("The active video preview is unavailable for local playback review.");
    const playbackRate = resolveReviewPlaybackRate(requestedRate);
    video.playbackRate = playbackRate;
    setReviewPlaybackRate(playbackRate);
    toast.info(`Local technical review speed set to ${playbackRate}×. This does not change analysis output.`);
  };
  const addCurrentReviewBookmark = () => {
    if (isAnalyzing) return toast.warning("Complete or cancel the active local analysis before adding a review bookmark so live playback remains synchronized.");
    const video = videoRef.current;
    if (!video || !metadata.width) return toast.error("The active video preview is unavailable for local review bookmarking.");
    const bookmark = createReviewBookmark({ currentTimeSeconds: video.currentTime, frameRate: reviewCalibration.frameRate, operatorLabel: reviewBookmarkOperatorLabel });
    const exists = reviewBookmarks.some(item => item.id === bookmark.id);
    setReviewBookmarks(current => addReviewBookmark(current, bookmark));
    if (!exists) setReviewBookmarkOperatorLabel("");
    toast.info(exists ? `${bookmark.label} is already bookmarked locally.` : `${bookmark.label}${bookmark.operatorLabel ? ` · ${bookmark.operatorLabel}` : ""} bookmarked locally for technical review.`);
  };
  const removeCurrentReviewBookmark = (bookmark: ReviewBookmark) => {
    if (isAnalyzing) return toast.warning("Complete or cancel the active local analysis before removing a review bookmark so live playback remains synchronized.");
    setReviewBookmarks(current => removeReviewBookmark(current, bookmark.id));
    if (editingReviewBookmarkId === bookmark.id) {
      setEditingReviewBookmarkId(undefined);
      setEditingReviewBookmarkOperatorLabel("");
    }
    toast.info(`${bookmark.label} removed from browser-local technical review. Analysis output is unchanged.`);
  };
  const beginReviewBookmarkNoteEdit = (bookmark: ReviewBookmark) => {
    if (isAnalyzing) return toast.warning("Complete or cancel the active local analysis before editing a review note so live playback remains synchronized.");
    setEditingReviewBookmarkId(bookmark.id);
    setEditingReviewBookmarkOperatorLabel(bookmark.operatorLabel ?? "");
  };
  const saveReviewBookmarkNote = (bookmark: ReviewBookmark) => {
    if (isAnalyzing) return toast.warning("Complete or cancel the active local analysis before saving a review note so live playback remains synchronized.");
    setReviewBookmarks(current => updateReviewBookmarkOperatorLabel(current, bookmark.id, editingReviewBookmarkOperatorLabel));
    setEditingReviewBookmarkId(undefined);
    setEditingReviewBookmarkOperatorLabel("");
    toast.info(`${bookmark.label} technical note updated locally. Analysis output is unchanged.`);
  };
  const clearReviewBookmarks = () => {
    if (isAnalyzing) return toast.warning("Complete or cancel the active local analysis before clearing review bookmarks so live playback remains synchronized.");
    setReviewBookmarks([]);
    setEditingReviewBookmarkId(undefined);
    setEditingReviewBookmarkOperatorLabel("");
  };
  const seekReviewBookmark = (bookmark: ReviewBookmark) => {
    if (isAnalyzing) return toast.warning("Complete or cancel the active local analysis before using a review bookmark so live playback remains synchronized.");
    const video = videoRef.current;
    if (!video) return toast.error("The active video preview is unavailable for local review bookmarking.");
    video.pause();
    video.currentTime = bookmark.timeSeconds;
    toast.info(`Local review positioned at ${bookmark.label}.`);
  };
  const downloadReviewBookmarksCsv = () => {
    if (!reviewBookmarks.length) return toast.error("Add a browser-local technical review bookmark before exporting it.");
    const csv = buildReviewBookmarkCsv(reviewBookmarks, { sampleName, frameRate: reviewCalibration.frameRate });
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = buildReviewBookmarkCsvFilename(sampleName);
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    toast.info(REVIEW_BOOKMARK_EXPORT_NOTICE);
  };
  const addCurrentFieldToReview = () => {
    if (!analysis) return toast.error("Run an analysis before adding a field to local repeatability review.");
    if (!analysisRunContext) return toast.error("Completed run context is unavailable. Run the analysis again before adding this field to local repeatability review.");
    if (analysisRunContext.source === "reference") return toast.warning("Bundled reference footage is demonstration material and cannot be added as a clinical replicate.");
    if (multiFieldResults.some(field => field.id === analysisRunContext.sourceUrl)) return toast.info("This field is already included in the current local repeatability review.");
    setMultiFieldResults(current => [...current, { id: analysisRunContext.sourceUrl, label: analysisRunContext.sampleName || analysisRunContext.fileName, source: analysisRunContext.source, methodSignature: JSON.stringify({ species: analysisRunContext.species, calibration: analysisRunContext.calibration, thresholds: analysisRunContext.thresholds }), summary: analysis.summary, qualityFlags: analysis.qualityFlags, trajectoryIntegrity: analysis.trajectoryIntegrity }]);
    setSameSpecimenConfirmed(false);
    toast.success("Field added locally. Add an independent field from the same prepared specimen to calculate repeatability.");
  };
  const historicalRows = useMemo(() => {
    const records = recordsQuery.data ?? [];
    return records.slice(0, 6).map((record, index) => {
      let metrics: Record<string, number> = {};
      try { metrics = JSON.parse(record.metricsJson) as Record<string, number>; } catch { metrics = {}; }
      let precedingMetrics: Record<string, number> = {};
      if (records[index + 1]) {
        try { precedingMetrics = JSON.parse(records[index + 1].metricsJson) as Record<string, number>; } catch { precedingMetrics = {}; }
      }
      const motilityDelta = index < records.length - 1 && Number.isFinite(metrics.motility) && Number.isFinite(precedingMetrics.motility)
        ? metrics.motility - precedingMetrics.motility
        : undefined;
      return { record, metrics, motilityDelta };
    });
  }, [recordsQuery.data]);

  const useStoredMethod = (record: PersistedAnalysisRecord) => {
    const details = getStoredSnapshotDetails(record);
    setCalibration(details.calibration);
    setThresholds(details.thresholds);
    setSpecies(record.species);
    setCalibrationEvidence(details.calibrationEvidence);
    selectDashboardView("workspace");
    toast.success(`Loaded the saved method from ${record.sampleName} as an editable draft. The original snapshot was not changed.`);
  };

  const downloadStoredManifest = (record: PersistedAnalysisRecord) => {
    const details = getStoredSnapshotDetails(record);
    const manifest = {
      schema: "semenscope.persisted-analysis-record.v1",
      exportedAt: new Date().toISOString(),
      scientificUse: "Automated estimates for laboratory review only; not a diagnostic, fertility, breeding, or treatment decision.",
      record: {
        id: record.id,
        savedAt: record.createdAt,
        sampleName: record.sampleName,
        species: record.species,
        source: record.source,
        videoFileName: record.videoFileName,
        status: record.status,
      },
      calibration: details.calibration,
      calibrationEvidence: details.calibrationEvidence ?? null,
      thresholds: details.thresholds,
      metrics: details.metrics,
      captureQuality: details.captureQuality ?? null,
      specimenContext: details.specimenContext ?? null,
      footageProvenance: details.footageProvenance ?? null,
      analysisSessionReference: details.analysisSessionReference ?? null,
      acquisitionReadiness: details.acquisitionReadiness ?? null,
      dosePlan: details.dosePlan ?? null,
      qualityFlags: details.flags,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${record.sampleName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-saved-record-manifest.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const downloadLaboratoryHandoff = (record: PersistedAnalysisRecord) => {
    const csv = buildLaboratoryHandoffCsv(record, getStoredSnapshotDetails(record));
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${record.sampleName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-laboratory-handoff.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const copyLaboratoryHandoff = async (record: PersistedAnalysisRecord) => {
    const handoff = buildLaboratoryHandoffText(record, getStoredSnapshotDetails(record));
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard API unavailable");
      await navigator.clipboard.writeText(handoff);
      toast.success("Laboratory handoff summary copied for reviewer transfer.");
    } catch {
      const area = document.createElement("textarea");
      area.value = handoff;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.append(area);
      area.select();
      const copied = document.execCommand("copy");
      area.remove();
      copied ? toast.success("Laboratory handoff summary copied for reviewer transfer.") : toast.error("Could not copy the handoff summary. Export the CSV instead.");
    }
  };

  const openHistoryRecord = (recordId?: number) => {
    if (recordId) setSelectedRecordId(recordId);
    selectDashboardView("history");
  };

  const openQualityRecord = (recordId?: number) => {
    if (recordId) setSelectedRecordId(recordId);
    selectDashboardView("quality");
  };

  useEffect(() => {
    if (settingsQuery.data?.settingsJson && !settingsLoaded) {
      const restored = parseSettings(settingsQuery.data.settingsJson);
      if (restored) {
        setCalibration(restored.calibration);
        setThresholds(restored.thresholds);
        setSpecies(restored.species);
        setCalibrationEvidence(restored.calibrationEvidence);
      }
      setSettingsLoaded(true);
    }
  }, [settingsLoaded, settingsQuery.data?.settingsJson]);

  useEffect(() => {
    setLocalDraftSavedAt(parseLocalMethodDraft(localStorage.getItem(LOCAL_METHOD_DRAFT_STORAGE_KEY))?.savedAt);
  }, []);

  useEffect(() => {
    if (!sourceUrl) return;
    getVideoMetadata(sourceUrl, calibration.frameRate)
      .then(nextMetadata => {
        setMetadata(nextMetadata);
        setMediaError(undefined);
      })
      .catch(error => {
        const message = error instanceof Error ? error.message : "Video metadata could not be loaded.";
        setMediaError(message);
        setStage(message);
      });
  }, [sourceUrl, calibration.frameRate]);

  useEffect(() => () => {
    cameraStream?.getTracks().forEach(track => track.stop());
    if (recordingStopTimerRef.current) window.clearTimeout(recordingStopTimerRef.current);
    if (recordingCountdownTimerRef.current) window.clearInterval(recordingCountdownTimerRef.current);
    if (preCaptureStartTimerRef.current) window.clearTimeout(preCaptureStartTimerRef.current);
    if (preCaptureCountdownTimerRef.current) window.clearInterval(preCaptureCountdownTimerRef.current);
    if (sourceType !== "reference" && sourceUrl.startsWith("blob:")) URL.revokeObjectURL(sourceUrl);
  }, [cameraStream, sourceType, sourceUrl]);

  useEffect(() => {
    if (!isAnalyzing) return;
    const handleEscapeCancellation = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return;
      event.preventDefault();
      cancelAnalysisRef.current = true;
      setStage("Cancelling local analysis…");
    };
    window.addEventListener("keydown", handleEscapeCancellation);
    return () => window.removeEventListener("keydown", handleEscapeCancellation);
  }, [isAnalyzing]);

  useEffect(() => {
    if (!analysisCancelled || isAnalyzing) return;
    window.requestAnimationFrame(() => runAnalysisButtonRef.current?.focus());
  }, [analysisCancelled, isAnalyzing]);

  useEffect(() => {
    const preview = cameraVideoRef.current;
    if (!preview) return;
    preview.srcObject = cameraStream ?? null;
    if (cameraStream) preview.play().catch(() => undefined);
  }, [cameraStream]);

  useEffect(() => {
    if (cameraStream || !restoreCameraStartFocusRef.current) return;
    restoreCameraStartFocusRef.current = false;
    window.requestAnimationFrame(() => cameraStartButtonRef.current?.focus());
  }, [cameraStream]);

  useEffect(() => {
    if (!cameraStream) return;
    const handleStreamEnded = () => {
      restoreCameraStartFocusRef.current = true;
      if (preCaptureStartTimerRef.current) window.clearTimeout(preCaptureStartTimerRef.current);
      if (preCaptureCountdownTimerRef.current) window.clearInterval(preCaptureCountdownTimerRef.current);
      preCaptureStartTimerRef.current = undefined;
      preCaptureCountdownTimerRef.current = undefined;
      startRecordingAfterDelayRef.current = false;
      setPreCaptureRemainingSeconds(0);
      if (mediaRecorderRef.current?.state === "recording") {
        recordingStopReasonRef.current = "stream_ended";
        mediaRecorderRef.current.stop();
      }
      setCameraStream(current => current === cameraStream ? undefined : current);
      setActiveCameraLabel(undefined);
      if (cameraVideoRef.current?.srcObject === cameraStream) cameraVideoRef.current.srcObject = null;
      toast.warning("The active camera stream ended. Start preview again before capturing a new clip.");
    };
    const tracks = cameraStream.getVideoTracks();
    tracks.forEach(track => track.addEventListener("ended", handleStreamEnded));
    return () => tracks.forEach(track => track.removeEventListener("ended", handleStreamEnded));
  }, [cameraStream]);

  useEffect(() => {
    if (!selectedTrack) return;
    const refreshed = visibleTracks.find(track => track.id === selectedTrack.id);
    if (refreshed) setSelectedTrack(refreshed);
  }, [analysis?.tracks, isAnalyzing, liveProgress?.liveTracks, selectedTrack?.id]);

  const chooseReference = (sample: SampleSource) => {
    if (recording) return toast.warning("Stop the active local camera recording before staging replacement footage.");
    if (isAnalyzing) return toast.warning("Cancel the active local analysis before staging replacement footage.");
    setActiveSample(sample);
    setSourceType("reference");
    setSourceUrl(sample.url);
    setFileName(`${sample.id}.mp4`);
    setFootageProvenance({ source: "reference", container: "MP4" });
    setPartialCameraCaptureAcknowledged(true);
    setPartialCameraCaptureReviewAcknowledgedAt(undefined);
    setPartialCameraCaptureReviewMethodFingerprint(undefined);
    setSampleName(sample.label);
    setAnalysis(undefined);
    setAnalysisRunContext(undefined);
    setAnalysisSessionReference(undefined);
    setAnalysisCancelled(false);
    setLiveProgress(undefined);
    setSelectedTrack(undefined);
    setMediaError(undefined);
    setStage("Reference footage staged. Confirm calibration before analysis.");
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (recording) {
      event.target.value = "";
      return toast.warning("Stop the active local camera recording before staging replacement footage.");
    }
    if (isAnalyzing) {
      event.target.value = "";
      return toast.warning("Cancel the active local analysis before staging replacement footage.");
    }
    const file = event.target.files?.[0];
    if (!file) return;
    const normalizedName = file.name.toLowerCase();
    const supportedContainer = file.type === "video/mp4" || file.type === "video/webm" || normalizedName.endsWith(".mp4") || normalizedName.endsWith(".webm");
    if (!supportedContainer) {
      toast.error("SemenScope accepts H.264 MP4 or WebM video. Convert this file before uploading it.");
      event.target.value = "";
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    try {
      const uploadedMetadata = await getVideoMetadata(objectUrl, calibration.frameRate);
      if (sourceUrl.startsWith("blob:")) URL.revokeObjectURL(sourceUrl);
      setSourceType("upload");
      setSourceUrl(objectUrl);
      setFileName(file.name);
      setFootageProvenance({ source: "upload", container: inferFootageContainer(file.type, file.name), byteSize: file.size });
      setPartialCameraCaptureAcknowledged(true);
      setPartialCameraCaptureReviewAcknowledgedAt(undefined);
      setPartialCameraCaptureReviewMethodFingerprint(undefined);
      setSampleName(file.name.replace(/\.[^.]+$/, ""));
      setMetadata(uploadedMetadata);
      setMediaError(undefined);
      setAnalysis(undefined);
      setAnalysisRunContext(undefined);
      setAnalysisSessionReference(undefined);
      setAnalysisCancelled(false);
      setLiveProgress(undefined);
      setSelectedTrack(undefined);
      setStage("Compatible footage is staged locally in this browser. Video bytes are not sent to the server by this workflow.");
    } catch (error) {
      URL.revokeObjectURL(objectUrl);
      const message = error instanceof Error ? error.message : "This video could not be decoded by the browser.";
      setStage(`Upload rejected: ${message}`);
      toast.error(`${message} The active footage was left unchanged.`);
      event.target.value = "";
    }
  };

  const startCamera = async () => {
    if (isAnalyzing) return toast.warning("Complete or cancel the active local analysis before starting a camera preview.");
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraPreviewErrorNotice("Camera preview is not available in this browser context. The active footage was not replaced; upload a compatible clip or use a browser with camera access.");
      toast.error("Camera preview is not available in this browser context. Use a secure browser context or upload a compatible video.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: buildCameraPreviewConstraints(selectedDevice, cameraPreviewProfile),
        audio: false,
      });
      setCameraStream(stream);
      setRecordingErrorNotice(undefined);
      setCameraPreviewErrorNotice(undefined);
      setActiveCameraLabel(stream.getVideoTracks()[0]?.label || "Browser camera label not exposed");
      const settings = stream.getVideoTracks()[0]?.getSettings?.() as (MediaTrackSettings & { resizeMode?: string }) | undefined;
      setCameraPreviewResolutionEvidence(buildCameraPreviewResolutionEvidence({
        profileId: cameraPreviewProfile,
        previewWidth: cameraVideoRef.current?.videoWidth,
        previewHeight: cameraVideoRef.current?.videoHeight,
        trackWidth: settings?.width,
        trackHeight: settings?.height,
        trackFrameRate: settings?.frameRate,
        trackResizeMode: settings?.resizeMode,
      }));
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
        await cameraVideoRef.current.play();
      }
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = buildCameraDeviceOptions(allDevices);
      setDevices(videoDevices);
      if (!selectedDevice && videoDevices[0]) setSelectedDevice(videoDevices[0].deviceId);
      toast.success("Camera preview is active. Capture a short clip to place it in the analysis workspace.");
    } catch (error) {
      setCameraPreviewErrorNotice("Camera preview could not start in this browser. The active footage was not replaced; review permission or device availability and try again.");
      toast.error(error instanceof Error ? error.message : "Camera access was not available.");
    }
  };

  const cancelPreCaptureDelay = () => {
    if (preCaptureStartTimerRef.current) window.clearTimeout(preCaptureStartTimerRef.current);
    if (preCaptureCountdownTimerRef.current) window.clearInterval(preCaptureCountdownTimerRef.current);
    preCaptureStartTimerRef.current = undefined;
    preCaptureCountdownTimerRef.current = undefined;
    startRecordingAfterDelayRef.current = false;
    setPreCaptureRemainingSeconds(0);
  };

  const stopCamera = () => {
    restoreCameraStartFocusRef.current = true;
    cancelPreCaptureDelay();
    if (mediaRecorderRef.current?.state === "recording") {
      recordingStopReasonRef.current = "operator";
      mediaRecorderRef.current.stop();
    }
    cameraStream?.getTracks().forEach(track => track.stop());
    setCameraStream(undefined);
    setActiveCameraLabel(undefined);
    setCameraPreviewResolutionEvidence(undefined);
    if (cameraVideoRef.current) cameraVideoRef.current.srcObject = null;
  };

  const restartCameraWithSelectedDevice = () => {
    if (isAnalyzing) return toast.warning("Complete or cancel the active local analysis before changing the camera preview.");
    if (!cameraStream || !activeCameraSelectionDiffers) return;
    stopCamera();
    void startCamera();
  };

  const resetTemporarySession = () => {
    if (recording) return toast.warning("Stop the active local camera recording before clearing the temporary browser-local session.");
    if (isAnalyzing) return toast.warning("Cancel the active analysis before clearing the temporary browser-local session.");
    stopCamera();
    const reset = createTemporarySessionResetState();
    setSpecimenContext(reset.specimenContext);
    setOpticsTraceability(reset.opticsTraceability);
    setDosePlan(reset.dosePlan);
    setMultiFieldResults([]);
    setSameSpecimenConfirmed(false);
    setStillPreview(undefined);
    setStillCapturedAt(undefined);
    setSelectedTrack(undefined);
    chooseReference(REFERENCE_SAMPLES[2]);
    toast.info("Temporary browser-local operator context cleared. Local drafts, authenticated presets, saved records, and bundled reference footage were preserved.");
  };

  const refreshCameraDevices = async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      toast.error("Camera device listing is not available in this browser context. You can still upload a compatible video.");
      return;
    }
    try {
      const nextDevices = buildCameraDeviceOptions(await navigator.mediaDevices.enumerateDevices());
      setDevices(nextDevices);
      if (selectedDevice && !nextDevices.some(device => device.deviceId === selectedDevice)) setSelectedDevice("");
      toast.info(nextDevices.length ? `${nextDevices.length} local video input${nextDevices.length === 1 ? "" : "s"} listed. Starting preview still requires browser permission.` : "No local video input entries were listed. You can upload a compatible clip instead.");
    } catch {
      toast.error("Camera device listing could not be refreshed. You can still upload a compatible video.");
    }
  };

  const captureStill = () => {
    if (isAnalyzing) return toast.warning("Complete or cancel the active local analysis before capturing a still frame.");
    if (recording) return toast.warning("Stop the active local camera recording before capturing a still frame.");
    const live = cameraVideoRef.current;
    if (!live || !live.videoWidth) return toast.error("Start the camera preview before capturing a frame.");
    const canvas = document.createElement("canvas");
    canvas.width = live.videoWidth;
    canvas.height = live.videoHeight;
    canvas.getContext("2d")?.drawImage(live, 0, 0);
    setStillPreview(canvas.toDataURL("image/jpeg", 0.92));
    setStillCapturedAt(new Date().toISOString());
    toast.success("Still frame captured for visual review. Capture a clip for motility measurements.");
  };

  const downloadCameraStill = () => {
    if (!stillPreview) return toast.error("Capture a browser-local microscope still before downloading it.");
    const anchor = document.createElement("a");
    anchor.href = stillPreview;
    anchor.download = buildCameraStillPngFilename(sampleName, stillCapturedAt);
    anchor.click();
    toast.info(CAMERA_STILL_EXPORT_NOTICE);
  };

  const captureCalibrationBoard = () => {
    const live = cameraVideoRef.current;
    if (!live || !live.videoWidth) return toast.error("Start the microscope camera preview, position the calibration board, then capture its reference image.");
    const canvas = document.createElement("canvas");
    canvas.width = live.videoWidth;
    canvas.height = live.videoHeight;
    canvas.getContext("2d")?.drawImage(live, 0, 0);
    stageCalibrationBoardImage(canvas.toDataURL("image/jpeg", 0.94), canvas.width, canvas.height);
  };

  const stageCalibrationBoardImage = (url: string, width: number, height: number) => {
    setBoardImage({ url, width, height });
    setBoardPoints([]);
    toast.success("Calibration-board image staged locally. Click two adjacent known references to estimate the scale.");
  };

  const handleCalibrationBoardUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose a clear calibration-board image in a standard image format.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => toast.error("The calibration-board image could not be read.");
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const image = new Image();
      image.onerror = () => toast.error("The calibration-board image could not be decoded.");
      image.onload = () => stageCalibrationBoardImage(dataUrl, image.naturalWidth, image.naturalHeight);
      image.src = dataUrl;
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const setBoardReferencePoint = (event: MouseEvent<HTMLButtonElement>) => {
    if (!boardImage) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const point = {
      x: ((event.clientX - bounds.left) / bounds.width) * boardImage.width,
      y: ((event.clientY - bounds.top) / bounds.height) * boardImage.height,
    };
    setBoardPoints(current => current.length >= 2 ? [point] : [...current, point]);
  };

  const applyBoardCalibration = () => {
    if (!boardEstimate) return toast.error("Capture a clear board frame, enter the known interval, and click two reference points at least 12 pixels apart.");
    setCalibration(current => ({ ...current, micronsPerPixel: Number(boardEstimate.micronsPerPixel.toFixed(5)) }));
    setCalibrationEvidence(boardEstimate);
    setCalibrationWizardOpen(false);
    toast.success(`Board scale applied: ${boardEstimate.micronsPerPixel.toFixed(5)} µm/px. Save the method preset to retain the evidence.`);
  };

  const captureClip = () => {
    if (isAnalyzing) return toast.warning("Cancel the active local analysis before staging a replacement camera clip.");
    if (!cameraStream) return toast.error("Start the camera preview before recording.");
    if (typeof MediaRecorder === "undefined") return toast.error("Clip recording is not available in this browser. Upload an H.264 MP4 or WebM clip instead.");
    if (recording) {
      recordingStopReasonRef.current = "operator";
      mediaRecorderRef.current?.stop();
      return;
    }
    const startingAfterDelay = startRecordingAfterDelayRef.current;
    if (preCaptureRemainingSeconds && !startingAfterDelay) {
      cancelPreCaptureDelay();
      toast.info("Local camera stabilization delay cancelled. The active preview remains available.");
      return;
    }
    if (preCaptureDelaySeconds && !startingAfterDelay) {
      const delaySeconds = normalizeCameraPreCaptureDelay(preCaptureDelaySeconds);
      const deadlineMs = Date.now() + delaySeconds * 1_000;
      setPreCaptureRemainingSeconds(delaySeconds);
      preCaptureCountdownTimerRef.current = window.setInterval(() => setPreCaptureRemainingSeconds(getPreCaptureDelayRemainingSeconds(deadlineMs, Date.now())), 200);
      preCaptureStartTimerRef.current = window.setTimeout(() => {
        if (preCaptureCountdownTimerRef.current) window.clearInterval(preCaptureCountdownTimerRef.current);
        preCaptureCountdownTimerRef.current = undefined;
        preCaptureStartTimerRef.current = undefined;
        setPreCaptureRemainingSeconds(0);
        startRecordingAfterDelayRef.current = true;
        captureClip();
      }, delaySeconds * 1_000);
      toast.info(`Local preview stabilization started. Recording begins in ${delaySeconds} s unless cancelled.`);
      return;
    }
    startRecordingAfterDelayRef.current = false;
    try {
      const requestedDurationSeconds = normalizeCameraClipDuration(captureDurationSeconds);
      const startedAtMs = Date.now();
      const activeTrackSettings = cameraStream.getVideoTracks()[0]?.getSettings() as (MediaTrackSettings & { resizeMode?: string }) | undefined;
      const { width: captureFrameWidth, height: captureFrameHeight } = resolveCameraCaptureFrameDimensions({
        previewWidth: cameraVideoRef.current?.videoWidth,
        previewHeight: cameraVideoRef.current?.videoHeight,
        trackWidth: activeTrackSettings?.width,
        trackHeight: activeTrackSettings?.height,
      });
      const clearRecordingTimers = () => {
        if (recordingStopTimerRef.current) window.clearTimeout(recordingStopTimerRef.current);
        if (recordingCountdownTimerRef.current) window.clearInterval(recordingCountdownTimerRef.current);
        recordingStopTimerRef.current = undefined;
        recordingCountdownTimerRef.current = undefined;
      };
      const preferredRecorderMimeType = selectCameraRecorderMimeType(MediaRecorder.isTypeSupported);
      const recorder = preferredRecorderMimeType ? new MediaRecorder(cameraStream, { mimeType: preferredRecorderMimeType }) : new MediaRecorder(cameraStream);
      mediaRecorderRef.current = recorder;
      recordedChunksRef.current = [];
      recordingStopReasonRef.current = undefined;
      recordingFailedRef.current = false;
      setRecordingErrorNotice(undefined);
      recorder.ondataavailable = event => {
        if (event.data.size > 0) recordedChunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        recordingFailedRef.current = true;
        clearRecordingTimers();
        setRecording(false);
        setRecordingRemainingSeconds(0);
        setRecordingErrorNotice("Camera recording encountered a browser error. The active footage was not replaced; restart the local recording when ready.");
        toast.error("Camera recording encountered a browser error. Active footage was not replaced.");
      };
      recorder.onstop = () => {
        clearRecordingTimers();
        setRecording(false);
        setRecordingRemainingSeconds(0);
        if (recordingFailedRef.current) {
          recordingFailedRef.current = false;
          return;
        }
        const clip = new Blob(recordedChunksRef.current, { type: recorder.mimeType || "video/webm" });
        if (!clip.size) return toast.error("No camera footage was captured.");
        const stopReason = recordingStopReasonRef.current ?? "operator";
        if (sourceUrl.startsWith("blob:")) URL.revokeObjectURL(sourceUrl);
        const clipUrl = URL.createObjectURL(clip);
        setSourceType("camera");
        setSourceUrl(clipUrl);
        setFileName(`microscope-capture-${requestedDurationSeconds}s-${new Date().toISOString().slice(11, 19).replace(/:/g, "")}.webm`);
        setFootageProvenance({ source: "camera", container: inferFootageContainer(clip.type, "capture.webm"), byteSize: clip.size, captureDeviceLabel: activeCameraLabel || "Browser camera label not exposed", capturedAt: new Date().toISOString(), captureFrameWidth, captureFrameHeight, requestedPreviewProfile: CAMERA_PREVIEW_PROFILES.find(profile => profile.id === cameraPreviewProfile)?.label, activePreviewFrameRate: activeTrackSettings?.frameRate, activePreviewResizeMode: activeTrackSettings?.resizeMode, preCaptureStabilizationDelaySeconds: normalizeCameraPreCaptureDelay(preCaptureDelaySeconds), recorderMimeType: recorder.mimeType || clip.type || undefined, requestedDurationSeconds, actualDurationSeconds: Math.round((Date.now() - startedAtMs) / 100) / 10, recordingStopReason: stopReason });
        setPartialCameraCaptureAcknowledged(stopReason !== "stream_ended");
        setPartialCameraCaptureReviewAcknowledgedAt(undefined);
        setPartialCameraCaptureReviewMethodFingerprint(undefined);
        setSampleName(`Microscope capture · ${requestedDurationSeconds} s`);
        setAnalysis(undefined);
        setAnalysisRunContext(undefined);
        setAnalysisSessionReference(undefined);
        setAnalysisCancelled(false);
        setLiveProgress(undefined);
        setSelectedTrack(undefined);
        if (stopReason === "stream_ended") {
          setStage("Camera stream ended during local recording. The partial clip is staged locally; review its technical context and confirm calibration before analysis.");
          toast.warning("Camera stream ended during recording. A partial clip was staged locally for technical review.");
        } else {
          setStage(`${requestedDurationSeconds} s camera footage staged in the same analysis workspace. Confirm calibration before analysis.`);
          toast.success("Short camera clip added to the analysis workspace.");
        }
      };
      recorder.start();
      setRecording(true);
      setRecordingRemainingSeconds(requestedDurationSeconds);
      recordingCountdownTimerRef.current = window.setInterval(() => setRecordingRemainingSeconds(getRemainingCameraClipSeconds(startedAtMs, requestedDurationSeconds, Date.now())), 200);
      recordingStopTimerRef.current = window.setTimeout(() => {
        if (recorder.state !== "recording") return;
        recordingStopReasonRef.current = "requested_duration";
        recorder.stop();
      }, requestedDurationSeconds * 1_000);
    } catch (error) {
      mediaRecorderRef.current = null;
      setRecording(false);
      setRecordingRemainingSeconds(0);
      setRecordingErrorNotice("Camera recording could not start in this browser. The active footage was not replaced; try the local recording again or upload a compatible clip.");
      toast.error(error instanceof Error ? error.message : "Clip recording is not supported by this camera.");
    }
  };

  const persistSettings = async () => {
    if (!isAuthenticated) return startLogin();
    await saveSettings.mutateAsync({ settingsJson: JSON.stringify(activeSettings) });
    if (calibrationEvidence) toast.success("Board-referenced calibration and threshold preset saved to this laboratory profile.");
    else toast.warning("Manual scale and thresholds saved without calibration-board evidence. Use the calibration wizard before interpreting velocity or distance outputs.");
  };

  const saveLocalMethodDraft = () => {
    const draft = createLocalMethodDraft({ species, calibration, thresholds });
    localStorage.setItem(LOCAL_METHOD_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    setLocalDraftSavedAt(draft.savedAt);
    toast.info("Method draft saved only in this browser. It does not alter immutable analysis records or laboratory presets.");
  };

  const restoreLocalMethodDraft = () => {
    const draft = parseLocalMethodDraft(localStorage.getItem(LOCAL_METHOD_DRAFT_STORAGE_KEY));
    if (!draft) return toast.warning("No valid browser-local method draft was found.");
    setSpecies(draft.species);
    setCalibration(draft.calibration);
    setThresholds(draft.thresholds);
    setCalibrationEvidence(undefined);
    setLocalDraftSavedAt(draft.savedAt);
    toast.info("Browser-local draft restored. Board evidence was cleared; confirm calibration before analysis.");
  };

  const clearLocalMethodDraft = () => {
    localStorage.removeItem(LOCAL_METHOD_DRAFT_STORAGE_KEY);
    setLocalDraftSavedAt(undefined);
    toast.info("Browser-local method draft cleared. The active method, authenticated presets, and immutable records were not changed.");
  };

  const exportLocalMethodDraft = () => {
    const draft = createLocalMethodDraft({ species, calibration, thresholds });
    const url = URL.createObjectURL(new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `semenscope-browser-local-method-draft-${draft.savedAt.slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.info("Browser-local method draft exported. Import validates its settings before it can affect the active draft.");
  };

  const importLocalMethodDraft = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 100_000) return toast.warning("Method draft import was rejected because the file exceeds the 100 KB local safety limit.");
    const draft = parseLocalMethodDraft(await file.text());
    if (!draft) return toast.warning("Method draft import was rejected because its required calibration or threshold settings are invalid.");
    setSpecies(draft.species);
    setCalibration(draft.calibration);
    setThresholds(draft.thresholds);
    setCalibrationEvidence(undefined);
    localStorage.setItem(LOCAL_METHOD_DRAFT_STORAGE_KEY, JSON.stringify(draft));
    setLocalDraftSavedAt(draft.savedAt);
    toast.info("Validated browser-local method draft imported. Board evidence was cleared; confirm calibration before analysis.");
  };

  const runAnalysis = async () => {
    if (recording) return toast.warning("Stop the active local camera recording before starting analysis.");
    if (requiresPartialCameraCaptureAcknowledgement(footageProvenance, partialCameraCaptureAcknowledged)) return toast.warning("Review and acknowledge the partial camera clip before starting analysis.");
    if (!sourceUrl) return toast.error("Select or capture a microscope video before analysis.");
    if (mediaError) return toast.error(`${mediaError} Choose a compatible clip before analysis.`);
    const runContext = createBrowserLocalAnalysisRunContext({ sourceUrl, source: sourceType, fileName, sampleName, species, calibration, thresholds, calibrationEvidence, footageProvenance, specimenContext, opticsTraceability, dosePlan, partialCameraCaptureReviewAcknowledgedAt: footageProvenance.recordingStopReason === "stream_ended" ? partialCameraCaptureReviewAcknowledgedAt : undefined });
    setAnalysisRunContext(runContext);
    setTechnicalReviewedTrackIds([]);
    setIsAnalyzing(true);
    setProgress(2);
    setAnalysisCancelled(false);
    cancelAnalysisRef.current = false;
    const sessionReference = createBrowserLocalAnalysisSessionReference();
    setLiveProgress(undefined);
    setSelectedTrack(undefined);
    const displayVideo = videoRef.current;
    if (displayVideo) {
      displayVideo.pause();
      displayVideo.currentTime = 0;
      displayVideo.playbackRate = 1;
      setReviewPlaybackRate(1);
      await displayVideo.play().catch(() => undefined);
    }
    try {
      const output = await analyzeMicroscopeVideo({
        sourceUrl: runContext.sourceUrl,
        calibration: runContext.calibration,
        thresholds: runContext.thresholds,
        shouldCancel: () => cancelAnalysisRef.current,
        onProgress: update => {
          setProgress(update.progress);
          setStage(update.stage);
          setLiveProgress(update);
          const visibleVideo = videoRef.current;
          if (visibleVideo && Number.isFinite(update.playbackTime)) {
            const drift = Math.abs(visibleVideo.currentTime - update.playbackTime);
            if (drift > Math.max(0.09, 2 / runContext.calibration.frameRate)) visibleVideo.currentTime = update.playbackTime;
          }
        },
      });
      const outputWithProvenance = runContext.calibrationEvidence ? output : {
        ...output,
        qualityFlags: [...output.qualityFlags, "Calibration provenance: manual scale entered without calibration-board evidence. Confirm µm/px against laboratory protocol before interpreting distance or velocity metrics."],
      };
      setMetadata(output.metadata);
      setAnalysis(outputWithProvenance);
      setAnalysisSessionReference(sessionReference);
      const savedDosePlan = calculateDosePlan(runContext.dosePlan);
      const savedReadiness = buildAcquisitionReadiness({ specimenContext: runContext.specimenContext, calibrationEvidence: runContext.calibrationEvidence, width: output.metadata.width, height: output.metadata.height, frameRate: output.metadata.frameRate, captureQuality: output.captureQuality });
      const record = {
        sampleName: runContext.sampleName,
        species: runContext.species,
        source: runContext.source,
        videoFileName: runContext.fileName,
        videoUrl: runContext.source === "reference" ? runContext.sourceUrl : null,
        videoMetadataJson: JSON.stringify(attachCalibrationEvidence({ ...output.metadata, captureQuality: output.captureQuality, fieldStability: output.fieldStability, confidenceDistribution: output.confidenceDistribution, temporalSampling: output.temporalSampling, classificationComposition: output.classificationComposition, trackDurationEvidence: output.trackDurationEvidence, trackMetricRangeEvidence: output.trackMetricRangeEvidence, trackLinkageContinuity: output.trackLinkageContinuity, trajectorySpatialCoverage: output.trajectorySpatialCoverage, fieldBoundaryContact: output.fieldBoundaryContact, trajectoryTemporalPlacement: output.trajectoryTemporalPlacement, trackDirectionalBalance: output.trackDirectionalBalance, trajectoryIntegrity: output.trajectoryIntegrity, outputFingerprint: output.outputFingerprint, candidateDetectionLoad: output.candidateDetectionLoad, candidateScoreDistribution: output.candidateScoreDistribution, processingPerformance: output.processingPerformance, analysisScalingEvidence: output.analysisScalingEvidence, detectorConfigurationEvidence: output.detectorConfigurationEvidence, captureQualityVariability: output.captureQualityVariability, detectorLoadTimeline: output.detectorLoadTimeline, methodFingerprint: runContext.methodFingerprint, calibrationProvenance: runContext.calibrationProvenance, specimenContext: runContext.specimenContext, footageProvenance: runContext.footageProvenance, partialCameraCaptureReviewAcknowledgedAt: runContext.partialCameraCaptureReviewAcknowledgedAt, analysisSessionReference: sessionReference, opticsTraceability: runContext.opticsTraceability, acquisitionReadiness: savedReadiness, dosePlan: savedDosePlan ?? runContext.dosePlan }, runContext.calibrationEvidence)),
        calibrationJson: JSON.stringify(runContext.calibration),
        thresholdsJson: JSON.stringify(runContext.thresholds),
        metricsJson: JSON.stringify(output.summary),
        tracksJson: JSON.stringify(output.tracks),
        qualityFlagsJson: JSON.stringify(outputWithProvenance.qualityFlags),
        status: "review_required" as const,
      };
      if (isAuthenticated) {
        await saveAnalysis.mutateAsync(record);
        toast.success("Analysis record saved. Review status remains required.");
      } else {
        toast.info("Analysis ran locally. Sign in to persist the immutable result snapshot and settings.");
      }
    } catch (error) {
      if (isAnalysisCancelledError(error)) {
        setStage("Analysis cancelled — no new result was created.");
        setProgress(0);
        setLiveProgress(undefined);
        setAnalysisRunContext(undefined);
        setAnalysisCancelled(true);
        toast.info("Analysis cancelled before completion. Existing completed results and saved records were not changed.");
        return;
      }
      const message = error instanceof Error ? error.message : "The video could not be analyzed.";
      setStage(message);
      setAnalysisRunContext(undefined);
      toast.error(message);
    } finally {
      videoRef.current?.pause();
      setIsAnalyzing(false);
    }
  };

  const cancelAnalysis = () => {
    if (!isAnalyzing) return;
    cancelAnalysisRef.current = true;
    setStage("Cancelling local analysis…");
  };

  const downloadSummary = () => {
    if (!analysis) return;
    const context = analysisRunContext ?? createBrowserLocalAnalysisRunContext({ sourceUrl, source: sourceType, fileName, sampleName, species, calibration, thresholds, calibrationEvidence, footageProvenance, specimenContext, opticsTraceability, dosePlan });
    const contextDosePlan = calculateDosePlan(context.dosePlan);
    const summary = analysis.summary;
    const report = [
      "SEMENSCOPE — RESEARCH-USE ANALYSIS SUMMARY",
      "Scientific method disclaimer: Automated trajectory estimates are not a diagnostic, fertility, breeding, or treatment decision. Review calibration, species-specific protocols, image quality, and individual tracks before use.",
      "",
      `Sample: ${context.sampleName}`,
      `Species: ${context.species}`,
      `Source: ${context.source}`,
      `File: ${context.fileName}`,
      buildFootageProvenanceSummaryLine(context.footageProvenance),
      `Partial camera capture technical-review acknowledgement: ${context.footageProvenance.recordingStopReason === "stream_ended" ? context.partialCameraCaptureReviewAcknowledgedAt || "not recorded" : "not required"}`,
      `Browser-local analysis session reference: ${analysisSessionReference || "not recorded"}`,
      `Session-reference safeguard: ${ANALYSIS_SESSION_REFERENCE_NOTICE}`,
      `Acquisition: ${metadata.width} × ${metadata.height}; ${formatDuration(metadata.duration)}; assumed ${context.calibration.frameRate} fps`,
      `Calibration: ${context.calibration.micronsPerPixel} µm/px`,
      `Calibration provenance: ${context.calibrationProvenance}`,
      `Method fingerprint: ${context.methodFingerprint}`,
      context.calibrationEvidence ? `Calibration board: ${context.calibrationEvidence.boardIntervalMicrons} µm / ${roundMetric(context.calibrationEvidence.pixelDistance)} px (${context.calibrationEvidence.method})` : "Calibration board: no board evidence recorded",
      `Capture-quality status: ${analysis.captureQuality.status}`,
      `Capture-quality rationale: ${analysis.captureQuality.rationale}`,
      `Field-stability status: ${analysis.fieldStability.status}`,
      `Field-stability rationale: ${analysis.fieldStability.rationale}`,
      `Association confidence: ${analysis.confidenceDistribution.atOrAboveThreshold} retained / ${analysis.confidenceDistribution.total} eligible at threshold ${context.thresholds.minTrackConfidence}; mean ${roundMetric(analysis.confidenceDistribution.mean, 3)}`,
      `Temporal sampling: ${analysis.temporalSampling.processedFrames} processed / ${analysis.temporalSampling.availableFrames} available frames (${roundMetric(analysis.temporalSampling.processedPercent)}%); every ${analysis.temporalSampling.frameStep} frame (${roundMetric(analysis.temporalSampling.samplingIntervalSeconds, 3)} s interval)`,
      `Classification composition: ${analysis.classificationComposition.progressive} progressive; ${analysis.classificationComposition.motileNonProgressive} motile non-progressive; ${analysis.classificationComposition.nonMotile} non-motile of ${analysis.classificationComposition.total} accepted tracks`,
      `Accepted-track duration: mean ${roundMetric(analysis.trackDurationEvidence.meanFrames, 1)} frames; shortest ${analysis.trackDurationEvidence.shortestFrames}; longest ${analysis.trackDurationEvidence.longestFrames}`,
      `Track metric ranges: VCL ${roundMetric(analysis.trackMetricRangeEvidence.vcl.minimum, 1)}–${roundMetric(analysis.trackMetricRangeEvidence.vcl.maximum, 1)} µm/s (median ${roundMetric(analysis.trackMetricRangeEvidence.vcl.median, 1)}); LIN ${roundMetric(analysis.trackMetricRangeEvidence.lin.minimum, 1)}–${roundMetric(analysis.trackMetricRangeEvidence.lin.maximum, 1)}% (median ${roundMetric(analysis.trackMetricRangeEvidence.lin.median, 1)}); numerical candidate tracks: ${[...analysis.trackMetricRangeEvidence.vcl.outlierTrackIds, ...analysis.trackMetricRangeEvidence.lin.outlierTrackIds, ...analysis.trackMetricRangeEvidence.confidence.outlierTrackIds].filter((id, index, values) => values.indexOf(id) === index).join(", ") || "none"}`,
      `Track linkage continuity: ${roundMetric(analysis.trackLinkageContinuity.continuityPercent, 1)}% nominal-cadence links; ${analysis.trackLinkageContinuity.gapSpanningSegments} gap-spanning links across ${analysis.trackLinkageContinuity.tracksWithGaps} tracks; maximum ${analysis.trackLinkageContinuity.maxSkippedFramesInSegment} skipped frames in a retained segment`,
      "Linkage continuity safeguard: this is technical association provenance only; it does not remove or reclassify trajectories, change kinematics, or infer biological outcomes.",
      `Trajectory-integrity scorecard: ${analysis.trajectoryIntegrity.summaryLine}; attention items: ${analysis.trajectoryIntegrity.attentionItems.join("; ") || "none recorded"}`,
      `Trajectory-integrity safeguard: ${analysis.trajectoryIntegrity.safeguard}`,
      `Trajectory spatial coverage: ${analysis.trajectorySpatialCoverage.occupiedCells}/${analysis.trajectorySpatialCoverage.totalCells} image regions occupied by retained-track centroids; largest-region share ${roundMetric(analysis.trajectorySpatialCoverage.maxCellTrackSharePercent, 1)}%; ${analysis.trajectorySpatialCoverage.edgeCellTracks} edge-region centroids`,
      "Spatial-coverage safeguard: this is technical image-region context only; it is not a specimen concentration or density estimate and does not modify trajectories or infer biological outcomes.",
      `Field-boundary contact: ${roundMetric(analysis.fieldBoundaryContact.boundaryPointPercent, 1)}% of retained points in the outer ${analysis.fieldBoundaryContact.boundaryZonePercent}% image zone; ${analysis.fieldBoundaryContact.tracksWithBoundaryPoints} tracks with boundary points; ${analysis.fieldBoundaryContact.tracksStartingInBoundary} starts and ${analysis.fieldBoundaryContact.tracksEndingInBoundary} ends in that zone`,
      "Boundary-contact safeguard: this is technical image-boundary context only; it does not reject trajectories, alter quality flags, change measurements or classifications, or infer biological outcomes.",
      `Trajectory temporal placement: ${analysis.trajectoryTemporalPlacement.tracksStartingAtWindowBoundary} retained tracks start at the first sampled frame; ${analysis.trajectoryTemporalPlacement.tracksEndingAtWindowBoundary} end at the final sampled frame; ${analysis.trajectoryTemporalPlacement.tracksSpanningEntireWindow} span the sampled window`,
      "Temporal-placement safeguard: this is technical sampled-window provenance only; it does not establish biological starts or ends and does not modify trajectories, measurements, or classifications.",
      `Track directional balance: dominant ${analysis.trackDirectionalBalance.dominantOctant} image-coordinate octant (${roundMetric(analysis.trackDirectionalBalance.dominantOctantSharePercent, 1)}% of ${analysis.trackDirectionalBalance.resolvedDirectionTracks} resolved first-to-last track directions); ${analysis.trackDirectionalBalance.unresolvedDirectionTracks} below the net-displacement threshold`,
      "Directional-balance safeguard: this is technical image-coordinate context only; it is not motion compensation, does not alter tracks or classifications, and does not infer specimen behavior or biological outcomes.",
      `Output fingerprint: ${analysis.outputFingerprint}`,
      "Output-fingerprint safeguard: this deterministic browser-local checksum supports repeatability review only; it is not a cryptographic signature, tamper-proof record, diagnostic result, or biological interpretation.",
      `Candidate-detection load: ${analysis.candidateDetectionLoad.totalCandidates} candidates across ${analysis.candidateDetectionLoad.processedFrames} sampled frames; mean ${roundMetric(analysis.candidateDetectionLoad.meanCandidatesPerFrame, 1)} per frame; peak ${analysis.candidateDetectionLoad.peakCandidatesInFrame}/${analysis.candidateDetectionLoad.candidateLimitPerFrame}; ${analysis.candidateDetectionLoad.framesAtCandidateLimit} cap-bound sampled frames; ${roundMetric(analysis.candidateDetectionLoad.frameCoveragePercent, 1)}% frames with candidates`,
      "Candidate-load safeguard: this is technical detector workload and selection-cap context only; it is not a concentration or cell-count estimate and does not alter candidates, trajectories, classifications, or biological interpretation.",
      `Candidate-score distribution: ${analysis.candidateScoreDistribution.candidateCount} selected candidate scores; mean ${roundMetric(analysis.candidateScoreDistribution.meanScore, 1)}; median ${roundMetric(analysis.candidateScoreDistribution.medianScore, 1)}; range ${roundMetric(analysis.candidateScoreDistribution.minimumScore, 1)}–${roundMetric(analysis.candidateScoreDistribution.maximumScore, 1)}`,
      "Candidate-score safeguard: this is technical detector-score context only; it does not add, remove, re-rank, or alter candidates, trajectories, classifications, or biological interpretation.",
      `Processing performance: ${roundMetric(analysis.processingPerformance.elapsedMilliseconds, 0)} ms browser-local review loop for ${analysis.processingPerformance.processedFrames} sampled frames; mean ${roundMetric(analysis.processingPerformance.meanMillisecondsPerFrame, 1)} ms per sampled frame; ${roundMetric(analysis.processingPerformance.processedFramesPerSecond, 1)} sampled frames per second`,
      "Processing-performance safeguard: this is local execution timing context only; it does not change sampling, candidates, trajectories, metrics, classifications, or biological interpretation.",
      `Analysis scaling: ${analysis.analysisScalingEvidence.sourceWidth}×${analysis.analysisScalingEvidence.sourceHeight} source pixels → ${analysis.analysisScalingEvidence.workingCanvasWidth}×${analysis.analysisScalingEvidence.workingCanvasHeight} browser-local canvas; ${roundMetric(analysis.analysisScalingEvidence.sourcePixelsPerWorkingPixelX, 3)}× horizontal and ${roundMetric(analysis.analysisScalingEvidence.sourcePixelsPerWorkingPixelY, 3)}× vertical source pixels per working pixel; ${analysis.analysisScalingEvidence.wasDownscaled ? "downscaled" : "native canvas"}`,
      "Analysis-scaling safeguard: this is technical canvas provenance only; it does not modify source frames, candidates, trajectories, metrics, classifications, or biological interpretation.",
      `Detector configuration: ${analysis.detectorConfigurationEvidence.samplingStridePx}px sampling stride; darkness threshold ${roundMetric(analysis.detectorConfigurationEvidence.darknessThreshold, 2)}; contrast threshold ${roundMetric(analysis.detectorConfigurationEvidence.contrastThreshold, 2)}; selection cap ${analysis.detectorConfigurationEvidence.candidateLimitPerFrame} candidates per sampled frame`,
      "Detector-configuration safeguard: this is technical configuration provenance only; it does not change detection, candidates, trajectories, metrics, classifications, or biological interpretation.",
      `Capture-quality variability: ${analysis.captureQualityVariability.sampledFrames} sampled frames; brightness SD ${roundMetric(analysis.captureQualityVariability.brightnessStandardDeviation, 2)}; contrast SD ${roundMetric(analysis.captureQualityVariability.contrastStandardDeviation, 2)}; focus SD ${roundMetric(analysis.captureQualityVariability.focusStandardDeviation, 2)}`,
      "Capture-quality variability safeguard: this is technical frame-quality context only; it does not modify frames, candidates, trajectories, metrics, classifications, or biological interpretation.",
      `Detector-load timeline: ${analysis.detectorLoadTimeline.sampledFrames} chronological samples; peak ${analysis.detectorLoadTimeline.peakCandidates} candidates at frame ${analysis.detectorLoadTimeline.peakFrame ?? "not recorded"}; ${analysis.detectorLoadTimeline.capBoundSamples} samples at the ${analysis.detectorLoadTimeline.candidateLimitPerFrame}-candidate selection cap`,
      "Detector-load timeline safeguard: this is chronological detector workload context only; it does not change candidates, trajectories, metrics, classifications, or biological interpretation.",
      `Specimen ID: ${context.specimenContext.specimenId || "not recorded"}`,
      `Donor / animal ID: ${context.specimenContext.donorId || "not recorded"}`,
      `Collection reference: ${context.specimenContext.collectionReference || "not recorded"}`,
      `Collection time (operator-entered): ${context.specimenContext.collectionDateTime || "not recorded"}`,
      `Chamber reference: ${context.specimenContext.chamberReference || "not recorded"}`,
      `Preparation protocol reference: ${context.specimenContext.preparationProtocolReference || "not recorded"}`,
      `Objective magnification (operator-entered): ${formatOpticsMagnification(context.opticsTraceability.objectiveMagnification)}`,
      `Chamber depth (operator-entered): ${formatChamberDepthMicrons(context.opticsTraceability.chamberDepthMicrons)}`,
      `Analyst note: ${context.specimenContext.analystNote || "not recorded"}`,
      contextDosePlan ? `Planning-only theoretical doses: ${roundMetric(contextDosePlan.theoreticalDoseCount, 1)} from entered ${contextDosePlan.measuredConcentrationMillionsPerMl} M/mL × ${contextDosePlan.availableVolumeMl} mL at ${contextDosePlan.targetSpermMillionsPerDose} M/dose` : "Planning-only theoretical doses: no complete operator-entered inputs",
      "",
      "SUMMARY METRICS",
      `Total tracked cells: ${summary.totalTrackedCells}`,
      `Valid tracks: ${summary.validTracks}`,
      `Total motility: ${roundMetric(summary.motility)} %`,
      `Progressive motility: ${roundMetric(summary.progressiveMotility)} %`,
      `VCL: ${roundMetric(summary.vcl)} µm/s`,
      `VSL: ${roundMetric(summary.vsl)} µm/s`,
      `VAP: ${roundMetric(summary.vap)} µm/s`,
      `LIN: ${roundMetric(summary.lin)} %`,
      `STR: ${roundMetric(summary.str)} %`,
      `WOB: ${roundMetric(summary.wob)} %`,
      `ALH: ${roundMetric(summary.alh)} µm`,
      `BCF: ${roundMetric(summary.bcf)} Hz`,
      `DANCE: ${roundMetric(summary.dance)} µm²/s`,
      `MAD: ${roundMetric(summary.mad)}°`,
      `ALH maximum: ${roundMetric(summary.alhMax)} µm`,
      `Trajectory fractal dimension: ${roundMetric(summary.fractalDimension, 2)}`,
      `Mean link confidence: ${roundMetric(summary.meanConfidence, 2)}`,
      `VSL/VAP motility criterion: ${roundMetric(summary.vslVapMotility)} %`,
      "",
      "METHOD SNAPSHOT",
      "Association: motion-aware weighted direction, distance, and speed score",
      `VAP smoothing window: ${context.thresholds.vapSmoothingWindow} frames`,
      `Track occlusion tolerance: ${context.thresholds.maxMissedFrames} missing frames`,
      `Minimum association confidence: ${context.thresholds.minTrackConfidence}`,
      "",
      "QUALITY FLAGS",
      ...analysis.qualityFlags.map(flag => `• ${flag}`),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([report], { type: "text/plain" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${context.sampleName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-analysis-summary.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const downloadMethodManifest = () => {
    if (!analysis) return;
    const context = analysisRunContext ?? createBrowserLocalAnalysisRunContext({ sourceUrl, source: sourceType, fileName, sampleName, species, calibration, thresholds, calibrationEvidence, footageProvenance, specimenContext, opticsTraceability, dosePlan });
    const contextDosePlan = calculateDosePlan(context.dosePlan);
    const manifest = {
      schema: "semenscope.analysis-manifest.v1",
      generatedAt: new Date().toISOString(),
      scientificUse: "Automated estimates for laboratory review only; not a diagnostic, fertility, breeding, or treatment decision.",
      analysisSessionReferenceNotice: ANALYSIS_SESSION_REFERENCE_NOTICE,
      sample: { name: context.sampleName, species: context.species, source: context.source, fileName: context.fileName, specimenContext: context.specimenContext, footageProvenance: context.footageProvenance, partialCameraCaptureReviewAcknowledgedAt: context.partialCameraCaptureReviewAcknowledgedAt, analysisSessionReference, opticsTraceability: context.opticsTraceability },
      acquisition: attachCalibrationEvidence({ ...metadata, calibration: context.calibration, calibrationProvenance: context.calibrationProvenance }, context.calibrationEvidence),
      method: {
        detector: "contrast-aware local-minima candidate detection",
        tracker: "motion-aware weighted direction, distance, and speed association",
        casa: "calibrated VCL, VSL, VAP, LIN, STR, WOB, ALH, BCF, DANCE, MAD with configurable smoothing",
        thresholds: context.thresholds,
        fingerprint: context.methodFingerprint,
      },
      output: { summary: analysis.summary, qualityFlags: analysis.qualityFlags, trackedCells: analysis.tracks.length },
      captureQuality: analysis.captureQuality,
      fieldStability: analysis.fieldStability,
      confidenceDistribution: analysis.confidenceDistribution,
      temporalSampling: analysis.temporalSampling,
      classificationComposition: analysis.classificationComposition,
      trackDurationEvidence: analysis.trackDurationEvidence,
      trackMetricRangeEvidence: analysis.trackMetricRangeEvidence,
      trackLinkageContinuity: analysis.trackLinkageContinuity,
      trackLinkageContinuityNotice: "Technical association provenance only; does not remove or reclassify trajectories, change kinematics, or infer biological outcomes.",
      trajectorySpatialCoverage: analysis.trajectorySpatialCoverage,
      trajectorySpatialCoverageNotice: "Technical image-region context only; not a specimen concentration or density estimate and does not modify trajectories or infer biological outcomes.",
      fieldBoundaryContact: analysis.fieldBoundaryContact,
      fieldBoundaryContactNotice: "Technical image-boundary context only; does not reject trajectories, alter quality flags, change measurements or classifications, or infer biological outcomes.",
      trajectoryTemporalPlacement: analysis.trajectoryTemporalPlacement,
      trajectoryTemporalPlacementNotice: "Technical sampled-window provenance only; does not establish biological starts or ends and does not modify trajectories, measurements, or classifications.",
      trackDirectionalBalance: analysis.trackDirectionalBalance,
      trackDirectionalBalanceNotice: "Technical image-coordinate context only; not motion compensation, does not alter tracks or classifications, and does not infer specimen behavior or biological outcomes.",
      trajectoryIntegrity: analysis.trajectoryIntegrity,
      trajectoryIntegrityNotice: analysis.trajectoryIntegrity.safeguard,
      outputFingerprint: analysis.outputFingerprint,
      outputFingerprintNotice: "Deterministic browser-local checksum for repeatability review only; not a cryptographic signature, tamper-proof record, diagnostic result, or biological interpretation.",
      candidateDetectionLoad: analysis.candidateDetectionLoad,
      candidateDetectionLoadNotice: "Technical detector workload and selection-cap context only; not a concentration or cell-count estimate and does not alter candidates, trajectories, classifications, or biological interpretation.",
      candidateScoreDistribution: analysis.candidateScoreDistribution,
      candidateScoreDistributionNotice: "Technical detector-score context only; does not add, remove, re-rank, or alter candidates, trajectories, classifications, or biological interpretation.",
      processingPerformance: analysis.processingPerformance,
      processingPerformanceNotice: "Local execution timing context only; does not change sampling, candidates, trajectories, metrics, classifications, or biological interpretation.",
      analysisScalingEvidence: analysis.analysisScalingEvidence,
      analysisScalingEvidenceNotice: "Technical canvas provenance only; does not modify source frames, candidates, trajectories, metrics, classifications, or biological interpretation.",
      detectorConfigurationEvidence: analysis.detectorConfigurationEvidence,
      detectorConfigurationEvidenceNotice: "Technical configuration provenance only; does not change detection, candidates, trajectories, metrics, classifications, or biological interpretation.",
      captureQualityVariability: analysis.captureQualityVariability,
      captureQualityVariabilityNotice: "Technical frame-quality context only; does not modify frames, candidates, trajectories, metrics, classifications, or biological interpretation.",
      detectorLoadTimeline: analysis.detectorLoadTimeline,
      detectorLoadTimelineNotice: "Chronological detector workload context only; does not change candidates, trajectories, metrics, classifications, or biological interpretation.",
      acquisitionReadiness: buildAcquisitionReadiness({ specimenContext: context.specimenContext, calibrationEvidence: context.calibrationEvidence, width: metadata.width, height: metadata.height, frameRate: metadata.frameRate, captureQuality: analysis.captureQuality }),
      dosePlan: contextDosePlan ?? context.dosePlan,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${context.sampleName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-method-manifest.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const downloadTrajectoryCoordinates = () => {
    if (!analysis) return;
    const context = analysisRunContext ?? createBrowserLocalAnalysisRunContext({ sourceUrl, source: sourceType, fileName, sampleName, species, calibration, thresholds, calibrationEvidence, footageProvenance, specimenContext, opticsTraceability, dosePlan });
    const csv = buildTrajectoryCoordinateCsv({ sampleName: context.sampleName, species: context.species, source: context.source, calibration: context.calibration, thresholds: context.thresholds, calibrationEvidence: context.calibrationEvidence, outputFingerprint: analysis.outputFingerprint, trajectoryIntegrity: analysis.trajectoryIntegrity, tracks: analysis.tracks });
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${context.sampleName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-trajectory-coordinates.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const downloadSelectedTrajectory = () => {
    if (!analysis || !selectedTrack) return;
    const context = analysisRunContext ?? createBrowserLocalAnalysisRunContext({ sourceUrl, source: sourceType, fileName, sampleName, species, calibration, thresholds, calibrationEvidence, footageProvenance, specimenContext, opticsTraceability, dosePlan });
    const csv = buildTrajectoryCoordinateCsv({ sampleName: context.sampleName, species: context.species, source: context.source, calibration: context.calibration, thresholds: context.thresholds, calibrationEvidence: context.calibrationEvidence, outputFingerprint: analysis.outputFingerprint, trajectoryIntegrity: analysis.trajectoryIntegrity, tracks: [selectedTrack] });
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = buildSelectedTrajectoryCsvFilename(context.sampleName, selectedTrack.id);
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const downloadDetectorLoadTimeline = () => {
    if (!analysis) return;
    const context = analysisRunContext ?? createBrowserLocalAnalysisRunContext({ sourceUrl, source: sourceType, fileName, sampleName, species, calibration, thresholds, calibrationEvidence, footageProvenance, specimenContext, opticsTraceability, dosePlan });
    const csv = buildDetectorLoadTimelineCsv({ sampleName: context.sampleName, species: context.species, source: context.source, calibration: context.calibration, outputFingerprint: analysis.outputFingerprint, timeline: analysis.detectorLoadTimeline });
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${context.sampleName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-detector-load-timeline.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const downloadCandidateScoreDistribution = () => {
    if (!analysis) return;
    const context = analysisRunContext ?? createBrowserLocalAnalysisRunContext({ sourceUrl, source: sourceType, fileName, sampleName, species, calibration, thresholds, calibrationEvidence, footageProvenance, specimenContext, opticsTraceability, dosePlan });
    const csv = buildCandidateScoreDistributionCsv({ sampleName: context.sampleName, species: context.species, source: context.source, calibration: context.calibration, outputFingerprint: analysis.outputFingerprint, distribution: analysis.candidateScoreDistribution });
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${context.sampleName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-candidate-score-summary.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const downloadMultiFieldReview = () => {
    if (!multiFieldResults.length) return;
    const csv = buildMultiFieldReviewCsv({ fields: multiFieldResults, sameSpecimenConfirmed });
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "semenscope-multi-field-technical-review.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const downloadCurrentFramePng = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const frameTime = video.currentTime;
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = buildCurrentFramePngFilename(sampleName, frameTime);
      anchor.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  const downloadTrajectoryMapPng = () => {
    if (!analysis) return;
    const svg = document.querySelector<SVGSVGElement>(".map-canvas svg.trajectory-map");
    if (!svg) return;
    const svgSource = new XMLSerializer().serializeToString(svg);
    const svgUrl = URL.createObjectURL(new Blob([svgSource], { type: "image/svg+xml;charset=utf-8" }));
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(metadata.width));
      canvas.height = Math.max(1, Math.round(metadata.height));
      const context = canvas.getContext("2d");
      if (!context) { URL.revokeObjectURL(svgUrl); return; }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(svgUrl);
      canvas.toBlob(blob => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = buildTrajectoryMapPngFilename(analysisRunContext?.sampleName || sampleName);
        anchor.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    };
    image.onerror = () => URL.revokeObjectURL(svgUrl);
    image.src = svgUrl;
  };

  const copyCurrentRunTechnicalSummary = async () => {
    if (!analysis) return;
    const context = analysisRunContext ?? createBrowserLocalAnalysisRunContext({ sourceUrl, source: sourceType, fileName, sampleName, species, calibration, thresholds, calibrationEvidence, footageProvenance, specimenContext, opticsTraceability, dosePlan });
    const text = buildCurrentRunTechnicalCopyText({
      sampleName: context.sampleName,
      species: context.species,
      source: context.source,
      methodFingerprint: context.methodFingerprint,
      outputFingerprint: analysis.outputFingerprint,
      trajectoryIntegritySummary: analysis.trajectoryIntegrity.summaryLine,
      trajectoryIntegrityAttentionItems: analysis.trajectoryIntegrity.attentionItems,
      detectorLoadSummary: `${analysis.detectorLoadTimeline.sampledFrames} samples; peak ${analysis.detectorLoadTimeline.peakCandidates} at frame ${analysis.detectorLoadTimeline.peakFrame ?? "not recorded"}; ${analysis.detectorLoadTimeline.capBoundSamples} cap-bound`,
      candidateScoreSummary: `${analysis.candidateScoreDistribution.candidateCount} selected scores; median ${roundMetric(analysis.candidateScoreDistribution.medianScore, 1)}; range ${roundMetric(analysis.candidateScoreDistribution.minimumScore, 1)}–${roundMetric(analysis.candidateScoreDistribution.maximumScore, 1)}`,
    });
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Current-run technical summary copied locally for reviewer transfer.");
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const copied = document.execCommand("copy");
      area.remove();
      copied ? toast.success("Current-run technical summary copied locally for reviewer transfer.") : toast.error("Could not copy the technical summary. Download the summary instead.");
    }
  };

  const updateThreshold = (key: keyof CasaThresholds, value: number) => setThresholds(current => ({ ...current, [key]: value }));
  const closeSidebarAfterMobileNavigation = () => {
    if (typeof window !== "undefined" && window.innerWidth <= 900) setSidebarOpen(false);
  };

  const mobileSidebarClosed = typeof window !== "undefined" && window.innerWidth <= 900 && !sidebarOpen;
  const cameraAcquisitionLocked = recording || preCaptureRemainingSeconds > 0 || isAnalyzing;
  const temporarySessionResetLocked = cameraAcquisitionLocked;
  const temporarySessionResetLockMessage = recording ? "Temporary session reset is locked while local camera recording is active." : preCaptureRemainingSeconds ? "Temporary session reset is locked while a local camera stabilization delay is active." : "Temporary session reset is locked while local analysis is active.";
  const sourceStagingLocked = isAnalyzing || recording || preCaptureRemainingSeconds > 0;
  const partialCameraCaptureReviewRequired = requiresPartialCameraCaptureAcknowledgement(footageProvenance, partialCameraCaptureAcknowledged, partialCameraCaptureReviewMethodFingerprint, methodFingerprint);
  const partialCameraCaptureReviewInvalidated = footageProvenance.recordingStopReason === "stream_ended" && partialCameraCaptureAcknowledged && partialCameraCaptureReviewMethodFingerprint !== methodFingerprint;
  const partialCameraCaptureReviewAcknowledged = footageProvenance.recordingStopReason === "stream_ended" && Boolean(partialCameraCaptureReviewAcknowledgedAt) && !partialCameraCaptureReviewInvalidated;
  const runAnalysisDisabledReason = getRunAnalysisDisabledReason({ recording, partialCameraCaptureReviewRequired, mediaError });
  return (
    <div className="lab-shell">
      <aside ref={sidebarRef} id="laboratory-navigation" className={`lab-sidebar ${sidebarOpen ? "is-open" : ""}`} aria-hidden={mobileSidebarClosed || undefined} inert={mobileSidebarClosed}>
        <div className="brand-lockup">
          <div className="brand-mark"><Aperture size={20} /></div>
          <div><span>SEMENSCOPE</span><small>ANIMAL REPRODUCTION LAB</small></div>
          <button ref={sidebarDismissRef} className="sidebar-dismiss" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X size={17} /></button>
        </div>
        <nav className="lab-nav" aria-label="Laboratory navigation">
          <button className={activeView === "workspace" ? "active" : ""} onClick={() => { selectDashboardView("workspace"); closeSidebarAfterMobileNavigation(); }}><FlaskConical size={17} />Analysis workspace</button>
          <button className={activeView === "audit" ? "active" : ""} onClick={() => { selectDashboardView("audit"); closeSidebarAfterMobileNavigation(); }} disabled={recording} title={recording ? "Stop the active local camera recording before leaving the analysis workspace" : undefined}><ClipboardCheck size={17} />Technical audit</button>
          <button className={activeView === "fields" ? "active" : ""} onClick={() => { selectDashboardView("fields"); closeSidebarAfterMobileNavigation(); }} disabled={recording} title={recording ? "Stop the active local camera recording before leaving the analysis workspace" : undefined}><ClipboardCheck size={17} />Field review <span>{multiFieldResults.length}</span></button>
          <button className={activeView === "history" ? "active" : ""} onClick={() => { openHistoryRecord(); closeSidebarAfterMobileNavigation(); }} disabled={recording} title={recording ? "Stop the active local camera recording before leaving the analysis workspace" : undefined}><History size={17} />Sample history <span>{storedRecords.length}</span></button>
          <button className={activeView === "method" ? "active" : ""} onClick={() => { selectDashboardView("method"); closeSidebarAfterMobileNavigation(); }} disabled={recording} title={recording ? "Stop the active local camera recording before leaving the analysis workspace" : undefined}><SlidersHorizontal size={17} />Method controls</button>
          <button className={activeView === "quality" ? "active" : ""} onClick={() => { openQualityRecord(); closeSidebarAfterMobileNavigation(); }} disabled={recording} title={recording ? "Stop the active local camera recording before leaving the analysis workspace" : undefined}><ShieldCheck size={17} />Quality review</button>
        </nav>
        <div className="sidebar-callout">
          <div className="callout-icon"><ShieldCheck size={16} /></div>
          <strong>Scientific-use guardrail</strong>
          <p>Every automated result remains in <em>review required</em> status until checked against your laboratory protocol.</p>
        </div>
        <div className="sidebar-footer"><span className="status-pulse" />Browser-local processing</div>
      </aside>

      <main className="workspace-main">
        <header className="topbar">
          <button ref={navigationToggleRef} className="nav-toggle" onClick={() => setSidebarOpen(open => !open)} aria-label={sidebarOpen ? "Close navigation" : "Open navigation"} aria-controls="laboratory-navigation" aria-expanded={sidebarOpen}><Aperture size={18} /></button>
          <div className="crumb"><span>Laboratory</span><ChevronRight size={14} /><strong>{activeView === "workspace" ? "Analysis workspace" : activeView === "audit" ? "Technical audit" : activeView === "fields" ? "Field review" : activeView === "history" ? "Sample history" : activeView === "method" ? "Method controls" : "Quality review"}</strong></div>
          <div className="topbar-actions">
            <div className="review-chip"><CircleAlert size={15} />Review required</div>
            {isAuthenticated ? <div className="user-pill"><span>{user?.name?.slice(0, 1).toUpperCase()}</span>{user?.name || "Laboratory user"}</div> : <button className="sign-in" onClick={startLogin}>Sign in to save</button>}
          </div>
        </header>

        <div className="workspace-content">
          {activeView === "workspace" ? <>
          <section className="hero-row">
            <div>
              <p className="eyebrow">CASA-STYLE ANALYSIS · BROWSER WORKSPACE</p>
              <h1>Clear, traceable semen <em>motion analysis.</em></h1>
              <p className="hero-copy">Upload microscope footage or capture a short camera clip into the same calibrated workspace. Outputs are automated estimates inspired by OpenCASA kinematic concepts and must be reviewed within your species-specific protocol.</p>
            </div>
            <div className="method-note"><Info size={18} /><p><strong>Scientific-method disclaimer.</strong> This tool is not a diagnostic device and does not determine fertility, breeding suitability, or treatment. Verify calibration, sample handling, optics, and individual tracks before use.</p></div>
          </section>

          <MetricStrip summary={analysis?.summary} />

          <section className="workspace-grid">
            <div className="workspace-primary">
              <div className="panel viewer-panel">
                <div className="panel-heading">
                  <div><p className="eyebrow">ACTIVE FOOTAGE</p><h2>{sampleName || "No footage selected"}</h2></div>
                  <div className="source-badge"><FileVideo size={15} />{sourceType === "camera" ? "Camera capture" : sourceType === "upload" ? "Local upload" : "Reference sample"}</div>
                </div>
                <div className="video-stage">
                  <video ref={videoRef} src={sourceUrl} poster={sourceType === "reference" ? REFERENCE_POSTERS[activeSample.id] : undefined} controls muted playsInline crossOrigin="anonymous" className="analysis-video" onLoadedMetadata={event => setMetadata({ width: event.currentTarget.videoWidth, height: event.currentTarget.videoHeight, duration: event.currentTarget.duration, frameRate: calibration.frameRate, frameCount: Math.max(1, Math.round(event.currentTarget.duration * calibration.frameRate)) })} />
                  {(analysis || (isAnalyzing && liveProgress)) && <TrackCanvas tracks={visibleTracks} candidates={isAnalyzing ? liveProgress?.candidatePoints : []} selectedTrackId={selectedTrack?.id} onSelectTrack={selectTrajectory} trailLength={thresholds.visualTrailLength} width={metadata.width} height={metadata.height} mode="overlay" />}
                  {isAnalyzing && liveProgress && <div className="live-analysis-overlay"><div className="live-scan-indicator"><Activity size={16} /><span>LIVE ANALYSIS</span></div><strong>Frame {liveProgress.processedFrames} / {liveProgress.totalFrames}</strong><small>{liveProgress.candidates} candidates · {liveProgress.activeTracks} active tracks · click a colored path to inspect</small>{liveProgress.frameQuality && <span className={`capture-quality-chip ${liveProgress.frameQuality.status}`}>Capture {liveProgress.frameQuality.status} · focus {roundMetric(liveProgress.frameQuality.focus)}</span>}<div className="live-frame-progress"><i style={{ width: `${(liveProgress.processedFrames / Math.max(1, liveProgress.totalFrames)) * 100}%` }} /></div></div>}
                  {selectedTrack && <div className="trajectory-inspector"><button onClick={() => setSelectedTrack(undefined)} aria-label="Close trajectory inspector"><X size={15} /></button><p>SELECTED TRAJECTORY</p><h3><i style={{ background: selectedTrack.color }} />{selectedTrack.id}</h3><span className={`classification ${selectedTrack.metrics.progressive ? "progressive" : selectedTrack.metrics.motile ? "motile" : "static"}`}>{selectedTrack.metrics.progressive ? "Progressive" : selectedTrack.metrics.motile ? "Motile" : "Non-motile"}</span><div className="trajectory-metric-grid"><span>Frames<strong>{selectedTrack.metrics.frames}</strong></span><span>Confidence<strong>{roundMetric(selectedTrack.metrics.confidence, 2)}</strong></span><span>VCL<strong>{roundMetric(selectedTrack.metrics.vcl)} <small>µm/s</small></strong></span><span>VSL<strong>{roundMetric(selectedTrack.metrics.vsl)} <small>µm/s</small></strong></span><span>VAP<strong>{roundMetric(selectedTrack.metrics.vap)} <small>µm/s</small></strong></span><span>LIN<strong>{roundMetric(selectedTrack.metrics.lin)} <small>%</small></strong></span><span>STR<strong>{roundMetric(selectedTrack.metrics.str)} <small>%</small></strong></span><span>ALH max<strong>{roundMetric(selectedTrack.metrics.alhMax)} <small>µm</small></strong></span><span>Path FD<strong>{roundMetric(selectedTrack.metrics.fractalDimension, 2)}</strong></span><span>BCF<strong>{roundMetric(selectedTrack.metrics.bcf)} <small>Hz</small></strong></span></div><em>{isAnalyzing ? "Interim values update as frames are linked." : analysis?.tracks.some(track => track.id === selectedTrack.id) ? "Final linked-track values." : "Last observed interim values."}</em></div>}
                  {!analysis && !isAnalyzing && !mediaError && <div className="analysis-idle"><div className="scan-reticle" /><span>Set calibration, then run analysis</span></div>}
                  {mediaError && <div className="media-error-overlay"><CircleAlert size={20} /><strong>Video unavailable for analysis</strong><span>{mediaError}</span><button onClick={() => chooseReference(REFERENCE_SAMPLES[2])}>Use compatible reference field 03</button></div>}
	                </div>
	                <p className="keyboard-review-hint" data-testid="keyboard-review-hint"><kbd>[</kbd> previous configured frame <span>·</span> <kbd>]</kbd> next configured frame</p>
	                <div className="viewer-footer"><span><Activity size={14} />{isAnalyzing && liveProgress ? `${liveProgress.activeTracks} live tracks` : analysis ? `${analysis.tracks.length} valid linked tracks` : "No computed tracks"}</span><span><Video size={14} />{metadata.width} × {metadata.height}</span><span>{isAnalyzing && liveProgress ? `${liveProgress.playbackTime.toFixed(2)} s sync` : `${formatDuration(metadata.duration)} · ${calibration.frameRate} fps`}</span><div className="viewer-frame-controls" aria-label="Browser-local frame review"><button type="button" onClick={() => stepReviewFrame(-1)} disabled={isAnalyzing || Boolean(mediaError) || !metadata.width} title="Move the local preview back by one configured frame. Keyboard shortcut: [. This is review-only and does not change analysis output.">Previous frame</button><button type="button" onClick={() => stepReviewFrame(1)} disabled={isAnalyzing || Boolean(mediaError) || !metadata.width} title="Move the local preview forward by one configured frame. Keyboard shortcut: ]. This is review-only and does not change analysis output.">Next frame</button><label className="review-bookmark-label">Jump to time<input value={reviewSeekTime} onChange={event => setReviewSeekTime(event.target.value)} type="number" min="0" step="0.001" aria-label="Browser-local technical review timestamp in seconds" disabled={isAnalyzing || Boolean(mediaError) || !metadata.width} /></label><button type="button" onClick={seekReviewTimestamp} disabled={isAnalyzing || Boolean(mediaError) || !metadata.width} title="Seek to the nearest configured frame at this local review timestamp. This is review-only and does not change analysis output.">Go to time</button><button type="button" onClick={setTechnicalReviewWindowStart} disabled={isAnalyzing || Boolean(mediaError) || !metadata.width} title="Mark the current configured frame as the local technical review-window start. This does not change analysis output.">Set window start</button><button type="button" onClick={setTechnicalReviewWindowEnd} disabled={isAnalyzing || Boolean(mediaError) || !metadata.width || !technicalReviewWindow} title="Mark a later configured frame as the local technical review-window end. This does not change analysis output.">Set window end</button><label className="review-bookmark-label">Bookmark label<input value={reviewBookmarkOperatorLabel} onChange={event => setReviewBookmarkOperatorLabel(event.target.value)} maxLength={80} placeholder="Optional local technical note" aria-label="Optional local technical bookmark label" disabled={isAnalyzing || Boolean(mediaError) || !metadata.width} /></label><button type="button" onClick={addCurrentReviewBookmark} disabled={isAnalyzing || Boolean(mediaError) || !metadata.width} title="Bookmark the current local frame for technical review. Labels and bookmarks remain only in this browser and are not saved with analysis output.">Mark current frame</button></div><div className="review-playback-controls" role="group" aria-label="Browser-local playback speed">{REVIEW_PLAYBACK_RATES.map(rate => <button key={rate} type="button" aria-pressed={reviewPlaybackRate === rate} onClick={() => setLocalReviewPlaybackRate(rate)} disabled={isAnalyzing || Boolean(mediaError) || !metadata.width} title={`Set local technical review playback to ${rate}×. This does not change analysis output.`}>{rate}×</button>)}</div><button className="viewer-frame-export" type="button" onClick={downloadCurrentFramePng} disabled={Boolean(mediaError) || !metadata.width || !metadata.height} title={CURRENT_FRAME_EXPORT_NOTICE}><Download size={13} />Export current frame PNG</button></div>
                {technicalReviewWindow && <div className="technical-review-window" aria-label="Browser-local technical review window"><span>Technical review window</span><strong>{formatTechnicalReviewWindow(technicalReviewWindow)}</strong><small>Local review context only; it does not change video, calibration, or analysis output.</small><button type="button" aria-pressed={isTechnicalReviewWindowLooping} onClick={toggleTechnicalReviewWindowLoop} disabled={isAnalyzing || technicalReviewWindow.endFrame === undefined}>Loop review window</button><button type="button" onClick={() => seekTechnicalReviewWindowBoundary("start")} disabled={isAnalyzing}>Go to window start</button><button type="button" onClick={() => seekTechnicalReviewWindowBoundary("end")} disabled={isAnalyzing || technicalReviewWindow.endFrame === undefined}>Go to window end</button><button type="button" onClick={downloadTechnicalReviewWindowCsv} title={REVIEW_WINDOW_EXPORT_NOTICE}><Download size={13} />Export window CSV</button><button type="button" onClick={() => { setTechnicalReviewWindow(undefined); setIsTechnicalReviewWindowLooping(false); }} disabled={isAnalyzing}>Clear window</button></div>}
	                {reviewBookmarks.length > 0 && <div className="review-bookmarks" aria-label="Browser-local technical review bookmarks"><div><p className="eyebrow">LOCAL REVIEW BOOKMARKS</p><small>Timestamp references and optional notes remain only in this browser and do not alter analysis output.</small></div><div className="review-bookmark-actions">{reviewBookmarks.map(bookmark => <div className="review-bookmark-item" key={bookmark.id}>{editingReviewBookmarkId === bookmark.id ? <form className="review-bookmark-note-editor" onSubmit={event => { event.preventDefault(); saveReviewBookmarkNote(bookmark); }}><input value={editingReviewBookmarkOperatorLabel} onChange={event => setEditingReviewBookmarkOperatorLabel(event.target.value)} maxLength={80} autoFocus aria-label={`Browser-local technical note for ${bookmark.label}`} /><button type="submit" data-testid={`save-review-bookmark-note-${bookmark.id}`} disabled={isAnalyzing}>Save note</button><button type="button" onClick={() => { setEditingReviewBookmarkId(undefined); setEditingReviewBookmarkOperatorLabel(""); }} disabled={isAnalyzing}>Cancel</button></form> : <><button type="button" onClick={() => seekReviewBookmark(bookmark)}><span>{bookmark.label}</span>{bookmark.operatorLabel && <small>{bookmark.operatorLabel}</small>}</button><button type="button" data-testid={`edit-review-bookmark-${bookmark.id}`} onClick={() => beginReviewBookmarkNoteEdit(bookmark)} disabled={isAnalyzing} title="Edit this browser-local technical note without changing its configured frame or analysis output.">Edit note</button></>}<button type="button" className="review-bookmark-remove" data-testid={`remove-review-bookmark-${bookmark.id}`} onClick={() => removeCurrentReviewBookmark(bookmark)} disabled={isAnalyzing} aria-label={`Remove ${bookmark.label} from local technical review`} title="Remove this browser-local technical review bookmark without changing analysis output."><X size={12} /></button></div>)}<button type="button" onClick={downloadReviewBookmarksCsv} title={REVIEW_BOOKMARK_EXPORT_NOTICE}><Download size={13} />Export bookmarks CSV</button><button type="button" onClick={clearReviewBookmarks} disabled={isAnalyzing}>Clear bookmarks</button></div></div>}
              </div>

              <div className="panel analysis-runner" aria-busy={isAnalyzing}>
                <div className="analysis-status" role="status" aria-live="polite" aria-atomic="true"><p className="eyebrow">PROCESSING STATUS</p><h2>{isAnalyzing || analysisCancelled ? stage : analysis ? "Analysis complete — review required" : partialCameraCaptureReviewRequired ? "Partial camera clip needs technical review" : "Ready for calibrated analysis"}</h2>{analysisRunContext && <p className="analysis-run-context">{isAnalyzing ? "Active run basis locked" : "Completed run basis preserved"} · {analysisRunContext.sampleName} · {analysisRunContext.species} · {analysisRunContext.calibration.micronsPerPixel} µm/px · {analysisRunContext.methodFingerprint}</p>}{isAnalyzing && <p className="analysis-input-lock-note" role="status"><Info size={13} />Sample, method, traceability, and planning inputs are locked until this browser-local run ends.</p>}{partialCameraCaptureReviewRequired && <div className="partial-capture-review-note" role="alert"><AlertTriangle size={14} /><span><strong>{partialCameraCaptureReviewInvalidated ? "Method changed after technical review." : "Partial local camera clip."}</strong>{partialCameraCaptureReviewInvalidated ? " The current method draft differs from the one previously reviewed. Review the partial clip against the revised method, calibration, and thresholds before continuing." : " The active stream ended before the requested capture duration. Review the recorded duration, stop reason, calibration, and footage before continuing."}</span><button type="button" onClick={() => { setPartialCameraCaptureAcknowledged(true); setPartialCameraCaptureReviewAcknowledgedAt(new Date().toISOString()); setPartialCameraCaptureReviewMethodFingerprint(methodFingerprint); }}>Acknowledge technical review</button></div>}{!analysis && !isAnalyzing && partialCameraCaptureReviewAcknowledged && <p className="partial-capture-acknowledged" role="status"><CheckCircle2 size={13} />Technical review acknowledged locally at {formatCaptureTimestamp(partialCameraCaptureReviewAcknowledgedAt)}. This acknowledgement is preserved with a new run’s technical context; it does not confirm footage quality.</p>}{completedRunContextDiffers && <p className="analysis-run-context-mismatch" role="status"><Info size={13} />Current workspace settings differ from this completed run. Review exports retain the preserved run basis; run a new analysis for the current method.</p>}{analysisSessionReference && <p className="analysis-session-reference">{analysisSessionReference}<small>{ANALYSIS_SESSION_REFERENCE_NOTICE}</small></p>}</div>
                <div className="runner-control">
                  {isAnalyzing && <div className="progress-wrap"><div><span>{progress}%</span><small>{stage}</small></div><div className="progress-bar" role="progressbar" aria-label="Browser-local analysis progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} aria-valuetext={`${progress}% — ${stage}`}><i style={{ width: `${progress}%` }} /></div></div>}
                  {isAnalyzing ? <button className="cancel-analysis-action" onClick={cancelAnalysis} aria-keyshortcuts="Escape" title="Cancel this local analysis (Escape)"><X size={18} />Cancel run · Esc</button> : <button ref={runAnalysisButtonRef} className="primary-action" onClick={runAnalysis} disabled={Boolean(runAnalysisDisabledReason)} title={runAnalysisDisabledReason}><Play size={18} fill="currentColor" />Run analysis</button>}
                </div>
              </div>

              <div className="results-grid">
                <div className="panel map-panel">
                  <div className="panel-heading compact"><div><p className="eyebrow">TRAJECTORY MAP</p><h2>Linked motion paths</h2></div><div className="map-panel-actions"><span>{analysis?.tracks.length ?? 0} tracks</span><button className="download-link" type="button" disabled={!analysis} onClick={downloadTrajectoryMapPng} title={TRAJECTORY_MAP_EXPORT_NOTICE}><Download size={14} />Export map PNG</button></div></div>
                  <div className="map-canvas">{analysis ? <TrackCanvas tracks={analysis.tracks} selectedTrackId={selectedTrack?.id} onSelectTrack={selectTrajectory} width={metadata.width} height={metadata.height} mode="map" /> : <div className="empty-canvas"><Activity size={28} /><span>Trajectories appear after analysis</span></div>}</div>
                </div>
                <div className="panel chart-panel">
                  <div className="panel-heading compact"><div><p className="eyebrow">KINEMATIC PROFILE</p><h2>Mean by valid track</h2></div><span>calibrated units</span></div>
                  <MetricChart summary={analysis?.summary} />
                </div>
              </div>

              <div className="panel landscape-panel">
                <div className="panel-heading compact"><div><p className="eyebrow">KINEMATIC LANDSCAPE</p><h2>Speed versus linearity</h2></div><span>{analysis?.tracks.length ?? 0} local tracks</span></div>
                <p className="landscape-intro">Select a point to inspect the existing trajectory details. This is a technical distribution for the current run, not a clustered population or biological-outcome model.</p>
                {analysis ? <KinematicLandscape tracks={analysis.tracks} selectedTrackId={selectedTrack?.id} onSelectTrack={selectTrajectory} /> : <div className="landscape-empty">Run an analysis with valid trajectories to map the current track distribution.</div>}
              </div>

              {analysis && <TechnicalEvidenceNavigator resetKey={analysis} />}

              <div className="panel technical-review-panel">
                <div className="panel-heading compact"><div><p className="eyebrow">TECHNICAL REVIEW QUEUE</p><h2>Prioritize track inspection</h2></div><span>{technicalReviewQueue.length} candidates</span></div>
                <p className="technical-review-intro">Candidates are ranked only from transparent current-run linkage confidence, duration, and active motion thresholds. Select one to inspect its trajectory; this queue does not reject tracks or make biological conclusions.</p>
                {!analysis ? <div className="technical-review-empty">Run analysis to generate technical review candidates.</div> : technicalReviewQueue.length ? <div className="technical-review-list">{technicalReviewQueue.slice(0, 8).map(candidate => <button key={candidate.id} className={selectedTrack?.id === candidate.id ? "selected" : undefined} onClick={() => selectTrajectory(candidate.id)}><span><AlertTriangle size={14} /><strong>{candidate.id}</strong><small>{candidate.reasons.join(" · ")}</small></span><em>{candidate.confidence.toFixed(2)} confidence · {candidate.frames} frames</em><ChevronRight size={16} /></button>)}</div> : <div className="technical-review-empty"><CheckCircle2 size={17} />No current tracks meet the technical review rules.</div>}
              </div>

              {analysis && <div id="analysis-confidence-evidence" tabIndex={-1} className="panel confidence-distribution-panel"><ConfidenceDistribution distribution={analysis.confidenceDistribution} threshold={thresholds.minTrackConfidence} /></div>}

              {analysis && <div id="analysis-sampling-evidence" tabIndex={-1} className="panel temporal-sampling-panel"><TemporalSamplingEvidence evidence={analysis.temporalSampling} /></div>}

              {analysis && <div className="panel classification-composition-panel"><ClassificationComposition composition={analysis.classificationComposition} /></div>}

              {analysis && <div className="panel track-duration-panel"><TrackDurationEvidence evidence={analysis.trackDurationEvidence} /></div>}

              {analysis && <div className="panel track-metric-range-panel"><TrackMetricRangeEvidence evidence={analysis.trackMetricRangeEvidence} /></div>}

              {analysis && <div className="panel track-linkage-continuity-panel"><TrackLinkageContinuity evidence={analysis.trackLinkageContinuity} /></div>}

              {analysis && <div id="analysis-trajectory-integrity-evidence" tabIndex={-1} className="panel trajectory-integrity-panel"><TrajectoryIntegrity evidence={analysis.trajectoryIntegrity} /></div>}

              {analysis && <div id="analysis-field-evidence" tabIndex={-1} className="panel trajectory-spatial-coverage-panel"><TrajectorySpatialCoverage evidence={analysis.trajectorySpatialCoverage} /></div>}

              {analysis && <div className="panel field-boundary-contact-panel"><FieldBoundaryContact evidence={analysis.fieldBoundaryContact} /></div>}

              {analysis && <div className="panel trajectory-temporal-placement-panel"><TrajectoryTemporalPlacement evidence={analysis.trajectoryTemporalPlacement} /></div>}

              {analysis && <div className="panel track-directional-balance-panel"><TrackDirectionalBalance evidence={analysis.trackDirectionalBalance} /></div>}

              {analysis && <div id="analysis-reproducibility-evidence" tabIndex={-1} className="panel output-fingerprint-panel"><OutputFingerprint fingerprint={analysis.outputFingerprint} /></div>}

              {analysis && <div id="analysis-detector-evidence" tabIndex={-1} className="panel candidate-detection-load-panel"><CandidateDetectionLoad evidence={analysis.candidateDetectionLoad} /></div>}

              {analysis && <div id="analysis-candidate-score-evidence" tabIndex={-1} className="panel candidate-score-distribution-panel"><CandidateScoreDistribution evidence={analysis.candidateScoreDistribution} /></div>}

              {analysis && <div className="panel processing-performance-panel"><ProcessingPerformance evidence={analysis.processingPerformance} /></div>}

              {analysis && <div className="panel analysis-scaling-evidence-panel"><AnalysisScalingEvidence evidence={analysis.analysisScalingEvidence} /></div>}

              {analysis && <div className="panel detector-configuration-evidence-panel"><DetectorConfigurationEvidence evidence={analysis.detectorConfigurationEvidence} /></div>}

              {analysis && <div className="panel capture-quality-variability-panel"><CaptureQualityVariability evidence={analysis.captureQualityVariability} /></div>}

              {analysis && <div id="analysis-detector-load-evidence" tabIndex={-1} className="panel detector-load-timeline-panel"><DetectorLoadTimeline evidence={analysis.detectorLoadTimeline} /></div>}

              {analysis && selectedTrack && <div className="panel trajectory-audit-panel"><TrajectoryAudit track={selectedTrack} calibration={calibration} onSeek={seekTrajectoryPoint} /></div>}

              <div className="panel track-panel">
                <div className="panel-heading compact">
                  <div><p className="eyebrow">PER-TRACK REVIEW</p><h2>Motility classification</h2></div>
                  <div className="report-actions">
                    <button className="download-link" disabled={!analysis} onClick={downloadTrajectoryCoordinates}><Download size={15} />Trajectory CSV</button>
                    <button className="download-link" disabled={!analysis || !selectedTrack} onClick={downloadSelectedTrajectory} title={SELECTED_TRAJECTORY_EXPORT_NOTICE}><Download size={15} />Selected trajectory CSV</button>
                    <button className="download-link" disabled={!analysis || !technicalReviewedTrackCount} onClick={downloadTechnicalReviewedTracks} title={REVIEWED_TRACK_EXPORT_NOTICE}><Download size={15} />Reviewed tracks CSV</button>
                    <button className="download-link" disabled={!analysis?.outputFingerprint || (!reviewBookmarks.length && !technicalReviewWindow && !technicalReviewedTrackCount)} onClick={downloadTechnicalReviewAnnotations} title={REVIEW_ANNOTATIONS_EXPORT_NOTICE}><Download size={15} />Review annotations JSON</button>
                    <button className="download-link" disabled={isAnalyzing || !analysis?.outputFingerprint} onClick={() => reviewAnnotationsInputRef.current?.click()} title={getReviewAnnotationsImportBlocker(isAnalyzing) ?? REVIEW_ANNOTATIONS_IMPORT_NOTICE}><Upload size={15} />Import review annotations</button>
                    <button className="download-link" data-testid="clear-review-annotations" disabled={isAnalyzing || (!reviewBookmarks.length && !technicalReviewWindow && !technicalReviewedTrackCount)} onClick={clearLocalTechnicalReviewAnnotations} title="Clear browser-local bookmarks, review-window bounds, and reviewed-track markers without changing footage or analysis output."><X size={15} />Clear local annotations</button>
                    <input ref={reviewAnnotationsInputRef} data-testid="review-annotations-input" type="file" accept="application/json,.json" hidden disabled={isAnalyzing || !analysis?.outputFingerprint} onChange={importTechnicalReviewAnnotations} />
                    <button className="download-link" disabled={!analysis} onClick={downloadDetectorLoadTimeline}><Download size={15} />Detector load CSV</button>
                    <button className="download-link" disabled={!analysis} onClick={downloadCandidateScoreDistribution}><Download size={15} />Candidate scores CSV</button>
                    <button className="download-link" disabled={!analysis} onClick={copyCurrentRunTechnicalSummary} title={CURRENT_RUN_TECHNICAL_COPY_NOTICE}><Copy size={15} />Copy technical summary</button>
                    <button className="download-link" disabled={!analysis} onClick={downloadMethodManifest}><Download size={15} />Method manifest</button>
                    <button className="download-link" disabled={!analysis} onClick={downloadSummary}><Download size={15} />Download summary</button>
                  </div>
                </div>
                {analysis && <div className="local-annotation-status" data-testid="local-annotation-status" aria-live="polite"><span>LOCAL TECHNICAL ANNOTATIONS</span><strong>{technicalReviewAnnotationStatus.summary}</strong><small>{technicalReviewAnnotationStatus.hasAnnotations ? "Browser-local technical review context only; it does not alter footage, tracks, or analysis output." : "No browser-local technical annotations are set for this analysis output."}</small></div>}
                <div className="track-review-filters" role="group" aria-label="Browser-local trajectory review filter"><span>{analysis ? `${filteredReviewTracks.length} of ${analysis.tracks.length} existing tracks shown · ${technicalReviewedTrackCount} marked locally` : "Run analysis to filter trajectories"}</span><div>{([ ["all", "All"], ["progressive", "Progressive"], ["motile", "Motile non-progressive"], ["non_motile", "Non-motile"] ] as Array<[TrackReviewFilter, string]>).map(([filter, label]) => <button key={filter} type="button" aria-pressed={trackReviewFilter === filter} onClick={() => setTrackReviewFilter(filter)} disabled={!analysis}>{label}</button>)}<button type="button" onClick={clearLocalTechnicalTrackReview} disabled={!technicalReviewedTrackCount || isAnalyzing}>Clear reviewed</button></div><small>Filters and reviewed markers affect only local technical review; they do not change tracks, classifications, or analysis output.</small></div>
                <div className="track-table-wrap">
                  <table className="track-table">
                    <thead><tr><th>Track</th><th>Frames</th><th>Confidence</th><th>Class</th><th>VCL</th><th>VSL</th><th>VAP</th><th>LIN</th><th>STR</th><th>ALH</th><th>BCF</th><th>Review</th></tr></thead>
                    <tbody>{analysis ? filteredReviewTracks.slice(0, 12).map(track => <tr key={track.id} onClick={() => selectTrajectory(track.id)} className={selectedTrack?.id === track.id ? "selected-track-row" : undefined}><td><span className="track-color" style={{ background: track.color }} />{track.id}</td><td>{track.metrics.frames}</td><td>{roundMetric(track.metrics.confidence, 2)}</td><td><span className={`classification ${track.metrics.progressive ? "progressive" : track.metrics.motile ? "motile" : "static"}`}>{track.metrics.progressive ? "Progressive" : track.metrics.motile ? "Motile" : "Non-motile"}</span></td><td>{roundMetric(track.metrics.vcl)}</td><td>{roundMetric(track.metrics.vsl)}</td><td>{roundMetric(track.metrics.vap)}</td><td>{roundMetric(track.metrics.lin)}</td><td>{roundMetric(track.metrics.str)}</td><td>{roundMetric(track.metrics.alh)}</td><td>{roundMetric(track.metrics.bcf)}</td><td><button type="button" className="track-reviewed-toggle" aria-pressed={isTechnicalReviewedTrack(technicalReviewedTrackIds, track.id)} onClick={event => { event.stopPropagation(); toggleLocalTechnicalTrackReview(track.id); }} disabled={isAnalyzing}>Reviewed</button></td></tr>) : <tr><td colSpan={12} className="table-empty">Run the analysis to populate linked trajectories and their computed metrics.</td></tr>}{analysis && filteredReviewTracks.length === 0 && <tr><td colSpan={12} className="table-empty">No existing tracks match this display filter. Analysis output was not changed.</td></tr>}</tbody>
                  </table>
                </div>
              </div>
            </div>

            <aside className="workspace-rail">
              <div className="panel rail-panel sample-queue">
                <div className="panel-heading compact"><div><p className="eyebrow">SAMPLE QUEUE</p><h2>Reference footage</h2></div><span className="queue-count">5</span></div>
                <div className="sample-list">{REFERENCE_SAMPLES.map(sample => <button key={sample.id} className={`sample-row ${activeSample.id === sample.id && sourceType === "reference" ? "selected" : ""}`} onClick={() => chooseReference(sample)} disabled={sourceStagingLocked} title={sourceStagingLocked ? recording ? "Stop the active local camera recording before staging replacement footage" : "Cancel the active local analysis before staging replacement footage" : undefined}><span className="sample-index">{sample.id}</span><span><strong>{sample.label}</strong><small>{sample.descriptor}</small></span><ChevronRight size={15} /></button>)}</div>
                <input ref={uploadInputRef} type="file" accept="video/mp4,video/webm,.mp4,.webm" onChange={handleUpload} hidden />
                <button className="upload-action" onClick={() => uploadInputRef.current?.click()} disabled={sourceStagingLocked} title={sourceStagingLocked ? recording ? "Stop the active local camera recording before staging replacement footage" : "Cancel the active local analysis before staging replacement footage" : undefined}><Upload size={17} />Upload H.264 MP4 or WebM</button>
                <p className="privacy-note"><ShieldCheck size={14} />Uploads are preflight-checked locally before replacing active footage; only the resulting analysis snapshot is saved when signed in.</p>
                {sourceStagingLocked && <p className="privacy-note" role="status"><Info size={14} />Replacement footage controls are locked while {recording ? "local camera recording" : "browser-local analysis"} is active.</p>}
                {recording && <p className="analysis-input-lock-note" role="status"><Info size={13} />Sample, method, traceability, and planning inputs are locked until local camera recording ends.</p>}
                <button className="temporary-session-reset" onClick={resetTemporarySession} disabled={temporarySessionResetLocked} title={temporarySessionResetLocked ? temporarySessionResetLockMessage : undefined}><X size={15} />Clear temporary local session</button>
                {temporarySessionResetLocked && <p className="temporary-session-reset-note" role="status">{temporarySessionResetLockMessage}</p>}
                <DataHandlingGuide />
              </div>

              <fieldset className="panel rail-panel metadata-panel analysis-input-lock" disabled={isAnalyzing || recording}>
                <div className="panel-heading compact"><div><p className="eyebrow">SAMPLE + CALIBRATION</p><h2>Method controls</h2></div><Settings2 size={17} /></div>
                <label>Sample name<input value={sampleName} onChange={event => setSampleName(event.target.value)} /></label>
                <label>Species<select value={species} onChange={event => setSpecies(event.target.value)}>{SPECIES.map(item => <option key={item}>{item}</option>)}</select></label>
                <div className="field-pair"><label>µm / pixel<input type="number" step="0.01" min="0.01" value={calibration.micronsPerPixel} onChange={event => { setCalibration(current => ({ ...current, micronsPerPixel: Number(event.target.value) || 0.01 })); setCalibrationEvidence(undefined); }} /></label><label>Frames / sec<input type="number" step="1" min="1" value={calibration.frameRate} onChange={event => setCalibration(current => ({ ...current, frameRate: Number(event.target.value) || 1 }))} /></label></div>
                <div className="metadata-readout"><span>File<strong>{fileName}</strong></span><span>Frames<strong>{metadata.frameCount}</strong></span><span>Duration<strong>{formatDuration(metadata.duration)}</strong></span></div>
                <div className="footage-provenance" aria-label="Active footage provenance"><span>Source<strong>{getFootageSourceLabel(footageProvenance.source)}</strong></span><span>Container<strong>{footageProvenance.container}</strong></span><span>Local bytes<strong>{formatFootageByteSize(footageProvenance.byteSize)}</strong></span>{footageProvenance.source === "camera" && <><span>Camera label<strong>{formatCaptureDeviceLabel(footageProvenance.captureDeviceLabel)}</strong></span><span>Captured at<strong>{formatCaptureTimestamp(footageProvenance.capturedAt)}</strong></span><span>Capture frame<strong>{formatCaptureFrameDimensions(footageProvenance.captureFrameWidth, footageProvenance.captureFrameHeight)}</strong></span><span>Preview profile<strong>{formatRequestedPreviewProfile(footageProvenance.requestedPreviewProfile)}</strong></span><span>Preview frame rate<strong>{formatActivePreviewFrameRate(footageProvenance.activePreviewFrameRate)}</strong></span><span>Preview resize mode<strong>{formatActivePreviewResizeMode(footageProvenance.activePreviewResizeMode)}</strong></span><span>Pre-capture delay<strong>{formatPreCaptureStabilizationDelay(footageProvenance.preCaptureStabilizationDelaySeconds)}</strong></span><span>Recorder format<strong>{formatCameraRecorderMimeType(footageProvenance.recorderMimeType)}</strong></span><span>Requested clip<strong>{formatRequestedCaptureDuration(footageProvenance.requestedDurationSeconds)}</strong></span><span>Actual local recording<strong>{formatActualCaptureDuration(footageProvenance.actualDurationSeconds)}</strong></span><span>Recording stopped<strong>{formatCameraRecordingStopReason(footageProvenance.recordingStopReason)}</strong></span></>}<small><Info size={12} />Local intake context only. It does not measure specimen properties or alter analysis.</small></div>
                <div className="optics-traceability"><span>OPTICS TRACEABILITY · OPERATOR-ENTERED ONLY</span><label>Objective magnification<input value={opticsTraceability.objectiveMagnification} onChange={event => setOpticsTraceability(current => ({ ...current, objectiveMagnification: event.target.value }))} placeholder="e.g., 20×" /></label><label>Chamber depth <small>µm, entered</small><input type="number" min="0" step="0.1" value={opticsTraceability.chamberDepthMicrons ?? ""} onChange={event => setOpticsTraceability(current => ({ ...current, chamberDepthMicrons: Number(event.target.value) || undefined }))} placeholder="e.g., 20" /></label><small><Info size={12} />Recorded method context only. These entries do not recalibrate footage or change any metric.</small></div>
                {calibrationEvidence ? <div className="board-calibration-readout"><CheckCircle2 size={14} /><span>Board-referenced scale<strong>{roundMetric(calibrationEvidence.micronsPerPixel, 5)} µm/px</strong><small>{calibrationEvidence.boardIntervalMicrons} µm / {roundMetric(calibrationEvidence.pixelDistance)} px</small></span></div> : <div className="manual-calibration-readout"><CircleAlert size={14} /><span>Manual scale only<strong>No board evidence recorded</strong><small>Run the calibration-board wizard before using distance or velocity outputs.</small></span></div>}
                <div className="local-method-draft-actions"><button onClick={saveLocalMethodDraft}><Save size={15} />Save local draft</button><button onClick={restoreLocalMethodDraft}><RefreshCcw size={15} />Restore local draft</button><button onClick={clearLocalMethodDraft}><X size={15} />Clear local draft</button></div><div className="local-method-draft-transfer"><button onClick={exportLocalMethodDraft}><Download size={14} />Export draft</button><button onClick={() => localDraftInputRef.current?.click()}><Upload size={14} />Import draft</button></div><input ref={localDraftInputRef} type="file" accept="application/json,.json" hidden onChange={importLocalMethodDraft} /><p className="local-method-draft-status" role="status">{localDraftSavedAt ? `Local draft available · saved ${new Date(localDraftSavedAt).toLocaleString()}` : "No browser-local method draft saved"}</p><p className="local-method-draft-note"><Info size={12} />Local draft storage keeps species, calibration, and cut-offs in this browser only. Import and restore clear board evidence and never change an immutable analysis record.</p>
                <button className="preset-action" onClick={persistSettings} disabled={saveSettings.isPending}>{saveSettings.isPending ? <Loader2 className="spin" size={15} /> : <Save size={15} />}{isAuthenticated ? "Save method preset" : "Sign in to save preset"}</button>
              </fieldset>

              <fieldset className="panel rail-panel specimen-workflow-panel analysis-input-lock" disabled={isAnalyzing || recording}>
                <div className="panel-heading compact"><div><p className="eyebrow">SPECIMEN + HANDOFF</p><h2>Traceability & planning</h2></div><ClipboardCheck size={17} /></div>
                <p className="specimen-intro">Optional identifiers are saved with the immutable analysis snapshot, helping the laboratory connect a result to its collection and review workflow.</p>
                <div className="specimen-field-grid">
                  <label>Specimen ID<input value={specimenContext.specimenId} onChange={event => setSpecimenContext(current => ({ ...current, specimenId: event.target.value }))} placeholder="e.g., EJ-024" /></label>
                  <label>Donor / animal ID<input value={specimenContext.donorId} onChange={event => setSpecimenContext(current => ({ ...current, donorId: event.target.value }))} placeholder="e.g., BULL-12" /></label>
                  <label>Collection reference<input value={specimenContext.collectionReference} onChange={event => setSpecimenContext(current => ({ ...current, collectionReference: event.target.value }))} placeholder="Batch, date, or lot" /></label>
                  <label>Collection time <small>Local time, entered</small><input type="datetime-local" value={specimenContext.collectionDateTime} onChange={event => setSpecimenContext(current => ({ ...current, collectionDateTime: event.target.value }))} /></label>
                  <label>Chamber reference<input value={specimenContext.chamberReference} onChange={event => setSpecimenContext(current => ({ ...current, chamberReference: event.target.value }))} placeholder="Slide / chamber ID" /></label>
                  <label>Preparation protocol ref.<input value={specimenContext.preparationProtocolReference} onChange={event => setSpecimenContext(current => ({ ...current, preparationProtocolReference: event.target.value }))} placeholder="e.g., SOP-17" /></label>
                  <label className="specimen-wide">Analyst note<textarea value={specimenContext.analystNote} onChange={event => setSpecimenContext(current => ({ ...current, analystNote: event.target.value }))} placeholder="Optional handling or preparation note" rows={2} /></label>
                </div>
                <div className="readiness-summary"><span><ShieldCheck size={14} />{acquisitionReadiness.readyCount} ready</span><span><AlertTriangle size={14} />{acquisitionReadiness.reviewCount} review</span><span><Activity size={14} />{acquisitionReadiness.pendingCount} pending</span></div>
                <div className="readiness-list">{acquisitionReadiness.items.map(item => <div key={item.id} className={item.status}><i>{item.status === "ready" ? <CheckCircle2 size={13} /> : item.status === "review" ? <AlertTriangle size={13} /> : <Activity size={13} />}</i><span><strong>{item.label}</strong><small>{item.note}</small></span></div>)}</div>
                <div className="dose-planning-section"><div><p className="eyebrow">PLANNING-ONLY WORKSHEET</p><h3>Entered concentration & dose target</h3></div><div className="specimen-field-grid"><label>Measured concentration <small>M / mL, entered</small><input type="number" min="0" step="0.1" value={dosePlan.measuredConcentrationMillionsPerMl ?? ""} onChange={event => setDosePlan(current => ({ ...current, measuredConcentrationMillionsPerMl: Number(event.target.value) || undefined }))} placeholder="Do not infer" /></label><label>Available volume <small>mL, entered</small><input type="number" min="0" step="0.1" value={dosePlan.availableVolumeMl ?? ""} onChange={event => setDosePlan(current => ({ ...current, availableVolumeMl: Number(event.target.value) || undefined }))} placeholder="e.g., 4" /></label><label className="specimen-wide">Target sperm per dose <small>M / dose, entered</small><input type="number" min="0" step="0.1" value={dosePlan.targetSpermMillionsPerDose ?? ""} onChange={event => setDosePlan(current => ({ ...current, targetSpermMillionsPerDose: Number(event.target.value) || undefined }))} placeholder="e.g., 20" /></label></div>{currentDosePlan ? <div className="dose-result"><strong>{roundMetric(currentDosePlan.theoreticalDoseCount, 1)} theoretical doses</strong><span>{roundMetric(currentDosePlan.totalSpermMillions, 1)} M total entered sperm count</span></div> : <p className="dose-empty"><Info size={13} />Enter measured concentration, available volume, and target sperm per dose to calculate a planning value.</p>}<p className="dose-disclaimer"><CircleAlert size={13} />This calculator does not measure concentration, adjust for viability, or authorize dose release. Confirm under your laboratory protocol.</p></div>
              </fieldset>

              <div className="panel rail-panel multi-field-panel">
                <div className="panel-heading compact"><div><p className="eyebrow">LOCAL MULTI-FIELD REVIEW</p><h2>Repeatability check</h2></div><Activity size={17} /></div>
                <p className="specimen-intro">Compare independently captured fields from one prepared specimen under the same active method. This stays in this browser and does not pool biological measurements.</p>
                <div className="multi-field-actions"><button className="multi-field-add" onClick={addCurrentFieldToReview} disabled={!analysis || sourceType === "reference" || multiFieldResults.some(field => field.id === sourceUrl)}><Plus size={14} />{sourceType === "reference" ? "Reference footage is demo-only" : !analysis ? "Run analysis to add this field" : multiFieldResults.some(field => field.id === sourceUrl) ? "Current field already added" : "Add current analyzed field"}</button><button className="multi-field-add" onClick={downloadMultiFieldReview} disabled={!multiFieldResults.length}><Download size={14} />Export field review CSV</button></div>
                {multiFieldResults.length > 0 && <div className="multi-field-list">{multiFieldResults.map((field, index) => <div key={field.id}><span><strong>{index + 1}. {field.label}</strong><small>{field.source} · {field.summary.validTracks} valid tracks · {field.qualityFlags.length} flag{field.qualityFlags.length === 1 ? "" : "s"}</small>{field.trajectoryIntegrity && <><small className="multi-field-trajectory-integrity">Trajectory integrity: {field.trajectoryIntegrity.summaryLine}</small><small className="multi-field-trajectory-integrity-attention">Technical attention: {field.trajectoryIntegrity.attentionItems.join(" · ") || "none recorded"}</small><small className="multi-field-trajectory-integrity-safeguard">{field.trajectoryIntegrity.safeguard}</small></>}</span><button onClick={() => { setMultiFieldResults(current => current.filter(item => item.id !== field.id)); setSameSpecimenConfirmed(false); }} aria-label={`Remove ${field.label} from repeatability review`}><X size={13} /></button></div>)}</div>}
                <label className="same-specimen-check"><input type="checkbox" checked={sameSpecimenConfirmed} onChange={event => setSameSpecimenConfirmed(event.target.checked)} disabled={multiFieldResults.length < 2} /><span>I confirm these are independent fields from the same prepared specimen.</span></label>
                {multiFieldBlocker ? <p className="multi-field-blocker"><AlertTriangle size={13} />{multiFieldBlocker}</p> : multiFieldReview && <div className="multi-field-summary"><div className="multi-field-summary-head"><strong>{multiFieldReview.fieldCount} fields · {multiFieldReview.totalFlagCount} total flags</strong><span>mean ± sample SD · range</span></div>{(["motility", "progressiveMotility", "vcl", "validTracks"] as const).map(metric => { const value = multiFieldReview.metrics[metric]; const label = metric === "motility" ? "Motility" : metric === "progressiveMotility" ? "Progressive" : metric === "vcl" ? "VCL" : "Valid tracks"; const unit = metric === "motility" || metric === "progressiveMotility" ? "%" : metric === "vcl" ? "µm/s" : ""; return <div key={metric}><span>{label}</span><strong>{roundMetric(value.mean, 1)} ± {roundMetric(value.sampleStandardDeviation, 1)} {unit}</strong><small>{roundMetric(value.min, 1)}–{roundMetric(value.max, 1)} {unit}</small></div>; })}<p><ShieldCheck size={13} />Technical repeatability only. Review all field flags and protocol controls; do not treat the aggregate as concentration, dose-release, or fertility evidence.</p></div>}
              </div>

              <fieldset className="panel rail-panel calibration-wizard-panel analysis-input-lock" disabled={isAnalyzing || recording}>
                <div className="panel-heading compact"><div><p className="eyebrow">CALIBRATION BOARD</p><h2>Scale-capture wizard</h2></div><Aperture size={17} /></div>
                {!calibrationWizardOpen ? <><p className="wizard-intro">Capture or upload a stage micrometer or known calibration-board interval at the same optical setup as the sample, then apply a traceable scale estimate.</p><button className="wizard-open" onClick={() => setCalibrationWizardOpen(true)}><Aperture size={15} />Open calibration wizard</button></> : <div className="calibration-wizard"><ol><li>Place a board at the sample plane and use the same objective, camera, and zoom.</li><li>Capture it from live preview or upload a clear board image from this setup.</li><li>Enter its known interval and click two adjacent references.</li></ol><input ref={calibrationBoardInputRef} type="file" accept="image/*" onChange={handleCalibrationBoardUpload} hidden /><div className="board-source-actions"><button className="board-capture-action" onClick={captureCalibrationBoard} disabled={!cameraStream}><Camera size={15} />Capture live board</button><button className="board-upload-action" onClick={() => calibrationBoardInputRef.current?.click()}><Upload size={15} />Upload board image</button></div>{!cameraStream && <p className="wizard-inline-note"><Info size={13} />No live camera is needed if you upload a board image captured at the same optical setup.</p>}{boardImage && <><label className="board-interval-field">Known board interval (µm)<input type="number" min="0.1" step="0.1" value={boardIntervalMicrons} onChange={event => setBoardIntervalMicrons(Number(event.target.value) || 0.1)} /></label><button className="board-image-stage" onClick={setBoardReferencePoint} aria-label="Click two calibration-board reference points"><img src={boardImage.url} alt="Captured calibration board awaiting two selected reference points" />{boardPoints.map((point, index) => <i key={`${point.x}-${point.y}`} className="board-point" style={{ left: `${(point.x / boardImage.width) * 100}%`, top: `${(point.y / boardImage.height) * 100}%` }}>{index + 1}</i>)}</button><div className="board-selection-status"><span>{boardPoints.length === 0 ? "Click the first board reference" : boardPoints.length === 1 ? "Click the adjacent board reference" : boardEstimate ? `Measured ${roundMetric(boardEstimate.pixelDistance)} px` : "Points are too close — select again"}</span><button onClick={() => setBoardPoints([])}>Reset points</button></div>{boardEstimate && <div className="board-estimate"><strong>{roundMetric(boardEstimate.micronsPerPixel, 5)} µm/px</strong><span>{roundMetric(boardEstimate.pixelDistance)} px for {boardEstimate.boardIntervalMicrons} µm · angle {roundMetric(boardEstimate.angleDegrees)}°</span></div>}<button className="apply-board-calibration" onClick={applyBoardCalibration} disabled={!boardEstimate}><CheckCircle2 size={15} />Apply board scale</button></>}<p className="wizard-inline-note"><ShieldCheck size={13} />This is a manual reference measurement. Retain board evidence and validate it against your laboratory calibration protocol.</p><button className="wizard-close" onClick={() => setCalibrationWizardOpen(false)}>Close wizard</button></div>}
              </fieldset>

              <fieldset className="panel rail-panel thresholds-panel analysis-input-lock" disabled={isAnalyzing || recording}>
                <div className="panel-heading compact"><div><p className="eyebrow">ANALYSIS THRESHOLDS</p><h2>Configurable cut-offs</h2></div><SlidersHorizontal size={17} /></div>
                <label>Detection sensitivity <output>{thresholds.detectionSensitivity}</output><input type="range" min="10" max="55" value={thresholds.detectionSensitivity} onChange={event => updateThreshold("detectionSensitivity", Number(event.target.value))} /></label>
                <label>Max link distance <output>{thresholds.maxLinkDistancePx} px</output><input type="range" min="6" max="42" value={thresholds.maxLinkDistancePx} onChange={event => updateThreshold("maxLinkDistancePx", Number(event.target.value))} /></label>
                <div className="field-pair"><label>Motile VCL min<input type="number" value={thresholds.motilityVclMin} onChange={event => updateThreshold("motilityVclMin", Number(event.target.value))} /></label><label>Progressive STR min<input type="number" value={thresholds.progressiveStrMin} onChange={event => updateThreshold("progressiveStrMin", Number(event.target.value))} /></label></div>
                <div className="field-pair"><label>Progressive VAP min<input type="number" value={thresholds.progressiveVapMin} onChange={event => updateThreshold("progressiveVapMin", Number(event.target.value))} /></label><label>Min track frames<input type="number" min="2" value={thresholds.minTrackFrames} onChange={event => updateThreshold("minTrackFrames", Number(event.target.value))} /></label></div>
                <details className="advanced-method"><summary><span><Activity size={14} />Motion-aware method</span><small>advanced controls</small></summary><p>Direction, distance, and speed association controls are stored with each saved result. Validate values against your protocol before interpretation.</p><div className="field-pair"><label>VAP window<input type="number" min="3" max="21" step="2" value={thresholds.vapSmoothingWindow} onChange={event => updateThreshold("vapSmoothingWindow", Number(event.target.value))} /></label><label>Visual trail<input type="number" min="2" max="60" value={thresholds.visualTrailLength} onChange={event => updateThreshold("visualTrailLength", Number(event.target.value))} /></label></div><div className="field-pair"><label>Max missed frames<input type="number" min="0" max="12" value={thresholds.maxMissedFrames} onChange={event => updateThreshold("maxMissedFrames", Number(event.target.value))} /></label><label>Max turn °<input type="number" min="15" max="180" value={thresholds.maxTurnDegrees} onChange={event => updateThreshold("maxTurnDegrees", Number(event.target.value))} /></label></div><div className="field-pair"><label>Min confidence<input type="number" min="0" max="1" step="0.05" value={thresholds.minTrackConfidence} onChange={event => updateThreshold("minTrackConfidence", Number(event.target.value))} /></label><label>Motile VSL min<input type="number" min="0" step="1" value={thresholds.motilityVslMin} onChange={event => updateThreshold("motilityVslMin", Number(event.target.value))} /></label></div><label>Direction weight <output>{roundMetric(thresholds.linkDirectionWeight, 2)}</output><input type="range" min="0" max="1" step="0.05" value={thresholds.linkDirectionWeight} onChange={event => updateThreshold("linkDirectionWeight", Number(event.target.value))} /></label><label>Distance weight <output>{roundMetric(thresholds.linkDistanceWeight, 2)}</output><input type="range" min="0" max="1" step="0.05" value={thresholds.linkDistanceWeight} onChange={event => updateThreshold("linkDistanceWeight", Number(event.target.value))} /></label><label>Speed weight <output>{roundMetric(thresholds.linkSpeedWeight, 2)}</output><input type="range" min="0" max="1" step="0.05" value={thresholds.linkSpeedWeight} onChange={event => updateThreshold("linkSpeedWeight", Number(event.target.value))} /></label></details>
              </fieldset>

              <div className="panel rail-panel capture-panel">
                <div className="panel-heading compact"><div><p className="eyebrow">MICROSCOPE CAMERA</p><h2>Live acquisition</h2></div><Microscope size={18} /></div>
                <BrowserIntakeCapability evidence={browserIntakeCapability} />
                <div className="camera-device-row"><select value={selectedDevice} onChange={event => setSelectedDevice(event.target.value)} aria-label="Select microscope camera" disabled={cameraAcquisitionLocked}><option value="">Default camera</option>{devices.map(device => <option key={device.deviceId} value={device.deviceId}>{device.label}</option>)}</select><button className="camera-refresh-action" onClick={() => void refreshCameraDevices()} aria-label="Refresh local camera device list" disabled={cameraAcquisitionLocked} title={recording ? "Device refresh is unavailable while local recording is active" : preCaptureRemainingSeconds ? "Device refresh is unavailable while local stabilization delay is active" : isAnalyzing ? "Device refresh is unavailable while local analysis is active" : undefined}><RefreshCcw size={14} />Refresh list</button></div>
                <p className="camera-device-note"><Info size={13} />Refresh lists locally exposed video inputs only. It does not start a preview or request camera permission.</p>
                <label className="camera-preview-profile">Preview resolution<select value={cameraPreviewProfile} onChange={event => setCameraPreviewProfile(event.target.value as CameraPreviewProfileId)} aria-label="Select browser-local camera preview resolution" disabled={Boolean(cameraStream) || recording || isAnalyzing}>{CAMERA_PREVIEW_PROFILES.map(profile => <option key={profile.id} value={profile.id}>{profile.label}</option>)}</select><small>{CAMERA_PREVIEW_PROFILES.find(profile => profile.id === cameraPreviewProfile)?.detail} This requests preview settings only; confirm calibration after a camera or resolution change.</small></label>
                <label className="camera-preview-profile">Preview orientation<select value={cameraPreviewOrientation} onChange={event => setCameraPreviewOrientation(event.target.value as CameraPreviewOrientationId)} aria-label="Select browser-local camera preview orientation" disabled={Boolean(cameraStream) || recording || isAnalyzing}>{CAMERA_PREVIEW_ORIENTATIONS.map(orientation => <option key={orientation.id} value={orientation.id}>{orientation.label}</option>)}</select><small>{CAMERA_PREVIEW_ORIENTATIONS.find(orientation => orientation.id === cameraPreviewOrientation)?.detail} Display only: captured frames, board calibration, and analysis pixels are unchanged.</small></label>
                <label className="capture-duration-control">Short clip duration<select value={captureDurationSeconds} onChange={event => setCaptureDurationSeconds(normalizeCameraClipDuration(Number(event.target.value)))} aria-label="Select microscope clip duration" disabled={cameraAcquisitionLocked}>{CAMERA_CLIP_DURATIONS_SECONDS.map(seconds => <option key={seconds} value={seconds}>{describeCameraClipDuration(seconds)}</option>)}</select></label>
                <label className="capture-duration-control">Pre-capture stabilization<select value={preCaptureDelaySeconds} onChange={event => setPreCaptureDelaySeconds(normalizeCameraPreCaptureDelay(Number(event.target.value)))} aria-label="Select microscope pre-capture stabilization delay" disabled={cameraAcquisitionLocked}>{CAMERA_PRE_CAPTURE_DELAYS_SECONDS.map(seconds => <option key={seconds} value={seconds}>{describeCameraPreCaptureDelay(seconds)}</option>)}</select></label>
                <div className="camera-preview">{cameraStream ? <video ref={cameraVideoRef} className={getCameraPreviewOrientationClass(cameraPreviewOrientation)} muted playsInline /> : stillPreview ? <img src={stillPreview} alt="Captured microscope still frame" /> : <div><Camera size={24} /><span>Camera preview is off</span></div>}</div>
                {cameraStream && <p className="active-camera-preview-label" role="status"><Camera size={13} />Active browser camera: <strong>{formatCaptureDeviceLabel(activeCameraLabel)}</strong></p>}
                {cameraStream && cameraPreviewResolutionEvidence && <div className="camera-preview-resolution-evidence" role="status"><span>Requested: <strong>{cameraPreviewResolutionEvidence.requestedLabel}</strong></span><span>Actual stream: <strong>{cameraPreviewResolutionEvidence.actualLabel}</strong></span><span>Actual rate: <strong>{cameraPreviewResolutionEvidence.actualFrameRateLabel}</strong></span><span>Resize mode: <strong>{cameraPreviewResolutionEvidence.actualResizeModeLabel}</strong></span><span>Analysis rate: <strong>{calibration.frameRate} fps</strong></span><small>{cameraPreviewResolutionEvidence.safeguard}</small></div>}
                {cameraStream && cameraFrameRateReview.needsReview && <p className="camera-frame-rate-review" role="status"><AlertTriangle size={13} />{cameraFrameRateReview.message}</p>}
                <section className="camera-acquisition-readiness" aria-label="Camera acquisition readiness"><div><p className="eyebrow">CAMERA ACQUISITION READINESS</p><strong>{cameraAcquisitionReadiness.summary}</strong></div><div className="camera-readiness-list">{cameraAcquisitionReadiness.items.map(item => <span key={item.id} className={item.status}><i>{item.status === "ready" ? "✓" : "!"}</i><b>{item.label}</b><small>{item.detail}</small></span>)}</div><small className="camera-readiness-safeguard">Technical setup guidance only. It does not block capture, alter calibration, or change analysis output.</small></section>
                {activeCameraSelectionDiffers && <div className="active-camera-selection-notice" role="status"><AlertTriangle size={13} /><span>Selected camera differs from the active stream. Restart preview to switch cameras.</span><button type="button" onClick={restartCameraWithSelectedDevice}><RefreshCcw size={12} />Restart with selected camera</button></div>}
                {footageProvenance.source === "camera" && footageProvenance.recordingStopReason === "stream_ended" && <p className="camera-stream-interruption-note" role="status"><AlertTriangle size={13} />Camera stream ended during local recording. The staged clip may be partial; review technical provenance and confirm calibration before analysis.</p>}
                {recording && <p className="recording-countdown" role="status" aria-live="polite"><Video size={13} />Recording locally · <strong>{recordingRemainingSeconds} s</strong> remaining</p>}
                {preCaptureRemainingSeconds > 0 && <p className="recording-countdown" role="status" aria-live="polite"><Video size={13} />Stabilizing local preview · <strong>{preCaptureRemainingSeconds} s</strong> before recording</p>}
                {cameraAcquisitionLocked && <p className="camera-selection-lock-note" role="status"><Info size={13} />Camera preview, still capture, and acquisition settings are locked while {recording ? "local camera recording" : preCaptureRemainingSeconds ? "local stabilization" : "local analysis"} is active.</p>}
                {recordingErrorNotice && <p className="camera-recording-error-note" role="status"><AlertTriangle size={13} />{recordingErrorNotice}</p>}
                {cameraPreviewErrorNotice && <p className="camera-preview-access-error-note" role="status"><AlertTriangle size={13} />{cameraPreviewErrorNotice}</p>}
                <div className="camera-controls">{cameraStream ? <button onClick={stopCamera} aria-label={recording ? "Stop camera preview and finalize the local clip" : "Stop camera preview"} title={recording ? "Stop camera preview and finalize the local clip" : "Stop camera preview"}><Pause size={15} />Stop</button> : <button ref={cameraStartButtonRef} onClick={startCamera} disabled={isAnalyzing} title={isAnalyzing ? "Complete or cancel the active local analysis before starting a camera preview" : undefined}><Camera size={15} />Start preview</button>}<button onClick={captureStill} disabled={!cameraStream || cameraAcquisitionLocked} title={recording ? "Stop the active local camera recording before capturing a still frame" : preCaptureRemainingSeconds ? "Cancel the local stabilization delay before capturing a still frame" : isAnalyzing ? "Complete or cancel the active local analysis before capturing a still frame" : undefined}><Aperture size={15} />Still</button><button onClick={downloadCameraStill} disabled={!stillPreview || cameraAcquisitionLocked} title={CAMERA_STILL_EXPORT_NOTICE}><Download size={15} />Download still</button><button className={recording || preCaptureRemainingSeconds ? "recording" : ""} onClick={captureClip} disabled={!cameraStream || (isAnalyzing && !recording)} title={isAnalyzing && !recording ? "Cancel the active local analysis before staging a replacement camera clip" : undefined}>{recording || preCaptureRemainingSeconds ? <Pause size={15} /> : <Video size={15} />}{recording ? "Stop" : preCaptureRemainingSeconds ? "Cancel delay" : describeCameraClipDuration(captureDurationSeconds)}</button></div>
                <p className="privacy-note"><Info size={14} />A captured clip follows the same calibration and analysis path as an uploaded video.</p>
              </div>

              <div className="panel rail-panel flags-panel">
                <div className="panel-heading compact"><div><p className="eyebrow">QUALITY FLAGS</p><h2>Reviewer attention</h2></div><AlertTriangle size={17} /></div>
                {analysis && <><div className={`capture-quality-summary ${analysis.captureQuality.status}`}><strong>Capture {analysis.captureQuality.status}</strong><span>Brightness {roundMetric(analysis.captureQuality.brightness)} · contrast {roundMetric(analysis.captureQuality.contrast)} · focus {roundMetric(analysis.captureQuality.focus)}</span></div><div className={`capture-quality-summary ${analysis.fieldStability.status}`}><strong>Field stability {analysis.fieldStability.status}</strong><span>Mean shift {roundMetric(analysis.fieldStability.meanShiftPx)} px · max {roundMetric(analysis.fieldStability.maxShiftPx)} px</span></div></>}
                <div className="flag-list">{analysis ? analysis.qualityFlags.map(flag => <p key={flag}><CircleAlert size={14} />{flag}</p>) : <p><Info size={14} />Run a calibrated analysis to generate footage-specific review flags.</p>}</div>
              </div>
            </aside>
          </section>

          {isAuthenticated && historicalRows.length > 0 && <section className="history-band"><div><p className="eyebrow">PERSISTED HISTORY</p><h2>Recent immutable analysis snapshots</h2></div><div className="history-list">{historicalRows.slice(0, 4).map(({ record }) => <div key={record.id}><span><CheckCircle2 size={15} />{record.source}</span><strong>{record.sampleName}</strong><small>{record.species} · {new Date(record.createdAt).toLocaleDateString()}</small></div>)}</div></section>}
          {isAuthenticated && historicalRows.length > 0 && <section className="comparison-band"><div className="comparison-heading"><div><p className="eyebrow">RESULT COMPARISON</p><h2>Trend review across saved snapshots</h2><p>Adjacent rows compare the saved total-motility estimate with the prior record. Differences reflect the selected calibration and threshold preset for each immutable snapshot.</p></div><RefreshCcw size={18} /></div><div className="comparison-table-wrap"><table className="comparison-table"><thead><tr><th>Saved</th><th>Sample</th><th>Species</th><th>Motility</th><th>Progressive</th><th>VCL</th><th>Δ motility vs prior</th></tr></thead><tbody>{historicalRows.map(({ record, metrics, motilityDelta }) => <tr key={record.id}><td>{new Date(record.createdAt).toLocaleDateString()}</td><td>{record.sampleName}</td><td>{record.species}</td><td>{roundMetric(metrics.motility || 0)}%</td><td>{roundMetric(metrics.progressiveMotility || 0)}%</td><td>{roundMetric(metrics.vcl || 0)} µm/s</td><td>{motilityDelta === undefined ? <span className="comparison-none">—</span> : <span className={motilityDelta >= 0 ? "comparison-up" : "comparison-down"}>{motilityDelta >= 0 ? "+" : ""}{roundMetric(motilityDelta)} pp</span>}</td></tr>)}</tbody></table></div></section>}
          </> : activeView === "audit" ? <TechnicalAuditView analysis={analysis} methodFingerprint={methodFingerprint} annotationSummary={technicalReviewAnnotationStatus.summary} hasAnnotations={technicalReviewAnnotationStatus.hasAnnotations} footageProvenance={footageProvenance} multiFieldCount={multiFieldResults.length} onOpenWorkspace={() => selectDashboardView("workspace")} onOpenFields={() => selectDashboardView("fields")} /> : activeView === "fields" ? <FieldReviewView fields={multiFieldResults} sameSpecimenConfirmed={sameSpecimenConfirmed} blocker={multiFieldBlocker} review={multiFieldReview} onSameSpecimenChange={setSameSpecimenConfirmed} onRemoveField={fieldId => { setMultiFieldResults(current => current.filter(item => item.id !== fieldId)); setSameSpecimenConfirmed(false); }} onDownload={downloadMultiFieldReview} onOpenWorkspace={() => selectDashboardView("workspace")} /> : activeView === "history" ? <SampleHistoryView records={storedRecords} isAuthenticated={isAuthenticated} selectedRecordId={selectedRecordId} onSelectRecord={setSelectedRecordId} onUseMethod={useStoredMethod} onOpenQuality={openQualityRecord} onDownload={downloadStoredManifest} onDownloadHandoff={downloadLaboratoryHandoff} onCopyHandoff={copyLaboratoryHandoff} onOpenWorkspace={() => selectDashboardView("workspace")} /> : activeView === "method" ? <MethodControlsView calibration={calibration} thresholds={thresholds} species={species} calibrationEvidence={calibrationEvidence} methodFingerprint={methodFingerprint} isAuthenticated={isAuthenticated} saving={saveSettings.isPending} onSpeciesChange={setSpecies} onMicronsChange={value => { setCalibration(current => ({ ...current, micronsPerPixel: value })); setCalibrationEvidence(undefined); }} onFrameRateChange={value => setCalibration(current => ({ ...current, frameRate: value }))} onThresholdChange={updateThreshold} onOpenCalibration={() => { selectDashboardView("workspace"); setCalibrationWizardOpen(true); }} onSave={persistSettings} /> : <QualityReviewView records={storedRecords} isAuthenticated={isAuthenticated} selectedRecordId={selectedRecordId} onSelectRecord={setSelectedRecordId} onOpenHistory={openHistoryRecord} onUseMethod={useStoredMethod} />}
        </div>
      </main>
    </div>
  );
}
