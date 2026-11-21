import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Activity, 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  Info, 
  Sparkles, 
  Zap, 
  Sliders, 
  Eye, 
  CheckCircle2, 
  Waves,
  Maximize2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';
import type { SpermData } from '../types';

interface FlagellarWaveformAnalyzerProps {
  spermatozoa: SpermData[];
  selectedSpermId?: string | null;
  onSelectSperm?: (spermId: string) => void;
  theme?: 'light' | 'dark';
}

export const FlagellarWaveformAnalyzer: React.FC<FlagellarWaveformAnalyzerProps> = ({
  spermatozoa,
  selectedSpermId,
  onSelectSperm,
  theme = 'dark'
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(0.5); // 0.25x, 0.5x, 1.0x
  const [activeFrame, setActiveFrame] = useState<number>(0);
  const [selectedSegmentIdx, setSelectedSegmentIdx] = useState<number>(10); // Arc length segment
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Active Sperm Selection (Default to highest motility sperm or selected)
  const activeSperm = useMemo(() => {
    if (!spermatozoa || spermatozoa.length === 0) return null;
    if (selectedSpermId) {
      const found = spermatozoa.find(s => s.id === selectedSpermId);
      if (found) return found;
    }
    // Default to progressive sperm with high BCF
    return [...spermatozoa].sort((a, b) => b.bcf - a.bcf)[0] || spermatozoa[0];
  }, [spermatozoa, selectedSpermId]);

  // Generate Flagellar Tail Kinematics & Waveform Series (30 frames)
  const flagellarModel = useMemo(() => {
    if (!activeSperm) {
      return {
        tailLengthMicrons: 45,
        beatFrequencyHz: 24,
        waveAmplitudeMicrons: 8.5,
        wavelengthMicrons: 32,
        waveSpeedMicronsPerSec: 768,
        asymmetryRatio: 1.04,
        frames: [],
        kymographGrid: []
      };
    }

    const tailLength = 45; // Standard human sperm tail length in µm
    const bcf = activeSperm.bcf || 22;
    const waveAmp = Math.max(4.5, (activeSperm.alh || 3.5) * 1.8);
    const wavelength = 30 + (activeSperm.vcl / 100) * 10;
    const waveSpeed = bcf * wavelength;
    const asymmetry = 1.0 + (activeSperm.mad || 15) / 200;

    const numFrames = 36; // 1.5 complete beat cycles
    const numSegments = 24; // Points along flagellum from head to tip
    const frames = [];
    const kymographGrid = [];

    for (let f = 0; f < numFrames; f++) {
      const timeSec = (f / numFrames) * (1.5 / bcf);
      const points = [];
      const curvatures = [];

      for (let s = 0; s <= numSegments; s++) {
        const arcLength = (s / numSegments) * tailLength; // µm from neck
        // Damped travelling sine wave: y(s, t) = A(s) * sin(2π(s/λ - f*t)) + asymmetry offset
        const envelope = Math.pow(arcLength / tailLength, 1.2) * waveAmp; // Amplitude grows towards tail tip
        const phase = 2 * Math.PI * (arcLength / wavelength - bcf * timeSec);
        const yDisp = envelope * Math.sin(phase) + (asymmetry - 1) * 2.5 * Math.sin(phase * 0.5);
        
        // Local flagellar curvature κ(s, t) ≈ d²y/ds²
        const curvature = -envelope * Math.pow(2 * Math.PI / wavelength, 2) * Math.sin(phase);

        points.push({
          s: arcLength,
          x: arcLength * 0.95, // slight foreshortening due to wave curvature
          y: yDisp,
          curvature: curvature
        });

        curvatures.push({
          frame: f,
          arcLength: arcLength,
          curvature: curvature
        });
      }

      frames.push({
        frameIndex: f,
        timeMs: (timeSec * 1000).toFixed(1),
        points
      });

      kymographGrid.push(curvatures);
    }

    return {
      tailLengthMicrons: tailLength,
      beatFrequencyHz: bcf,
      waveAmplitudeMicrons: waveAmp,
      wavelengthMicrons: wavelength,
      waveSpeedMicronsPerSec: waveSpeed,
      asymmetryRatio: asymmetry,
      frames,
      kymographGrid
    };
  }, [activeSperm]);

  // Frame Animation Loop
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveFrame((prev) => (prev + 1) % 36);
    }, (1000 / 30) / playbackSpeed);
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

  // Render high-speed flagellar waveform on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !flagellarModel.frames[activeFrame]) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const currentFrameData = flagellarModel.frames[activeFrame];
    const points = currentFrameData.points;

    // Origin centered vertically, shifted left for head
    const originX = 70;
    const originY = height / 2;
    const scale = (width - 120) / 45; // scale to fit 45µm in canvas

    // 1. Draw Grid Lines
    ctx.strokeStyle = theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = originX; x < width; x += scale * 10) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.stroke();

    // 2. Draw Sperm Head (Ellipse)
    ctx.save();
    ctx.translate(originX, originY);
    ctx.fillStyle = theme === 'dark' ? '#0ea5e9' : '#0284c7';
    ctx.shadowColor = '#0ea5e9';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(-14, 0, 14, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Acrosome cap highlight
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.ellipse(-20, 0, 6, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. Draw Flagellar Tail with Color Gradient according to Curvature κ
    if (points.length > 1) {
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];

        const x1 = originX + p1.x * scale;
        const y1 = originY + p1.y * scale;
        const x2 = originX + p2.x * scale;
        const y2 = originY + p2.y * scale;

        // Color based on curvature intensity: Teal = negative curve, Purple/Pink = positive curve
        const cur = p1.curvature;
        const norm = Math.min(1, Math.abs(cur) * 12);
        const color = cur > 0 
          ? `rgba(236, 72, 153, ${0.4 + norm * 0.6})` // Pink
          : `rgba(16, 185, 129, ${0.4 + norm * 0.6})`; // Emerald

        ctx.strokeStyle = color;
        ctx.lineWidth = i < 6 ? 4.5 : i < 18 ? 3.0 : 1.8; // Tapering flagellum
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Draw active segment indicator
      const activeSegPoint = points[selectedSegmentIdx] || points[points.length - 1];
      const ptX = originX + activeSegPoint.x * scale;
      const ptY = originY + activeSegPoint.y * scale;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(ptX, ptY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, [activeFrame, flagellarModel, theme, selectedSegmentIdx]);

  // Time-series curvature data for the selected segment
  const segmentCurvatureSeries = useMemo(() => {
    return flagellarModel.frames.map((f) => {
      const pt = f.points[selectedSegmentIdx] || f.points[0];
      return {
        time: `${f.timeMs}ms`,
        curvature: pt.curvature,
        amplitude: pt.y
      };
    });
  }, [flagellarModel, selectedSegmentIdx]);

  return (
    <div className="w-full space-y-6">
      {/* Header Info */}
      <div className={cn(
        "p-6 rounded-3xl border relative overflow-hidden transition-all",
        theme === 'dark' 
          ? "bg-[#09090b] border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.4)]" 
          : "bg-white border-slate-200/80 shadow-[0_12px_40px_rgba(0,0,0,0.03)]"
      )}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Waves className="w-5 h-5 animate-pulse" />
              </span>
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-purple-400 uppercase">
                  SpermQ Algorithm Standard • Flagellar Dynamics
                </span>
                <h2 className={cn("text-xl font-black tracking-tight", theme === 'dark' ? "text-white" : "text-slate-900")}>
                  Flagellar Waveform & Beat Frequency Kymograph
                </h2>
              </div>
            </div>
            <p className={cn("text-xs max-w-2xl leading-relaxed", theme === 'dark' ? "text-white/60" : "text-slate-500")}>
              Reconstructs the traveling wave propagation along the flagellum arc length (s). Quantifies flagellar curvature (κ), waveform symmetry, beat frequency (f_beat), and thrust efficiency.
            </p>
          </div>

          {/* Quick Sperm Selector Pill */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-muted-foreground">Inspecting:</span>
            <select
              value={activeSperm?.id || ''}
              onChange={(e) => onSelectSperm && onSelectSperm(e.target.value)}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-mono font-bold border cursor-pointer focus:outline-none focus:border-purple-500",
                theme === 'dark' ? "bg-black/50 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-900"
              )}
            >
              {spermatozoa.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} — BCF: {s.bcf} Hz | ALH: {s.alh} µm ({s.classification})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4 Flagellar Metrics KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/5">
          <div className={cn("p-4 rounded-2xl border", theme === 'dark' ? "bg-black/40 border-white/5" : "bg-slate-50 border-slate-100")}>
            <span className="text-[9px] font-mono uppercase font-bold text-purple-400 block mb-1">Beat Frequency (f_beat)</span>
            <div className="flex items-baseline gap-1.5">
              <span className={cn("text-2xl font-black font-mono", theme === 'dark' ? "text-white" : "text-slate-900")}>
                {flagellarModel.beatFrequencyHz.toFixed(1)}
              </span>
              <span className="text-xs font-mono text-muted-foreground">Hz</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Tail oscillations per sec</span>
          </div>

          <div className={cn("p-4 rounded-2xl border", theme === 'dark' ? "bg-black/40 border-white/5" : "bg-slate-50 border-slate-100")}>
            <span className="text-[9px] font-mono uppercase font-bold text-pink-400 block mb-1">Wave Amplitude (A_max)</span>
            <div className="flex items-baseline gap-1.5">
              <span className={cn("text-2xl font-black font-mono", theme === 'dark' ? "text-white" : "text-slate-900")}>
                {flagellarModel.waveAmplitudeMicrons.toFixed(1)}
              </span>
              <span className="text-xs font-mono text-muted-foreground">µm</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Peak lateral tail envelope</span>
          </div>

          <div className={cn("p-4 rounded-2xl border", theme === 'dark' ? "bg-black/40 border-white/5" : "bg-slate-50 border-slate-100")}>
            <span className="text-[9px] font-mono uppercase font-bold text-sky-400 block mb-1">Wavelength (λ)</span>
            <div className="flex items-baseline gap-1.5">
              <span className={cn("text-2xl font-black font-mono", theme === 'dark' ? "text-white" : "text-slate-900")}>
                {flagellarModel.wavelengthMicrons.toFixed(1)}
              </span>
              <span className="text-xs font-mono text-muted-foreground">µm</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Spatial period of wave</span>
          </div>

          <div className={cn("p-4 rounded-2xl border", theme === 'dark' ? "bg-black/40 border-white/5" : "bg-slate-50 border-slate-100")}>
            <span className="text-[9px] font-mono uppercase font-bold text-emerald-400 block mb-1">Wave Speed (v_wave)</span>
            <div className="flex items-baseline gap-1.5">
              <span className={cn("text-2xl font-black font-mono", theme === 'dark' ? "text-white" : "text-slate-900")}>
                {flagellarModel.waveSpeedMicronsPerSec.toFixed(0)}
              </span>
              <span className="text-xs font-mono text-muted-foreground">µm/s</span>
            </div>
            <span className="text-[10px] text-muted-foreground">Propagation velocity</span>
          </div>
        </div>
      </div>

      {/* Main Canvas Player & Kymograph Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: High-Speed Flagellar Animator (7 cols) */}
        <div className={cn(
          "lg:col-span-7 p-6 rounded-3xl border flex flex-col justify-between",
          theme === 'dark' ? "bg-[#09090b] border-white/[0.06]" : "bg-white border-slate-200/80"
        )}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-purple-400 block">
                  High-Speed Micrograph Simulation
                </span>
                <h3 className={cn("text-base font-black", theme === 'dark' ? "text-white" : "text-slate-900")}>
                  Flagellar Waveform Motion View
                </h3>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white transition-all cursor-pointer shadow-lg shadow-purple-500/20"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <div className={cn(
                  "flex items-center p-1 rounded-xl border text-[10px] font-mono font-bold",
                  theme === 'dark' ? "bg-black/40 border-white/10" : "bg-slate-100 border-slate-200"
                )}>
                  {[0.25, 0.5, 1.0].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setPlaybackSpeed(spd)}
                      className={cn(
                        "px-2 py-1 rounded-lg transition-all cursor-pointer",
                        playbackSpeed === spd 
                          ? "bg-purple-500 text-white font-black" 
                          : "text-muted-foreground hover:text-white"
                      )}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Canvas viewport */}
            <div className={cn(
              "w-full h-56 rounded-2xl border relative overflow-hidden flex items-center justify-center",
              theme === 'dark' ? "bg-black/60 border-white/5" : "bg-slate-900 border-slate-800"
            )}>
              <canvas 
                ref={canvasRef} 
                width={560} 
                height={220} 
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-2 left-3 text-[9px] font-mono text-white/40">
                Frame {activeFrame + 1} / 36 ({flagellarModel.frames[activeFrame]?.timeMs}ms)
              </div>
              <div className="absolute top-2 right-3 text-[9px] font-mono text-purple-400 bg-black/60 px-2 py-0.5 rounded border border-purple-500/30">
                Tapered Flagellum (45µm)
              </div>
            </div>
          </div>

          {/* Segment Slider & Details */}
          <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-mono text-muted-foreground">Select Flagellar Segment (Arc length $s$):</span>
              <span className="font-mono font-bold text-amber-400">
                {((selectedSegmentIdx / 24) * 45).toFixed(1)} µm from neck ({selectedSegmentIdx < 6 ? 'Midpiece' : selectedSegmentIdx < 18 ? 'Principal Piece' : 'End Piece'})
              </span>
            </div>
            <input 
              type="range"
              min="0"
              max="24"
              value={selectedSegmentIdx}
              onChange={(e) => setSelectedSegmentIdx(parseInt(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-slate-200 dark:bg-white/10 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Right: Curvature κ(t) Over Time Line Chart (5 cols) */}
        <div className={cn(
          "lg:col-span-5 p-6 rounded-3xl border flex flex-col justify-between",
          theme === 'dark' ? "bg-[#09090b] border-white/[0.06]" : "bg-white border-slate-200/80"
        )}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-pink-500 block">
                  Segment Oscillations
                </span>
                <h3 className={cn("text-base font-black", theme === 'dark' ? "text-white" : "text-slate-900")}>
                  Curvature κ(t) & Amplitude
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-pink-500/10 text-pink-400 px-2.5 py-1 rounded-lg border border-pink-500/20">
                rad / µm
              </span>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={segmentCurvatureSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                  <XAxis 
                    dataKey="time" 
                    stroke={theme === 'dark' ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.4)"}
                    fontSize={9}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke={theme === 'dark' ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.4)"}
                    fontSize={9}
                    tickLine={false}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className={cn(
                            "p-3 rounded-xl border shadow-xl font-mono text-xs space-y-1",
                            theme === 'dark' ? "bg-black/95 border-pink-500/30 text-white" : "bg-white/95 border-pink-500/30 text-slate-900"
                          )}>
                            <p className="font-bold text-pink-400">Time: {d.time}</p>
                            <p>Curvature: {d.curvature.toFixed(3)} rad/µm</p>
                            <p>Displacement: {d.amplitude.toFixed(2)} µm</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeDasharray="2 2" />
                  <Line 
                    type="monotone" 
                    dataKey="curvature" 
                    stroke="#ec4899" 
                    strokeWidth={2.5} 
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
            <span>Harmonic symmetry: {flagellarModel.asymmetryRatio.toFixed(2)}</span>
            <span className="text-emerald-400">Planar Sinusoidal Mode</span>
          </div>
        </div>
      </div>

      {/* Flagellar Spatio-Temporal Kymograph Visual Grid */}
      <div className={cn(
        "p-6 rounded-3xl border overflow-hidden",
        theme === 'dark' ? "bg-[#09090b] border-white/[0.06]" : "bg-white border-slate-200/80"
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-[10px] font-mono uppercase font-bold tracking-widest text-purple-400">
                SpermQ Spatio-Temporal Heatmap
              </span>
            </div>
            <h3 className={cn("text-base font-black", theme === 'dark' ? "text-white" : "text-slate-900")}>
              Flagellar Curvature Kymograph κ(s, t)
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Visualizes traveling wave crests (pink) and troughs (emerald) propagating from neck ($s=0$) to tip ($s=45\mu m$) over time. Diagonal stripes indicate forward wave velocity.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-pink-500" /> +Curvature</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500" /> -Curvature</span>
          </div>
        </div>

        {/* Kymograph Heatmap Matrix */}
        <div className="overflow-x-auto custom-scrollbar">
          <div className="min-w-[600px] flex flex-col gap-1 p-2 rounded-2xl bg-black/60 border border-white/5">
            {flagellarModel.kymographGrid.map((row, frameIdx) => (
              <div key={frameIdx} className="flex items-center gap-1">
                <span className="w-12 text-[8px] font-mono text-white/30 text-right pr-2 shrink-0">
                  F{frameIdx + 1}
                </span>
                <div className="flex-1 flex gap-0.5 h-3">
                  {row.map((cell, cellIdx) => {
                    const norm = Math.min(1, Math.abs(cell.curvature) * 10);
                    const bg = cell.curvature > 0 
                      ? `rgba(236, 72, 153, ${norm})` 
                      : `rgba(16, 185, 129, ${norm})`;
                    return (
                      <div 
                        key={cellIdx}
                        title={`Frame ${frameIdx + 1} | Arc length: ${cell.arcLength.toFixed(1)}µm | κ: ${cell.curvature.toFixed(3)}`}
                        className="flex-1 rounded-xs transition-opacity hover:opacity-80 cursor-pointer"
                        style={{ backgroundColor: bg }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
            {/* Axis Footer */}
            <div className="flex items-center gap-1 pt-2 border-t border-white/10 text-[9px] font-mono text-white/40">
              <span className="w-12 text-right pr-2">s (µm):</span>
              <div className="flex-1 flex justify-between">
                <span>0 µm (Neck)</span>
                <span>15 µm (Midpiece)</span>
                <span>30 µm (Principal)</span>
                <span>45 µm (Tip)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
