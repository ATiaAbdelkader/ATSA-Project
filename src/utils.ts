import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// WHO 5th Edition (2010) Reference Limits
export const WHO_2010_STANDARDS = {
  edition: '5th (2010)' as const,
  volume: 1.5, // mL
  concentration: 15, // M/ml
  totalCount: 39, // Million per ejaculate
  totalMotility: 40, // % (PR + NP)
  progressiveMotility: 32, // % (PR)
  morphology: 4, // % normal forms (strict Kruger)
  vitality: 58, // % live cells
  ph: 7.2,
  leukocytes: 1.0, // M/ml
  dfiNormal: 15, // %
  dfiThreshold: 25, // %
};

// WHO 6th Edition (2021) Reference Limits (5th Centile Lower Reference Limits)
export const WHO_2021_STANDARDS = {
  edition: '6th (2021)' as const,
  volume: 1.4, // mL (Updated in 6th edition: 1.4 mL)
  concentration: 16, // M/ml (Updated in 6th edition: 16 M/ml, 95% CI 15-18)
  totalCount: 39, // Million per ejaculate
  totalMotility: 42, // % (Updated in 6th edition: 42%, 95% CI 40-43)
  progressiveMotility: 30, // % (Updated in 6th edition: 30%, 95% CI 29-31)
  morphology: 4, // % normal forms (strict Kruger: 4%, 95% CI 3.9-4.5)
  vitality: 54, // % live cells (Updated in 6th edition: 54%, 95% CI 50-56)
  ph: 7.2,
  leukocytes: 1.0, // M/ml
  dfiNormal: 15, // % (<15% High fertility potential, 15-25% Fair, >25% Reduced)
  dfiThreshold: 25, // %
};

export const WHO_STANDARDS = WHO_2021_STANDARDS;

export interface ChamberPreset {
  id: string;
  name: string;
  depthMicrons: number;
  description: string;
  recommendedDilution: string;
  volumeMultiplier: number;
}

export const CHAMBER_PRESETS: ChamberPreset[] = [
  {
    id: 'makler_10',
    name: 'Makler Chamber (10 µm)',
    depthMicrons: 10,
    description: 'Gold-standard monolayer counting chamber. High accuracy for progressive motility.',
    recommendedDilution: 'Direct (1:1) or 1:5 for high counts',
    volumeMultiplier: 1.0
  },
  {
    id: 'leja_20',
    name: 'Leja Standard Slide (20 µm)',
    depthMicrons: 20,
    description: 'Disposable capillary chamber. Excellent for unconstrained 3D swimming trajectory.',
    recommendedDilution: 'Direct / 1:2',
    volumeMultiplier: 1.0
  },
  {
    id: 'leja_10',
    name: 'Leja High-Precision (10 µm)',
    depthMicrons: 10,
    description: 'Disposable 10 µm capillary chamber. Monolayer capture without swim-through overlap.',
    recommendedDilution: 'Direct',
    volumeMultiplier: 1.0
  },
  {
    id: 'cellvu_20',
    name: 'Cell-Vu / MicroCell (20 µm)',
    depthMicrons: 20,
    description: 'Standard clinical dual-grid slide for andrology screening.',
    recommendedDilution: 'Direct or 1:10',
    volumeMultiplier: 1.0
  },
  {
    id: 'neubauer_100',
    name: 'Improved Neubauer (100 µm)',
    depthMicrons: 100,
    description: 'Hemocytometer grid. Requires immobilized/diluted fixed sample for accurate volumetric counts.',
    recommendedDilution: '1:20 with fixative solution',
    volumeMultiplier: 1.0
  }
];

export const SPECIES_PROFILES: Record<string, any> = {
  'Human (WHO 6th 2021)': {
    name: 'Human (WHO 6th 2021)',
    whoEdition: '6th',
    minConcentration: 16,
    minTotalMotility: 42,
    minProgressiveMotility: 30,
    minNormalMorphology: 4,
    minVitality: 54,
    maxLeukocytes: 1.0,
    minVolume: 1.4,
    minTotalCountPerEjaculate: 39,
  },
  'Human (WHO 5th 2010)': {
    name: 'Human (WHO 5th 2010)',
    whoEdition: '5th',
    minConcentration: 15,
    minTotalMotility: 40,
    minProgressiveMotility: 32,
    minNormalMorphology: 4,
    minVitality: 58,
    maxLeukocytes: 1.0,
    minVolume: 1.5,
    minTotalCountPerEjaculate: 39,
  },
  'Human': {
    name: 'Human (WHO 6th 2021)',
    whoEdition: '6th',
    minConcentration: 16,
    minTotalMotility: 42,
    minProgressiveMotility: 30,
    minNormalMorphology: 4,
    minVitality: 54,
    maxLeukocytes: 1.0,
    minVolume: 1.4,
    minTotalCountPerEjaculate: 39,
  },
  'Bovine': {
    name: 'Bovine (Bull)',
    minConcentration: 500,
    minTotalMotility: 50,
    minProgressiveMotility: 40,
    minNormalMorphology: 70,
    minVitality: 70,
    maxLeukocytes: 0.5,
    minVolume: 4.0,
  },
  'Equine': {
    name: 'Equine (Stallion)',
    minConcentration: 100,
    minTotalMotility: 60,
    minProgressiveMotility: 50,
    minNormalMorphology: 50,
    minVitality: 65,
    maxLeukocytes: 0.5,
    minVolume: 30.0,
  },
  'Porcine': {
    name: 'Porcine (Boar)',
    minConcentration: 200,
    minTotalMotility: 70,
    minProgressiveMotility: 60,
    minNormalMorphology: 70,
    minVitality: 75,
    maxLeukocytes: 0.5,
    minVolume: 150.0,
  },
  'Canine': {
    name: 'Canine (Dog)',
    minConcentration: 200,
    minTotalMotility: 70,
    minProgressiveMotility: 60,
    minNormalMorphology: 60,
    minVitality: 75,
    maxLeukocytes: 0.5,
    minVolume: 2.0,
  },
  'Ovine': {
    name: 'Ovine (Ram)',
    minConcentration: 2000,
    minTotalMotility: 75,
    minProgressiveMotility: 65,
    minNormalMorphology: 80,
    minVitality: 80,
    maxLeukocytes: 0.5,
    minVolume: 0.8,
  },
  'Caprine': {
    name: 'Caprine (Buck)',
    minConcentration: 2000,
    minTotalMotility: 75,
    minProgressiveMotility: 65,
    minNormalMorphology: 80,
    minVitality: 80,
    maxLeukocytes: 0.5,
    minVolume: 0.8,
  },
  'Murine': {
    name: 'Murine (Mouse / Rat)',
    minConcentration: 25,
    minTotalMotility: 65,
    minProgressiveMotility: 50,
    minNormalMorphology: 70,
    minVitality: 70,
    maxLeukocytes: 0.2,
    minVolume: 0.05,
  }
};

export const SAMPLE_SPECIES = Object.keys(SPECIES_PROFILES);

// Westgard Multi-Rule Evaluation for Laboratory Quality Control
export function evaluateWestgardRules(
  currentVal: number,
  targetMean: number,
  targetSD: number,
  history: number[] = []
): { status: 'in_control' | 'warning' | 'out_of_control'; violations: string[] } {
  const violations: string[] = [];
  const zScore = (currentVal - targetMean) / (targetSD || 1);
  const absZ = Math.abs(zScore);

  // 1-3s Rule: Single value beyond ±3 SD (Reject run)
  if (absZ > 3.0) {
    violations.push(`1-3s Rule Violation: Value deviates by ${zScore.toFixed(2)} SD (> ±3.0 SD)`);
  }

  // 2-2s Rule: Two consecutive values beyond +2 SD or -2 SD on same side (Reject run)
  if (history.length >= 1) {
    const prevZ = (history[history.length - 1] - targetMean) / (targetSD || 1);
    if ((zScore > 2.0 && prevZ > 2.0) || (zScore < -2.0 && prevZ < -2.0)) {
      violations.push('2-2s Rule Violation: Two consecutive runs exceeded ±2.0 SD in same direction');
    }
  }

  // R-4s Rule: Difference between consecutive values exceeds 4 SD (Random error, Reject)
  if (history.length >= 1) {
    const prevZ = (history[history.length - 1] - targetMean) / (targetSD || 1);
    if (Math.abs(zScore - prevZ) >= 4.0) {
      violations.push('R-4s Rule Violation: Range between consecutive runs exceeds 4.0 SD');
    }
  }

  // 4-1s Rule: 4 consecutive runs exceeding +1 SD or -1 SD on same side (Systematic error, Warning)
  if (history.length >= 3) {
    const prev3Z = history.slice(-3).map(v => (v - targetMean) / (targetSD || 1));
    const allPlus1 = [zScore, ...prev3Z].every(z => z > 1.0);
    const allMinus1 = [zScore, ...prev3Z].every(z => z < -1.0);
    if (allPlus1 || allMinus1) {
      violations.push('4-1s Rule: 4 consecutive values exceed ±1.0 SD (Systematic shift)');
    }
  }

  // 10-x Rule: 10 consecutive runs on the same side of the mean (Systematic trend)
  if (history.length >= 9) {
    const prev9Z = history.slice(-9).map(v => (v - targetMean) / (targetSD || 1));
    const allAbove = [zScore, ...prev9Z].every(z => z > 0);
    const allBelow = [zScore, ...prev9Z].every(z => z < 0);
    if (allAbove || allBelow) {
      violations.push('10-x Rule: 10 consecutive values on one side of the mean (Calibration drift)');
    }
  }

  // 1-2s Warning Rule: Value between 2 SD and 3 SD
  if (absZ > 2.0 && absZ <= 3.0 && violations.length === 0) {
    violations.push(`1-2s Warning: Value deviates by ${zScore.toFixed(2)} SD (> ±2.0 SD)`);
    return { status: 'warning', violations };
  }

  if (violations.some(v => v.includes('1-3s') || v.includes('2-2s') || v.includes('R-4s'))) {
    return { status: 'out_of_control', violations };
  }

  if (violations.length > 0) {
    return { status: 'warning', violations };
  }

  return { status: 'in_control', violations: [] };
}
