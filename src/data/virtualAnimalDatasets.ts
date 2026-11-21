import type { AnalysisResult, SpermData, SpeciesProfile, MultiFOVComposite } from '../types';
import { SPECIES_PROFILES } from '../utils';

export interface VirtualAnimalRecord {
  id: 'bovine' | 'equine' | 'canine' | 'porcine' | 'ovine';
  species: 'Bovine' | 'Equine' | 'Canine' | 'Porcine' | 'Ovine';
  speciesLabel: string;
  commonName: string;
  patientId: string;
  animalName: string;
  breed: string;
  age: string;
  tagOrReg: string;
  ownerFacility: string;
  avatarIcon: string;
  themeColor: {
    primary: string;
    border: string;
    bg: string;
    text: string;
    gradient: string;
  };
  macroscopic: {
    volume: number; // mL
    ph: number;
    appearance: string;
    liquefaction: string;
    viscosity: 'normal' | 'moderate' | 'high';
    collectionMethod: 'Artificial Vagina' | 'Electroejaculation' | 'Manual Stimulation' | 'Epididymal Recovery';
  };
  veterinarySft: {
    totalEjaculateSperm: string; // Millions
    totalProgressiveSperm: string; // Millions
    strawYield: number; // Cryo straws or fresh AI doses
    targetDoseMotile: number; // M motile sperm per dose
    standardStrawSize: string; // e.g. 0.25mL, 0.5mL, 80mL
    breedingSoundnessClassification: 'SATISFACTORY BREEDER' | 'EXCELLENT PROSPECTIVE SIRE' | 'QUESTIONABLE REPRODUCTIVE POTENTIAL' | 'SUPERIOR AI DONOR';
    recommendedExtender: string;
    cryoThawRecoveryExpected: string;
    clinicalPrognosis: string;
  };
  clinicianRemarks: string;
  aiDiagnosticNarrative: string;
  results: AnalysisResult;
}

// 1. BOVINE (BULL) - Premium Sire "Black Angus Supreme #402"
const bovineSpermatozoa: SpermData[] = [
  {
    id: "BOV-SPM-01",
    path: Array.from({ length: 40 }, (_, i) => ({
      x: 140 + Math.sin(i * 0.42) * 22 + i * 2.2,
      y: 120 + Math.cos(i * 0.42) * 18 + i * 1.8,
      z: Math.sin(i * 0.25) * 4.5,
      t: i * 0.016
    })),
    vcl: 148.5,
    vsl: 88.2,
    vap: 104.5,
    lin: 0.59,
    str: 0.84,
    wob: 0.70,
    alh: 4.35,
    bcf: 29.2,
    mad: 11.5,
    morphometry: {
      area: 33.2,
      perimeter: 24.5,
      length: 8.6,
      width: 4.3,
      circularity: 0.83,
      elongation: 1.22,
      lengthWidthRatio: 2.0,
      acrosomeAreaPercent: 58.5
    },
    morphology: {
      head: 'normal',
      vacuoles: 'absent',
      acrosome: 'normal',
      midpiece: 'normal',
      tail: 'normal',
      droplet: 'none',
      krugerStrict: 'strict_normal'
    },
    vitality: 'live',
    classification: 'progressive',
    isHyperactivated: true,
    hyperactivationType: 'linear_whiplash',
    sdf: {
      fragmented: false,
      haloSized: 15.5,
      dfi: 7.2
    }
  },
  {
    id: "BOV-SPM-02",
    path: Array.from({ length: 40 }, (_, i) => ({
      x: 280 + Math.sin(i * 0.38) * 19 + i * 1.9,
      y: 190 + Math.cos(i * 0.38) * 16 + i * 1.5,
      z: Math.sin(i * 0.2) * 3.8,
      t: i * 0.016
    })),
    vcl: 139.8,
    vsl: 82.1,
    vap: 98.4,
    lin: 0.59,
    str: 0.83,
    wob: 0.70,
    alh: 4.10,
    bcf: 28.1,
    mad: 12.0,
    morphometry: {
      area: 32.8,
      perimeter: 24.1,
      length: 8.5,
      width: 4.2,
      circularity: 0.82,
      elongation: 1.24,
      lengthWidthRatio: 2.02,
      acrosomeAreaPercent: 57.0
    },
    morphology: {
      head: 'normal',
      vacuoles: 'absent',
      acrosome: 'normal',
      midpiece: 'normal',
      tail: 'normal',
      droplet: 'none',
      krugerStrict: 'strict_normal'
    },
    vitality: 'live',
    classification: 'progressive',
    isHyperactivated: false,
    sdf: {
      fragmented: false,
      haloSized: 14.8,
      dfi: 8.1
    }
  },
  {
    id: "BOV-SPM-03",
    path: Array.from({ length: 40 }, (_, i) => ({
      x: 350 + Math.sin(i * 0.75) * 6,
      y: 240 + i * 0.5,
      z: Math.cos(i * 0.3) * 2,
      t: i * 0.016
    })),
    vcl: 48.5,
    vsl: 16.2,
    vap: 24.1,
    lin: 0.33,
    str: 0.67,
    wob: 0.50,
    alh: 1.95,
    bcf: 11.5,
    mad: 34.2,
    morphometry: {
      area: 36.8,
      perimeter: 26.8,
      length: 9.4,
      width: 4.7,
      circularity: 0.73,
      elongation: 1.40,
      lengthWidthRatio: 2.0,
      acrosomeAreaPercent: 34.0
    },
    morphology: {
      head: 'pyriform',
      vacuoles: 'absent',
      acrosome: 'abnormal',
      midpiece: 'bent',
      tail: 'normal',
      droplet: 'none',
      krugerStrict: 'abnormal'
    },
    vitality: 'live',
    classification: 'non-progressive',
    isHyperactivated: false,
    sdf: {
      fragmented: false,
      haloSized: 11.2,
      dfi: 14.5
    }
  },
  {
    id: "BOV-SPM-04",
    path: Array.from({ length: 40 }, (_, i) => ({
      x: 190 + Math.sin(i * 0.15) * 2,
      y: 310 + Math.sin(i * 0.1) * 2,
      z: 0,
      t: i * 0.016
    })),
    vcl: 4.8,
    vsl: 0.7,
    vap: 1.4,
    lin: 0.14,
    str: 0.50,
    wob: 0.29,
    alh: 0.20,
    bcf: 1.0,
    mad: 2.0,
    morphometry: {
      area: 31.2,
      perimeter: 22.0,
      length: 8.0,
      width: 3.9,
      circularity: 0.85,
      elongation: 1.14,
      lengthWidthRatio: 2.05,
      acrosomeAreaPercent: 18.0
    },
    morphology: {
      head: 'amorphous',
      vacuoles: 'present',
      acrosome: 'abnormal',
      midpiece: 'asymmetric',
      tail: 'coiled',
      droplet: 'proximal',
      krugerStrict: 'abnormal'
    },
    vitality: 'dead',
    classification: 'immotile',
    isHyperactivated: false,
    sdf: {
      fragmented: true,
      haloSized: 2.8,
      dfi: 86.4
    }
  }
];

// 2. EQUINE (STALLION) - "Royal Andalusian Pride #12"
const equineSpermatozoa: SpermData[] = [
  {
    id: "EQU-SPM-01",
    path: Array.from({ length: 40 }, (_, i) => ({
      x: 160 + Math.sin(i * 0.36) * 26 + i * 2.0,
      y: 130 + Math.cos(i * 0.36) * 21 + i * 1.6,
      z: Math.sin(i * 0.22) * 4.0,
      t: i * 0.016
    })),
    vcl: 128.4,
    vsl: 72.5,
    vap: 86.2,
    lin: 0.56,
    str: 0.84,
    wob: 0.67,
    alh: 3.85,
    bcf: 26.4,
    mad: 13.8,
    morphometry: {
      area: 28.5,
      perimeter: 21.4,
      length: 7.8,
      width: 3.9,
      circularity: 0.81,
      elongation: 1.28,
      lengthWidthRatio: 2.0,
      acrosomeAreaPercent: 52.0
    },
    morphology: {
      head: 'normal',
      vacuoles: 'absent',
      acrosome: 'normal',
      midpiece: 'normal',
      tail: 'normal',
      droplet: 'none',
      krugerStrict: 'strict_normal'
    },
    vitality: 'live',
    classification: 'progressive',
    isHyperactivated: false,
    sdf: {
      fragmented: false,
      haloSized: 13.5,
      dfi: 12.0
    }
  },
  {
    id: "EQU-SPM-02",
    path: Array.from({ length: 40 }, (_, i) => ({
      x: 300 + Math.sin(i * 0.4) * 24 + i * 1.8,
      y: 200 + Math.cos(i * 0.4) * 19 + i * 1.4,
      z: Math.sin(i * 0.18) * 3.5,
      t: i * 0.016
    })),
    vcl: 122.1,
    vsl: 68.4,
    vap: 81.5,
    lin: 0.56,
    str: 0.84,
    wob: 0.67,
    alh: 3.65,
    bcf: 25.2,
    mad: 14.1,
    morphometry: {
      area: 28.2,
      perimeter: 21.1,
      length: 7.7,
      width: 3.9,
      circularity: 0.80,
      elongation: 1.26,
      lengthWidthRatio: 1.97,
      acrosomeAreaPercent: 51.5
    },
    morphology: {
      head: 'normal',
      vacuoles: 'absent',
      acrosome: 'normal',
      midpiece: 'normal',
      tail: 'normal',
      droplet: 'none',
      krugerStrict: 'strict_normal'
    },
    vitality: 'live',
    classification: 'progressive',
    isHyperactivated: false,
    sdf: {
      fragmented: false,
      haloSized: 13.0,
      dfi: 13.2
    }
  },
  {
    id: "EQU-SPM-03",
    path: Array.from({ length: 40 }, (_, i) => ({
      x: 220 + Math.sin(i * 0.8) * 5,
      y: 260 + i * 0.45,
      z: 0,
      t: i * 0.016
    })),
    vcl: 42.0,
    vsl: 13.5,
    vap: 20.2,
    lin: 0.32,
    str: 0.67,
    wob: 0.48,
    alh: 1.70,
    bcf: 10.4,
    mad: 36.5,
    morphometry: {
      area: 32.4,
      perimeter: 24.2,
      length: 8.4,
      width: 4.2,
      circularity: 0.72,
      elongation: 1.42,
      lengthWidthRatio: 2.0,
      acrosomeAreaPercent: 32.0
    },
    morphology: {
      head: 'tapered',
      vacuoles: 'absent',
      acrosome: 'abnormal',
      midpiece: 'thick',
      tail: 'bent',
      droplet: 'none',
      krugerStrict: 'abnormal'
    },
    vitality: 'live',
    classification: 'non-progressive',
    isHyperactivated: false,
    sdf: {
      fragmented: false,
      haloSized: 10.2,
      dfi: 19.5
    }
  }
];

// 3. CANINE (STUD DOG) - Champion Stud "Zeus vom Schwarzwald"
const canineSpermatozoa: SpermData[] = [
  {
    id: "CAN-SPM-01",
    path: Array.from({ length: 40 }, (_, i) => ({
      x: 150 + Math.sin(i * 0.48) * 28 + i * 2.8,
      y: 110 + Math.cos(i * 0.48) * 24 + i * 2.2,
      z: Math.sin(i * 0.3) * 5.0,
      t: i * 0.016
    })),
    vcl: 162.5,
    vsl: 106.4,
    vap: 122.8,
    lin: 0.65,
    str: 0.87,
    wob: 0.76,
    alh: 4.65,
    bcf: 33.4,
    mad: 9.8,
    morphometry: {
      area: 24.5,
      perimeter: 19.2,
      length: 6.8,
      width: 3.6,
      circularity: 0.84,
      elongation: 1.20,
      lengthWidthRatio: 1.89,
      acrosomeAreaPercent: 62.0
    },
    morphology: {
      head: 'normal',
      vacuoles: 'absent',
      acrosome: 'normal',
      midpiece: 'normal',
      tail: 'normal',
      droplet: 'none',
      krugerStrict: 'strict_normal'
    },
    vitality: 'live',
    classification: 'progressive',
    isHyperactivated: true,
    hyperactivationType: 'star_spin',
    sdf: {
      fragmented: false,
      haloSized: 16.8,
      dfi: 5.4
    }
  },
  {
    id: "CAN-SPM-02",
    path: Array.from({ length: 40 }, (_, i) => ({
      x: 290 + Math.sin(i * 0.45) * 25 + i * 2.5,
      y: 180 + Math.cos(i * 0.45) * 20 + i * 1.9,
      z: Math.sin(i * 0.25) * 4.2,
      t: i * 0.016
    })),
    vcl: 154.2,
    vsl: 98.6,
    vap: 115.0,
    lin: 0.64,
    str: 0.86,
    wob: 0.75,
    alh: 4.35,
    bcf: 31.8,
    mad: 10.4,
    morphometry: {
      area: 24.2,
      perimeter: 18.9,
      length: 6.7,
      width: 3.6,
      circularity: 0.83,
      elongation: 1.22,
      lengthWidthRatio: 1.86,
      acrosomeAreaPercent: 60.5
    },
    morphology: {
      head: 'normal',
      vacuoles: 'absent',
      acrosome: 'normal',
      midpiece: 'normal',
      tail: 'normal',
      droplet: 'none',
      krugerStrict: 'strict_normal'
    },
    vitality: 'live',
    classification: 'progressive',
    isHyperactivated: false,
    sdf: {
      fragmented: false,
      haloSized: 16.0,
      dfi: 6.1
    }
  },
  {
    id: "CAN-SPM-03",
    path: Array.from({ length: 40 }, (_, i) => ({
      x: 200 + Math.sin(i * 0.9) * 4,
      y: 250 + i * 0.35,
      z: 0,
      t: i * 0.016
    })),
    vcl: 36.8,
    vsl: 11.2,
    vap: 17.5,
    lin: 0.30,
    str: 0.64,
    wob: 0.47,
    alh: 1.50,
    bcf: 9.8,
    mad: 38.0,
    morphometry: {
      area: 27.5,
      perimeter: 21.0,
      length: 7.4,
      width: 3.9,
      circularity: 0.76,
      elongation: 1.34,
      lengthWidthRatio: 1.9,
      acrosomeAreaPercent: 40.0
    },
    morphology: {
      head: 'round',
      vacuoles: 'absent',
      acrosome: 'abnormal',
      midpiece: 'asymmetric',
      tail: 'normal',
      droplet: 'distal',
      krugerStrict: 'abnormal'
    },
    vitality: 'live',
    classification: 'non-progressive',
    isHyperactivated: false,
    sdf: {
      fragmented: false,
      haloSized: 12.4,
      dfi: 11.2
    }
  }
];

// 4. PORCINE (BOAR) - Elite Genetic Sire "Duroc Line #88"
const porcineSpermatozoa: SpermData[] = [
  {
    id: "POR-SPM-01",
    path: Array.from({ length: 40 }, (_, i) => ({
      x: 130 + Math.sin(i * 0.38) * 20 + i * 1.8,
      y: 140 + Math.cos(i * 0.38) * 17 + i * 1.5,
      z: Math.sin(i * 0.2) * 3.8,
      t: i * 0.016
    })),
    vcl: 132.0,
    vsl: 78.4,
    vap: 92.5,
    lin: 0.59,
    str: 0.85,
    wob: 0.70,
    alh: 4.10,
    bcf: 27.5,
    mad: 12.2,
    morphometry: {
      area: 34.0,
      perimeter: 25.2,
      length: 8.8,
      width: 4.5,
      circularity: 0.80,
      elongation: 1.25,
      lengthWidthRatio: 1.95,
      acrosomeAreaPercent: 56.0
    },
    morphology: {
      head: 'normal',
      vacuoles: 'absent',
      acrosome: 'normal',
      midpiece: 'normal',
      tail: 'normal',
      droplet: 'none',
      krugerStrict: 'strict_normal'
    },
    vitality: 'live',
    classification: 'progressive',
    isHyperactivated: false,
    sdf: {
      fragmented: false,
      haloSized: 14.5,
      dfi: 9.0
    }
  },
  {
    id: "POR-SPM-02",
    path: Array.from({ length: 40 }, (_, i) => ({
      x: 270 + Math.sin(i * 0.35) * 18 + i * 1.7,
      y: 190 + Math.cos(i * 0.35) * 15 + i * 1.4,
      z: Math.sin(i * 0.18) * 3.5,
      t: i * 0.016
    })),
    vcl: 124.5,
    vsl: 73.0,
    vap: 86.8,
    lin: 0.59,
    str: 0.84,
    wob: 0.70,
    alh: 3.85,
    bcf: 26.2,
    mad: 12.8,
    morphometry: {
      area: 33.6,
      perimeter: 24.8,
      length: 8.7,
      width: 4.4,
      circularity: 0.79,
      elongation: 1.26,
      lengthWidthRatio: 1.98,
      acrosomeAreaPercent: 54.5
    },
    morphology: {
      head: 'normal',
      vacuoles: 'absent',
      acrosome: 'normal',
      midpiece: 'normal',
      tail: 'normal',
      droplet: 'none',
      krugerStrict: 'strict_normal'
    },
    vitality: 'live',
    classification: 'progressive',
    isHyperactivated: false,
    sdf: {
      fragmented: false,
      haloSized: 14.0,
      dfi: 9.8
    }
  },
  {
    id: "POR-SPM-03",
    path: Array.from({ length: 40 }, (_, i) => ({
      x: 180 + Math.sin(i * 0.7) * 5,
      y: 230 + i * 0.4,
      z: 0,
      t: i * 0.016
    })),
    vcl: 44.0,
    vsl: 14.8,
    vap: 22.0,
    lin: 0.34,
    str: 0.67,
    wob: 0.50,
    alh: 1.80,
    bcf: 11.0,
    mad: 35.0,
    morphometry: {
      area: 37.5,
      perimeter: 27.0,
      length: 9.6,
      width: 4.8,
      circularity: 0.71,
      elongation: 1.44,
      lengthWidthRatio: 2.0,
      acrosomeAreaPercent: 30.0
    },
    morphology: {
      head: 'pyriform',
      vacuoles: 'absent',
      acrosome: 'abnormal',
      midpiece: 'cytoplasmic_droplet',
      tail: 'coiled',
      droplet: 'distal',
      krugerStrict: 'abnormal'
    },
    vitality: 'live',
    classification: 'non-progressive',
    isHyperactivated: false,
    sdf: {
      fragmented: false,
      haloSized: 10.8,
      dfi: 15.2
    }
  }
];

// 5. OVINE (RAM) - Grand Champion "Merino Grand Champion #09"
const ovineSpermatozoa: SpermData[] = [
  {
    id: "OVI-SPM-01",
    path: Array.from({ length: 40 }, (_, i) => ({
      x: 120 + Math.sin(i * 0.52) * 32 + i * 3.2,
      y: 100 + Math.cos(i * 0.52) * 26 + i * 2.6,
      z: Math.sin(i * 0.35) * 5.5,
      t: i * 0.016
    })),
    vcl: 174.5,
    vsl: 118.5,
    vap: 135.2,
    lin: 0.68,
    str: 0.88,
    wob: 0.77,
    alh: 5.10,
    bcf: 36.2,
    mad: 8.5,
    morphometry: {
      area: 30.5,
      perimeter: 23.0,
      length: 8.2,
      width: 4.1,
      circularity: 0.85,
      elongation: 1.18,
      lengthWidthRatio: 2.0,
      acrosomeAreaPercent: 65.0
    },
    morphology: {
      head: 'normal',
      vacuoles: 'absent',
      acrosome: 'normal',
      midpiece: 'normal',
      tail: 'normal',
      droplet: 'none',
      krugerStrict: 'strict_normal'
    },
    vitality: 'live',
    classification: 'progressive',
    isHyperactivated: true,
    hyperactivationType: 'linear_whiplash',
    sdf: {
      fragmented: false,
      haloSized: 17.5,
      dfi: 4.8
    }
  },
  {
    id: "OVI-SPM-02",
    path: Array.from({ length: 40 }, (_, i) => ({
      x: 260 + Math.sin(i * 0.48) * 28 + i * 2.8,
      y: 160 + Math.cos(i * 0.48) * 23 + i * 2.2,
      z: Math.sin(i * 0.3) * 4.8,
      t: i * 0.016
    })),
    vcl: 165.2,
    vsl: 111.0,
    vap: 127.5,
    lin: 0.67,
    str: 0.87,
    wob: 0.77,
    alh: 4.75,
    bcf: 34.0,
    mad: 9.2,
    morphometry: {
      area: 30.0,
      perimeter: 22.6,
      length: 8.1,
      width: 4.0,
      circularity: 0.84,
      elongation: 1.20,
      lengthWidthRatio: 2.02,
      acrosomeAreaPercent: 63.5
    },
    morphology: {
      head: 'normal',
      vacuoles: 'absent',
      acrosome: 'normal',
      midpiece: 'normal',
      tail: 'normal',
      droplet: 'none',
      krugerStrict: 'strict_normal'
    },
    vitality: 'live',
    classification: 'progressive',
    isHyperactivated: false,
    sdf: {
      fragmented: false,
      haloSized: 16.8,
      dfi: 5.5
    }
  },
  {
    id: "OVI-SPM-03",
    path: Array.from({ length: 40 }, (_, i) => ({
      x: 170 + Math.sin(i * 0.95) * 4,
      y: 220 + i * 0.3,
      z: 0,
      t: i * 0.016
    })),
    vcl: 34.5,
    vsl: 9.8,
    vap: 16.0,
    lin: 0.28,
    str: 0.61,
    wob: 0.46,
    alh: 1.40,
    bcf: 9.2,
    mad: 40.2,
    morphometry: {
      area: 33.2,
      perimeter: 24.8,
      length: 8.8,
      width: 4.4,
      circularity: 0.74,
      elongation: 1.38,
      lengthWidthRatio: 2.0,
      acrosomeAreaPercent: 38.0
    },
    morphology: {
      head: 'large',
      vacuoles: 'absent',
      acrosome: 'abnormal',
      midpiece: 'bent',
      tail: 'multiple',
      droplet: 'proximal',
      krugerStrict: 'abnormal'
    },
    vitality: 'dead',
    classification: 'immotile',
    isHyperactivated: false,
    sdf: {
      fragmented: true,
      haloSized: 3.5,
      dfi: 78.5
    }
  }
];

// Helper to create Multi-FOV structure
function createMultiFovData(meanConc: number, meanProg: number, meanMorph: number): MultiFOVComposite {
  const fields = [
    {
      fieldIndex: 1,
      timestamp: new Date().toISOString(),
      spermCount: Math.round(meanConc * 0.28),
      concentration: Number((meanConc * 0.98).toFixed(1)),
      totalMotility: Number((meanProg * 1.22).toFixed(1)),
      progressiveMotility: Number(meanProg.toFixed(1)),
      normalMorphology: Number(meanMorph.toFixed(1)),
      avgVcl: 135.2
    },
    {
      fieldIndex: 2,
      timestamp: new Date().toISOString(),
      spermCount: Math.round(meanConc * 0.30),
      concentration: Number((meanConc * 1.03).toFixed(1)),
      totalMotility: Number((meanProg * 1.25).toFixed(1)),
      progressiveMotility: Number((meanProg * 1.02).toFixed(1)),
      normalMorphology: Number((meanMorph * 0.98).toFixed(1)),
      avgVcl: 138.6
    },
    {
      fieldIndex: 3,
      timestamp: new Date().toISOString(),
      spermCount: Math.round(meanConc * 0.29),
      concentration: Number((meanConc * 0.99).toFixed(1)),
      totalMotility: Number((meanProg * 1.20).toFixed(1)),
      progressiveMotility: Number((meanProg * 0.97).toFixed(1)),
      normalMorphology: Number((meanMorph * 1.01).toFixed(1)),
      avgVcl: 132.4
    }
  ];

  return {
    fields,
    totalFieldsAnalyzed: 3,
    totalSpermTracked: fields.reduce((acc, f) => acc + f.spermCount, 0),
    meanConcentration: meanConc,
    semConcentration: Number((meanConc * 0.022).toFixed(1)),
    cvConcentration: 4.8, // Excellent CV < 10%
    meanTotalMotility: Number((meanProg * 1.22).toFixed(1)),
    meanProgressiveMotility: meanProg,
    meanNormalMorphology: meanMorph
  };
}

export const VIRTUAL_ANIMALS: Record<'bovine' | 'equine' | 'canine' | 'porcine' | 'ovine', VirtualAnimalRecord> = {
  bovine: {
    id: 'bovine',
    species: 'Bovine',
    speciesLabel: 'Bovine (Bull)',
    commonName: 'Simmental / Black Angus Bull',
    patientId: 'BOV-9872',
    animalName: 'Black Angus Supreme #402',
    breed: 'Simmental × Angus Pedigree Sire',
    age: '3.8 Years',
    tagOrReg: 'TAG-US-89102-ANG',
    ownerFacility: 'Prairie Genetics CryoBank & Andrology Center',
    avatarIcon: '🐂',
    themeColor: {
      primary: '#10b981', // Emerald
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      gradient: 'from-emerald-500 to-teal-600'
    },
    macroscopic: {
      volume: 6.5,
      ph: 6.8,
      appearance: 'Opalescent Creamy White',
      liquefaction: 'Complete (< 15 min)',
      viscosity: 'normal',
      collectionMethod: 'Artificial Vagina'
    },
    veterinarySft: {
      totalEjaculateSperm: '3770.0', // 6.5mL * 580 M/mL
      totalProgressiveSperm: '2352.5', // 3770 * 62.4%
      strawYield: 188, // @ 20M motile sperm / 0.25mL straw
      targetDoseMotile: 20,
      standardStrawSize: '0.25 mL French Straw',
      breedingSoundnessClassification: 'SATISFACTORY BREEDER',
      recommendedExtender: 'Tris-Citric-Egg Yolk (20%) or Optixcell Soybean Lecithin',
      cryoThawRecoveryExpected: '55 - 62% Post-Thaw Progressive Motility',
      clinicalPrognosis: 'Superior genetic donor. Excellent membrane cryotolerance with minimal acrosome reaction pre-freeze.'
    },
    clinicianRemarks: 'Specimen exhibits top-tier andrological markers. Concentration (580 M/mL) and progressive motility (62.4%) substantially exceed minimum SFT bull breeding soundness thresholds. DNA fragmentation is exceptionally low (7.2%). Fully approved for straw production and commercial pedigree distribution.',
    aiDiagnosticNarrative: 'Comprehensive CASA evaluation of Bovine specimen BOV-9872 confirms exceptional reproductive vigor. Sperm kinematics present strong linearity (LIN 59.5%, STR 85.6%) and high lateral head oscillation (ALH 4.35 µm). Kruger strict morphology indicates 78.0% normal forms with high acrosomal cap integrity (58.5% surface). Cryotolerance is classified as Excellent.',
    results: {
      timestamp: new Date().toISOString(),
      patientId: 'BOV-9872',
      species: 'Bovine',
      whoEdition: '6th',
      settings: {
        fps: 60,
        micronsPerPixel: 0.65,
        chamberPreset: 'Makler Chamber (10 µm)',
        chamberDepth: 10,
        profile: SPECIES_PROFILES['Bovine']
      },
      spermatozoa: bovineSpermatozoa,
      multiFov: createMultiFovData(580.0, 62.4, 78.0),
      summary: {
        totalCount: 160,
        totalCountPerEjaculate: 3770.0,
        concentration: 580.0,
        leukocytes: 0.1,
        vitality: {
          live: 86.5,
          dead: 13.5,
          total: 100
        },
        motility: {
          progressive: 62.4,
          nonProgressive: 16.1,
          immotile: 21.5,
          total: 78.5
        },
        kinematics: {
          avgVcl: 142.5,
          avgVsl: 84.8,
          avgVap: 101.2,
          avgLin: 0.59,
          avgStr: 0.85,
          avgWob: 0.70,
          avgAlh: 4.25,
          avgBcf: 28.6,
          hyperactivation: {
            count: 14,
            percentage: 8.75
          }
        },
        morphology: {
          normal: 78.0,
          abnormal: 22.0,
          krugerStrictNormal: 78.0,
          avgArea: 33.0,
          tzi: 1.14,
          mai: 1.08,
          sdi: 1.12,
          headDefects: {
            large: 2.0,
            small: 1.2,
            amorphous: 3.5,
            pyriform: 2.8,
            tapered: 2.1,
            round: 0.8,
            vacuolated: 1.5,
            double: 0.2
          },
          midpieceDefects: {
            thick: 1.8,
            bent: 3.0,
            asymmetric: 1.4,
            droplet: 1.2
          },
          tailDefects: {
            short: 1.0,
            coiled: 2.0,
            bent: 2.4,
            multiple: 0.4,
            broken: 0.8
          },
          acrosomeDefects: 2.0,
          cytoplasmicDroplets: 1.2
        },
        sdf: {
          dfi: 7.2,
          fragmentedCount: 12,
          totalCount: 160
        },
        interpretation: {
          status: 'normal',
          comments: [
            "Sperm concentration (580.0 M/mL) and total motility (78.5%) exceed SFT thresholds.",
            "Normal Kruger morphology (78.0%) with pristine acrosomal coverage.",
            "DNA Fragmentation Index (7.2% DFI) demonstrates outstanding chromatin stability."
          ],
          recommendations: [
            "Approved for immediate extension, freezing, and 0.25 mL French straw cryostorage.",
            "Suggested dilution target: 20 Million progressively motile sperm per AI unit."
          ]
        }
      }
    }
  },

  equine: {
    id: 'equine',
    species: 'Equine',
    speciesLabel: 'Equine (Stallion)',
    commonName: 'Royal Andalusian Stallion',
    patientId: 'EQU-3421',
    animalName: 'Royal Andalusian Pride #12',
    breed: 'Pura Raza Española (Andalusian Stud)',
    age: '5.2 Years',
    tagOrReg: 'UELN-7240150901234',
    ownerFacility: 'Iberian Equine Reproductive & Sports Genetics',
    avatarIcon: '🐎',
    themeColor: {
      primary: '#3b82f6', // Blue
      border: 'border-blue-500/30',
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      gradient: 'from-blue-500 to-indigo-600'
    },
    macroscopic: {
      volume: 48.0,
      ph: 7.4,
      appearance: 'Translucent Gray-White',
      liquefaction: 'Rapid (< 5 min)',
      viscosity: 'normal',
      collectionMethod: 'Artificial Vagina'
    },
    veterinarySft: {
      totalEjaculateSperm: '6480.0', // 48mL * 135 M/mL
      totalProgressiveSperm: '3661.2', // 6480 * 56.5%
      strawYield: 7, // @ 500M progressive motile sperm for fresh/cooled AI dose
      targetDoseMotile: 500,
      standardStrawSize: '0.50 mL Straw / 50 mL Cooled Syringe',
      breedingSoundnessClassification: 'SATISFACTORY BREEDER',
      recommendedExtender: 'INRA96 with Casein Phosphopeptides / BotuCrio',
      cryoThawRecoveryExpected: '45 - 50% Post-Thaw Progressive Motility',
      clinicalPrognosis: 'Stallion qualified for cooled semen shipping across 24h Equitainer transport and frozen bank.'
    },
    clinicianRemarks: 'High ejaculate volume (48.0 mL) characteristic of prime equine collections. Progressive motility at 56.5% with strong straight-line speed. High acrosome integrity and acceptable chromatin fragmentation (12.0% DFI). Ready for fresh AI or refrigerated cooled transport.',
    aiDiagnosticNarrative: 'Equine CASA assessment for Stallion EQU-3421 demonstrates healthy reproductive parameters. High volume output results in over 3.6 Billion progressively motile cells. Flagellar beat frequency averages 25.8 Hz with low incidence of midpiece retention. SFT breeding classification is Satisfactory.',
    results: {
      timestamp: new Date().toISOString(),
      patientId: 'EQU-3421',
      species: 'Equine',
      whoEdition: '6th',
      settings: {
        fps: 60,
        micronsPerPixel: 0.65,
        chamberPreset: 'Leja Standard Slide (20 µm)',
        chamberDepth: 20,
        profile: SPECIES_PROFILES['Equine']
      },
      spermatozoa: equineSpermatozoa,
      multiFov: createMultiFovData(135.0, 56.5, 62.5),
      summary: {
        totalCount: 140,
        totalCountPerEjaculate: 6480.0,
        concentration: 135.0,
        leukocytes: 0.2,
        vitality: {
          live: 79.0,
          dead: 21.0,
          total: 100
        },
        motility: {
          progressive: 56.5,
          nonProgressive: 15.5,
          immotile: 28.0,
          total: 72.0
        },
        kinematics: {
          avgVcl: 124.8,
          avgVsl: 70.2,
          avgVap: 84.0,
          avgLin: 0.56,
          avgStr: 0.84,
          avgWob: 0.67,
          avgAlh: 3.75,
          avgBcf: 25.8,
          hyperactivation: {
            count: 7,
            percentage: 5.0
          }
        },
        morphology: {
          normal: 62.5,
          abnormal: 37.5,
          krugerStrictNormal: 62.5,
          avgArea: 28.4,
          tzi: 1.28,
          mai: 1.18,
          sdi: 1.22,
          headDefects: {
            large: 3.1,
            small: 2.2,
            amorphous: 4.8,
            pyriform: 3.9,
            tapered: 4.5,
            round: 1.2,
            vacuolated: 2.1,
            double: 0.3
          },
          midpieceDefects: {
            thick: 3.5,
            bent: 5.2,
            asymmetric: 2.8,
            droplet: 2.5
          },
          tailDefects: {
            short: 1.8,
            coiled: 4.2,
            bent: 4.6,
            multiple: 0.8,
            broken: 1.2
          },
          acrosomeDefects: 4.0,
          cytoplasmicDroplets: 2.5
        },
        sdf: {
          dfi: 12.0,
          fragmentedCount: 17,
          totalCount: 140
        },
        interpretation: {
          status: 'normal',
          comments: [
            "Total ejaculate yield of 3.66 Billion motile sperm ensures high single-insemination conception rates.",
            "Kinematics LIN (56.0%) and BCF (25.8 Hz) confirm physiological swimming vigor.",
            "Chromatin integrity (12.0% DFI) is within optimal fertile stallion parameters (<15%)."
          ],
          recommendations: [
            "Extend 1:1 to 1:3 with INRA96 extender within 15 minutes of collection.",
            "Standard insemination dose: 500 Million progressively motile sperm per mare."
          ]
        }
      }
    }
  },

  canine: {
    id: 'canine',
    species: 'Canine',
    speciesLabel: 'Canine (Stud Dog)',
    commonName: 'German Shepherd Champion Stud',
    patientId: 'CAN-7104',
    animalName: 'Zeus vom Schwarzwald',
    breed: 'German Shepherd Dog (GSD Working Line)',
    age: '4.0 Years',
    tagOrReg: 'AKC-DN67891001-CH',
    ownerFacility: 'Bavarian K9 Performance Andrology & Cryogenics',
    avatarIcon: '🐕',
    themeColor: {
      primary: '#f59e0b', // Amber
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      gradient: 'from-amber-500 to-orange-600'
    },
    macroscopic: {
      volume: 3.2,
      ph: 6.6,
      appearance: 'Pristine Milky White (2nd Fraction)',
      liquefaction: 'Instantaneous (< 1 min)',
      viscosity: 'normal',
      collectionMethod: 'Manual Stimulation'
    },
    veterinarySft: {
      totalEjaculateSperm: '784.0', // 3.2mL * 245 M/mL
      totalProgressiveSperm: '599.8', // 784 * 76.5%
      strawYield: 4, // @ 150M motile sperm / TCI surgical AI dose
      targetDoseMotile: 150,
      standardStrawSize: '0.50 mL Cryo Straw / 5 mL TCI Vial',
      breedingSoundnessClassification: 'SUPERIOR AI DONOR',
      recommendedExtender: 'CaniPro Freeze with Glycerol & Equex STM paste',
      cryoThawRecoveryExpected: '65 - 72% Post-Thaw Motility Retention',
      clinicalPrognosis: 'Phenomenal stud dog quality. High curvilinear speed and near-zero teratospermic deformities.'
    },
    clinicianRemarks: 'Outstanding canine semen sample. Concentration of 245.0 M/mL with rapid progressive motility (76.5%) and elevated VCL (158.0 µm/s). Normal Kruger morphology exceeds 84.5%. Highly recommended for Transcervical Insemination (TCI) or cryopreservation.',
    aiDiagnosticNarrative: 'Canine CASA analysis for German Shepherd stud CAN-7104 demonstrates top-percentile fertility metrics. Over 76% of spermatozoa exhibit vigorous progressive trajectory with low lateral wobble (WOB 75.4%). DNA fragmentation is minimal (5.4% DFI). SFT rating: Superior Stud.',
    results: {
      timestamp: new Date().toISOString(),
      patientId: 'CAN-7104',
      species: 'Canine',
      whoEdition: '6th',
      settings: {
        fps: 60,
        micronsPerPixel: 0.65,
        chamberPreset: 'Makler Chamber (10 µm)',
        chamberDepth: 10,
        profile: SPECIES_PROFILES['Canine']
      },
      spermatozoa: canineSpermatozoa,
      multiFov: createMultiFovData(245.0, 76.5, 84.5),
      summary: {
        totalCount: 180,
        totalCountPerEjaculate: 784.0,
        concentration: 245.0,
        leukocytes: 0.05,
        vitality: {
          live: 92.0,
          dead: 8.0,
          total: 100
        },
        motility: {
          progressive: 76.5,
          nonProgressive: 11.5,
          immotile: 12.0,
          total: 88.0
        },
        kinematics: {
          avgVcl: 158.4,
          avgVsl: 102.5,
          avgVap: 118.6,
          avgLin: 0.65,
          avgStr: 0.86,
          avgWob: 0.75,
          avgAlh: 4.50,
          avgBcf: 32.5,
          hyperactivation: {
            count: 20,
            percentage: 11.1
          }
        },
        morphology: {
          normal: 84.5,
          abnormal: 15.5,
          krugerStrictNormal: 84.5,
          avgArea: 24.4,
          tzi: 1.08,
          mai: 1.05,
          sdi: 1.06,
          headDefects: {
            large: 1.2,
            small: 0.8,
            amorphous: 2.1,
            pyriform: 1.5,
            tapered: 1.4,
            round: 0.6,
            vacuolated: 0.9,
            double: 0.1
          },
          midpieceDefects: {
            thick: 1.1,
            bent: 1.8,
            asymmetric: 1.0,
            droplet: 0.8
          },
          tailDefects: {
            short: 0.6,
            coiled: 1.2,
            bent: 1.5,
            multiple: 0.2,
            broken: 0.5
          },
          acrosomeDefects: 1.2,
          cytoplasmicDroplets: 0.8
        },
        sdf: {
          dfi: 5.4,
          fragmentedCount: 10,
          totalCount: 180
        },
        interpretation: {
          status: 'normal',
          comments: [
            "Exceptional sperm concentration and 88.0% total motility.",
            "Strict Kruger morphology (84.5% normal) far exceeds 60% canine breeding threshold.",
            "Extremely low DFI (5.4%) provides optimal pregnancy and litter size outcomes."
          ],
          recommendations: [
            "Ideal candidate for fresh artificial breeding, cooled 10-day transport, or liquid nitrogen storage.",
            "Recommended dose: 150 Million progressively motile sperm for TCI."
          ]
        }
      }
    }
  },

  porcine: {
    id: 'porcine',
    species: 'Porcine',
    speciesLabel: 'Porcine (Boar)',
    commonName: 'Purebred Duroc Sire',
    patientId: 'POR-5583',
    animalName: 'Duroc Elite Sire #88',
    breed: 'Purebred Duroc Line',
    age: '2.5 Years',
    tagOrReg: 'SWINE-PIG-99882-DR',
    ownerFacility: 'Midwest Porcine Artificial Insemination Consortium',
    avatarIcon: '🐖',
    themeColor: {
      primary: '#ec4899', // Pink
      border: 'border-pink-500/30',
      bg: 'bg-pink-500/10',
      text: 'text-pink-400',
      gradient: 'from-pink-500 to-rose-600'
    },
    macroscopic: {
      volume: 185.0,
      ph: 7.3,
      appearance: 'Chalky Gray-White (Gel-free fraction)',
      liquefaction: 'Complete (< 20 min)',
      viscosity: 'normal',
      collectionMethod: 'Manual Stimulation'
    },
    veterinarySft: {
      totalEjaculateSperm: '48100.0', // 185mL * 260 M/mL = 48.1 Billion cells
      totalProgressiveSperm: '32708.0', // 48100 * 68.0% = 32.7 Billion progressive
      strawYield: 24, // @ 2.0 Billion motile sperm / 80mL AI bottle
      targetDoseMotile: 2000,
      standardStrawSize: '80 - 100 mL Fresh AI Dose Bottle',
      breedingSoundnessClassification: 'SUPERIOR AI DONOR',
      recommendedExtender: 'BTS (Beltsville Thawing Solution) / Androstar Plus',
      cryoThawRecoveryExpected: 'Fresh extended storage 5-7 days @ 17°C',
      clinicalPrognosis: 'Massive fecundity output yielding 24+ sow insemination doses from a single collection.'
    },
    clinicianRemarks: 'High volume boar ejaculate (185.0 mL gel-free). Massive total cell yield of 48.1 Billion sperm with 68.0% progressive motility. Low cytoplasmic droplet rate (<2.5%) confirms complete epididymal maturation. Excellent candidate for immediate BTS extension into 24 commercial sow doses.',
    aiDiagnosticNarrative: 'Porcine CASA evaluation for Duroc boar POR-5583 reveals exemplary commercial fecundity. Sperm velocity metrics (VCL 128.2 µm/s, VSL 75.8 µm/s) correlate with high sow farrowing rates. Chromatin stability is high (9.0% DFI). SFT classification: High-Index Breeding Sire.',
    results: {
      timestamp: new Date().toISOString(),
      patientId: 'POR-5583',
      species: 'Porcine',
      whoEdition: '6th',
      settings: {
        fps: 60,
        micronsPerPixel: 0.65,
        chamberPreset: 'Makler Chamber (10 µm)',
        chamberDepth: 10,
        profile: SPECIES_PROFILES['Porcine']
      },
      spermatozoa: porcineSpermatozoa,
      multiFov: createMultiFovData(260.0, 68.0, 74.0),
      summary: {
        totalCount: 150,
        totalCountPerEjaculate: 48100.0,
        concentration: 260.0,
        leukocytes: 0.15,
        vitality: {
          live: 85.0,
          dead: 15.0,
          total: 100
        },
        motility: {
          progressive: 68.0,
          nonProgressive: 14.5,
          immotile: 17.5,
          total: 82.5
        },
        kinematics: {
          avgVcl: 128.2,
          avgVsl: 75.8,
          avgVap: 89.6,
          avgLin: 0.59,
          avgStr: 0.85,
          avgWob: 0.70,
          avgAlh: 3.95,
          avgBcf: 26.8,
          hyperactivation: {
            count: 10,
            percentage: 6.67
          }
        },
        morphology: {
          normal: 74.0,
          abnormal: 26.0,
          krugerStrictNormal: 74.0,
          avgArea: 33.8,
          tzi: 1.19,
          mai: 1.12,
          sdi: 1.15,
          headDefects: {
            large: 2.5,
            small: 1.8,
            amorphous: 3.9,
            pyriform: 3.1,
            tapered: 2.8,
            round: 1.0,
            vacuolated: 1.8,
            double: 0.2
          },
          midpieceDefects: {
            thick: 2.4,
            bent: 3.8,
            asymmetric: 1.9,
            droplet: 2.2
          },
          tailDefects: {
            short: 1.2,
            coiled: 2.8,
            bent: 3.1,
            multiple: 0.5,
            broken: 0.9
          },
          acrosomeDefects: 2.8,
          cytoplasmicDroplets: 2.2
        },
        sdf: {
          dfi: 9.0,
          fragmentedCount: 14,
          totalCount: 150
        },
        interpretation: {
          status: 'normal',
          comments: [
            "Total ejaculate yield of 48.1 Billion sperm provides superior commercial output.",
            "Progressive motility (68.0%) and morphology (74.0%) exceed commercial boar standards.",
            "Chromatin integrity (9.0% DFI) ensures high farrowing rates and healthy litter sizes."
          ],
          recommendations: [
            "Dilute with Androstar Plus or BTS extender at 17°C within 30 minutes of collection.",
            "Package in 80 mL doses containing 2.0 - 2.5 Billion sperm per unit."
          ]
        }
      }
    }
  },

  ovine: {
    id: 'ovine',
    species: 'Ovine',
    speciesLabel: 'Ovine (Ram)',
    commonName: 'Superfine Merino Ram',
    patientId: 'OVI-2290',
    animalName: 'Merino Grand Champion #09',
    breed: 'Australian Superfine Merino',
    age: '3.2 Years',
    tagOrReg: 'AUST-SHEEP-22901-MER',
    ownerFacility: 'Australasian Theriogenology & Merino Breeding Station',
    avatarIcon: '🐑',
    themeColor: {
      primary: '#8b5cf6', // Purple
      border: 'border-purple-500/30',
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      gradient: 'from-purple-500 to-violet-600'
    },
    macroscopic: {
      volume: 1.1,
      ph: 6.9,
      appearance: 'Dense Creamy Viscous',
      liquefaction: 'Immediate (< 3 min)',
      viscosity: 'moderate',
      collectionMethod: 'Artificial Vagina'
    },
    veterinarySft: {
      totalEjaculateSperm: '2695.0', // 1.1mL * 2450 M/mL
      totalProgressiveSperm: '1994.3', // 2695 * 74.0%
      strawYield: 26, // @ 100M sperm / 0.25mL cervical/laparoscopic straw
      targetDoseMotile: 100,
      standardStrawSize: '0.25 mL French Cryo Straw',
      breedingSoundnessClassification: 'SUPERIOR AI DONOR',
      recommendedExtender: 'Tris-Fructose-Citric Acid Glycerol (6%) Extender',
      cryoThawRecoveryExpected: '58 - 65% Post-Thaw Progressive Motility',
      clinicalPrognosis: 'Hyper-concentrated ram semen with exceptional wave motion and cryopreservation recovery.'
    },
    clinicianRemarks: 'Remarkably concentrated ram semen sample (2450.0 M/mL). Wave motion evaluation score is 5/5 (vigorous swirling). Progressive motility is 74.0% with straight-line velocity exceeding 114.0 µm/s. Normal morphology at 88.0% and DFI at 4.8%. Approved for laparoscopic AI breeding programs.',
    aiDiagnosticNarrative: 'Ovine CASA evaluation for Superfine Merino ram OVI-2290 indicates premier reproductive genetics. Very high sperm concentration combined with 74.0% progressive motility produces nearly 2 Billion progressive cells in a 1.1 mL ejaculate. Low fragmentation (4.8%) confirms chromatin resistance to freezing stress.',
    results: {
      timestamp: new Date().toISOString(),
      patientId: 'OVI-2290',
      species: 'Ovine',
      whoEdition: '6th',
      settings: {
        fps: 60,
        micronsPerPixel: 0.65,
        chamberPreset: 'Makler Chamber (10 µm)',
        chamberDepth: 10,
        profile: SPECIES_PROFILES['Ovine']
      },
      spermatozoa: ovineSpermatozoa,
      multiFov: createMultiFovData(2450.0, 74.0, 88.0),
      summary: {
        totalCount: 210,
        totalCountPerEjaculate: 2695.0,
        concentration: 2450.0,
        leukocytes: 0.05,
        vitality: {
          live: 90.0,
          dead: 10.0,
          total: 100
        },
        motility: {
          progressive: 74.0,
          nonProgressive: 12.0,
          immotile: 14.0,
          total: 86.0
        },
        kinematics: {
          avgVcl: 169.8,
          avgVsl: 114.2,
          avgVap: 131.0,
          avgLin: 0.67,
          avgStr: 0.87,
          avgWob: 0.77,
          avgAlh: 4.95,
          avgBcf: 35.1,
          hyperactivation: {
            count: 30,
            percentage: 14.3
          }
        },
        morphology: {
          normal: 88.0,
          abnormal: 12.0,
          krugerStrictNormal: 88.0,
          avgArea: 30.2,
          tzi: 1.06,
          mai: 1.04,
          sdi: 1.05,
          headDefects: {
            large: 1.0,
            small: 0.6,
            amorphous: 1.8,
            pyriform: 1.2,
            tapered: 1.1,
            round: 0.4,
            vacuolated: 0.7,
            double: 0.1
          },
          midpieceDefects: {
            thick: 0.9,
            bent: 1.5,
            asymmetric: 0.8,
            droplet: 0.6
          },
          tailDefects: {
            short: 0.5,
            coiled: 1.0,
            bent: 1.2,
            multiple: 0.2,
            broken: 0.4
          },
          acrosomeDefects: 1.0,
          cytoplasmicDroplets: 0.6
        },
        sdf: {
          dfi: 4.8,
          fragmentedCount: 10,
          totalCount: 210
        },
        interpretation: {
          status: 'normal',
          comments: [
            "Ultra-dense concentration (2450.0 M/mL) with rapid progressive speed (VSL 114.2 µm/s).",
            "Highest morphology purity (88.0% normal) and lowest deformity index (TZI 1.06).",
            "Chromatin fragmentation index (4.8% DFI) indicates supreme cryotolerance."
          ],
          recommendations: [
            "Perform two-step dilution with Tris-Fructose-Glycerol extender.",
            "Package at 100 Million sperm per 0.25 mL straw for laparoscopic intrauterine AI."
          ]
        }
      }
    }
  }
};

export const VIRTUAL_ANIMAL_KEYS: ('bovine' | 'equine' | 'canine' | 'porcine' | 'ovine')[] = [
  'bovine',
  'equine',
  'canine',
  'porcine',
  'ovine'
];
