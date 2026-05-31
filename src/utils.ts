import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const WHO_STANDARDS = {
  concentration: 15, // million/ml
  totalMotility: 40, // %
  progressiveMotility: 32, // %
  morphology: 4, // %
  viability: 58, // %
};

export const SPECIES_PROFILES: Record<string, any> = {
  'Human': {
    name: 'Human (WHO 2010)',
    minConcentration: 15,
    minTotalMotility: 40,
    minProgressiveMotility: 32,
    minNormalMorphology: 4,
    minVitality: 58,
    maxLeukocytes: 1.0,
  },
  'Bovine': {
    name: 'Bovine (Bull)',
    minConcentration: 500,
    minTotalMotility: 50,
    minProgressiveMotility: 40,
    minNormalMorphology: 70,
    minVitality: 70,
    maxLeukocytes: 0.5,
  },
  'Equine': {
    name: 'Equine (Stallion)',
    minConcentration: 100,
    minTotalMotility: 60,
    minProgressiveMotility: 50,
    minNormalMorphology: 50,
    minVitality: 65,
    maxLeukocytes: 0.5,
  },
  'Porcine': {
    name: 'Porcine (Boar)',
    minConcentration: 200,
    minTotalMotility: 70,
    minProgressiveMotility: 60,
    minNormalMorphology: 70,
    minVitality: 75,
    maxLeukocytes: 0.5,
  },
  'Canine': {
    name: 'Canine (Dog)',
    minConcentration: 200,
    minTotalMotility: 70,
    minProgressiveMotility: 60,
    minNormalMorphology: 60,
    minVitality: 75,
    maxLeukocytes: 0.5,
  },
  'Ovine': {
    name: 'Ovine (Ram)',
    minConcentration: 2000,
    minTotalMotility: 75,
    minProgressiveMotility: 65,
    minNormalMorphology: 80,
    minVitality: 80,
    maxLeukocytes: 0.5,
  },
  'Caprine': {
    name: 'Caprine (Buck)',
    minConcentration: 2000,
    minTotalMotility: 75,
    minProgressiveMotility: 65,
    minNormalMorphology: 80,
    minVitality: 80,
    maxLeukocytes: 0.5,
  }
};

export const SAMPLE_SPECIES = Object.keys(SPECIES_PROFILES);
