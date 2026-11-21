import type { CalibrationBoardEvidence } from "./calibrationBoard";

export type SpecimenContext = {
  specimenId: string;
  donorId: string;
  collectionReference: string;
  collectionDateTime: string;
  chamberReference: string;
  preparationProtocolReference: string;
  dilutionFactor?: number;
  analystNote: string;
};

export type DosePlanInput = {
  measuredConcentrationMillionsPerMl?: number;
  availableVolumeMl?: number;
  targetSpermMillionsPerDose?: number;
};

export type DosePlanResult = DosePlanInput & {
  totalSpermMillions: number;
  theoreticalDoseCount: number;
};

export type AcquisitionReadinessItem = {
  id: "specimen" | "calibration" | "video" | "capture";
  label: string;
  status: "ready" | "review" | "pending";
  note: string;
};

export type AcquisitionReadiness = {
  readyCount: number;
  reviewCount: number;
  pendingCount: number;
  items: AcquisitionReadinessItem[];
};

export const EMPTY_SPECIMEN_CONTEXT: SpecimenContext = {
  specimenId: "",
  donorId: "",
  collectionReference: "",
  collectionDateTime: "",
  chamberReference: "",
  preparationProtocolReference: "",
  analystNote: "",
};

export const EMPTY_DOSE_PLAN: DosePlanInput = {
  measuredConcentrationMillionsPerMl: undefined,
  availableVolumeMl: undefined,
  targetSpermMillionsPerDose: undefined,
};

function hasText(value?: string) {
  return Boolean(value?.trim());
}

export function calculateDosePlan(input: DosePlanInput): DosePlanResult | undefined {
  const concentration = input.measuredConcentrationMillionsPerMl;
  const volume = input.availableVolumeMl;
  const target = input.targetSpermMillionsPerDose;
  if (!Number.isFinite(concentration) || !Number.isFinite(volume) || !Number.isFinite(target) || !concentration || !volume || !target || concentration <= 0 || volume <= 0 || target <= 0) return undefined;
  const totalSpermMillions = concentration * volume;
  return {
    ...input,
    totalSpermMillions,
    theoreticalDoseCount: totalSpermMillions / target,
  };
}

export function buildAcquisitionReadiness({
  specimenContext,
  calibrationEvidence,
  width,
  height,
  frameRate,
  captureQuality,
}: {
  specimenContext: SpecimenContext;
  calibrationEvidence?: CalibrationBoardEvidence;
  width?: number;
  height?: number;
  frameRate?: number;
  captureQuality?: { status?: "acceptable" | "review" | "poor" };
}): AcquisitionReadiness {
  const specimenRecorded = hasText(specimenContext.specimenId) || hasText(specimenContext.donorId) || hasText(specimenContext.collectionReference);
  const videoRecorded = Boolean(width && height && frameRate && width > 0 && height > 0 && frameRate > 0);
  const captureStatus: AcquisitionReadinessItem["status"] = captureQuality ? captureQuality.status === "acceptable" ? "ready" : "review" : "pending";
  const items: AcquisitionReadinessItem[] = [
    { id: "specimen", label: "Specimen traceability", status: specimenRecorded ? "ready" : "review", note: specimenRecorded ? "A specimen, donor, or collection reference is recorded." : "Record a specimen, donor, or collection reference before laboratory release." },
    { id: "calibration", label: "Optical calibration", status: calibrationEvidence ? "ready" : "review", note: calibrationEvidence ? `Board reference: ${calibrationEvidence.boardIntervalMicrons} µm over ${calibrationEvidence.pixelDistance.toFixed(1)} px.` : "Manual scale only; confirm µm/px against the laboratory protocol." },
    { id: "video", label: "Video acquisition metadata", status: videoRecorded ? "ready" : "review", note: videoRecorded ? `${width} × ${height} at ${frameRate} fps is recorded.` : "Video dimensions or frame rate are not available." },
    { id: "capture", label: "Capture-quality review", status: captureStatus, note: captureQuality ? captureQuality.status === "acceptable" ? "Capture-quality evidence is acceptable." : "Capture-quality evidence requires reviewer attention." : "Pending until the video analysis samples capture quality." },
  ];
  return {
    readyCount: items.filter(item => item.status === "ready").length,
    reviewCount: items.filter(item => item.status === "review").length,
    pendingCount: items.filter(item => item.status === "pending").length,
    items,
  };
}
