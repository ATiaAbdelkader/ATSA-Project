import type { SpermData, AnalysisResult, AnalysisProvenance } from '../types';

/**
 * OpenCASA Kinematic Algorithms
 * Based on: https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1006691
 */

export const calculateKinematics = (
  path: { x: number; y: number; t: number }[],
  fps: number,
  micronsPerPixel: number
): Omit<SpermData, 'id' | 'path'> => {
  const defaultMorphology = {
    head: 'normal' as const,
    vacuoles: 'absent' as const,
    acrosome: 'normal' as const,
    midpiece: 'normal' as const,
    tail: 'normal' as const,
    droplet: 'none' as const
  };

  const defaultMorphometry = {
    area: 0,
    perimeter: 0,
    length: 0,
    width: 0,
    circularity: 0,
    elongation: 0
  };

  if (path.length < 2) {
    return {
      vcl: 0, vsl: 0, vap: 0, lin: 0, str: 0, wob: 0, alh: 0, bcf: 0, mad: 0,
      classification: 'immotile',
      isHyperactivated: false,
      morphometry: defaultMorphometry,
      morphology: defaultMorphology,
      vitality: 'dead',
      sdf: {
        fragmented: false,
        haloSized: 0,
        dfi: 0
      }
    };
  }

  const dt = 1 / fps;
  let totalDist = 0;
  
  // 1. VCL (Curvilinear Velocity)
  // Sum of distances between consecutive points
  for (let i = 1; i < path.length; i++) {
    const dx = (path[i].x - path[i-1].x) * micronsPerPixel;
    const dy = (path[i].y - path[i-1].y) * micronsPerPixel;
    totalDist += Math.sqrt(dx * dx + dy * dy);
  }
  const duration = (path.length - 1) * dt;
  const vcl = totalDist / duration;

  // 2. VSL (Straight-line Velocity)
  // Distance between first and last point
  const dxSL = (path[path.length - 1].x - path[0].x) * micronsPerPixel;
  const dySL = (path[path.length - 1].y - path[0].y) * micronsPerPixel;
  const distSL = Math.sqrt(dxSL * dxSL + dySL * dySL);
  const vsl = distSL / duration;

  // 3. VAP (Average Path Velocity)
  // Simplified: Smoothed path (moving average of 5 points)
  const smoothedPath = [];
  const windowSize = 5;
  for (let i = 0; i < path.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(path.length - 1, i + Math.floor(windowSize / 2));
    let sumX = 0, sumY = 0;
    for (let j = start; j <= end; j++) {
      sumX += path[j].x;
      sumY += path[j].y;
    }
    smoothedPath.push({ x: sumX / (end - start + 1), y: sumY / (end - start + 1) });
  }

  let smoothedDist = 0;
  for (let i = 1; i < smoothedPath.length; i++) {
    const dx = (smoothedPath[i].x - smoothedPath[i-1].x) * micronsPerPixel;
    const dy = (smoothedPath[i].y - smoothedPath[i-1].y) * micronsPerPixel;
    smoothedDist += Math.sqrt(dx * dx + dy * dy);
  }
  const vap = smoothedDist / duration;

  // 4. Derived Ratios
  const lin = vsl / vcl;
  const str = vsl / vap;
  const wob = vap / vcl;

  // 5. ALH (Amplitude of Lateral Head Displacement)
  // Simplified: Max distance from smoothed path
  let maxAlh = 0;
  for (let i = 0; i < path.length; i++) {
    const dx = (path[i].x - smoothedPath[i].x) * micronsPerPixel;
    const dy = (path[i].y - smoothedPath[i].y) * micronsPerPixel;
    maxAlh = Math.max(maxAlh, Math.sqrt(dx * dx + dy * dy));
  }

  // 6. Classification (WHO 2010)
  let classification: 'progressive' | 'non-progressive' | 'immotile' = 'immotile';
  if (vsl > 25 && vcl > 25) {
    classification = 'progressive';
  } else if (vcl > 5) {
    classification = 'non-progressive';
  }

  // 7. Hyperactivation (WHO 2010)
  // Criteria: VCL > 150 µm/s, LIN < 50%, ALH > 3.5 µm
  const isHyperactivated = vcl > 150 && lin < 0.5 && maxAlh > 3.5;

  return {
    vcl, vsl, vap, lin, str, wob, alh: maxAlh,
    classification,
    isHyperactivated,
    // These measurements require dedicated validated vision algorithms and are not inferred from a 2D path.
    // Keep explicit neutral values for backwards-compatible rendering; provenance marks them unavailable.
    bcf: 0,
    mad: 0,
    morphometry: defaultMorphometry,
    morphology: defaultMorphology,
    vitality: 'dead',
    sdf: {
      fragmented: false,
      haloSized: 0,
      dfi: 0
    }
  };
};

export const generateSummary = (spermatozoa: SpermData[], settings: AnalysisResult['settings']): AnalysisResult['summary'] => {
  const totalCount = spermatozoa.length;
  const progressive = spermatozoa.filter(s => s.classification === 'progressive').length;
  const nonProgressive = spermatozoa.filter(s => s.classification === 'non-progressive').length;
  const immotile = spermatozoa.filter(s => s.classification === 'immotile').length;

  const avgVcl = spermatozoa.reduce((acc, s) => acc + s.vcl, 0) / (totalCount || 1);
  const avgVsl = spermatozoa.reduce((acc, s) => acc + s.vsl, 0) / (totalCount || 1);
  const avgVap = spermatozoa.reduce((acc, s) => acc + s.vap, 0) / (totalCount || 1);
  const avgLin = spermatozoa.reduce((acc, s) => acc + s.lin, 0) / (totalCount || 1);
  const avgStr = spermatozoa.reduce((acc, s) => acc + s.str, 0) / (totalCount || 1);
  const avgWob = spermatozoa.reduce((acc, s) => acc + s.wob, 0) / (totalCount || 1);
  const avgAlh = spermatozoa.reduce((acc, s) => acc + s.alh, 0) / (totalCount || 1);
  const avgBcf = spermatozoa.reduce((acc, s) => acc + s.bcf, 0) / (totalCount || 1);
  const avgArea = 0;

  const totalMotility = totalCount > 0 ? ((progressive + nonProgressive) / totalCount) * 100 : 0;
  const progressiveMotility = totalCount > 0 ? (progressive / totalCount) * 100 : 0;
  const hyperactivatedCount = spermatozoa.filter(s => s.isHyperactivated).length;
  const hyperactivatedPercentage = totalCount > 0 ? (hyperactivatedCount / totalCount) * 100 : 0;
  // Morphology is not measured by this visualization-only tracker.
  const normalMorphology = 0;

  // Morphology and DNA-fragmentation fields require dedicated validated assays.
  const fragmentedCount = 0;
  const dfi = 0;

  const tzi = 0;
  const mai = 0;

  // Vitality requires a validated live/dead assay and is not inferred from motion.
  // Leukocyte count requires a validated stain or dedicated cell classifier; it is not inferred here.
  const leukocytes = 0;

  // Concentration requires a calibrated chamber and a validated cell count; it is not inferred from visualization particles.
  const concentration = 0;

  const comments: string[] = [
    'This visualization-only result is not a diagnostic laboratory measurement.',
    'Motility and kinematic values describe the available tracking paths only; concentration, morphology, vitality, DNA fragmentation, and leukocytes were not measured.'
  ];
  const recommendations: string[] = [
    'Confirm findings with a validated laboratory CASA workflow before clinical or breeding decisions.'
  ];
  const status: 'not-validated' = 'not-validated';

  return {
    totalCount,
    concentration,
    leukocytes,
    vitality: { live: 0, dead: 0, total: 0 },
    motility: {
      progressive: progressiveMotility,
      nonProgressive: totalCount > 0 ? (nonProgressive / totalCount) * 100 : 0,
      immotile: totalCount > 0 ? (immotile / totalCount) * 100 : 0,
      total: totalMotility
    },
    kinematics: {
      avgVcl, avgVsl, avgVap,
      avgLin, avgStr, avgWob,
      avgAlh, avgBcf,
      hyperactivation: {
        count: hyperactivatedCount,
        percentage: hyperactivatedPercentage
      }
    },
    morphology: {
      normal: normalMorphology,
      abnormal: 100 - normalMorphology,
      avgArea,
      tzi,
      mai,
      headDefects: { large: 0, small: 0, amorphous: 0, pyriform: 0, tapered: 0, round: 0 },
      midpieceDefects: { thick: 0, bent: 0, asymmetric: 0 },
      tailDefects: { short: 0, coiled: 0, multiple: 0, bent: 0 },
      acrosomeDefects: 0,
      cytoplasmicDroplets: 0
    },
    sdf: {
      dfi,
      fragmentedCount,
      totalCount
    },
    interpretation: {
      status,
      comments,
      recommendations
    },
    provenance: visualizationProvenance
  };
};

const visualizationProvenance: AnalysisProvenance = {
  overall: 'visualization-only',
  fields: {
    totalCount: 'derived',
    concentration: 'visualization-only',
    leukocytes: 'unavailable',
    vitality: 'unavailable',
    motility: 'visualization-only',
    kinematics: 'visualization-only',
    morphology: 'unavailable',
    sdf: 'unavailable',
    interpretation: 'visualization-only'
  },
  notes: [
    'The current browser particle paths are visualization/training data, not a validated microscope-cell tracker.',
    'Morphology, vitality, DNA fragmentation, and leukocyte measurements require dedicated validated assays or computer-vision models.'
  ]
};

const parseMetric = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return fallback;
  const parsed = Number.parseFloat(value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clampPercentage = (value: unknown): number => Math.min(100, Math.max(0, parseMetric(value)));

export const buildAiEstimatedSummary = (
  aiResult: Record<string, any>,
  settings: AnalysisResult['settings']
): AnalysisResult['summary'] => {
  const concentration = parseMetric(aiResult.concentration);
  const progressive = clampPercentage(aiResult.motility?.progressive ?? aiResult.progressive);
  const nonProgressive = clampPercentage(aiResult.motility?.nonProgressive ?? aiResult.nonProgressive);
  const immotile = clampPercentage(aiResult.motility?.immotile ?? aiResult.immotile);
  const normalMorphology = clampPercentage(aiResult.morphology?.normal ?? aiResult.normal);
  const totalMotility = Math.min(100, progressive + nonProgressive);
  const profile = settings.profile;
  const comments: string[] = [];
  const recommendations: string[] = [];

  if (totalMotility < profile.minTotalMotility) {
    comments.push(`AI-estimated total motility is ${totalMotility.toFixed(1)}% (reference threshold: >${profile.minTotalMotility}%).`);
  }
  if (progressive < profile.minProgressiveMotility) {
    comments.push(`AI-estimated progressive motility is ${progressive.toFixed(1)}% (reference threshold: >${profile.minProgressiveMotility}%).`);
  }
  if (normalMorphology < profile.minNormalMorphology) {
    comments.push(`AI-estimated normal morphology is ${normalMorphology.toFixed(1)}% (reference threshold: >${profile.minNormalMorphology}%).`);
  }
  if (concentration < profile.minConcentration) {
    comments.push(`AI-estimated concentration is ${concentration.toFixed(1)} M/ml (reference threshold: >${profile.minConcentration} M/ml).`);
  }
  if (comments.length === 0) {
    comments.push('AI-estimated aggregate values are within the configured reference thresholds.');
  }
  recommendations.push('Confirm all findings with a validated laboratory CASA workflow before clinical or breeding decisions.');

  const status = comments.some(comment => comment.includes('threshold')) ? 'abnormal' : 'normal';

  return {
    totalCount: 0,
    concentration,
    leukocytes: 0,
    vitality: { live: 0, dead: 0, total: 0 },
    motility: { progressive, nonProgressive, immotile, total: totalMotility },
    kinematics: {
      avgVcl: 0, avgVsl: 0, avgVap: 0, avgLin: 0, avgStr: 0, avgWob: 0, avgAlh: 0, avgBcf: 0,
      hyperactivation: { count: 0, percentage: 0 }
    },
    morphology: {
      normal: normalMorphology,
      abnormal: Math.max(0, 100 - normalMorphology),
      avgArea: 0,
      tzi: 0,
      mai: 0,
      headDefects: { large: 0, small: 0, amorphous: 0, pyriform: 0, tapered: 0, round: 0 },
      midpieceDefects: { thick: 0, bent: 0, asymmetric: 0 },
      tailDefects: { short: 0, coiled: 0, multiple: 0, bent: 0 },
      acrosomeDefects: 0,
      cytoplasmicDroplets: 0
    },
    sdf: { dfi: 0, fragmentedCount: 0, totalCount: 0 },
    interpretation: { status, comments, recommendations },
    provenance: {
      overall: 'ai-estimated',
      fields: {
        totalCount: 'unavailable',
        concentration: 'ai-estimated',
        leukocytes: 'unavailable',
        vitality: 'unavailable',
        motility: 'ai-estimated',
        kinematics: 'unavailable',
        morphology: 'ai-estimated',
        sdf: 'unavailable',
        interpretation: 'ai-estimated'
      },
      notes: [
        'Aggregate concentration, motility, morphology, and observations were estimated by Gemini from the uploaded media.',
        'Per-cell tracks, vitality, DNA fragmentation, leukocyte count, and validated morphometry were not measured.'
      ]
    },
    visionInsights: aiResult
  };
};
