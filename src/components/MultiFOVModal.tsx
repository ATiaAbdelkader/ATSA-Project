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
  RefreshCw
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
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
          "p-6 border-b flex items-center justify-between",
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
                  WHO 6th Ed. §2.4
                </span>
              </div>
              <p className={cn("text-xs mt-0.5", isDark ? "text-white/40" : "text-slate-500")}>
                Multi-field slide scanning for specimen homogeneity verification and representative sampling
              </p>
            </div>
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
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

          {/* Captured Fields Table / List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Microscope className="w-4 h-4 text-emerald-500" />
                Individual Microscopic Fields ({fields.length})
              </h4>
              <span className={cn("text-[9px] font-mono", isDark ? "text-white/40" : "text-slate-400")}>
                Min recommended: 3-5 fields
              </span>
            </div>

            {fields.length === 0 ? (
              <div className={cn(
                "p-12 text-center rounded-2xl border border-dashed flex flex-col items-center justify-center gap-3",
                isDark ? "border-white/10 bg-white/[0.01]" : "border-slate-200 bg-slate-50"
              )}>
                <Microscope className="w-8 h-8 opacity-20 text-emerald-500" />
                <p className={cn("text-xs font-medium", isDark ? "text-white/40" : "text-slate-500")}>
                  No optical fields captured yet. Click "Capture Current Field (FOV)" in the live microscope viewport to aggregate fields.
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
                          {f.spermCount} spermatozoa tracked • VCL: {f.avgVcl.toFixed(1)} µm/s
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
        </div>

        {/* Modal Footer */}
        <div className={cn(
          "p-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4",
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
