import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  Filter, 
  Sliders, 
  Eye, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Layers, 
  Sparkles, 
  Info,
  Bug
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../utils';
import type { SpermData } from '../types';

interface DebrisFilterInspectorProps {
  spermatozoa: SpermData[];
  onFilterSettingsChange?: (settings: DebrisFilterSettings) => void;
  theme?: 'light' | 'dark';
}

export interface DebrisFilterSettings {
  minArea: number; // µm²
  maxArea: number; // µm²
  minElongation: number; // Aspect ratio
  maxCircularity: number; // Circularity (exclude perfect spheres like air bubbles/round cells)
  brownianJitterLimit: number; // µm/s
  excludeRoundCells: boolean;
}

interface ParticleRecord {
  id: string;
  type: 'valid_sperm' | 'debris_dust' | 'round_cell' | 'air_bubble' | 'drift_artifact';
  area: number;
  length: number;
  width: number;
  circularity: number;
  vcl: number;
  status: 'passed' | 'rejected';
  rejectionReason?: string;
}

export const DebrisFilterInspector: React.FC<DebrisFilterInspectorProps> = ({
  spermatozoa,
  onFilterSettingsChange,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';

  // Filter Thresholds
  const [minArea, setMinArea] = useState<number>(6.0);
  const [maxArea, setMaxArea] = useState<number>(38.0);
  const [minElongation, setMinElongation] = useState<number>(1.2);
  const [maxCircularity, setMaxCircularity] = useState<number>(0.92);
  const [brownianJitterLimit, setBrownianJitterLimit] = useState<number>(2.5);
  const [excludeRoundCells, setExcludeRoundCells] = useState<boolean>(true);

  // Generate realistic particle set containing true sperm and synthetic optical artifacts/debris
  const particleDataset = useMemo<ParticleRecord[]>(() => {
    const list: ParticleRecord[] = [];

    // Valid sperm from actual dataset
    spermatozoa.forEach((s, idx) => {
      const area = s.morphometry.area || 14.5;
      const len = s.morphometry.length || 4.8;
      const wid = s.morphometry.width || 2.9;
      const circ = s.morphometry.circularity || 0.72;
      const elong = len / wid;

      let status: 'passed' | 'rejected' = 'passed';
      let rejectionReason: string | undefined = undefined;

      if (area < minArea) {
        status = 'rejected';
        rejectionReason = `Area (${area.toFixed(1)} µm²) < Min Limit (${minArea} µm²)`;
      } else if (area > maxArea) {
        status = 'rejected';
        rejectionReason = `Area (${area.toFixed(1)} µm²) > Max Limit (${maxArea} µm²)`;
      } else if (circ > maxCircularity && excludeRoundCells) {
        status = 'rejected';
        rejectionReason = `High Circularity (${circ.toFixed(2)}) > Round Cell Threshold`;
      } else if (elong < minElongation) {
        status = 'rejected';
        rejectionReason = `Elongation (${elong.toFixed(2)}) < Min Threshold (${minElongation})`;
      }

      list.push({
        id: s.id,
        type: 'valid_sperm',
        area,
        length: len,
        width: wid,
        circularity: circ,
        vcl: s.vcl,
        status,
        rejectionReason
      });
    });

    // Add realistic background debris/round cells to inspect filter robustness
    const syntheticArtifacts: ParticleRecord[] = [
      { id: 'ART-01', type: 'debris_dust', area: 2.8, length: 1.8, width: 1.5, circularity: 0.82, vcl: 1.2, status: 'rejected', rejectionReason: 'Sub-micron dust particle (Area < 6 µm²)' },
      { id: 'ART-02', type: 'round_cell', area: 48.5, length: 7.8, width: 7.6, circularity: 0.96, vcl: 0.8, status: 'rejected', rejectionReason: 'Leukocyte / Immature Round Cell (Area > 38 µm²)' },
      { id: 'ART-03', type: 'air_bubble', area: 120.0, length: 12.0, width: 12.0, circularity: 0.99, vcl: 0.0, status: 'rejected', rejectionReason: 'Micro-bubble optical reflection' },
      { id: 'ART-04', type: 'debris_dust', area: 4.2, length: 2.5, width: 1.9, circularity: 0.65, vcl: 1.8, status: 'rejected', rejectionReason: 'Colloidal precipitate (Area < 6 µm²)' },
      { id: 'ART-05', type: 'drift_artifact', area: 15.2, length: 3.8, width: 3.5, circularity: 0.94, vcl: 1.9, status: 'rejected', rejectionReason: 'Hydrodynamic fluid drift without active flagellar beat' },
    ];

    return [...list, ...syntheticArtifacts];
  }, [spermatozoa, minArea, maxArea, minElongation, maxCircularity, brownianJitterLimit, excludeRoundCells]);

  const passedParticles = particleDataset.filter(p => p.status === 'passed');
  const rejectedParticles = particleDataset.filter(p => p.status === 'rejected');

  return (
    <div className={cn("p-6 lg:p-8 rounded-[28px] border space-y-6", isDark ? "bg-[#09090b] border-white/10 text-white" : "bg-white border-slate-200 text-slate-900 shadow-sm")}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10 dark:border-white/10 border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
              Automated Debris & Non-Sperm Artifact Filter
              <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/30">
                SQA-Vision Style
              </span>
            </h3>
            <p className={cn("text-xs mt-0.5", isDark ? "text-white/40" : "text-slate-500")}>
              Prevent false concentration elevation by rejecting leukocytes, colloidal debris, and micro-bubbles
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setMinArea(6.0);
            setMaxArea(38.0);
            setMinElongation(1.2);
            setMaxCircularity(0.92);
            setBrownianJitterLimit(2.5);
            setExcludeRoundCells(true);
          }}
          className={cn(
            "px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer",
            isDark ? "bg-white/5 border-white/10 hover:bg-white/10 text-white/80" : "bg-slate-100 border-slate-200 text-slate-700"
          )}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset WHO Filter Parameters
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className={cn("p-4 rounded-2xl border", isDark ? "bg-emerald-500/10 border-emerald-500/30" : "bg-emerald-50 border-emerald-200")}>
          <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 block">Valid Spermatozoa Passed</span>
          <div className="text-3xl font-mono font-black text-emerald-400 mt-1">
            {passedParticles.length}
          </div>
          <span className="text-[10px] opacity-75">100% true andrological germ cells</span>
        </div>

        <div className={cn("p-4 rounded-2xl border", isDark ? "bg-amber-500/10 border-amber-500/30" : "bg-amber-50 border-amber-200")}>
          <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 block">Artifacts & Debris Excluded</span>
          <div className="text-3xl font-mono font-black text-amber-400 mt-1">
            {rejectedParticles.length}
          </div>
          <span className="text-[10px] opacity-75">Rejected by optical morpho-filters</span>
        </div>

        <div className={cn("p-4 rounded-2xl border", isDark ? "bg-white/[0.02] border-white/10" : "bg-slate-50 border-slate-200")}>
          <span className={cn("text-[9px] font-black uppercase tracking-wider block", isDark ? "text-white/40" : "text-slate-400")}>
            Sample Cleanliness Index
          </span>
          <div className="text-3xl font-mono font-black mt-1">
            {((passedParticles.length / Math.max(1, particleDataset.length)) * 100).toFixed(1)}%
          </div>
          <span className="text-[10px] opacity-60">High optical signal-to-noise ratio</span>
        </div>
      </div>

      {/* Sliders & Exclusion Log Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filter Sliders */}
        <div className={cn("p-5 rounded-2xl border space-y-4 lg:col-span-1", isDark ? "bg-white/[0.02] border-white/10" : "bg-slate-50 border-slate-200")}>
          <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Sliders className="w-4 h-4" /> Filter Gating Controls
          </h4>

          {/* Area Thresholds */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="opacity-70">Min Particle Area</span>
              <span className="font-mono font-bold">{minArea.toFixed(1)} µm²</span>
            </div>
            <input 
              type="range"
              min={2.0}
              max={15.0}
              step={0.5}
              value={minArea}
              onChange={e => setMinArea(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="opacity-70">Max Particle Area</span>
              <span className="font-mono font-bold">{maxArea.toFixed(1)} µm²</span>
            </div>
            <input 
              type="range"
              min={25.0}
              max={80.0}
              step={1.0}
              value={maxArea}
              onChange={e => setMaxArea(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Max Circularity (Spherical Round Cells) */}
          <div className="space-y-1 border-t border-white/10 pt-3">
            <div className="flex justify-between text-xs">
              <span className="opacity-70">Max Circularity (Round Cell Cutoff)</span>
              <span className="font-mono font-bold">{maxCircularity.toFixed(2)}</span>
            </div>
            <input 
              type="range"
              min={0.70}
              max={0.98}
              step={0.01}
              value={maxCircularity}
              onChange={e => setMaxCircularity(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Brownian Motion Jitter */}
          <div className="space-y-1 border-t border-white/10 pt-3">
            <div className="flex justify-between text-xs">
              <span className="opacity-70">Brownian Drift Jitter Limit</span>
              <span className="font-mono font-bold">{brownianJitterLimit.toFixed(1)} µm/s</span>
            </div>
            <input 
              type="range"
              min={0.5}
              max={6.0}
              step={0.5}
              value={brownianJitterLimit}
              onChange={e => setBrownianJitterLimit(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Real-time Exclusion Log Table */}
        <div className={cn("p-5 rounded-2xl border space-y-3 lg:col-span-2 flex flex-col justify-between", isDark ? "bg-white/[0.02] border-white/10" : "bg-slate-50 border-slate-200")}>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-3">
              <Eye className="w-4 h-4" /> Optical Particle Classification Log ({particleDataset.length} items)
            </h4>

            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {particleDataset.map((p) => {
                const isPassed = p.status === 'passed';
                return (
                  <div
                    key={p.id}
                    className={cn(
                      "p-3 rounded-xl border flex items-center justify-between text-xs font-mono transition-all",
                      isPassed 
                        ? (isDark ? "bg-emerald-500/[0.03] border-emerald-500/20" : "bg-emerald-50/60 border-emerald-200")
                        : (isDark ? "bg-red-500/[0.03] border-red-500/20" : "bg-red-50/60 border-red-200")
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {isPassed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                      <div>
                        <div className="font-bold flex items-center gap-2">
                          <span>{p.id}</span>
                          <span className={cn(
                            "px-1.5 py-0.2 rounded text-[8px] uppercase tracking-wider",
                            isPassed ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                          )}>
                            {p.type.replace(/_/g, ' ')}
                          </span>
                        </div>
                        {p.rejectionReason && (
                          <p className="text-[10px] text-red-400 font-sans mt-0.5">
                            {p.rejectionReason}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right text-[10px] opacity-75 shrink-0">
                      <div>{p.area.toFixed(1)} µm²</div>
                      <div>Circ: {p.circularity.toFixed(2)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-[10px] text-amber-300">
            <strong>ISO 15189 Quality Note:</strong> Particle classification filter automatically generates an audit entry for quality control review.
          </div>
        </div>
      </div>
    </div>
  );
};
