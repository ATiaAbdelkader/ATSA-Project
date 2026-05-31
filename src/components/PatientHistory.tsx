import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  AreaChart,
  Area,
  ReferenceLine,
  Label
} from 'recharts';
import { 
  ArrowLeft, 
  Search, 
  TrendingUp, 
  Calendar, 
  Activity,
  Droplets,
  Target,
  Loader2,
  Settings2,
  LayoutGrid,
  LineChart as LineChartIcon,
  AreaChart as AreaChartIcon,
  Sparkles,
  TrendingDown,
  Minus,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, SPECIES_PROFILES } from '../utils';
import type { PatientHistory, HistoricalDataPoint } from '../types';
import { db, auth } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { GoogleGenAI } from "@google/genai";

interface PatientHistoryProps {
  onBack: () => void;
  theme?: 'light' | 'dark';
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const PatientHistoryView: React.FC<PatientHistoryProps> = ({ onBack, theme = 'dark' }) => {
  const [searchId, setSearchId] = useState('');
  const [activeHistory, setActiveHistory] = useState<PatientHistory | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleMetrics, setVisibleMetrics] = useState<string[]>(['concentration', 'motility', 'morphology', 'vitality', 'sdf']);
  const [chartTypes, setChartTypes] = useState<Record<string, 'area' | 'line'>>({
    concentration: 'area',
    motility: 'line',
    morphology: 'area',
    vitality: 'line',
    sdf: 'area'
  });
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const generateAISummary = async () => {
    if (!activeHistory || isGeneratingAI) return;
    
    setIsGeneratingAI(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

      const ai = new GoogleGenAI({ apiKey });

      const dataStr = activeHistory.data.map(d => 
        `Date: ${d.date}, Conc: ${d.concentration}M/ml, Motility: ${d.motility}%, Normal Morph: ${d.normalMorphology}%, Vitality: ${d.vitality}%, DFI: ${d.dfi}%`
      ).join('\n');

      const prompt = `As a senior veterinary and laboratory specialist, analyze the following historical semen analysis data for a ${activeHistory.species} patient (ID: ${activeHistory.patientId}).
      
      Data History:
      ${dataStr}
      
      Please provide:
      1. A concise clinical summary of the trends (improving, declining, or stable).
      2. Identification of any critical deviations or concerning patterns.
      3. Potential physiological or environmental factors to consider based on these trends.
      4. Brief recommendations for the next steps or follow-up tests.
      
      Keep the tone professional, scientific, and concise. Use bullet points. Include a medical disclaimer at the end.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ]
      });

      setAiSummary(response.text);
    } catch (err) {
      console.error("AI Generation Error:", err);
      setError("Failed to generate AI summary. Please check your API key.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const toggleMetric = (metric: string) => {
    setVisibleMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  const toggleChartType = (metric: string) => {
    setChartTypes(prev => ({
      ...prev,
      [metric]: prev[metric] === 'area' ? 'line' : 'area'
    }));
  };

  useEffect(() => {
    if (!searchId || !auth.currentUser) return;

    setIsLoading(true);
    setError(null);
    const path = 'analyses';

    const q = query(
      collection(db, path),
      where('patientId', '==', searchId),
      where('uid', '==', auth.currentUser.uid),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setActiveHistory(null);
        setIsLoading(false);
        return;
      }

      const data: HistoricalDataPoint[] = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          date: new Date(d.timestamp).toISOString().split('T')[0],
          concentration: d.concentration || 0,
          motility: d.motility?.total || 0,
          progressive: d.motility?.progressive || 0,
          normalMorphology: d.morphology?.normal || 0,
          vitality: d.vitality?.live || 0,
          dfi: d.sdf?.dfi || 0
        };
      });

      setActiveHistory({
        patientId: searchId,
        species: snapshot.docs[0].data().species,
        data
      });
      setIsLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
      setError("Failed to fetch history. Please check your permissions.");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [searchId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by useEffect
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className={cn(
              "p-2 rounded-xl transition-all",
              theme === 'dark' ? "hover:bg-white/5 text-white/40 hover:text-white" : "hover:bg-black/5 text-black/40 hover:text-black"
            )}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className={cn(
              "text-2xl font-bold",
              theme === 'dark' ? "text-white" : "text-slate-900"
            )}>Longitudinal Tracking</h2>
            <p className={cn(
              "text-sm",
              theme === 'dark' ? "text-white/40" : "text-black/40"
            )}>Monitor patient progress and treatment efficacy</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="relative w-full md:w-96">
          <Search className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4",
            theme === 'dark' ? "text-white/20" : "text-black/20"
          )} />
          <input 
            type="text" 
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="Search Patient ID (e.g. PAT-8821)"
            className={cn(
              "w-full border rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all",
              theme === 'dark' ? "bg-[#0f0f0f] border-white/10 text-white placeholder:text-white/20" : "bg-white border-black/10 text-slate-900 placeholder:text-black/20"
            )}
          />
        </form>
      </div>

      {isLoading ? (
        <div className="h-[60vh] flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
        </div>
      ) : activeHistory ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* AI Insights & Comparative Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={cn(
              "lg:col-span-2 p-8 rounded-[32px] border relative overflow-hidden",
              theme === 'dark' ? "bg-[#0f0f0f] border-white/10" : "bg-white border-black/10 shadow-sm"
            )}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                  </div>
                  <h3 className={cn("font-bold", theme === 'dark' ? "text-white" : "text-slate-900")}>AI Clinical Insights</h3>
                </div>
                <button 
                  onClick={generateAISummary}
                  disabled={isGeneratingAI}
                  className={cn(
                    "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                    isGeneratingAI 
                      ? "bg-white/5 text-white/20 cursor-not-allowed" 
                      : (theme === 'dark' ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-emerald-500 text-white hover:bg-emerald-600")
                  )}
                >
                  {isGeneratingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  {aiSummary ? 'Regenerate Summary' : 'Analyze Trends with AI'}
                </button>
              </div>

              <div className={cn(
                "min-h-[150px] rounded-2xl p-6 transition-all",
                theme === 'dark' ? "bg-white/5" : "bg-slate-50"
              )}>
                {aiSummary ? (
                  <div className={cn(
                    "prose prose-sm max-w-none",
                    theme === 'dark' ? "prose-invert text-white/70" : "text-slate-600"
                  )}>
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {aiSummary}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-8">
                    <Sparkles className={cn("w-8 h-8 mb-3", theme === 'dark' ? "text-white/10" : "text-black/10")} />
                    <p className={cn("text-xs", theme === 'dark' ? "text-white/40" : "text-slate-500")}>
                      Click the button above to generate an AI-powered clinical interpretation of this patient's historical trends.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className={cn(
              "p-8 rounded-[32px] border",
              theme === 'dark' ? "bg-[#0f0f0f] border-white/10" : "bg-white border-black/10 shadow-sm"
            )}>
              <h3 className={cn("text-[10px] font-bold uppercase tracking-widest mb-6", theme === 'dark' ? "text-white/40" : "text-slate-400")}>Comparative Delta (vs Last)</h3>
              <div className="space-y-6">
                {activeHistory.data.length >= 2 ? (() => {
                  const latest = activeHistory.data[activeHistory.data.length - 1];
                  const prev = activeHistory.data[activeHistory.data.length - 2];
                  
                  const metrics = [
                    { label: 'Concentration', val: latest.concentration, prev: prev.concentration, unit: 'M/ml' },
                    { label: 'Total Motility', val: latest.motility, prev: prev.motility, unit: '%' },
                    { label: 'Normal Morph', val: latest.normalMorphology, prev: prev.normalMorphology, unit: '%' },
                    { label: 'Vitality', val: latest.vitality, prev: prev.vitality, unit: '%' },
                  ];

                  return metrics.map(m => {
                    const diff = m.val - m.prev;
                    const pct = m.prev !== 0 ? (diff / m.prev) * 100 : 0;
                    
                    return (
                      <div key={m.label} className="flex items-center justify-between">
                        <div>
                          <p className={cn("text-xs font-medium", theme === 'dark' ? "text-white/60" : "text-slate-600")}>{m.label}</p>
                          <p className={cn("text-[10px]", theme === 'dark' ? "text-white/20" : "text-slate-400")}>Prev: {m.prev}{m.unit}</p>
                        </div>
                        <div className="text-right">
                          <p className={cn("text-sm font-bold", theme === 'dark' ? "text-white" : "text-slate-900")}>{m.val}{m.unit}</p>
                          <div className={cn(
                            "flex items-center justify-end gap-1 text-[10px] font-bold",
                            diff > 0 ? "text-emerald-500" : diff < 0 ? "text-red-500" : "text-slate-400"
                          )}>
                            {diff > 0 ? <TrendingUp className="w-3 h-3" /> : diff < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                            {Math.abs(pct).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    );
                  });
                })() : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-8">
                    <AlertCircle className={cn("w-8 h-8 mb-3", theme === 'dark' ? "text-white/10" : "text-black/10")} />
                    <p className={cn("text-xs", theme === 'dark' ? "text-white/40" : "text-slate-500")}>
                      Need at least 2 samples to calculate comparative deltas.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Patient Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Patient ID', val: activeHistory.patientId, icon: Target, color: 'text-blue-500' },
              { label: 'Species', val: activeHistory.species, icon: Activity, color: 'text-emerald-500' },
              { label: 'Total Samples', val: activeHistory.data.length, icon: Calendar, color: 'text-purple-500' },
              { label: 'Latest Status', val: activeHistory.data[activeHistory.data.length-1].motility > 40 ? 'Normal' : 'Abnormal', icon: TrendingUp, color: activeHistory.data[activeHistory.data.length-1].motility > 40 ? 'text-emerald-500' : 'text-red-500' },
            ].map(card => (
              <div key={card.label} className={cn(
                "border p-6 rounded-[32px]",
                theme === 'dark' ? "bg-[#0f0f0f] border-white/10" : "bg-white border-black/10 shadow-sm"
              )}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    "p-2 rounded-lg",
                    theme === 'dark' ? "bg-white/5" : "bg-black/5"
                  )}>
                    <card.icon className={cn("w-4 h-4", card.color)} />
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    theme === 'dark' ? "text-white/30" : "text-black/30"
                  )}>{card.label}</span>
                </div>
                <p className={cn(
                  "text-xl font-bold",
                  theme === 'dark' ? "text-white" : "text-slate-900"
                )}>{card.val}</p>
              </div>
            ))}
          </div>

          {/* Chart Controls */}
          <div className={cn(
            "p-6 rounded-[32px] border flex flex-wrap items-center gap-6",
            theme === 'dark' ? "bg-[#0f0f0f] border-white/10" : "bg-white border-black/10 shadow-sm"
          )}>
            <div className="flex items-center gap-3 pr-6 border-r border-white/10">
              <Settings2 className="w-4 h-4 text-emerald-500" />
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-widest",
                theme === 'dark' ? "text-white/40" : "text-black/40"
              )}>Display Settings</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={() => setVisibleMetrics(visibleMetrics.length === 5 ? [] : ['concentration', 'motility', 'morphology', 'vitality', 'sdf'])}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                  theme === 'dark' ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-black/5 text-black/60 hover:bg-black/10"
                )}
              >
                {visibleMetrics.length === 5 ? 'Clear All' : 'Select All'}
              </button>

              {[
                { id: 'concentration', label: 'Concentration', icon: Droplets, color: 'text-blue-500' },
                { id: 'motility', label: 'Motility', icon: Activity, color: 'text-emerald-500' },
                { id: 'morphology', label: 'Morphology', icon: Target, color: 'text-purple-500' },
                { id: 'vitality', label: 'Vitality', icon: Activity, color: 'text-orange-500' },
                { id: 'sdf', label: 'SDF (DFI)', icon: Target, color: 'text-red-500' }
              ].map(metric => (
                <div key={metric.id} className="flex items-center gap-2">
                  <button
                    onClick={() => toggleMetric(metric.id)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                      visibleMetrics.includes(metric.id)
                        ? (theme === 'dark' ? "bg-white text-black" : "bg-black text-white")
                        : (theme === 'dark' ? "bg-white/5 text-white/40 hover:bg-white/10" : "bg-black/5 text-black/40 hover:bg-black/10")
                    )}
                  >
                    <metric.icon className={cn("w-3 h-3", visibleMetrics.includes(metric.id) ? "" : metric.color)} />
                    {metric.label}
                  </button>
                  
                  {visibleMetrics.includes(metric.id) && (
                    <button
                      onClick={() => toggleChartType(metric.id)}
                      title={`Switch to ${chartTypes[metric.id] === 'area' ? 'Line' : 'Area'} chart`}
                      className={cn(
                        "p-2 rounded-xl transition-all",
                        theme === 'dark' ? "bg-white/5 text-white/40 hover:text-white" : "bg-black/5 text-black/40 hover:text-black"
                      )}
                    >
                      {chartTypes[metric.id] === 'area' ? <LineChartIcon className="w-3 h-3" /> : <AreaChartIcon className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Concentration Trend */}
            {visibleMetrics.includes('concentration') && (
              <div className={cn(
                "p-8 rounded-[32px] border",
                theme === 'dark' ? "bg-[#0f0f0f] border-white/10" : "bg-white border-black/10 shadow-sm"
              )}>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                      <Droplets className="w-4 h-4 text-blue-500" />
                    </div>
                    <h3 className={cn(
                      "font-bold",
                      theme === 'dark' ? "text-white" : "text-slate-900"
                    )}>Concentration Trend</h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      "text-[10px] font-bold uppercase",
                      theme === 'dark' ? "text-white/20" : "text-black/20"
                    )}>M/ml</span>
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartTypes.concentration === 'area' ? (
                      <AreaChart data={activeHistory.data}>
                        <defs>
                          <linearGradient id="colorConc" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "#ffffff05" : "#00000005"} vertical={false} />
                        <XAxis dataKey="date" stroke={theme === 'dark' ? "#ffffff20" : "#00000020"} fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke={theme === 'dark' ? "#ffffff20" : "#00000020"} fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: theme === 'dark' ? '#0f0f0f' : '#fff', 
                            border: theme === 'dark' ? '1px solid #ffffff10' : '1px solid #00000010', 
                            borderRadius: '12px' 
                          }}
                          itemStyle={{ color: theme === 'dark' ? '#fff' : '#000', fontSize: '12px' }}
                        />
                        <ReferenceLine 
                          y={SPECIES_PROFILES[activeHistory.species]?.minConcentration || 15} 
                          stroke="#ef4444" 
                          strokeDasharray="3 3" 
                          label={{ value: 'Ref Min', position: 'right', fill: '#ef4444', fontSize: 8 }} 
                        />
                        <Area type="monotone" dataKey="concentration" stroke="#3b82f6" fillOpacity={1} fill="url(#colorConc)" strokeWidth={2} />
                      </AreaChart>
                    ) : (
                      <LineChart data={activeHistory.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "#ffffff05" : "#00000005"} vertical={false} />
                        <XAxis dataKey="date" stroke={theme === 'dark' ? "#ffffff20" : "#00000020"} fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke={theme === 'dark' ? "#ffffff20" : "#00000020"} fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: theme === 'dark' ? '#0f0f0f' : '#fff', 
                            border: theme === 'dark' ? '1px solid #ffffff10' : '1px solid #00000010', 
                            borderRadius: '12px' 
                          }}
                          itemStyle={{ color: theme === 'dark' ? '#fff' : '#000', fontSize: '12px' }}
                        />
                        <ReferenceLine 
                          y={SPECIES_PROFILES[activeHistory.species]?.minConcentration || 15} 
                          stroke="#ef4444" 
                          strokeDasharray="3 3" 
                          label={{ value: 'Ref Min', position: 'right', fill: '#ef4444', fontSize: 8 }} 
                        />
                        <Line type="monotone" dataKey="concentration" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Motility Trend */}
            {visibleMetrics.includes('motility') && (
              <div className={cn(
                "p-8 rounded-[32px] border",
                theme === 'dark' ? "bg-[#0f0f0f] border-white/10" : "bg-white border-black/10 shadow-sm"
              )}>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                      <Activity className="w-4 h-4 text-emerald-500" />
                    </div>
                    <h3 className={cn(
                      "font-bold",
                      theme === 'dark' ? "text-white" : "text-slate-900"
                    )}>Motility & Progression</h3>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold uppercase",
                    theme === 'dark' ? "text-white/20" : "text-black/20"
                  )}>%</span>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartTypes.motility === 'area' ? (
                      <AreaChart data={activeHistory.data}>
                        <defs>
                          <linearGradient id="colorMot" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorProg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "#ffffff05" : "#00000005"} vertical={false} />
                        <XAxis dataKey="date" stroke={theme === 'dark' ? "#ffffff20" : "#00000020"} fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke={theme === 'dark' ? "#ffffff20" : "#00000020"} fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: theme === 'dark' ? '#0f0f0f' : '#fff', 
                            border: theme === 'dark' ? '1px solid #ffffff10' : '1px solid #00000010', 
                            borderRadius: '12px' 
                          }}
                          itemStyle={{ color: theme === 'dark' ? '#fff' : '#000', fontSize: '12px' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                        <ReferenceLine 
                          y={SPECIES_PROFILES[activeHistory.species]?.minTotalMotility || 40} 
                          stroke="#ef4444" 
                          strokeDasharray="3 3" 
                          label={{ value: 'Min Motility', position: 'right', fill: '#ef4444', fontSize: 8 }} 
                        />
                        <Area type="monotone" dataKey="motility" stroke="#10b981" fillOpacity={1} fill="url(#colorMot)" strokeWidth={2} />
                        <Area type="monotone" dataKey="progressive" stroke="#3b82f6" fillOpacity={1} fill="url(#colorProg)" strokeWidth={2} />
                      </AreaChart>
                    ) : (
                      <LineChart data={activeHistory.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "#ffffff05" : "#00000005"} vertical={false} />
                        <XAxis dataKey="date" stroke={theme === 'dark' ? "#ffffff20" : "#00000020"} fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke={theme === 'dark' ? "#ffffff20" : "#00000020"} fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: theme === 'dark' ? '#0f0f0f' : '#fff', 
                            border: theme === 'dark' ? '1px solid #ffffff10' : '1px solid #00000010', 
                            borderRadius: '12px' 
                          }}
                          itemStyle={{ color: theme === 'dark' ? '#fff' : '#000', fontSize: '12px' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                        <ReferenceLine 
                          y={SPECIES_PROFILES[activeHistory.species]?.minTotalMotility || 40} 
                          stroke="#ef4444" 
                          strokeDasharray="3 3" 
                          label={{ value: 'Min Motility', position: 'right', fill: '#ef4444', fontSize: 8 }} 
                        />
                        <Line type="monotone" dataKey="motility" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
                        <Line type="monotone" dataKey="progressive" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Morphology Trend */}
            {visibleMetrics.includes('morphology') && (
              <div className={cn(
                "p-8 rounded-[32px] border",
                theme === 'dark' ? "bg-[#0f0f0f] border-white/10" : "bg-white border-black/10 shadow-sm"
              )}>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <Target className="w-4 h-4 text-purple-500" />
                    </div>
                    <h3 className={cn(
                      "font-bold",
                      theme === 'dark' ? "text-white" : "text-slate-900"
                    )}>Normal Morphology Trend</h3>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold uppercase",
                    theme === 'dark' ? "text-white/20" : "text-black/20"
                  )}>% (WHO 2010 Ref: &gt;4%)</span>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartTypes.morphology === 'area' ? (
                      <AreaChart data={activeHistory.data}>
                        <defs>
                          <linearGradient id="colorMorph" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "#ffffff05" : "#00000005"} vertical={false} />
                        <XAxis dataKey="date" stroke={theme === 'dark' ? "#ffffff20" : "#00000020"} fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke={theme === 'dark' ? "#ffffff20" : "#00000020"} fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: theme === 'dark' ? '#0f0f0f' : '#fff', 
                            border: theme === 'dark' ? '1px solid #ffffff10' : '1px solid #00000010', 
                            borderRadius: '12px' 
                          }}
                          itemStyle={{ color: theme === 'dark' ? '#fff' : '#000', fontSize: '12px' }}
                        />
                        <Area type="monotone" dataKey="normalMorphology" stroke="#a855f7" fillOpacity={1} fill="url(#colorMorph)" strokeWidth={2} />
                      </AreaChart>
                    ) : (
                      <LineChart data={activeHistory.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "#ffffff05" : "#00000005"} vertical={false} />
                        <XAxis dataKey="date" stroke={theme === 'dark' ? "#ffffff20" : "#00000020"} fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke={theme === 'dark' ? "#ffffff20" : "#00000020"} fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: theme === 'dark' ? '#0f0f0f' : '#fff', 
                            border: theme === 'dark' ? '1px solid #ffffff10' : '1px solid #00000010', 
                            borderRadius: '12px' 
                          }}
                          itemStyle={{ color: theme === 'dark' ? '#fff' : '#000', fontSize: '12px' }}
                        />
                        <Line type="monotone" dataKey="normalMorphology" stroke="#a855f7" strokeWidth={2} dot={{ fill: '#a855f7' }} />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Vitality Trend */}
            {visibleMetrics.includes('vitality') && (
              <div className={cn(
                "p-8 rounded-[32px] border",
                theme === 'dark' ? "bg-[#0f0f0f] border-white/10" : "bg-white border-black/10 shadow-sm"
              )}>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                      <Droplets className="w-4 h-4 text-orange-500" />
                    </div>
                    <h3 className={cn(
                      "font-bold",
                      theme === 'dark' ? "text-white" : "text-slate-900"
                    )}>Vitality Trend</h3>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold uppercase",
                    theme === 'dark' ? "text-white/20" : "text-black/20"
                  )}>% Live</span>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartTypes.vitality === 'area' ? (
                      <AreaChart data={activeHistory.data}>
                        <defs>
                          <linearGradient id="colorVit" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "#ffffff05" : "#00000005"} vertical={false} />
                        <XAxis dataKey="date" stroke={theme === 'dark' ? "#ffffff20" : "#00000020"} fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke={theme === 'dark' ? "#ffffff20" : "#00000020"} fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: theme === 'dark' ? '#0f0f0f' : '#fff', 
                            border: theme === 'dark' ? '1px solid #ffffff10' : '1px solid #00000010', 
                            borderRadius: '12px' 
                          }}
                          itemStyle={{ color: theme === 'dark' ? '#fff' : '#000', fontSize: '12px' }}
                        />
                        <Area type="monotone" dataKey="vitality" stroke="#f97316" fillOpacity={1} fill="url(#colorVit)" strokeWidth={2} />
                      </AreaChart>
                    ) : (
                      <LineChart data={activeHistory.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "#ffffff05" : "#00000005"} vertical={false} />
                        <XAxis dataKey="date" stroke={theme === 'dark' ? "#ffffff20" : "#00000020"} fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke={theme === 'dark' ? "#ffffff20" : "#00000020"} fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: theme === 'dark' ? '#0f0f0f' : '#fff', 
                            border: theme === 'dark' ? '1px solid #ffffff10' : '1px solid #00000010', 
                            borderRadius: '12px' 
                          }}
                          itemStyle={{ color: theme === 'dark' ? '#fff' : '#000', fontSize: '12px' }}
                        />
                        <Line type="monotone" dataKey="vitality" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316' }} />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* SDF Trend */}
            {visibleMetrics.includes('sdf') && (
              <div className={cn(
                "p-8 rounded-[32px] border",
                theme === 'dark' ? "bg-[#0f0f0f] border-white/10" : "bg-white border-black/10 shadow-sm"
              )}>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/10 rounded-lg">
                      <Target className="w-4 h-4 text-red-500" />
                    </div>
                    <h3 className={cn(
                      "font-bold",
                      theme === 'dark' ? "text-white" : "text-slate-900"
                    )}>DNA Fragmentation (DFI)</h3>
                  </div>
                  <span className={cn(
                    "text-[10px] font-bold uppercase",
                    theme === 'dark' ? "text-white/20" : "text-black/20"
                  )}>% DFI</span>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartTypes.sdf === 'area' ? (
                      <AreaChart data={activeHistory.data}>
                        <defs>
                          <linearGradient id="colorSdf" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "#ffffff05" : "#00000005"} vertical={false} />
                        <XAxis dataKey="date" stroke={theme === 'dark' ? "#ffffff20" : "#00000020"} fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke={theme === 'dark' ? "#ffffff20" : "#00000020"} fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: theme === 'dark' ? '#0f0f0f' : '#fff', 
                            border: theme === 'dark' ? '1px solid #ffffff10' : '1px solid #00000010', 
                            borderRadius: '12px' 
                          }}
                          itemStyle={{ color: theme === 'dark' ? '#fff' : '#000', fontSize: '12px' }}
                        />
                        <Area type="monotone" dataKey="dfi" stroke="#ef4444" fillOpacity={1} fill="url(#colorSdf)" strokeWidth={2} />
                      </AreaChart>
                    ) : (
                      <LineChart data={activeHistory.data}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "#ffffff05" : "#00000005"} vertical={false} />
                        <XAxis dataKey="date" stroke={theme === 'dark' ? "#ffffff20" : "#00000020"} fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke={theme === 'dark' ? "#ffffff20" : "#00000020"} fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: theme === 'dark' ? '#0f0f0f' : '#fff', 
                            border: theme === 'dark' ? '1px solid #ffffff10' : '1px solid #00000010', 
                            borderRadius: '12px' 
                          }}
                          itemStyle={{ color: theme === 'dark' ? '#fff' : '#000', fontSize: '12px' }}
                        />
                        <Line type="monotone" dataKey="dfi" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444' }} />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      ) : (
        <div className={cn(
          "h-[60vh] flex flex-col items-center justify-center text-center p-12 border rounded-[48px]",
          theme === 'dark' ? "bg-[#0f0f0f] border-white/10" : "bg-slate-50 border-black/10"
        )}>
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center mb-6",
            theme === 'dark' ? "bg-white/5" : "bg-black/5"
          )}>
            <Search className={cn(
              "w-10 h-10",
              theme === 'dark' ? "text-white/10" : "text-black/10"
            )} />
          </div>
          <h3 className={cn(
            "text-xl font-bold mb-2",
            theme === 'dark' ? "text-white" : "text-slate-900"
          )}>No History Found</h3>
          <p className={cn(
            "max-w-sm",
            theme === 'dark' ? "text-white/40" : "text-black/40"
          )}>
            {searchId 
              ? `We couldn't find any longitudinal data for patient ID "${searchId}". Please verify the ID or register a new sample.`
              : "Enter a Patient ID above to view their historical analysis trends."}
          </p>
          {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}
        </div>
      )}
    </div>
  );
};
