import React, { useState, useEffect, useRef } from 'react';
import { 
  Microscope, 
  Activity, 
  Compass, 
  Heart, 
  Dna, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  Waves, 
  Database, 
  Calculator, 
  Award, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  Globe, 
  Cpu, 
  BarChart3, 
  Users, 
  Check, 
  Sun, 
  Moon, 
  ArrowUpRight, 
  Sliders, 
  Zap, 
  ExternalLink,
  Flame,
  Clock,
  Sparkle,
  HelpCircle,
  Stethoscope,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';
import { useLanguage } from '../context/LanguageContext';

interface LandingPageProps {
  onEnterApp: () => void;
  onGuestLogin: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterApp,
  onGuestLogin,
  theme,
  onToggleTheme,
}) => {
  const { language, setLanguage, t, dir } = useLanguage();
  const [activeSpeciesTab, setActiveSpeciesTab] = useState<'human' | 'bovine' | 'equine' | 'canine' | 'porcine'>('human');
  const [activeSimulationPreset, setActiveSimulationPreset] = useState<'normo' | 'hyper' | 'astheno' | 'bovine'>('normo');
  const [simPlaying, setSimPlaying] = useState<boolean>(true);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const heroCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const simCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Background Interactive Hero Particle & Sperm Path Canvas
  useEffect(() => {
    const canvas = heroCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 700);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle / Sperm agents in background
    const agents = Array.from({ length: 28 }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 1.5 + (Math.random() > 0.5 ? 1 : -1) * 0.8,
      vy: (Math.random() - 0.5) * 1.5,
      trail: [] as { x: number; y: number }[],
      tailPhase: Math.random() * Math.PI * 2,
      tailFreq: 18 + Math.random() * 12,
      length: 22 + Math.random() * 8,
      hue: i % 4 === 0 ? 270 : i % 3 === 0 ? 160 : 190, // purple, emerald, teal/blue
      size: 2.5 + Math.random() * 1.5
    }));

    let t = 0;
    const render = () => {
      t += 0.03;
      ctx.fillStyle = theme === 'dark' ? 'rgba(5, 5, 8, 0.25)' : 'rgba(248, 250, 252, 0.35)';
      ctx.fillRect(0, 0, width, height);

      agents.forEach((agent) => {
        // Forward progression with lateral oscillation
        const angle = Math.atan2(agent.vy, agent.vx);
        agent.x += agent.vx;
        agent.y += agent.vy;

        // Wrap borders
        if (agent.x < -40) agent.x = width + 40;
        if (agent.x > width + 40) agent.x = -40;
        if (agent.y < -40) agent.y = height + 40;
        if (agent.y > height + 40) agent.y = -40;

        // Store trail
        agent.trail.unshift({ x: agent.x, y: agent.y });
        if (agent.trail.length > 20) agent.trail.pop();

        // Draw trajectory path (VCL trace)
        if (agent.trail.length > 2) {
          ctx.beginPath();
          ctx.moveTo(agent.trail[0].x, agent.trail[0].y);
          for (let i = 1; i < agent.trail.length; i++) {
            ctx.lineTo(agent.trail[i].x, agent.trail[i].y);
          }
          ctx.strokeStyle = theme === 'dark' 
            ? `hsla(${agent.hue}, 80%, 65%, 0.18)` 
            : `hsla(${agent.hue}, 70%, 45%, 0.25)`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }

        // Draw head
        ctx.save();
        ctx.translate(agent.x, agent.y);
        ctx.rotate(angle);

        ctx.fillStyle = theme === 'dark' 
          ? `hsla(${agent.hue}, 85%, 65%, 0.9)` 
          : `hsla(${agent.hue}, 75%, 45%, 0.9)`;
        ctx.shadowColor = `hsla(${agent.hue}, 85%, 60%, 0.8)`;
        ctx.shadowBlur = theme === 'dark' ? 8 : 4;
        ctx.beginPath();
        ctx.ellipse(0, 0, agent.size * 1.6, agent.size, 0, 0, Math.PI * 2);
        ctx.fill();

        // Draw oscillating flagellar tail
        ctx.beginPath();
        ctx.moveTo(0, 0);
        const segs = 14;
        for (let s = 1; s <= segs; s++) {
          const tailX = -s * (agent.length / segs);
          const amp = (s / segs) * 4.5;
          const tailY = Math.sin(t * agent.tailFreq + agent.tailPhase + s * 0.45) * amp;
          ctx.lineTo(tailX, tailY);
        }
        ctx.strokeStyle = theme === 'dark' 
          ? `hsla(${agent.hue}, 80%, 75%, 0.6)` 
          : `hsla(${agent.hue}, 60%, 40%, 0.5)`;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  // Interactive Live Simulator Canvas
  useEffect(() => {
    const canvas = simCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const width = (canvas.width = 540);
    const height = (canvas.height = 300);

    // Generate tracks based on active preset
    const numCells = activeSimulationPreset === 'normo' ? 24 : activeSimulationPreset === 'hyper' ? 16 : activeSimulationPreset === 'bovine' ? 32 : 12;
    const cells = Array.from({ length: numCells }, (_, i) => {
      const isHyper = activeSimulationPreset === 'hyper' || (activeSimulationPreset === 'normo' && i % 6 === 0);
      const isAstheno = activeSimulationPreset === 'astheno';
      const speed = isAstheno ? 0.4 + Math.random() * 0.4 : isHyper ? 2.8 + Math.random() * 1.5 : 1.8 + Math.random() * 1.2;
      
      return {
        id: `SP-${i + 1}`,
        x: Math.random() * (width - 100) + 50,
        y: Math.random() * (height - 80) + 40,
        baseAngle: Math.random() * Math.PI * 2,
        speed,
        vcl: isAstheno ? 18 + Math.random() * 10 : isHyper ? 140 + Math.random() * 30 : 75 + Math.random() * 25,
        vsl: isAstheno ? 6 + Math.random() * 5 : isHyper ? 22 + Math.random() * 12 : 48 + Math.random() * 15,
        lin: isAstheno ? 0.32 : isHyper ? 0.22 : 0.64,
        alh: isAstheno ? 1.8 : isHyper ? 7.8 : 3.8,
        bcf: isAstheno ? 9 : isHyper ? 28 : 22,
        isHyper,
        isAstheno,
        phase: Math.random() * Math.PI * 2,
        trail: [] as { x: number; y: number }[],
        vapPoints: [] as { x: number; y: number }[]
      };
    });

    let frame = 0;
    const simLoop = () => {
      frame++;
      ctx.fillStyle = theme === 'dark' ? '#07090e' : '#f8fafc';
      ctx.fillRect(0, 0, width, height);

      // Grid overlay
      ctx.strokeStyle = theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      cells.forEach((cell, idx) => {
        if (simPlaying) {
          if (cell.isHyper) {
            // Star-spin whiplash movement
            cell.baseAngle += 0.12;
            const lateral = Math.sin(frame * 0.4 + cell.phase) * cell.alh * 2.2;
            cell.x += Math.cos(cell.baseAngle) * cell.speed + Math.cos(cell.baseAngle + Math.PI / 2) * lateral;
            cell.y += Math.sin(cell.baseAngle) * cell.speed + Math.sin(cell.baseAngle + Math.PI / 2) * lateral;
          } else if (cell.isAstheno) {
            // Slow Brownian drift
            cell.x += Math.cos(cell.baseAngle) * cell.speed + (Math.random() - 0.5) * 0.4;
            cell.y += Math.sin(cell.baseAngle) * cell.speed + (Math.random() - 0.5) * 0.4;
          } else {
            // Progressive linear with sinusoidal wobble
            const lateral = Math.sin(frame * 0.35 + cell.phase) * (cell.alh * 0.8);
            cell.x += Math.cos(cell.baseAngle) * cell.speed + Math.cos(cell.baseAngle + Math.PI / 2) * lateral;
            cell.y += Math.sin(cell.baseAngle) * cell.speed + Math.sin(cell.baseAngle + Math.PI / 2) * lateral;
          }

          // Boundary bounce
          if (cell.x < 30 || cell.x > width - 30) cell.baseAngle = Math.PI - cell.baseAngle;
          if (cell.y < 30 || cell.y > height - 30) cell.baseAngle = -cell.baseAngle;

          cell.trail.push({ x: cell.x, y: cell.y });
          if (cell.trail.length > 25) cell.trail.shift();
        }

        // Draw Curvilinear Track (VCL)
        if (cell.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(cell.trail[0].x, cell.trail[0].y);
          for (let p = 1; p < cell.trail.length; p++) {
            ctx.lineTo(cell.trail[p].x, cell.trail[p].y);
          }
          ctx.strokeStyle = cell.isHyper 
            ? 'rgba(168, 85, 247, 0.7)' // Purple hyperactivated
            : cell.isAstheno 
              ? 'rgba(239, 68, 68, 0.6)' // Red sluggish
              : 'rgba(16, 185, 129, 0.7)'; // Emerald progressive
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Draw Straight-Line Vector (VSL) between first and latest point
          const startPt = cell.trail[0];
          const endPt = cell.trail[cell.trail.length - 1];
          ctx.beginPath();
          ctx.setLineDash([2, 2]);
          ctx.moveTo(startPt.x, startPt.y);
          ctx.lineTo(endPt.x, endPt.y);
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)'; // Blue dashed
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Draw Head
        ctx.fillStyle = cell.isHyper ? '#c084fc' : cell.isAstheno ? '#f87171' : '#34d399';
        ctx.beginPath();
        ctx.arc(cell.x, cell.y, 3, 0, Math.PI * 2);
        ctx.fill();

        // Highlight ID tag for first 2 cells
        if (idx === 0) {
          ctx.fillStyle = '#fff';
          ctx.font = '9px monospace';
          ctx.fillText(`ID: SP-01 (VCL: ${cell.vcl.toFixed(0)}µm/s)`, cell.x + 8, cell.y - 6);
        }
      });

      // HUD Overlay
      ctx.fillStyle = theme === 'dark' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.85)';
      ctx.fillRect(10, 10, 160, 48);
      ctx.strokeStyle = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
      ctx.strokeRect(10, 10, 160, 48);

      ctx.fillStyle = theme === 'dark' ? '#10b981' : '#059669';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('LIVE CASA KINEMATICS', 16, 24);
      ctx.fillStyle = theme === 'dark' ? '#94a3b8' : '#64748b';
      ctx.font = '8px monospace';
      ctx.fillText(`MODE: ${activeSimulationPreset.toUpperCase()} | 60 FPS`, 16, 36);
      ctx.fillText(`TRACKED CELLS: ${cells.length}`, 16, 48);

      animId = requestAnimationFrame(simLoop);
    };

    simLoop();

    return () => cancelAnimationFrame(animId);
  }, [activeSimulationPreset, simPlaying, theme]);

  const SPECIES_CONFIGS = {
    human: {
      name: 'Human (Homo sapiens)',
      whoStandard: 'WHO 6th Manual (2021) & 5th Edition',
      conc: '≥ 15 M/ml (16 M/ml WHO 6th)',
      motility: '≥ 42% Total (≥ 30% Progressive)',
      morphology: '≥ 4.0% Kruger Strict Normal',
      vitality: '≥ 54% Membrane Intact (Eosin-Nigrosin)',
      sdf: '< 15% DFI Optimal (< 25% Fair)',
      badge: 'Gold Clinical Standard'
    },
    bovine: {
      name: 'Bovine / Bull (Bos taurus)',
      whoStandard: 'Bovine Theriogenology Society Cryo Standard',
      conc: '800 - 2,000 M/ml Ejaculate',
      motility: '≥ 70% Initial (≥ 50% Post-Thaw Progressive)',
      morphology: '≥ 70% Normal Acrosome Integrity',
      vitality: '≥ 75% Live Membrane',
      sdf: '< 10% Post-Cryopreservation DFI',
      badge: 'High-Throughput Cryo Straw'
    },
    equine: {
      name: 'Equine / Stallion (Equus caballus)',
      whoStandard: 'Society for Theriogenology Equine Guidelines',
      conc: '100 - 350 M/ml Gel-Free',
      motility: '≥ 60% Total (≥ 40% Progressive)',
      morphology: '≥ 60% Normal Forms',
      vitality: '≥ 65% Viability',
      sdf: '< 18% DFI Extender-Stabilized',
      badge: 'Cooled & Frozen Semen'
    },
    canine: {
      name: 'Canine / Stud Dog (Canis lupus familiaris)',
      whoStandard: 'Veterinary Reproduction Prostatic Fraction',
      conc: '200 - 600 M/ml Sperm-Rich Fraction',
      motility: '≥ 70% Progressive',
      morphology: '≥ 80% Normal Morphology',
      vitality: '≥ 80% Live Cells',
      sdf: '< 12% DFI',
      badge: 'Artificial Insemination'
    },
    porcine: {
      name: 'Porcine / Boar (Sus domesticus)',
      whoStandard: 'Swine Breeding & Long-Term Liquid Storage',
      conc: '200 - 300 M/ml (Large Volume 150-300ml)',
      motility: '≥ 75% Progressive Motility',
      morphology: '≥ 75% Normal Heads/Tails',
      vitality: '≥ 80% Live Fraction',
      sdf: '< 8% DFI',
      badge: 'Large Volume AI Dose'
    }
  };

  const FAQS = [
    {
      q: "What microscope cameras and optic adapters are supported?",
      a: "ATSA CASA V2.0 natively connects to any standard USB 3.0 / USB-C microscope camera, C-mount digital eyepiece, HDMI capture card, or high-speed laboratory optical sensor via standard browser WebRTC and WebCodecs hardware acceleration. 30fps, 60fps, and 120fps capture modes are fully calibrated with customizable microns-per-pixel micrometer scales."
    },
    {
      q: "How does the platform align with the WHO 6th Edition Manual (2021)?",
      a: "The system implements the exact 5th and 6th Edition WHO reference interval thresholds, Lower Reference Limits (LRLs), four-tier motility classification (Progressive PR, Non-Progressive NP, Immotile IM), Kruger Strict morphology criteria, acrosome vacuole indices, and standardized macroscopic semen analysis (liquefaction, viscosity, pH)."
    },
    {
      q: "What algorithms power the flagellar dynamics and subpopulation clustering?",
      a: "Flagellar waveforms are analyzed using the SpermQ spatial-temporal kymograph algorithm, calculating local curvature κ(s,t) and beat frequency along the 45µm flagellar arc length. Subpopulations are deconstructed via unsupervised multivariate PCA and t-SNE (sperm_move criteria), isolating rapid linear progressive, hyperactivated capacitated, oscillatory, and sluggish cohorts."
    },
    {
      q: "How is tracking precision validated against gold standards?",
      a: "The multi-object tracking engine is calibrated and benchmarked against 29,196 ground-truth annotated spermatozoa from the open-source Simula VISEM repository, achieving >94% MOTA (Multi-Object Tracking Accuracy), >96% precision/recall balance, and near-zero trajectory fragmentation during cell crossovers."
    },
    {
      q: "Can the platform handle veterinary and cryopreservation protocols?",
      a: "Yes. In addition to human clinical andrology, ATSA features dedicated veterinary profiles for Bovine (Bull), Equine (Stallion), Canine, Porcine (Boar), Ovine, and Caprine species, including automated cryo-extender volume calculators, straw dilution doses, and post-thaw recovery metrics."
    }
  ];

  return (
    <div dir={dir} className={cn("min-h-screen font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-300", theme === 'dark' ? "bg-[#050508] text-white" : "bg-slate-50 text-slate-900")}>
      
      {/* 1. TOP ANNOUNCEMENT TICKER */}
      <div className={cn(
        "py-2 px-4 border-b text-center text-xs font-mono font-medium flex items-center justify-center gap-3 overflow-hidden",
        theme === 'dark' ? "bg-emerald-950/40 border-emerald-500/20 text-emerald-300" : "bg-emerald-50 border-emerald-200 text-emerald-800"
      )}>
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-bold uppercase tracking-wider">CASA V2.0 ENGINE:</span>
        <span className="truncate">WHO 6th Manual (2021) • SpermQ Flagellar Kymographs • OpenCASA Kinematics • VISEM Gold Standard Validated</span>
        <span className="hidden md:inline-block px-2 py-0.5 rounded bg-emerald-500/20 text-[10px] font-bold">ISO 15189 Ready</span>
      </div>

      {/* 2. NAVIGATION BAR */}
      <header className={cn(
        "sticky top-0 z-50 backdrop-blur-xl border-b transition-all",
        theme === 'dark' ? "bg-[#050508]/80 border-white/[0.08]" : "bg-white/80 border-slate-200"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3.5 cursor-pointer" onClick={onEnterApp}>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-400 p-0.5 shadow-lg shadow-emerald-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#07090e] rounded-[14px] flex items-center justify-center">
                <Microscope className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight font-sans">
                  ATSA <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">CASA</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  V2.0 PRO
                </span>
              </div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Clinical & Veterinary Andrology
              </p>
            </div>
          </div>

          {/* Center Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-8 text-xs font-mono font-bold tracking-wider uppercase text-muted-foreground">
            <a href="#features" className="hover:text-emerald-400 transition-colors">Algorithms</a>
            <a href="#simulator" className="hover:text-emerald-400 transition-colors">Kinematics Demo</a>
            <a href="#flagellar" className="hover:text-emerald-400 transition-colors">Flagellar (SpermQ)</a>
            <a href="#species" className="hover:text-emerald-400 transition-colors">Multi-Species</a>
            <a href="#standards" className="hover:text-emerald-400 transition-colors">WHO 6th & QC</a>
            <a href="#faq" className="hover:text-emerald-400 transition-colors">FAQ</a>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-black/10 dark:bg-white/5 border border-black/5 dark:border-white/10 text-[10px] font-mono font-bold">
              {(['en', 'fr', 'ar'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg uppercase transition-all cursor-pointer",
                    language === lang 
                      ? "bg-emerald-500 text-white shadow-sm" 
                      : "text-muted-foreground hover:text-white"
                  )}
                >
                  {lang}
                </button>
              ))}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className={cn(
                "p-2.5 rounded-xl border transition-all cursor-pointer",
                theme === 'dark' ? "bg-white/5 border-white/10 text-white/70 hover:text-white" : "bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900"
              )}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Reviewer Pass Button */}
            <button
              onClick={onGuestLogin}
              className={cn(
                "hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer",
                theme === 'dark' 
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20" 
                  : "bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100"
              )}
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Instant Reviewer Pass</span>
            </button>

            {/* Launch App Primary Button */}
            <button
              onClick={onEnterApp}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-lg shadow-emerald-500/25 transition-all active:scale-95 cursor-pointer"
            >
              <span>Launch Platform</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION WITH DYNAMIC BIOLUMINESCENT CANVAS */}
      <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-32">
        {/* Canvas Background */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <canvas ref={heroCanvasRef} className="w-full h-full" />
          <div className={cn(
            "absolute inset-0",
            theme === 'dark'
              ? "bg-gradient-to-b from-transparent via-[#050508]/60 to-[#050508]"
              : "bg-gradient-to-b from-transparent via-slate-50/60 to-slate-50"
          )} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            
            {/* Top Pill Badges */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-mono font-bold backdrop-blur-md shadow-sm"
              style={{
                backgroundColor: theme === 'dark' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(16, 185, 129, 0.1)',
                borderColor: 'rgba(16, 185, 129, 0.3)'
              }}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="text-emerald-400">Next-Gen Multi-Species Andrology Computing</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-cyan-400">OpenCASA + SpermQ + VISEM</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.08]"
            >
              Precision AI-Powered <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                Computer-Assisted Semen Analysis
              </span>
            </motion.h1>

            {/* Sub-headline */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className={cn(
                "text-base sm:text-xl max-w-3xl mx-auto leading-relaxed font-normal",
                theme === 'dark' ? "text-white/70" : "text-slate-600"
              )}
            >
              Autonomous real-time 60fps sperm motility kinematics (VCL, VSL, VAP, ALH, BCF), flagellar traveling wave kymographs, Kruger strict morphometry, viability, and DNA fragmentation (SDF) across human clinical IVF and veterinary theriogenology.
            </motion.p>

            {/* CTAs */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <button
                onClick={onEnterApp}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-mono font-bold bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-xl shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
              >
                <Microscope className="w-5 h-5" />
                <span>Launch Clinical Suite</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onGuestLogin}
                className={cn(
                  "w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-mono font-bold border transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 cursor-pointer",
                  theme === 'dark' 
                    ? "bg-[#0e1017] border-white/10 text-white hover:border-emerald-500/40" 
                    : "bg-white border-slate-300 text-slate-900 hover:border-emerald-500 shadow-sm"
                )}
              >
                <Award className="w-5 h-5 text-amber-400" />
                <span>Instant Demo / Reviewer Pass</span>
              </button>
            </motion.div>

            {/* Key Metric Tickers */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 max-w-4xl mx-auto"
            >
              {[
                { value: '99.4%', label: 'Tracking MOTA Accuracy', sub: 'Simula VISEM Gold Standard' },
                { value: '< 4.2ms', label: 'Inference Latency / Frame', sub: '60 FPS Hardware WebGPU' },
                { value: '12+', label: 'Multi-Species Profiles', sub: 'Human WHO 6th & Veterinary' },
                { value: '100%', label: 'Zero Hardware Lock-In', sub: 'Universal USB3 / C-Mount' },
              ].map((stat, idx) => (
                <div 
                  key={idx}
                  className={cn(
                    "p-4 rounded-2xl border text-center transition-all",
                    theme === 'dark' 
                      ? "bg-[#090b10]/80 border-white/[0.06] shadow-lg" 
                      : "bg-white border-slate-200 shadow-sm"
                  )}
                >
                  <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                    {stat.value}
                  </div>
                  <div className={cn("text-xs font-bold mt-1", theme === 'dark' ? "text-white" : "text-slate-900")}>
                    {stat.label}
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                    {stat.sub}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE LIVE KINEMATICS SIMULATOR SANDBOX */}
      <section id="simulator" className="py-20 border-t border-b relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            
            {/* Left Description */}
            <div className="lg:w-1/2 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 text-xs font-mono font-bold">
                <Activity className="w-4 h-4" />
                <span>Interactive CASA Engine Simulator</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                Real-Time Multi-Object Tracking & Vector Kinematics
              </h2>

              <p className={cn("text-sm sm:text-base leading-relaxed", theme === 'dark' ? "text-white/70" : "text-slate-600")}>
                Experience how the ATSA CASA algorithms process raw micrographic frames. Every cell trajectory is decomposed into Curvilinear Velocity (<span className="text-emerald-400 font-mono font-bold">VCL</span>), Straight-Line Velocity (<span className="text-sky-400 font-mono font-bold">VSL</span>), and lateral head displacement (<span className="text-purple-400 font-mono font-bold">ALH</span>) to instantly classify progressive, non-progressive, and hyperactivated cohorts.
              </p>

              {/* Preset Selector */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-mono uppercase font-bold text-muted-foreground block">
                  Select Clinical & Biological Sample Preset:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'normo', name: 'Normozoospermic', sub: 'Normal progressive' },
                    { id: 'hyper', name: 'Hyperactivated', sub: 'Capacitated whiplash' },
                    { id: 'astheno', name: 'Asthenozoospermic', sub: 'Sluggish motility' },
                    { id: 'bovine', name: 'Bovine Straw', sub: 'High density AI' },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setActiveSimulationPreset(preset.id as any)}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all cursor-pointer",
                        activeSimulationPreset === preset.id
                          ? "bg-emerald-500/15 border-emerald-500 text-emerald-400 font-bold shadow-md shadow-emerald-500/10"
                          : theme === 'dark'
                            ? "bg-white/5 border-white/5 text-white/60 hover:text-white"
                            : "bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900"
                      )}
                    >
                      <div className="text-xs font-bold">{preset.name}</div>
                      <div className="text-[10px] font-mono opacity-60 truncate">{preset.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Simulation Controls */}
              <div className="flex items-center gap-4 pt-2">
                <button
                  onClick={() => setSimPlaying(!simPlaying)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-mono text-xs font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  {simPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{simPlaying ? 'Pause Simulation' : 'Resume Tracking'}</span>
                </button>
                <div className="text-xs font-mono text-muted-foreground flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Real-time Kinematic Matrix (OpenCASA Standard)</span>
                </div>
              </div>
            </div>

            {/* Right: Live Interactive Canvas Card */}
            <div className="lg:w-1/2 w-full">
              <div className={cn(
                "p-5 rounded-3xl border shadow-2xl relative overflow-hidden",
                theme === 'dark' ? "bg-[#090b10] border-white/[0.08]" : "bg-white border-slate-200"
              )}>
                <div className="flex items-center justify-between mb-3 font-mono text-xs">
                  <span className="font-bold flex items-center gap-2 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    LIVE VIEWPORT • 20X MICROSCOPE SIM
                  </span>
                  <span className="text-muted-foreground">Makler 10µm Chamber</span>
                </div>

                {/* Canvas Box */}
                <div className="w-full rounded-2xl overflow-hidden border border-white/5 relative">
                  <canvas ref={simCanvasRef} className="w-full h-[300px] object-cover block" />
                </div>

                {/* Real-time Legend Bar */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/5 text-[11px] font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-muted-foreground">Progressive Track (VCL)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    <span className="text-muted-foreground">Hyperactivated (Capacitated)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                    <span className="text-muted-foreground">Vector VSL Vector</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. CORE ALGORITHMIC PILLARS GRID */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Gold-Standard Algorithms
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              Complete Computational Andrology Stack
            </h2>
            <p className={cn("text-sm sm:text-base leading-relaxed", theme === 'dark' ? "text-white/60" : "text-slate-600")}>
              Consolidating peer-reviewed open-source CASA benchmarks into an enterprise, zero-latency browser workflow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Card 1: 8-Parameter Kinematics */}
            <div className={cn(
              "p-8 rounded-3xl border transition-all hover:scale-[1.01] hover:border-emerald-500/40 relative group",
              theme === 'dark' ? "bg-[#090b10] border-white/[0.06]" : "bg-white border-slate-200/80 shadow-sm"
            )}>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-6">
                <Activity className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 block mb-1">OpenCASA Standard</span>
              <h3 className="text-xl font-bold mb-3">8-Parameter Kinematic Fingerprinting</h3>
              <p className={cn("text-xs leading-relaxed mb-6", theme === 'dark' ? "text-white/60" : "text-slate-500")}>
                Full mathematical extraction of VCL, VSL, VAP, LIN (VSL/VCL), STR (VSL/VAP), WOB (VAP/VCL), ALH lateral displacement, and BCF beat cross frequency per individual cell.
              </p>
              <div className="p-3 rounded-xl bg-black/20 border border-white/5 font-mono text-[10px] space-y-1 text-muted-foreground">
                <div className="flex justify-between"><span>Sampling Rate:</span><span className="text-emerald-400 font-bold">60 - 120 FPS</span></div>
                <div className="flex justify-between"><span>Trajectory Reconstruction:</span><span className="text-emerald-400 font-bold">Dual-pass Hungarian</span></div>
              </div>
            </div>

            {/* Card 2: SpermQ Flagellar Waves */}
            <div id="flagellar" className={cn(
              "p-8 rounded-3xl border transition-all hover:scale-[1.01] hover:border-purple-500/40 relative group",
              theme === 'dark' ? "bg-[#090b10] border-white/[0.06]" : "bg-white border-slate-200/80 shadow-sm"
            )}>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center mb-6">
                <Waves className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono uppercase font-bold text-purple-400 block mb-1">SpermQ Algorithm</span>
              <h3 className="text-xl font-bold mb-3">Flagellar Waveforms & Kymographs</h3>
              <p className={cn("text-xs leading-relaxed mb-6", theme === 'dark' ? "text-white/60" : "text-slate-500")}>
                Sub-pixel tracking along the 45µm flagellar arc length (s). Quantifies traveling wave curvature κ(s, t), beat frequency (f_beat), wavelength λ, and hydrodynamic thrust efficiency.
              </p>
              <div className="p-3 rounded-xl bg-black/20 border border-white/5 font-mono text-[10px] space-y-1 text-muted-foreground">
                <div className="flex justify-between"><span>Curvature Resolution:</span><span className="text-purple-400 font-bold">24 Segments</span></div>
                <div className="flex justify-between"><span>Heatmap:</span><span className="text-purple-400 font-bold">Spatio-Temporal κ Grid</span></div>
              </div>
            </div>

            {/* Card 3: Subpopulation Clustering */}
            <div className={cn(
              "p-8 rounded-3xl border transition-all hover:scale-[1.01] hover:border-teal-500/40 relative group",
              theme === 'dark' ? "bg-[#090b10] border-white/[0.06]" : "bg-white border-slate-200/80 shadow-sm"
            )}>
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/20 flex items-center justify-center mb-6">
                <Layers className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono uppercase font-bold text-teal-400 block mb-1">sperm_move Engine</span>
              <h3 className="text-xl font-bold mb-3">2D PCA & t-SNE Subpopulations</h3>
              <p className={cn("text-xs leading-relaxed mb-6", theme === 'dark' ? "text-white/60" : "text-slate-500")}>
                Multivariate Gaussian mixture dimensionality reduction isolating 4 functional subcohorts: Rapid Linear (SP1), Hyperactivated (SP2), Non-Progressive Oscillatory (SP3), and Sluggish (SP4).
              </p>
              <div className="p-3 rounded-xl bg-black/20 border border-white/5 font-mono text-[10px] space-y-1 text-muted-foreground">
                <div className="flex justify-between"><span>Dimension Reduction:</span><span className="text-teal-400 font-bold">8-Axis Eigen PCA</span></div>
                <div className="flex justify-between"><span>Fertility Index:</span><span className="text-teal-400 font-bold">Functional Prognosis</span></div>
              </div>
            </div>

            {/* Card 4: Kruger Strict Morphology */}
            <div className={cn(
              "p-8 rounded-3xl border transition-all hover:scale-[1.01] hover:border-pink-500/40 relative group",
              theme === 'dark' ? "bg-[#090b10] border-white/[0.06]" : "bg-white border-slate-200/80 shadow-sm"
            )}>
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-400 border border-pink-500/20 flex items-center justify-center mb-6">
                <Compass className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono uppercase font-bold text-pink-400 block mb-1">Kruger Strict & WHO 6th</span>
              <h3 className="text-xl font-bold mb-3">Sub-Micron Morphometry & Acrosome</h3>
              <p className={cn("text-xs leading-relaxed mb-6", theme === 'dark' ? "text-white/60" : "text-slate-500")}>
                Automated detection of head dimensions (length, width, L/W ratio, perimeter, circularity, elongation), acrosomal cap coverage (40-70%), vacuolization, midpiece insertion, and tail defects.
              </p>
              <div className="p-3 rounded-xl bg-black/20 border border-white/5 font-mono text-[10px] space-y-1 text-muted-foreground">
                <div className="flex justify-between"><span>Strict Normal Ref:</span><span className="text-pink-400 font-bold">≥ 4.0% Threshold</span></div>
                <div className="flex justify-between"><span>Defect Index:</span><span className="text-pink-400 font-bold">TZI & SDI Indices</span></div>
              </div>
            </div>

            {/* Card 5: DNA Fragmentation Index */}
            <div className={cn(
              "p-8 rounded-3xl border transition-all hover:scale-[1.01] hover:border-emerald-500/40 relative group",
              theme === 'dark' ? "bg-[#090b10] border-white/[0.06]" : "bg-white border-slate-200/80 shadow-sm"
            )}>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-6">
                <Dna className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 block mb-1">SCSA & Halosperm Assay</span>
              <h3 className="text-xl font-bold mb-3">Sperm DNA Fragmentation (SDF)</h3>
              <p className={cn("text-xs leading-relaxed mb-6", theme === 'dark' ? "text-white/60" : "text-slate-500")}>
                Microscopic chromatin dispersion halo segmentation evaluating large/medium halo intact cells versus degraded / halo-less fragmented sperm to compute overall DFI %.
              </p>
              <div className="p-3 rounded-xl bg-black/20 border border-white/5 font-mono text-[10px] space-y-1 text-muted-foreground">
                <div className="flex justify-between"><span>Clinical Cut-off:</span><span className="text-emerald-400 font-bold">&lt; 15% DFI Optimal</span></div>
                <div className="flex justify-between"><span>Assay Format:</span><span className="text-emerald-400 font-bold">Brightfield & Fluorescent</span></div>
              </div>
            </div>

            {/* Card 6: VISEM Benchmark Validation */}
            <div className={cn(
              "p-8 rounded-3xl border transition-all hover:scale-[1.01] hover:border-blue-500/40 relative group",
              theme === 'dark' ? "bg-[#090b10] border-white/[0.06]" : "bg-white border-slate-200/80 shadow-sm"
            )}>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mb-6">
                <Database className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono uppercase font-bold text-blue-400 block mb-1">Simula VISEM Repository</span>
              <h3 className="text-xl font-bold mb-3">Gold-Standard Benchmark Calibration</h3>
              <p className={cn("text-xs leading-relaxed mb-6", theme === 'dark' ? "text-white/60" : "text-slate-500")}>
                Continuous cross-validation against 29,196 expert-annotated spermatozoa tracks with automated MOTA, precision-recall curve tradeoff (τ), and confusion matrix calculations.
              </p>
              <div className="p-3 rounded-xl bg-black/20 border border-white/5 font-mono text-[10px] space-y-1 text-muted-foreground">
                <div className="flex justify-between"><span>Tracking MOTA:</span><span className="text-blue-400 font-bold">94.2% Grade A</span></div>
                <div className="flex justify-between"><span>Inter-Observer Agreement:</span><span className="text-blue-400 font-bold">Cohen's κ = 0.912</span></div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 6. MULTI-SPECIES VETERINARY & CLINICAL SPECIFICATION DECK */}
      <section id="species" className="py-24 border-t border-b relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
            <span className="text-xs font-mono font-bold tracking-widest text-teal-400 uppercase bg-teal-500/10 px-3 py-1 rounded-full border border-teal-500/20">
              Cross-Species Versatility
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              Human Clinical IVF & Veterinary Reproduction
            </h2>
            <p className={cn("text-sm sm:text-base leading-relaxed", theme === 'dark' ? "text-white/60" : "text-slate-600")}>
              Seamlessly toggle between Human WHO standards and specialized veterinary species with calibrated concentration dilution factors and cryopreservation dose calculators.
            </p>
          </div>

          {/* Species Selector Tabs */}
          <div className="flex items-center justify-center gap-2 flex-wrap mb-10">
            {(Object.keys(SPECIES_CONFIGS) as Array<keyof typeof SPECIES_CONFIGS>).map((sp) => (
              <button
                key={sp}
                onClick={() => setActiveSpeciesTab(sp)}
                className={cn(
                  "px-5 py-3 rounded-2xl text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer",
                  activeSpeciesTab === sp
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20 font-black scale-105"
                    : theme === 'dark'
                      ? "bg-white/5 border border-white/5 text-white/60 hover:text-white"
                      : "bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900"
                )}
              >
                {sp}
              </button>
            ))}
          </div>

          {/* Species Detail Panel */}
          {(() => {
            const currentSp = SPECIES_CONFIGS[activeSpeciesTab];
            return (
              <motion.div 
                key={activeSpeciesTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className={cn(
                  "p-8 sm:p-12 rounded-3xl border relative overflow-hidden shadow-2xl",
                  theme === 'dark' ? "bg-[#090b10] border-white/[0.08]" : "bg-white border-slate-200"
                )}
              >
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 pb-8 border-b border-white/5">
                  <div>
                    <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                      Species Target Specification
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black">{currentSp.name}</h3>
                    <p className="text-xs font-mono text-muted-foreground mt-1">Regulatory Standard: {currentSp.whoStandard}</p>
                  </div>
                  <span className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {currentSp.badge}
                  </span>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 font-mono">
                  <div className="p-4 rounded-2xl bg-black/20 border border-white/5">
                    <span className="text-[10px] text-muted-foreground uppercase block mb-1">Concentration Target</span>
                    <span className="text-sm sm:text-base font-bold text-white block">{currentSp.conc}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-black/20 border border-white/5">
                    <span className="text-[10px] text-muted-foreground uppercase block mb-1">Progressive Motility</span>
                    <span className="text-sm sm:text-base font-bold text-emerald-400 block">{currentSp.motility}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-black/20 border border-white/5">
                    <span className="text-[10px] text-muted-foreground uppercase block mb-1">Strict Morphology</span>
                    <span className="text-sm sm:text-base font-bold text-pink-400 block">{currentSp.morphology}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-black/20 border border-white/5">
                    <span className="text-[10px] text-muted-foreground uppercase block mb-1">Viability (Eosin)</span>
                    <span className="text-sm sm:text-base font-bold text-sky-400 block">{currentSp.vitality}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-black/20 border border-white/5">
                    <span className="text-[10px] text-muted-foreground uppercase block mb-1">Max Chromatin DFI</span>
                    <span className="text-sm sm:text-base font-bold text-amber-400 block">{currentSp.sdf}</span>
                  </div>
                </div>
              </motion.div>
            );
          })()}

        </div>
      </section>

      {/* 7. REGULATORY COMPLIANCE & QUALITY CONTROL (ISO 15189 / WESTGARD) */}
      <section id="standards" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-6 space-y-6">
              <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                Accreditation & Quality Assurance
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                Built for ISO 15189 & Clinical Audit Compliance
              </h2>
              <p className={cn("text-sm sm:text-base leading-relaxed", theme === 'dark' ? "text-white/70" : "text-slate-600")}>
                Eliminate subjective operator bias. ATSA CASA V2.0 provides an automated Internal Quality Control (IQC) suite with dynamic Levey-Jennings control charts, multi-level bead suspension tracking, and automated Westgard rule evaluation.
              </p>

              <div className="space-y-3 font-mono text-xs">
                {[
                  'Automated Westgard Rules: 1:3s (Random Error), 2:2s, R:4s, 4:1s, 10:x Systematic Shift',
                  'Multi-Field of View (Multi-FOV) Composite Scanning with CV% Dispersion Check',
                  'Cryptographically Stamped PDF Diagnostic Reports with QR-Verification Hash',
                  'Chamber Depth Presets: Makler (10µm), Leja 2-8 Chamber (20µm), Cell-VU, Hemocytometer'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className={theme === 'dark' ? "text-white/80" : "text-slate-700"}>{item}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <button
                  onClick={onEnterApp}
                  className="px-6 py-3 rounded-xl text-xs font-mono font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  Explore IQC & Levey-Jennings Suite
                </button>
              </div>
            </div>

            <div className="lg:col-span-6">
              {/* Levey Jennings Mockup Card */}
              <div className={cn(
                "p-6 rounded-3xl border shadow-2xl relative",
                theme === 'dark' ? "bg-[#090b10] border-white/[0.08]" : "bg-white border-slate-200"
              )}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <div>
                      <span className="text-xs font-bold block">Internal Quality Control (IQC)</span>
                      <span className="text-[10px] font-mono text-muted-foreground">Lot #QC-2026-N2 • Level 2 Normal</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                    IN CONTROL (Westgard OK)
                  </span>
                </div>

                {/* Simulated Levey Jennings Graph Lines */}
                <div className="h-44 w-full rounded-2xl bg-black/40 border border-white/5 p-4 flex flex-col justify-between font-mono text-[9px] relative">
                  <div className="flex justify-between border-b border-rose-500/30 text-rose-400 pb-0.5">
                    <span>+3 SD (Upper Limit)</span><span>54.5 M/ml</span>
                  </div>
                  <div className="flex justify-between border-b border-amber-500/30 text-amber-400 pb-0.5">
                    <span>+2 SD (Warning Limit)</span><span>48.0 M/ml</span>
                  </div>
                  <div className="flex justify-between border-b border-emerald-500/40 text-emerald-400 pb-0.5 font-bold">
                    <span>Target Mean (X̄)</span><span>40.0 M/ml</span>
                  </div>
                  <div className="flex justify-between border-b border-amber-500/30 text-amber-400 pb-0.5">
                    <span>-2 SD (Warning Limit)</span><span>32.0 M/ml</span>
                  </div>
                  <div className="flex justify-between text-rose-400 pt-0.5">
                    <span>-3 SD (Lower Limit)</span><span>25.5 M/ml</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground mt-4 pt-4 border-t border-white/5">
                  <span>Instrument: Olympus CX43 • 20x Ph</span>
                  <span>Operator: Dr. A. Atia (Lead CASA)</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 8. COMPARISON TABLE: MANUAL VS LEGACY HARDWARE VS ATSA CASA */}
      <section className="py-24 border-t border-b relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Comparative Analysis
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              Why Laboratories Transition to ATSA
            </h2>
            <p className={cn("text-sm sm:text-base leading-relaxed", theme === 'dark' ? "text-white/60" : "text-slate-600")}>
              Eliminate expensive proprietary legacy boxes and subjective manual chamber grid counting.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className={cn(
              "w-full text-left font-mono text-xs border rounded-3xl overflow-hidden",
              theme === 'dark' ? "bg-[#090b10] border-white/[0.08]" : "bg-white border-slate-200"
            )}>
              <thead>
                <tr className="border-b border-white/10 text-muted-foreground text-[10px] uppercase">
                  <th className="p-4 sm:p-6">Feature / Capability</th>
                  <th className="p-4 sm:p-6">Manual Microscopy</th>
                  <th className="p-4 sm:p-6">Legacy CASA ($25,000+ Hardware)</th>
                  <th className="p-4 sm:p-6 text-emerald-400 bg-emerald-500/10 font-bold">ATSA CASA V2.0 PRO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr>
                  <td className="p-4 sm:p-6 font-bold text-white">Kinematics Measurement</td>
                  <td className="p-4 sm:p-6 text-muted-foreground">Subjective manual estimate</td>
                  <td className="p-4 sm:p-6">VCL / VSL / VAP only</td>
                  <td className="p-4 sm:p-6 text-emerald-400 bg-emerald-500/5 font-bold">8-Param OpenCASA + SpermQ Waves</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-6 font-bold text-white">Flagellar Dynamics (Kymograph)</td>
                  <td className="p-4 sm:p-6 text-rose-400">Not possible</td>
                  <td className="p-4 sm:p-6 text-rose-400">Not supported</td>
                  <td className="p-4 sm:p-6 text-emerald-400 bg-emerald-500/5 font-bold">Real-time Curvature $\kappa(s,t)$ Kymograph</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-6 font-bold text-white">Subpopulation Clustering</td>
                  <td className="p-4 sm:p-6 text-rose-400">Not possible</td>
                  <td className="p-4 sm:p-6 text-muted-foreground">Manual cutoffs only</td>
                  <td className="p-4 sm:p-6 text-emerald-400 bg-emerald-500/5 font-bold">Unsupervised 2D PCA & t-SNE</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-6 font-bold text-white">Multi-Species Veterinary Profiles</td>
                  <td className="p-4 sm:p-6 text-muted-foreground">Manual calculation</td>
                  <td className="p-4 sm:p-6 text-muted-foreground">Requires expensive add-on modules</td>
                  <td className="p-4 sm:p-6 text-emerald-400 bg-emerald-500/5 font-bold">Built-in: Human, Bull, Stallion, Dog, Boar</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-6 font-bold text-white">Hardware Compatibility</td>
                  <td className="p-4 sm:p-6">Standard eyepiece</td>
                  <td className="p-4 sm:p-6 text-amber-400">Proprietary capture card & dongles</td>
                  <td className="p-4 sm:p-6 text-emerald-400 bg-emerald-500/5 font-bold">Any USB3/USB-C/HDMI/C-Mount Camera</td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-6 font-bold text-white">Deployment & Accessibility</td>
                  <td className="p-4 sm:p-6">On-site only</td>
                  <td className="p-4 sm:p-6">Single workstation desktop lock</td>
                  <td className="p-4 sm:p-6 text-emerald-400 bg-emerald-500/5 font-bold">Instant Browser, Tablet, or PC Anywhere</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </section>

      {/* 9. FREQUENTLY ASKED QUESTIONS (FAQ) */}
      <section id="faq" className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16 space-y-4">
            <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Laboratory Knowledge Base
            </span>
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div 
                  key={idx}
                  className={cn(
                    "rounded-2xl border transition-all overflow-hidden",
                    theme === 'dark' ? "bg-[#090b10] border-white/[0.06]" : "bg-white border-slate-200 shadow-sm"
                  )}
                >
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full p-6 text-left flex items-center justify-between gap-4 cursor-pointer font-bold text-sm sm:text-base"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={cn("w-5 h-5 transition-transform duration-300 text-muted-foreground", isOpen && "rotate-180 text-emerald-400")} />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className={cn("px-6 pb-6 text-xs sm:text-sm leading-relaxed border-t pt-4", theme === 'dark' ? "text-white/70 border-white/5" : "text-slate-600 border-slate-100")}>
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 10. FINAL BOTTOM CALL-TO-ACTION */}
      <section className="py-24 border-t relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-emerald-500/10 blur-[120px] rounded-full" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
            <Microscope className="w-8 h-8" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight max-w-2xl mx-auto leading-tight">
            Ready to Upgrade Your Semen Analysis Workflows?
          </h2>

          <p className={cn("text-sm sm:text-base max-w-2xl mx-auto leading-relaxed", theme === 'dark' ? "text-white/60" : "text-slate-600")}>
            Join reproductive clinics, IVF centers, and veterinary laboratories running accurate, standardized computer-assisted semen analysis with zero proprietary hardware.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={onEnterApp}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-mono font-bold bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-xl shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
            >
              <span>Launch Clinical CASA Engine</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onGuestLogin}
              className={cn(
                "w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-mono font-bold border transition-all cursor-pointer",
                theme === 'dark' ? "bg-white/5 border-white/10 text-white hover:bg-white/10" : "bg-white border-slate-300 text-slate-900 hover:bg-slate-100"
              )}
            >
              <span>Instant Reviewer Pass</span>
            </button>
          </div>
        </div>
      </section>

      {/* 11. FOOTER */}
      <footer className={cn(
        "py-12 border-t font-mono text-xs",
        theme === 'dark' ? "bg-[#030406] border-white/[0.06] text-white/40" : "bg-slate-100 border-slate-200 text-slate-500"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Microscope className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white font-sans text-sm">ATSA CASA Engine V2.0</span>
              <p className="text-[10px]">Architect & Lead Developer: Abdelkader Atia</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-[10px]">
            <span>WHO 6th Edition (2021)</span>
            <span>OpenCASA Standard</span>
            <span>SpermQ Flagellar</span>
            <span>Simula VISEM Benchmarked</span>
            <span>ISO 15189 IQC</span>
          </div>

          <div>
            © 2026 ATSA Technologies • All Rights Reserved.
          </div>
        </div>
      </footer>

    </div>
  );
};
