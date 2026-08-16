import React, { useState, useMemo } from 'react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine,
  Cell
} from 'recharts';
import { 
  Heart, 
  Sparkles, 
  Layers, 
  Zap, 
  Sliders, 
  Download, 
  Info, 
  CheckCircle2, 
  ShieldAlert, 
  RefreshCw,
  Sun
} from 'lucide-react';
import { cn } from '../utils';
import type { SpermData } from '../types';

interface FluorescenceGatingProps {
  spermatozoa: SpermData[];
  theme?: 'light' | 'dark';
}

interface FluorCell {
  id: string;
  index: number;
  fitcIntensity: number; // FITC-PNA (Acrosome Integrity, 0-1000 a.u.)
  piIntensity: number;   // Propidium Iodide / Hoechst (Membrane Permeability/Dead, 0-1000 a.u.)
  quadrant: 'Q1_Dead_Intact' | 'Q2_Dead_Reacted' | 'Q3_Live_Intact' | 'Q4_Live_Reacted';
  color: string;
}

export const FluorescenceGating: React.FC<FluorescenceGatingProps> = ({
  spermatozoa,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';

  // Fluorophore gating thresholds (Flow Cytometry style)
  const [fitcThreshold, setFitcThreshold] = useState<number>(450); // Acrosome cutoff
  const [piThreshold, setPiThreshold] = useState<number>(400);   // Viability cutoff

  // Synthesize realistic dual-channel fluorescence values from cell data
  const fluorCells = useMemo<FluorCell[]>(() => {
    return spermatozoa.map((s, idx) => {
      // Deterministic seed based on id and kinematics
      const isLive = s.vitality === 'live' || s.classification === 'progressive' || s.vcl > 15;
      const isAcrosomeIntact = s.morphology.acrosome === 'normal';

      // Base fluor values
      let basePI = isLive ? 120 + (idx * 7) % 220 : 620 + (idx * 11) % 350;
      let baseFITC = isAcrosomeIntact ? 680 + (idx * 13) % 280 : 150 + (idx * 9) % 240;

      // Classify into 4 quadrants based on current thresholds
      let quadrant: FluorCell['quadrant'];
      let color = '#10b981';

      if (basePI >= piThreshold && baseFITC < fitcThreshold) {
        quadrant = 'Q1_Dead_Intact';
        color = '#ef4444'; // Red
      } else if (basePI >= piThreshold && baseFITC >= fitcThreshold) {
        quadrant = 'Q2_Dead_Reacted';
        color = '#f59e0b'; // Amber
      } else if (basePI < piThreshold && baseFITC >= fitcThreshold) {
        quadrant = 'Q3_Live_Intact';
        color = '#10b981'; // Emerald Green
      } else {
        quadrant = 'Q4_Live_Reacted';
        color = '#06b6d4'; // Cyan
      }

      return {
        id: s.id,
        index: idx + 1,
        fitcIntensity: baseFITC,
        piIntensity: basePI,
        quadrant,
        color
      };
    });
  }, [spermatozoa, fitcThreshold, piThreshold]);

  // Quadrant statistics
  const total = Math.max(1, fluorCells.length);
  const q3LiveIntact = fluorCells.filter(c => c.quadrant === 'Q3_Live_Intact').length;
  const q4LiveReacted = fluorCells.filter(c => c.quadrant === 'Q4_Live_Reacted').length;
  const q1DeadIntact = fluorCells.filter(c => c.quadrant === 'Q1_Dead_Intact').length;
  const q2DeadReacted = fluorCells.filter(c => c.quadrant === 'Q2_Dead_Reacted').length;

  const pctLiveIntact = ((q3LiveIntact / total) * 100).toFixed(1);
  const pctLiveReacted = ((q4LiveReacted / total) * 100).toFixed(1);
  const pctDeadIntact = ((q1DeadIntact / total) * 100).toFixed(1);
  const pctDeadReacted = ((q2DeadReacted / total) * 100).toFixed(1);

  return (
    <div className={cn("p-6 lg:p-8 rounded-[28px] border space-y-6", isDark ? "bg-[#09090b] border-white/10 text-white" : "bg-white border-slate-200 text-slate-900 shadow-sm")}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10 dark:border-white/10 border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
              Dual-Channel Fluorescence & Acrosome Integrity Gating
              <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 rounded-full border border-rose-500/30">
                IVOS II Viability Suite
              </span>
            </h3>
            <p className={cn("text-xs mt-0.5", isDark ? "text-white/40" : "text-slate-500")}>
              Flow-cytometric 4-quadrant gating for FITC-PNA (Acrosome Cap) & Propidium Iodide (Membrane Permeability)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setFitcThreshold(450);
              setPiThreshold(400);
            }}
            className={cn(
              "px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer",
              isDark ? "bg-white/5 border-white/10 hover:bg-white/10 text-white/80" : "bg-slate-100 border-slate-200 text-slate-700"
            )}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Calibrated Gates
          </button>
        </div>
      </div>

      {/* 4 Quadrants Flow Gating Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Q3: Live & Intact (Gold Standard) */}
        <div className={cn("p-4 rounded-2xl border relative overflow-hidden", isDark ? "bg-emerald-500/10 border-emerald-500/30" : "bg-emerald-50 border-emerald-200")}>
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400">Q3: Live Intact (FITC+ / PI-)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-3xl font-mono font-black text-emerald-400 mt-1">
            {pctLiveIntact}%
          </div>
          <span className="text-[10px] opacity-75">{q3LiveIntact} cells (Highest Insemination Potential)</span>
        </div>

        {/* Q4: Live & Reacted */}
        <div className={cn("p-4 rounded-2xl border", isDark ? "bg-cyan-500/10 border-cyan-500/30" : "bg-cyan-50 border-cyan-200")}>
          <span className="text-[9px] font-black uppercase tracking-wider text-cyan-400 block">Q4: Live Reacted (FITC- / PI-)</span>
          <div className="text-3xl font-mono font-black text-cyan-400 mt-1">
            {pctLiveReacted}%
          </div>
          <span className="text-[10px] opacity-75">{q4LiveReacted} cells (Prematurely Reacted)</span>
        </div>

        {/* Q2: Dead & Reacted */}
        <div className={cn("p-4 rounded-2xl border", isDark ? "bg-amber-500/10 border-amber-500/30" : "bg-amber-50 border-amber-200")}>
          <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 block">Q2: Dead Reacted (FITC+ / PI+)</span>
          <div className="text-3xl font-mono font-black text-amber-400 mt-1">
            {pctDeadReacted}%
          </div>
          <span className="text-[10px] opacity-75">{q2DeadReacted} cells (Late Apoptotic/Necrotic)</span>
        </div>

        {/* Q1: Dead & Intact */}
        <div className={cn("p-4 rounded-2xl border", isDark ? "bg-red-500/10 border-red-500/30" : "bg-red-50 border-red-200")}>
          <span className="text-[9px] font-black uppercase tracking-wider text-red-400 block">Q1: Dead Intact (FITC- / PI+)</span>
          <div className="text-3xl font-mono font-black text-red-400 mt-1">
            {pctDeadIntact}%
          </div>
          <span className="text-[10px] opacity-75">{q1DeadIntact} cells (Membrane Compromised)</span>
        </div>
      </div>

      {/* Main Flow Cytometry Scatter Chart & Sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className={cn("lg:col-span-3 p-4 rounded-2xl border relative overflow-hidden", isDark ? "bg-black/40 border-white/10" : "bg-slate-50 border-slate-200")}>
          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} />
                <XAxis 
                  type="number" 
                  dataKey="fitcIntensity" 
                  name="FITC-PNA (Acrosome)" 
                  unit=" a.u."
                  domain={[0, 1000]}
                  stroke={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"}
                  fontSize={10}
                  label={{ value: 'FITC-PNA Fluorescence (Acrosome Cap Integrity)', position: 'bottom', offset: 0, fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                />
                <YAxis 
                  type="number" 
                  dataKey="piIntensity" 
                  name="Propidium Iodide (Dead)" 
                  unit=" a.u."
                  domain={[0, 1000]}
                  stroke={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"}
                  fontSize={10}
                  label={{ value: 'Propidium Iodide (Membrane Permeability / Non-Viable)', angle: -90, position: 'left', offset: 0, fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ payload }) => {
                    if (!payload || payload.length === 0) return null;
                    const data = payload[0].payload;
                    return (
                      <div className={cn(
                        "p-3 rounded-xl border shadow-xl text-xs space-y-1 font-mono",
                        isDark ? "bg-[#111] border-white/20 text-white" : "bg-white border-slate-200 text-slate-900"
                      )}>
                        <div className="font-bold text-rose-400">Sperm #{data.index} ({data.id})</div>
                        <div>FITC Intensity: <strong>{data.fitcIntensity} a.u.</strong></div>
                        <div>PI Intensity: <strong>{data.piIntensity} a.u.</strong></div>
                        <div className="text-[10px] font-bold text-emerald-400 mt-1 uppercase">
                          Quadrant: {data.quadrant.replace(/_/g, ' ')}
                        </div>
                      </div>
                    );
                  }}
                />

                {/* Flow Cytometry Crosshair Gate Lines */}
                <ReferenceLine x={fitcThreshold} stroke="#ec4899" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: `FITC Gate: ${fitcThreshold}`, position: 'insideTopRight', fill: '#ec4899', fontSize: 10 }} />
                <ReferenceLine y={piThreshold} stroke="#f43f5e" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: `PI Gate: ${piThreshold}`, position: 'insideBottomRight', fill: '#f43f5e', fontSize: 10 }} />

                <Scatter name="Cells" data={fluorCells}>
                  {fluorCells.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      fillOpacity={0.8}
                      r={4}
                      className="cursor-pointer transition-all hover:scale-125"
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gating Cutoff Sliders */}
        <div className={cn("p-5 rounded-2xl border space-y-5 flex flex-col justify-between", isDark ? "bg-white/[0.02] border-white/10" : "bg-slate-50 border-slate-200")}>
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <Sliders className="w-4 h-4" /> Fluorescence Gating
            </h4>

            {/* FITC Threshold */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="opacity-70 text-pink-400 font-bold">FITC-PNA Cutoff</span>
                <span className="font-mono font-bold">{fitcThreshold} a.u.</span>
              </div>
              <input 
                type="range" 
                min={100} 
                max={900} 
                step={10}
                value={fitcThreshold}
                onChange={e => setFitcThreshold(parseInt(e.target.value))}
                className="w-full accent-pink-500 cursor-pointer"
              />
              <p className="text-[9px] opacity-60">Separates intact acrosome caps (&gt;gate) from reacted or detached.</p>
            </div>

            {/* PI Threshold */}
            <div className="space-y-1.5 border-t border-white/10 pt-3">
              <div className="flex justify-between text-[11px]">
                <span className="opacity-70 text-rose-400 font-bold">PI Permeability Cutoff</span>
                <span className="font-mono font-bold">{piThreshold} a.u.</span>
              </div>
              <input 
                type="range" 
                min={100} 
                max={900} 
                step={10}
                value={piThreshold}
                onChange={e => setPiThreshold(parseInt(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer"
              />
              <p className="text-[9px] opacity-60">Separates live intact membranes (&lt;gate) from permeable dead cells.</p>
            </div>
          </div>

          <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20 text-[10px] space-y-1">
            <div className="font-bold text-rose-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Clinical Viability Summary:
            </div>
            <div>• Membrane Viability: <strong className="font-mono">{(parseFloat(pctLiveIntact) + parseFloat(pctLiveReacted)).toFixed(1)}%</strong> (Ref: &ge;54%)</div>
            <div>• Intact Acrosomes: <strong className="font-mono">{(parseFloat(pctLiveIntact) + parseFloat(pctDeadIntact)).toFixed(1)}%</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
};
