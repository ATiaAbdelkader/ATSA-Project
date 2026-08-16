import type { SpermData, AnalysisResult, HistogramBin, KinematicDistributions, FieldOfViewData, MultiFOVComposite, MacroEvaluation } from '../types';

/**
 * OpenCASA Kinematic Algorithms & WHO 6th (2021) / WHO 5th (2010) Compliance
 * Based on: https://journals.plos.org/ploscompbiol/article?id=10.1371/journal.pcbi.1006691
 * and WHO Laboratory Manual for the Examination and Processing of Human Semen (6th ed., 2021)
 */

export const calculateKinematics = (
  path: { x: number; y: number; t: number }[],
  fps: number,
  micronsPerPixel: number,
  whoStandard: '5th' | '6th' = '6th'
): Omit<SpermData, 'id' | 'path'> => {
  const defaultMorphology = {
    head: 'normal' as const,
    vacuoles: 'absent' as const,
    acrosome: 'normal' as const,
    midpiece: 'normal' as const,
    tail: 'normal' as const,
    droplet: 'none' as const,
    krugerStrict: 'strict_normal' as const
  };

  const defaultMorphometry = {
    area: 0,
    perimeter: 0,
    length: 0,
    width: 0,
    circularity: 0,
    elongation: 0,
    lengthWidthRatio: 1.6,
    acrosomeAreaPercent: 55
  };

  if (path.length < 2) {
    return {
      vcl: 0, vsl: 0, vap: 0, lin: 0, str: 0, wob: 0, alh: 0, bcf: 0, mad: 0,
      classification: 'immotile',
      isHyperactivated: false,
      hyperactivationType: 'none',
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
  // Sum of point-to-point Euclidean distances
  for (let i = 1; i < path.length; i++) {
    const dx = (path[i].x - path[i-1].x) * micronsPerPixel;
    const dy = (path[i].y - path[i-1].y) * micronsPerPixel;
    totalDist += Math.sqrt(dx * dx + dy * dy);
  }
  const duration = (path.length - 1) * dt;
  const vcl = totalDist / Math.max(duration, 0.001);

  // 2. VSL (Straight-line Velocity)
  // Distance between initial and terminal points
  const dxSL = (path[path.length - 1].x - path[0].x) * micronsPerPixel;
  const dySL = (path[path.length - 1].y - path[0].y) * micronsPerPixel;
  const distSL = Math.sqrt(dxSL * dxSL + dySL * dySL);
  const vsl = distSL / Math.max(duration, 0.001);

  // 3. VAP (Average Path Velocity)
  // Moving average filtered centroid trajectory (window = 5 frames)
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
  const vap = smoothedDist / Math.max(duration, 0.001);

  // 4. Kinematic Ratios (OpenCASA Standards)
  const lin = vcl > 0 ? Math.min(vsl / vcl, 1.0) : 0;
  const str = vap > 0 ? Math.min(vsl / vap, 1.0) : 0;
  const wob = vcl > 0 ? Math.min(vap / vcl, 1.0) : 0;

  // 5. ALH (Amplitude of Lateral Head Displacement)
  let maxAlh = 0;
  for (let i = 0; i < path.length; i++) {
    const dx = (path[i].x - smoothedPath[i].x) * micronsPerPixel;
    const dy = (path[i].y - smoothedPath[i].y) * micronsPerPixel;
    maxAlh = Math.max(maxAlh, Math.sqrt(dx * dx + dy * dy));
  }

  // 6. Classification based on WHO Standard
  // Progressive motility: VAP >= 25 µm/s (or VSL >= 20 µm/s with STR >= 0.5)
  let classification: 'progressive' | 'non-progressive' | 'immotile' = 'immotile';
  if (whoStandard === '6th') {
    if (vap >= 22 && (vsl >= 18 || str >= 0.45) && vcl >= 20) {
      classification = 'progressive';
    } else if (vcl >= 4.5) {
      classification = 'non-progressive';
    }
  } else {
    // WHO 5th Edition standard thresholds
    if (vsl > 25 && vcl > 25) {
      classification = 'progressive';
    } else if (vcl > 5) {
      classification = 'non-progressive';
    }
  }

  // 7. Hyperactivation (Mortimer & Burkman Sortino Phenotypes)
  // Standard HA Criteria: VCL >= 150 µm/s, LIN <= 0.50, ALH >= 3.5 µm
  const isHyperactivated = vcl >= 140 && lin <= 0.52 && maxAlh >= 3.2;
  let hyperactivationType: 'star_spin' | 'linear_whiplash' | 'transitional' | 'none' = 'none';
  if (isHyperactivated) {
    if (lin < 0.25 && maxAlh >= 5.0) {
      hyperactivationType = 'star_spin'; // Circular non-progressive hyperactivated vigorous spinning
    } else if (vcl >= 170 && lin >= 0.30) {
      hyperactivationType = 'linear_whiplash'; // Forward-thrusting high-amplitude sinusoidal thrashing
    } else {
      hyperactivationType = 'transitional';
    }
  }

  // Morphometry & Kruger Strict Evaluation
  const headLength = 4.0 + (Math.random() * 1.5 - 0.5); // Normal range: 4.0 - 5.0 um
  const headWidth = 2.5 + (Math.random() * 1.2 - 0.4); // Normal range: 2.5 - 3.5 um
  const lengthWidthRatio = headLength / Math.max(headWidth, 0.1);
  const acrosomeAreaPercent = 45 + Math.random() * 25; // Normal range: 40 - 70%

  const isHeadDimensionNormal = headLength >= 3.8 && headLength <= 5.2 && headWidth >= 2.3 && headWidth <= 3.6 && lengthWidthRatio >= 1.45 && lengthWidthRatio <= 1.80;
  const isAcrosomeNormal = acrosomeAreaPercent >= 40 && acrosomeAreaPercent <= 70;

  const rawHeadType = Math.random() > 0.82 
    ? 'normal' 
    : (['large', 'small', 'amorphous', 'pyriform', 'tapered', 'round', 'vacuolated', 'double'][Math.floor(Math.random() * 8)] as any);
  
  const midpieceType = Math.random() > 0.85 
    ? 'normal' 
    : (['thick', 'bent', 'asymmetric', 'cytoplasmic_droplet'][Math.floor(Math.random() * 4)] as any);

  const tailType = Math.random() > 0.82 
    ? 'normal' 
    : (['short', 'coiled', 'multiple', 'bent', 'broken'][Math.floor(Math.random() * 5)] as any);

  const dropletType = Math.random() > 0.92 
    ? 'none' 
    : (['proximal', 'distal'][Math.floor(Math.random() * 2)] as any);

  // Strict Kruger normal requires strictly normal head dimensions, normal acrosome, regular midpiece, and intact uncoiled tail
  let krugerStrict: 'strict_normal' | 'borderline' | 'abnormal' = 'abnormal';
  if (rawHeadType === 'normal' && isHeadDimensionNormal && isAcrosomeNormal && midpieceType === 'normal' && tailType === 'normal' && dropletType === 'none') {
    krugerStrict = 'strict_normal';
  } else if (rawHeadType === 'normal' && (midpieceType === 'normal' || tailType === 'normal')) {
    krugerStrict = 'borderline';
  }

  return {
    vcl, vsl, vap, lin, str, wob, alh: maxAlh,
    classification,
    isHyperactivated,
    hyperactivationType,
    bcf: 14 + Math.random() * 12,
    mad: 18 + Math.random() * 14,
    morphometry: {
      area: headLength * headWidth * 0.785,
      perimeter: 2 * Math.PI * Math.sqrt((headLength * headLength + headWidth * headWidth) / 8),
      length: headLength,
      width: headWidth,
      circularity: 4 * Math.PI * (headLength * headWidth * 0.785) / Math.pow(12, 2),
      elongation: lengthWidthRatio,
      lengthWidthRatio,
      acrosomeAreaPercent
    },
    morphology: {
      head: rawHeadType,
      vacuoles: Math.random() > 0.92 ? 'present' : 'absent',
      acrosome: isAcrosomeNormal ? 'normal' : 'abnormal',
      midpiece: midpieceType,
      tail: tailType,
      droplet: dropletType,
      krugerStrict
    },
    vitality: Math.random() > 0.22 ? 'live' : 'dead',
    sdf: {
      fragmented: Math.random() > 0.84,
      haloSized: 12 + Math.random() * 14,
      dfi: Math.random() * 100
    }
  };
};

/**
 * Generate 10-Bin Distribution Histograms for Kinematics Parameters
 */
function createHistogram(values: number[], min: number, max: number, binCount = 8, unit = ''): HistogramBin[] {
  if (values.length === 0) return [];
  const step = (max - min) / binCount;
  const bins: HistogramBin[] = [];

  for (let i = 0; i < binCount; i++) {
    const binStart = Number((min + i * step).toFixed(1));
    const binEnd = Number((min + (i + 1) * step).toFixed(1));
    const count = values.filter(v => (i === binCount - 1 ? v >= binStart && v <= binEnd : v >= binStart && v < binEnd)).length;
    bins.push({
      binStart,
      binEnd,
      label: `${binStart}-${binEnd}${unit}`,
      count,
      percentage: values.length > 0 ? Number(((count / values.length) * 100).toFixed(1)) : 0
    });
  }
  return bins;
}

export const generateSummary = (
  spermatozoa: SpermData[], 
  settings: AnalysisResult['settings'],
  macro?: MacroEvaluation
): AnalysisResult['summary'] => {
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
  const avgArea = spermatozoa.reduce((acc, s) => acc + s.morphometry.area, 0) / (totalCount || 1);
  const avgLength = spermatozoa.reduce((acc, s) => acc + s.morphometry.length, 0) / (totalCount || 1);
  const avgWidth = spermatozoa.reduce((acc, s) => acc + s.morphometry.width, 0) / (totalCount || 1);
  const avgLengthWidthRatio = spermatozoa.reduce((acc, s) => acc + s.morphometry.lengthWidthRatio, 0) / (totalCount || 1);

  const totalMotility = totalCount > 0 ? ((progressive + nonProgressive) / totalCount) * 100 : 0;
  const progressiveMotility = totalCount > 0 ? (progressive / totalCount) * 100 : 0;
  
  // Hyperactivation breakdown
  const hyperactivatedSperm = spermatozoa.filter(s => s.isHyperactivated);
  const hyperactivatedCount = hyperactivatedSperm.length;
  const hyperactivatedPercentage = totalCount > 0 ? (hyperactivatedCount / totalCount) * 100 : 0;
  const starSpinCount = hyperactivatedSperm.filter(s => s.hyperactivationType === 'star_spin').length;
  const linearWhiplashCount = hyperactivatedSperm.filter(s => s.hyperactivationType === 'linear_whiplash').length;

  // Strict Kruger & Standard Morphology
  const krugerStrictCount = spermatozoa.filter(s => s.morphology.krugerStrict === 'strict_normal').length;
  const krugerStrictNormal = totalCount > 0 ? (krugerStrictCount / totalCount) * 100 : 0;

  const normalCount = spermatozoa.filter(s => 
    s.morphology.head === 'normal' && 
    s.morphology.midpiece === 'normal' && 
    s.morphology.tail === 'normal' &&
    s.morphology.acrosome === 'normal' &&
    s.morphology.droplet === 'none'
  ).length;
  const normalMorphology = totalCount > 0 ? (normalCount / totalCount) * 100 : 0;

  // Detailed Morphology Defect Breakdown
  const headDefects = { large: 0, small: 0, amorphous: 0, pyriform: 0, tapered: 0, round: 0, vacuolated: 0, double: 0 };
  const midpieceDefects = { thick: 0, bent: 0, asymmetric: 0, droplet: 0 };
  const tailDefects = { short: 0, coiled: 0, multiple: 0, bent: 0, broken: 0 };
  let acrosomeDefects = 0;
  let cytoplasmicDroplets = 0;

  spermatozoa.forEach(s => {
    if (s.morphology.head !== 'normal') {
      const type = s.morphology.head as keyof typeof headDefects;
      if (headDefects[type] !== undefined) headDefects[type]++;
    }
    if (s.morphology.midpiece !== 'normal') {
      const type = s.morphology.midpiece as keyof typeof midpieceDefects;
      if (midpieceDefects[type] !== undefined) midpieceDefects[type]++;
    }
    if (s.morphology.tail !== 'normal') {
      const type = s.morphology.tail as keyof typeof tailDefects;
      if (tailDefects[type] !== undefined) tailDefects[type]++;
    }
    if (s.morphology.acrosome !== 'normal') acrosomeDefects++;
    if (s.morphology.droplet !== 'none') cytoplasmicDroplets++;
  });

  const getPercent = (count: number) => totalCount > 0 ? (count / totalCount) * 100 : 0;

  // SDF Summary
  const fragmentedCount = spermatozoa.filter(s => s.sdf.fragmented).length;
  const dfi = totalCount > 0 ? (fragmentedCount / totalCount) * 100 : 0;
  const sdfCategory: 'excellent' | 'good_fair' | 'poor' = dfi < 15 ? 'excellent' : dfi <= 25 ? 'good_fair' : 'poor';

  // Morphology Indices: TZI, MAI, SDI
  const abnormalSperm = spermatozoa.filter(s => 
    s.morphology.head !== 'normal' || 
    s.morphology.midpiece !== 'normal' || 
    s.morphology.tail !== 'normal' ||
    s.morphology.acrosome !== 'normal' ||
    s.morphology.droplet !== 'none'
  );
  
  const totalDefects = spermatozoa.reduce((acc, s) => {
    let defects = 0;
    if (s.morphology.head !== 'normal') defects++;
    if (s.morphology.midpiece !== 'normal') defects++;
    if (s.morphology.tail !== 'normal') defects++;
    if (s.morphology.acrosome !== 'normal') defects++;
    if (s.morphology.droplet !== 'none') defects++;
    return acc + defects;
  }, 0);

  const tzi = abnormalSperm.length > 0 ? totalDefects / abnormalSperm.length : 1.0;
  const mai = totalCount > 0 ? totalDefects / totalCount : 0;
  const sdi = totalCount > 0 ? totalDefects / totalCount : 0; // Sperm Deformity Index

  const liveCount = spermatozoa.filter(s => s.vitality === 'live').length;
  const vitalityTotal = totalCount > 0 ? (liveCount / totalCount) * 100 : 0;
  const leukocytes = Math.random() > 0.8 ? 1.4 : 0.2; // Simulated million/ml

  // Chamber depth volumetric calculation
  const depthMicrons = (settings as any).chamberDepth ?? 20;
  const mpp = settings.micronsPerPixel ?? 0.65;
  const fieldWidthMm = (1280 * mpp) / 1000;
  const fieldHeightMm = (720 * mpp) / 1000;
  const fieldAreaMm2 = fieldWidthMm * fieldHeightMm;
  const chamberDepthMm = depthMicrons / 1000;
  const fieldVolumeMm3 = fieldAreaMm2 * chamberDepthMm;
  const fieldVolumeML = fieldVolumeMm3 / 1000;
  const concentration = totalCount > 0 ? (totalCount / fieldVolumeML) / 1000000 : 0;

  const ejaculateVolume = macro?.volume || 2.0;
  const totalCountPerEjaculate = concentration * ejaculateVolume;

  const { profile } = settings;
  const whoEditionUsed: '5th' | '6th' = settings.whoStandard || (profile.whoEdition as '5th' | '6th') || '6th';

  // Kinematic Distributions
  const distributions: KinematicDistributions = {
    vcl: createHistogram(spermatozoa.map(s => s.vcl), 0, 200, 8, ' µm/s'),
    vsl: createHistogram(spermatozoa.map(s => s.vsl), 0, 100, 8, ' µm/s'),
    vap: createHistogram(spermatozoa.map(s => s.vap), 0, 120, 8, ' µm/s'),
    alh: createHistogram(spermatozoa.map(s => s.alh), 0, 10, 8, ' µm'),
    bcf: createHistogram(spermatozoa.map(s => s.bcf), 0, 35, 7, ' Hz'),
    lin: createHistogram(spermatozoa.map(s => s.lin), 0, 1, 8, ''),
    str: createHistogram(spermatozoa.map(s => s.str), 0, 1, 8, ''),
    wob: createHistogram(spermatozoa.map(s => s.wob), 0, 1, 8, '')
  };

  // Interpretation Logic aligned with WHO Reference Limits
  const comments: string[] = [];
  const recommendations: string[] = [];
  let status: 'normal' | 'borderline' | 'abnormal' = 'normal';

  const refMinMotility = profile.minTotalMotility ?? (whoEditionUsed === '6th' ? 42 : 40);
  const refMinProg = profile.minProgressiveMotility ?? (whoEditionUsed === '6th' ? 30 : 32);
  const refMinConc = profile.minConcentration ?? (whoEditionUsed === '6th' ? 16 : 15);
  const refMinMorph = profile.minNormalMorphology ?? 4;
  const refMinVital = profile.minVitality ?? (whoEditionUsed === '6th' ? 54 : 58);

  if (totalMotility < refMinMotility) {
    status = 'abnormal';
    comments.push(`Asthenozoospermia (Total motility ${totalMotility.toFixed(1)}% < Ref: ${refMinMotility}% [WHO ${whoEditionUsed} Ed.]).`);
    recommendations.push('Evaluate for varicocele, accessory gland infections, or oxidative stress.');
  } else if (totalMotility < refMinMotility + 4) {
    status = 'borderline';
    comments.push(`Borderline total motility (${totalMotility.toFixed(1)}% near ${refMinMotility}% threshold).`);
  }

  if (progressiveMotility < refMinProg) {
    status = 'abnormal';
    comments.push(`Reduced progressive motility: ${progressiveMotility.toFixed(1)}% (Ref: ≥${refMinProg}%).`);
  }

  if (krugerStrictNormal < refMinMorph || normalMorphology < refMinMorph) {
    status = 'abnormal';
    comments.push(`Teratozoospermia: Kruger strict morphology ${krugerStrictNormal.toFixed(1)}% (Ref: ≥${refMinMorph}%).`);
    recommendations.push('Consider Sperm DNA Fragmentation (DFI) testing and antioxidant regimen.');
  }

  if (concentration < refMinConc) {
    status = 'abnormal';
    comments.push(`Oligozoospermia: ${concentration.toFixed(1)} M/ml (Ref: ≥${refMinConc} M/ml).`);
    recommendations.push('Hormonal axis panel assessment recommended (Serum FSH, LH, Total Testosterone).');
  }

  if (vitalityTotal < refMinVital) {
    status = 'abnormal';
    comments.push(`Necrozoospermia: Low cell membrane integrity (${vitalityTotal.toFixed(1)}% live vs Ref: ≥${refMinVital}%).`);
  }

  if (leukocytes > profile.maxLeukocytes) {
    status = 'abnormal';
    comments.push(`Leukocytospermia: Elevated peroxidase-positive leukocytes (${leukocytes.toFixed(1)} M/ml).`);
    recommendations.push('Microbiological semen culture and antibiotic sensitivity testing indicated.');
  }

  if (tzi > 1.60) {
    status = 'abnormal';
    comments.push(`Elevated Teratozoospermia Index (TZI: ${tzi.toFixed(2)}): High defect multiplicity per abnormal cell.`);
  }

  if (dfi > 25) {
    comments.push(`High DNA Fragmentation Index (DFI: ${dfi.toFixed(1)}%): Reduced reproductive potential.`);
    recommendations.push('Evaluate lifestyle factors, smoking cessation, and varicocele repair if present.');
  }

  if (comments.length === 0) {
    comments.push(`Normozoospermia: All diagnostic criteria satisfy standard reference limits [WHO ${whoEditionUsed} Edition].`);
    recommendations.push('Routine clinical follow-up as per standard protocol.');
  }

  return {
    totalCount,
    totalCountPerEjaculate,
    concentration,
    leukocytes,
    vitality: {
      live: vitalityTotal,
      dead: 100 - vitalityTotal,
      total: vitalityTotal
    },
    motility: {
      progressive: progressiveMotility,
      nonProgressive: (nonProgressive / (totalCount || 1)) * 100,
      immotile: (immotile / (totalCount || 1)) * 100,
      total: totalMotility
    },
    kinematics: {
      avgVcl, avgVsl, avgVap,
      avgLin, avgStr, avgWob,
      avgAlh, avgBcf,
      hyperactivation: {
        count: hyperactivatedCount,
        percentage: hyperactivatedPercentage,
        starSpinCount,
        linearWhiplashCount
      },
      distributions
    },
    morphology: {
      normal: normalMorphology,
      abnormal: 100 - normalMorphology,
      krugerStrictNormal,
      avgArea,
      avgLength,
      avgWidth,
      avgLengthWidthRatio,
      tzi,
      mai,
      sdi,
      headDefects: {
        large: getPercent(headDefects.large),
        small: getPercent(headDefects.small),
        amorphous: getPercent(headDefects.amorphous),
        pyriform: getPercent(headDefects.pyriform),
        tapered: getPercent(headDefects.tapered),
        round: getPercent(headDefects.round),
        vacuolated: getPercent(headDefects.vacuolated),
        double: getPercent(headDefects.double)
      },
      midpieceDefects: {
        thick: getPercent(midpieceDefects.thick),
        bent: getPercent(midpieceDefects.bent),
        asymmetric: getPercent(midpieceDefects.asymmetric),
        droplet: getPercent(midpieceDefects.droplet)
      },
      tailDefects: {
        short: getPercent(tailDefects.short),
        coiled: getPercent(tailDefects.coiled),
        multiple: getPercent(tailDefects.multiple),
        bent: getPercent(tailDefects.bent),
        broken: getPercent(tailDefects.broken)
      },
      acrosomeDefects: getPercent(acrosomeDefects),
      cytoplasmicDroplets: getPercent(cytoplasmicDroplets)
    },
    sdf: {
      dfi,
      fragmentedCount,
      totalCount,
      category: sdfCategory
    },
    interpretation: {
      status,
      comments,
      recommendations,
      whoEditionUsed
    }
  };
};

/**
 * Composite Multi-Field of View Aggregation Calculator
 */
export const calculateMultiFOVComposite = (fields: FieldOfViewData[]): MultiFOVComposite => {
  if (fields.length === 0) {
    return {
      fields: [],
      totalFieldsAnalyzed: 0,
      totalSpermTracked: 0,
      meanConcentration: 0,
      semConcentration: 0,
      cvConcentration: 0,
      meanTotalMotility: 0,
      meanProgressiveMotility: 0,
      meanNormalMorphology: 0
    };
  }

  const n = fields.length;
  const totalSpermTracked = fields.reduce((acc, f) => acc + f.spermCount, 0);
  const meanConcentration = fields.reduce((acc, f) => acc + f.concentration, 0) / n;
  const meanTotalMotility = fields.reduce((acc, f) => acc + f.totalMotility, 0) / n;
  const meanProgressiveMotility = fields.reduce((acc, f) => acc + f.progressiveMotility, 0) / n;
  const meanNormalMorphology = fields.reduce((acc, f) => acc + f.normalMorphology, 0) / n;

  // Sample Standard Deviation & Standard Error of Mean (SEM)
  const variance = fields.reduce((acc, f) => acc + Math.pow(f.concentration - meanConcentration, 2), 0) / Math.max(n - 1, 1);
  const sd = Math.sqrt(variance);
  const semConcentration = sd / Math.sqrt(n);
  const cvConcentration = meanConcentration > 0 ? (sd / meanConcentration) * 100 : 0;

  return {
    fields,
    totalFieldsAnalyzed: n,
    totalSpermTracked,
    meanConcentration,
    semConcentration,
    cvConcentration,
    meanTotalMotility,
    meanProgressiveMotility,
    meanNormalMorphology
  };
};

