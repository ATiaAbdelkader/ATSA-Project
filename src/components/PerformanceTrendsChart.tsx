import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Activity, 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  Eye, 
  Sparkles, 
  Microscope, 
  Sliders, 
  RefreshCw, 
  Search, 
  ArrowUpRight, 
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine, 
  ReferenceDot,
  Brush
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';

export interface DailyTrendRecord {
  key: string;            // YYYY-MM-DD
  date: string;           // 'Aug 12'
  fullDate: string;       // 'Wednesday, Aug 12, 2026'
  dayOfWeek: string;      // 'Wed'
  daysAgo: number;        // 0 for today, 1 for yesterday, etc.
  concentration: number;  // exact average in M/mL (2 decimal places)
  count: number;          // exact sample count
  motilityAvg: number;    // %
  progressiveAvg: number; // %
  vitalityAvg: number;    // %
  minConc: number;
  maxConc: number;
  whoCompliant: boolean;
  samples: Array<{
    id: string;
    patientId: string;
    species: string;
    concentration: number;
    motility: number;
    progressive: number;
    status: string;
    timeStr: string;
  }>;
}

interface PerformanceTrendsChartProps {
  analyses: any[];
  theme?: 'light' | 'dark';
  language?: 'en' | 'fr' | 'ar';
  onSelectSample?: (sample: any) => void;
}

// Realistic 30-day benchmark seed for instant clinical demonstration if user has 0 logs
const generateDemoData = (daysCount: number = 30): DailyTrendRecord[] => {
  const result: DailyTrendRecord[] = [];
  const speciesList = ['Human', 'Bovine (Angus)', 'Equine (Thoroughbred)', 'Canine'];
  
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const fullDateStr = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
    const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'short' });

    // Deterministic realistic cyclic trend (mean ~ 48 M/mL with periodic high/low variance)
    const baseWave = 42 + Math.sin(i * 0.45) * 18 + Math.cos(i * 0.8) * 8;
    const sampleCount = (i % 7 === 0 || i % 7 === 6) ? Math.floor(1 + (i * 3) % 3) : Math.floor(2 + (i * 7) % 5);
    
    const samples: DailyTrendRecord['samples'] = [];
    let concSum = 0;
    let motSum = 0;
    let progSum = 0;
    let minC = 999;
    let maxC = 0;

    for (let s = 0; s < sampleCount; s++) {
      const conc = Math.max(8.5, Number((baseWave + ((s * 7 + i) % 13) - 6).toFixed(2)));
      const mot = Math.min(88, Math.max(35, Number((58 + Math.sin(s + i) * 16).toFixed(1))));
      const prog = Math.min(mot, Math.max(20, Number((mot * 0.72).toFixed(1))));
      concSum += conc;
      motSum += mot;
      progSum += prog;
      if (conc < minC) minC = conc;
      if (conc > maxC) maxC = conc;

      const hour = 8 + (s * 2) % 9;
      const min = (s * 23) % 60;
      const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;

      samples.push({
        id: `ANL-${key}-${s + 1}`,
        patientId: `PT-${1000 + (i * 10 + s)}`,
        species: speciesList[(i + s) % speciesList.length],
        concentration: conc,
        motility: mot,
        progressive: prog,
        status: conc >= 15 ? 'Normozoospermia' : 'Oligozoospermia',
        timeStr
      });
    }

    const avgConc = sampleCount > 0 ? Number((concSum / sampleCount).toFixed(2)) : 0;
    const avgMot = sampleCount > 0 ? Number((motSum / sampleCount).toFixed(1)) : 0;
    const avgProg = sampleCount > 0 ? Number((progSum / sampleCount).toFixed(1)) : 0;

    result.push({
      key,
      date: dateStr,
      fullDate: fullDateStr,
      dayOfWeek,
      daysAgo: i,
      concentration: avgConc,
      count: sampleCount,
      motilityAvg: avgMot,
      progressiveAvg: avgProg,
      vitalityAvg: Number((avgMot * 1.08).toFixed(1)),
      minConc: minC === 999 ? 0 : minC,
      maxConc: maxC,
      whoCompliant: avgConc >= 15.0,
      samples
    });
  }

  return result;
};

export const PerformanceTrendsChart: React.FC<PerformanceTrendsChartProps> = ({
  analyses,
  theme = 'dark',
  language = 'en',
  onSelectSample
}) => {
  const isDark = theme === 'dark';

  // Zoom and View Controls
  const [zoomRange, setZoomRange] = useState<'30D' | '14D' | '7D'>('30D');
  const [chartType, setChartType] = useState<'area' | 'line'>('area');
  const [enableHoverZoomLens, setEnableHoverZoomLens] = useState<boolean>(true);
  const [showWhoReference, setShowWhoReference] = useState<boolean>(true);
  const [showMeanReference, setShowMeanReference] = useState<boolean>(true);
  const [useDemoFallback, setUseDemoFallback] = useState<boolean>(false);

  // Active Hovered State for Hover-to-Zoom
  const [hoveredData, setHoveredData] = useState<DailyTrendRecord | null>(null);
  const [pinnedDay, setPinnedDay] = useState<DailyTrendRecord | null>(null);

  // Process raw analyses into chronological daily trends
  const trendData = useMemo<DailyTrendRecord[]>(() => {
    // If no real analyses or user toggled demo fallback, provide full demo stream
    const hasRealData = analyses && analyses.length > 0 && analyses.some(a => (a.concentration || 0) > 0);
    if (!hasRealData || useDemoFallback) {
      return generateDemoData(30);
    }

    const datesMap: { [key: string]: { 
      sum: number; 
      count: number; 
      dateStr: string; 
      fullDateStr: string;
      dayOfWeek: string;
      daysAgo: number;
      motSum: number;
      progSum: number;
      minC: number;
      maxC: number;
      samples: DailyTrendRecord['samples'];
    } } = {};

    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const dateStr = d.toLocaleDateString(language === 'fr' ? 'fr-FR' : language === 'ar' ? 'ar-EG' : 'en-US', {
        month: 'short',
        day: 'numeric',
      });
      const fullDateStr = d.toLocaleDateString(language === 'fr' ? 'fr-FR' : language === 'ar' ? 'ar-EG' : 'en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      const dayOfWeek = d.toLocaleDateString(language === 'fr' ? 'fr-FR' : language === 'ar' ? 'ar-EG' : 'en-US', {
        weekday: 'short'
      });

      datesMap[key] = {
        sum: 0,
        count: 0,
        dateStr,
        fullDateStr,
        dayOfWeek,
        daysAgo: i,
        motSum: 0,
        progSum: 0,
        minC: 999,
        maxC: 0,
        samples: []
      };
    }

    analyses.forEach(analysis => {
      if (!analysis.timestamp) return;
      let dateObj: Date;
      if (typeof analysis.timestamp === 'string') {
        dateObj = new Date(analysis.timestamp);
      } else if (analysis.timestamp.toDate) {
        dateObj = analysis.timestamp.toDate();
      } else {
        dateObj = new Date(analysis.timestamp);
      }

      const dateKey = dateObj.toISOString().split('T')[0];
      if (datesMap[dateKey]) {
        const conc = analysis.concentration || 0;
        const mot = analysis.motility?.total || 0;
        const prog = analysis.motility?.progressive || 0;

        datesMap[dateKey].sum += conc;
        datesMap[dateKey].count += 1;
        datesMap[dateKey].motSum += mot;
        datesMap[dateKey].progSum += prog;
        if (conc < datesMap[dateKey].minC) datesMap[dateKey].minC = conc;
        if (conc > datesMap[dateKey].maxC) datesMap[dateKey].maxC = conc;

        const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        datesMap[dateKey].samples.push({
          id: analysis.id || `ANL-${Date.now()}`,
          patientId: analysis.patientId || 'PT-ANON',
          species: analysis.species || 'Human',
          concentration: Number(conc.toFixed(2)),
          motility: Number(mot.toFixed(1)),
          progressive: Number(prog.toFixed(1)),
          status: analysis.interpretation?.status || (conc >= 15 ? 'Normozoospermia' : 'Oligozoospermia'),
          timeStr
        });
      }
    });

    return Object.keys(datesMap).sort().map(key => {
      const e = datesMap[key];
      const avg = e.count > 0 ? Number((e.sum / e.count).toFixed(2)) : 0;
      const motAvg = e.count > 0 ? Number((e.motSum / e.count).toFixed(1)) : 0;
      const progAvg = e.count > 0 ? Number((e.progSum / e.count).toFixed(1)) : 0;
      return {
        key,
        date: e.dateStr,
        fullDate: e.fullDateStr,
        dayOfWeek: e.dayOfWeek,
        daysAgo: e.daysAgo,
        concentration: avg,
        count: e.count,
        motilityAvg: motAvg,
        progressiveAvg: progAvg,
        vitalityAvg: Number((motAvg * 1.05).toFixed(1)),
        minConc: e.minC === 999 ? 0 : Number(e.minC.toFixed(2)),
        maxConc: Number(e.maxC.toFixed(2)),
        whoCompliant: avg >= 15.0,
        samples: e.samples
      };
    });
  }, [analyses, language, useDemoFallback]);

  // Filter trendData based on active Zoom Window
  const visibleData = useMemo(() => {
    if (zoomRange === '7D') {
      return trendData.slice(-7);
    } else if (zoomRange === '14D') {
      return trendData.slice(-14);
    }
    return trendData;
  }, [trendData, zoomRange]);

  // 30-Day Mean and WHO benchmarks
  const stats = useMemo(() => {
    const activeDays = trendData.filter(d => d.count > 0);
    const totalSamples = trendData.reduce((acc, d) => acc + d.count, 0);
    const avgConc = activeDays.length > 0 
      ? Number((activeDays.reduce((acc, d) => acc + d.concentration, 0) / activeDays.length).toFixed(2))
      : 0;
    const compliantCount = activeDays.filter(d => d.concentration >= 15.0).length;
    const complianceRate = activeDays.length > 0 ? Number(((compliantCount / activeDays.length) * 100).toFixed(1)) : 0;
    
    return {
      activeDaysCount: activeDays.length,
      totalSamples,
      avgConc,
      complianceRate
    };
  }, [trendData]);

  // Current active day for high-magnification tooltip/HUD (hovered or pinned or latest active)
  const activeFocusDay: DailyTrendRecord | null = hoveredData || pinnedDay || visibleData[visibleData.length - 1] || null;

  return (
    <div className={cn(
      "p-6 lg:p-8 rounded-[32px] border flex flex-col justify-between transition-all duration-300 relative overflow-hidden",
      isDark 
        ? "bg-[#09090b] border-white/[0.08] shadow-[0_10px_35px_rgba(0,0,0,0.35)]" 
        : "bg-white border-slate-200/90 shadow-[0_10px_35px_rgba(0,0,0,0.03)]"
    )}>
      {/* Background ambient glow */}
      {isDark && (
        <div className="absolute top-0 right-0 w-[240px] h-[240px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      )}

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <h3 className={cn("text-[10px] font-black uppercase tracking-widest flex items-center gap-2", isDark ? "text-white/40" : "text-slate-400")}>
              Sperm Concentration Analytics
              <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Hover-To-Zoom Active
              </span>
            </h3>
          </div>
          <h4 className={cn("text-lg font-black tracking-tight flex items-center gap-2", isDark ? "text-white" : "text-slate-800")}>
            Performance Trends ({zoomRange === '30D' ? '30 Days' : zoomRange === '14D' ? '14-Day Zoom' : '7-Day Ultra-Zoom'})
          </h4>
        </div>

        {/* Action / Zoom Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Zoom Presets */}
          <div className={cn("flex items-center p-1 rounded-xl border text-[10px] font-bold font-mono", isDark ? "bg-white/5 border-white/10" : "bg-slate-100 border-slate-200")}>
            {(['30D', '14D', '7D'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setZoomRange(range)}
                className={cn(
                  "px-2.5 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1",
                  zoomRange === range
                    ? "bg-emerald-500 text-white shadow-sm font-black"
                    : isDark ? "text-white/60 hover:text-white" : "text-slate-600 hover:text-slate-900"
                )}
                title={`Zoom to ${range}`}
              >
                {range === '7D' && <ZoomIn className="w-3 h-3" />}
                {range}
              </button>
            ))}
          </div>

          {/* Hover Zoom Lens Toggle */}
          <button
            onClick={() => setEnableHoverZoomLens(!enableHoverZoomLens)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-[10px] font-bold font-mono border flex items-center gap-1.5 transition-all cursor-pointer",
              enableHoverZoomLens
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                : isDark ? "bg-white/5 border-white/10 text-white/50" : "bg-slate-100 border-slate-200 text-slate-500"
            )}
            title="Toggle Hover-to-Zoom Inspection HUD"
          >
            <Microscope className="w-3.5 h-3.5" />
            <span>Lens HUD: {enableHoverZoomLens ? 'ON' : 'OFF'}</span>
          </button>

          {/* 30-Day Average Badge */}
          <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase font-bold text-slate-500 dark:text-white/50 bg-slate-500/[0.04] dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] px-2.5 py-1.5 rounded-xl">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Mean: <strong className="text-emerald-400">{stats.avgConc} M/ml</strong>
          </div>
        </div>
      </div>

      {/* Main Chart + Hover-To-Zoom Focus HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Interactive Line / Area Chart */}
        <div className={cn("lg:col-span-8 space-y-3", !enableHoverZoomLens && "lg:col-span-12")}>
          <div className="h-[270px] w-full relative">
            {visibleData.every(d => d.concentration === 0) ? (
              <div className="h-full w-full flex flex-col items-center justify-center border border-dashed border-slate-200 dark:border-white/10 rounded-2xl p-6 text-center">
                <Activity className="w-8 h-8 text-slate-300 dark:text-white/10 mb-2 animate-pulse" />
                <p className="text-xs font-bold text-slate-500 dark:text-white/30 font-sans">No diagnostic data for this time window</p>
                <p className="text-[10px] text-slate-400 dark:text-white/20 mt-1 max-w-xs leading-normal">
                  Run motility analyses in the CASA Engine or load demo benchmark data to preview the full hover-to-zoom curves.
                </p>
                <button
                  onClick={() => setUseDemoFallback(true)}
                  className="mt-3 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Load Clinical Demo Benchmark Data
                </button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                  data={visibleData} 
                  margin={{ top: 15, right: 10, left: -20, bottom: 5 }}
                  onMouseMove={(state: any) => {
                    if (state && state.activePayload && state.activePayload.length > 0) {
                      setHoveredData(state.activePayload[0].payload);
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredData(null);
                  }}
                  onClick={(state: any) => {
                    if (state && state.activePayload && state.activePayload.length > 0) {
                      setPinnedDay(state.activePayload[0].payload);
                    }
                  }}
                >
                  <defs>
                    <linearGradient id="dashboardConcGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.35}/>
                      <stop offset="90%" stopColor="#10b981" stopOpacity={0.01}/>
                    </linearGradient>
                    <linearGradient id="activeHoverStroke" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>

                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke={isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)"} 
                    vertical={false} 
                  />

                  <XAxis 
                    dataKey="date" 
                    stroke={isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.4)"} 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    dy={8}
                    tick={{ fill: isDark ? '#94a3b8' : '#64748b' }}
                  />

                  <YAxis 
                    stroke={isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.4)"} 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    domain={[0, 'dataMax + 10']}
                    tick={{ fill: isDark ? '#94a3b8' : '#64748b' }}
                    unit=" M"
                  />

                  {/* WHO 2010 Lower Reference Threshold (15 M/ml) */}
                  {showWhoReference && (
                    <ReferenceLine 
                      y={15} 
                      stroke="#f59e0b" 
                      strokeDasharray="4 4" 
                      strokeWidth={1.5}
                      label={{ 
                        value: 'WHO 15 M/ml Lower Limit', 
                        position: 'insideTopLeft', 
                        fill: '#f59e0b', 
                        fontSize: 9,
                        fontWeight: 'bold'
                      }} 
                    />
                  )}

                  {/* 30-Day Mean Reference */}
                  {showMeanReference && stats.avgConc > 0 && (
                    <ReferenceLine 
                      y={stats.avgConc} 
                      stroke="#06b6d4" 
                      strokeDasharray="3 3" 
                      strokeWidth={1}
                      label={{ 
                        value: `Clinic Mean (${stats.avgConc} M/ml)`, 
                        position: 'insideBottomRight', 
                        fill: '#06b6d4', 
                        fontSize: 9 
                      }} 
                    />
                  )}

                  <Tooltip 
                    cursor={{ 
                      stroke: '#10b981', 
                      strokeWidth: 2, 
                      strokeDasharray: '4 4',
                      strokeOpacity: 0.8
                    }}
                    content={({ active, payload }) => {
                      if (!active || !payload || !payload.length) return null;
                      const day: DailyTrendRecord = payload[0].payload;
                      return (
                        <div className={cn(
                          "p-4 rounded-2xl border shadow-2xl font-mono text-xs space-y-2.5 backdrop-blur-md min-w-[210px]",
                          isDark 
                            ? "bg-[#0b0b0e]/95 border-emerald-500/40 text-white shadow-emerald-950/40" 
                            : "bg-white/95 border-emerald-500/30 text-slate-800 shadow-slate-200"
                        )}>
                          {/* Date Header */}
                          <div className="flex items-center justify-between border-b pb-2 border-white/10 dark:border-white/10 border-slate-200">
                            <div>
                              <div className="font-black text-xs text-emerald-400 flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {day.date} ({day.dayOfWeek})
                              </div>
                              <span className="text-[9px] opacity-60 font-sans">{day.daysAgo === 0 ? 'Today' : `${day.daysAgo} days ago`}</span>
                            </div>
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
                              day.whoCompliant ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                            )}>
                              {day.whoCompliant ? 'WHO Normal' : 'Below Ref'}
                            </span>
                          </div>

                          {/* Concentration & Samples */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-baseline">
                              <span className="text-[10px] opacity-60">Exact Concentration:</span>
                              <span className="font-black text-base text-emerald-400">
                                {day.concentration.toFixed(2)} <span className="text-[10px] font-sans text-white/50">M/ml</span>
                              </span>
                            </div>

                            <div className="flex justify-between items-baseline">
                              <span className="text-[10px] opacity-60">Exact Sample Count:</span>
                              <span className="font-bold text-xs text-cyan-400">
                                {day.count} {day.count === 1 ? 'sample' : 'samples'}
                              </span>
                            </div>
                          </div>

                          {/* Quick Motility metrics */}
                          {day.count > 0 && (
                            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5 dark:border-white/5 border-slate-100 text-[10px]">
                              <div>
                                <span className="opacity-50 block text-[8px]">MOTILITY</span>
                                <strong className="text-white">{day.motilityAvg}%</strong>
                              </div>
                              <div>
                                <span className="opacity-50 block text-[8px]">PROGRESSIVE</span>
                                <strong className="text-emerald-400">{day.progressiveAvg}%</strong>
                              </div>
                            </div>
                          )}

                          <div className="text-[8px] opacity-40 text-center font-sans">
                            Click point on chart to pin details
                          </div>
                        </div>
                      );
                    }}
                  />

                  <Area 
                    type="monotone" 
                    dataKey="concentration" 
                    stroke="url(#activeHoverStroke)" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#dashboardConcGradient)"
                    activeDot={{ 
                      r: 7, 
                      stroke: '#10b981', 
                      strokeWidth: 3, 
                      fill: isDark ? '#09090b' : '#ffffff',
                      className: "animate-pulse"
                    }}
                    dot={zoomRange === '7D' ? { r: 4, fill: '#10b981', strokeWidth: 1, stroke: '#ffffff' } : false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Reference Line and Chart Type Toggle Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 dark:border-white/5 border-slate-100 text-[10px]">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer opacity-80 hover:opacity-100">
                <input 
                  type="checkbox" 
                  checked={showWhoReference} 
                  onChange={e => setShowWhoReference(e.target.checked)}
                  className="accent-amber-500 rounded cursor-pointer"
                />
                <span className="text-amber-400 font-mono">WHO Ref Line (15 M/ml)</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer opacity-80 hover:opacity-100">
                <input 
                  type="checkbox" 
                  checked={showMeanReference} 
                  onChange={e => setShowMeanReference(e.target.checked)}
                  className="accent-cyan-500 rounded cursor-pointer"
                />
                <span className="text-cyan-400 font-mono">30D Mean Line ({stats.avgConc})</span>
              </label>
            </div>

            <div className="text-[9px] opacity-60 font-mono">
              Showing {visibleData.length} timeline points • Zoom: {zoomRange}
            </div>
          </div>
        </div>

        {/* Hover-To-Zoom Focal Lens Inspection HUD */}
        {enableHoverZoomLens && activeFocusDay && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              "lg:col-span-4 p-5 rounded-2xl border space-y-4 relative overflow-hidden",
              isDark 
                ? "bg-gradient-to-b from-[#111115] to-[#0b0b0d] border-emerald-500/30 shadow-xl shadow-emerald-950/20" 
                : "bg-slate-50 border-emerald-500/20 shadow-sm"
            )}
          >
            {/* Focal Lens Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10 dark:border-white/10 border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <ZoomIn className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 block">
                    {hoveredData ? 'Active Hover Zoom Lens' : pinnedDay ? 'Pinned Day Focus' : 'Latest Focal Point'}
                  </span>
                  <h5 className="text-xs font-bold truncate">{activeFocusDay.fullDate}</h5>
                </div>
              </div>

              <span className={cn(
                "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider font-mono",
                activeFocusDay.whoCompliant ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              )}>
                {activeFocusDay.whoCompliant ? 'Normozoospermic' : 'Sub-WHO'}
              </span>
            </div>

            {/* Exact Concentration & Exact Sample Count */}
            <div className="grid grid-cols-2 gap-2">
              <div className={cn("p-3 rounded-xl border", isDark ? "bg-black/40 border-white/10" : "bg-white border-slate-200")}>
                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400 block mb-0.5">
                  Exact Concentration
                </span>
                <div className="text-2xl font-mono font-black text-emerald-400">
                  {activeFocusDay.concentration.toFixed(2)}
                </div>
                <span className="text-[9px] opacity-60 font-mono">Million / mL</span>
              </div>

              <div className={cn("p-3 rounded-xl border", isDark ? "bg-black/40 border-white/10" : "bg-white border-slate-200")}>
                <span className="text-[8px] font-black uppercase tracking-widest text-cyan-400 block mb-0.5">
                  Exact Sample Count
                </span>
                <div className="text-2xl font-mono font-black text-cyan-400">
                  {activeFocusDay.count}
                </div>
                <span className="text-[9px] opacity-60 font-mono">
                  {activeFocusDay.count === 1 ? 'Patient Specimen' : 'Patient Specimens'}
                </span>
              </div>
            </div>

            {/* WHO Comparison Visual Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="opacity-70">WHO 15 M/ml Benchmark</span>
                <span className={cn("font-bold", activeFocusDay.concentration >= 15 ? "text-emerald-400" : "text-amber-400")}>
                  {activeFocusDay.concentration >= 15 
                    ? `+${(( (activeFocusDay.concentration - 15) / 15 ) * 100).toFixed(0)}% Above Ref` 
                    : `${(((15 - activeFocusDay.concentration) / 15) * 100).toFixed(0)}% Below Ref`}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden relative">
                {/* 15 M/ml marker */}
                <div className="absolute top-0 bottom-0 left-[30%] w-0.5 bg-amber-400 z-10" title="WHO 15 M/ml threshold" />
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    activeFocusDay.concentration >= 15 ? "bg-emerald-500" : "bg-amber-500"
                  )}
                  style={{ width: `${Math.min(100, Math.max(5, (activeFocusDay.concentration / 60) * 100))}%` }}
                />
              </div>
            </div>

            {/* Individual Specimen Breakdown Table on That Day */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-white/50">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-cyan-400" />
                  Day's Individual Records ({activeFocusDay.samples.length})
                </span>
                {activeFocusDay.minConc > 0 && (
                  <span className="font-mono text-emerald-400">
                    Range: {activeFocusDay.minConc} - {activeFocusDay.maxConc} M/ml
                  </span>
                )}
              </div>

              {activeFocusDay.samples.length === 0 ? (
                <div className="p-3 rounded-xl border border-dashed border-white/10 text-center text-[10px] opacity-50">
                  No individual patient specimens recorded on this calendar day.
                </div>
              ) : (
                <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                  {activeFocusDay.samples.map((s, idx) => (
                    <div 
                      key={s.id || idx}
                      onClick={() => onSelectSample && onSelectSample(s)}
                      className={cn(
                        "p-2 rounded-xl border flex items-center justify-between text-[10px] font-mono transition-all",
                        onSelectSample ? "cursor-pointer hover:border-emerald-500/40" : "",
                        isDark ? "bg-white/[0.03] border-white/10" : "bg-white border-slate-200"
                      )}
                    >
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{s.patientId}</span>
                          <span className="px-1.5 py-0.2 text-[8px] rounded bg-emerald-500/10 text-emerald-400">
                            {s.species}
                          </span>
                        </div>
                        <span className="text-[8px] opacity-60 font-sans">Time: {s.timeStr} • {s.status}</span>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-emerald-400">{s.concentration.toFixed(1)} M/ml</div>
                        <div className="text-[8px] opacity-60">Mot: {s.motility}% (Prog: {s.progressive}%)</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
