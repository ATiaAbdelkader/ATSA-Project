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
  };
  
  morphology: {
    head: 'normal' | 'large' | 'small' | 'amorphous' | 'pyriform' | 'tapered' | 'round';
    vacuoles: 'present' | 'absent';
    acrosome: 'normal' | 'abnormal';
    midpiece: 'normal' | 'thick' | 'bent' | 'asymmetric';
    tail: 'normal' | 'short' | 'coiled' | 'multiple' | 'bent';
    droplet: 'none' | 'proximal' | 'distal';
  };
  
  vitality: 'live' | 'dead';
  
  classification: 'progressive' | 'non-progressive' | 'immotile';
  isHyperactivated: boolean;
  
  // Sperm DNA Fragmentation (SDF)
  sdf: {
    fragmented: boolean;
    haloSized: number; // µm
    dfi: number; // DNA Fragmentation Index (0-100)
  };
}

export interface SpeciesProfile {
  name: string;
  minConcentration: number;
  minTotalMotility: number;
  minProgressiveMotility: number;
  minNormalMorphology: number;
  minVitality: number;
  maxLeukocytes: number;
}

export interface AnalysisResult {
  timestamp: string;
  patientId: string;
  species: string;
  settings: {
    fps: number;
    micronsPerPixel: number;
    profile: SpeciesProfile;
    chamberDepth?: number;
    chamberPreset?: string;
  };
  summary: {
    totalCount: number;
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
      };
    };
    morphology: {
      normal: number;
      abnormal: number;
      avgArea: number;
      tzi: number; // Teratozoospermia Index
      mai: number; // Multiple Anomalies Index
      headDefects: {
        large: number;
        small: number;
        amorphous: number;
        pyriform: number;
        tapered: number;
        round: number;
      };
      midpieceDefects: {
        thick: number;
        bent: number;
        asymmetric: number;
      };
      tailDefects: {
        short: number;
        coiled: number;
        multiple: number;
        bent: number;
      };
      acrosomeDefects: number;
      cytoplasmicDroplets: number;
    };
    sdf: {
      dfi: number; // Overall DNA Fragmentation Index (%)
      fragmentedCount: number;
      totalCount: number;
    };
    interpretation?: {
      status: 'normal' | 'borderline' | 'abnormal';
      comments: string[];
      recommendations: string[];
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

export type AppState = 'login' | 'dashboard' | 'analysis' | 'help' | 'history' | 'inventory';

export interface HistoricalDataPoint {
  date: string;
  concentration: number;
  motility: number;
  progressive: number;
  normalMorphology: number;
  vitality: number;
  dfi: number;
}

export interface PatientHistory {
  patientId: string;
  species: string;
  data: HistoricalDataPoint[];
}
