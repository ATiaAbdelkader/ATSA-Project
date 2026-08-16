import React, { useState, useMemo } from 'react';
import { 
  Grid, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Filter, 
  Maximize2, 
  Download, 
  RefreshCw, 
  Sliders, 
  Layers, 
  Compass,
  Sparkles,
  Info,
  Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';
import type { SpermData } from '../types';

interface MorphologyGalleryProps {
  spermatozoa: SpermData[];
  onUpdateSperm?: (updatedSperm: SpermData[]) => void;
  theme?: 'light' | 'dark';
}

export const MorphologyGallery: React.FC<MorphologyGalleryProps> = ({
  spermatozoa,
  onUpdateSperm,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';
  const [filterType, setFilterType] = useState<'all' | 'normal' | 'head_defects' | 'midpiece_defects' | 'tail_defects' | 'overridden'>('all');
  const [selectedSperm, setSelectedSperm] = useState<SpermData | null>(null);
  const [overrides, setOverrides] = useState<Record<string, 'strict_normal' | 'borderline' | 'abnormal'>>({});
  const [showMeshOverlay, setShowMeshOverlay] = useState(true);

  // Compute active list with local overrides
  const augmentedSpermList = useMemo(() => {
    return spermatozoa.map(s => {
      const override = overrides[s.id];
      if (override) {
        return {
          ...s,
          morphology: {
            ...s.morphology,
            krugerStrict: override,
            head: override === 'strict_normal' ? 'normal' : s.morphology.head
          }
        };
      }
      return s;
    });
  }, [spermatozoa, overrides]);

  // Filtered view
  const filteredList = useMemo(() => {
    return augmentedSpermList.filter(s => {
      if (filterType === 'normal') return s.morphology.krugerStrict === 'strict_normal' || s.morphology.head === 'normal';
      if (filterType === 'head_defects') return s.morphology.head !== 'normal';
      if (filterType === 'midpiece_defects') return s.morphology.midpiece !== 'normal';
      if (filterType === 'tail_defects') return s.morphology.tail !== 'normal';
      if (filterType === 'overridden') return !!overrides[s.id];
      return true;
    });
  }, [augmentedSpermList, filterType, overrides]);

  // Live Recalculation of Kruger & Deformity Indices
  const totalAnalyzed = augmentedSpermList.length;
  const normalCount = augmentedSpermList.filter(s => s.morphology.krugerStrict === 'strict_normal').length;
  const normalPercentage = totalAnalyzed > 0 ? (normalCount / totalAnalyzed) * 100 : 0;

  const abnormalCells = augmentedSpermList.filter(s => s.morphology.krugerStrict !== 'strict_normal');
  let totalDefectsCount = 0;
  abnormalCells.forEach(s => {
    if (s.morphology.head !== 'normal') totalDefectsCount++;
    if (s.morphology.midpiece !== 'normal') totalDefectsCount++;
    if (s.morphology.tail !== 'normal') totalDefectsCount++;
    if (s.morphology.droplet !== 'none') totalDefectsCount++;
  });

  const liveTZI = abnormalCells.length > 0 ? totalDefectsCount / abnormalCells.length : 1.0;
  const liveMAI = totalAnalyzed > 0 ? totalDefectsCount / totalAnalyzed : 0;
  const liveSDI = totalAnalyzed > 0 ? totalDefectsCount / totalAnalyzed : 0;

  const handleToggleClassification = (spermId: string, currentStatus: string) => {
    let nextStatus: 'strict_normal' | 'borderline' | 'abnormal' = 'strict_normal';
    if (currentStatus === 'strict_normal') nextStatus = 'abnormal';
    else if (currentStatus === 'abnormal') nextStatus = 'borderline';
    else nextStatus = 'strict_normal';

    const newOverrides = {
      ...overrides,
      [spermId]: nextStatus
    };
    setOverrides(newOverrides);

    if (onUpdateSperm) {
      const updated = augmentedSpermList.map(s => s.id === spermId ? {
        ...s,
        morphology: {
          ...s.morphology,
          krugerStrict: nextStatus
        }
      } : s);
      onUpdateSperm(updated);
    }
  };

  const handleResetOverrides = () => {
    setOverrides({});
  };

  return (
    <div className={cn("p-6 lg:p-8 rounded-[28px] border space-y-6 font-sans", isDark ? "bg-[#09090b] border-white/10 text-white" : "bg-white border-slate-200 text-slate-900 shadow-sm")}>
      {/* Top Controls Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10 dark:border-white/10 border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
              Kruger Strict Morphology Crop Gallery & Mesh Inspector
              <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-400 rounded-full border border-purple-500/30">
                SCA Style
              </span>
            </h3>
            <p className={cn("text-xs mt-0.5", isDark ? "text-white/40" : "text-slate-500")}>
              High-resolution morphometric evaluation with strict Tygerberg/Kruger criteria & live index recalculation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMeshOverlay(!showMeshOverlay)}
            className={cn(
              "px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer",
              showMeshOverlay 
                ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                : isDark ? "bg-white/5 border-white/10 text-white/60" : "bg-slate-100 border-slate-200 text-slate-600"
            )}
          >
            <Grid className="w-3.5 h-3.5" />
            {showMeshOverlay ? "Kruger Mesh Active" : "Mesh Overlay Off"}
          </button>
          {Object.keys(overrides).length > 0 && (
            <button
              onClick={handleResetOverrides}
              className={cn(
                "px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 text-amber-400 border-amber-500/30 bg-amber-500/10 transition-all cursor-pointer"
              )}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Overrides ({Object.keys(overrides).length})
            </button>
          )}
        </div>
      </div>

      {/* Live Index Statistics Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={cn("p-4 rounded-2xl border", isDark ? "bg-white/[0.02] border-white/10" : "bg-slate-50 border-slate-200")}>
          <span className={cn("text-[9px] font-black uppercase tracking-wider block", isDark ? "text-white/40" : "text-slate-400")}>
            Kruger Strict Normal %
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={cn(
              "text-2xl font-mono font-black",
              normalPercentage >= 4.0 ? "text-emerald-400" : "text-red-400"
            )}>
              {normalPercentage.toFixed(1)}%
            </span>
            <span className="text-[10px] opacity-60">Ref: ≥4.0%</span>
          </div>
          <span className="text-[9px] opacity-60 font-mono">{normalCount} / {totalAnalyzed} cells</span>
        </div>

        <div className={cn("p-4 rounded-2xl border", isDark ? "bg-white/[0.02] border-white/10" : "bg-slate-50 border-slate-200")}>
          <span className={cn("text-[9px] font-black uppercase tracking-wider block", isDark ? "text-white/40" : "text-slate-400")}>
            TZI (Teratozoospermia)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={cn(
              "text-2xl font-mono font-black",
              liveTZI <= 1.60 ? "text-emerald-400" : "text-amber-400"
            )}>
              {liveTZI.toFixed(2)}
            </span>
            <span className="text-[10px] opacity-60">Ref: &lt;1.60</span>
          </div>
          <span className="text-[9px] opacity-60 font-mono">{totalDefectsCount} total defects</span>
        </div>

        <div className={cn("p-4 rounded-2xl border", isDark ? "bg-white/[0.02] border-white/10" : "bg-slate-50 border-slate-200")}>
          <span className={cn("text-[9px] font-black uppercase tracking-wider block", isDark ? "text-white/40" : "text-slate-400")}>
            MAI (Multiple Anomalies)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={cn(
              "text-2xl font-mono font-black",
              liveMAI <= 1.50 ? "text-emerald-400" : "text-amber-400"
            )}>
              {liveMAI.toFixed(2)}
            </span>
            <span className="text-[10px] opacity-60">Ref: &lt;1.50</span>
          </div>
          <span className="text-[9px] opacity-60 font-mono">Defects per cell</span>
        </div>

        <div className={cn("p-4 rounded-2xl border", isDark ? "bg-white/[0.02] border-white/10" : "bg-slate-50 border-slate-200")}>
          <span className={cn("text-[9px] font-black uppercase tracking-wider block", isDark ? "text-white/40" : "text-slate-400")}>
            SDI (Deformity Index)
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={cn(
              "text-2xl font-mono font-black",
              liveSDI <= 1.60 ? "text-emerald-400" : "text-purple-400"
            )}>
              {liveSDI.toFixed(2)}
            </span>
            <span className="text-[10px] opacity-60">Ref: &lt;1.60</span>
          </div>
          <span className="text-[9px] opacity-60 font-mono">Sperm Deformity</span>
        </div>
      </div>

      {/* Filter Selection Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {[
          { id: 'all', label: `All Cells (${augmentedSpermList.length})` },
          { id: 'normal', label: `Strict Normal (${augmentedSpermList.filter(s => s.morphology.krugerStrict === 'strict_normal').length})` },
          { id: 'head_defects', label: 'Head Defects' },
          { id: 'midpiece_defects', label: 'Midpiece Defects' },
          { id: 'tail_defects', label: 'Tail Defects' },
          { id: 'overridden', label: `Manual Overrides (${Object.keys(overrides).length})` }
        ].map(chip => (
          <button
            key={chip.id}
            onClick={() => setFilterType(chip.id as any)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer",
              filterType === chip.id
                ? "bg-purple-500 text-white shadow-md shadow-purple-500/20"
                : isDark ? "bg-white/5 hover:bg-white/10 text-white/70" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Bento Gallery Grid of Morphometry Cell Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredList.map((s, idx) => {
          const isNormal = s.morphology.krugerStrict === 'strict_normal';
          const isBorderline = s.morphology.krugerStrict === 'borderline';
          const isOverridden = !!overrides[s.id];

          const len = s.morphometry.length || 4.5;
          const wid = s.morphometry.width || 2.8;
          const ratio = s.morphometry.lengthWidthRatio || len / wid;
          const acrosome = s.morphometry.acrosomeAreaPercent || 55;

          return (
            <motion.div
              key={s.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between group",
                isNormal 
                  ? (isDark ? "bg-emerald-500/[0.03] border-emerald-500/20 hover:border-emerald-500/40" : "bg-emerald-50/40 border-emerald-200 hover:border-emerald-300")
                  : isBorderline
                    ? (isDark ? "bg-amber-500/[0.03] border-amber-500/20 hover:border-amber-500/40" : "bg-amber-50/40 border-amber-200 hover:border-amber-300")
                    : (isDark ? "bg-white/[0.02] border-white/10 hover:border-white/20" : "bg-white border-slate-200 hover:border-slate-300 shadow-sm")
              )}
            >
              {/* Card Top: ID & Overridden Badge */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-mono font-bold text-purple-400">#{idx + 1}</span>
                  <span className={cn("text-[9px] font-mono", isDark ? "text-white/40" : "text-slate-400")}>({s.id})</span>
                </div>

                <div className="flex items-center gap-1">
                  {isOverridden && (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Override
                    </span>
                  )}
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                    isNormal 
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : isBorderline
                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                        : "bg-red-500/15 text-red-400 border border-red-500/30"
                  )}>
                    {isNormal ? "Strict Normal" : isBorderline ? "Borderline" : "Abnormal"}
                  </span>
                </div>
              </div>

              {/* Central Microscopic Morphometry Visualizer (Canvas/SVG) */}
              <div className="h-28 w-full rounded-xl bg-black/50 border border-white/5 relative flex items-center justify-center overflow-hidden my-1">
                {/* SVG Sperm Head Representation */}
                <svg className="w-full h-full p-2" viewBox="-50 -30 100 60">
                  {/* Kruger Normal Elliptical Reference Mesh */}
                  {showMeshOverlay && (
                    <ellipse
                      cx="0"
                      cy="0"
                      rx="32"
                      ry="20"
                      fill="none"
                      stroke="#a855f7"
                      strokeWidth="0.8"
                      strokeDasharray="2 2"
                      opacity="0.4"
                    />
                  )}

                  {/* Tail path */}
                  <path
                    d={s.morphology.tail === 'coiled' 
                      ? "M -25,0 C -35,-15 -45,15 -35,25 C -25,30 -20,20 -30,10"
                      : s.morphology.tail === 'bent'
                        ? "M -25,0 L -38,0 L -48,22"
                        : "M -25,0 C -38,5 -45,-5 -60,0"
                    }
                    fill="none"
                    stroke={isNormal ? "#10b981" : "#94a3b8"}
                    strokeWidth="2"
                    strokeLinecap="round"
                  />

                  {/* Midpiece */}
                  <rect
                    x="-24"
                    y="-4"
                    width="10"
                    height="8"
                    rx="2"
                    fill={s.morphology.midpiece === 'thick' ? '#f59e0b' : isNormal ? '#10b981' : '#64748b'}
                    opacity="0.8"
                  />

                  {/* Sperm Head Contour */}
                  <ellipse
                    cx="0"
                    cy="0"
                    rx={len * 6.5}
                    ry={wid * 6.5}
                    fill={isNormal ? "rgba(16, 185, 129, 0.25)" : "rgba(168, 85, 247, 0.25)"}
                    stroke={isNormal ? "#10b981" : "#c084fc"}
                    strokeWidth="1.8"
                  />

                  {/* Acrosome Cap Coverage */}
                  <path
                    d={`M ${len * 6.5 * (acrosome / 100 - 0.5)},${-wid * 5} A ${len * 6.5} ${wid * 6.5} 0 0 1 ${len * 6.5},0 A ${len * 6.5} ${wid * 6.5} 0 0 1 ${len * 6.5 * (acrosome / 100 - 0.5)},${wid * 5} Z`}
                    fill={isNormal ? "rgba(16, 185, 129, 0.4)" : "rgba(168, 85, 247, 0.4)"}
                  />

                  {/* Vacuoles if present */}
                  {s.morphology.vacuoles === 'present' && (
                    <circle cx="5" cy="-3" r="3.5" fill="#ef4444" opacity="0.7" />
                  )}
                </svg>

                {/* Aspect ratio overlay badge */}
                <div className="absolute bottom-1.5 right-2 font-mono text-[9px] text-white/60 bg-black/60 px-1.5 py-0.5 rounded">
                  L/W: {ratio.toFixed(2)}
                </div>
              </div>

              {/* Morphometric Dimensions Table */}
              <div className="my-2 space-y-1 text-[10px] font-mono border-t border-b border-white/5 dark:border-white/5 border-slate-100 py-1.5">
                <div className="flex justify-between">
                  <span className="opacity-60">Length × Width:</span>
                  <strong>{len.toFixed(1)} × {wid.toFixed(1)} µm</strong>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Acrosome Cap:</span>
                  <strong className={acrosome >= 40 && acrosome <= 70 ? "text-emerald-400" : "text-amber-400"}>
                    {acrosome.toFixed(0)}% (Ref: 40-70%)
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Surface Area:</span>
                  <strong>{s.morphometry.area.toFixed(1)} µm²</strong>
                </div>
              </div>

              {/* Defect Tags */}
              <div className="flex flex-wrap gap-1 mb-3">
                {s.morphology.head !== 'normal' && (
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-mono uppercase bg-red-500/10 text-red-400 border border-red-500/20">
                    Head: {s.morphology.head}
                  </span>
                )}
                {s.morphology.midpiece !== 'normal' && (
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-mono uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Mid: {s.morphology.midpiece}
                  </span>
                )}
                {s.morphology.tail !== 'normal' && (
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-mono uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Tail: {s.morphology.tail}
                  </span>
                )}
                {s.morphology.droplet !== 'none' && (
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-mono uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    Droplet: {s.morphology.droplet}
                  </span>
                )}
                {isNormal && (
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    No Kruger Anomalies
                  </span>
                )}
              </div>

              {/* Manual Classification Override Action Button */}
              <button
                type="button"
                onClick={() => handleToggleClassification(s.id, s.morphology.krugerStrict)}
                className={cn(
                  "w-full py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                  isNormal 
                    ? "bg-white/5 hover:bg-red-500/20 hover:text-red-300 text-white/70"
                    : "bg-purple-500/20 hover:bg-purple-500 text-purple-300 hover:text-white"
                )}
              >
                <Edit3 className="w-3 h-3" />
                Toggle Kruger Classification
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
