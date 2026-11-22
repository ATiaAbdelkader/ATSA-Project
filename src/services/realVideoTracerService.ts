import type { SpermData, AnalysisResult } from '../types';
import {
  computeBeatCrossFrequency,
  computeMeanAngularDisplacement,
  movingAveragePath,
} from './kinematicsMetrics';

export interface VideoTracingOptions {
  fps?: number;
  maxFrames?: number;
  micronsPerPixel?: number;
  chamberDepthMicrons?: number;
  onProgress?: (progress: number, status: string) => void;
}

export interface VideoTracingResult {
  spermatozoa: SpermData[];
  summary: any;
  fps: number;
  width: number;
  height: number;
  micronsPerPixel: number;
  totalFrames: number;
}

/**
 * Real Video Optical Tracing Service (CASA Computer Vision Engine)
 * Performs real-time frame difference, blob centroid extraction,
 * multi-target trajectory linking, and kinematic velocity estimation (VCL, VSL, VAP, LIN, STR, ALH, BCF).
 */
export async function analyzeVideoElement(
  video: HTMLVideoElement,
  options: VideoTracingOptions = {}
): Promise<VideoTracingResult> {
  const fps = options.fps || 25;
  const maxFrames = options.maxFrames || 25;
  const micronsPerPixel = options.micronsPerPixel || 0.81;
  const chamberDepthMicrons = options.chamberDepthMicrons || 20;
  const onProgress = options.onProgress || (() => {});

  const width = video.videoWidth || 780;
  const height = video.videoHeight || 580;
  const duration = video.duration || 1.0;

  const totalFrames = Math.min(maxFrames, Math.max(5, Math.floor(duration * fps)));

  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const ctx = offscreen.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Unable to create offscreen canvas 2D context for video tracing');
  }

  onProgress(5, 'Extracting optical microscopy frames...');

  // Helper to seek video and wait for frame
  const seekVideo = (time: number): Promise<void> => {
    return new Promise((resolve) => {
      const onSeeked = () => {
        video.removeEventListener('seeked', onSeeked);
        resolve();
      };
      video.addEventListener('seeked', onSeeked);
      video.currentTime = Math.min(duration - 0.01, Math.max(0, time));
    });
  };

  const framesGray: Uint8Array[] = [];

  for (let f = 0; f < totalFrames; f++) {
    const targetTime = (f / totalFrames) * duration;
    await seekVideo(targetTime);
    ctx.drawImage(video, 0, 0, width, height);
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    const gray = new Uint8Array(width * height);
    for (let i = 0; i < width * height; i++) {
      gray[i] = Math.round(data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114);
    }
    framesGray.push(gray);

    const pct = Math.round(5 + (f / totalFrames) * 45);
    onProgress(pct, `Sampling frame ${f + 1}/${totalFrames}...`);
  }

  onProgress(55, 'Detecting sperm head centroids via frame differencing...');

  // Detect centroids per frame
  const frameDetections: { x: number; y: number; mass: number; diff: number }[][] = [];

  for (let t = 0; t < framesGray.length; t++) {
    const cur = framesGray[t];
    const prev = t > 0 ? framesGray[t - 1] : framesGray[t];
    const diffBlobs: { x: number; y: number; diff: number }[] = [];

    // Step by 2 pixels for fast and reliable scanning
    for (let y = 14; y < height - 14; y += 2) {
      for (let x = 14; x < width - 14; x += 2) {
        const idx = y * width + x;
        const diff = Math.abs(cur[idx] - prev[idx]);
        if (diff > 16) {
          diffBlobs.push({ x, y, diff });
        }
      }
    }

    // Cluster diff points
    const clusters: { x: number; y: number; mass: number; diff: number }[] = [];
    const visited = new Uint8Array(diffBlobs.length);

    for (let i = 0; i < diffBlobs.length; i++) {
      if (visited[i]) continue;
      visited[i] = 1;
      let sx = diffBlobs[i].x;
      let sy = diffBlobs[i].y;
      let cnt = 1;
      let maxD = diffBlobs[i].diff;

      for (let j = i + 1; j < diffBlobs.length; j++) {
        if (visited[j]) continue;
        const dx = diffBlobs[i].x - diffBlobs[j].x;
        const dy = diffBlobs[i].y - diffBlobs[j].y;
        if (dx * dx + dy * dy < 144) {
          visited[j] = 1;
          sx += diffBlobs[j].x;
          sy += diffBlobs[j].y;
          cnt++;
          if (diffBlobs[j].diff > maxD) maxD = diffBlobs[j].diff;
        }
      }

      if (cnt >= 3 && cnt <= 150) {
        clusters.push({
          x: sx / cnt,
          y: sy / cnt,
          mass: cnt,
          diff: maxD
        });
      }
    }
    frameDetections.push(clusters);
  }

  onProgress(75, 'Linking multi-target trajectories & calculating kinematics...');

  // Multi-target tracking (MOT)
  interface RawTrack {
    id: string;
    points: { x: number; y: number; frame: number; t: number }[];
    lastFrame: number;
  }

  const activeTracks: RawTrack[] = [];
  let nextTrackId = 1;
  const maxJump = 30; // Max expected pixels between frames

  for (let t = 0; t < frameDetections.length; t++) {
    const detections = frameDetections[t];
    const matchedDetections = new Set<number>();

    for (const track of activeTracks) {
      if (t - track.lastFrame > 2) continue; // Lost track
      const lastPt = track.points[track.points.length - 1];
      let bestDist = maxJump;
      let bestIdx = -1;

      for (let d = 0; d < detections.length; d++) {
        if (matchedDetections.has(d)) continue;
        const dx = detections[d].x - lastPt.x;
        const dy = detections[d].y - lastPt.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = d;
        }
      }

      if (bestIdx >= 0) {
        matchedDetections.add(bestIdx);
        track.points.push({
          x: Math.round(detections[bestIdx].x * 10) / 10,
          y: Math.round(detections[bestIdx].y * 10) / 10,
          frame: t,
          t: t / fps
        });
        track.lastFrame = t;
      }
    }

    for (let d = 0; d < detections.length; d++) {
      if (!matchedDetections.has(d)) {
        activeTracks.push({
          id: `SPM-${String(nextTrackId++).padStart(3, '0')}`,
          points: [
            {
              x: Math.round(detections[d].x * 10) / 10,
              y: Math.round(detections[d].y * 10) / 10,
              frame: t,
              t: t / fps
            }
          ],
          lastFrame: t
        });
      }
    }
  }

  const validTracks = activeTracks.filter((tr) => tr.points.length >= 4);

  // Detect stationary/immotile sperm from high-contrast spots in the reference frame
  const refFrame = framesGray[0];
  const immotileSpots: { x: number; y: number }[] = [];

  for (let y = 20; y < height - 20; y += 4) {
    for (let x = 20; x < width - 20; x += 4) {
      const val = refFrame[y * width + x];
      const n1 = refFrame[(y - 6) * width + x];
      const n2 = refFrame[(y + 6) * width + x];
      const n3 = refFrame[y * width + (x - 6)];
      const n4 = refFrame[y * width + (x + 6)];
      const bg = (n1 + n2 + n3 + n4) / 4;
      const contrast = Math.abs(val - bg);

      if (contrast > 25) {
        let nearMoving = false;
        for (const tr of validTracks) {
          for (const pt of tr.points) {
            const dx = pt.x - x;
            const dy = pt.y - y;
            if (dx * dx + dy * dy < 225) {
              nearMoving = true;
              break;
            }
          }
          if (nearMoving) break;
        }
        if (!nearMoving) {
          immotileSpots.push({ x, y });
        }
      }
    }
  }

  // Cluster immotile spots
  const immotileCentroids: { x: number; y: number }[] = [];
  const visImm = new Uint8Array(immotileSpots.length);
  for (let i = 0; i < immotileSpots.length; i++) {
    if (visImm[i]) continue;
    visImm[i] = 1;
    let sx = immotileSpots[i].x;
    let sy = immotileSpots[i].y;
    let cnt = 1;
    for (let j = i + 1; j < immotileSpots.length; j++) {
      if (visImm[j]) continue;
      const dx = immotileSpots[i].x - immotileSpots[j].x;
      const dy = immotileSpots[i].y - immotileSpots[j].y;
      if (dx * dx + dy * dy < 144) {
        visImm[j] = 1;
        sx += immotileSpots[j].x;
        sy += immotileSpots[j].y;
        cnt++;
      }
    }
    if (cnt >= 2 && cnt <= 20) {
      immotileCentroids.push({ x: Math.round(sx / cnt), y: Math.round(sy / cnt) });
    }
  }

  // Generate immotile tracks
  const maxImmotile = Math.min(40, Math.max(5, Math.round(validTracks.length * 0.35)));
  const immotileTracks: RawTrack[] = immotileCentroids.slice(0, maxImmotile).map((c, idx) => {
    const pts = [];
    for (let f = 0; f < totalFrames; f++) {
      pts.push({
        x: c.x,
        y: c.y,
        frame: f,
        t: f / fps
      });
    }
    return {
      id: `SPM-IMM-${String(idx + 1).padStart(2, '0')}`,
      points: pts,
      lastFrame: totalFrames - 1
    };
  });

  const allTracks = [...validTracks, ...immotileTracks];

  onProgress(90, 'Computing CASA WHO/IVF velocity metrics & indices...');

  const spermatozoa: SpermData[] = allTracks.map((tr) => {
    const pts = tr.points;
    let curvilinearDist = 0;
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i].x - pts[i - 1].x;
      const dy = pts[i].y - pts[i - 1].y;
      curvilinearDist += Math.sqrt(dx * dx + dy * dy);
    }
    const startPt = pts[0];
    const endPt = pts[pts.length - 1];
    const straightDist = Math.sqrt(Math.pow(endPt.x - startPt.x, 2) + Math.pow(endPt.y - startPt.y, 2));
    const trackDuration = Math.max(0.04, (endPt.frame - startPt.frame) / fps);

    const vcl = Number(((curvilinearDist * micronsPerPixel) / trackDuration).toFixed(1));
    const vsl = Number(((straightDist * micronsPerPixel) / trackDuration).toFixed(1));

    // Smooth moving average for VAP
    const windowSize = Math.min(5, pts.length);
    let avgPathDist = 0;
    const vapPoints: { x: number; y: number }[] = [];
    for (let i = 0; i <= pts.length - windowSize; i++) {
      let ax = 0;
      let ay = 0;
      for (let w = 0; w < windowSize; w++) {
        ax += pts[i + w].x;
        ay += pts[i + w].y;
      }
      vapPoints.push({ x: ax / windowSize, y: ay / windowSize });
    }
    for (let i = 1; i < vapPoints.length; i++) {
      const dx = vapPoints[i].x - vapPoints[i - 1].x;
      const dy = vapPoints[i].y - vapPoints[i - 1].y;
      avgPathDist += Math.sqrt(dx * dx + dy * dy);
    }
    const vap = Number(
      ((avgPathDist * micronsPerPixel) / Math.max(0.04, trackDuration * (vapPoints.length / pts.length))).toFixed(1)
    );

    const lin = vcl > 0 ? Number(Math.min(1.0, vsl / vcl).toFixed(2)) : 0;
    const str = vap > 0 ? Number(Math.min(1.0, vsl / vap).toFixed(2)) : 0;
    const wob = vcl > 0 ? Number(Math.min(1.0, vap / vcl).toFixed(2)) : 0;

    let maxDev = 0;
    for (let i = 0; i < pts.length; i++) {
      const vapIdx = Math.min(vapPoints.length - 1, Math.max(0, i - Math.floor(windowSize / 2)));
      if (vapPoints[vapIdx]) {
        const dx = pts[i].x - vapPoints[vapIdx].x;
        const dy = pts[i].y - vapPoints[vapIdx].y;
        const dev = Math.sqrt(dx * dx + dy * dy) * micronsPerPixel;
        if (dev > maxDev) maxDev = dev;
      }
    }
    const alh = Number((maxDev * 2).toFixed(1));
    const bcfSmoothed = movingAveragePath(pts, 2);
    const bcf = Number(computeBeatCrossFrequency(pts, bcfSmoothed, fps, trackDuration).toFixed(1));
    const mad = Number(computeMeanAngularDisplacement(pts).toFixed(1));

    let classification: 'progressive' | 'non-progressive' | 'immotile' = 'immotile';
    if (vcl >= 25 && lin >= 0.35) {
      classification = 'progressive';
    } else if (vcl >= 6) {
      classification = 'non-progressive';
    }

    const isHyper = vcl > 70 && lin < 0.45 && alh > 5;

    return {
      id: tr.id,
      path: pts.map((p) => ({ x: p.x, y: p.y, t: p.t })),
      vcl,
      vsl,
      vap,
      lin,
      str,
      wob,
      alh,
      bcf,
      mad,
      // A tracking pipeline cannot measure morphology. Keep neutral values so
      // nothing downstream can mistake a default for a classification.
      morphometry: {
        area: 0,
        perimeter: 0,
        length: 0,
        width: 0,
        circularity: 0,
        elongation: 0,
        lengthWidthRatio: 0,
        acrosomeAreaPercent: 0
      },
      morphology: {
        head: 'not_assessed',
        vacuoles: 'not_assessed',
        acrosome: 'not_assessed',
        midpiece: 'not_assessed',
        tail: 'not_assessed',
        droplet: 'not_assessed',
        krugerStrict: 'not_assessed'
      },
      vitality: 'not_assessed',
      classification,
      isHyperactivated: isHyper,
      hyperactivationType: isHyper ? 'linear_whiplash' : 'none',
      sdf: {
        fragmented: false,
        haloSized: 0,
        dfi: 0,
        assessed: false
      }
    };
  });

  const prog = spermatozoa.filter((s) => s.classification === 'progressive').length;
  const nonProg = spermatozoa.filter((s) => s.classification === 'non-progressive').length;
  const imm = spermatozoa.filter((s) => s.classification === 'immotile').length;
  const total = Math.max(1, spermatozoa.length);

  // Concentration is estimated from the median number of detected objects in a
  // single field, using the actual frame geometry and configured chamber depth.
  // It is not a validated volumetric count.
  const cellsPerFrame = frameDetections.map(
    (detections) => detections.length + immotileCentroids.length
  );
  const sortedCellsPerFrame = [...cellsPerFrame].sort((a, b) => a - b);
  const medianCellsPerFrame = sortedCellsPerFrame.length > 0
    ? sortedCellsPerFrame[Math.floor(sortedCellsPerFrame.length / 2)]
    : 0;
  const fieldWidthMm = (width * micronsPerPixel) / 1000;
  const fieldHeightMm = (height * micronsPerPixel) / 1000;
  const fieldAreaMm2 = fieldWidthMm * fieldHeightMm;
  const fieldVolumeMl = (fieldAreaMm2 * (chamberDepthMicrons / 1000)) / 1000;
  const concentrationEstimate = fieldVolumeMl > 0
    ? medianCellsPerFrame / fieldVolumeMl / 1_000_000
    : 0;

  const summary = {
    totalCount: total,
    concentration: Number(concentrationEstimate.toFixed(1)),
    leukocytes: 0,
    motility: {
      total: Number((((prog + nonProg) / total) * 100).toFixed(1)),
      progressive: Number(((prog / total) * 100).toFixed(1)),
      nonProgressive: Number(((nonProg / total) * 100).toFixed(1)),
      immotile: Number(((imm / total) * 100).toFixed(1))
    },
    kinematics: {
      avgVcl: Number((spermatozoa.reduce((acc, s) => acc + s.vcl, 0) / total).toFixed(1)),
      avgVsl: Number((spermatozoa.reduce((acc, s) => acc + s.vsl, 0) / total).toFixed(1)),
      avgVap: Number((spermatozoa.reduce((acc, s) => acc + s.vap, 0) / total).toFixed(1)),
      avgLin: Number((spermatozoa.reduce((acc, s) => acc + s.lin, 0) / total).toFixed(2)),
      avgStr: Number((spermatozoa.reduce((acc, s) => acc + s.str, 0) / total).toFixed(2)),
      avgWob: Number((spermatozoa.reduce((acc, s) => acc + s.wob, 0) / total).toFixed(2)),
      avgAlh: Number((spermatozoa.reduce((acc, s) => acc + s.alh, 0) / total).toFixed(1)),
      avgBcf: Number((spermatozoa.reduce((acc, s) => acc + s.bcf, 0) / total).toFixed(1)),
      hyperactivation: {
        count: spermatozoa.filter((s) => s.vcl > 70 && s.lin < 0.45 && s.alh > 5).length,
        percentage: Number(
          ((spermatozoa.filter((s) => s.vcl > 70 && s.lin < 0.45 && s.alh > 5).length / total) * 100).toFixed(1)
        )
      }
    },
    // No morphology, vitality, or DNA-fragmentation assay is performed by this
    // tracking pipeline. Report neutral values; provenance marks them unassessed.
    morphology: {
      normal: 0,
      abnormal: 0,
      krugerStrictNormal: 0,
      avgArea: 0,
      tzi: 0,
      mai: 0,
      sdi: 0,
      headDefects: {
        large: 0,
        small: 0,
        amorphous: 0,
        pyriform: 0,
        tapered: 0,
        round: 0,
        vacuolated: 0,
        double: 0
      },
      midpieceDefects: {
        thick: 0,
        bent: 0,
        asymmetric: 0,
        droplet: 0
      },
      tailDefects: {
        short: 0,
        coiled: 0,
        multiple: 0,
        bent: 0,
        broken: 0
      },
      acrosomeDefects: 0,
      cytoplasmicDroplets: 0
    },
    vitality: {
      live: 0,
      dead: 0,
      total: 0
    },
    sdf: {
      dfi: 0,
      fragmentedCount: 0,
      totalCount: 0,
      category: undefined
    }
  };

  onProgress(100, 'Analysis complete');

  return {
    spermatozoa,
    summary,
    fps,
    width,
    height,
    micronsPerPixel,
    totalFrames
  };
}

/**
 * Returns real-time position of each tracked cell at time t of video playback
 */
export function getSynchronizedFramePositions(
  spermatozoa: SpermData[],
  currentTime: number,
  duration: number
) {
  const normTime = duration > 0 ? (currentTime % duration) : 0;

  return spermatozoa.map((s) => {
    const pts = s.path;
    if (pts.length === 0) {
      return {
        id: s.id,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        classification: s.classification,
        vcl: s.vcl,
        vsl: s.vsl,
        visiblePath: []
      };
    }

    // Find point closest to current time
    let bestIdx = 0;
    let minDt = Math.abs(pts[0].t - normTime);
    for (let i = 1; i < pts.length; i++) {
      const dt = Math.abs(pts[i].t - normTime);
      if (dt < minDt) {
        minDt = dt;
        bestIdx = i;
      }
    }

    const cur = pts[bestIdx];
    const prev = pts[Math.max(0, bestIdx - 1)];
    const vx = cur.x - prev.x;
    const vy = cur.y - prev.y;

    // Path accumulated up to current time
    const visiblePath = pts.slice(0, bestIdx + 1);

    return {
      id: s.id,
      x: cur.x,
      y: cur.y,
      vx,
      vy,
      classification: s.classification,
      vcl: s.vcl,
      vsl: s.vsl,
      visiblePath
    };
  });
}
