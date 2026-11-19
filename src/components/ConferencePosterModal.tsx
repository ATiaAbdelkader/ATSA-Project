import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  Printer,
  Award,
  X,
  Microscope,
  CheckCircle2,
  QrCode,
  Building2,
  ChevronRight,
  Camera,
  Image as ImageIcon,
  RefreshCw,
  Check,
  LayoutTemplate,
  Sparkles,
} from 'lucide-react';
import { cn } from '../utils';
import { REAL_SPECIMEN_KEYS, type RealSpecimenKey } from '../data/realMicroscopeDatasets';
import {
  generateOpticalTrackingScreenshot,
  generateKinematicsAnalyticsScreenshot,
  captureLiveWorkspaceScreenshot,
  captureElementAsPng,
  triggerImageDownload,
} from '../utils/posterScreenshotGenerator';

import hardwareImg from '../assets/images/poster_microscopy_hardware_1795111492466.jpg';
import morphologyImg from '../assets/images/poster_morphology_plate_1795111492491.jpg';
import vitalitySdfImg from '../assets/images/poster_vitality_sdf_plate_1795111492530.jpg';
import trackingConceptImg from '../assets/images/poster_tracking_screen_1795111492783.jpg';

interface ConferencePosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
}

const MODAL_ROOT_ID = 'conference-poster-modal-root';

export const ConferencePosterModal: React.FC<ConferencePosterModalProps> = ({
  isOpen,
  onClose,
  theme = 'dark',
}) => {
  const [activeView, setActiveView] = useState<'poster' | 'screenshots'>('poster');
  const [posterTheme, setPosterTheme] = useState<'academic-light' | 'scientific-dark'>('academic-light');
  const [selectedSampleKey, setSelectedSampleKey] = useState<RealSpecimenKey>('sample1');

  const [trackingScreenshot, setTrackingScreenshot] = useState<string | null>(null);
  const [kinematicsScreenshot, setKinematicsScreenshot] = useState<string | null>(null);
  const [liveWorkspaceScreenshot, setLiveWorkspaceScreenshot] = useState<string | null>(null);
  const [useLiveCaptureInPoster, setUseLiveCaptureInPoster] = useState<boolean>(false);

  const [isGeneratingFigures, setIsGeneratingFigures] = useState(false);
  const [isCapturingLive, setIsCapturingLive] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const posterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    const buildDataFigures = async () => {
      setIsGeneratingFigures(true);
      try {
        const [trackUrl, kinUrl] = await Promise.all([
          generateOpticalTrackingScreenshot(selectedSampleKey),
          Promise.resolve(generateKinematicsAnalyticsScreenshot()),
        ]);
        if (!cancelled) {
          setTrackingScreenshot(trackUrl);
          setKinematicsScreenshot(kinUrl);
        }
      } catch (err) {
        console.error('Failed to render poster figures:', err);
      } finally {
        if (!cancelled) {
          setIsGeneratingFigures(false);
        }
      }
    };

    buildDataFigures();
    return () => {
      cancelled = true;
    };
  }, [isOpen, selectedSampleKey]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setStatusMessage(msg);
    window.setTimeout(() => {
      setStatusMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const handlePrint = () => {
    setActiveView('poster');
    setTimeout(() => {
      window.print();
    }, 250);
  };

  const handleExportPosterPng = async () => {
    if (!posterRef.current) return;
    setIsExportingPng(true);
    try {
      const pngUrl = await captureElementAsPng(
        posterRef.current,
        posterTheme === 'scientific-dark' ? '#08090d' : '#ffffff'
      );
      triggerImageDownload(pngUrl, `ATSA-CASA-Conference-Poster-${posterTheme}.png`);
      showToast('Conference poster exported as high-res PNG.');
    } catch (err) {
      console.error('Poster PNG export failed:', err);
      showToast('PNG export failed — use Print / Save as PDF instead.');
    } finally {
      setIsExportingPng(false);
    }
  };

  const handleCaptureLiveScreen = async () => {
    setIsCapturingLive(true);
    try {
      const pngUrl = await captureLiveWorkspaceScreenshot(MODAL_ROOT_ID);
      setLiveWorkspaceScreenshot(pngUrl);
      setUseLiveCaptureInPoster(true);
      showToast('Captured live ATSA CASA workspace screenshot.');
    } catch (err) {
      console.error('Live workspace capture failed:', err);
      showToast('Live capture encountered a browser canvas restriction.');
    } finally {
      setIsCapturingLive(false);
    }
  };

  const handleDownloadAllScreenshots = () => {
    const assets: Array<{ url: string | null; name: string }> = [
      { url: trackingScreenshot, name: `ATSA-Fig1-Optical-Tracking-${selectedSampleKey}.png` },
      { url: kinematicsScreenshot, name: 'ATSA-Fig2-MultiSpecies-Kinematics.png' },
      { url: hardwareImg, name: 'ATSA-Fig3-Microscopy-Hardware-Setup.jpg' },
      { url: morphologyImg, name: 'ATSA-Fig4-Morphology-Segmentation-Plate.jpg' },
      { url: vitalitySdfImg, name: 'ATSA-Fig5-Vitality-SCD-Halo-Plate.jpg' },
    ];
    if (liveWorkspaceScreenshot) {
      assets.push({ url: liveWorkspaceScreenshot, name: 'ATSA-Fig6-Live-Workspace-Screenshot.png' });
    }

    let delay = 0;
    assets.forEach((item) => {
      if (!item.url) return;
      window.setTimeout(() => {
        triggerImageDownload(item.url!, item.name);
      }, delay);
      delay += 260;
    });
    showToast('Downloading all conference poster figures...');
  };

  const isDarkPoster = posterTheme === 'scientific-dark';
  const activeFigure2Url =
    useLiveCaptureInPoster && liveWorkspaceScreenshot
      ? liveWorkspaceScreenshot
      : trackingScreenshot || trackingConceptImg;

  const screenshotGallery = [
    {
      id: 'fig-tracking',
      title: `Optical Multi-Target Tracking UI (${selectedSampleKey.toUpperCase()})`,
      subtitle: '1600×960 High-DPI Canvas Render • Real Video Frame + VCL/VSL Overlays & WHO Telemetry',
      badge: '1600×960 PNG',
      url: trackingScreenshot || trackingConceptImg,
      filename: `ATSA-Fig1-Optical-Tracking-${selectedSampleKey}.png`,
      accent: 'emerald',
    },
    {
      id: 'fig-kinematics',
      title: 'Multi-Species Kinematic & Motility Analytics',
      subtitle: '1600×960 High-DPI Render • Bovine, Ovine, Equine, Caprine & Porcine Benchmarking',
      badge: '1600×960 PNG',
      url: kinematicsScreenshot,
      filename: 'ATSA-Fig2-MultiSpecies-Kinematics.png',
      accent: 'cyan',
    },
    {
      id: 'fig-hardware',
      title: 'Laboratory Optical Microscopy & Thermal Stage Setup',
      subtitle: 'Trinocular Phase-Contrast Microscope + CMOS Camera + 37°C Stage + Client Workstation',
      badge: 'HIGH-RES JPG',
      url: hardwareImg,
      filename: 'ATSA-Fig3-Microscopy-Hardware-Setup.jpg',
      accent: 'teal',
    },
    {
      id: 'fig-morphology',
      title: 'Quantitative Morphometric Segmentation Plate',
      subtitle: '4-Panel Phase-Contrast Head, Acrosome, Midpiece Bent & Coiled Flagellum Analysis',
      badge: 'HIGH-RES JPG',
      url: morphologyImg,
      filename: 'ATSA-Fig4-Morphology-Segmentation-Plate.jpg',
      accent: 'purple',
    },
    {
      id: 'fig-vitality',
      title: 'Vitality (Eosin-Nigrosin) & DNA Chromatin Halo (SCD) Plate',
      subtitle: 'Dual-Assay Microscopy Plate: Intact Large vs. Fragmented Halos & Dye Exclusion',
      badge: 'HIGH-RES JPG',
      url: vitalitySdfImg,
      filename: 'ATSA-Fig5-Vitality-SCD-Halo-Plate.jpg',
      accent: 'amber',
    },
  ];

  return (
    <div
      id={MODAL_ROOT_ID}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto print:static print:p-0 print:bg-white print:overflow-visible"
    >
      <div
        className={cn(
          'w-full max-w-7xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[96vh] print:max-h-none print:border-0 print:shadow-none print:rounded-none',
          theme === 'dark' ? 'bg-[#0b0c10] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
        )}
      >
        {/* Action Toolbar Header */}
        <div className="px-4 sm:px-6 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-[#0d0f17] print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shrink-0">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                  Conference Poster &amp; Figures Studio
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ISO / IEEE / SFT Format
                </span>
              </div>
              <p className="text-[10px] text-white/50">
                ATSA CASA &bull; University of El Oued &bull; University of Tiaret
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Switcher: Poster vs Screenshots Studio */}
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 text-xs">
              <button
                onClick={() => setActiveView('poster')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer',
                  activeView === 'poster'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-white/60 hover:text-white'
                )}
              >
                <LayoutTemplate className="w-3.5 h-3.5" />
                <span>Poster Layout</span>
              </button>
              <button
                onClick={() => setActiveView('screenshots')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer',
                  activeView === 'screenshots'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-white/60 hover:text-white'
                )}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Poster Screenshots ({liveWorkspaceScreenshot ? 6 : 5})</span>
              </button>
            </div>

            {/* Capture Live Workspace Button */}
            <button
              onClick={handleCaptureLiveScreen}
              disabled={isCapturingLive}
              title="Capture high-resolution PNG screenshot of the active ATSA CASA workspace behind this window"
              className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/15 text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              <Camera className={cn('w-3.5 h-3.5 text-cyan-400', isCapturingLive && 'animate-pulse')} />
              <span>{isCapturingLive ? 'Capturing...' : 'Capture App Screen'}</span>
            </button>

            {activeView === 'poster' && (
              <>
                {/* Theme Toggle */}
                <div className="flex bg-white/5 border border-white/10 rounded-xl p-1 text-xs">
                  <button
                    onClick={() => setPosterTheme('academic-light')}
                    className={cn(
                      'px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer',
                      posterTheme === 'academic-light'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-white/60 hover:text-white'
                    )}
                  >
                    Print Light
                  </button>
                  <button
                    onClick={() => setPosterTheme('scientific-dark')}
                    className={cn(
                      'px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer',
                      posterTheme === 'scientific-dark'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'text-white/60 hover:text-white'
                    )}
                  >
                    E-Poster Dark
                  </button>
                </div>

                {/* Export Poster PNG */}
                <button
                  onClick={handleExportPosterPng}
                  disabled={isExportingPng}
                  className="flex items-center gap-1.5 px-3 py-2 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isExportingPng ? 'Exporting...' : 'Export PNG'}</span>
                </button>
              </>
            )}

            {/* Print / Export PDF Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Banner */}
        {statusMessage && (
          <div className="px-6 py-2 bg-emerald-500/15 border-b border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 print:hidden">
            <Check className="w-4 h-4 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* ============================================================
            VIEW 1: SCREENSHOTS & FIGURES GALLERY (DOWNLOADABLE PNG/JPG)
           ============================================================ */}
        {activeView === 'screenshots' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#07090e] space-y-6 custom-scrollbar">
            {/* Control Strip */}
            <div className="p-4 rounded-2xl bg-[#0d111a] border border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  Ready-to-Use Conference Poster Screenshots &amp; Scientific Figures
                </h3>
                <p className="text-xs text-white/60 mt-0.5">
                  Download individual high-resolution figures for PowerPoint/Canva/LaTeX or capture your live workspace view.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 px-2">
                    Sample:
                  </span>
                  {REAL_SPECIMEN_KEYS.map((sk, idx) => (
                    <button
                      key={sk}
                      onClick={() => setSelectedSampleKey(sk)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                        selectedSampleKey === sk
                          ? 'bg-emerald-500 text-white'
                          : 'text-white/60 hover:text-white'
                      )}
                    >
                      S{idx + 1}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleDownloadAllScreenshots}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download All Figures</span>
                </button>
              </div>
            </div>

            {/* Live Captured Workspace Screenshot Highlight Card */}
            {liveWorkspaceScreenshot && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/30 to-emerald-950/20 border border-cyan-500/30 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      LIVE WORKSPACE CAPTURE • 2X RETINA PNG
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1.5">
                      Captured ATSA CASA Live Interface Screenshot
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setUseLiveCaptureInPoster((v) => !v)}
                      className={cn(
                        'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer',
                        useLiveCaptureInPoster
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-white/10 text-white border-white/15 hover:bg-white/15'
                      )}
                    >
                      {useLiveCaptureInPoster ? 'Active in Poster Fig. 2' : 'Embed in Poster Fig. 2'}
                    </button>
                    <button
                      onClick={() =>
                        triggerImageDownload(
                          liveWorkspaceScreenshot,
                          `ATSA-CASA-Live-Workspace-${Date.now()}.png`
                        )
                      }
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl text-xs font-black transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PNG</span>
                    </button>
                  </div>
                </div>
                <div className="rounded-xl overflow-hidden border border-white/10 bg-black">
                  <img
                    src={liveWorkspaceScreenshot}
                    alt="Captured Live ATSA CASA Workspace Screenshot"
                    className="w-full max-h-[420px] object-contain mx-auto"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            )}

            {/* Pre-rendered & Generated High-Res Figure Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {screenshotGallery.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl bg-[#0d111a] border border-white/10 overflow-hidden flex flex-col"
                >
                  <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden border-b border-white/10">
                    {item.url ? (
                      <img
                        src={item.url}
                        alt={item.title}
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-white/50">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Rendering high-resolution figure...</span>
                      </div>
                    )}
                    <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-black/80 text-emerald-300 border border-emerald-500/30 backdrop-blur-sm">
                      {item.badge}
                    </span>
                  </div>

                  <div className="p-4 flex items-center justify-between gap-3 flex-1">
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">{item.title}</h4>
                      <p className="text-[11px] text-white/55 mt-0.5 line-clamp-2">{item.subtitle}</p>
                    </div>
                    <button
                      onClick={() => item.url && triggerImageDownload(item.url, item.filename)}
                      disabled={!item.url}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-white/10 hover:bg-emerald-500 hover:text-slate-950 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer disabled:opacity-40"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================
            VIEW 2: THREE-COLUMN ACADEMIC CONFERENCE POSTER
           ============================================================ */}
        {activeView === 'poster' && (
          <div className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-950/60 custom-scrollbar flex justify-center print:p-0 print:bg-white print:overflow-visible">
            <div
              ref={posterRef}
              id="academic-conference-poster"
              className={cn(
                'w-full max-w-[1240px] rounded-xl shadow-2xl p-6 sm:p-8 transition-all print:p-0 print:shadow-none print:max-w-none print:w-full print:border-0',
                isDarkPoster
                  ? 'bg-[#08090d] text-slate-100 border border-white/10'
                  : 'bg-white text-slate-900 border border-slate-300'
              )}
            >
              {/* 1. POSTER BANNER / HEADER */}
              <header
                className={cn(
                  'p-6 rounded-2xl border mb-6 relative overflow-hidden',
                  isDarkPoster
                    ? 'bg-gradient-to-r from-[#0d131f] via-[#09151c] to-[#0d131f] border-emerald-500/30 text-white'
                    : 'bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border-slate-800 text-white'
                )}
              >
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400" />

                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  {/* University of El Oued */}
                  <div className="flex items-center gap-3 shrink-0 text-center md:text-left">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex flex-col items-center justify-center p-2 text-center shadow-inner">
                      <Building2 className="w-7 h-7 text-emerald-400" />
                      <span className="text-[7px] uppercase font-black tracking-widest text-white/70 mt-1 leading-none">
                        UNIV EL OUED
                      </span>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        University of El Oued
                      </p>
                      <p className="text-[9px] text-white/60">Faculty of Natural &amp; Life Sciences</p>
                      <p className="text-[8px] text-white/40">El Oued 39000 &bull; Algeria</p>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="text-center flex-1 max-w-3xl">
                    <span className="inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
                      Theriogenology &amp; Computational Bio-Engineering Research
                    </span>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight leading-tight text-white font-sans">
                      ATSA: Development of a Computer-Assisted Sperm Analysis Platform for Multi-Species Semen Evaluation
                    </h1>
                    <p className="text-xs text-emerald-200/90 font-medium mt-1">
                      Automated Digital Microscopy, Kinematic Track Estimation &amp; Reproducible Livestock Andrology
                    </p>
                  </div>

                  {/* University of Tiaret */}
                  <div className="flex items-center gap-3 shrink-0 text-center md:text-right">
                    <div className="hidden sm:block">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
                        University of Tiaret
                      </p>
                      <p className="text-[9px] text-white/60">Institute of Veterinary Sciences</p>
                      <p className="text-[8px] text-white/40">Tiaret 14000 &bull; Algeria</p>
                    </div>
                    <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex flex-col items-center justify-center p-2 text-center shadow-inner">
                      <Microscope className="w-7 h-7 text-teal-400" />
                      <span className="text-[7px] uppercase font-black tracking-widest text-white/70 mt-1 leading-none">
                        UNIV TIARET
                      </span>
                    </div>
                  </div>
                </div>

                {/* Authors & Affiliations */}
                <div className="mt-5 pt-4 border-t border-white/15 text-center">
                  <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-bold text-white">
                    <div className="flex items-center gap-1.5">
                      <span className="text-emerald-300 underline decoration-emerald-500/50 underline-offset-4">
                        Abdelkader Atia
                      </span>
                      <sup className="text-emerald-400 font-mono font-black">1,2,*</sup>
                      <span className="text-[10px] text-white/50 font-normal font-mono">
                        (atia-abdelkader@univ-eloued.dz)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>Brahim Hamad</span>
                      <sup className="text-emerald-400 font-mono font-black">1,3</sup>
                      <span className="text-[10px] text-white/50 font-normal font-mono">
                        (brahim-hamad@univ-eloued.dz)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>Leyla Hadef</span>
                      <sup className="text-emerald-400 font-mono font-black">1,3</sup>
                      <span className="text-[10px] text-white/50 font-normal font-mono">
                        (leila.hadef@univ-eloued.dz)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span>Fathi Mansour</span>
                      <sup className="text-emerald-400 font-mono font-black">4,5</sup>
                      <span className="text-[10px] text-white/50 font-normal font-mono">
                        (mansour-fathi@univ-eloued.dz)
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1 mt-3 text-[9px] text-white/60 text-left">
                    <div>
                      <span className="font-bold text-emerald-400 font-mono">1.</span> Dept. Agronomy, Fac. Natural
                      &amp; Life Sci., Univ. El Oued, Algeria
                    </div>
                    <div>
                      <span className="font-bold text-emerald-400 font-mono">2.</span> Lab. Biology, Environment &amp;
                      Health, Univ. El Oued, Algeria
                    </div>
                    <div>
                      <span className="font-bold text-emerald-400 font-mono">3.</span> Lab. Hygiene &amp; Animal
                      Pathology, Inst. Vet. Sci., Univ. Tiaret, Algeria
                    </div>
                    <div>
                      <span className="font-bold text-emerald-400 font-mono">4.</span> Dept. Computer Science, Fac.
                      Exact Sci., Univ. El Oued, Algeria
                    </div>
                    <div>
                      <span className="font-bold text-emerald-400 font-mono">5.</span> Lab. Artificial Intelligence
                      &amp; its Applications, Univ. El Oued, Algeria
                    </div>
                    <div className="text-emerald-300">
                      <span className="font-bold text-emerald-400">*</span> Corresponding Author:
                      atia-abdelkader@univ-eloued.dz
                    </div>
                  </div>
                </div>
              </header>

              {/* 2. THREE-COLUMN SCIENTIFIC POSTER BODY */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-justify">
                {/* ================= COLUMN 1: INTRODUCTION & HARDWARE ================= */}
                <div className="space-y-5 flex flex-col">
                  <div
                    className={cn(
                      'p-5 rounded-xl border space-y-3',
                      isDarkPoster ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50 border-slate-200'
                    )}
                  >
                    <div className="flex items-center gap-2 border-b pb-2 border-emerald-500/30">
                      <span className="w-5 h-5 rounded-md bg-emerald-500 text-white font-black text-xs flex items-center justify-center">
                        1
                      </span>
                      <h2 className="text-sm font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Introduction &amp; Motivation
                      </h2>
                    </div>

                    <p className="text-[11px] leading-relaxed">
                      Semen quality evaluation in livestock breeding (bovine, ovine, caprine, equine) is fundamental to
                      artificial insemination (AI) success. However, <strong>conventional manual microscopy</strong> is
                      hindered by:
                    </p>

                    <ul className="text-[10.5px] space-y-1.5 list-disc pl-4 text-left">
                      <li>
                        <strong>Observer subjectivity:</strong> Visual motility estimation routinely carries CV% above
                        25–40%.
                      </li>
                      <li>
                        <strong>Fatigue &amp; throughput limits:</strong> High-speed cell tracking at 37°C is arduous
                        during seasonal breeding peaks.
                      </li>
                      <li>
                        <strong>Proprietary CASA cost barriers:</strong> Closed hardware dongles limit accessibility for
                        regional veterinary laboratories.
                      </li>
                    </ul>

                    <div
                      className={cn(
                        'p-3 rounded-lg border text-[10px] font-medium leading-relaxed',
                        isDarkPoster
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      )}
                    >
                      <strong>Objective:</strong> Engineer <strong>ATSA CASA</strong>—an accessible computer-vision
                      platform integrating digital optical microscopy and automated frame-by-frame tracking for
                      multi-species semen evaluation.
                    </div>
                  </div>

                  {/* Section 2: Hardware & System Setup + Figure 1 */}
                  <div
                    className={cn(
                      'p-5 rounded-xl border flex-1 space-y-3',
                      isDarkPoster ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50 border-slate-200'
                    )}
                  >
                    <div className="flex items-center gap-2 border-b pb-2 border-emerald-500/30">
                      <span className="w-5 h-5 rounded-md bg-emerald-500 text-white font-black text-xs flex items-center justify-center">
                        2
                      </span>
                      <h2 className="text-sm font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Hardware &amp; Acquisition Setup
                      </h2>
                    </div>

                    <div
                      className={cn(
                        'p-2.5 rounded-xl border font-mono text-[9px] space-y-2',
                        isDarkPoster ? 'bg-black/40 border-white/10' : 'bg-white border-slate-200 shadow-sm'
                      )}
                    >
                      <div className="flex items-center justify-between text-center gap-1">
                        <div className="p-1.5 rounded bg-emerald-500/10 border border-emerald-500/30 flex-1">
                          <span className="block font-bold">1. Optical Stage</span>
                          <span className="text-[8px] opacity-70">Phase-contrast 37°C</span>
                        </div>
                        <ChevronRight className="w-3 h-3 text-emerald-500 shrink-0" />
                        <div className="p-1.5 rounded bg-blue-500/10 border border-blue-500/30 flex-1">
                          <span className="block font-bold">2. Digital CMOS</span>
                          <span className="text-[8px] opacity-70">25–60 FPS Ingest</span>
                        </div>
                        <ChevronRight className="w-3 h-3 text-emerald-500 shrink-0" />
                        <div className="p-1.5 rounded bg-purple-500/10 border border-purple-500/30 flex-1">
                          <span className="block font-bold">3. ATSA Engine</span>
                          <span className="text-[8px] opacity-70">MOT &amp; Kinematics</span>
                        </div>
                      </div>
                    </div>

                    {/* Figure 1 Image */}
                    <figure className="space-y-1.5">
                      <div className="rounded-xl overflow-hidden border border-emerald-500/25 bg-black">
                        <img
                          src={hardwareImg}
                          alt="Laboratory optical microscopy hardware setup"
                          className="w-full h-44 object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <figcaption className="text-[9px] leading-snug text-left opacity-80">
                        <strong>Fig. 1:</strong> Experimental acquisition bench coupling a phase-contrast microscope,
                        heated 37.0°C stage, USB CMOS sensor, and the ATSA CASA software client.
                      </figcaption>
                    </figure>

                    <div className="grid grid-cols-2 gap-2 text-[9.5px] text-left">
                      <div className="p-2 rounded-lg bg-black/5 dark:bg-white/5">
                        <span className="font-bold block text-emerald-600 dark:text-emerald-400">
                          Optics &amp; Chambers:
                        </span>
                        10×/20× Phase Contrast, 20 µm Leja/Makler slides.
                      </div>
                      <div className="p-2 rounded-lg bg-black/5 dark:bg-white/5">
                        <span className="font-bold block text-emerald-600 dark:text-emerald-400">
                          Scale Calibration:
                        </span>
                        0.81 µm/px optical micron mapping.
                      </div>
                    </div>
                  </div>
                </div>

                {/* ================= COLUMN 2: METHODOLOGY & VISUAL SCREENSHOTS ================= */}
                <div className="space-y-5 flex flex-col">
                  <div
                    className={cn(
                      'p-5 rounded-xl border flex-1 space-y-3',
                      isDarkPoster ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50 border-slate-200'
                    )}
                  >
                    <div className="flex items-center gap-2 border-b pb-2 border-emerald-500/30">
                      <span className="w-5 h-5 rounded-md bg-emerald-500 text-white font-black text-xs flex items-center justify-center">
                        3
                      </span>
                      <h2 className="text-sm font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Methodology &amp; Computer Vision
                      </h2>
                    </div>

                    <div className="space-y-2 text-[10px]">
                      <div className="p-2 rounded-lg bg-black/5 dark:bg-white/5 text-left">
                        <strong>A. Temporal Frame Differencing &amp; Centroid Extraction:</strong> Removes static debris
                        and extracts sperm head centroids across consecutive frames:
                        <div className="font-mono text-[9px] text-center my-1 text-emerald-600 dark:text-emerald-300">
                          {'|I(x,y,t) - I(x,y,t-1)| > τ_threshold'}
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-black/5 dark:bg-white/5 text-left">
                        <strong>B. Multi-Object Trajectory Linking (MOT):</strong> Nearest-neighbor Euclidean gating
                        links cells across frames t → t+1 to derive curvilinear (VCL), straight-line (VSL), and
                        smoothed average path (VAP) velocities.
                      </div>
                    </div>

                    {/* Figure 2: Real Software Screenshot with Trajectory Overlays */}
                    <figure className="space-y-1.5">
                      <div className="rounded-xl overflow-hidden border border-emerald-500/30 bg-[#07090e] shadow-md relative">
                        <img
                          src={activeFigure2Url}
                          alt="ATSA CASA Live Optical Tracking Screenshot"
                          className="w-full h-auto object-contain"
                          referrerPolicy="no-referrer"
                        />
                        {isGeneratingFigures && (
                          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[8px] font-mono text-emerald-300">
                            Rendering real frame...
                          </span>
                        )}
                      </div>
                      <figcaption className="text-[9px] leading-snug text-left opacity-80">
                        <strong>Fig. 2:</strong> ATSA CASA live optical tracking screenshot on calibrated bovine
                        semen recording ({selectedSampleKey.toUpperCase()}, 25 FPS) showing VCL (cyan), VSL (green), and
                        WHO/SFT telemetry.
                      </figcaption>
                    </figure>

                    {/* Figure 3: Morphology & Vitality Dual Plates */}
                    <div className="grid grid-cols-2 gap-2.5 pt-1">
                      <figure className="space-y-1">
                        <div className="rounded-lg overflow-hidden border border-slate-500/25 bg-black">
                          <img
                            src={morphologyImg}
                            alt="Sperm morphometry segmentation plate"
                            className="w-full h-28 object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <figcaption className="text-[8.5px] leading-tight text-left opacity-80">
                          <strong>Fig. 3a:</strong> Morphometric head, midpiece &amp; flagellum segmentation.
                        </figcaption>
                      </figure>

                      <figure className="space-y-1">
                        <div className="rounded-lg overflow-hidden border border-slate-500/25 bg-black">
                          <img
                            src={vitalitySdfImg}
                            alt="Vitality eosin-nigrosin and DNA chromatin dispersion halo assay"
                            className="w-full h-28 object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <figcaption className="text-[8.5px] leading-tight text-left opacity-80">
                          <strong>Fig. 3b:</strong> SCD chromatin halo &amp; Eosin-Nigrosin vitality.
                        </figcaption>
                      </figure>
                    </div>
                  </div>
                </div>

                {/* ================= COLUMN 3: RESULTS, DISCUSSION & CONCLUSION ================= */}
                <div className="space-y-5 flex flex-col">
                  <div
                    className={cn(
                      'p-5 rounded-xl border space-y-3',
                      isDarkPoster ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50 border-slate-200'
                    )}
                  >
                    <div className="flex items-center gap-2 border-b pb-2 border-emerald-500/30">
                      <span className="w-5 h-5 rounded-md bg-emerald-500 text-white font-black text-xs flex items-center justify-center">
                        4
                      </span>
                      <h2 className="text-sm font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Results &amp; Prototype Output
                      </h2>
                    </div>

                    {/* Figure 4: Kinematics Analytics Screenshot */}
                    {kinematicsScreenshot && (
                      <figure className="space-y-1.5">
                        <div className="rounded-xl overflow-hidden border border-cyan-500/30 bg-[#07090e] shadow-md">
                          <img
                            src={kinematicsScreenshot}
                            alt="Multi-species kinematic analytics screenshot"
                            className="w-full h-auto object-contain"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <figcaption className="text-[9px] leading-snug text-left opacity-80">
                          <strong>Fig. 4:</strong> ATSA CASA multi-species kinematic benchmark and 25 FPS bovine sample
                          telemetry readout.
                        </figcaption>
                      </figure>
                    )}

                    {/* Benchmark Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-[9px] border-collapse font-mono">
                        <thead>
                          <tr className={isDarkPoster ? 'bg-white/10 text-emerald-300' : 'bg-slate-200 text-slate-800'}>
                            <th className="p-1.5 text-left border border-slate-400/20">Species</th>
                            <th className="p-1.5 text-center border border-slate-400/20">VCL (µm/s)</th>
                            <th className="p-1.5 text-center border border-slate-400/20">PR %</th>
                            <th className="p-1.5 text-center border border-slate-400/20">Latency</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="p-1.5 font-bold border border-slate-400/20">Bovine (Bull)</td>
                            <td className="p-1.5 text-center border border-slate-400/20">84.5 ± 12.3</td>
                            <td className="p-1.5 text-center border border-slate-400/20">64.8%</td>
                            <td className="p-1.5 text-center border border-slate-400/20">&lt; 35 ms</td>
                          </tr>
                          <tr>
                            <td className="p-1.5 font-bold border border-slate-400/20">Ovine (Ram)</td>
                            <td className="p-1.5 text-center border border-slate-400/20">112.0 ± 15.1</td>
                            <td className="p-1.5 text-center border border-slate-400/20">71.2%</td>
                            <td className="p-1.5 text-center border border-slate-400/20">&lt; 38 ms</td>
                          </tr>
                          <tr>
                            <td className="p-1.5 font-bold border border-slate-400/20">Equine (Stallion)</td>
                            <td className="p-1.5 text-center border border-slate-400/20">78.2 ± 10.4</td>
                            <td className="p-1.5 text-center border border-slate-400/20">58.4%</td>
                            <td className="p-1.5 text-center border border-slate-400/20">&lt; 32 ms</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Section 5: Discussion & Conclusions */}
                  <div
                    className={cn(
                      'p-5 rounded-xl border flex-1 space-y-3',
                      isDarkPoster ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50 border-slate-200'
                    )}
                  >
                    <div className="flex items-center gap-2 border-b pb-2 border-emerald-500/30">
                      <span className="w-5 h-5 rounded-md bg-emerald-500 text-white font-black text-xs flex items-center justify-center">
                        5
                      </span>
                      <h2 className="text-sm font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Discussion &amp; Conclusions
                      </h2>
                    </div>

                    <p className="text-[10.5px] leading-relaxed">
                      <strong>Current Scope:</strong> While digital acquisition, preliminary tracking, and kinematic
                      estimation are operational, quantitative accuracy requires systematic comparison with manually
                      annotated reference trajectories before clinical diagnostic deployment.
                    </p>

                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[9.5px] space-y-1 text-left">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Validation &amp; Optimization Roadmap:
                      </span>
                      <p className="leading-snug">
                        1. Benchmark against manually annotated tracks (MAE &amp; MOTA).<br />
                        2. Species-specific extender turbidity calibration (bovine, ovine, equine).<br />
                        3. Automated multi-FOV repeatability verification.
                      </p>
                    </div>

                    <div
                      className={cn(
                        'p-3 rounded-lg border text-[10px] font-medium leading-relaxed',
                        isDarkPoster
                          ? 'bg-gradient-to-r from-emerald-950/40 to-teal-950/40 border-emerald-500/40 text-emerald-200'
                          : 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                      )}
                    >
                      <strong>Conclusion:</strong> ATSA CASA establishes an accessible, reproducible software engineering
                      foundation bridging digital optical microscopy and livestock theriogenology.
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. POSTER FOOTER */}
              <footer
                className={cn(
                  'mt-6 p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 text-[9.5px]',
                  isDarkPoster ? 'bg-[#0b0c10] border-white/10 text-white/70' : 'bg-slate-100 border-slate-200 text-slate-600'
                )}
              >
                <div className="flex-1 space-y-1">
                  <span className="font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block text-[9px]">
                    Selected References
                  </span>
                  <p className="leading-tight">
                    [1] WHO Laboratory Manual for Examination of Human Semen (6th Ed., 2021).<br />
                    [2] Society for Theriogenology (SFT) Guidelines for Bull Breeding Soundness Evaluation.<br />
                    [3] Haugen et al. (2019). VISEM: A Multimodal Video Dataset for Semen Analysis. <em>ACM MMSys</em>.
                  </p>
                </div>

                <div className="flex-1 space-y-1 border-t md:border-t-0 md:border-l md:pl-4 border-slate-300 dark:border-white/10">
                  <span className="font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block text-[9px]">
                    Acknowledgments &amp; Funding
                  </span>
                  <p className="leading-tight">
                    Supported by the Algerian Ministry of Higher Education &amp; Scientific Research (MESRS / DGRSDT),
                    the University of El Oued, and the Institute of Veterinary Sciences, University of Tiaret.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0 bg-white/5 p-2 rounded-lg border border-white/10">
                  <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center p-1 shadow-md">
                    <QrCode className="w-full h-full text-slate-900" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-500 font-mono block">ATSA CASA LIVE</span>
                    <span className="text-[8px] opacity-60 block">Scan to test Web App</span>
                    <span className="text-[8px] font-mono text-emerald-500 underline">univ-eloued.dz/atsa</span>
                  </div>
                </div>
              </footer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
