import React, { useState, useMemo } from 'react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceArea,
  ReferenceLine,
  Cell
} from 'recharts';
import { 
  Sliders, 
  Filter, 
  Layers, 
  Activity, 
  Zap, 
  Download, 
  Eye, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2,
  Info,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';
import type { SpermData, AnalysisResult } from '../types';

interface KinematicScatterGatingProps {
  spermatozoa: SpermData[];
  onSelectSperm?: (spermId: string) => void;
  selectedSpermId?: string | null;
  theme?: 'light' | 'dark';
}

type KinematicParam = 'vcl' | 'vsl' | 'vap' | 'lin' | 'str' | 'wob' | 'alh' | 'bcf' | 'mad';

interface ParamMeta {
  key: KinematicParam;
  name: string;
  unit: string;
  min: number;
  max: number;
  defaultGatingMin: number;
  defaultGatingMax: number;
}

const PARAM_META: Record<KinematicParam, ParamMeta> = {
  vcl: { key: 'vcl', name: 'Curvilinear Velocity (VCL)', unit: 'µm/s', min: 0, max: 250, defaultGatingMin: 20, defaultGatingMax: 200 },
  vsl: { key: 'vsl', name: 'Straight-line Velocity (VSL)', unit: 'µm/s', min: 0, max: 150, defaultGatingMin: 15, defaultGatingMax: 120 },
  vap: { key: 'vap', name: 'Average Path Velocity (VAP)', unit: 'µm/s', min: 0, max: 180, defaultGatingMin: 20, defaultGatingMax: 150 },
  lin: { key: 'lin', name: 'Linearity Index (LIN)', unit: '', min: 0, max: 1.0, defaultGatingMin: 0.35, defaultGatingMax: 1.0 },
  str: { key: 'str', name: 'Straightness (STR)', unit: '', min: 0, max: 1.0, defaultGatingMin: 0.5, defaultGatingMax: 1.0 },
  wob: { key: 'wob', name: 'Wobble Coefficient (WOB)', unit: '', min: 0, max: 1.0, defaultGatingMin: 0.4, defaultGatingMax: 1.0 },
  alh: { key: 'alh', name: 'Lateral Displacement (ALH)', unit: 'µm', min: 0, max: 12, defaultGatingMin: 1.5, defaultGatingMax: 7.0 },
  bcf: { key: 'bcf', name: 'Beat Cross Frequency (BCF)', unit: 'Hz', min: 0, max: 45, defaultGatingMin: 10, defaultGatingMax: 35 },
  mad: { key: 'mad', name: 'Mean Angular Disp. (MAD)', unit: '°', min: 0, max: 90, defaultGatingMin: 5, defaultGatingMax: 60 },
};

const POPULATION_PRESETS = [
  {
    id: 'all',
    name: 'All Spermatozoa',
    desc: 'Unfiltered total cell population',
    color: '#10b981',
    filter: () => true
  },
  {
    id: 'hyperactivated',
    name: 'Hyperactivated (HA)',
    desc: 'VCL ≥ 140 µm/s, LIN ≤ 0.52, ALH ≥ 3.2 µm',
    color: '#a855f7',
    filter: (s: SpermData) => s.isHyperactivated || (s.vcl >= 140 && s.lin <= 0.52 && s.alh >= 3.2)
  },
  {
    id: 'rapid_progressive',
    name: 'Rapid Progressive (Class A)',
    desc: 'VAP ≥ 45 µm/s, STR ≥ 0.70',
    color: '#10b981',
    filter: (s: SpermData) => s.classification === 'progressive' && s.vap >= 45 && s.str >= 0.7
  },
  {
    id: 'medium_progressive',
    name: 'Medium Progressive (Class B)',
    desc: '25 ≤ VAP < 45 µm/s, STR ≥ 0.55',
    color: '#06b6d4',
    filter: (s: SpermData) => s.classification === 'progressive' && s.vap >= 25 && s.vap < 45
  },
  {
    id: 'non_progressive',
    name: 'Non-Progressive Motile (Class C)',
    desc: 'VCL ≥ 5 µm/s with low linearity',
    color: '#eab308',
    filter: (s: SpermData) => s.classification === 'non-progressive'
  },
  {
    id: 'immotile',
    name: 'Immotile / Static (Class D)',
    desc: 'VCL < 5 µm/s or zero displacement',
    color: '#ef4444',
    filter: (s: SpermData) => s.classification === 'immotile'
  }
];

export const KinematicScatterGating: React.FC<KinematicScatterGatingProps> = ({
  spermatozoa,
  onSelectSperm,
  selectedSpermId,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';

  const [xParam, setXParam] = useState<KinematicParam>('vcl');
  const [yParam, setYParam] = useState<KinematicParam>('lin');
  const [activePreset, setActivePreset] = useState<string>('all');

  // Gating thresholds
  const xMeta = PARAM_META[xParam];
  const yMeta = PARAM_META[yParam];

  const [gateXMin, setGateXMin] = useState<number>(0);
  const [gateXMax, setGateXMax] = useState<number>(xMeta.max);
  const [gateYMin, setGateYMin] = useState<number>(0);
  const [gateYMax, setGateYMax] = useState<number>(yMeta.max);

  // Update bounds when parameters change
  const handleXChange = (newX: KinematicParam) => {
    setXParam(newX);
    setGateXMin(0);
    setGateXMax(PARAM_META[newX].max);
  };

  const handleYChange = (newY: KinematicParam) => {
    setYParam(newY);
    setGateYMin(0);
    setGateYMax(PARAM_META[newY].max);
  };

  const handlePresetClick = (presetId: string) => {
    setActivePreset(presetId);
    if (presetId === 'hyperactivated') {
      setXParam('vcl');
      setYParam('lin');
      setGateXMin(140);
      setGateXMax(250);
      setGateYMin(0);
      setGateYMax(0.52);
    } else if (presetId === 'rapid_progressive') {
      setXParam('vap');
      setYParam('str');
      setGateXMin(45);
      setGateXMax(180);
      setGateYMin(0.70);
      setGateYMax(1.0);
    } else if (presetId === 'all') {
      setGateXMin(0);
      setGateXMax(xMeta.max);
      setGateYMin(0);
      setGateYMax(yMeta.max);
    }
  };

  // Filtered spermatozoa
  const gatedData = useMemo(() => {
    return spermatozoa.filter(s => {
      const xVal = s[xParam] as number;
      const yVal = s[yParam] as number;
      const inGate = xVal >= gateXMin && xVal <= gateXMax && yVal >= gateYMin && yVal <= gateYMax;
      if (activePreset === 'all') return inGate;
      const preset = POPULATION_PRESETS.find(p => p.id === activePreset);
      return inGate && (preset ? preset.filter(s) : true);
    });
  }, [spermatozoa, xParam, yParam, gateXMin, gateXMax, gateYMin, gateYMax, activePreset]);

  // Transform for scatter
  const scatterPoints = useMemo(() => {
    return spermatozoa.map((s, idx) => {
      const x = s[xParam] as number;
      const y = s[yParam] as number;
      const isGated = x >= gateXMin && x <= gateXMax && y >= gateYMin && y <= gateYMax;
      const isSelected = selectedSpermId === s.id;

      let color = '#ef4444';
      if (s.isHyperactivated) color = '#c084fc'; // Purple
      else if (s.classification === 'progressive') color = '#34d399'; // Emerald
      else if (s.classification === 'non-progressive') color = '#facc15'; // Amber

      return {
        id: s.id,
        index: idx + 1,
        x: Number(x.toFixed(2)),
        y: Number(y.toFixed(2)),
        vcl: s.vcl,
        vsl: s.vsl,
        vap: s.vap,
        lin: s.lin,
        str: s.str,
        alh: s.alh,
        bcf: s.bcf,
        classification: s.classification,
        isHyperactivated: s.isHyperactivated,
        isGated,
        isSelected,
        color
      };
    });
  }, [spermatozoa, xParam, yParam, gateXMin, gateXMax, gateYMin, gateYMax, selectedSpermId]);

  // Statistics of gated subpopulation
  const gatedCount = gatedData.length;
  const gatedPercentage = spermatozoa.length > 0 ? (gatedCount / spermatozoa.length) * 100 : 0;
  const meanGatedVcl = gatedCount > 0 ? gatedData.reduce((acc, s) => acc + s.vcl, 0) / gatedCount : 0;
  const meanGatedVsl = gatedCount > 0 ? gatedData.reduce((acc, s) => acc + s.vsl, 0) / gatedCount : 0;
  const meanGatedVap = gatedCount > 0 ? gatedData.reduce((acc, s) => acc + s.vap, 0) / gatedCount : 0;
  const meanGatedLin = gatedCount > 0 ? gatedData.reduce((acc, s) => acc + s.lin, 0) / gatedCount : 0;
  const meanGatedAlh = gatedCount > 0 ? gatedData.reduce((acc, s) => acc + s.alh, 0) / gatedCount : 0;

  const exportGatedCSV = () => {
    if (gatedData.length === 0) return;
    const headers = ['ID', 'Classification', 'VCL (um/s)', 'VSL (um/s)', 'VAP (um/s)', 'LIN', 'STR', 'WOB', 'ALH (um)', 'BCF (Hz)', 'Hyperactivated'];
    const rows = gatedData.map(s => [
      s.id,
      s.classification,
      s.vcl.toFixed(2),
      s.vsl.toFixed(2),
      s.vap.toFixed(2),
      s.lin.toFixed(2),
      s.str.toFixed(2),
      s.wob.toFixed(2),
      s.alh.toFixed(2),
      s.bcf.toFixed(2),
      s.isHyperactivated ? 'YES' : 'NO'
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ATSA-Gated-Subpopulation-${xParam}-vs-${yParam}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={cn("p-6 lg:p-8 rounded-[28px] border space-y-6", isDark ? "bg-[#09090b] border-white/10 text-white" : "bg-white border-slate-200 text-slate-900 shadow-sm")}>
      {/* Header & Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10 dark:border-white/10 border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
                2D Kinematic Subpopulation Scatter & Dynamic Gating
                <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-400 rounded-full border border-purple-500/30">
                  IVOS II Style
                </span>
              </h3>
              <p className={cn("text-xs mt-0.5", isDark ? "text-white/40" : "text-slate-500")}>
                Isolate distinct phenotypic cohorts by curvilinear velocity, linearity, amplitude, and trajectory stability
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportGatedCSV}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all cursor-pointer",
              isDark ? "bg-white/5 border-white/10 hover:bg-white/10 text-white/80" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
            )}
          >
            <Download className="w-4 h-4 text-purple-400" />
            Export Gated Subpopulation ({gatedCount})
          </button>
          <button
            onClick={() => handlePresetClick('all')}
            className={cn(
              "p-2 rounded-xl border transition-all cursor-pointer",
              isDark ? "bg-white/5 border-white/10 text-white/60 hover:text-white" : "bg-slate-100 border-slate-200 text-slate-600"
            )}
            title="Reset Gating Bounds"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Axis Selection & Quick Presets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* X-Axis Selector */}
        <div className={cn("p-4 rounded-2xl border", isDark ? "bg-white/[0.02] border-white/10" : "bg-slate-50 border-slate-200")}>
          <label className={cn("text-[10px] font-black uppercase tracking-widest block mb-2", isDark ? "text-white/40" : "text-slate-400")}>
            X-Axis Parameter
          </label>
          <select
            value={xParam}
            onChange={(e) => handleXChange(e.target.value as KinematicParam)}
            className={cn(
              "w-full px-3 py-2 rounded-xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-purple-500/40",
              isDark ? "bg-black/50 border-white/10 text-white" : "bg-white border-slate-200 text-slate-800"
            )}
          >
            {Object.values(PARAM_META).map(p => (
              <option key={p.key} value={p.key} className="bg-slate-900 text-white">
                {p.name}
              </option>
            ))}
          </select>
          <div className="flex items-center justify-between text-[10px] mt-2 opacity-60">
            <span>Range: {gateXMin.toFixed(1)} - {gateXMax.toFixed(1)} {xMeta.unit}</span>
          </div>
        </div>

        {/* Y-Axis Selector */}
        <div className={cn("p-4 rounded-2xl border", isDark ? "bg-white/[0.02] border-white/10" : "bg-slate-50 border-slate-200")}>
          <label className={cn("text-[10px] font-black uppercase tracking-widest block mb-2", isDark ? "text-white/40" : "text-slate-400")}>
            Y-Axis Parameter
          </label>
          <select
            value={yParam}
            onChange={(e) => handleYChange(e.target.value as KinematicParam)}
            className={cn(
              "w-full px-3 py-2 rounded-xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-purple-500/40",
              isDark ? "bg-black/50 border-white/10 text-white" : "bg-white border-slate-200 text-slate-800"
            )}
          >
            {Object.values(PARAM_META).map(p => (
              <option key={p.key} value={p.key} className="bg-slate-900 text-white">
                {p.name}
              </option>
            ))}
          </select>
          <div className="flex items-center justify-between text-[10px] mt-2 opacity-60">
            <span>Range: {gateYMin.toFixed(2)} - {gateYMax.toFixed(2)} {yMeta.unit}</span>
          </div>
        </div>

        {/* Subpopulation Summary Box */}
        <div className={cn("p-4 rounded-2xl border flex flex-col justify-between", isDark ? "bg-purple-500/10 border-purple-500/30" : "bg-purple-50 border-purple-200")}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Gated Subpopulation</span>
            <span className="text-xs font-mono font-bold text-purple-400">{gatedPercentage.toFixed(1)}% of total</span>
          </div>
          <div className="my-1">
            <div className="text-2xl font-mono font-black text-purple-400">
              {gatedCount} <span className="text-xs font-sans font-normal opacity-70">/ {spermatozoa.length} cells</span>
            </div>
            <p className="text-[10px] opacity-80 mt-0.5">
              Mean VCL: <strong className="font-mono">{meanGatedVcl.toFixed(1)}</strong> µm/s | LIN: <strong className="font-mono">{meanGatedLin.toFixed(2)}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Preset Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        <span className={cn("text-[10px] font-black uppercase tracking-wider shrink-0", isDark ? "text-white/40" : "text-slate-400")}>
          Target Clusters:
        </span>
        {POPULATION_PRESETS.map(p => (
          <button
            key={p.id}
            onClick={() => handlePresetClick(p.id)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5",
              activePreset === p.id
                ? "bg-purple-500 text-white shadow-md shadow-purple-500/20 scale-105"
                : isDark ? "bg-white/5 hover:bg-white/10 text-white/70" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            )}
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
            {p.name}
          </button>
        ))}
      </div>

      {/* Main Scatter Plot Container & Threshold Sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* The 2D Scatter Plot Canvas */}
        <div className={cn("lg:col-span-3 p-4 rounded-2xl border relative overflow-hidden", isDark ? "bg-black/40 border-white/10" : "bg-slate-50 border-slate-200")}>
          <div className="h-[380px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"} />
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name={xMeta.name} 
                  unit={xMeta.unit ? ` ${xMeta.unit}` : ''} 
                  domain={[0, xMeta.max]}
                  stroke={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"}
                  fontSize={10}
                  label={{ value: `${xMeta.name}`, position: 'bottom', offset: 0, fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name={yMeta.name} 
                  unit={yMeta.unit ? ` ${yMeta.unit}` : ''} 
                  domain={[0, yMeta.max]}
                  stroke={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"}
                  fontSize={10}
                  label={{ value: `${yMeta.name}`, angle: -90, position: 'left', offset: 0, fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
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
                        <div className="flex items-center justify-between gap-4 font-bold border-b border-white/10 pb-1">
                          <span className="text-purple-400">Sperm #{data.index} ({data.id})</span>
                          <span className="capitalize text-[10px]">{data.classification}</span>
                        </div>
                        <div>{xMeta.name}: <strong>{data.x} {xMeta.unit}</strong></div>
                        <div>{yMeta.name}: <strong>{data.y} {yMeta.unit}</strong></div>
                        <div className="text-[10px] opacity-70">
                          VCL: {data.vcl.toFixed(1)} | VSL: {data.vsl.toFixed(1)} | LIN: {data.lin.toFixed(2)} | ALH: {data.alh.toFixed(1)}
                        </div>
                        {data.isHyperactivated && (
                          <div className="text-purple-400 text-[10px] font-black uppercase">
                            ★ Hyperactivated Phenotype
                          </div>
                        )}
                      </div>
                    );
                  }}
                />

                {/* Shaded Active Gating Box */}
                {(ReferenceArea as any)({
                  x1: gateXMin,
                  x2: gateXMax,
                  y1: gateYMin,
                  y2: gateYMax,
                  stroke: "#a855f7",
                  strokeOpacity: 0.8,
                  strokeDasharray: "4 4",
                  fill: "#a855f7",
                  fillOpacity: 0.12
                })}

                <Scatter 
                  name="Spermatozoa" 
                  data={scatterPoints} 
                  onClick={(node) => onSelectSperm && onSelectSperm(node.id)}
                >
                  {scatterPoints.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      fillOpacity={entry.isGated ? 0.9 : 0.15}
                      stroke={entry.isSelected ? '#ffffff' : entry.isGated ? entry.color : 'transparent'}
                      strokeWidth={entry.isSelected ? 2.5 : 1}
                      r={entry.isSelected ? 6.5 : entry.isGated ? 4.5 : 3}
                      className="cursor-pointer transition-all hover:scale-125"
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Interactive Gating Slider Controls */}
        <div className={cn("p-5 rounded-2xl border space-y-5 flex flex-col justify-between", isDark ? "bg-white/[0.02] border-white/10" : "bg-slate-50 border-slate-200")}>
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <Filter className="w-4 h-4" /> Gating Cutoffs
            </h4>

            {/* X Min Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="opacity-60">Min {xMeta.key.toUpperCase()}</span>
                <span className="font-mono font-bold">{gateXMin.toFixed(1)} {xMeta.unit}</span>
              </div>
              <input 
                type="range" 
                min={0} 
                max={xMeta.max} 
                step={xMeta.max > 5 ? 1 : 0.05}
                value={gateXMin}
                onChange={e => setGateXMin(Math.min(parseFloat(e.target.value), gateXMax - 0.01))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            {/* X Max Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="opacity-60">Max {xMeta.key.toUpperCase()}</span>
                <span className="font-mono font-bold">{gateXMax.toFixed(1)} {xMeta.unit}</span>
              </div>
              <input 
                type="range" 
                min={0} 
                max={xMeta.max} 
                step={xMeta.max > 5 ? 1 : 0.05}
                value={gateXMax}
                onChange={e => setGateXMax(Math.max(parseFloat(e.target.value), gateXMin + 0.01))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            <div className="border-t border-white/10 pt-3 space-y-4">
              {/* Y Min Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="opacity-60">Min {yMeta.key.toUpperCase()}</span>
                  <span className="font-mono font-bold">{gateYMin.toFixed(2)} {yMeta.unit}</span>
                </div>
                <input 
                  type="range" 
                  min={0} 
                  max={yMeta.max} 
                  step={yMeta.max > 5 ? 1 : 0.02}
                  value={gateYMin}
                  onChange={e => setGateYMin(Math.min(parseFloat(e.target.value), gateYMax - 0.01))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>

              {/* Y Max Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="opacity-60">Max {yMeta.key.toUpperCase()}</span>
                  <span className="font-mono font-bold">{gateYMax.toFixed(2)} {yMeta.unit}</span>
                </div>
                <input 
                  type="range" 
                  min={0} 
                  max={yMeta.max} 
                  step={yMeta.max > 5 ? 1 : 0.02}
                  value={gateYMax}
                  onChange={e => setGateYMax(Math.max(parseFloat(e.target.value), gateYMin + 0.01))}
                  className="w-full accent-purple-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 text-[10px] space-y-1">
            <div className="font-bold text-purple-400">Gated Phenotype Insights:</div>
            <div>• Mean VSL: <strong className="font-mono">{meanGatedVsl.toFixed(1)} µm/s</strong></div>
            <div>• Mean VAP: <strong className="font-mono">{meanGatedVap.toFixed(1)} µm/s</strong></div>
            <div>• Mean ALH: <strong className="font-mono">{meanGatedAlh.toFixed(1)} µm</strong></div>
          </div>
        </div>
      </div>
    </div>
  );
};
