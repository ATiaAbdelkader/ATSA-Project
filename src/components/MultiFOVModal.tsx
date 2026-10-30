import React, { useState } from 'react';
import { 
  Microscope, 
  Check, 
  Trash2, 
  AlertTriangle, 
  Plus, 
  CheckCircle2, 
  Layers, 
  X, 
  Download,
  Info,
  RefreshCw,
  Sparkles,
  Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';
import type { FieldOfViewData, MultiFOVComposite } from '../types';
import { calculateMultiFOVComposite } from '../services/casaService';

interface MultiFOVModalProps {
  isOpen: boolean;
  onClose: () => void;
  fields: FieldOfViewData[];
  onFieldsChange: (fields: FieldOfViewData[]) => void;
  onApplyComposite: (composite: MultiFOVComposite) => void;
  theme?: 'light' | 'dark';
}

const CHAMBER_POSITIONS = [
  { index: 1, name: 'Position 1: Top-Left', x: 20, y: 20 },
  { index: 2, name: 'Position 2: Top-Right', x: 80, y: 20 },
  { index: 3, name: 'Position 3: Center Core', x: 50, y: 50 },
  { index: 4, name: 'Position 4: Bottom-Left', x: 20, y: 80 },
  { index: 5, name: 'Position 5: Bottom-Right', x: 80, y: 80 }
];

export const MultiFOVModal: React.FC<MultiFOVModalProps> = ({
  isOpen,
  onClose,
  fields,
  onFieldsChange,
  onApplyComposite,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';
  const [selectedField, setSelectedField] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'table' | 'stitching'>('stitching');

  if (!isOpen) return null;

  const composite = calculateMultiFOVComposite(fields);
  const isCompliant = composite.cvConcentration <= 15;
  const isOptimal = composite.cvConcentration <= 10;

  const handleDeleteField = (index: number) => {
    const updated = fields.filter((_, idx) => idx !== index).map((f, idx) => ({
      ...f,
      fieldIndex: idx + 1
    }));
    onFieldsChange(updated);
    if (selectedField === index) setSelectedField(null);
  };

  const handleApply = () => {
    onApplyComposite(composite);
    onClose();
  };

  const handleSampleNextField = () => {
    const nextIdx = fields.length + 1;
    const baseConc = fields.length > 0 ? fields[0].concentration : 120.0;
    const varianceFactor = 1 + (Math.random() - 0.5) * 0.12; // Realistic ~6% variance
    const nextConc = Math.max(10, Math.round(baseConc * varianceFactor * 10) / 10);
    const nextProg = Math.min(95, Math.max(20, Math.round((64 + (Math.random() - 0.5) * 8) * 10) / 10));

    const newField: FieldOfViewData = {
      fieldIndex: nextIdx,
      timestamp: new Date().toISOString(),
      spermCount: Math.round(nextConc * 2.2),
      concentration: nextConc,
      totalMotility: Math.min(100, nextProg + 18),
      progressiveMotility: nextProg,
      normalMorphology: 5.6,
      avgVcl: Math.round((82 + (Math.random() - 0.5) * 10) * 10) / 10
    };

    onFieldsChange([...fields, newField]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={cn(
          "w-full max-w-4xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]",
          isDark ? "bg-[#0b0b0e] border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"
        )}
      >
        {/* Modal Header */}
        <div className={cn(
          "p-5 md:p-6 border-b flex items-center justify-between",
          isDark ? "border-white/10 bg-white/[0.02]" : "border-slate-200 bg-slate-50"
        )}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight uppercase">Multi-Field of View (FOV) Aggregator</h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  WHO 6th Ed. §2.4 Standard
                </span>
              </div>
              <p className={cn("text-xs mt-0.5", isDark ? "text-white/40" : "text-slate-500")}>
                5-Position automated chamber scanning &amp; inter-field coefficient of variation (CV%)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('stitching')}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer",
                  activeTab === 'stitching' ? "bg-emerald-500 text-white" : "text-white/60 hover:text-white"
                )}
              >
                Chamber Map
              </button>
              <button
                onClick={() => setActiveTab('table')}
                className={cn(
                  "px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer",
                  activeTab === 'table' ? "bg-emerald-500 text-white" : "text-white/60 hover:text-white"
                )}
              >
                Fields ({fields.length})
              </button>
            </div>

            <button
              onClick={onClose}
              className={cn(
                "p-2 rounded-xl border transition-all cursor-pointer",
                isDark ? "bg-white/5 border-white/10 text-white/40 hover:text-white" : "bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-900"
              )}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Summary / Composite Banner */}
          <div className={cn(
            "p-5 rounded-2xl border transition-all",
            isOptimal 
              ? (isDark ? "bg-emerald-500/10 border-emerald-500/30" : "bg-emerald-50 border-emerald-200")
              : isCompliant
                ? (isDark ? "bg-amber-500/10 border-amber-500/30" : "bg-amber-50 border-amber-200")
                : (isDark ? "bg-red-500/10 border-red-500/30 animate-pulse" : "bg-red-50 border-red-200")
          )}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    isOptimal ? "bg-emerald-500 animate-pulse" : isCompliant ? "bg-amber-500" : "bg-red-500 animate-ping"
                  )} />
                  <h4 className="text-xs font-black uppercase tracking-wider">
                    {isOptimal 
                      ? "Optimal Field Homogeneity (CV ≤ 10%)" 
                      : isCompliant 
                        ? "Acceptable Slide Variance (CV ≤ 15%)" 
                        : "Slide Non-Compliant: Excessive Variance (CV > 15%)"}
                  </h4>
                </div>
                <p className={cn("text-[11px] leading-relaxed", isDark ? "text-white/60" : "text-slate-600")}>
                  {isOptimal && "Counting chamber load corresponds with ideal uniform distribution across all fields. Compliant with WHO 6th edition recommendation."}
                  {isCompliant && !isOptimal && "Marginal variance detected across optical fields. Acceptable for clinical reporting, but check slide coverslip uniformity."}
                  {!isCompliant && "Variance exceeds 15% WHO maximum threshold. Likely causes: Uneven chamber loading, air bubbles, or sperm agglutination. Consider reloading a fresh slide."}
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <span className={cn("text-[9px] uppercase font-bold", isDark ? "text-white/40" : "text-slate-400")}>Inter-Field CV</span>
                  <p className={cn(
                    "text-2xl font-mono font-black",
                    isOptimal ? "text-emerald-500" : isCompliant ? "text-amber-500" : "text-red-500"
                  )}>
                    {composite.cvConcentration.toFixed(1)}%
                  </p>
                </div>
                <div className="text-right pl-4 border-l border-white/10">
                  <span className={cn("text-[9px] uppercase font-bold", isDark ? "text-white/40" : "text-slate-400")}>Mean ± SEM</span>
                  <p className="text-xl font-mono font-black text-emerald-400">
                    {composite.meanConcentration.toFixed(1)} <span className="text-xs font-sans opacity-60">± {composite.semConcentration.toFixed(1)}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Composite Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/10">
              <div className={cn("p-2.5 rounded-xl", isDark ? "bg-black/40" : "bg-white/70")}>
                <span className={cn("text-[8px] uppercase font-bold block", isDark ? "text-white/40" : "text-slate-400")}>Total Fields Analyzed</span>
                <span className="text-base font-mono font-bold">{composite.totalFieldsAnalyzed}</span>
              </div>
              <div className={cn("p-2.5 rounded-xl", isDark ? "bg-black/40" : "bg-white/70")}>
                <span className={cn("text-[8px] uppercase font-bold block", isDark ? "text-white/40" : "text-slate-400")}>Total Sperm Tracked</span>
                <span className="text-base font-mono font-bold">{composite.totalSpermTracked}</span>
              </div>
              <div className={cn("p-2.5 rounded-xl", isDark ? "bg-black/40" : "bg-white/70")}>
                <span className={cn("text-[8px] uppercase font-bold block", isDark ? "text-white/40" : "text-slate-400")}>Composite Total Motility</span>
                <span className="text-base font-mono font-bold text-blue-400">{composite.meanTotalMotility.toFixed(1)}%</span>
              </div>
              <div className={cn("p-2.5 rounded-xl", isDark ? "bg-black/40" : "bg-white/70")}>
                <span className={cn("text-[8px] uppercase font-bold block", isDark ? "text-white/40" : "text-slate-400")}>Composite Progressive</span>
                <span className="text-base font-mono font-bold text-emerald-400">{composite.meanProgressiveMotility.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          {/* Stitching & Chamber Map View */}
          {activeTab === 'stitching' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left: 5-Position Counting Chamber Visual Layout */}
              <div className="md:col-span-7 p-5 rounded-2xl bg-black/40 border border-white/10 flex flex-col items-center justify-center relative min-h-[280px]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 absolute top-3 left-4 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Counting Chamber 5-Field Graticule (Leja / Makler)</span>
                </div>

                {/* Hemocytometer / Chamber outline */}
                <div className="w-64 h-64 border-2 border-emerald-500/40 rounded-xl relative bg-emerald-950/10 shadow-inner mt-4">
                  {/* Grid lines */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-20 pointer-events-none">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="border border-emerald-400" />
                    ))}
                  </div>

                  {/* 5 Standard Field Markers */}
                  {CHAMBER_POSITIONS.map((pos) => {
                    const isCaptured = fields.some(f => f.fieldIndex === pos.index);
                    const matchingField = fields.find(f => f.fieldIndex === pos.index);

                    return (
                      <div
                        key={pos.index}
                        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                        className={cn(
                          "absolute -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer border shadow-lg",
                          isCaptured
                            ? "bg-emerald-500/30 border-emerald-400 text-emerald-300 scale-105"
                            : "bg-white/10 border-white/20 text-white/50 hover:bg-white/20"
                        )}
                        title={pos.name}
                      >
                        <span className="text-[10px] font-mono font-black">F{pos.index}</span>
                        {isCaptured && (
                          <span className="text-[7px] font-mono font-bold text-emerald-400 leading-none">
                            {matchingField?.concentration.toFixed(0)}M
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-4 mt-4 text-[10px] text-white/50">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded bg-emerald-500/40 border border-emerald-400" />
                    <span>Captured Field</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded bg-white/10 border border-white/20" />
                    <span>Pending Position</span>
                  </div>
                </div>
              </div>

              {/* Right: Automated Sequence Actions */}
              <div className="md:col-span-5 p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">Automated Step-and-Repeat</h4>
                  <p className="text-[10px] text-white/50 mt-1 leading-relaxed">
                    Capture each quadrant in sequence to satisfy WHO 2010/2021 multi-field homogeneity protocols and eliminate meniscus bias.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-white/60">Sequence Progress:</span>
                    <span className="font-bold text-emerald-400">{fields.length} / 5 Positions</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                      style={{ width: `${Math.min(100, (fields.length / 5) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/10">
                  <button
                    onClick={handleSampleNextField}
                    disabled={fields.length >= 10}
                    className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Capture Next Field Position (#{fields.length + 1})</span>
                  </button>

                  <button
                    onClick={() => onFieldsChange([])}
                    disabled={fields.length === 0}
                    className="w-full py-2 px-3 bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-white/60 hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Clear &amp; Restart Sequence</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Table View of Fields */}
          {activeTab === 'table' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <Microscope className="w-4 h-4 text-emerald-500" />
                  Individual Microscopic Fields ({fields.length})
                </h4>
                <button
                  onClick={handleSampleNextField}
                  className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Field</span>
                </button>
              </div>

              {fields.length === 0 ? (
                <div className={cn(
                  "p-12 text-center rounded-2xl border border-dashed flex flex-col items-center justify-center gap-3",
                  isDark ? "border-white/10 bg-white/[0.01]" : "border-slate-200 bg-slate-50"
                )}>
                  <Microscope className="w-8 h-8 opacity-20 text-emerald-500" />
                  <p className={cn("text-xs font-medium", isDark ? "text-white/40" : "text-slate-500")}>
                    No optical fields captured yet. Click "Capture Next Field Position" to aggregate fields.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {fields.map((f, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
                        isDark ? "bg-white/[0.02] border-white/5 hover:border-white/15" : "bg-slate-50 border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-mono font-bold text-emerald-400 text-xs">
                          #{f.fieldIndex}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold font-mono">Field {f.fieldIndex}</span>
                            <span className={cn("text-[8px] font-mono", isDark ? "text-white/30" : "text-slate-400")}>
                              {new Date(f.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className={cn("text-[10px]", isDark ? "text-white/50" : "text-slate-500")}>
                            {f.spermCount} spermatozoa tracked &bull; VCL: {f.avgVcl.toFixed(1)} µm/s
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 self-end sm:self-center">
                        <div className="text-right">
                          <span className={cn("text-[8px] uppercase font-bold block", isDark ? "text-white/30" : "text-slate-400")}>Concentration</span>
                          <span className="text-sm font-mono font-bold">{f.concentration.toFixed(1)} <span className="text-[9px] opacity-60">M/ml</span></span>
                        </div>
                        <div className="text-right">
                          <span className={cn("text-[8px] uppercase font-bold block", isDark ? "text-white/30" : "text-slate-400")}>Progressive</span>
                          <span className="text-sm font-mono font-bold text-emerald-400">{f.progressiveMotility.toFixed(1)}%</span>
                        </div>
                        <div className="text-right">
                          <span className={cn("text-[8px] uppercase font-bold block", isDark ? "text-white/30" : "text-slate-400")}>Total Motility</span>
                          <span className="text-sm font-mono font-bold text-blue-400">{f.totalMotility.toFixed(1)}%</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteField(idx)}
                          className="p-2 rounded-xl text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
                          title="Delete Field"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={cn(
          "p-5 md:p-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4",
          isDark ? "border-white/10 bg-white/[0.02]" : "border-slate-200 bg-slate-50"
        )}>
          <div className="flex items-center gap-2 text-xs">
            <Info className="w-4 h-4 text-emerald-500" />
            <span className={isDark ? "text-white/60" : "text-slate-600"}>
              Applying composite will update the patient analysis summary with multi-FOV averages.
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className={cn(
                "flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer",
                isDark ? "bg-white/5 hover:bg-white/10 text-white/60" : "bg-slate-100 hover:bg-slate-200 text-slate-600"
              )}
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={fields.length === 0}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Apply Composite to Analysis
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
