import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Sparkles, 
  Download, 
  Layers, 
  FlaskConical, 
  Snowflake, 
  ShieldCheck, 
  CheckCircle2, 
  Info, 
  TrendingUp, 
  Percent, 
  Printer
} from 'lucide-react';
import { cn } from '../utils';

interface VeterinaryCryoCalculatorProps {
  initialVolume?: number;
  initialConcentration?: number;
  initialProgressive?: number;
  initialSpecies?: string;
  theme?: 'light' | 'dark';
}

interface SpeciesBreedingPreset {
  id: string;
  name: string;
  defaultVolume: number; // mL
  defaultConcentration: number; // M/mL
  defaultProgressive: number; // %
  targetDoseMotile: number; // M motile sperm per dose/straw
  standardStrawSize: 0.25 | 0.50 | 5.0 | 20.0; // mL
  recommendedExtender: string;
  typicalCryoRecovery: number; // %
}

const SPECIES_PRESETS: SpeciesBreedingPreset[] = [
  {
    id: 'bull',
    name: 'Bull / Bovine',
    defaultVolume: 6.5,
    defaultConcentration: 1200,
    defaultProgressive: 75,
    targetDoseMotile: 20, // 20M motile sperm / 0.25mL straw
    standardStrawSize: 0.25,
    recommendedExtender: 'Optixcell / Tris-Egg Yolk (20%)',
    typicalCryoRecovery: 50
  },
  {
    id: 'stallion',
    name: 'Stallion / Equine',
    defaultVolume: 60.0,
    defaultConcentration: 180,
    defaultProgressive: 70,
    targetDoseMotile: 500, // 500M progressive motile sperm for fresh/cooled or 100M/straw frozen
    standardStrawSize: 0.50,
    recommendedExtender: 'INRA96 / BotuCrio / Kenney Skim Milk',
    typicalCryoRecovery: 45
  },
  {
    id: 'boar',
    name: 'Boar / Porcine',
    defaultVolume: 220.0,
    defaultConcentration: 250,
    defaultProgressive: 80,
    targetDoseMotile: 2500, // 2.5 Billion sperm per fresh AI bottle (80-100mL)
    standardStrawSize: 20.0,
    recommendedExtender: 'Androstar Plus / BTS (Beltsville Thawing Solution)',
    typicalCryoRecovery: 40
  },
  {
    id: 'ram',
    name: 'Ram / Ovine',
    defaultVolume: 1.2,
    defaultConcentration: 3000,
    defaultProgressive: 80,
    targetDoseMotile: 50,
    standardStrawSize: 0.25,
    recommendedExtender: 'Tris-Fructose-Citric Acid Glycerol',
    typicalCryoRecovery: 48
  },
  {
    id: 'canine',
    name: 'Canine / Stud Dog',
    defaultVolume: 4.5,
    defaultConcentration: 280,
    defaultProgressive: 85,
    targetDoseMotile: 150, // 150-200M motile sperm for TCI / Surgical AI
    standardStrawSize: 0.50,
    recommendedExtender: 'CaniPro Freeze / Tris-Lecithin',
    typicalCryoRecovery: 55
  },
  {
    id: 'human',
    name: 'Human / Donor Bank',
    defaultVolume: 3.2,
    defaultConcentration: 65,
    defaultProgressive: 65,
    targetDoseMotile: 15, // 10-15M progressive motile sperm per IUI/ICI vial
    standardStrawSize: 0.50,
    recommendedExtender: 'TEST-Yolk Buffer (TYB) / CryoSperm',
    typicalCryoRecovery: 50
  }
];

export const VeterinaryCryoCalculator: React.FC<VeterinaryCryoCalculatorProps> = ({
  initialVolume = 6.5,
  initialConcentration = 1200,
  initialProgressive = 75,
  initialSpecies = 'bull',
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';

  const [selectedSpeciesId, setSelectedSpeciesId] = useState<string>(initialSpecies);
  const currentPreset = SPECIES_PRESETS.find(s => s.id === selectedSpeciesId) || SPECIES_PRESETS[0];

  const [ejaculateVolume, setEjaculateVolume] = useState<number>(initialVolume || currentPreset.defaultVolume);
  const [concentration, setConcentration] = useState<number>(initialConcentration || currentPreset.defaultConcentration);
  const [progressiveMotility, setProgressiveMotility] = useState<number>(initialProgressive || currentPreset.defaultProgressive);
  const [targetDoseMotile, setTargetDoseMotile] = useState<number>(currentPreset.targetDoseMotile);
  const [strawSize, setStrawSize] = useState<number>(currentPreset.standardStrawSize);
  const [extenderName, setExtenderName] = useState<string>(currentPreset.recommendedExtender);
  const [expectedPostThawRecovery, setExpectedPostThawRecovery] = useState<number>(currentPreset.typicalCryoRecovery);
  const [isPreFreezeMode, setIsPreFreezeMode] = useState<boolean>(true);

  // Handle Species Switch
  const handleSpeciesChange = (speciesId: string) => {
    setSelectedSpeciesId(speciesId);
    const p = SPECIES_PRESETS.find(s => s.id === speciesId);
    if (p) {
      setEjaculateVolume(p.defaultVolume);
      setConcentration(p.defaultConcentration);
      setProgressiveMotility(p.defaultProgressive);
      setTargetDoseMotile(p.targetDoseMotile);
      setStrawSize(p.standardStrawSize);
      setExtenderName(p.recommendedExtender);
      setExpectedPostThawRecovery(p.typicalCryoRecovery);
    }
  };

  // Breeding Mathematical Model Calculations
  const results = useMemo(() => {
    // Total raw sperm in ejaculate (Millions)
    const totalSpermM = ejaculateVolume * concentration;
    const totalSpermBillion = totalSpermM / 1000;

    // Total progressive motile sperm (Millions)
    const totalMotileSpermM = totalSpermM * (progressiveMotility / 100);
    const totalMotileSpermBillion = totalMotileSpermM / 1000;

    // Effective Motile Sperm considering cryo post-thaw recovery factor if cryo mode active
    const effectiveMotileMultiplier = isPreFreezeMode ? (expectedPostThawRecovery / 100) : 1.0;
    const effectiveDosePoolM = isPreFreezeMode ? (totalMotileSpermM * effectiveMotileMultiplier) : totalMotileSpermM;

    // Total Insemination Doses or Straws
    const totalDoses = Math.max(1, Math.floor(effectiveDosePoolM / Math.max(1, targetDoseMotile)));

    // Final total extended volume needed (mL) = totalDoses * strawSize
    const finalExtendedVolume = totalDoses * strawSize;

    // Extender to add (mL)
    const extenderToAdd = Math.max(0, finalExtendedVolume - ejaculateVolume);
    const dilutionRatio = ejaculateVolume > 0 ? (extenderToAdd / ejaculateVolume).toFixed(2) : '1.0';

    // Concentration in final diluted straw (M/mL)
    const finalConcentrationPerMl = finalExtendedVolume > 0 ? totalSpermM / finalExtendedVolume : concentration;

    return {
      totalSpermBillion,
      totalMotileSpermBillion,
      totalDoses,
      finalExtendedVolume,
      extenderToAdd,
      dilutionRatio,
      finalConcentrationPerMl,
      postThawMotilePerStraw: isPreFreezeMode ? targetDoseMotile : (targetDoseMotile * (expectedPostThawRecovery / 100))
    };
  }, [ejaculateVolume, concentration, progressiveMotility, targetDoseMotile, strawSize, expectedPostThawRecovery, isPreFreezeMode]);

  const handlePrintProtocol = () => {
    window.print();
  };

  return (
    <div className={cn("p-6 lg:p-8 rounded-[28px] border space-y-6", isDark ? "bg-[#09090b] border-white/10 text-white" : "bg-white border-slate-200 text-slate-900 shadow-sm")}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10 dark:border-white/10 border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight flex items-center gap-2">
              Veterinary Cryopreservation & AI Straw Dose Dilution Engine
              <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-400 rounded-full border border-indigo-500/30">
                Breeder Suite
              </span>
            </h3>
            <p className={cn("text-xs mt-0.5", isDark ? "text-white/40" : "text-slate-500")}>
              Calculate extender dilution, total viable straw yield, and post-thaw cryo-recovery for livestock breeding
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPreFreezeMode(!isPreFreezeMode)}
            className={cn(
              "px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer",
              isPreFreezeMode 
                ? "bg-sky-500/20 border-sky-500/40 text-sky-300"
                : isDark ? "bg-white/5 border-white/10 text-white/60" : "bg-slate-100 border-slate-200 text-slate-600"
            )}
          >
            <Snowflake className="w-3.5 h-3.5" />
            {isPreFreezeMode ? "Cryo Post-Thaw Adjusted" : "Fresh / Cooled AI Mode"}
          </button>
          <button
            onClick={handlePrintProtocol}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all cursor-pointer",
              isDark ? "bg-white/5 border-white/10 hover:bg-white/10 text-white/80" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-700"
            )}
          >
            <Printer className="w-3.5 h-3.5 text-indigo-400" />
            Print Dilution Sheet
          </button>
        </div>
      </div>

      {/* Species Preset Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {SPECIES_PRESETS.map(sp => (
          <button
            key={sp.id}
            onClick={() => handleSpeciesChange(sp.id)}
            className={cn(
              "p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1",
              selectedSpeciesId === sp.id
                ? "bg-indigo-500 text-white border-indigo-500 shadow-md shadow-indigo-500/20 scale-[1.02]"
                : isDark ? "bg-white/[0.02] border-white/10 hover:bg-white/5 text-white/70" : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
            )}
          >
            <span className="text-xs font-black">{sp.name.split('/')[0]}</span>
            <span className="text-[9px] opacity-75">{sp.standardStrawSize} mL Straw</span>
          </button>
        ))}
      </div>

      {/* Main Parameters Grid & Visual Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Input Sliders */}
        <div className={cn("p-5 rounded-2xl border space-y-4 lg:col-span-1", isDark ? "bg-white/[0.02] border-white/10" : "bg-slate-50 border-slate-200")}>
          <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
            <FlaskConical className="w-4 h-4" /> Ejaculate Parameters
          </h4>

          {/* Volume */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="opacity-70">Ejaculate Volume</span>
              <span className="font-mono font-bold">{ejaculateVolume.toFixed(1)} mL</span>
            </div>
            <input 
              type="range"
              min={0.2}
              max={300}
              step={ejaculateVolume > 20 ? 5 : 0.2}
              value={ejaculateVolume}
              onChange={e => setEjaculateVolume(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Concentration */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="opacity-70">Raw Concentration</span>
              <span className="font-mono font-bold">{concentration.toFixed(0)} M/mL</span>
            </div>
            <input 
              type="range"
              min={10}
              max={4000}
              step={20}
              value={concentration}
              onChange={e => setConcentration(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Motility */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="opacity-70">Progressive Motility</span>
              <span className="font-mono font-bold">{progressiveMotility.toFixed(0)}%</span>
            </div>
            <input 
              type="range"
              min={5}
              max={100}
              step={1}
              value={progressiveMotility}
              onChange={e => setProgressiveMotility(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Target Motile Sperm per Dose */}
          <div className="space-y-1 border-t border-white/10 pt-3">
            <div className="flex justify-between text-xs">
              <span className="opacity-70">Target Motile Sperm / Straw</span>
              <span className="font-mono font-bold text-indigo-400">{targetDoseMotile} M</span>
            </div>
            <input 
              type="range"
              min={5}
              max={selectedSpeciesId === 'boar' ? 3500 : 600}
              step={5}
              value={targetDoseMotile}
              onChange={e => setTargetDoseMotile(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Post-Thaw Survival Rate if in Cryo Mode */}
          {isPreFreezeMode && (
            <div className="space-y-1 border-t border-white/10 pt-3">
              <div className="flex justify-between text-xs">
                <span className="opacity-70 flex items-center gap-1 text-sky-400">
                  <Snowflake className="w-3 h-3" /> Expected Cryo Recovery
                </span>
                <span className="font-mono font-bold text-sky-400">{expectedPostThawRecovery}%</span>
              </div>
              <input 
                type="range"
                min={20}
                max={90}
                step={5}
                value={expectedPostThawRecovery}
                onChange={e => setExpectedPostThawRecovery(parseFloat(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Right Column: Calculations & Pipetting Dilution Recipe */}
        <div className="lg:col-span-2 space-y-4">
          {/* Main Key Metrics Hero Tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className={cn("p-4 rounded-2xl border", isDark ? "bg-indigo-500/10 border-indigo-500/30" : "bg-indigo-50 border-indigo-200")}>
              <span className="text-[9px] font-black uppercase tracking-wider text-indigo-400 block">Total Straws / Doses</span>
              <div className="text-3xl font-mono font-black text-indigo-400 mt-1">
                {results.totalDoses}
              </div>
              <span className="text-[10px] opacity-75">@ {strawSize} mL each</span>
            </div>

            <div className={cn("p-4 rounded-2xl border", isDark ? "bg-emerald-500/10 border-emerald-500/30" : "bg-emerald-50 border-emerald-200")}>
              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 block">Extender to Add</span>
              <div className="text-3xl font-mono font-black text-emerald-400 mt-1">
                {results.extenderToAdd.toFixed(1)} <span className="text-sm">mL</span>
              </div>
              <span className="text-[10px] opacity-75">1 : {results.dilutionRatio} ratio</span>
            </div>

            <div className={cn("p-4 rounded-2xl border", isDark ? "bg-white/[0.02] border-white/10" : "bg-slate-50 border-slate-200")}>
              <span className={cn("text-[9px] font-black uppercase tracking-wider block", isDark ? "text-white/40" : "text-slate-400")}>
                Total Motile Pool
              </span>
              <div className="text-2xl font-mono font-black mt-1">
                {results.totalMotileSpermBillion.toFixed(2)} <span className="text-xs font-sans font-normal opacity-70">Billion</span>
              </div>
              <span className="text-[10px] opacity-60">Total: {results.totalSpermBillion.toFixed(2)}B</span>
            </div>

            <div className={cn("p-4 rounded-2xl border", isDark ? "bg-white/[0.02] border-white/10" : "bg-slate-50 border-slate-200")}>
              <span className={cn("text-[9px] font-black uppercase tracking-wider block", isDark ? "text-white/40" : "text-slate-400")}>
                Final Diluted Conc.
              </span>
              <div className="text-2xl font-mono font-black mt-1">
                {results.finalConcentrationPerMl.toFixed(0)} <span className="text-xs font-sans font-normal opacity-70">M/mL</span>
              </div>
              <span className="text-[10px] opacity-60">Volume: {results.finalExtendedVolume.toFixed(1)} mL</span>
            </div>
          </div>

          {/* Step-by-Step Pipetting & Packaging Protocol */}
          <div className={cn("p-5 rounded-2xl border space-y-3", isDark ? "bg-white/[0.02] border-white/10" : "bg-slate-50 border-slate-200")}>
            <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Laboratory Dilution & Filling Protocol
            </h4>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex items-start gap-2 p-2 rounded-xl bg-white/5 border border-white/5">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                <div>
                  <strong>Maintain Temperature:</strong> Pre-warm extender (<strong>{extenderName}</strong>) to 35.0°C – 37.0°C prior to mixing.
                </div>
              </div>

              <div className="flex items-start gap-2 p-2 rounded-xl bg-white/5 border border-white/5">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                <div>
                  <strong>Add Extender:</strong> Slowly pipette <strong className="text-emerald-400">{results.extenderToAdd.toFixed(1)} mL</strong> of extender into <strong className="text-indigo-300">{ejaculateVolume.toFixed(1)} mL</strong> ejaculate along tube wall (Total final: {results.finalExtendedVolume.toFixed(1)} mL).
                </div>
              </div>

              <div className="flex items-start gap-2 p-2 rounded-xl bg-white/5 border border-white/5">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0">3</span>
                <div>
                  <strong>Fill & Seal Straws:</strong> Package into exactly <strong className="text-indigo-400">{results.totalDoses} straws</strong> ({strawSize} mL each) using ultrasonic sealer or polyvinyl alcohol powder.
                </div>
              </div>

              <div className="flex items-start gap-2 p-2 rounded-xl bg-white/5 border border-white/5">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold shrink-0">4</span>
                <div>
                  <strong>Cooling & Freezing:</strong> Equilibrate at 4.0°C for 2.5–3 hours, then vapor freeze above liquid nitrogen (-140°C) before LN2 plunging (-196°C).
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
