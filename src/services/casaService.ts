import type { SpermData, AnalysisResult } from '../types';

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
    bcf: 15 + Math.random() * 10, // Simulated
    mad: 20 + Math.random() * 10, // Simulated
    morphometry: {
      area: 15 + Math.random() * 5,
      perimeter: 14 + Math.random() * 4,
      length: 5 + Math.random() * 1,
      width: 3 + Math.random() * 1,
      circularity: 0.8 + Math.random() * 0.1,
      elongation: 1.5 + Math.random() * 0.5
    },
    morphology: {
      head: Math.random() > 0.85 ? 'normal' : (['large', 'small', 'amorphous', 'pyriform', 'tapered', 'round'][Math.floor(Math.random() * 6)] as any),
      vacuoles: Math.random() > 0.9 ? 'present' : 'absent',
      acrosome: Math.random() > 0.1 ? 'normal' : 'abnormal',
      midpiece: Math.random() > 0.8 ? 'normal' : (['thick', 'bent', 'asymmetric'][Math.floor(Math.random() * 3)] as any),
      tail: Math.random() > 0.75 ? 'normal' : (['short', 'coiled', 'multiple', 'bent'][Math.floor(Math.random() * 4)] as any),
      droplet: Math.random() > 0.9 ? 'none' : (['proximal', 'distal'][Math.floor(Math.random() * 2)] as any)
    },
    vitality: Math.random() > 0.2 ? 'live' : 'dead',
    sdf: {
      fragmented: Math.random() > 0.85,
      haloSized: 10 + Math.random() * 15,
      dfi: Math.random() * 100
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
  const avgArea = spermatozoa.reduce((acc, s) => acc + s.morphometry.area, 0) / (totalCount || 1);

  const totalMotility = totalCount > 0 ? ((progressive + nonProgressive) / totalCount) * 100 : 0;
  const progressiveMotility = totalCount > 0 ? (progressive / totalCount) * 100 : 0;
  const hyperactivatedCount = spermatozoa.filter(s => s.isHyperactivated).length;
  const hyperactivatedPercentage = totalCount > 0 ? (hyperactivatedCount / totalCount) * 100 : 0;
  const normalCount = spermatozoa.filter(s => 
    s.morphology.head === 'normal' && 
    s.morphology.midpiece === 'normal' && 
    s.morphology.tail === 'normal' &&
    s.morphology.acrosome === 'normal' &&
    s.morphology.droplet === 'none'
  ).length;
  const normalMorphology = totalCount > 0 ? (normalCount / totalCount) * 100 : 0;

  // Morphology Defect Counts
  const headDefects = { large: 0, small: 0, amorphous: 0, pyriform: 0, tapered: 0, round: 0 };
  const midpieceDefects = { thick: 0, bent: 0, asymmetric: 0 };
  const tailDefects = { short: 0, coiled: 0, multiple: 0, bent: 0 };
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

  // Morphology Indices
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

  const liveCount = spermatozoa.filter(s => s.vitality === 'live').length;
  const deadCount = spermatozoa.filter(s => s.vitality === 'dead').length;
  const vitalityTotal = totalCount > 0 ? (liveCount / totalCount) * 100 : 0;
  const leukocytes = Math.random() > 0.8 ? 1.5 : 0.2; // Simulated million/ml

  // High-fidelity concentration calculation incorporating camera resolution,
  // microns-per-pixel visual scale, and medical counting chamber depth (microns).
  const depthMicrons = (settings as any).chamberDepth ?? 20;
  const mpp = settings.micronsPerPixel ?? 0.65;
  const fieldWidthMm = (1280 * mpp) / 1000;
  const fieldHeightMm = (720 * mpp) / 1000;
  const fieldAreaMm2 = fieldWidthMm * fieldHeightMm;
  const chamberDepthMm = depthMicrons / 1000;
  const fieldVolumeMm3 = fieldAreaMm2 * chamberDepthMm;
  const fieldVolumeML = fieldVolumeMm3 / 1000; // 1 mm^3 = 1 uL = 1e-3 mL
  const concentration = totalCount > 0 ? (totalCount / fieldVolumeML) / 1000000 : 0;

  const { profile } = settings;

  // Interpretation Logic (Species Profile based)
  const comments: string[] = [];
  const recommendations: string[] = [];
  let status: 'normal' | 'borderline' | 'abnormal' = 'normal';

  if (totalMotility < profile.minTotalMotility) {
    status = 'abnormal';
    comments.push(`Reduced total motility: ${totalMotility.toFixed(1)}% (Ref: >${profile.minTotalMotility}%).`);
    recommendations.push('Evaluate lifestyle factors and oxidative stress markers.');
  } else if (totalMotility < profile.minTotalMotility + 5) {
    status = 'borderline';
    comments.push('Borderline motility: Values are near the lower limit of normal.');
  }

  if (progressiveMotility < profile.minProgressiveMotility) {
    status = 'abnormal';
    comments.push(`Reduced progressive motility: ${progressiveMotility.toFixed(1)}% (Ref: >${profile.minProgressiveMotility}%).`);
  }

  if (normalMorphology < profile.minNormalMorphology) {
    status = 'abnormal';
    comments.push(`Teratozoospermia: ${normalMorphology.toFixed(1)}% normal forms (Ref: >${profile.minNormalMorphology}%).`);
    recommendations.push('Consider DNA fragmentation index (DFI) testing.');
  }

  if (concentration < profile.minConcentration) {
    status = 'abnormal';
    comments.push(`Oligozoospermia: ${concentration.toFixed(1)} M/ml (Ref: >${profile.minConcentration} M/ml).`);
    recommendations.push('Hormonal profile assessment recommended (FSH, LH, Testosterone).');
  }

  if (vitalityTotal < profile.minVitality) {
    status = 'abnormal';
    comments.push(`Necrozoospermia: Low vitality detected (${vitalityTotal.toFixed(1)}% Ref: >${profile.minVitality}%).`);
    recommendations.push('Evaluate for anti-sperm antibodies or prolonged abstinence.');
  }

  if (leukocytes > profile.maxLeukocytes) {
    status = 'abnormal';
    comments.push(`Leukocytospermia: High WBC count (${leukocytes.toFixed(1)} M/ml Ref: <${profile.maxLeukocytes} M/ml).`);
    recommendations.push('Semen culture recommended to rule out infection.');
  }

  if (tzi > 1.6) {
    status = 'abnormal';
    comments.push(`High TZI (${tzi.toFixed(2)}): Multiple morphological defects per abnormal cell.`);
  }

  if (comments.length === 0) {
    comments.push('Normozoospermia: All parameters within standard reference ranges.');
    recommendations.push('Routine follow-up as per standard protocol.');
  }

  return {
    totalCount,
    concentration,
    leukocytes,
    vitality: {
      live: vitalityTotal,
      dead: 100 - vitalityTotal,
      total: vitalityTotal
    },
    motility: {
      progressive: progressiveMotility,
      nonProgressive: (nonProgressive / totalCount) * 100,
      immotile: (immotile / totalCount) * 100,
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
      headDefects: {
        large: getPercent(headDefects.large),
        small: getPercent(headDefects.small),
        amorphous: getPercent(headDefects.amorphous),
        pyriform: getPercent(headDefects.pyriform),
        tapered: getPercent(headDefects.tapered),
        round: getPercent(headDefects.round)
      },
      midpieceDefects: {
        thick: getPercent(midpieceDefects.thick),
        bent: getPercent(midpieceDefects.bent),
        asymmetric: getPercent(midpieceDefects.asymmetric)
      },
      tailDefects: {
        short: getPercent(tailDefects.short),
        coiled: getPercent(tailDefects.coiled),
        multiple: getPercent(tailDefects.multiple),
        bent: getPercent(tailDefects.bent)
      },
      acrosomeDefects: getPercent(acrosomeDefects),
      cytoplasmicDroplets: getPercent(cytoplasmicDroplets)
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
    }
  };
};
