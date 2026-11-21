import type { CasaCalibration, CasaThresholds } from "./casa";
import { getCalibrationProvenance, type CalibrationBoardEvidence } from "./calibrationBoard";
import { createMethodFingerprint } from "./methodFingerprint";
import type { FootageProvenance, FootageSource } from "./footageProvenance";
import type { OpticsTraceability } from "./opticsTraceability";
import type { DosePlanInput, SpecimenContext } from "./specimenWorkflow";

export type BrowserLocalAnalysisRunContext = Readonly<{
  sourceUrl: string;
  source: FootageSource;
  fileName: string;
  sampleName: string;
  species: string;
  calibration: Readonly<CasaCalibration>;
  thresholds: Readonly<CasaThresholds>;
  calibrationEvidence?: Readonly<CalibrationBoardEvidence>;
  footageProvenance: Readonly<FootageProvenance>;
  specimenContext: Readonly<SpecimenContext>;
  opticsTraceability: Readonly<OpticsTraceability>;
  dosePlan: Readonly<DosePlanInput>;
  partialCameraCaptureReviewAcknowledgedAt?: string;
  methodFingerprint: string;
  calibrationProvenance: "board-referenced" | "manual-unverified";
}>;

export function createBrowserLocalAnalysisRunContext(input: {
  sourceUrl: string;
  source: FootageSource;
  fileName: string;
  sampleName: string;
  species: string;
  calibration: CasaCalibration;
  thresholds: CasaThresholds;
  calibrationEvidence?: CalibrationBoardEvidence;
  footageProvenance: FootageProvenance;
  specimenContext: SpecimenContext;
  opticsTraceability: OpticsTraceability;
  dosePlan: DosePlanInput;
  partialCameraCaptureReviewAcknowledgedAt?: string;
}): BrowserLocalAnalysisRunContext {
  const calibration = Object.freeze({ ...input.calibration });
  const thresholds = Object.freeze({ ...input.thresholds });
  const calibrationEvidence = input.calibrationEvidence ? Object.freeze({ ...input.calibrationEvidence }) : undefined;
  const footageProvenance = Object.freeze({ ...input.footageProvenance });
  const specimenContext = Object.freeze({ ...input.specimenContext });
  const opticsTraceability = Object.freeze({ ...input.opticsTraceability });
  const dosePlan = Object.freeze({ ...input.dosePlan });
  return Object.freeze({
    sourceUrl: input.sourceUrl,
    source: input.source,
    fileName: input.fileName,
    sampleName: input.sampleName,
    species: input.species,
    calibration,
    thresholds,
    calibrationEvidence,
    footageProvenance,
    specimenContext,
    opticsTraceability,
    dosePlan,
    partialCameraCaptureReviewAcknowledgedAt: input.partialCameraCaptureReviewAcknowledgedAt,
    methodFingerprint: createMethodFingerprint({ species: input.species, calibration, thresholds }),
    calibrationProvenance: getCalibrationProvenance(calibrationEvidence),
  });
}
