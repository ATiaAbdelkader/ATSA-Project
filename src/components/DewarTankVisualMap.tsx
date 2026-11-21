import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Search, 
  AlertTriangle, 
  Thermometer, 
  Droplets, 
  Layers, 
  Plus, 
  CheckCircle2, 
  Download, 
  Info, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  Sparkles,
  QrCode,
  Calendar,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';
import type { AnalysisResult } from '../types';

export interface StrawItem {
  id: string; // e.g., STR-BOV-9872-01
  tankId: string;
  canisterId: number;
  caneId: number;
  gobletPosition: 'top' | 'bottom';
  slotIndex: number; // 1 to 10
  patientId: string;
  species: string;
  donorName: string;
  freezeDate: string;
  strawSize: '0.5mL' | '0.25mL';
  colorCode: string;
  concentration: number; // M/mL
  preFreezeMotility: number; // %
  postThawMotility: number; // %
  extender: string;
  status: 'verified' | 'quarantine' | 'reserved' | 'depleted';
  notes?: string;
}

export interface DewarTank {
  id: string;
  name: string;
  model: string;
  capacityLiters: number;
  currentLN2Liters: number;
  temperatureC: number;
  canisterCount: number;
  canesPerCanister: number;
  location: string;
  lastInspection: string;
  evaporationRateLPerDay: number;
}

interface DewarTankVisualMapProps {
  currentAnalysis?: AnalysisResult | null;
  onLinkSpecimen?: (straw: StrawItem) => void;
  theme?: 'light' | 'dark';
}

const INITIAL_TANKS: DewarTank[] = [
  {
    id: 'tank-a',
    name: 'Dewar Alpha (Bovine & Ovine)',
    model: 'MVE XC 47/11-10 High-Capacity Cryogenic',
    capacityLiters: 47.4,
    currentLN2Liters: 41.2,
    temperatureC: -196.2,
    canisterCount: 10,
    canesPerCanister: 5,
    location: 'Cryo Vault Room 102 - Pod A',
    lastInspection: '2026-10-24',
    evaporationRateLPerDay: 0.38
  },
  {
    id: 'tank-b',
    name: 'Dewar Beta (Equine & Canine)',
    model: 'Taylor-Wharton 35VHC Vapor/Liquid',
    capacityLiters: 35.0,
    currentLN2Liters: 27.5,
    temperatureC: -195.8,
    canisterCount: 6,
    canesPerCanister: 5,
    location: 'Cryo Vault Room 102 - Pod B',
    lastInspection: '2026-10-22',
    evaporationRateLPerDay: 0.29
  }
];

const INITIAL_STRAWS: StrawItem[] = [
  {
    id: 'STR-BOV-9872-01',
    tankId: 'tank-a',
    canisterId: 1,
    caneId: 1,
    gobletPosition: 'top',
    slotIndex: 1,
    patientId: 'BOV-9872',
    species: 'Bovine',
    donorName: 'Titan Black Angus Bull #9872',
    freezeDate: '2026-10-26',
    strawSize: '0.5mL',
    colorCode: '#10b981',
    concentration: 580.0,
    preFreezeMotility: 78.5,
    postThawMotility: 62.4,
    extender: 'BoviFree Plus (Egg-Yolk Free)',
    status: 'verified',
    notes: 'Superior pedigree. SFT Theriogenology Certified Satisfactory Potential Breeder.'
  },
  {
    id: 'STR-BOV-9872-02',
    tankId: 'tank-a',
    canisterId: 1,
    caneId: 1,
    gobletPosition: 'top',
    slotIndex: 2,
    patientId: 'BOV-9872',
    species: 'Bovine',
    donorName: 'Titan Black Angus Bull #9872',
    freezeDate: '2026-10-26',
    strawSize: '0.5mL',
    colorCode: '#10b981',
    concentration: 580.0,
    preFreezeMotility: 78.5,
    postThawMotility: 63.1,
    extender: 'BoviFree Plus (Egg-Yolk Free)',
    status: 'verified'
  },
  {
    id: 'STR-EQU-3421-01',
    tankId: 'tank-b',
    canisterId: 2,
    caneId: 3,
    gobletPosition: 'top',
    slotIndex: 1,
    patientId: 'EQU-3421',
    species: 'Equine',
    donorName: 'Silver Phantom Thoroughbred #3421',
    freezeDate: '2026-10-20',
    strawSize: '0.5mL',
    colorCode: '#06b6d4',
    concentration: 240.0,
    preFreezeMotility: 72.0,
    postThawMotility: 54.8,
    extender: 'BotuCrio (Equine Freezing)',
    status: 'verified',
    notes: 'High progressive velocity. Cryo-preservation batch complete.'
  },
  {
    id: 'STR-CAN-8812-01',
    tankId: 'tank-b',
    canisterId: 3,
    caneId: 1,
    gobletPosition: 'bottom',
    slotIndex: 5,
    patientId: 'CAN-8812',
    species: 'Canine',
    donorName: 'Rex German Shepherd #8812',
    freezeDate: '2026-10-18',
    strawSize: '0.5mL',
    colorCode: '#f59e0b',
    concentration: 320.0,
    preFreezeMotility: 81.0,
    postThawMotility: 65.0,
    extender: 'CaniPRO Chill 10',
    status: 'verified'
  },
  {
    id: 'STR-OVI-1104-01',
    tankId: 'tank-a',
    canisterId: 4,
    caneId: 2,
    gobletPosition: 'bottom',
    slotIndex: 3,
    patientId: 'OVI-1104',
    species: 'Ovine',
    donorName: 'Merino Stud Ram #1104',
    freezeDate: '2026-10-15',
    strawSize: '0.25mL',
    colorCode: '#a855f7',
    concentration: 1450.0,
    preFreezeMotility: 85.0,
    postThawMotility: 68.0,
    extender: 'Tris-Fructose-Glycerol',
    status: 'verified'
  }
];

export const DewarTankVisualMap: React.FC<DewarTankVisualMapProps> = ({
  currentAnalysis,
  onLinkSpecimen,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';
  const [tanks] = useState<DewarTank[]>(INITIAL_TANKS);
  const [selectedTankId, setSelectedTankId] = useState<string>('tank-a');
  const [selectedCanisterId, setSelectedCanisterId] = useState<number>(1);
  const [selectedCaneId, setSelectedCaneId] = useState<number>(1);
  const [selectedGoblet, setSelectedGoblet] = useState<'top' | 'bottom'>('top');
  const [straws, setStraws] = useState<StrawItem[]>(INITIAL_STRAWS);
  const [selectedStraw, setSelectedStraw] = useState<StrawItem | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [targetSlotForAdd, setTargetSlotForAdd] = useState<number | null>(null);

  const selectedTank = useMemo(() => {
    return tanks.find(t => t.id === selectedTankId) || tanks[0];
  }, [tanks, selectedTankId]);

  // Liquid nitrogen health status
  const ln2Percent = Math.round((selectedTank.currentLN2Liters / selectedTank.capacityLiters) * 100);
  const daysUntilEmpty = Math.floor(selectedTank.currentLN2Liters / selectedTank.evaporationRateLPerDay);
  const isLn2Low = ln2Percent < 30;

  // Filter straws for the current goblet view
  const currentGobletStraws = useMemo(() => {
    return straws.filter(s => 
      s.tankId === selectedTankId &&
      s.canisterId === selectedCanisterId &&
      s.caneId === selectedCaneId &&
      s.gobletPosition === selectedGoblet
    );
  }, [straws, selectedTankId, selectedCanisterId, selectedCaneId, selectedGoblet]);

  // Search filter
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return straws.filter(s => 
      s.id.toLowerCase().includes(q) ||
      s.patientId.toLowerCase().includes(q) ||
      s.donorName.toLowerCase().includes(q) ||
      s.species.toLowerCase().includes(q)
    );
  }, [straws, searchQuery]);

  const handleSelectSearchResult = (straw: StrawItem) => {
    setSelectedTankId(straw.tankId);
    setSelectedCanisterId(straw.canisterId);
    setSelectedCaneId(straw.caneId);
    setSelectedGoblet(straw.gobletPosition);
    setSelectedStraw(straw);
    setSearchQuery('');
  };

  const handleAddStrawToSlot = (slotIdx: number) => {
    setTargetSlotForAdd(slotIdx);
    setShowAddModal(true);
  };

  const handleConfirmStoreCurrentSpecimen = () => {
    if (!targetSlotForAdd) return;

    const newStraw: StrawItem = {
      id: `STR-${currentAnalysis?.patientId || 'BOV-9872'}-${String(targetSlotForAdd).padStart(2, '0')}`,
      tankId: selectedTankId,
      canisterId: selectedCanisterId,
      caneId: selectedCaneId,
      gobletPosition: selectedGoblet,
      slotIndex: targetSlotForAdd,
      patientId: currentAnalysis?.patientId || 'BOV-9872',
      species: currentAnalysis?.species || 'Bovine',
      donorName: `Specimen ${currentAnalysis?.patientId || 'BOV-9872'}`,
      freezeDate: new Date().toISOString().split('T')[0],
      strawSize: '0.5mL',
      colorCode: '#10b981',
      concentration: currentAnalysis?.summary.concentration || 580.0,
      preFreezeMotility: currentAnalysis?.summary.motility.progressive || 62.4,
      postThawMotility: Math.round((currentAnalysis?.summary.motility.progressive || 62.4) * 0.8 * 10) / 10,
      extender: 'BoviFree Plus (Egg-Yolk Free)',
      status: 'verified',
      notes: 'Stored from active CASA session.'
    };

    setStraws(prev => [...prev.filter(s => !(s.tankId === selectedTankId && s.canisterId === selectedCanisterId && s.caneId === selectedCaneId && s.gobletPosition === selectedGoblet && s.slotIndex === targetSlotForAdd)), newStraw]);
    setSelectedStraw(newStraw);
    setShowAddModal(false);
    if (onLinkSpecimen) onLinkSpecimen(newStraw);
  };

  const exportManifestCSV = () => {
    let csv = "Straw ID,Tank,Canister,Cane,Goblet,Slot,Animal ID,Species,Donor,Freeze Date,Size,Concentration (M/mL),Pre-Freeze Mot %,Post-Thaw Mot %,Status\r\n";
    straws.forEach(s => {
      csv += `${s.id},${s.tankId},${s.canisterId},${s.caneId},${s.gobletPosition},${s.slotIndex},${s.patientId},${s.species},"${s.donorName}",${s.freezeDate},${s.strawSize},${s.concentration},${s.preFreezeMotility},${s.postThawMotility},${s.status}\r\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dewar-cryo-manifest-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={cn(
      "w-full h-full flex flex-col overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-6",
      isDark ? "bg-[#08080c] text-white" : "bg-slate-50 text-slate-900"
    )}>
      {/* Top Header Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black uppercase tracking-wider">Cryogenic Dewar Tank Visual Map</h1>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                  LN2 -196°C Storage
                </span>
              </div>
              <p className={cn("text-xs mt-0.5", isDark ? "text-white/50" : "text-slate-500")}>
                Hierarchical inventory locator: Dewar Tank &rarr; Canister &rarr; Cane &rarr; Goblet &rarr; Straw ID
              </p>
            </div>
          </div>
        </div>

        {/* Global Straw Search & Manifest Export */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Straw, Animal ID or Breed..."
              className={cn(
                "w-full pl-9 pr-3 py-2 rounded-xl text-xs font-mono border focus:outline-none focus:border-cyan-500 transition-colors",
                isDark ? "bg-white/5 border-white/10 text-white placeholder:text-white/30" : "bg-white border-slate-200 text-slate-900"
              )}
            />
            {/* Quick dropdown for search results */}
            {searchResults.length > 0 && (
              <div className={cn(
                "absolute top-full left-0 right-0 mt-1 z-50 rounded-xl border shadow-2xl p-2 space-y-1 max-h-60 overflow-y-auto",
                isDark ? "bg-[#121218] border-white/20 text-white" : "bg-white border-slate-200 text-slate-900"
              )}>
                {searchResults.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectSearchResult(s)}
                    className="w-full text-left p-2 rounded-lg hover:bg-cyan-500/20 transition-colors flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold font-mono text-cyan-400">{s.id}</span>
                      <span className="text-[10px] text-white/60 ml-2">({s.species} &bull; {s.patientId})</span>
                    </div>
                    <span className="text-[10px] font-mono text-white/40">Canister {s.canisterId} / Slot {s.slotIndex}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={exportManifestCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all text-white/80 hover:text-white shrink-0 cursor-pointer"
            title="Export complete Dewar inventory manifest to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Manifest</span>
          </button>
        </div>
      </div>

      {/* Dewar Tank Status Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Tank Switcher */}
        <div className={cn(
          "p-4 rounded-2xl border flex flex-col justify-between",
          isDark ? "bg-[#0e0e14] border-white/10" : "bg-white border-slate-200"
        )}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Active Cryo Dewar</span>
          <div className="flex gap-1.5 mt-2">
            {tanks.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTankId(t.id)}
                className={cn(
                  "flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all border text-center cursor-pointer",
                  selectedTankId === t.id
                    ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-md"
                    : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10"
                )}
              >
                {t.name.split(' ')[1]}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-white/40 mt-2 truncate font-mono">{selectedTank.model}</p>
        </div>

        {/* Liquid Nitrogen Level & Days Projection */}
        <div className={cn(
          "p-4 rounded-2xl border flex flex-col justify-between",
          isDark ? "bg-[#0e0e14] border-white/10" : "bg-white border-slate-200"
        )}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">LN2 Liquid Level</span>
            <Droplets className={cn("w-4 h-4", isLn2Low ? "text-amber-400 animate-pulse" : "text-cyan-400")} />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black font-mono text-cyan-400">{ln2Percent}%</span>
            <span className="text-xs text-white/50 font-mono">({selectedTank.currentLN2Liters}L / {selectedTank.capacityLiters}L)</span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
            <div 
              className={cn("h-full rounded-full transition-all duration-500", isLn2Low ? "bg-amber-400" : "bg-gradient-to-r from-cyan-500 to-blue-500")}
              style={{ width: `${ln2Percent}%` }}
            />
          </div>
          <span className="text-[9px] text-white/40 mt-1 font-mono">Est. {daysUntilEmpty} days static holding time</span>
        </div>

        {/* Cryogenic Temperature */}
        <div className={cn(
          "p-4 rounded-2xl border flex flex-col justify-between",
          isDark ? "bg-[#0e0e14] border-white/10" : "bg-white border-slate-200"
        )}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Vault Core Temp</span>
            <Thermometer className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black font-mono text-emerald-400">{selectedTank.temperatureC}°C</span>
            <span className="text-xs text-emerald-500/80 font-bold uppercase">Optimal Sub-Zero</span>
          </div>
          <span className="text-[9px] text-white/40 mt-2 font-mono">Boiling point: -195.79°C (Liquid Phase)</span>
        </div>

        {/* Total Straws Stored */}
        <div className={cn(
          "p-4 rounded-2xl border flex flex-col justify-between",
          isDark ? "bg-[#0e0e14] border-white/10" : "bg-white border-slate-200"
        )}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Inventory Utilization</span>
            <Layers className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black font-mono text-purple-400">
              {straws.filter(s => s.tankId === selectedTankId).length}
            </span>
            <span className="text-xs text-white/50 font-mono">straws logged</span>
          </div>
          <span className="text-[9px] text-white/40 mt-2 font-mono">{selectedTank.location}</span>
        </div>
      </div>

      {/* Main Hierarchy Interactive Explorer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Canister Radial / List Selector (4 cols) */}
        <div className={cn(
          "lg:col-span-4 p-5 rounded-2xl border flex flex-col space-y-4",
          isDark ? "bg-[#0b0b10] border-white/10" : "bg-white border-slate-200"
        )}>
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider">Canister Rack</h3>
              <p className="text-[10px] text-white/40">Select canister to inspect canes</p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-white/5 text-white/60">
              {selectedTank.canisterCount} Canisters
            </span>
          </div>

          {/* Grid of Canisters */}
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: selectedTank.canisterCount }, (_, idx) => idx + 1).map((cId) => {
              const countInCanister = straws.filter(s => s.tankId === selectedTankId && s.canisterId === cId).length;
              const isSelected = selectedCanisterId === cId;
              return (
                <button
                  key={cId}
                  onClick={() => {
                    setSelectedCanisterId(cId);
                    setSelectedStraw(null);
                  }}
                  className={cn(
                    "p-3 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer relative group",
                    isSelected
                      ? "bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-lg shadow-cyan-500/10 scale-105"
                      : "bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-black font-mono mb-1",
                    isSelected ? "bg-cyan-500 text-black font-black" : "bg-white/10 text-white/80"
                  )}>
                    {cId}
                  </div>
                  <span className="text-[8px] font-bold uppercase tracking-wider">Canister</span>
                  <span className="text-[8px] font-mono text-white/40 mt-0.5">{countInCanister} straws</span>
                </button>
              );
            })}
          </div>

          {/* Cane Selection within Canister */}
          <div className="pt-3 border-t border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block mb-2">
              Canes inside Canister #{selectedCanisterId}
            </span>
            <div className="grid grid-cols-5 gap-1.5">
              {Array.from({ length: selectedTank.canesPerCanister }, (_, i) => i + 1).map((caneId) => {
                const countInCane = straws.filter(s => s.tankId === selectedTankId && s.canisterId === selectedCanisterId && s.caneId === caneId).length;
                const isSelected = selectedCaneId === caneId;
                return (
                  <button
                    key={caneId}
                    onClick={() => {
                      setSelectedCaneId(caneId);
                      setSelectedStraw(null);
                    }}
                    className={cn(
                      "py-2 px-1 rounded-lg border text-center transition-all cursor-pointer text-xs font-mono font-bold",
                      isSelected
                        ? "bg-blue-500/20 border-blue-500 text-blue-300"
                        : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10"
                    )}
                  >
                    <span>Cane {caneId}</span>
                    <div className="text-[8px] font-normal text-white/40">{countInCane} str.</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Goblet Level (Top vs Bottom) */}
          <div className="pt-3 border-t border-white/10">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block mb-2">
              Goblet Level (Cane #{selectedCaneId})
            </span>
            <div className="grid grid-cols-2 gap-2">
              {(['top', 'bottom'] as const).map(goblet => (
                <button
                  key={goblet}
                  onClick={() => {
                    setSelectedGoblet(goblet);
                    setSelectedStraw(null);
                  }}
                  className={cn(
                    "py-2.5 px-3 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-2 font-bold text-xs capitalize",
                    selectedGoblet === goblet
                      ? "bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border-teal-500/50 text-teal-300 shadow-md"
                      : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10"
                  )}
                >
                  <div className={cn("w-2 h-2 rounded-full", goblet === 'top' ? "bg-cyan-400" : "bg-purple-400")} />
                  <span>{goblet} Goblet (10 Slots)</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center & Right Column: Goblet 10-Slot Visual Straw Grid (8 cols) */}
        <div className={cn(
          "lg:col-span-8 p-5 rounded-2xl border flex flex-col space-y-4",
          isDark ? "bg-[#0b0b10] border-white/10" : "bg-white border-slate-200"
        )}>
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold uppercase tracking-wider">
                  Cane #{selectedCaneId} &bull; {selectedGoblet.toUpperCase()} Goblet
                </h3>
                <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-white/5 text-white/50">
                  Canister {selectedCanisterId} &bull; {selectedTank.name.split(' ')[1]}
                </span>
              </div>
              <p className="text-[10px] text-white/40 mt-0.5">
                Standard 0.5 mL / 0.25 mL French Straw matrix. Click a straw to inspect CASA freeze-thaw recovery metrics.
              </p>
            </div>

            {/* Quick Action to Store Active Specimen */}
            {currentAnalysis && (
              <button
                onClick={() => handleAddStrawToSlot(currentGobletStraws.length < 10 ? currentGobletStraws.length + 1 : 1)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Store Current Specimen ({currentAnalysis.patientId})</span>
              </button>
            )}
          </div>

          {/* 10 Straw Slots Visual Layout */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((slotIdx) => {
              const strawInSlot = currentGobletStraws.find(s => s.slotIndex === slotIdx);
              const isSelected = selectedStraw?.id === strawInSlot?.id && !!strawInSlot;

              if (strawInSlot) {
                return (
                  <div
                    key={slotIdx}
                    onClick={() => setSelectedStraw(strawInSlot)}
                    className={cn(
                      "p-3 rounded-xl border flex flex-col justify-between transition-all cursor-pointer min-h-[120px] relative group",
                      isSelected
                        ? "bg-gradient-to-b from-cyan-500/25 to-blue-500/10 border-cyan-400 shadow-xl shadow-cyan-500/20 ring-1 ring-cyan-400"
                        : "bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10"
                    )}
                  >
                    {/* Top Row: Slot Number & Status Dot */}
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-bold text-white/40">#{slotIdx}</span>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: strawInSlot.colorCode }} />
                        <span className="text-[8px] font-bold uppercase text-white/50">{strawInSlot.strawSize}</span>
                      </div>
                    </div>

                    {/* Middle: Donor & Animal ID */}
                    <div className="my-2">
                      <div className="text-xs font-black font-mono text-cyan-300 truncate">
                        {strawInSlot.patientId}
                      </div>
                      <div className="text-[10px] text-white/70 truncate font-semibold">
                        {strawInSlot.donorName}
                      </div>
                      <div className="text-[9px] text-white/40">
                        {strawInSlot.species}
                      </div>
                    </div>

                    {/* Bottom: Post-Thaw Recovery Metric */}
                    <div className="pt-1.5 border-t border-white/5 flex items-center justify-between text-[9px] font-mono">
                      <span className="text-white/40">Post-Thaw:</span>
                      <span className="font-bold text-emerald-400">{strawInSlot.postThawMotility}%</span>
                    </div>
                  </div>
                );
              }

              // Empty Slot
              return (
                <div
                  key={slotIdx}
                  onClick={() => handleAddStrawToSlot(slotIdx)}
                  className="p-3 rounded-xl border border-dashed border-white/10 hover:border-cyan-500/40 hover:bg-white/5 flex flex-col items-center justify-center min-h-[120px] transition-all cursor-pointer text-white/30 hover:text-cyan-400 group"
                  title="Empty slot: Click to store straw here"
                >
                  <span className="text-[9px] font-mono text-white/30 block mb-1">Slot #{slotIdx}</span>
                  <Plus className="w-5 h-5 group-hover:scale-110 transition-transform mb-1" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Empty Slot</span>
                </div>
              );
            })}
          </div>

          {/* Selected Straw Clinical Detail View */}
          {selectedStraw && (
            <div className="mt-4 p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/20 backdrop-blur-md animate-in fade-in duration-300 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-cyan-200">
                    Straw Specification & Bull/Stallion Pedigree
                  </span>
                </div>
                <button onClick={() => setSelectedStraw(null)} className="text-white/40 hover:text-white cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[9px] uppercase font-bold text-white/40 block">Straw Identifier</span>
                  <span className="font-mono font-bold text-cyan-300">{selectedStraw.id}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-white/40 block">Donor Animal</span>
                  <span className="font-semibold text-white">{selectedStraw.donorName}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-white/40 block">Cryo Extender</span>
                  <span className="text-white/80">{selectedStraw.extender}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-white/40 block">Freeze Date</span>
                  <span className="font-mono text-white/80">{selectedStraw.freezeDate}</span>
                </div>
              </div>

              {/* Recovery Comparison Grid */}
              <div className="p-3 rounded-lg bg-black/40 border border-white/5 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-[9px] text-white/40 block uppercase">Concentration</span>
                  <span className="font-mono font-bold text-white">{selectedStraw.concentration} M/mL</span>
                </div>
                <div>
                  <span className="text-[9px] text-white/40 block uppercase">Pre-Freeze Motility</span>
                  <span className="font-mono font-bold text-blue-400">{selectedStraw.preFreezeMotility}%</span>
                </div>
                <div>
                  <span className="text-[9px] text-white/40 block uppercase">Post-Thaw Motility</span>
                  <span className="font-mono font-bold text-emerald-400">{selectedStraw.postThawMotility}%</span>
                </div>
              </div>

              {selectedStraw.notes && (
                <p className="text-[10px] text-white/60 italic border-l-2 border-cyan-400 pl-2">
                  {selectedStraw.notes}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Store Specimen into Selected Slot */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#0f0f15] border border-cyan-500/30 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider">Deposit Straw in Dewar</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-white/40 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-white/70">
              Confirm storage of the active specimen into:
            </p>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs font-mono space-y-1">
              <div><span className="text-white/40">Tank:</span> {selectedTank.name}</div>
              <div><span className="text-white/40">Canister:</span> #{selectedCanisterId} &bull; <span className="text-white/40">Cane:</span> #{selectedCaneId}</div>
              <div><span className="text-white/40">Goblet:</span> {selectedGoblet.toUpperCase()} &bull; <span className="text-white/40">Slot:</span> #{targetSlotForAdd}</div>
              <div><span className="text-white/40">Specimen:</span> {currentAnalysis?.patientId || 'BOV-9872'} ({currentAnalysis?.species || 'Bovine'})</div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white bg-white/5 hover:bg-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStoreCurrentSpecimen}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-cyan-500 hover:bg-cyan-600 shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                Confirm &amp; Log Straw
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
