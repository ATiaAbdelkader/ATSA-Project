import type {
  AnalysisProvenance,
  AnalysisResult,
  DomainAssessment,
  MeasurementBasis,
} from '../types';

const NOT_ASSESSED_DOMAINS: DomainAssessment = {
  kinematics: 'not_assessed',
  concentration: 'not_assessed',
  morphometry: 'not_assessed',
  morphology: 'not_assessed',
  vitality: 'not_assessed',
  sdf: 'not_assessed',
  leukocytes: 'not_assessed',
};

export const UNVERIFIED_PROVENANCE: AnalysisProvenance = {
  source: 'unknown',
  label: 'Unverified result',
  detail:
    'This result was produced before provenance tracking was added. Treat every value as unverified and do not use it as a patient measurement.',
  recordEligible: false,
  domains: NOT_ASSESSED_DOMAINS,
};

export const SIMULATED_CAMERA_PROVENANCE: AnalysisProvenance = {
  source: 'simulated',
  label: 'Simulated tracking',
  detail:
    'The live-camera engine animates synthetic tracks over the camera image. Motility and kinematics shown here are simulation output, not measurements of the specimen.',
  recordEligible: false,
  domains: {
    kinematics: 'simulated',
    concentration: 'not_assessed',
    morphometry: 'not_assessed',
    morphology: 'not_assessed',
    vitality: 'not_assessed',
    sdf: 'not_assessed',
    leukocytes: 'not_assessed',
  },
};

export const REFERENCE_DATASET_PROVENANCE: AnalysisProvenance = {
  source: 'reference',
  label: 'Reference dataset',
  detail:
    'This is a bundled reference recording supplied with the application, not a measurement of the currently registered patient or specimen.',
  recordEligible: false,
  domains: {
    kinematics: 'reference',
    concentration: 'reference',
    morphometry: 'reference',
    morphology: 'reference',
    vitality: 'reference',
    sdf: 'reference',
    leukocytes: 'reference',
  },
};

export const SIMULATED_ANIMAL_PROVENANCE: AnalysisProvenance = {
  source: 'simulated',
  label: 'Virtual demonstration case',
  detail:
    'This is a simulated teaching case. Every value is demonstration output and must not be interpreted as a patient result.',
  recordEligible: false,
  domains: {
    kinematics: 'simulated',
    concentration: 'simulated',
    morphometry: 'simulated',
    morphology: 'simulated',
    vitality: 'simulated',
    sdf: 'simulated',
    leukocytes: 'simulated',
  },
};

export const MEASURED_VIDEO_PROVENANCE: AnalysisProvenance = {
  source: 'measured',
  label: 'Measured from uploaded footage',
  detail:
    'Kinematics were computed from tracked objects in the uploaded footage. Concentration is estimated from single-frame detections and chamber geometry. Morphology, vitality, and DNA fragmentation were not assessed by this pipeline.',
  recordEligible: true,
  domains: {
    kinematics: 'measured',
    concentration: 'estimated',
    morphometry: 'not_assessed',
    morphology: 'not_assessed',
    vitality: 'not_assessed',
    sdf: 'not_assessed',
    leukocytes: 'not_assessed',
  },
};

export const AI_ESTIMATE_PROVENANCE: AnalysisProvenance = {
  source: 'ai_estimated',
  label: 'AI estimate with synthetic tracks',
  detail:
    'The computer-vision tracker could not complete, so a vision model estimated concentration, motility, and morphology. The on-screen trajectories are synthetic and no kinematic measurement was made.',
  recordEligible: false,
  domains: {
    kinematics: 'simulated',
    concentration: 'estimated',
    morphometry: 'not_assessed',
    // The model's morphology narrative is shown in the AI tab, but it is not a
    // measured morphology distribution and must not populate the morphology UI.
    morphology: 'not_assessed',
    vitality: 'not_assessed',
    sdf: 'not_assessed',
    leukocytes: 'not_assessed',
  },
};

export function createProvenance(
  input: Omit<AnalysisProvenance, 'domains'> & { domains: Partial<DomainAssessment> }
): AnalysisProvenance {
  return {
    ...input,
    domains: { ...NOT_ASSESSED_DOMAINS, ...input.domains },
  };
}

export function getProvenance(
  result: Pick<AnalysisResult, 'provenance'> | null | undefined
): AnalysisProvenance {
  return result?.provenance ?? UNVERIFIED_PROVENANCE;
}

export function domainBasis(
  result: Pick<AnalysisResult, 'provenance'> | null | undefined,
  domain: keyof DomainAssessment
): MeasurementBasis {
  return getProvenance(result).domains[domain];
}

export function hasDomainValues(basis: MeasurementBasis): boolean {
  return basis !== 'not_assessed';
}

export function canSaveToPatientRecord(
  result: Pick<AnalysisResult, 'provenance'> | null | undefined
): boolean {
  const provenance = result?.provenance;
  return Boolean(provenance?.recordEligible && provenance.source === 'measured');
}

export function describeMissingDomains(
  result: Pick<AnalysisResult, 'provenance'> | null | undefined,
  domains: Array<keyof DomainAssessment>
): string[] {
  return domains
    .filter(domain => !hasDomainValues(domainBasis(result, domain)))
    .map(domain =>
      domain === 'sdf'
        ? 'DNA fragmentation (SDF)'
        : domain === 'morphometry'
          ? 'morphometry'
          : domain
    );
}

export function isSimulatedResult(
  result: Pick<AnalysisResult, 'provenance'> | null | undefined
): boolean {
  const source = result?.provenance?.source;
  return source === 'simulated' || source === 'ai_estimated';
}
