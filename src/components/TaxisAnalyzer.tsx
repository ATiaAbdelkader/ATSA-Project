import React, { useState, useMemo } from 'react';
import { 
  Compass, 
  Wind, 
  Flame, 
  Droplet, 
  Play, 
  RotateCcw, 
  Download, 
  Info, 
  ChevronRight, 
  Crosshair,
  Layers,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Activity,
  ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  RadarChart, 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  ZAxis,
  CartesianGrid, 
  Tooltip, 
  Cell 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';
import type { SpermData } from '../types';

export type TaxisStimulusType = 'chemotaxis' | 'thermotaxis' | 'rheotaxis';

interface TaxisAnalyzerProps {
  spermatozoa: SpermData[];
  theme?: 'light' | 'dark';
  onSelectSperm?: (spermId: string) => void;
  selectedSpermId?: string | null;
}

export const TaxisAnalyzer: React.FC<TaxisAnalyzerProps> = ({
  spermatozoa,
  theme = 'dark',
  onSelectSperm,
  selectedSpermId
}) => {
  const [stimulusType, setStimulusType] = useState<TaxisStimulusType>('chemotaxis');
  const [gradientAngle, setGradientAngle] = useState<number>(0); // 0° = East (Right), 90° = North (Up)
  const [gradientIntensity, setGradientIntensity] = useState<number>(50); // 0 - 100%
  const [flowRate, setFlowRate] = useState<number>(15); // µm/s for rheotaxis
  const [activeSector, setActiveSector] = useState<number | null>(null);

  // Compute Taxis Vector & Angular Metrics for every spermatozoon
  const taxisMetrics = useMemo(() => {
    if (!spermatozoa || spermatozoa.length === 0) {
      return {
        items: [],
        meanCI: 0,
        meanFMI: 0,
        meanDirectness: 0,
        rayleighZ: 0,
        rayleighP: 1,
        positiveTaxisPercent: 0,
        negativeTaxisPercent: 0,
        sectorDistribution: []
      };
    }

    const radGrad = (gradientAngle * Math.PI) / 180;
    const gradUnitX = Math.cos(radGrad);
    const gradUnitY = -Math.sin(radGrad); // Inverted Y for screen coordinates

    let sumCI = 0;
    let sumFMI = 0;
    let sumDirectness = 0;
    let cosSum = 0;
    let sinSum = 0;
    let positiveCount = 0;
    let negativeCount = 0;

    // 12 sectors of 30° each for circular Rose diagram
    const sectors = Array.from({ length: 12 }, (_, i) => ({
      sectorIndex: i,
      startAngle: i * 30 - 15,
      midAngle: i * 30,
      endAngle: i * 30 + 15,
      label: `${i * 30}°`,
      count: 0,
      spermIds: [] as string[]
    }));

    const items = spermatozoa.map((s) => {
      const path = s.path || [];
      if (path.length < 2) {
        return {
          ...s,
          displacementX: 0,
          displacementY: 0,
          euclideanDist: 0,
          totalPathDist: 0.1,
          angleDeg: 0,
          chemotacticIndex: 0,
          forwardMigrationIndex: 0,
          directness: 0,
          isPositiveTaxis: false,
          parallelVelocity: 0,
          perpendicularVelocity: 0
        };
      }

      const pStart = path[0];
      const pEnd = path[path.length - 1];
      const dx = pEnd.x - pStart.x;
      const dy = pEnd.y - pStart.y;
      const euclideanDist = Math.sqrt(dx * dx + dy * dy);

      let totalPathDist = 0;
      for (let i = 1; i < path.length; i++) {
        const segDx = path[i].x - path[i - 1].x;
        const segDy = path[i].y - path[i - 1].y;
        totalPathDist += Math.sqrt(segDx * segDx + segDy * segDy);
      }
      if (totalPathDist < 0.01) totalPathDist = 0.01;

      // Displacement projected onto gradient axis
      const projectedDist = dx * gradUnitX + dy * gradUnitY;
      const perpDist = -dx * gradUnitY + dy * gradUnitX;

      // Chemotactic Index (CI) = Projected Displacement / Total Path Length
      const ci = projectedDist / totalPathDist;
      // Forward Migration Index (FMI) = Projected Displacement / Euclidean Distance
      const fmi = euclideanDist > 0 ? projectedDist / euclideanDist : 0;
      // Directness (Linearity of trajectory)
      const directness = euclideanDist / totalPathDist;

      // Direction Angle in degrees relative to gradient vector
      let angleRad = Math.atan2(-dy, dx); // Carthesian angle
      let angleDeg = (angleRad * 180) / Math.PI;
      if (angleDeg < 0) angleDeg += 360;

      // Relative angle to gradient
      let relAngle = (angleDeg - gradientAngle + 360) % 360;

      // Bin into 12 sectors
      const sectorIdx = Math.floor(((relAngle + 15) % 360) / 30);
      if (sectors[sectorIdx]) {
        sectors[sectorIdx].count += 1;
        sectors[sectorIdx].spermIds.push(s.id);
      }

      // Sums for circular statistics
      const relRad = (relAngle * Math.PI) / 180;
      cosSum += Math.cos(relRad);
      sinSum += Math.sin(relRad);

      sumCI += ci;
      sumFMI += fmi;
      sumDirectness += directness;

      const isPositive = ci > 0.15;
      if (isPositive) positiveCount++;
      else if (ci < -0.15) negativeCount++;

      return {
        ...s,
        displacementX: dx,
        displacementY: dy,
        euclideanDist,
        totalPathDist,
        angleDeg,
        relAngle,
        chemotacticIndex: ci,
        forwardMigrationIndex: fmi,
        directness,
        isPositiveTaxis: isPositive,
        parallelVelocity: s.vsl * Math.cos(relRad),
        perpendicularVelocity: s.vsl * Math.sin(relRad)
      };
    });

    const n = items.length;
    const meanCI = n > 0 ? sumCI / n : 0;
    const meanFMI = n > 0 ? sumFMI / n : 0;
    const meanDirectness = n > 0 ? sumDirectness / n : 0;

    // Rayleigh test of circular uniformity: R_bar = sqrt(C^2 + S^2) / n
    const meanR = n > 0 ? Math.sqrt(cosSum * cosSum + sinSum * sinSum) / n : 0;
    const rayleighZ = n * meanR * meanR;
    // Rayleigh p-value approximation: p = exp(-Z) * (1 + (2Z - Z^2)/(4n) - (24Z - 132Z^2 + 76Z^3 - 9Z^4)/(288n^2))
    const rayleighP = Math.min(1, Math.max(0, Math.exp(-rayleighZ)));

    const positiveTaxisPercent = n > 0 ? (positiveCount / n) * 100 : 0;
    const negativeTaxisPercent = n > 0 ? (negativeCount / n) * 100 : 0;

    const sectorDistribution = sectors.map((s) => ({
      ...s,
      percentage: n > 0 ? (s.count / n) * 100 : 0
    }));

    return {
      items,
      meanCI,
      meanFMI,
      meanDirectness,
      rayleighZ,
      rayleighP,
      positiveTaxisPercent,
      negativeTaxisPercent,
      sectorDistribution
    };
  }, [spermatozoa, gradientAngle]);

  return (
    <div className="w-full space-y-6">
      {/* Header Banner */}
      <div className={cn(
        "p-6 rounded-3xl border relative overflow-hidden transition-all",
        theme === 'dark' 
          ? "bg-[#09090b] border-white/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.4)]" 
          : "bg-white border-slate-200/80 shadow-[0_12px_40px_rgba(0,0,0,0.03)]"
      )}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <Compass className="w-5 h-5 animate-spin-slow" />
              </span>
              <div>
                <span className="text-[10px] font-mono font-bold tracking-widest text-amber-500 uppercase">
                  OpenCASA Standard • Module IV
                </span>
                <h2 className={cn("text-xl font-black tracking-tight", theme === 'dark' ? "text-white" : "text-slate-900")}>
                  Guided Movement & Taxis Kinematics
                </h2>
              </div>
            </div>
            <p className={cn("text-xs max-w-2xl leading-relaxed", theme === 'dark' ? "text-white/60" : "text-slate-500")}>
              Quantifies directional responsiveness, orientation vector fields, and chemotactic/rheotactic indices in response to chemical attractants, thermal gradients, and fluid shear flow.
            </p>
          </div>

          {/* Mode Selector Tabs */}
          <div className={cn(
            "flex items-center p-1.5 rounded-2xl border shrink-0",
            theme === 'dark' ? "bg-black/40 border-white/5" : "bg-slate-100 border-slate-200"
          )}>
            {[
              { id: 'chemotaxis', label: 'Chemotaxis', icon: Droplet, desc: 'Progesterone / Follicular Fluid' },
              { id: 'thermotaxis', label: 'Thermotaxis', icon: Flame, desc: 'Thermal Gradient (ΔT)' },
              { id: 'rheotaxis', label: 'Rheotaxis', icon: Wind, desc: 'Microfluidic Shear Flow' }
            ].map((tab) => {
              const active = stimulusType === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStimulusType(tab.id as TaxisStimulusType)}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                    active
                      ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20 font-black"
                      : theme === 'dark'
                        ? "text-white/50 hover:text-white hover:bg-white/5"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Gradient / Flow Controls Bar */}
        <div className={cn(
          "mt-6 pt-6 border-t grid grid-cols-1 md:grid-cols-3 gap-6",
          theme === 'dark' ? "border-white/5" : "border-slate-100"
        )}>
          {/* Gradient Orientation Angle */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className={cn("font-medium", theme === 'dark' ? "text-white/60" : "text-slate-500")}>
                Stimulus Direction Angle (θ):
              </span>
              <span className="font-mono font-black text-amber-500">{gradientAngle}° ({gradientAngle === 0 ? 'East / Right' : gradientAngle === 90 ? 'North / Up' : gradientAngle === 180 ? 'West / Left' : 'South / Down'})</span>
            </div>
            <input 
              type="range"
              min="0"
              max="359"
              step="15"
              value={gradientAngle}
              onChange={(e) => setGradientAngle(parseInt(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-slate-200 dark:bg-white/10 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] font-mono opacity-40">
              <span>0° (Right)</span>
              <span>90° (Up)</span>
              <span>180° (Left)</span>
              <span>270° (Down)</span>
            </div>
          </div>

          {/* Gradient Intensity */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className={cn("font-medium", theme === 'dark' ? "text-white/60" : "text-slate-500")}>
                {stimulusType === 'rheotaxis' ? 'Fluid Counter-Shear Rate:' : 'Gradient Slope (∇C / ∇T):'}
              </span>
              <span className="font-mono font-black text-amber-500">
                {stimulusType === 'rheotaxis' ? `${flowRate} µm/s` : `${gradientIntensity}%`}
              </span>
            </div>
            <input 
              type="range"
              min={stimulusType === 'rheotaxis' ? "0" : "10"}
              max={stimulusType === 'rheotaxis' ? "60" : "100"}
              value={stimulusType === 'rheotaxis' ? flowRate : gradientIntensity}
              onChange={(e) => stimulusType === 'rheotaxis' ? setFlowRate(parseInt(e.target.value)) : setGradientIntensity(parseInt(e.target.value))}
              className="w-full accent-amber-500 h-1.5 bg-slate-200 dark:bg-white/10 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] font-mono opacity-40">
              <span>{stimulusType === 'rheotaxis' ? '0 µm/s (Static)' : 'Sub-threshold'}</span>
              <span>{stimulusType === 'rheotaxis' ? '60 µm/s (Max Physiological)' : 'Max Slope'}</span>
            </div>
          </div>

          {/* Key Summary Stat Pill */}
          <div className={cn(
            "p-3 rounded-2xl border flex items-center justify-between",
            theme === 'dark' ? "bg-amber-500/[0.03] border-amber-500/20" : "bg-amber-50 border-amber-200"
          )}>
            <div>
              <span className="text-[9px] font-mono uppercase tracking-widest text-amber-500 font-bold block">
                Rayleigh Test Uniformity
              </span>
              <span className={cn("text-base font-black font-mono", theme === 'dark' ? "text-white" : "text-slate-900")}>
                p = {taxisMetrics.rayleighP < 0.001 ? '< 0.001' : taxisMetrics.rayleighP.toFixed(3)}
              </span>
            </div>
            <div className={cn(
              "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
              taxisMetrics.rayleighP < 0.05
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-slate-500/20 text-slate-400 border border-slate-500/30"
            )}>
              {taxisMetrics.rayleighP < 0.05 ? 'Directed Taxis' : 'Random Walk'}
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={cn(
          "p-5 rounded-2xl border relative overflow-hidden",
          theme === 'dark' ? "bg-[#09090b] border-white/[0.06]" : "bg-white border-slate-200/80"
        )}>
          <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-amber-500 block mb-1">
            Chemotactic Index (CI)
          </span>
          <div className="flex items-baseline gap-2">
            <span className={cn("text-2xl font-black font-mono", theme === 'dark' ? "text-white" : "text-slate-900")}>
              {taxisMetrics.meanCI > 0 ? `+${taxisMetrics.meanCI.toFixed(3)}` : taxisMetrics.meanCI.toFixed(3)}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">[-1.0 to +1.0]</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Ratio of forward displacement along the stimulus vector over total distance.
          </p>
        </div>

        <div className={cn(
          "p-5 rounded-2xl border relative overflow-hidden",
          theme === 'dark' ? "bg-[#09090b] border-white/[0.06]" : "bg-white border-slate-200/80"
        )}>
          <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-emerald-500 block mb-1">
            Forward Migration (FMI)
          </span>
          <div className="flex items-baseline gap-2">
            <span className={cn("text-2xl font-black font-mono", theme === 'dark' ? "text-white" : "text-slate-900")}>
              {(taxisMetrics.meanFMI * 100).toFixed(1)}%
            </span>
            <span className="text-[10px] font-mono text-emerald-500 font-bold">Parallel Bias</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Percentage of net Euclidean displacement directed toward gradient source.
          </p>
        </div>

        <div className={cn(
          "p-5 rounded-2xl border relative overflow-hidden",
          theme === 'dark' ? "bg-[#09090b] border-white/[0.06]" : "bg-white border-slate-200/80"
        )}>
          <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-sky-500 block mb-1">
            Path Directness (D)
          </span>
          <div className="flex items-baseline gap-2">
            <span className={cn("text-2xl font-black font-mono", theme === 'dark' ? "text-white" : "text-slate-900")}>
              {(taxisMetrics.meanDirectness * 100).toFixed(1)}%
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">Linearity</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Measures straightness of path without excessive lateral oscillation.
          </p>
        </div>

        <div className={cn(
          "p-5 rounded-2xl border relative overflow-hidden",
          theme === 'dark' ? "bg-[#09090b] border-white/[0.06]" : "bg-white border-slate-200/80"
        )}>
          <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-purple-500 block mb-1">
            Taxis Responders
          </span>
          <div className="flex items-baseline gap-2">
            <span className={cn("text-2xl font-black font-mono", theme === 'dark' ? "text-white" : "text-slate-900")}>
              {taxisMetrics.positiveTaxisPercent.toFixed(1)}%
            </span>
            <span className="text-[10px] font-mono text-purple-400 font-bold">Positive Taxis</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Subpopulation exhibiting significant guided motility toward the gradient.
          </p>
        </div>
      </div>

      {/* Main Analytics Grid: Rose Circular Diagram & Trajectory Vector Field */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Polar Angular Rose Diagram (12 Sectors) */}
        <div className={cn(
          "p-6 rounded-3xl border flex flex-col justify-between",
          theme === 'dark' ? "bg-[#09090b] border-white/[0.06]" : "bg-white border-slate-200/80"
        )}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-amber-500 block">
                  Directional Angle Distribution
                </span>
                <h3 className={cn("text-base font-black", theme === 'dark' ? "text-white" : "text-slate-900")}>
                  Circular Rose Wind Diagram
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-amber-500/10 text-amber-500 px-2.5 py-1 rounded-lg border border-amber-500/20">
                12 Bins (30° Resolution)
              </span>
            </div>

            <div className="h-[300px] w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={taxisMetrics.sectorDistribution}>
                  <PolarAngleAxis 
                    dataKey="label" 
                    stroke={theme === 'dark' ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.4)"}
                    fontSize={10}
                    fontFamily="monospace"
                  />
                  <PolarRadiusAxis 
                    angle={30} 
                    domain={[0, 'auto']} 
                    stroke={theme === 'dark' ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}
                    fontSize={8}
                  />
                  <Radar 
                    name="Sperm Frequency %" 
                    dataKey="percentage" 
                    stroke="#f59e0b" 
                    fill="#f59e0b" 
                    fillOpacity={0.4} 
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className={cn(
                            "p-3 rounded-xl border shadow-xl font-mono text-xs space-y-1",
                            theme === 'dark' ? "bg-black/95 border-amber-500/30 text-white" : "bg-white/95 border-amber-500/30 text-slate-900"
                          )}>
                            <p className="font-bold text-amber-500">Angle: {data.startAngle}° - {data.endAngle}°</p>
                            <p>Count: {data.count} sperm</p>
                            <p>Share: {data.percentage.toFixed(1)}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>

              {/* Gradient Arrow Indicator in Center */}
              <div 
                className="absolute pointer-events-none w-8 h-8 rounded-full border border-amber-500/40 bg-amber-500/10 flex items-center justify-center transition-transform duration-300"
                style={{ transform: `rotate(${-gradientAngle}deg)` }}
              >
                <ArrowRight className="w-4 h-4 text-amber-500" />
              </div>
            </div>
          </div>

          <div className={cn(
            "mt-4 p-3 rounded-xl border text-[11px] font-mono flex items-center justify-between",
            theme === 'dark' ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-100"
          )}>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Attraction Vector: {gradientAngle}°</span>
            </div>
            <span className="text-muted-foreground">Rayleigh Z = {taxisMetrics.rayleighZ.toFixed(2)}</span>
          </div>
        </div>

        {/* Right: Parallel vs Perpendicular Velocity Scatter Field */}
        <div className={cn(
          "p-6 rounded-3xl border flex flex-col justify-between",
          theme === 'dark' ? "bg-[#09090b] border-white/[0.06]" : "bg-white border-slate-200/80"
        )}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-emerald-500 block">
                  Velocity Decomposition
                </span>
                <h3 className={cn("text-base font-black", theme === 'dark' ? "text-white" : "text-slate-900")}>
                  Parallel ($v_\parallel$) vs Perpendicular ($v_\perp$)
                </h3>
              </div>
              <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                Unit: µm/s
              </span>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} />
                  <XAxis 
                    type="number" 
                    dataKey="parallelVelocity" 
                    name="Parallel Velocity" 
                    unit="µm/s"
                    stroke={theme === 'dark' ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.4)"}
                    fontSize={10}
                    label={{ value: 'Parallel (Toward Gradient) →', position: 'insideBottom', offset: -10, fontSize: 10, fill: '#888' }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="perpendicularVelocity" 
                    name="Perpendicular Velocity" 
                    unit="µm/s"
                    stroke={theme === 'dark' ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.4)"}
                    fontSize={10}
                    label={{ value: '↑ Perpendicular Drift', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#888' }}
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className={cn(
                            "p-3 rounded-xl border shadow-xl font-mono text-xs space-y-1",
                            theme === 'dark' ? "bg-black/95 border-emerald-500/30 text-white" : "bg-white/95 border-emerald-500/30 text-slate-900"
                          )}>
                            <p className="font-bold text-emerald-500">ID: {d.id}</p>
                            <p>v∥ (Parallel): {d.parallelVelocity.toFixed(1)} µm/s</p>
                            <p>v⊥ (Perp): {d.perpendicularVelocity.toFixed(1)} µm/s</p>
                            <p>CI: {d.chemotacticIndex.toFixed(3)}</p>
                            <p>VAP: {d.vap} µm/s</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter 
                    name="Spermatozoa" 
                    data={taxisMetrics.items}
                    onClick={(data) => onSelectSperm && onSelectSperm(data.id)}
                  >
                    {taxisMetrics.items.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={
                          entry.id === selectedSpermId 
                            ? "#ec4899" 
                            : entry.isPositiveTaxis 
                              ? "#10b981" 
                              : entry.chemotacticIndex < -0.15 
                                ? "#ef4444" 
                                : "#6b7280"
                        } 
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground pt-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Positive Taxis (v∥ &gt; 0)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Repelled (v∥ &lt; 0)</span>
            </div>
            <span>Click any point to inspect individual trajectory</span>
          </div>
        </div>
      </div>

      {/* Taxis Responders Data Table */}
      <div className={cn(
        "p-6 rounded-3xl border overflow-hidden",
        theme === 'dark' ? "bg-[#09090b] border-white/[0.06]" : "bg-white border-slate-200/80"
      )}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={cn("text-base font-black", theme === 'dark' ? "text-white" : "text-slate-900")}>
              Individual Taxis Kinematics Log
            </h3>
            <p className="text-xs text-muted-foreground">
              Sorted by Chemotactic Index (CI). High positive CI indicates true chemotactic orientation.
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-amber-500/10 text-amber-500 px-3 py-1 rounded-xl border border-amber-500/20">
            {taxisMetrics.items.length} Tracked Trajectories
          </span>
        </div>

        <div className="overflow-x-auto max-h-72 custom-scrollbar">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className={cn(
                "border-b text-[10px] font-bold uppercase tracking-wider text-muted-foreground",
                theme === 'dark' ? "border-white/5 bg-white/[0.02]" : "border-slate-100 bg-slate-50"
              )}>
                <th className="py-2.5 px-3">Sperm ID</th>
                <th className="py-2.5 px-3">Chemotactic Index (CI)</th>
                <th className="py-2.5 px-3">Forward Mig. (FMI)</th>
                <th className="py-2.5 px-3">Directness (D)</th>
                <th className="py-2.5 px-3">v∥ (µm/s)</th>
                <th className="py-2.5 px-3">VCL / VSL</th>
                <th className="py-2.5 px-3">Orientation</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[...taxisMetrics.items]
                .sort((a, b) => b.chemotacticIndex - a.chemotacticIndex)
                .slice(0, 15)
                .map((s) => {
                  const isSelected = s.id === selectedSpermId;
                  return (
                    <tr 
                      key={s.id}
                      onClick={() => onSelectSperm && onSelectSperm(s.id)}
                      className={cn(
                        "transition-colors cursor-pointer",
                        isSelected
                          ? "bg-pink-500/10 text-pink-400 font-bold"
                          : theme === 'dark'
                            ? "hover:bg-white/[0.03]"
                            : "hover:bg-slate-50"
                      )}
                    >
                      <td className="py-2.5 px-3 font-bold">{s.id}</td>
                      <td className="py-2.5 px-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-bold",
                          s.chemotacticIndex > 0.3
                            ? "bg-emerald-500/20 text-emerald-400"
                            : s.chemotacticIndex < -0.15
                              ? "bg-rose-500/20 text-rose-400"
                              : "bg-slate-500/20 text-slate-400"
                        )}>
                          {s.chemotacticIndex > 0 ? `+${s.chemotacticIndex.toFixed(3)}` : s.chemotacticIndex.toFixed(3)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">{(s.forwardMigrationIndex * 100).toFixed(1)}%</td>
                      <td className="py-2.5 px-3">{(s.directness * 100).toFixed(1)}%</td>
                      <td className="py-2.5 px-3">{s.parallelVelocity.toFixed(1)}</td>
                      <td className="py-2.5 px-3">{s.vcl.toFixed(1)} / {s.vsl.toFixed(1)}</td>
                      <td className="py-2.5 px-3">{s.relAngle.toFixed(0)}°</td>
                      <td className="py-2.5 px-3 text-right">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectSperm && onSelectSperm(s.id);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-[10px] font-bold"
                        >
                          View Track
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
