import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Download, 
  FileSpreadsheet, 
  Sliders, 
  Microscope, 
  Calendar, 
  User, 
  RotateCcw, 
  ChevronLeft,
  Info,
  TrendingUp,
  Award
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
import { cn, evaluateWestgardRules } from '../utils';
import type { QCDataPoint, QCLot, AnalysisResult } from '../types';
import { db, auth } from '../firebase';
import { collection, addDoc, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';
import { DebrisFilterInspector } from './DebrisFilterInspector';
import { AuditTrailLog } from './AuditTrailLog';

interface QualityControlProps {
  onBack?: () => void;
  currentAnalysis?: AnalysisResult | null;
  theme?: 'light' | 'dark';
}

const DEFAULT_LOTS: QCLot[] = [
  {
    lotNumber: 'QC-2026-LOT-B89',
    expiryDate: '2026-12-31',
    controlMaterial: 'Standard Latex Micro-Bead Matrix (20µm Monolayer)',
    levels: [
      {
        level: 'level_1_low',
        concentrationTarget: 15.0,
        concentrationSD: 1.2,
        motilityTarget: 25.0,
        motilitySD: 2.5
      },
      {
        level: 'level_2_normal',
        concentrationTarget: 50.0,
        concentrationSD: 3.5,
        motilityTarget: 55.0,
        motilitySD: 4.0
      },
      {
        level: 'level_3_high',
        concentrationTarget: 120.0,
        concentrationSD: 8.0,
        motilityTarget: 75.0,
        motilitySD: 4.5
      }
    ]
  }
];

export const QualityControl: React.FC<QualityControlProps> = ({ onBack, currentAnalysis, theme = 'dark' }) => {
  const isDark = theme === 'dark';
  const [qcSection, setQcSection] = useState<'levey_jennings' | 'debris' | 'audit'>('levey_jennings');
  const [selectedLot, setSelectedLot] = useState<string>(DEFAULT_LOTS[0].lotNumber);
  const [selectedLevel, setSelectedLevel] = useState<'level_1_low' | 'level_2_normal' | 'level_3_high'>('level_2_normal');
  const [selectedParam, setSelectedParam] = useState<'concentration' | 'motility' | 'progressive'>('concentration');
  const [qcHistory, setQcHistory] = useState<QCDataPoint[]>([]);
  const [isAddingRun, setIsAddingRun] = useState(false);
  const [activeTab, setActiveTab] = useState<'chart' | 'logs' | 'westgard'>('chart');

  // New QC Run Form state
  const [inputConc, setInputConc] = useState<string>('51.2');
  const [inputMotility, setInputMotility] = useState<string>('56.0');
  const [inputProg, setInputProg] = useState<string>('44.0');
  const [inputMorph, setInputMorph] = useState<string>('5.2');
  const [operatorName, setOperatorName] = useState<string>('Dr. Atia / Lab Specialist');
  const [notes, setNotes] = useState<string>('');

  const currentLotConfig = DEFAULT_LOTS.find(l => l.lotNumber === selectedLot) || DEFAULT_LOTS[0];
  const currentLevelConfig = currentLotConfig.levels.find(l => l.level === selectedLevel) || currentLotConfig.levels[1];

  const targetMean = selectedParam === 'concentration' 
    ? currentLevelConfig.concentrationTarget 
    : currentLevelConfig.motilityTarget;
  const targetSD = selectedParam === 'concentration' 
    ? currentLevelConfig.concentrationSD 
    : currentLevelConfig.motilitySD;

  // Load from Firestore with local fallback for offline development
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      // Local simulated seed if offline
      const seedHistory: QCDataPoint[] = [
        { id: '1', timestamp: new Date(Date.now() - 14 * 86400000).toISOString(), runDate: 'Day -14', lotNumber: selectedLot, level: selectedLevel, operator: 'Dr. Atia', instrumentId: 'ATSA-CASA-01', concentration: 49.5, motility: 54.2, progressive: 42.0, morphology: 5.0, status: 'in_control', westgardViolations: [] },
        { id: '2', timestamp: new Date(Date.now() - 12 * 86400000).toISOString(), runDate: 'Day -12', lotNumber: selectedLot, level: selectedLevel, operator: 'Dr. Atia', instrumentId: 'ATSA-CASA-01', concentration: 51.0, motility: 56.1, progressive: 44.5, morphology: 5.2, status: 'in_control', westgardViolations: [] },
        { id: '3', timestamp: new Date(Date.now() - 10 * 86400000).toISOString(), runDate: 'Day -10', lotNumber: selectedLot, level: selectedLevel, operator: 'Dr. Atia', instrumentId: 'ATSA-CASA-01', concentration: 52.8, motility: 55.4, progressive: 43.8, morphology: 4.8, status: 'in_control', westgardViolations: [] },
        { id: '4', timestamp: new Date(Date.now() - 8 * 86400000).toISOString(), runDate: 'Day -8', lotNumber: selectedLot, level: selectedLevel, operator: 'Lab Tech A', instrumentId: 'ATSA-CASA-01', concentration: 48.2, motility: 53.0, progressive: 41.2, morphology: 5.1, status: 'in_control', westgardViolations: [] },
        { id: '5', timestamp: new Date(Date.now() - 6 * 86400000).toISOString(), runDate: 'Day -6', lotNumber: selectedLot, level: selectedLevel, operator: 'Dr. Atia', instrumentId: 'ATSA-CASA-01', concentration: 50.4, motility: 55.8, progressive: 44.0, morphology: 5.0, status: 'in_control', westgardViolations: [] },
        { id: '6', timestamp: new Date(Date.now() - 4 * 86400000).toISOString(), runDate: 'Day -4', lotNumber: selectedLot, level: selectedLevel, operator: 'Lab Tech B', instrumentId: 'ATSA-CASA-01', concentration: 53.9, motility: 57.2, progressive: 45.1, morphology: 5.4, status: 'in_control', westgardViolations: [] },
        { id: '7', timestamp: new Date(Date.now() - 2 * 86400000).toISOString(), runDate: 'Day -2', lotNumber: selectedLot, level: selectedLevel, operator: 'Dr. Atia', instrumentId: 'ATSA-CASA-01', concentration: 51.5, motility: 56.4, progressive: 44.6, morphology: 5.3, status: 'in_control', westgardViolations: [] },
        { id: '8', timestamp: new Date(Date.now() - 1 * 86400000).toISOString(), runDate: 'Yesterday', lotNumber: selectedLot, level: selectedLevel, operator: 'Dr. Atia', instrumentId: 'ATSA-CASA-01', concentration: 50.8, motility: 55.1, progressive: 43.9, morphology: 5.1, status: 'in_control', westgardViolations: [] }
      ];
      setQcHistory(seedHistory);
      return;
    }

    const q = query(
      collection(db, 'qc_runs'),
      where('uid', '==', user.uid),
      where('lotNumber', '==', selectedLot),
      where('level', '==', selectedLevel),
      orderBy('timestamp', 'asc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        // Fallback seed
        const seedHistory: QCDataPoint[] = [
          { id: '1', timestamp: new Date(Date.now() - 10 * 86400000).toISOString(), runDate: 'Day -10', lotNumber: selectedLot, level: selectedLevel, operator: 'Dr. Atia', instrumentId: 'ATSA-CASA-01', concentration: 49.5, motility: 54.2, progressive: 42.0, morphology: 5.0, status: 'in_control', westgardViolations: [] },
          { id: '2', timestamp: new Date(Date.now() - 8 * 86400000).toISOString(), runDate: 'Day -8', lotNumber: selectedLot, level: selectedLevel, operator: 'Dr. Atia', instrumentId: 'ATSA-CASA-01', concentration: 51.0, motility: 56.1, progressive: 44.5, morphology: 5.2, status: 'in_control', westgardViolations: [] },
          { id: '3', timestamp: new Date(Date.now() - 6 * 86400000).toISOString(), runDate: 'Day -6', lotNumber: selectedLot, level: selectedLevel, operator: 'Dr. Atia', instrumentId: 'ATSA-CASA-01', concentration: 52.8, motility: 55.4, progressive: 43.8, morphology: 4.8, status: 'in_control', westgardViolations: [] },
          { id: '4', timestamp: new Date(Date.now() - 4 * 86400000).toISOString(), runDate: 'Day -4', lotNumber: selectedLot, level: selectedLevel, operator: 'Lab Tech A', instrumentId: 'ATSA-CASA-01', concentration: 48.2, motility: 53.0, progressive: 41.2, morphology: 5.1, status: 'in_control', westgardViolations: [] },
          { id: '5', timestamp: new Date(Date.now() - 2 * 86400000).toISOString(), runDate: 'Day -2', lotNumber: selectedLot, level: selectedLevel, operator: 'Dr. Atia', instrumentId: 'ATSA-CASA-01', concentration: 50.4, motility: 55.8, progressive: 44.0, morphology: 5.0, status: 'in_control', westgardViolations: [] },
          { id: '6', timestamp: new Date(Date.now() - 1 * 86400000).toISOString(), runDate: 'Day -1', lotNumber: selectedLot, level: selectedLevel, operator: 'Dr. Atia', instrumentId: 'ATSA-CASA-01', concentration: 51.5, motility: 56.4, progressive: 44.6, morphology: 5.3, status: 'in_control', westgardViolations: [] }
        ];
        setQcHistory(seedHistory);
      } else {
        const records = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as QCDataPoint[];
        setQcHistory(records);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'qc_runs');
    });

    return () => unsubscribe();
  }, [selectedLot, selectedLevel]);

  const handleSaveQCRun = async (e: React.FormEvent) => {
    e.preventDefault();
    const conc = parseFloat(inputConc) || targetMean;
    const mot = parseFloat(inputMotility) || 50;
    const prog = parseFloat(inputProg) || 40;
    const morph = parseFloat(inputMorph) || 5;

    // Evaluate Westgard Rules against prior runs
    const pastValues = qcHistory.map(h => (selectedParam === 'concentration' ? h.concentration : h.motility));
    const testVal = selectedParam === 'concentration' ? conc : mot;
    const ruleEval = evaluateWestgardRules(testVal, targetMean, targetSD, pastValues);

    const newRecord: QCDataPoint = {
      id: `qc-${Date.now()}`,
      timestamp: new Date().toISOString(),
      runDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      lotNumber: selectedLot,
      level: selectedLevel,
      operator: operatorName,
      instrumentId: 'ATSA-CASA-01',
      concentration: conc,
      motility: mot,
      progressive: prog,
      morphology: morph,
      status: ruleEval.status,
      westgardViolations: ruleEval.violations,
      notes: notes.trim()
    };

    const user = auth.currentUser;
    if (user) {
      try {
        await addDoc(collection(db, 'qc_runs'), {
          ...newRecord,
          uid: user.uid,
          createdAt: Timestamp.now()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'qc_runs');
      }
    } else {
      setQcHistory(prev => [...prev, newRecord]);
    }

    setIsAddingRun(false);
    setNotes('');
  };

  const chartData = qcHistory.map((item, idx) => {
    const val = selectedParam === 'concentration' 
      ? item.concentration 
      : selectedParam === 'motility' 
        ? item.motility 
        : item.progressive;
    const zScore = targetSD > 0 ? (val - targetMean) / targetSD : 0;
    return {
      run: idx + 1,
      date: item.runDate,
      value: val,
      zScore: Number(zScore.toFixed(2)),
      status: item.status,
      operator: item.operator,
      mean: targetMean,
      plus1SD: targetMean + targetSD,
      minus1SD: targetMean - targetSD,
      plus2SD: targetMean + 2 * targetSD,
      minus2SD: targetMean - 2 * targetSD,
      plus3SD: targetMean + 3 * targetSD,
      minus3SD: targetMean - 3 * targetSD
    };
  });

  const latestRun = qcHistory[qcHistory.length - 1];

  const handleExportCSV = () => {
    if (qcHistory.length === 0) return;
    const headers = ['Run', 'Date', 'Lot', 'Level', 'Operator', 'Concentration (M/ml)', 'Motility (%)', 'Progressive (%)', 'Morphology (%)', 'Status', 'Westgard Violations'];
    const rows = qcHistory.map((r, i) => [
      i + 1,
      r.timestamp,
      r.lotNumber,
      r.level,
      r.operator,
      r.concentration,
      r.motility,
      r.progressive,
      r.morphology,
      r.status,
      r.westgardViolations.join('; ')
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ATSA-IQC-Report-${selectedLot}-${selectedLevel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={cn("p-6 lg:p-10 max-w-7xl mx-auto space-y-8 font-sans", isDark ? "text-white" : "text-slate-900")}>
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10 dark:border-white/10 border-slate-200">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className={cn(
              "p-2.5 rounded-xl border transition-all cursor-pointer",
              isDark ? "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
            )}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
              <h1 className="text-2xl font-black tracking-tight">Internal Quality Control (IQC)</h1>
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20">
                GLP / ISO 15189
              </span>
            </div>
            <p className={cn("text-xs mt-1", isDark ? "text-white/40" : "text-slate-500")}>
              Levey-Jennings precision tracking & Westgard multi-rule automated compliance
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className={cn(
              "px-4 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer",
              isDark ? "bg-white/5 border-white/10 hover:bg-white/10 text-white/80" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
            )}
          >
            <Download className="w-4 h-4 text-emerald-500" />
            Export QC CSV
          </button>
          <button
            onClick={() => setIsAddingRun(true)}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Record Calibration Run
          </button>
        </div>
      </div>

      {/* QC Suite Sub-Navigation Bar */}
      <div className={cn("flex p-1.5 rounded-2xl border gap-2", isDark ? "bg-white/5 border-white/10" : "bg-slate-100 border-slate-200")}>
        {[
          { id: 'levey_jennings', label: 'Levey-Jennings & Westgard QC', icon: TrendingUp },
          { id: 'debris', label: 'Debris & Non-Sperm Artifact Filter', icon: Microscope },
          { id: 'audit', label: 'ISO 15189 / 21 CFR Part 11 Audit Trail', icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = qcSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setQcSection(tab.id as any)}
              className={cn(
                "flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer",
                isActive 
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                  : isDark ? "text-white/60 hover:text-white hover:bg-white/5" : "text-slate-600 hover:text-slate-950 hover:bg-white"
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {qcSection === 'debris' && (
        <DebrisFilterInspector spermatozoa={currentAnalysis?.spermatozoa || []} theme={theme} />
      )}

      {qcSection === 'audit' && (
        <AuditTrailLog theme={theme} />
      )}

      {qcSection === 'levey_jennings' && (
        <>
          {/* Control Summary & Selection Header */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Lot Selector */}
        <div className={cn("p-4 rounded-2xl border", isDark ? "bg-[#0f0f11] border-white/10" : "bg-white border-slate-200")}>
          <label className={cn("text-[10px] font-black uppercase tracking-widest block mb-2", isDark ? "text-white/40" : "text-slate-400")}>Control Material Lot</label>
          <select
            value={selectedLot}
            onChange={(e) => setSelectedLot(e.target.value)}
            className={cn(
              "w-full px-3 py-2 rounded-xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-emerald-500/40",
              isDark ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
            )}
          >
            {DEFAULT_LOTS.map(l => (
              <option key={l.lotNumber} value={l.lotNumber} className="bg-slate-900 text-white">
                {l.lotNumber} ({l.expiryDate})
              </option>
            ))}
          </select>
          <p className={cn("text-[10px] mt-2 opacity-60 truncate", isDark ? "text-white" : "text-slate-600")}>
            {currentLotConfig.controlMaterial}
          </p>
        </div>

        {/* Level Selector */}
        <div className={cn("p-4 rounded-2xl border", isDark ? "bg-[#0f0f11] border-white/10" : "bg-white border-slate-200")}>
          <label className={cn("text-[10px] font-black uppercase tracking-widest block mb-2", isDark ? "text-white/40" : "text-slate-400")}>QC Control Level</label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'level_1_low', label: 'Low' },
              { id: 'level_2_normal', label: 'Normal' },
              { id: 'level_3_high', label: 'High' }
            ].map(lvl => (
              <button
                key={lvl.id}
                onClick={() => setSelectedLevel(lvl.id as any)}
                className={cn(
                  "py-2 text-xs font-bold rounded-xl transition-all cursor-pointer",
                  selectedLevel === lvl.id
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                    : isDark ? "bg-white/5 text-white/50 hover:text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Parameter Selector */}
        <div className={cn("p-4 rounded-2xl border", isDark ? "bg-[#0f0f11] border-white/10" : "bg-white border-slate-200")}>
          <label className={cn("text-[10px] font-black uppercase tracking-widest block mb-2", isDark ? "text-white/40" : "text-slate-400")}>Monitored Parameter</label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { id: 'concentration', label: 'Count' },
              { id: 'motility', label: 'Motility' },
              { id: 'progressive', label: 'Prog' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedParam(p.id as any)}
                className={cn(
                  "py-2 text-xs font-bold rounded-xl transition-all cursor-pointer",
                  selectedParam === p.id
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                    : isDark ? "bg-white/5 text-white/50 hover:text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Current State Status Tile */}
        <div className={cn(
          "p-4 rounded-2xl border flex flex-col justify-between",
          latestRun?.status === 'out_of_control'
            ? "bg-red-500/10 border-red-500/30 text-red-400"
            : latestRun?.status === 'warning'
              ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
        )}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest">Calibration Status</span>
            {latestRun?.status === 'out_of_control' ? (
              <XCircle className="w-4 h-4" />
            ) : latestRun?.status === 'warning' ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
          </div>
          <div className="my-1">
            <h4 className="text-lg font-black uppercase tracking-tight">
              {latestRun ? latestRun.status.replace(/_/g, ' ') : 'IN CONTROL'}
            </h4>
            <p className="text-[10px] opacity-80">
              Target: {targetMean} ± {targetSD} {selectedParam === 'concentration' ? 'M/ml' : '%'}
            </p>
          </div>
          <div className="text-[9px] opacity-70">
            Last run: {latestRun?.runDate || 'Today'}
          </div>
        </div>
      </div>

      {/* Levey-Jennings Chart Container */}
      <div className={cn("p-6 lg:p-8 rounded-[28px] border relative overflow-hidden", isDark ? "bg-[#09090b] border-white/10" : "bg-white border-slate-200 shadow-sm")}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <h3 className="text-lg font-black tracking-tight">
                Levey-Jennings Control Chart — {selectedParam.toUpperCase()}
              </h3>
            </div>
            <p className={cn("text-xs mt-1", isDark ? "text-white/40" : "text-slate-400")}>
              Mean = {targetMean} | 1SD = {targetSD} | 2SD = {targetSD * 2} | 3SD (Reject Limit) = {targetSD * 3}
            </p>
          </div>

          {/* Westgard Rules Guide Pill */}
          <div className="flex items-center gap-2 text-[10px] font-mono font-bold bg-emerald-500/5 px-3 py-1.5 rounded-xl border border-emerald-500/20 text-emerald-500">
            <Info className="w-3.5 h-3.5" />
            Active Rules: 1-3s, 2-2s, R-4s, 4-1s, 10-x
          </div>
        </div>

        {/* Recharts Levey-Jennings Chart */}
        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
              <XAxis dataKey="date" stroke={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} fontSize={10} />
              <YAxis 
                domain={[Math.floor(targetMean - 3.5 * targetSD), Math.ceil(targetMean + 3.5 * targetSD)]} 
                stroke={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"}
                fontSize={10}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: isDark ? '#111' : '#fff', 
                  borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                  borderRadius: 12,
                  fontSize: 12
                }}
              />
              {/* Levey-Jennings Control Limits */}
              <ReferenceLine y={targetMean} stroke="#10b981" strokeWidth={2} label={{ value: 'Mean', fill: '#10b981', fontSize: 10 }} />
              <ReferenceLine y={targetMean + targetSD} stroke="#6ee7b7" strokeDasharray="3 3" label={{ value: '+1 SD', fill: '#6ee7b7', fontSize: 9 }} />
              <ReferenceLine y={targetMean - targetSD} stroke="#6ee7b7" strokeDasharray="3 3" label={{ value: '-1 SD', fill: '#6ee7b7', fontSize: 9 }} />
              <ReferenceLine y={targetMean + 2 * targetSD} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: '+2 SD (Warn)', fill: '#f59e0b', fontSize: 9 }} />
              <ReferenceLine y={targetMean - 2 * targetSD} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: '-2 SD (Warn)', fill: '#f59e0b', fontSize: 9 }} />
              <ReferenceLine y={targetMean + 3 * targetSD} stroke="#ef4444" strokeWidth={1.5} label={{ value: '+3 SD (Reject)', fill: '#ef4444', fontSize: 9 }} />
              <ReferenceLine y={targetMean - 3 * targetSD} stroke="#ef4444" strokeWidth={1.5} label={{ value: '-3 SD (Reject)', fill: '#ef4444', fontSize: 9 }} />

              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#10b981" 
                strokeWidth={3} 
                dot={{ fill: '#10b981', r: 5, strokeWidth: 2, stroke: '#fff' }} 
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* QC Runs History Table & Westgard Rule Violations */}
      <div className={cn("p-6 lg:p-8 rounded-[28px] border overflow-hidden", isDark ? "bg-[#09090b] border-white/10" : "bg-white border-slate-200 shadow-sm")}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black tracking-tight">Recent Daily Calibration Log</h3>
          <span className="text-xs font-mono font-bold text-slate-400">{qcHistory.length} Recorded Runs</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className={cn("border-b text-[10px] uppercase font-black tracking-wider", isDark ? "border-white/10 text-white/40" : "border-slate-200 text-slate-400")}>
                <th className="pb-3 px-3">Run #</th>
                <th className="pb-3 px-3">Date</th>
                <th className="pb-3 px-3">Operator</th>
                <th className="pb-3 px-3">Count (M/ml)</th>
                <th className="pb-3 px-3">Motility (%)</th>
                <th className="pb-3 px-3">Morphology (%)</th>
                <th className="pb-3 px-3">Z-Score</th>
                <th className="pb-3 px-3">Westgard Assessment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 dark:divide-white/5 divide-slate-100 font-mono">
              {qcHistory.slice().reverse().map((run, i) => {
                const zScore = targetSD > 0 ? (run.concentration - targetMean) / targetSD : 0;
                return (
                  <tr key={run.id || i} className={cn("hover:bg-white/[0.02] transition-colors", isDark ? "text-white/80" : "text-slate-700")}>
                    <td className="py-3 px-3 font-bold text-emerald-500">#{qcHistory.length - i}</td>
                    <td className="py-3 px-3">{run.runDate}</td>
                    <td className="py-3 px-3">{run.operator}</td>
                    <td className="py-3 px-3 font-bold">{run.concentration.toFixed(1)}</td>
                    <td className="py-3 px-3 font-bold">{run.motility.toFixed(1)}%</td>
                    <td className="py-3 px-3 font-bold">{run.morphology.toFixed(1)}%</td>
                    <td className="py-3 px-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold",
                        Math.abs(zScore) <= 1.0 ? "bg-emerald-500/10 text-emerald-400" :
                        Math.abs(zScore) <= 2.0 ? "bg-blue-500/10 text-blue-400" :
                        Math.abs(zScore) <= 3.0 ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"
                      )}>
                        {zScore >= 0 ? `+${zScore.toFixed(2)}` : zScore.toFixed(2)} SD
                      </span>
                    </td>
                    <td className="py-3 px-3 font-sans">
                      {run.westgardViolations && run.westgardViolations.length > 0 ? (
                        <div className="flex items-center gap-1.5 text-red-400">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-[11px] truncate max-w-xs">{run.westgardViolations[0]}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-emerald-500">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-bold">Passed All Rules</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      {/* Record Calibration Run Modal */}
      <AnimatePresence>
        {isAddingRun && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsAddingRun(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className={cn(
                "w-full max-w-lg rounded-2xl p-6 md:p-8 border shadow-2xl space-y-6",
                isDark ? "bg-[#0f0f11] border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"
              )}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10 dark:border-white/10 border-slate-200">
                <div className="flex items-center gap-2">
                  <Microscope className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-lg font-black">Record Daily QC Calibration Run</h3>
                </div>
                <button 
                  onClick={() => setIsAddingRun(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveQCRun} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider block mb-1.5 opacity-60">Control Level</label>
                    <input 
                      type="text" 
                      disabled 
                      value={selectedLevel.replace(/_/g, ' ').toUpperCase()} 
                      className={cn("w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border opacity-70", isDark ? "bg-white/5 border-white/10" : "bg-slate-100 border-slate-200")}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider block mb-1.5 opacity-60">Operator / Tech</label>
                    <input 
                      type="text" 
                      value={operatorName} 
                      onChange={e => setOperatorName(e.target.value)}
                      className={cn("w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border focus:ring-2 focus:ring-emerald-500/50 outline-none", isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider block mb-1.5 opacity-60">Measured Concentration (M/ml)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      value={inputConc} 
                      onChange={e => setInputConc(e.target.value)}
                      className={cn("w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border focus:ring-2 focus:ring-emerald-500/50 outline-none font-mono", isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200")}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider block mb-1.5 opacity-60">Measured Total Motility (%)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      value={inputMotility} 
                      onChange={e => setInputMotility(e.target.value)}
                      className={cn("w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border focus:ring-2 focus:ring-emerald-500/50 outline-none font-mono", isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider block mb-1.5 opacity-60">Progressive Motility (%)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      value={inputProg} 
                      onChange={e => setInputProg(e.target.value)}
                      className={cn("w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border focus:ring-2 focus:ring-emerald-500/50 outline-none font-mono", isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200")}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider block mb-1.5 opacity-60">Normal Morphology (%)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      value={inputMorph} 
                      onChange={e => setInputMorph(e.target.value)}
                      className={cn("w-full px-3.5 py-2.5 rounded-xl text-xs font-bold border focus:ring-2 focus:ring-emerald-500/50 outline-none font-mono", isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200")}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider block mb-1.5 opacity-60">Run Notes & Instrument Observations</label>
                  <textarea 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)}
                    rows={2} 
                    placeholder="E.g., Daily morning latex bead test passed. Chamber cleaned with 70% isopropanol."
                    className={cn("w-full px-3.5 py-2.5 rounded-xl text-xs border focus:ring-2 focus:ring-emerald-500/50 outline-none", isDark ? "bg-white/5 border-white/10" : "bg-slate-50 border-slate-200")}
                  />
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-white/10 dark:border-white/10 border-slate-200">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    Evaluate & Commit Run
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingRun(false)}
                    className={cn("px-5 py-3 text-xs font-bold rounded-xl transition-colors cursor-pointer", isDark ? "bg-white/5 hover:bg-white/10 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-800")}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
