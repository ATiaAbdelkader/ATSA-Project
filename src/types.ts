export interface SpermData {
  id: string;
  path: { x: number; y: number; z?: number; t: number }[];
  // Kinematics (OpenCASA Standard)
  vcl: number; // Curvilinear Velocity (µm/s)
  vsl: number; // Straight-line Velocity (µm/s)
  vap: number; // Average Path Velocity (µm/s)
  lin: number; // Linearity (VSL/VCL)
  str: number; // Straightness (VSL/VAP)
  wob: number; // Wobble (VAP/VCL)
  alh: number; // Amplitude of Lateral Head Displacement (µm)
  bcf: number; // Beat Cross Frequency (Hz)
  mad: number; // Mean Angular Displacement (deg)
  
  // Morphometry (OpenCASA Standard)
  morphometry: {
    area: number; // µm²
    perimeter: number; // µm
    length: number; // µm
    width: number; // µm
    circularity: number;
    elongation: number;
    lengthWidthRatio: number;
    acrosomeAreaPercent: number;
  };
  
  morphology: {
    head: 'normal' | 'large' | 'small' | 'amorphous' | 'pyriform' | 'tapered' | 'round' | 'vacuolated' | 'double';
    vacuoles: 'present' | 'absent';
    acrosome: 'normal' | 'abnormal' | 'detached';
    midpiece: 'normal' | 'thick' | 'bent' | 'asymmetric' | 'cytoplasmic_droplet';
    tail: 'normal' | 'short' | 'coiled' | 'multiple' | 'bent' | 'broken';
    droplet: 'none' | 'proximal' | 'distal';
    krugerStrict: 'strict_normal' | 'borderline' | 'abnormal';
  };
  
  vitality: 'live' | 'dead';
  
  classification: 'progressive' | 'non-progressive' | 'immotile';
  isHyperactivated: boolean;
  hyperactivationType?: 'star_spin' | 'linear_whiplash' | 'transitional' | 'none';
  
  // Sperm DNA Fragmentation (SDF)
  sdf: {
    fragmented: boolean;
    haloSized: number; // µm
    dfi: number; // DNA Fragmentation Index (0-100)
  };
}

export interface SpeciesProfile {
  name: string;
  whoEdition?: '5th' | '6th';
  minConcentration: number;
  minTotalMotility: number;
  minProgressiveMotility: number;
  minNormalMorphology: number;
  minVitality: number;
  maxLeukocytes: number;
  minVolume?: number;
  minTotalCountPerEjaculate?: number;
}

export interface MacroEvaluation {
  volume: number; // mL (Normal WHO 5th: >=1.5mL, WHO 6th: >=1.4mL)
  ph: number; // (Normal >= 7.2)
  liquefactionTime: number; // minutes (Normal <= 60 min)
  viscosity: 'normal' | 'moderate' | 'high';
  appearance: 'normal_opaque' | 'translucent' | 'yellowish' | 'red_brown';
  agglutination: 'none' | 'isolated' | 'moderate' | 'severe';
  abstinenceDays?: number;
}

export interface HistogramBin {
  binStart: number;
  binEnd: number;
  label: string;
  count: number;
  percentage: number;
}

export interface KinematicDistributions {
  vcl: HistogramBin[];
  vsl: HistogramBin[];
  vap: HistogramBin[];
  alh: HistogramBin[];
  bcf: HistogramBin[];
  lin: HistogramBin[];
  str: HistogramBin[];
  wob: HistogramBin[];
}

export interface FieldOfViewData {
  fieldIndex: number;
  timestamp: string;
  spermCount: number;
  concentration: number;
  totalMotility: number;
  progressiveMotility: number;
  normalMorphology: number;
  avgVcl: number;
  snapshotUrl?: string;
}

export interface MultiFOVComposite {
  fields: FieldOfViewData[];
  totalFieldsAnalyzed: number;
  totalSpermTracked: number;
  meanConcentration: number;
  semConcentration: number; // Standard Error of the Mean
  cvConcentration: number; // Coefficient of Variation (%)
  meanTotalMotility: number;
  meanProgressiveMotility: number;
  meanNormalMorphology: number;
}

export interface AnalysisResult {
  timestamp: string;
  patientId: string;
  species: string;
  whoEdition?: '5th' | '6th';
  macro?: MacroEvaluation;
  multiFov?: MultiFOVComposite;
  settings: {
    fps: number;
    micronsPerPixel: number;
    profile: SpeciesProfile;
    chamberDepth?: number;
    chamberPreset?: string;
    whoStandard?: '5th' | '6th';
  };
  summary: {
    totalCount: number;
    totalCountPerEjaculate?: number; // Volume * Concentration (Million)
    concentration: number; // million/ml
    leukocytes: number; // million/ml
    vitality: {
      live: number;
      dead: number;
      total: number;
    };
    motility: {
      progressive: number;
      nonProgressive: number;
      immotile: number;
      total: number;
    };
    kinematics: {
      avgVcl: number;
      avgVsl: number;
      avgVap: number;
      avgLin: number;
      avgStr: number;
      avgWob: number;
      avgAlh: number;
      avgBcf: number;
      hyperactivation: {
        count: number;
        percentage: number;
        starSpinCount?: number;
        linearWhiplashCount?: number;
      };
      distributions?: KinematicDistributions;
    };
    morphology: {
      normal: number;
      abnormal: number;
      krugerStrictNormal: number; // Strict Kruger criteria %
      avgArea: number;
      avgLength?: number;
      avgWidth?: number;
      avgLengthWidthRatio?: number;
      tzi: number; // Teratozoospermia Index
      mai: number; // Multiple Anomalies Index
      sdi: number; // Sperm Deformity Index
      headDefects: {
        large: number;
        small: number;
        amorphous: number;
        pyriform: number;
        tapered: number;
        round: number;
        vacuolated?: number;
        double?: number;
      };
      midpieceDefects: {
        thick: number;
        bent: number;
        asymmetric: number;
        droplet?: number;
      };
      tailDefects: {
        short: number;
        coiled: number;
        multiple: number;
        bent: number;
        broken?: number;
      };
      acrosomeDefects: number;
      cytoplasmicDroplets: number;
    };
    sdf: {
      dfi: number; // Overall DNA Fragmentation Index (%)
      fragmentedCount: number;
      totalCount: number;
      category?: 'excellent' | 'good_fair' | 'poor'; // <15% excellent, 15-25% fair, >25% poor
    };
    interpretation?: {
      status: 'normal' | 'borderline' | 'abnormal';
      comments: string[];
      recommendations: string[];
      whoEditionUsed?: '5th' | '6th';
    };
    visionInsights?: {
      concentration?: string;
      motility?: {
        progressive: string;
        nonProgressive: string;
        immotile: string;
      };
      morphology?: {
        normal: string;
        defects: {
          head: string[];
          midpiece: string[];
          tail: string[];
        };
      };
      observations?: string;
    };
  };
  spermatozoa: SpermData[];
}

export type AppState = 'landing' | 'login' | 'dashboard' | 'analysis' | 'help' | 'history' | 'inventory' | 'qc';

export interface HistoricalDataPoint {
  date: string;
  concentration: number;
  motility: number;
  progressive: number;
  normalMorphology: number;
  vitality: number;
  dfi: number;
  treatmentPhase?: string; // Pre-Treatment, Post-Antioxidant, Post-Surgical, etc.
}

export interface PatientHistory {
  patientId: string;
  species: string;
  data: HistoricalDataPoint[];
}

// Internal Quality Control (IQC) Types
export interface QCParameterConfig {
  id: string;
  name: string;
  unit: string;
  targetMean: number;
  targetSD: number; // Standard Deviation
}

export interface QCDataPoint {
  id: string;
  timestamp: string;
  runDate: string;
  lotNumber: string;
  level: 'level_1_low' | 'level_2_normal' | 'level_3_high';
  operator: string;
  instrumentId: string;
  concentration: number;
  motility: number;
  progressive: number;
  morphology: number;
  status: 'in_control' | 'warning' | 'out_of_control';
  westgardViolations: string[];
  notes?: string;
}

export interface QCLot {
  lotNumber: string;
  expiryDate: string;
  controlMaterial: string;
  levels: {
    level: 'level_1_low' | 'level_2_normal' | 'level_3_high';
    concentrationTarget: number;
    concentrationSD: number;
    motilityTarget: number;
    motilitySD: number;
  }[];
}
