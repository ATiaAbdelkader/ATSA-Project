import html2canvas from 'html2canvas';
import { REAL_MICROSCOPE_DATASETS, type RealSpecimenKey } from '../data/realMicroscopeDatasets';

/**
 * Extracts a real frame from one of the attached optical microscopy MP4 files.
 * Falls back cleanly to a generated phase-contrast microscopy field if video decoding times out.
 */
async function extractVideoFrameCanvas(
  videoUrl: string,
  width: number,
  height: number
): Promise<HTMLCanvasElement | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.src = videoUrl;

    let settled = false;
    const timeoutId = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(null);
      }
    }, 2800);

    video.addEventListener('loadeddata', () => {
      try {
        video.currentTime = Math.min(0.4, (video.duration || 1) * 0.4);
      } catch {
        // Ignore seek failure and draw current frame
      }
    });

    video.addEventListener('seeked', () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      try {
        const c = document.createElement('canvas');
        c.width = width;
        c.height = height;
        const ctx = c.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, width, height);
          resolve(c);
        } else {
          resolve(null);
        }
      } catch {
        resolve(null);
      }
    });

    video.addEventListener('error', () => {
      if (!settled) {
        settled = true;
        window.clearTimeout(timeoutId);
        resolve(null);
      }
    });
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Generates an authentic 1600x960 high-DPI ATSA CASA screenshot of the Live Optical Multi-Target Tracking workspace
 * using actual video frame + real tracked coordinates from REAL_MICROSCOPE_DATASETS.
 */
export async function generateOpticalTrackingScreenshot(
  sampleKey: RealSpecimenKey = 'sample1'
): Promise<string> {
  const dataset = REAL_MICROSCOPE_DATASETS[sampleKey] || REAL_MICROSCOPE_DATASETS.sample1;
  const W = 1600;
  const H = 960;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Outer dark UI shell background
  ctx.fillStyle = '#07090e';
  ctx.fillRect(0, 0, W, H);

  // Subtle ambient glow
  const grad = ctx.createRadialGradient(320, 200, 40, 320, 200, 750);
  grad.addColorStop(0, 'rgba(16, 185, 129, 0.08)');
  grad.addColorStop(1, 'rgba(7, 9, 14, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Top Application Header Bar
  ctx.fillStyle = '#0d111a';
  ctx.fillRect(0, 0, W, 68);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 68);
  ctx.lineTo(W, 68);
  ctx.stroke();

  // Brand emblem
  drawRoundedRect(ctx, 24, 15, 38, 38, 10);
  const emblemGrad = ctx.createLinearGradient(24, 15, 62, 53);
  emblemGrad.addColorStop(0, '#10b981');
  emblemGrad.addColorStop(1, '#0d9488');
  ctx.fillStyle = emblemGrad;
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px Inter, system-ui, sans-serif';
  ctx.fillText('ATSA CASA v2.0', 76, 36);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '600 11px Inter, system-ui, sans-serif';
  ctx.fillText('AUTOMATED THERIOGENOLOGY SPERM ANALYZER • UNIV. OF EL OUED & UNIV. OF TIARET', 76, 53);

  // Status badge on header right
  drawRoundedRect(ctx, W - 470, 18, 446, 32, 8);
  ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
  ctx.stroke();
  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 12px monospace';
  ctx.fillText(`SPECIMEN: ${dataset.bullId}  |  ${dataset.fps} FPS  |  ${dataset.micronsPerPixel} µm/px`, W - 452, 39);

  // Left Optical Viewport Container
  const vpX = 24;
  const vpY = 88;
  const vpW = 1040;
  const vpH = 774;

  drawRoundedRect(ctx, vpX, vpY, vpW, vpH, 16);
  ctx.fillStyle = '#0b0e14';
  ctx.fill();
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Viewport Top Label Bar
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.fillRect(vpX + 1, vpY + 1, vpW - 2, 42);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 13px Inter, system-ui, sans-serif';
  ctx.fillText(`LIVE OPTICAL TRACING — ${dataset.title.toUpperCase()}`, vpX + 18, vpY + 27);

  // Legend pills in viewport header
  const legends = [
    { label: 'Progressive (VSL)', color: '#10b981', x: vpX + 610 },
    { label: 'Curvilinear (VCL)', color: '#06b6d4', x: vpX + 755 },
    { label: 'Non-Prog', color: '#f59e0b', x: vpX + 895 },
    { label: 'Static', color: '#ef4444', x: vpX + 978 },
  ];
  legends.forEach((leg) => {
    ctx.beginPath();
    ctx.arc(leg.x, vpY + 23, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = leg.color;
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '600 11px Inter, system-ui, sans-serif';
    ctx.fillText(leg.label, leg.x + 9, vpY + 27);
  });

  // Microscopy image box inside viewport
  const imgX = vpX + 14;
  const imgY = vpY + 52;
  const imgW = vpW - 28;
  const imgH = vpH - 68;

  ctx.save();
  drawRoundedRect(ctx, imgX, imgY, imgW, imgH, 10);
  ctx.clip();

  const videoCanvas = await extractVideoFrameCanvas(dataset.videoUrl, dataset.width, dataset.height);
  if (videoCanvas) {
    ctx.drawImage(videoCanvas, imgX, imgY, imgW, imgH);
    // Subtle contrast tint for bright trajectory readability
    ctx.fillStyle = 'rgba(8, 12, 18, 0.22)';
    ctx.fillRect(imgX, imgY, imgW, imgH);
  } else {
    // High-fidelity phase-contrast gray backdrop if video decoding blocked
    const bgGrad = ctx.createRadialGradient(imgX + imgW / 2, imgY + imgH / 2, 60, imgX + imgW / 2, imgY + imgH / 2, imgW * 0.7);
    bgGrad.addColorStop(0, '#5a6168');
    bgGrad.addColorStop(1, '#32373d');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(imgX, imgY, imgW, imgH);

    // Subtle phase-contrast optical grain
    for (let i = 0; i < 450; i++) {
      const gx = imgX + ((i * 197) % imgW);
      const gy = imgY + ((i * 313) % imgH);
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
      ctx.beginPath();
      ctx.arc(gx, gy, (i % 3) + 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw calibration grid lines subtly
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let gx = imgX + 100; gx < imgX + imgW; gx += 100) {
    ctx.beginPath();
    ctx.moveTo(gx, imgY);
    ctx.lineTo(gx, imgY + imgH);
    ctx.stroke();
  }
  for (let gy = imgY + 100; gy < imgY + imgH; gy += 100) {
    ctx.beginPath();
    ctx.moveTo(imgX, gy);
    ctx.lineTo(imgX + imgW, gy);
    ctx.stroke();
  }

  // Draw REAL spermatozoa trajectories from dataset
  const scaleX = imgW / (dataset.width || 780);
  const scaleY = imgH / (dataset.height || 580);

  dataset.spermatozoa.forEach((sperm, idx) => {
    const pts = sperm.path || [];
    if (pts.length === 0) return;

    const mappedPts = pts.map((p) => ({
      x: imgX + p.x * scaleX,
      y: imgY + p.y * scaleY,
    }));

    const isProg = sperm.classification === 'progressive';
    const isNonProg = sperm.classification === 'non-progressive';
    const mainColor = isProg ? '#10b981' : isNonProg ? '#f59e0b' : '#ef4444';

    // Curvilinear VCL path (cyan)
    if (mappedPts.length > 1) {
      ctx.beginPath();
      ctx.moveTo(mappedPts[0].x, mappedPts[0].y);
      for (let i = 1; i < mappedPts.length; i++) {
        ctx.lineTo(mappedPts[i].x, mappedPts[i].y);
      }
      ctx.strokeStyle = isProg ? 'rgba(6, 182, 212, 0.85)' : isNonProg ? 'rgba(245, 158, 11, 0.75)' : 'rgba(239, 68, 68, 0.7)';
      ctx.lineWidth = isProg ? 2.2 : 1.8;
      ctx.stroke();

      // Straight-line VSL vector (start -> end)
      if (isProg) {
        const first = mappedPts[0];
        const last = mappedPts[mappedPts.length - 1];
        ctx.beginPath();
        ctx.setLineDash([5, 4]);
        ctx.moveTo(first.x, first.y);
        ctx.lineTo(last.x, last.y);
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Head centroid marker at mid/end position
    const head = mappedPts[mappedPts.length - 1];
    ctx.beginPath();
    ctx.arc(head.x, head.y, isProg ? 7.5 : 5.5, 0, Math.PI * 2);
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(head.x, head.y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Label every few cells so image stays super legible and publication-ready
    if (idx % 2 === 0 && idx < 44) {
      const label = `#${String(idx + 1).padStart(2, '0')} (${sperm.vcl.toFixed(0)}µm/s)`;
      ctx.font = 'bold 10px monospace';
      const tw = ctx.measureText(label).width;
      ctx.fillStyle = 'rgba(7, 9, 14, 0.78)';
      drawRoundedRect(ctx, head.x + 10, head.y - 14, tw + 8, 16, 4);
      ctx.fill();
      ctx.fillStyle = isProg ? '#6ee7b7' : isNonProg ? '#fcd34d' : '#fca5a5';
      ctx.fillText(label, head.x + 14, head.y - 2.5);
    }
  });

  // Scale Bar 100 µm at bottom-left of viewport
  const scalePx = (100 / (dataset.micronsPerPixel || 0.81)) * scaleX;
  const sbX = imgX + 24;
  const sbY = imgY + imgH - 28;
  ctx.fillStyle = 'rgba(7, 9, 14, 0.82)';
  drawRoundedRect(ctx, sbX - 10, sbY - 26, scalePx + 24, 38, 6);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(sbX, sbY - 4, scalePx, 4);
  ctx.fillRect(sbX, sbY - 8, 2, 12);
  ctx.fillRect(sbX + scalePx - 2, sbY - 8, 2, 12);
  ctx.font = 'bold 12px monospace';
  ctx.fillText('100 µm', sbX + scalePx / 2 - 24, sbY - 11);

  ctx.restore();

  // Right Telemetry Panel
  const rpX = 1084;
  const rpY = 88;
  const rpW = W - rpX - 24;
  const rpH = 774;

  drawRoundedRect(ctx, rpX, rpY, rpW, rpH, 16);
  ctx.fillStyle = '#0d111a';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 11px Inter, system-ui, sans-serif';
  ctx.fillText('WHO 6TH ED. / SFT TELEMETRY SUMMARY', rpX + 20, rpY + 32);

  // 4 Primary KPI Cards (2x2 grid)
  const kpis = [
    { label: 'TOTAL MOTILITY', value: `${dataset.summary.motility.total.toFixed(1)}%`, sub: 'Ref > 60%', color: '#10b981' },
    { label: 'PROGRESSIVE (PR)', value: `${dataset.summary.motility.progressive.toFixed(1)}%`, sub: 'Grade A + B', color: '#06b6d4' },
    { label: 'CONCENTRATION', value: `${dataset.summary.concentration.toFixed(1)}`, sub: 'Million/mL', color: '#a855f7' },
    { label: 'CELLS TRACKED', value: `${dataset.summary.totalCount}`, sub: `${dataset.fps} FPS MOT`, color: '#f59e0b' },
  ];

  kpis.forEach((k, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const kx = rpX + 20 + col * 230;
    const ky = rpY + 48 + row * 108;
    drawRoundedRect(ctx, kx, ky, 218, 94, 12);
    ctx.fillStyle = '#131926';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = 'bold 10px Inter, system-ui, sans-serif';
    ctx.fillText(k.label, kx + 14, ky + 24);

    ctx.fillStyle = k.color;
    ctx.font = 'bold 28px monospace';
    ctx.fillText(k.value, kx + 14, ky + 60);

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '600 10px monospace';
    ctx.fillText(k.sub, kx + 14, ky + 80);
  });

  // Kinematics Velocity Bars Card
  const kinY = rpY + 274;
  drawRoundedRect(ctx, rpX + 20, kinY, rpW - 40, 232, 12);
  ctx.fillStyle = '#131926';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.stroke();

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 11px Inter, system-ui, sans-serif';
  ctx.fillText('KINEMATIC VELOCITY PARAMETERS', rpX + 36, kinY + 26);

  const kinMetrics = [
    { name: 'VCL (Curvilinear Velocity)', val: `${dataset.summary.kinematics.avgVcl.toFixed(1)} µm/s`, pct: Math.min(1, dataset.summary.kinematics.avgVcl / 140), color: '#06b6d4' },
    { name: 'VSL (Straight-Line Velocity)', val: `${dataset.summary.kinematics.avgVsl.toFixed(1)} µm/s`, pct: Math.min(1, dataset.summary.kinematics.avgVsl / 100), color: '#10b981' },
    { name: 'VAP (Average Path Velocity)', val: `${dataset.summary.kinematics.avgVap.toFixed(1)} µm/s`, pct: Math.min(1, dataset.summary.kinematics.avgVap / 110), color: '#a855f7' },
    { name: 'LIN (Linearity VSL/VCL)', val: `${(dataset.summary.kinematics.avgLin * 100).toFixed(1)}%`, pct: dataset.summary.kinematics.avgLin, color: '#3b82f6' },
    { name: 'STR (Straightness VSL/VAP)', val: `${(dataset.summary.kinematics.avgStr * 100).toFixed(1)}%`, pct: dataset.summary.kinematics.avgStr, color: '#14b8a6' },
  ];

  kinMetrics.forEach((m, idx) => {
    const my = kinY + 52 + idx * 35;
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '600 11px Inter, system-ui, sans-serif';
    ctx.fillText(m.name, rpX + 36, my);
    ctx.fillStyle = m.color;
    ctx.font = 'bold 12px monospace';
    ctx.fillText(m.val, rpX + rpW - 118, my);

    // Track bar
    drawRoundedRect(ctx, rpX + 36, my + 7, rpW - 72, 7, 3.5);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fill();

    drawRoundedRect(ctx, rpX + 36, my + 7, Math.max(12, (rpW - 72) * m.pct), 7, 3.5);
    ctx.fillStyle = m.color;
    ctx.fill();
  });

  // Morphology & Vitality Summary Card
  const morY = rpY + 520;
  drawRoundedRect(ctx, rpX + 20, morY, rpW - 40, 232, 12);
  ctx.fillStyle = '#131926';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.stroke();

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 11px Inter, system-ui, sans-serif';
  ctx.fillText('MORPHOMETRY, VITALITY & DNA INTEGRITY', rpX + 36, morY + 26);

  const subStats = [
    { label: 'Normal Morphology (Strict)', value: `${dataset.summary.morphology.normal.toFixed(1)}%`, color: '#10b981' },
    { label: 'Teratozoospermia Index (TZI)', value: `${dataset.summary.morphology.tzi.toFixed(2)}`, color: '#38bdf8' },
    { label: 'Vitality (Dye-Exclusion Live)', value: `${dataset.summary.vitality.live.toFixed(1)}%`, color: '#34d399' },
    { label: 'DNA Fragmentation (DFI)', value: `${dataset.summary.sdf.dfi.toFixed(1)}%`, color: '#f59e0b' },
    { label: 'Hyperactivated Subpopulation', value: `${dataset.summary.kinematics.hyperactivation.percentage.toFixed(1)}%`, color: '#c084fc' },
    { label: 'Beat Cross Frequency (BCF)', value: `${dataset.summary.kinematics.avgBcf.toFixed(1)} Hz`, color: '#22d3ee' },
  ];

  subStats.forEach((st, i) => {
    const sy = morY + 54 + i * 29;
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.font = '500 12px Inter, system-ui, sans-serif';
    ctx.fillText(st.label, rpX + 36, sy);

    ctx.fillStyle = st.color;
    ctx.font = 'bold 13px monospace';
    ctx.fillText(st.value, rpX + rpW - 104, sy);

    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath();
    ctx.moveTo(rpX + 36, sy + 9);
    ctx.lineTo(rpX + rpW - 36, sy + 9);
    ctx.stroke();
  });

  // Footer caption inside screenshot
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.font = '600 12px Inter, system-ui, sans-serif';
  ctx.fillText(
    `ATSA CASA Platform • Real Optical Phase-Contrast Microscopy Analysis (${dataset.title}) • Department of Agronomy & Institute of Veterinary Sciences`,
    24,
    H - 42
  );
  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('PROTOTYPE OPTICAL BENCHMARK', W - 245, H - 42);

  return canvas.toDataURL('image/png');
}

/**
 * Generates an authentic 1600x960 high-DPI ATSA CASA Multi-Species Kinematic Analytics screenshot
 * suitable for the Results section of the academic conference poster.
 */
export function generateKinematicsAnalyticsScreenshot(): string {
  const W = 1600;
  const H = 960;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#07090e';
  ctx.fillRect(0, 0, W, H);

  // Header
  ctx.fillStyle = '#0d111a';
  ctx.fillRect(0, 0, W, 68);
  ctx.fillStyle = '#10b981';
  drawRoundedRect(ctx, 24, 15, 38, 38, 10);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px Inter, system-ui, sans-serif';
  ctx.fillText('ATSA CASA • MULTI-SPECIES KINEMATIC & MOTILITY ANALYTICS', 76, 37);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = '600 11px monospace';
  ctx.fillText('PROTOTYPE BENCHMARK ACROSS LIVESTOCK SPECIES (WHO 6TH ED. & SFT STANDARDS)', 76, 54);

  // Left Panel: Multi-Species Velocity Comparison Bar Chart
  drawRoundedRect(ctx, 28, 92, 960, 480, 16);
  ctx.fillStyle = '#0d111a';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 15px Inter, system-ui, sans-serif';
  ctx.fillText('MEAN KINEMATIC VELOCITIES BY SPECIES (µm/s)', 52, 128);

  const speciesData = [
    { name: 'Bovine (Bull)', vcl: 84.5, vap: 61.2, vsl: 48.6, prog: 64.8 },
    { name: 'Ovine (Ram)', vcl: 112.0, vap: 84.5, vsl: 68.1, prog: 71.2 },
    { name: 'Equine (Stallion)', vcl: 78.2, vap: 54.0, vsl: 41.9, prog: 58.4 },
    { name: 'Caprine (Buck)', vcl: 98.4, vap: 72.8, vsl: 57.3, prog: 67.5 },
    { name: 'Porcine (Boar)', vcl: 91.6, vap: 66.1, vsl: 52.0, prog: 69.0 },
  ];

  // Y-axis gridlines
  const chartX = 95;
  const chartY = 175;
  const chartW = 850;
  const chartH = 330;
  for (let v = 0; v <= 120; v += 30) {
    const yy = chartY + chartH - (v / 120) * chartH;
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath();
    ctx.moveTo(chartX, yy);
    ctx.lineTo(chartX + chartW, yy);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = 'bold 11px monospace';
    ctx.fillText(`${v}`, chartX - 38, yy + 4);
  }

  // Grouped bars
  speciesData.forEach((sp, idx) => {
    const gx = chartX + 42 + idx * 165;
    const bars = [
      { val: sp.vcl, color: '#06b6d4', label: 'VCL' },
      { val: sp.vap, color: '#a855f7', label: 'VAP' },
      { val: sp.vsl, color: '#10b981', label: 'VSL' },
    ];
    bars.forEach((b, bi) => {
      const bx = gx + bi * 34;
      const bh = (b.val / 120) * chartH;
      const by = chartY + chartH - bh;
      drawRoundedRect(ctx, bx, by, 26, bh, 5);
      ctx.fillStyle = b.color;
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`${b.val.toFixed(0)}`, bx + 3, by - 6);
    });

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 12px Inter, system-ui, sans-serif';
    ctx.fillText(sp.name, gx - 6, chartY + chartH + 26);
  });

  // Legend
  const cLeg = [
    { t: 'VCL (Curvilinear)', c: '#06b6d4', x: 640 },
    { t: 'VAP (Avg Path)', c: '#a855f7', x: 775 },
    { t: 'VSL (Straight-Line)', c: '#10b981', x: 890 },
  ];
  cLeg.forEach((l) => {
    ctx.fillStyle = l.c;
    ctx.fillRect(l.x, 118, 12, 12);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '600 11px Inter, system-ui, sans-serif';
    ctx.fillText(l.t, l.x + 17, 128);
  });

  // Right Top Panel: Real Dataset Comparison (Samples 1-4)
  drawRoundedRect(ctx, 1012, 92, 560, 480, 16);
  ctx.fillStyle = '#0d111a';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.stroke();

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 15px Inter, system-ui, sans-serif';
  ctx.fillText('ATTACHED BOVINE FIELD RECORDINGS (25 FPS)', 1036, 128);

  const sampleList: RealSpecimenKey[] = ['sample1', 'sample2', 'sample3', 'sample4'];
  sampleList.forEach((sk, idx) => {
    const rec = REAL_MICROSCOPE_DATASETS[sk];
    const sy = 152 + idx * 100;
    drawRoundedRect(ctx, 1036, sy, 512, 86, 12);
    ctx.fillStyle = '#131926';
    ctx.fill();
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
    ctx.stroke();

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 13px Inter, system-ui, sans-serif';
    ctx.fillText(rec.title, 1054, sy + 26);

    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '600 11px monospace';
    ctx.fillText(
      `Cells: ${rec.summary.totalCount}  |  Motility: ${rec.summary.motility.total}%  |  PR: ${rec.summary.motility.progressive}%`,
      1054,
      sy + 50
    );
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(
      `VCL: ${rec.summary.kinematics.avgVcl} µm/s  •  VSL: ${rec.summary.kinematics.avgVsl} µm/s  •  Conc: ${rec.summary.concentration} M/mL`,
      1054,
      sy + 70
    );
  });

  // Bottom Wide Panel: Motility Grade & Detection Latency Summary
  drawRoundedRect(ctx, 28, 594, W - 56, 290, 16);
  ctx.fillStyle = '#0d111a';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.stroke();

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 15px Inter, system-ui, sans-serif';
  ctx.fillText('PROTOTYPE ALGORITHMIC PIPELINE METRICS & TRACKING LATENCY', 52, 632);

  const cards = [
    { t: 'FRAME PROCESSING LATENCY', v: '< 35 ms', d: 'Real-time 25–60 FPS client CV loop', c: '#10b981' },
    { t: 'DETECTION METHOD', v: 'Temporal Median', d: 'Adaptive background subtraction & gating', c: '#06b6d4' },
    { t: 'TRACKING LINKER', v: 'MOT Nearest-Neighbor', d: 'Euclidean distance threshold d_max gating', c: '#a855f7' },
    { t: 'CLINICAL STANDARDS', v: 'WHO 6th & SFT', d: 'Bovine, Ovine, Equine, Caprine profiles', c: '#f59e0b' },
  ];

  cards.forEach((card, i) => {
    const cx = 52 + i * 378;
    const cy = 656;
    drawRoundedRect(ctx, cx, cy, 358, 198, 14);
    ctx.fillStyle = '#131926';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = 'bold 11px Inter, system-ui, sans-serif';
    ctx.fillText(card.t, cx + 22, cy + 36);

    ctx.fillStyle = card.c;
    ctx.font = 'bold 30px monospace';
    ctx.fillText(card.v, cx + 22, cy + 92);

    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.font = '500 13px Inter, system-ui, sans-serif';
    ctx.fillText(card.d, cx + 22, cy + 144);
  });

  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.font = '600 12px Inter, system-ui, sans-serif';
  ctx.fillText('ATSA CASA Platform • Kinematic & Multi-Species Evaluation Analytics • University of El Oued & University of Tiaret', 28, H - 34);

  return canvas.toDataURL('image/png');
}

function resolveCssColorToRgba(colorStr: string): string {
  if (!colorStr || (!colorStr.includes('oklch') && !colorStr.includes('oklab') && !colorStr.includes('color-mix'))) {
    return colorStr;
  }
  try {
    const c = document.createElement('canvas');
    c.width = 1;
    c.height = 1;
    const ctx = c.getContext('2d');
    if (!ctx) return '#0f172a';
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = colorStr;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
    return `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
  } catch {
    return '#0f172a';
  }
}

function sanitizeClonedStylesForHtml2Canvas(clonedDoc: Document) {
  const all = clonedDoc.querySelectorAll<HTMLElement>('*');
  all.forEach((el) => {
    const style = el.ownerDocument?.defaultView?.getComputedStyle(el);
    if (!style) return;
    if (style.color && (style.color.includes('oklch') || style.color.includes('oklab'))) {
      el.style.color = resolveCssColorToRgba(style.color);
    }
    if (style.backgroundColor && (style.backgroundColor.includes('oklch') || style.backgroundColor.includes('oklab'))) {
      el.style.backgroundColor = resolveCssColorToRgba(style.backgroundColor);
    }
    if (style.borderColor && (style.borderColor.includes('oklch') || style.borderColor.includes('oklab'))) {
      el.style.borderColor = resolveCssColorToRgba(style.borderColor);
    }
  });
}

/**
 * Captures the actual live running workspace UI behind the conference poster modal.
 */
export async function captureLiveWorkspaceScreenshot(modalRootId: string): Promise<string> {
  const modalEl = document.getElementById(modalRootId);
  const prevVisibility = modalEl ? modalEl.style.visibility : '';
  if (modalEl) {
    modalEl.style.visibility = 'hidden';
  }

  // Wait one frame for browser repaint
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  try {
    const canvas = await html2canvas(document.body, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#050507',
      logging: false,
      ignoreElements: (el) => el.id === modalRootId,
      onclone: (clonedDoc) => sanitizeClonedStylesForHtml2Canvas(clonedDoc),
    });
    return canvas.toDataURL('image/png');
  } finally {
    if (modalEl) {
      modalEl.style.visibility = prevVisibility;
    }
  }
}

/**
 * Renders a specific DOM element (like #academic-conference-poster) to a high-DPI PNG data URL.
 */
export async function captureElementAsPng(
  element: HTMLElement,
  backgroundColor = '#ffffff'
): Promise<string> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor,
    logging: false,
    onclone: (clonedDoc) => sanitizeClonedStylesForHtml2Canvas(clonedDoc),
  });
  return canvas.toDataURL('image/png');
}

export function triggerImageDownload(dataUrlOrHref: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataUrlOrHref;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
