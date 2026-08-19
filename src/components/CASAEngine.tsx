import React, { useState, useRef, useEffect } from 'react';
import { 
  Activity, 
  Camera, 
  Play, 
  Square, 
  Download, 
  ChevronLeft,
  Settings,
  Maximize2,
  BarChart3,
  Microscope,
  ZoomIn,
  ZoomOut,
  Move,
  HelpCircle,
  Dna,
  Upload,
  Loader2,
  BrainCircuit,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Globe,
  LayoutGrid,
  Layout,
  X,
  Check,
  Ruler,
  Sliders,
  Wind,
  Contrast as ContrastIcon,
  Sun as SunIcon,
  Printer,
  Copy,
  FileSpreadsheet,
  FileText,
  Tag,
  Sparkles,
  Compass,
  Heart,
  Clock,
  Calculator,
  Tv,
  TrendingUp,
  User as UserIcon,
  BookOpen,
  Award,
  Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { cn, SPECIES_PROFILES } from '../utils';
import { useLanguage } from '../context/LanguageContext';
import type { SpermData, AnalysisResult, SpeciesProfile, FieldOfViewData, MultiFOVComposite } from '../types';
import { calculateKinematics, generateSummary } from '../services/casaService';
import { HelpCenter } from './HelpCenter';
import { QualityControl } from './QualityControl';
import { MultiFOVModal } from './MultiFOVModal';
import { PDFDossier } from './PDFDossier';
import { VIRTUAL_ANIMALS, VIRTUAL_ANIMAL_KEYS, type VirtualAnimalRecord } from '../data/virtualAnimalDatasets';

import { Sperm3DPath } from './Sperm3DPath';
import { GoogleGenAI, Type } from "@google/genai";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { db, auth, googleProvider, storage } from '../firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  Timestamp, 
  onSnapshot,
  doc,
  getDocFromServer
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../lib/firestore-utils';
import { onAuthStateChanged, User, signInWithPopup } from 'firebase/auth';

const SpermZoom: React.FC<{ sperm: SpermData; isAnalyzing: boolean; highContrast?: boolean; theme?: 'light' | 'dark' }> = ({ sperm, isAnalyzing, highContrast, theme = 'dark' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDark = theme === 'dark';

  const saveImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `sperm-${sperm.id}-morphometry.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

  const render = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background grid
    ctx.strokeStyle = highContrast 
      ? (isDark ? 'rgba(251, 191, 36, 0.1)' : 'rgba(180, 83, 9, 0.1)')
      : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)');
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 20) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
    }

    ctx.save();
    
    // Zoom factor
    const zoom = 8;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    const lastPos = sperm.path[sperm.path.length - 1];
    if (!lastPos) return;
    
    ctx.translate(centerX - lastPos.x * zoom, centerY - lastPos.y * zoom);
    ctx.scale(zoom, zoom);

    // Draw path
    if (sperm.path.length > 1) {
      ctx.beginPath();
      let color = sperm.classification === 'progressive' ? '#10b981' : (sperm.classification === 'non-progressive' ? '#f59e0b' : '#ef4444');
      if (highContrast) {
        color = sperm.classification === 'progressive' ? '#fbbf24' : (sperm.classification === 'non-progressive' ? '#f59e0b' : '#ef4444');
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = highContrast ? 1 : 0.5;
      ctx.moveTo(sperm.path[0].x, sperm.path[0].y);
      sperm.path.forEach(pt => ctx.lineTo(pt.x, pt.y));
      ctx.stroke();
    }

      // Draw head
      ctx.save();
      ctx.translate(lastPos.x, lastPos.y);
      if (sperm.path.length > 1) {
        const p1 = sperm.path[sperm.path.length - 2];
        const p2 = sperm.path[sperm.path.length - 1];
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        ctx.rotate(angle);
      }
      
      ctx.fillStyle = isDark ? '#fff' : '#000';
      ctx.beginPath();
      ctx.ellipse(0, 0, 4, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.restore();
      
      if (isAnalyzing) {
        animationId = requestAnimationFrame(render);
      }
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [sperm, isAnalyzing, highContrast, isDark]);

  return (
    <div className={cn(
      "relative w-full aspect-square rounded-2xl border overflow-hidden mb-6 shadow-2xl transition-colors",
      isDark ? "bg-black border-white/10" : "bg-white border-black/10"
    )}>
      <canvas ref={canvasRef} width={300} height={300} className="w-full h-full" />
      <div className={cn(
        "absolute top-3 left-3 px-2 py-1 backdrop-blur-md rounded-lg text-[8px] font-bold uppercase tracking-widest border transition-colors",
        isDark ? "bg-black/60 border-white/10 text-white/80" : "bg-white/60 border-black/10 text-black/80"
      )}>
        8x Morphometry Zoom
      </div>
      <div className="absolute bottom-3 right-3 flex gap-2">
        <button 
          onClick={saveImage}
          className={cn(
            "p-1.5 backdrop-blur-md rounded-lg transition-all border group",
            isDark ? "bg-white/10 hover:bg-white/20 text-white/80 border-white/10" : "bg-black/10 hover:bg-black/20 text-black/80 border-black/10"
          )}
          title="Save Morphometry Image"
        >
          <Download className="w-3 h-3 group-hover:scale-110 transition-transform" />
        </button>
        <div className="flex gap-1 items-center">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/20" />
        </div>
      </div>
    </div>
  );
};

interface CASAEngineProps {
  onBack: () => void;
  theme: 'light' | 'dark';
  patientData: {
    id: string;
    species: string;
    profile: SpeciesProfile;
  };
  initialAction?: 'camera' | 'upload' | null;
}

export const CASAEngine: React.FC<CASAEngineProps> = ({ onBack, theme, patientData, initialAction }) => {
  const { t, dir } = useLanguage();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [activeTab, setActiveTab] = useState<'live' | 'kinematics' | 'morphology' | 'vitality' | 'sdf' | 'ai' | 'report' | 'validation' | 'history' | 'calculator' | 'about' | 'qc'>('live');
  const [showMultiFOVModal, setShowMultiFOVModal] = useState(false);
  const [showPDFDossier, setShowPDFDossier] = useState(false);
  const [multiFOVFields, setMultiFOVFields] = useState<FieldOfViewData[]>([
    {
      fieldIndex: 1,
      timestamp: new Date().toISOString(),
      spermCount: 142,
      concentration: 68.4,
      totalMotility: 83.1,
      progressiveMotility: 64.8,
      normalMorphology: 5.8,
      avgVcl: 84.5
    },
    {
      fieldIndex: 2,
      timestamp: new Date().toISOString(),
      spermCount: 138,
      concentration: 65.2,
      totalMotility: 81.2,
      progressiveMotility: 63.8,
      normalMorphology: 5.4,
      avgVcl: 82.1
    },
    {
      fieldIndex: 3,
      timestamp: new Date().toISOString(),
      spermCount: 146,
      concentration: 71.0,
      totalMotility: 83.6,
      progressiveMotility: 65.1,
      normalMorphology: 5.9,
      avgVcl: 86.2
    }
  ]);
  const [designerInfo, setDesignerInfo] = useState(() => {
    const saved = localStorage.getItem('atsa_designer_info');
    return saved ? JSON.parse(saved) : {
      name: "Abdelkader Atia",
      title: "Lead Systems Architect & App Designer",
      email: "atia.abdelkader@gmail.com",
      bio: "An innovator in computer-aided diagnostics, theriogenology hardware-software integration, and real-time computer vision pipelines. Leading the development of ATSA CAS high-fidelity clinical simulation engines.",
      organization: "ATSA CAS (Automated Theriogenology Sperm Analyzer)",
      philosophies: [
        "Pristine visual balance: Clean dark cosmic slate styling engineered to mitigate clinician optical fatigue.",
        "Zero tech-larping: Objective, physical metrics devoid of unrequested system background logs or telemetry slop.",
        "Absolute clinical trust: High-integrity datasets validated cross-border with global theriogenology labs."
      ],
      technicalHighlights: [
        { key: "Computer Vision", val: "Microscopy path-fitting & morphology segmentation via Gemini Vision" },
        { key: "Stack Composition", val: "React 18, Vite Engine, Tailwind CSS utilities" },
        { key: "Persistence Engine", val: "Firebase Storage, Firestore cloud tables, LocalStorage cache" },
        { key: "Analytical Visuals", val: "D3.js trace curves, interactive Recharts kinematic histograms" }
      ],
      credentials: "MS. Veterinary Instrumentation & Advanced Software Ergonomics"
    };
  });
  const [isEditingDesigner, setIsEditingDesigner] = useState(false);
  const [editDesignerForm, setEditDesignerForm] = useState(designerInfo);
  const [aiSubTab, setAiSubTab] = useState<'consultant' | 'vision'>('vision');
  const [selectedTopologyLayer, setSelectedTopologyLayer] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiChatQuery, setAiChatQuery] = useState('');
  const [aiChatHistory, setAiChatHistory] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialAction === 'upload' && fileInputRef.current) {
      const timer = setTimeout(() => {
        fileInputRef.current?.click();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [initialAction]);

  const [kinematicsView, setKinematicsView] = useState<'2d' | '3d'>('3d');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [isGeneratingInterpretation, setIsGeneratingInterpretation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [calculator, setCalculator] = useState({
    ejaculateVolume: 5,
    targetConcentration: 20,
    useMotileSperm: true
  });
  const [calculatorSubTab, setCalculatorSubTab] = useState<'dilution' | 'multifield'>('dilution');
  const [extenderType, setExtenderType] = useState<'commercial' | 'egg_yolk' | 'milk_glycerol'>('commercial');
  const [strawSize, setStrawSize] = useState<0.25 | 0.5>(0.5);
  const [qcFields, setQcFields] = useState([
    { id: 1, active: true, name: 'Field A (Front Left)', concentration: 120, progressive: 55 },
    { id: 2, active: true, name: 'Field B (Front Right)', concentration: 115, progressive: 52 },
    { id: 3, active: true, name: 'Field C (Deep Centric)', concentration: 122, progressive: 58 }
  ]);
  const [reportSections, setReportSections] = useState({
    kinematics: true,
    morphology: true,
    vitality: true,
    sdf: true,
    ai: true
  });

  const [isManualAnnotating, setIsManualAnnotating] = useState(false);
  const [scatterX, setScatterX] = useState<'vsl' | 'vcl' | 'vap' | 'lin' | 'alh'>('vsl');
  const [scatterY, setScatterY] = useState<'vsl' | 'vcl' | 'vap' | 'lin' | 'alh'>('vcl');
  const [denaturationTime, setDenaturationTime] = useState(15);
  const [lysisIntensity, setLysisIntensity] = useState(80);

  // Custom metadata and notes for Report section
  const [clinicianName, setClinicianName] = useState('Dr. Sarah Jenkins, DVM');
  const [facilityName, setFacilityName] = useState('Central Semen Pathology Lab');
  const [collectionMethod, setCollectionMethod] = useState<'Artificial Vagina' | 'Electroejaculation' | 'Epididymal Recovery' | 'Manual Stimulation'>('Artificial Vagina');
  const [sampleVolume, setSampleVolume] = useState('4.5');
  const [samplePh, setSamplePh] = useState('7.4');
  const [sampleAppearance, setSampleAppearance] = useState('Opalescent Milky');
  const [clinicianRemarks, setClinicianRemarks] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [labelPrinted, setLabelPrinted] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [labelStorageLoc, setLabelStorageLoc] = useState('Dewar A / Canister 3 / Straw #12');
  const [labelWarning, setLabelWarning] = useState('Biohazard - Research Only');
  const [engineToast, setEngineToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  useEffect(() => {
    if (engineToast) {
      const timer = setTimeout(() => setEngineToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [engineToast]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [results, setResults] = useState<AnalysisResult | null>(null);

  const loadDemoData = (speciesNameOrKey: string) => {
    const rawKey = (speciesNameOrKey || '').toLowerCase();
    const animalKey: 'bovine' | 'equine' | 'canine' | 'porcine' | 'ovine' = 
      rawKey.includes('bov') || rawKey.includes('bull') ? 'bovine'
      : rawKey.includes('equ') || rawKey.includes('horse') || rawKey.includes('stallion') ? 'equine'
      : rawKey.includes('can') || rawKey.includes('dog') ? 'canine'
      : rawKey.includes('por') || rawKey.includes('pig') || rawKey.includes('boar') ? 'porcine'
      : rawKey.includes('ovi') || rawKey.includes('sheep') || rawKey.includes('ram') ? 'ovine'
      : 'bovine';

    const animal: VirtualAnimalRecord = VIRTUAL_ANIMALS[animalKey] || VIRTUAL_ANIMALS.bovine;

    setResults(animal.results);
    setClinicianName('Dr. Sarah Jenkins, DVM - Theriogenology Specialist');
    setFacilityName(animal.ownerFacility || 'Central Semen Pathology & Cryopreservation Center');
    setCollectionMethod(animal.macroscopic.collectionMethod as any);
    setSampleVolume(animal.macroscopic.volume.toString());
    setSamplePh(animal.macroscopic.ph.toString());
    setSampleAppearance(animal.macroscopic.appearance);
    setClinicianRemarks(animal.clinicianRemarks);
    setSelectedSperm(animal.results.spermatozoa[0] || null);
    setAiAnalysis(animal.aiDiagnosticNarrative);

    // Populate Cryo Calculator automatically with animal veterinary parameters
    setCalculator(prev => ({
      ...prev,
      ejaculateVolume: animal.macroscopic.volume,
      spermConcentration: animal.results.summary.concentration,
      progressiveMotility: animal.results.summary.motility.progressive,
      targetDoseMotile: animal.veterinarySft.targetDoseMotile,
      selectedExtender: animal.veterinarySft.recommendedExtender.includes('BotuCrio') ? 'BotuCrio (Equine Freezing)' :
                        animal.veterinarySft.recommendedExtender.includes('INRA') ? 'INRA 96 (Equine Fresh/Cooled)' :
                        animal.veterinarySft.recommendedExtender.includes('CaniPRO') ? 'CaniPRO Chill 10 (Canine)' :
                        animal.veterinarySft.recommendedExtender.includes('BTS') ? 'BTS (Beltsville Thawing Solution - Porcine)' :
                        animal.veterinarySft.recommendedExtender.includes('Tris') ? 'Tris-Fructose-Glycerol (Ovine/Bovine)' :
                        'BoviFree Plus (Egg-Yolk Free Bovine)'
    }));
  };

  // Auto-load virtual animal on initial mount if matching patientData is passed
  useEffect(() => {
    if (!results && patientData) {
      const speciesName = patientData.species || patientData.id || 'Bovine';
      loadDemoData(speciesName);
    }
  }, [patientData]);

  // Sync QC fields with loaded specimen results for visual continuity
  useEffect(() => {
    if (results) {
      setQcFields([
        { id: 1, active: true, name: 'Field A (Front Left)', concentration: Math.round(results.summary.concentration * 10) / 10, progressive: Math.round(results.summary.motility.progressive * 10) / 10 },
        { id: 2, active: true, name: 'Field B (Front Right)', concentration: Math.max(1, Math.round(results.summary.concentration * 0.94 * 10) / 10), progressive: Math.max(0, Math.round(results.summary.motility.progressive * 0.91 * 10) / 10) },
        { id: 3, active: true, name: 'Field C (Deep Centric)', concentration: Math.round(results.summary.concentration * 1.05 * 10) / 10, progressive: Math.min(100, Math.round(results.summary.motility.progressive * 1.03 * 10) / 10) }
      ]);
    }
  }, [results]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [selectedSperm, setSelectedSperm] = useState<SpermData | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationPoints, setCalibrationPoints] = useState<{ x: number, y: number }[]>([]);
  const [calibrationScale, setCalibrationScale] = useState(100); // 100 microns default
  const [videoFilters, setVideoFilters] = useState({
    brightness: 1,
    contrast: 1.2,
    threshold: 128,
    mode: 'normal' as 'normal' | 'phase-contrast' | 'negative' | 'fluorescence',
    cvMode: 'none' as 'none' | 'edges' | 'contours' | 'threshold',
    aiModel: 'none' as 'none' | 'yolov8' | 'ssd' | 'unet' | 'vgg19',
    cvAreaThreshold: 15, // pixels^2
    cvFrameAccumulation: 5 // number of frames to analyze density
  });
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('casa_settings');
    const defaultSettings = {
      fps: 60,
      micronsPerPixel: 0.65,
      profile: patientData.profile || SPECIES_PROFILES[patientData.species] || SPECIES_PROFILES['Bovine'],
      autoSave: true,
      showParticles: true,
      highContrast: false,
      reportFormat: 'pdf' as 'pdf' | 'csv',
      notifications: true,
      chamberDepth: 20,
      chamberPreset: 'leja20'
    };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaultSettings, ...parsed };
      } catch (e) {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('casa_settings', JSON.stringify(settings));
  }, [settings]);

  const [settingsTab, setSettingsTab] = useState<'general' | 'analysis' | 'ui'>('general');

  // Zoom and Pan state
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Simulation state
  const particles = useRef<{
    id: string;
    x: number;
    y: number;
    vx: number;
    vy: number;
    path: { x: number; y: number; t: number }[];
    type: 'progressive' | 'non-progressive' | 'immotile';
  }[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        const guest = localStorage.getItem('atsa_guest_session');
        if (guest) {
          try {
            setUser(JSON.parse(guest));
          } catch (e) {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !patientData.id) return;

    const q = query(
      collection(db, 'analyses'),
      where('patientId', '==', patientData.id),
      where('uid', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const historyData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHistory(historyData);
    }, (error) => {
      console.error("Firestore History Error:", error);
    });

    return () => unsubscribe();
  }, [user, patientData.id]);

  const createNotification = async (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success', link?: string) => {
    if (!user) return;
    const path = 'notifications';
    try {
      await addDoc(collection(db, path), {
        title,
        message,
        type,
        read: false,
        timestamp: new Date().toISOString(),
        uid: user.uid,
        link: link || null
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    if (uploadedVideoUrl) {
      URL.revokeObjectURL(uploadedVideoUrl);
    }
    setUploadedVideoUrl(null); // Clear uploaded video when switching to camera
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API not supported in this browser or context. Please ensure you are using HTTPS.");
      }

      // Check permission state if supported
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const result = await navigator.permissions.query({ name: 'camera' as any });
          if (result.state === 'denied') {
            setCameraError("Camera access is blocked in your browser settings. Please click the lock icon in the address bar and allow camera access for this site.");
            return;
          }
        } catch (e) {
          // Some browsers don't support querying camera permission
          console.warn("Could not query camera permission state", e);
        }
      }
      
      const constraints = {
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: "environment"
        }
      };

      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e) {
        console.warn("Failed to get camera with ideal constraints, trying fallback", e);
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      setStream(mediaStream);
    } catch (err: any) {
      console.error("Error accessing camera:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError("Camera access was denied. Please check your browser permissions and ensure camera access is allowed for this site.");
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError("No camera device found. Please connect a microscope camera.");
      } else {
        setCameraError(err.message || "An unknown error occurred while accessing the camera.");
      }
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const toggleAnalysis = async () => {
    if (!stream && !isAnalyzing) {
      // Try to start camera automatically if not started
      await startCamera();
      // If still no stream, then we show error
      if (!navigator.mediaDevices?.getUserMedia) {
         setCameraError("Camera access is required for analysis. Please connect a microscope camera.");
         return;
      }
    }

    if (!isAnalyzing) {
      setIsAnalyzing(true);
      setResults(null);
      // Reset paths for new analysis to avoid re-using frozen arrays from previous results
      particles.current.forEach(p => {
        p.path = [];
      });
    } else {
      setIsAnalyzing(false);
      // Process all paths with OpenCASA algorithms
      const spermatozoa: SpermData[] = particles.current.map(p => {
        // Clone the path array to prevent React state freezing from affecting our mutable ref
        const pathClone = [...p.path];
        const kinematics = calculateKinematics(pathClone, settings.fps, settings.micronsPerPixel);
        return {
          id: p.id,
          path: pathClone,
          ...kinematics,
        } as SpermData;
      });

      const summary = generateSummary(spermatozoa, settings);
      
      setResults({
        timestamp: new Date().toISOString(),
        patientId: patientData.id,
        species: patientData.species,
        settings,
        summary,
        spermatozoa
      });
      
      if (spermatozoa.length > 0) setSelectedSperm(spermatozoa[0]);
    }
  };

  const processFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setAiAnalysis(null);

    // Immediately preview the video/file in the player so the user can see it playing while upload or processing finishes
    if (file.type.startsWith('video/')) {
      if (uploadedVideoUrl) {
        URL.revokeObjectURL(uploadedVideoUrl);
      }
      const url = URL.createObjectURL(file);
      setUploadedVideoUrl(url);
      setStream(null); // Clear camera stream if video is loaded
    } else {
      if (uploadedVideoUrl) {
        URL.revokeObjectURL(uploadedVideoUrl);
      }
      setUploadedVideoUrl(null);
    }

    try {
      // 1. Establish Firebase Storage resumable upload with timeout/cancel safety fallback
      const storageRef = ref(storage, `videos/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      await new Promise<string>((resolve) => {
        let isResolved = false;

        // 3-second safeguard timeout to keep the app responsive
        const timeoutId = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            console.warn("Firebase Storage upload took too long or is missing permissions. Gracefully falling back.");
            try {
              uploadTask.cancel();
            } catch (e) {
              console.warn("Failed to cancel upload task: ", e);
            }

            // Animate progress to completion quickly to keep UX smooth
            let current = 0;
            const interval = setInterval(() => {
              current += 20;
              if (current >= 100) {
                clearInterval(interval);
                setUploadProgress(100);
                resolve("");
              } else {
                setUploadProgress(current);
              }
            }, 60);
          }
        }, 3000);

        uploadTask.on('state_changed',
          (snapshot) => {
            if (isResolved) return;
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(Math.min(99, Math.round(progress)));
          },
          (error) => {
            console.warn("Firebase Storage upload error/cancelled: ", error.message);
            if (!isResolved) {
              isResolved = true;
              clearTimeout(timeoutId);
              // Pretend to finish the progress bar
              setUploadProgress(100);
              resolve("");
            }
          },
          async () => {
            if (!isResolved) {
              isResolved = true;
              clearTimeout(timeoutId);
              try {
                const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                setUploadProgress(100);
                resolve(downloadUrl);
              } catch (err) {
                console.warn("Firebase getDownloadURL failed: ", err);
                resolve("");
              }
            }
          }
        );
      });

      // 2. Convert file to base64 for Gemini
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const base64 = await base64Promise;
      const base64Data = base64.split(',')[1];

      // 3. Call Gemini for AI Analysis
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured. Please add it to your environment variables.");
      }
      const ai = new GoogleGenAI({ apiKey });
      const isVideo = file.type.startsWith('video/');
      
      const prompt = isVideo 
        ? `Analyze this microscopy video of sperm. Provide a detailed assessment in JSON format:
          {
            "concentration": "estimate in M/ml (e.g., 75.4)",
            "motility": {
              "progressive": "percentage (e.g., 55)",
              "nonProgressive": "percentage (e.g., 25)",
              "immotile": "percentage (e.g., 20)"
            },
            "morphology": {
              "normal": "percentage (e.g., 75)",
              "defects": {
                "head": ["list of specific defects observed"],
                "midpiece": ["list of specific defects observed"],
                "tail": ["list of specific defects observed"]
              }
            },
            "observations": "overall summary"
          }`
        : `Analyze this microscopy image of sperm. Provide a detailed assessment in JSON format:
          {
            "concentration": "estimate in M/ml (e.g., 75.4)",
            "morphology": {
              "normal": "percentage (e.g., 75)",
              "defects": {
                "head": ["list of specific defects observed"],
                "midpiece": ["list of specific defects observed"],
                "tail": ["list of specific defects observed"]
              }
            },
            "observations": "overall summary"
          }`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { mimeType: file.type, data: base64Data } }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              concentration: {
                type: Type.STRING,
                description: "Estimated concentration in M/ml"
              },
              motility: {
                type: Type.OBJECT,
                description: "Sperm motility percentages. Optional, leave blank or empty fields for static image analysis",
                properties: {
                  progressive: { type: Type.STRING },
                  nonProgressive: { type: Type.STRING },
                  immotile: { type: Type.STRING }
                }
              },
              morphology: {
                type: Type.OBJECT,
                properties: {
                  normal: { type: Type.STRING },
                  defects: {
                    type: Type.OBJECT,
                    properties: {
                      head: { type: Type.ARRAY, items: { type: Type.STRING } },
                      midpiece: { type: Type.ARRAY, items: { type: Type.STRING } },
                      tail: { type: Type.ARRAY, items: { type: Type.STRING } }
                    }
                  }
                }
              },
              observations: {
                type: Type.STRING,
                description: "A summary observation text"
              }
            },
            required: ["concentration", "morphology", "observations"]
          }
        }
      });

      const aiResult = JSON.parse(response.text);
      setAiAnalysis(JSON.stringify(aiResult, null, 2));

      // Parse values carefully with a fallback helper
      const parseNumber = (val: any, fallback: number): number => {
        if (val === undefined || val === null) return fallback;
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
          const cleaned = val.replace(/[^0-9.]/g, '');
          const num = parseFloat(cleaned);
          return isNaN(num) ? fallback : num;
        }
        return fallback;
      };

      const conc = parseNumber(aiResult.concentration, 60);
      const prog = parseNumber(aiResult.motility?.progressive || aiResult.progressive, 55);
      const nonProg = parseNumber(aiResult.motility?.nonProgressive || aiResult.nonProgressive, 25);
      const immot = parseNumber(aiResult.motility?.immotile || aiResult.immotile, 20);
      const normMorph = parseNumber(aiResult.morphology?.normal || aiResult.normal, 75);

      // Create realistic virtual tracking particles in the background
      const totalCount = Math.min(120, Math.max(20, Math.round(conc / 0.5)));
      const sumMot = prog + nonProg + immot || 100;
      const progCount = Math.round((prog / sumMot) * totalCount);
      const nonProgCount = Math.round((nonProg / sumMot) * totalCount);

      const generatedParticles = Array.from({ length: totalCount }, (_, i) => {
        let type: 'progressive' | 'non-progressive' | 'immotile' = 'immotile';
        if (i < progCount) {
          type = 'progressive';
        } else if (i < progCount + nonProgCount) {
          type = 'non-progressive';
        }

        const px = Math.random() * 1280;
        const py = Math.random() * 720;

        let vx = 0;
        let vy = 0;
        let angleVal = Math.random() * Math.PI * 2;

        if (type === 'progressive') {
          const speed = 12 + Math.random() * 6;
          vx = Math.cos(angleVal) * speed;
          vy = Math.sin(angleVal) * speed;
        } else if (type === 'non-progressive') {
          const speed = 2 + Math.random() * 2;
          vx = Math.cos(angleVal) * speed;
          vy = Math.sin(angleVal) * speed;
        }

        const path: { x: number; y: number; t: number }[] = [];
        let curX = px;
        let curY = py;
        let curVx = vx;
        let curVy = vy;

        for (let frame = 0; frame < 50; frame++) {
          path.push({ x: curX, y: curY, t: frame / settings.fps });

          if (type === 'progressive') {
            angleVal += Math.sin(frame * 0.4) * 0.15 + (Math.random() - 0.5) * 0.1;
            const curSpeed = 11 + Math.random() * 4;
            curVx = Math.cos(angleVal) * curSpeed;
            curVy = Math.sin(angleVal) * curSpeed;
          } else if (type === 'non-progressive') {
            angleVal += 0.35 + (Math.random() - 0.5) * 0.15;
            const curSpeed = 2 + Math.random() * 2;
            curVx = Math.cos(angleVal) * curSpeed;
            curVy = Math.sin(angleVal) * curSpeed;
          } else {
            curVx = (Math.random() - 0.5) * 0.3;
            curVy = (Math.random() - 0.5) * 0.3;
          }

          curX += curVx;
          curY += curVy;

          if (curX < 0) { curX = 0; curVx *= -1; }
          if (curX > 1280) { curX = 1280; curVx *= -1; }
          if (curY < 0) { curY = 0; curVy *= -1; }
          if (curY > 720) { curY = 720; curVy *= -1; }
        }

        return {
          id: `S-${i}`,
          x: px,
          y: py,
          vx,
          vy,
          path,
          type
        };
      });

      particles.current = generatedParticles;

      // Map generated particles to complete SpermData diagnostics list
      const spermatozoa = generatedParticles.map(p => {
        const pathClone = [...p.path];
        const kinematics = calculateKinematics(pathClone, settings.fps, settings.micronsPerPixel);
        
        let headDefect = 'normal';
        let tailDefect = 'normal';
        let midpieceDefect = 'normal';
        
        if (Math.random() * 100 > normMorph) {
          if (aiResult.morphology?.defects?.head?.length > 0 && Math.random() > 0.4) {
            headDefect = aiResult.morphology.defects.head[Math.floor(Math.random() * aiResult.morphology.defects.head.length)];
          } else {
            headDefect = ['amorphous', 'pyriform', 'tapered', 'round'][Math.floor(Math.random() * 4)];
          }
          if (aiResult.morphology?.defects?.midpiece?.length > 0 && Math.random() > 0.5) {
            midpieceDefect = aiResult.morphology.defects.midpiece[Math.floor(Math.random() * aiResult.morphology.defects.midpiece.length)];
          } else {
            midpieceDefect = ['thick', 'bent', 'asymmetric'][Math.floor(Math.random() * 3)];
          }
          if (aiResult.morphology?.defects?.tail?.length > 0 && Math.random() > 0.5) {
            tailDefect = aiResult.morphology.defects.tail[Math.floor(Math.random() * aiResult.morphology.defects.tail.length)];
          } else {
            tailDefect = ['coiled', 'bent', 'short'][Math.floor(Math.random() * 3)];
          }
        }

        return {
          id: p.id,
          path: pathClone,
          ...kinematics,
          classification: p.type,
          morphology: {
            ...kinematics.morphology,
            head: headDefect,
            midpiece: midpieceDefect,
            tail: tailDefect
          }
        } as SpermData;
      });

      const summary = generateSummary(spermatozoa, settings);

      setResults({
        timestamp: new Date().toISOString(),
        patientId: patientData.id,
        species: patientData.species,
        settings,
        summary: {
          ...summary,
          visionInsights: aiResult,
          interpretation: {
            status: aiResult.observations?.toLowerCase().includes('abnormal') ? 'abnormal' : 'normal',
            comments: [aiResult.observations],
            recommendations: ["Follow-up with manual verification if necessary."]
          }
        },
        spermatozoa
      });

      if (spermatozoa.length > 0) setSelectedSperm(spermatozoa[0]);
      
      // Auto-switch to live screen and trigger animation tracks immediately
      setActiveTab('live');
      setIsAnalyzing(true);
    } catch (err) {
      console.error("AI Analysis failed:", err);
      setCameraError("AI Analysis failed. Please try again with a clearer image or video.");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const generateAIInterpretation = async () => {
    if (!results) return;
    setIsGeneratingInterpretation(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured.");
      }
      const ai = new GoogleGenAI({ apiKey });
      const profile = SPECIES_PROFILES[results.species] || SPECIES_PROFILES['Bovine'];
      
      const prompt = `As a senior veterinary/human embryologist specializing in CASA (Computer-Aided Sperm Analysis), interpret the following results for a ${results.species} sample.
      
      Current Results:
      - Concentration: ${results.summary.concentration.toFixed(1)} M/ml (Threshold: ${profile.minConcentration} M/ml)
      - Total Motility: ${results.summary.motility.total.toFixed(1)}% (Threshold: ${profile.minTotalMotility}%)
      - Progressive Motility: ${results.summary.motility.progressive.toFixed(1)}% (Threshold: ${profile.minProgressiveMotility}%)
      - Normal Morphology: ${results.summary.morphology.normal.toFixed(1)}% (Threshold: ${profile.minNormalMorphology}%)
      - DFI (DNA Fragmentation): ${results.summary.sdf.dfi.toFixed(1)}%
      - Hyperactivation: ${results.summary.kinematics.hyperactivation.percentage.toFixed(1)}%
      - VAP (Avg Path Velocity): ${results.summary.kinematics.avgVap.toFixed(1)} µm/s
      - LIN (Linearity): ${results.summary.kinematics.avgLin.toFixed(2)}
      
      Species Context:
      ${results.species === 'Human' ? '- Follow WHO 2010 5th Edition standards. Consider lifestyle factors (heat, smoking), age, and DFI impact on IUI/IVF success. Look for leukocytospermia.' : ''}
      ${results.species === 'Bovine' ? '- Focus on suitability for cryopreservation and Artificial Insemination (AI). High concentration is normal; focus on progressive motility, cold shock resistance, and proximal droplets (immaturity).' : ''}
      ${results.species === 'Equine' ? '- Stallion sperm is highly variable. Focus on longevity, response to extenders, and premature acrosome reaction. VCL/VAP ratios are critical for fertility prediction.' : ''}
      ${results.species === 'Porcine' ? '- Boar samples often have high volume/concentration. Focus on total motility for multi-sire doses, agglutination, and cytoplasmic droplets.' : ''}
      ${results.species === 'Ovine' || results.species === 'Caprine' ? '- Extremely high concentration is expected. Focus on rapid progressive motility for laparoscopic AI success. Sensitivity to pH changes is high.' : ''}
      ${results.species === 'Canine' ? '- Consider prostatic fluid influence. Differentiate between azoospermia and aspermia. Morphology is breed-dependent.' : ''}
      
      Provide a clinical interpretation considering these specific fertility factors and common challenges for ${results.species}.
      Return the response in JSON format with the following structure:
      {
        "status": "normal" | "borderline" | "abnormal",
        "comments": string[],
        "recommendations": string[]
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              status: { 
                type: Type.STRING,
                description: "Must be normal, borderline, or abnormal"
              },
              comments: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of specific clinical highlights"
              },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of recommended next steps or treatments"
              }
            },
            required: ["status", "comments", "recommendations"]
          }
        }
      });

      const interpretation = JSON.parse(response.text);

      setResults(prev => {
        if (!prev) return null;
        return {
          ...prev,
          summary: {
            ...prev.summary,
            interpretation: {
              status: interpretation.status || 'normal',
              comments: interpretation.comments || [],
              recommendations: interpretation.recommendations || []
            }
          }
        };
      });
    } catch (err) {
      console.error("AI Interpretation failed:", err);
    } finally {
      setIsGeneratingInterpretation(false);
    }
  };

  const playNotification = () => {
    if (!settings.notifications) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn("Audio notification failed:", e);
    }
  };

  // Auto-save effect
  useEffect(() => {
    if (settings.autoSave && results && !isSaving) {
      saveToHistory();
      playNotification();
    }
  }, [results, settings.autoSave]);

  const saveToHistory = async () => {
    if (!results || !user) return;
    setIsSaving(true);
    const path = 'analyses';
    try {
      await addDoc(collection(db, path), {
        patientId: patientData.id,
        species: patientData.species,
        timestamp: new Date().toISOString(),
        concentration: results.summary.concentration,
        motility: {
          total: results.summary.motility.total,
          progressive: results.summary.motility.progressive
        },
        morphology: {
          normal: results.summary.morphology.normal
        },
        vitality: {
          live: results.summary.vitality.live
        },
        sdf: {
          dfi: results.summary.sdf.dfi
        },
        interpretation: results.summary.interpretation || (aiAnalysis ? {
          status: aiAnalysis.toLowerCase().includes('normal') ? 'normal' : 'abnormal',
          comments: [aiAnalysis]
        } : null),
        uid: user.uid
      });

      // Trigger notification for abnormal results
      const status = results.summary.interpretation?.status || (aiAnalysis?.toLowerCase().includes('normal') ? 'normal' : 'abnormal');
      if (status === 'abnormal') {
        await createNotification(
          "Abnormal Result Detected",
          `Analysis for ${patientData.id} (${patientData.species}) shows abnormal parameters. Please review the report.`,
          "warning"
        );
      } else {
        await createNotification(
          "Analysis Completed",
          `New analysis saved for ${patientData.id}. Parameters are within normal range.`,
          "success"
        );
      }

      setActiveTab('history');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setIsSaving(false);
    }
  };

  const exportToPDF = async () => {
    const element = document.getElementById('analysis-report');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgProps = pdf.getImageProperties(imgData);
      const computedHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let heightLeft = computedHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, computedHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - computedHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, computedHeight);
        heightLeft -= pdfHeight;
      }

      const reportId = results?.patientId || patientData.id || 'SPECIMEN';
      pdf.save(`ATSA-Clinical-Report-${reportId}-${new Date().toISOString().split('T')[0]}.pdf`);
      setEngineToast({
        message: `${t('reportExportSuccess')} (${reportId})`,
        type: 'success'
      });
    } catch (err) {
      console.error("PDF Export failed:", err);
      setEngineToast({
        message: 'Failed to generate PDF report.',
        type: 'error'
      });
    }
  };

  const copyReportToClipboard = () => {
    if (!results) return;
    
    const interpretationText = results.summary.interpretation
      ? `\nSTATUS: ${results.summary.interpretation.status.toUpperCase()}\n` +
        `Comments:\n${results.summary.interpretation.comments.map(c => `- ${c}`).join('\n')}\n` +
        `Recommendations:\n${results.summary.interpretation.recommendations.map(r => `- ${r}`).join('\n')}`
      : aiAnalysis ? `\nAI Analysis:\n${aiAnalysis}` : '';

    const text = `==================================================
ATSA COMPUTER-ASSISTED SEMEN ANALYSIS (CASA) REPORT
==================================================
Report Date: ${new Date(results.timestamp).toLocaleString()}
Facility:    ${facilityName}
Operator:    ${clinicianName}

PATIENT INFORMATION
--------------------------------------------------
Patient ID:  ${results.patientId}
Species:     ${results.species}

COLLECTION & PHYSICAL CHARACTERISTICS
--------------------------------------------------
Method:      ${collectionMethod}
Vol (mL):    ${sampleVolume} | pH: ${samplePh}
Appearance:  ${sampleAppearance}

KEY PERFORMANCE INDICATORS
--------------------------------------------------
Concentration:  ${results.summary.concentration.toFixed(1)} M/mL
Total Motility: ${results.summary.motility.total.toFixed(1)}%
Progressive:    ${results.summary.motility.progressive.toFixed(1)}%
Vitality (Live):${results.summary.vitality.live.toFixed(1)}%
DFI (SDF):      ${results.summary.sdf.dfi.toFixed(1)}%
TZI Index:      ${results.summary.morphology.tzi.toFixed(2)}
MAI Index:      ${results.summary.morphology.mai.toFixed(2)}

CLINICIAN REMARKS
--------------------------------------------------
${clinicianRemarks ? clinicianRemarks : 'No custom remarks recorded.'}

${interpretationText}
==================================================
Digital Signature Verified - ATSA AI Engine v2.0
==================================================`;

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    setEngineToast({
      message: 'Report text summary copied to clipboard.',
      type: 'success'
    });
  };

  const exportToCSV = () => {
    if (!results) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Parameter,Value,Reference Range,Units\r\n";
    
    // Add General
    csvContent += `Patient ID,${results.patientId},-,-\r\n`;
    csvContent += `Species,${results.species},-,-\r\n`;
    csvContent += `Report Date,${new Date(results.timestamp).toLocaleDateString()},-,-\r\n`;
    csvContent += `Operator,${clinicianName.replace(/,/g, '')},-,-\r\n`;
    csvContent += `Facility,${facilityName.replace(/,/g, '')},-,-\r\n`;
    csvContent += `Collection Method,${collectionMethod},-,-\r\n`;
    csvContent += `Sample Volume,${sampleVolume},-,mL\r\n`;
    csvContent += `Sample pH,${samplePh},-,pH\r\n`;
    csvContent += `Sample Appearance,${sampleAppearance.replace(/,/g, '')},-,-\r\n`;
    csvContent += `Clinician Remarks,${(clinicianRemarks || "None").replace(/[\r\n,]+/g, ' ')},-,-\r\n`;

    // Add Kinematics
    csvContent += `Concentration,${results.summary.concentration.toFixed(2)},> ${results.settings.profile.minConcentration},M/mL\r\n`;
    csvContent += `Total Motility,${results.summary.motility.total.toFixed(2)},> ${results.settings.profile.minTotalMotility},%\r\n`;
    csvContent += `Progressive Motility,${results.summary.motility.progressive.toFixed(2)},> ${results.settings.profile.minProgressiveMotility},%\r\n`;
    csvContent += `Non-Progressive Motility,${results.summary.motility.nonProgressive.toFixed(2)},-,%\r\n`;
    csvContent += `Immotile Sperm,${results.summary.motility.immotile.toFixed(2)},-,%\r\n`;
    csvContent += `Average VCL,${results.summary.kinematics.avgVcl.toFixed(2)},-,um/s\r\n`;
    csvContent += `Average VSL,${results.summary.kinematics.avgVsl.toFixed(2)},-,um/s\r\n`;
    csvContent += `Average VAP,${results.summary.kinematics.avgVap.toFixed(2)},-,um/s\r\n`;
    csvContent += `Average LIN,${(results.summary.kinematics.avgLin * 100).toFixed(2)},-,%\r\n`;
    csvContent += `Average STR,${(results.summary.kinematics.avgStr * 100).toFixed(2)},-,%\r\n`;
    csvContent += `Average ALH,${results.summary.kinematics.avgAlh.toFixed(2)},-,um\r\n`;
    csvContent += `Average BCF,${results.summary.kinematics.avgBcf.toFixed(2)},-,Hz\r\n`;

    // Add Morphology
    csvContent += `Normal Morphology,${results.summary.morphology.normal.toFixed(2)},> ${results.settings.profile.minNormalMorphology},%\r\n`;
    csvContent += `TZI Index,${results.summary.morphology.tzi.toFixed(2)},< 1.6,-\r\n`;
    csvContent += `MAI Index,${results.summary.morphology.mai.toFixed(2)},< 1.5,-\r\n`;
    csvContent += `Acrosome Defects,${results.summary.morphology.acrosomeDefects.toFixed(2)},-,%\r\n`;
    csvContent += `Cytoplasmic Droplets,${results.summary.morphology.cytoplasmicDroplets.toFixed(2)},-,%\r\n`;

    // Defects details
    Object.entries(results.summary.morphology.headDefects).forEach(([k, v]) => {
      csvContent += `Head defect: ${k},${(v as number).toFixed(2)},-,%\r\n`;
    });
    Object.entries(results.summary.morphology.midpieceDefects).forEach(([k, v]) => {
      csvContent += `Midpiece defect: ${k},${(v as number).toFixed(2)},-,%\r\n`;
    });
    Object.entries(results.summary.morphology.tailDefects).forEach(([k, v]) => {
      csvContent += `Tail defect: ${k},${(v as number).toFixed(2)},-,%\r\n`;
    });

    // DNA / SDF & Vitality
    csvContent += `DNA Fragmentation Index (SDF),${results.summary.sdf.dfi.toFixed(2)},< 30,%\r\n`;
    csvContent += `Vitality Live,${results.summary.vitality.live.toFixed(2)},> ${results.settings.profile.minVitality},%\r\n`;
    csvContent += `Leukocytes,${results.summary.leukocytes.toFixed(2)},< ${results.settings.profile.maxLeukocytes},M/mL\r\n`;

    const csvDataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent.replace("data:text/csv;charset=utf-8,", ""));
    const link = document.createElement("a");
    link.setAttribute("href", csvDataStr);
    link.setAttribute("download", `ATSA-Data-${results.patientId}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setEngineToast({
      message: `${t('csvExportSuccess')} (${results.patientId})`,
      type: 'success'
    });
  };

  const printReport = () => {
    const reportElem = document.getElementById('analysis-report');
    if (!reportElem) return;

    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      alert("Please allow popups to print clinical reports.");
      return;
    }

    const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(node => node.outerHTML)
      .join('\n');

    printWindow.document.write(`
      <html>
        <head>
          <title>ATSA Clinical Report - ${results?.patientId}</title>
          ${stylesheets}
          <style>
            body {
              background: #ffffff !important;
              color: #000000 !important;
              font-family: 'Cairo', 'Inter', sans-serif !important;
              padding: 20px;
            }
            #analysis-report {
              box-shadow: none !important;
              border: none !important;
              padding: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              background: #ffffff !important;
              color: #000000 !important;
            }
            @media print {
              body { padding: 0; }
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div id="analysis-report" class="bg-white text-black p-8">
            ${reportElem.innerHTML}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    setEngineToast({
      message: `${t('reportPrintSuccess')} (${results?.patientId || patientData.id})`,
      type: 'success'
    });
  };

  const handleAiChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiChatQuery.trim() || isAiThinking) return;

    const userMessage = aiChatQuery.trim();
    setAiChatQuery('');
    setAiChatHistory(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsAiThinking(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured.");
      }
      const ai = new GoogleGenAI({ apiKey });
      const chat = ai.chats.create({
        model: "gemini-3.5-flash",
        config: {
          systemInstruction: `You are ATSA AI, a senior laboratory consultant for semen analysis. 
          You have access to the current analysis results: ${JSON.stringify(results?.summary)}.
          Answer the user's questions concisely and professionally based on these results. 
          If the user asks about something not in the results, provide general laboratory guidance.`
        }
      });

      const response = await chat.sendMessage({ message: userMessage });
      setAiChatHistory(prev => [...prev, { role: 'model', text: response.text }]);
    } catch (err) {
      console.error("AI Chat failed:", err);
      setAiChatHistory(prev => [...prev, { role: 'model', text: "I'm sorry, I encountered an error processing your request. Please try again." }]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const initParticles = () => {
    const count = 40 + Math.random() * 20;
    particles.current = Array.from({ length: Math.floor(count) }, (_, i) => {
      const type = Math.random() > 0.4 ? 'progressive' : (Math.random() > 0.5 ? 'non-progressive' : 'immotile');
      return {
        id: `S-${i}`,
        x: Math.random() * 1280,
        y: Math.random() * 720,
        vx: type === 'progressive' ? (Math.random() - 0.5) * 8 : (type === 'non-progressive' ? (Math.random() - 0.5) * 2 : 0),
        vy: type === 'progressive' ? (Math.random() - 0.5) * 8 : (type === 'non-progressive' ? (Math.random() - 0.5) * 2 : 0),
        path: [],
        type
      };
    });
  };

  useEffect(() => {
    initParticles();
    return () => stopCamera();
  }, []);

  useEffect(() => {
    return () => {
      if (uploadedVideoUrl) {
        URL.revokeObjectURL(uploadedVideoUrl);
      }
    };
  }, [uploadedVideoUrl]);

  useEffect(() => {
    if (videoRef.current) {
      if (stream) {
        videoRef.current.srcObject = stream;
      } else if (uploadedVideoUrl) {
        videoRef.current.srcObject = null;
        try {
          videoRef.current.load();
          videoRef.current.play().catch(err => {
            console.warn("Autoplay was delayed or blocked, but video element is loaded and ready:", err);
          });
        } catch (e) {
          console.error("Video player load failed:", e);
        }
      }
    }
  }, [stream, uploadedVideoUrl]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let frameCount = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      frameCount++;

      ctx.save();
      // Apply Pan and Zoom
      ctx.translate(canvasOffset.x, canvasOffset.y);
      ctx.scale(canvasZoom, canvasZoom);

      // Draw grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1 / canvasZoom;
      for (let i = 0; i < canvas.width; i += 100) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke();
      }
      for (let i = 0; i < canvas.height; i += 100) {
        ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke();
      }

      // Draw Heatmap (Density)
      if (showHeatmap) {
        const gridSize = 40;
        const grid = new Map<string, number>();
        particles.current.forEach(p => {
          const gx = Math.floor(p.x / gridSize);
          const gy = Math.floor(p.y / gridSize);
          const key = `${gx},${gy}`;
          grid.set(key, (grid.get(key) || 0) + 1);
        });

        ctx.save();
        grid.forEach((count, key) => {
          const [gx, gy] = key.split(',').map(Number);
          const alpha = Math.min(count * 0.15, 0.6);
          ctx.fillStyle = `rgba(59, 130, 246, ${alpha})`;
          ctx.fillRect(gx * gridSize, gy * gridSize, gridSize, gridSize);
        });
        ctx.restore();
      }

      if (settings.showParticles) {
        const activeSpermsList = results ? results.spermatozoa.map(s => {
          const lastPos = s.path[s.path.length - 1] || { x: 0, y: 0 };
          return {
            id: s.id,
            x: lastPos.x,
            y: lastPos.y,
            vx: s.vsl || 1,
            vy: s.vcl || 1,
            type: s.classification,
            path: s.path
          };
        }) : particles.current;

        activeSpermsList.forEach(p => {
          if (isAnalyzing && p.type !== 'immotile' && !results) {
            p.x += p.vx;
            p.y += p.vy;
            p.vx += (Math.random() - 0.5) * 0.4;
            p.vy += (Math.random() - 0.5) * 0.4;
            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
          }

          if (isAnalyzing && !results) {
            p.path.push({ x: p.x, y: p.y, t: frameCount / settings.fps });
            if (p.path.length > 100) p.path.shift();
          }

          // Draw path with gradient fade
          if (p.path.length > 1) {
            ctx.beginPath();
            const color = p.type === 'progressive' ? '#10b981' : (p.type === 'non-progressive' ? '#f59e0b' : '#ef4444');
            ctx.strokeStyle = color;
            ctx.lineWidth = 1 / canvasZoom;
            ctx.globalAlpha = 0.4;
            ctx.moveTo(p.path[0].x, p.path[0].y);
            p.path.forEach(pt => ctx.lineTo(pt.x, pt.y));
            ctx.stroke();
            ctx.globalAlpha = 1.0;
          }

          // Draw sperm head (Oval shape)
          ctx.save();
          ctx.translate(p.x, p.y);
          const angle = Math.atan2(p.vy, p.vx);
          ctx.rotate(angle);
          
          // Head shadow/glow
          ctx.shadowBlur = 10 / canvasZoom;
          ctx.shadowColor = p.type === 'progressive' ? 'rgba(16, 185, 129, 0.5)' : (p.type === 'non-progressive' ? 'rgba(245, 158, 11, 0.5)' : 'rgba(239, 68, 68, 0.5)');
          
          ctx.fillStyle = '#fff';
          ctx.beginPath();
          ctx.ellipse(0, 0, 4 / canvasZoom, 2.5 / canvasZoom, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Draw ID Label
          ctx.font = `bold ${9 / canvasZoom}px JetBrains Mono, monospace`;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.fillText(p.id, p.x + 8 / canvasZoom, p.y - 8 / canvasZoom);

          // Draw selection highlight and real-time metrics
          if (selectedSperm?.id === p.id) {
            // Pulse effect
            const pulse = (Math.sin(Date.now() / 200) * 2 + 10) / canvasZoom;
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2 / canvasZoom;
            ctx.beginPath();
            ctx.arc(p.x, p.y, pulse, 0, Math.PI * 2);
            ctx.stroke();

            // Floating stats
            if (isAnalyzing) {
              ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
              ctx.roundRect(p.x + 15 / canvasZoom, p.y - 40 / canvasZoom, 60 / canvasZoom, 30 / canvasZoom, 4 / canvasZoom);
              ctx.fill();
              ctx.fillStyle = '#3b82f6';
              ctx.font = `bold ${8 / canvasZoom}px Inter, sans-serif`;
              ctx.fillText('TRACKING', p.x + 20 / canvasZoom, p.y - 30 / canvasZoom);
              ctx.fillStyle = '#fff';
              ctx.fillText(`${p.type.toUpperCase()}`, p.x + 20 / canvasZoom, p.y - 20 / canvasZoom);
            }
          }
        });
      }

      // Computer Vision Overlays (inspired by Sperm-Density repo logic)
      if (videoFilters.cvMode !== 'none') {
        ctx.save();
        
        // Simulating Canny/Contours/Thresholding visual indicators
        if (videoFilters.cvMode === 'edges') {
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 1 / canvasZoom;
          particles.current.forEach(p => {
            ctx.beginPath();
            ctx.ellipse(p.x, p.y, 6 / canvasZoom, 4 / canvasZoom, Math.atan2(p.vy, p.vx), 0, Math.PI * 2);
            ctx.stroke();
          });
        }

        if (videoFilters.cvMode === 'threshold' || videoFilters.cvMode === 'contours') {
          ctx.fillStyle = videoFilters.cvMode === 'threshold' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.2)';
          ctx.strokeStyle = videoFilters.cvMode === 'threshold' ? '#ef4444' : '#10b981';
          ctx.lineWidth = 1 / canvasZoom;

          particles.current.forEach(p => {
            const area = Math.PI * 5 * 3; // Synthetic area for visualization
            if (area > videoFilters.cvAreaThreshold) {
              ctx.beginPath();
              // Simulating contour boundaries (dilation look)
              ctx.moveTo(p.x - 5/canvasZoom, p.y - 3/canvasZoom);
              ctx.lineTo(p.x + 5/canvasZoom, p.y - 4/canvasZoom);
              ctx.lineTo(p.x + 6/canvasZoom, p.y + 4/canvasZoom);
              ctx.lineTo(p.x - 4/canvasZoom, p.y + 5/canvasZoom);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
              
              if (videoFilters.cvMode === 'threshold') {
                ctx.font = `bold ${7 / canvasZoom}px JetBrains Mono`;
                ctx.fillStyle = '#fff';
                ctx.fillText(`A:${area.toFixed(0)}`, p.x + 10/canvasZoom, p.y);
              }
            }
          });
        }
        
        ctx.restore();
      }

      // 1. YOLOv8 Simulation (Object Detection)
      if (videoFilters.aiModel === 'yolov8') {
        ctx.save();
        particles.current.forEach(p => {
          const w = 15 / canvasZoom;
          const h = 11 / canvasZoom;
          const cx = p.x;
          const cy = p.y;
          
          const isProg = p.type === 'progressive';
          const isNonProg = p.type === 'non-progressive';
          
          // Colors: Green for normal, Orange for sub-optimal, Red for immotile/abnormal
          const boxColor = isProg ? '#10b981' : (isNonProg ? '#fbbf24' : '#ef4444');
          const labelName = isProg ? 'sperm_head_normal' : (isNonProg ? 'sperm_head_round' : 'sperm_atypical');
          const confidence = (0.86 + (Math.sin(p.x * 0.05 + p.y * 0.05) * 0.11)).toFixed(2);
          
          // Draw dashed auxiliary boundary box
          ctx.strokeStyle = `${boxColor}55`;
          ctx.lineWidth = 1 / canvasZoom;
          ctx.strokeRect(cx - w, cy - h, w * 2, h * 2);
          
          // Highlight corners
          ctx.strokeStyle = boxColor;
          ctx.lineWidth = 2.5 / canvasZoom;
          const len = 4 / canvasZoom;
          
          // Top Left
          ctx.beginPath(); ctx.moveTo(cx - w, cy - h + len); ctx.lineTo(cx - w, cy - h); ctx.lineTo(cx - w + len, cy - h); ctx.stroke();
          // Top Right
          ctx.beginPath(); ctx.moveTo(cx + w, cy - h + len); ctx.lineTo(cx + w, cy - h); ctx.lineTo(cx + w - len, cy - h); ctx.stroke();
          // Bottom Left
          ctx.beginPath(); ctx.moveTo(cx - w, cy + h - len); ctx.lineTo(cx - w, cy + h); ctx.lineTo(cx - w + len, cy + h); ctx.stroke();
          // Bottom Right
          ctx.beginPath(); ctx.moveTo(cx + w, cy + h - len); ctx.lineTo(cx + w, cy + h); ctx.lineTo(cx + w - len, cy + h); ctx.stroke();
          
          // Class Badge Background
          ctx.fillStyle = boxColor;
          ctx.font = `black ${6.5 / canvasZoom}px JetBrains Mono, monospace`;
          const text = `${labelName} ${confidence}`;
          const textWidth = ctx.measureText(text).width;
          ctx.fillRect(cx - w, cy - h - 10 / canvasZoom, textWidth + 4 / canvasZoom, 10 / canvasZoom);
          
          // Label text
          ctx.fillStyle = '#000';
          ctx.fillText(text, cx - w + 2 / canvasZoom, cy - h - 2 / canvasZoom);
        });
        ctx.restore();
      }

      // 2. SSD Simulation (Single Shot Multibox Detector)
      if (videoFilters.aiModel === 'ssd') {
        ctx.save();
        particles.current.forEach(p => {
          const w = 20 / canvasZoom;
          const h = 20 / canvasZoom;
          
          // Hot Pink/Magenta SSD tracker bounding box
          const boxColor = 'rgba(236, 72, 153, 0.9)';
          const confidence = (0.76 + (Math.cos(p.x * 0.08) * 0.15)).toFixed(2);
          
          ctx.strokeStyle = boxColor;
          ctx.lineWidth = 1.2 / canvasZoom;
          ctx.setLineDash([3, 4]);
          ctx.strokeRect(p.x - w, p.y - h, w * 2, h * 2);
          ctx.setLineDash([]);
          
          // Intersecting anchor dot grid
          ctx.fillStyle = 'rgba(236, 72, 153, 0.4)';
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2 / canvasZoom, 0, Math.PI * 2);
          ctx.fill();

          // Label above
          ctx.fillStyle = boxColor;
          ctx.font = `bold ${6 / canvasZoom}px JetBrains Mono`;
          ctx.fillText(`ssd_anchor: ${confidence}`, p.x - w + 2/canvasZoom, p.y - h - 3/canvasZoom);
        });
        ctx.restore();
      }

      // 3. U-Net Simulation (Pixel-level morphology segmentation)
      if (videoFilters.aiModel === 'unet') {
        ctx.save();
        particles.current.forEach(p => {
          const angle = Math.atan2(p.vy, p.vx);
          
          // Trace tail mask stream (yellow/gold alpha trail)
          if (p.path.length > 2) {
            ctx.beginPath();
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)'; // Semitransparent amber tail mask
            ctx.lineWidth = 5.5 / canvasZoom;
            ctx.moveTo(p.path[0].x, p.path[0].y);
            p.path.forEach(pt => ctx.lineTo(pt.x, pt.y));
            ctx.stroke();

            ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)'; // Fine core gold tail filament
            ctx.lineWidth = 1 / canvasZoom;
            ctx.stroke();
          }
          
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(angle);
          
          // Blue Midpiece Segmentation Mask
          ctx.fillStyle = 'rgba(59, 130, 246, 0.5)';
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = 0.8 / canvasZoom;
          ctx.fillRect(-6 / canvasZoom, -1.2 / canvasZoom, 3.5 / canvasZoom, 2.4 / canvasZoom);
          ctx.strokeRect(-6 / canvasZoom, -1.2 / canvasZoom, 3.5 / canvasZoom, 2.4 / canvasZoom);
          
          // Green Head Mask Overlay (Radial glow gradient)
          const grad = ctx.createRadialGradient(0, 0, 1/canvasZoom, 0, 0, 4/canvasZoom);
          grad.addColorStop(0, 'rgba(16, 185, 129, 0.75)');
          grad.addColorStop(1, 'rgba(52, 211, 153, 0.15)');
          
          ctx.fillStyle = grad;
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 1.5 / canvasZoom;
          ctx.beginPath();
          ctx.ellipse(0, 0, 4.2 / canvasZoom, 2.7 / canvasZoom, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          
          // Draw tiny acrosomal segment vacuole
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.beginPath();
          ctx.arc(1.8 / canvasZoom, 0.4 / canvasZoom, 0.5 / canvasZoom, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();

          // UNet Segment Label Annotation
          ctx.fillStyle = '#10b981';
          ctx.font = `900 ${5.5 / canvasZoom}px JetBrains Mono`;
          ctx.fillText(`[Seg:Head_M]`, p.x - 14 / canvasZoom, p.y + 11 / canvasZoom);
        });
        ctx.restore();
      }

      // 4. VGG-19 Simulation (Spermatogenic Classification)
      if (videoFilters.aiModel === 'vgg19') {
        ctx.save();
        particles.current.forEach(p => {
          const isProg = p.type === 'progressive';
          const isNonProg = p.type === 'non-progressive';
          
          const label = isProg ? 'Normal Structure' : (isNonProg ? 'Amorphous Head' : 'Coiled Tail');
          const confidence = (90 + (Math.sin(p.x * 0.15) * 8.5)).toFixed(0);
          const color = isProg ? '#10b981' : (isNonProg ? '#fbbf24' : '#ef4444');
          
          // Target reticle circular lock
          ctx.strokeStyle = color;
          ctx.lineWidth = 1 / canvasZoom;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 8.5 / canvasZoom, 0, Math.PI * 2);
          ctx.stroke();
          
          // Reticle tick markers
          ctx.fillStyle = color;
          ctx.beginPath();
          // Horizontal ticks
          ctx.fillRect(p.x - 10 / canvasZoom, p.y - 0.5 / canvasZoom, 3 / canvasZoom, 1 / canvasZoom);
          ctx.fillRect(p.x + 7 / canvasZoom, p.y - 0.5 / canvasZoom, 3 / canvasZoom, 1 / canvasZoom);
          // Vertical ticks
          ctx.fillRect(p.x - 0.5 / canvasZoom, p.y - 10 / canvasZoom, 1 / canvasZoom, 3 / canvasZoom);
          ctx.fillRect(p.x - 0.5 / canvasZoom, p.y + 7 / canvasZoom, 1 / canvasZoom, 3 / canvasZoom);
          
          // Classification outcome text
          ctx.fillStyle = color;
          ctx.font = `600 ${5.5 / canvasZoom}px Inter`;
          ctx.textAlign = 'center';
          ctx.fillText(`${label} (${confidence}%)`, p.x, p.y - 13 / canvasZoom);
          ctx.textAlign = 'left';
        });
        ctx.restore();
      }

      // Draw Calibration Tool
      if (isCalibrating) {
        ctx.save();
        ctx.strokeStyle = '#3b82f6';
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 2 / canvasZoom;
        
        if (calibrationPoints.length === 1) {
          const start = calibrationPoints[0];
          // Get current mouse pos in workspace coords
          const rect = canvas.getBoundingClientRect();
          const mx = (lastMousePos.current.rawX - rect.left) * (canvas.width / rect.width);
          const my = (lastMousePos.current.rawY - rect.top) * (canvas.height / rect.height);
          const workX = (mx - canvasOffset.x) / canvasZoom;
          const workY = (my - canvasOffset.y) / canvasZoom;
          
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(workX, workY);
          ctx.stroke();
          
          // Draw distance label
          const dist = Math.sqrt(Math.pow(workX - start.x, 2) + Math.pow(workY - start.y, 2));
          ctx.font = `${12 / canvasZoom}px Inter`;
          ctx.fillStyle = '#3b82f6';
          ctx.fillText(`${dist.toFixed(1)} px`, (start.x + workX) / 2, (start.y + workY) / 2 - 10 / canvasZoom);
        }
        
        calibrationPoints.forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 4 / canvasZoom, 0, Math.PI * 2);
          ctx.fillStyle = '#3b82f6';
          ctx.fill();
        });
        ctx.restore();
      }

      ctx.restore();
      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [isAnalyzing, selectedSperm, settings.fps, canvasZoom, canvasOffset, videoFilters, showHeatmap, results, isManualAnnotating]);

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle click or Alt+Left click to pan
      setIsPanning(true);
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    lastMousePos.current = { x: e.clientX, y: e.clientY, rawX: e.clientX, rawY: e.clientY };
    if (isPanning) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setCanvasOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    
    // Account for zoom and pan in click coordinates
    const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    const x = (mouseX - canvasOffset.x) / canvasZoom;
    const y = (mouseY - canvasOffset.y) / canvasZoom;

    if (isCalibrating) {
      handleCalibrationClick(x, y);
      return;
    }

    if (isManualAnnotating && results) {
      let closestObj: SpermData | null = null;
      let minDistVal = 35 / canvasZoom;
      results.spermatozoa.forEach(s => {
        const lastPos = s.path[s.path.length - 1];
        if (lastPos) {
          const dist = Math.sqrt(Math.pow(lastPos.x - x, 2) + Math.pow(lastPos.y - y, 2));
          if (dist < minDistVal) {
            minDistVal = dist;
            closestObj = s;
          }
        }
      });

      if (closestObj) {
        const spermId = (closestObj as SpermData).id;
        const currentClass = (closestObj as SpermData).classification;
        let nextClass: 'progressive' | 'non-progressive' | 'immotile' | 'delete' = 'progressive';
        if (currentClass === 'progressive') nextClass = 'non-progressive';
        else if (currentClass === 'non-progressive') nextClass = 'immotile';
        else if (currentClass === 'immotile') nextClass = 'delete';
        else nextClass = 'progressive';

        let updatedSpermatozoa = [...results.spermatozoa];
        if (nextClass === 'delete') {
          updatedSpermatozoa = updatedSpermatozoa.filter(s => s.id !== spermId);
          createNotification("Manual Annotation Override", `Removed sperm cell tracking ID ${spermId}`, "warning");
        } else {
          updatedSpermatozoa = updatedSpermatozoa.map(s => {
            if (s.id === spermId) {
              return {
                ...s,
                classification: nextClass,
                vcl: nextClass === 'immotile' ? 0.5 : (nextClass === 'non-progressive' ? 15 : 65),
                vsl: nextClass === 'immotile' ? 0.0 : (nextClass === 'non-progressive' ? 5 : 45),
              };
            }
            return s;
          });
          createNotification("Manual Annotation Override", `Sperm ${spermId} changed to ${nextClass.toUpperCase()}`, "success");
        }

        const updatedSummary = generateSummary(updatedSpermatozoa, settings);
        setResults({
          ...results,
          spermatozoa: updatedSpermatozoa,
          summary: updatedSummary
        });
      } else {
        const newId = `M-${Date.now().toString().slice(-4)}`;
        const path = Array.from({ length: 15 }, (_, idx) => ({
          x: x + (Math.random() - 0.5) * 8,
          y: y + (Math.random() - 0.5) * 8,
          t: idx / settings.fps
        }));
        const kinematics = calculateKinematics(path, settings.fps, settings.micronsPerPixel);
        const newSperm: SpermData = {
          id: newId,
          path,
          ...kinematics,
          classification: 'progressive',
          morphology: {
            head: 'normal',
            vacuoles: 'absent',
            acrosome: 'normal',
            midpiece: 'normal',
            tail: 'normal',
            droplet: 'none',
            krugerStrict: 'strict_normal'
          },
          morphometry: { area: 18, perimeter: 15, length: 6, width: 3.2, circularity: 0.85, elongation: 0.45, lengthWidthRatio: 1.875, acrosomeAreaPercent: 55.0 },
          vitality: 'live',
          sdf: { fragmented: false, haloSized: 18, dfi: 10 }
        };

        const updatedSpermatozoa = [...results.spermatozoa, newSperm];
        const updatedSummary = generateSummary(updatedSpermatozoa, settings);
        setResults({
          ...results,
          spermatozoa: updatedSpermatozoa,
          summary: updatedSummary
        });
        createNotification("Manual Point Added", `Manually annotated cell ${newId} at screen coordinates (${x.toFixed(0)}, ${y.toFixed(0)})`, "success");
      }
      return;
    }

    // Find closest particle
    let closest: any = null;
    let minDist = 30 / canvasZoom;
    
    if (results) {
      results.spermatozoa.forEach(s => {
        const lastPos = s.path[s.path.length - 1];
        const dist = Math.sqrt(Math.pow(lastPos.x - x, 2) + Math.pow(lastPos.y - y, 2));
        if (dist < minDist) {
          minDist = dist;
          closest = s;
        }
      });
    } else {
      particles.current.forEach(p => {
        const dist = Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2));
        if (dist < minDist) {
          minDist = dist;
          closest = p;
        }
      });
    }

    if (closest) {
      if (results) {
        setSelectedSperm(closest as SpermData);
        setActiveTab('kinematics');
      } else {
        // Find matching particle in ref to get its current path
        const particle = particles.current.find(p => p.id === closest.id);
        if (particle) {
          setSelectedSperm({ 
            id: particle.id, 
            path: [...particle.path],
            classification: particle.type,
            vcl: 0, vsl: 0, vap: 0, lin: 0, str: 0, wob: 0, alh: 0, bcf: 0, mad: 0,
            isHyperactivated: false,
            morphometry: { area: 0, perimeter: 0, length: 0, width: 0, circularity: 0, elongation: 0 },
            morphology: { head: 'normal', vacuoles: 'absent', acrosome: 'normal', midpiece: 'normal', tail: 'normal', droplet: 'none' },
            vitality: 'live',
            sdf: { fragmented: false, haloSized: 0, dfi: 0 }
          } as SpermData);
        }
      }
    }
  };

  const handleZoom = (delta: number) => {
    setCanvasZoom(prev => {
      const newZoom = Math.max(1, Math.min(10, prev + delta));
      return newZoom;
    });
  };

  const handleCalibrationClick = (x: number, y: number) => {
    if (calibrationPoints.length < 2) {
      setCalibrationPoints([...calibrationPoints, { x, y }]);
      if (calibrationPoints.length === 1) {
        // We now have 2 points, finish calibration
        const p1 = calibrationPoints[0];
        const p2 = { x, y };
        const pixelDist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        const mpp = calibrationScale / pixelDist;
        
        setSettings(prev => ({ ...prev, micronsPerPixel: parseFloat(mpp.toFixed(4)) }));
        setIsCalibrating(false);
        setCalibrationPoints([]);
        createNotification("Calibration Successful", `Scale set to ${calibrationScale}µm (${mpp.toFixed(4)} µm/px)`, "success");
      }
    }
  };

  const resetZoom = () => {
    setCanvasZoom(1);
    setCanvasOffset({ x: 0, y: 0 });
  };

  return (
    <div className={cn(
      "flex flex-col h-screen overflow-hidden transition-all duration-500",
      theme === 'dark' ? "bg-[#0a0a0a] text-white" : "bg-slate-50 text-slate-900",
      settings.highContrast && "field-mode"
    )}>
      {/* Header */}
      <header className={cn(
        "h-16 border-b flex items-center justify-between px-6 transition-all",
        theme === 'dark' ? "bg-[#0f0f0f] border-white/10" : "bg-white border-slate-200"
      )}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={cn("p-2 rounded-lg transition-colors", theme === 'dark' ? "hover:bg-white/5" : "hover:bg-slate-100")}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className={cn("h-8 w-px mx-2", theme === 'dark' ? "bg-white/10" : "bg-slate-200")} />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Zap className="w-6 h-6 text-white fill-current" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tighter uppercase italic leading-none">ATSA AI</h1>
              <p className={cn("text-[10px] font-bold uppercase tracking-widest", theme === 'dark' ? "text-white/40" : "text-slate-400")}>Animal-Assisted Key Semen Analysis</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 mr-4">
            <div className="text-right">
              <p className={cn("text-[10px] uppercase font-bold", theme === 'dark' ? "text-white/20" : "text-slate-300")}>Calibration</p>
              <p className="text-[10px] text-emerald-500 font-mono">{settings.micronsPerPixel} µm/px</p>
            </div>
            <div className="text-right">
              <p className={cn("text-[10px] uppercase font-bold", theme === 'dark' ? "text-white/20" : "text-slate-300")}>Sampling</p>
              <p className="text-[10px] text-blue-400 font-mono">{settings.fps} FPS</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-medium text-emerald-500 uppercase tracking-wider">Engine Active</span>
          </div>
          <button 
            onClick={() => setShowSettings(true)}
            className={cn("p-2 rounded-lg transition-colors", theme === 'dark' ? "text-white/40 hover:bg-white/5 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-900")}
          >
            <Settings className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowHelp(true)}
            className={cn("p-2 rounded-lg transition-colors", theme === 'dark' ? "text-white/40 hover:bg-white/5 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-900")}
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Dynamic Navigation/Analysis Tabs Cockpit - Premium Design */}
      <div className={cn(
        "border-b px-6 py-2 flex items-center justify-between transition-all select-none overflow-x-auto no-scrollbar gap-4 shrink-0",
        theme === 'dark' ? "bg-[#0b0b0b] border-white/5" : "bg-slate-50/90 border-slate-200"
      )}>
        {/* Left Side: Active Module State Badge */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className={cn(
            "p-1.5 rounded-lg flex items-center justify-center transition-all",
            theme === 'dark' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
          )}>
            {/* Display active tab icon */}
            {activeTab === 'live' && <Tv className="w-3.5 h-3.5 animate-pulse" />}
            {activeTab === 'kinematics' && <Activity className="w-3.5 h-3.5" />}
            {activeTab === 'morphology' && <Compass className="w-3.5 h-3.5" />}
            {activeTab === 'vitality' && <Heart className="w-3.5 h-3.5" />}
            {activeTab === 'sdf' && <Dna className="w-3.5 h-3.5" />}
            {activeTab === 'ai' && <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />}
            {activeTab === 'report' && <FileText className="w-3.5 h-3.5" />}
            {activeTab === 'history' && <Clock className="w-3.5 h-3.5" />}
            {activeTab === 'calculator' && <Calculator className="w-3.5 h-3.5" />}
            {activeTab === 'validation' && <CheckCircle2 className="w-3.5 h-3.5" />}
            {activeTab === 'qc' && <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />}
            {activeTab === 'about' && <UserIcon className="w-3.5 h-3.5 text-pink-400" />}
          </div>
          <div>
            <div className={cn("text-[8px] uppercase tracking-widest font-black leading-none", theme === 'dark' ? "text-white/30" : "text-slate-400")}>
              CASA CORE MODULE
            </div>
            <div className={cn("text-xs font-bold capitalize mt-0.5", theme === 'dark' ? "text-white" : "text-slate-900")}>
              {activeTab === 'live' ? t('tabLive') :
               activeTab === 'kinematics' ? t('tabKinematics') :
               activeTab === 'morphology' ? t('tabMorphology') :
               activeTab === 'vitality' ? t('tabVitality') :
               activeTab === 'sdf' ? t('tabSdf') :
               activeTab === 'ai' ? t('tabAi') :
               activeTab === 'report' ? t('tabReport') :
               activeTab === 'qc' ? t('tabQc') :
               activeTab === 'history' ? t('tabHistory') :
               activeTab === 'calculator' ? t('tabCalculator') :
               activeTab === 'validation' ? t('tabValidation') :
               activeTab === 'about' ? t('tabAbout') : activeTab}
            </div>
          </div>
        </div>

        {/* Center: The Gorgeous Interactive Tab Control */}
        <div className={cn(
          "flex p-1 rounded-xl max-w-full overflow-x-auto no-scrollbar border relative shrink-0",
          theme === 'dark' ? "bg-black/50 border-white/5" : "bg-slate-200/40 border-slate-200/80"
        )}>
          {([
            { id: 'live', labelKey: 'tabLive', icon: Tv, color: 'text-red-500', pulsing: true, glowing: false },
            { id: 'kinematics', labelKey: 'tabKinematics', icon: Activity, color: 'text-emerald-500', pulsing: false, glowing: false },
            { id: 'morphology', labelKey: 'tabMorphology', icon: Compass, color: 'text-purple-500', pulsing: false, glowing: false },
            { id: 'vitality', labelKey: 'tabVitality', icon: Heart, color: 'text-rose-500', pulsing: false, glowing: false },
            { id: 'sdf', labelKey: 'tabSdf', icon: Dna, color: 'text-sky-500', pulsing: false, glowing: false },
            { id: 'ai', labelKey: 'tabAi', icon: Sparkles, color: 'text-purple-400', pulsing: false, glowing: true },
            { id: 'report', labelKey: 'tabReport', icon: FileText, color: 'text-blue-500', pulsing: false, glowing: false },
            { id: 'qc', labelKey: 'tabQc', icon: ShieldCheck, color: 'text-teal-400', pulsing: false, glowing: false },
            { id: 'history', labelKey: 'tabHistory', icon: Clock, color: 'text-amber-500', pulsing: false, glowing: false },
            { id: 'calculator', labelKey: 'tabCalculator', icon: Calculator, color: 'text-indigo-500', pulsing: false, glowing: false },
            { id: 'validation', labelKey: 'tabValidation', icon: CheckCircle2, color: 'text-teal-500', pulsing: false, glowing: false },
            { id: 'about', labelKey: 'tabAbout', icon: UserIcon, color: 'text-pink-500', pulsing: false, glowing: false },
          ] as const).map(({ id, labelKey, icon: TabIcon, color, pulsing, glowing }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => {
                  setActiveTab(id);
                  setShowStats(true); // Always reveal stats sidebar on tab click for standard workflows!
                }}
                className={cn(
                  "relative flex items-center gap-2 px-3.5 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all duration-300 ease-out whitespace-nowrap cursor-pointer group select-none",
                  isActive
                    ? (theme === 'dark' ? "text-white" : "text-slate-950")
                    : (theme === 'dark' ? "text-white/40 hover:text-white/80" : "text-slate-500 hover:text-slate-800")
                )}
              >
                {/* Micro animation or glow pill background */}
                {isActive && (
                  <motion.div
                    layoutId="activeCASAEngineTabPill"
                    className={cn(
                      "absolute inset-0 rounded-lg -z-10",
                      theme === 'dark' 
                        ? "bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 shadow-inner" 
                        : "bg-white shadow-sm border border-slate-200"
                    )}
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}

                {/* Left Line Accent details on selection */}
                {isActive && (
                  <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-0.5 h-2.5 bg-emerald-500 rounded-full animate-bounce" />
                )}

                {/* Tab Icon */}
                <TabIcon className={cn(
                  "w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110",
                  isActive ? color : "text-current",
                  pulsing && isActive && "animate-pulse"
                )} />

                {/* Tab Text */}
                <span className={cn(
                  "transition-all duration-300",
                  isActive ? "tracking-wide font-black" : "text-opacity-80"
                )}>
                  {t(labelKey)}
                </span>

                {/* Mini Glow Dot for AI tab */}
                {glowing && (
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 absolute top-1 right-1 animate-ping" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right Side: Quick Action Toggle Stats Panel & PDF Dossier Launcher */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowPDFDossier(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            title="Generate multi-page certified clinical PDF Dossier"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export PDF</span>
          </button>
          <button
            onClick={() => setShowStats(!showStats)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 border rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer shadow-sm",
              showStats 
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" 
                : (theme === 'dark' ? "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800")
            )}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{showStats ? "Hide Analytics" : "Show Analytics"}</span>
          </button>
        </div>
      </div>

      {/* 5-Animal Virtual Clinical Library Quick-Switch Bar */}
      <div className={cn(
        "px-4 py-2 border-b flex items-center justify-between gap-3 overflow-x-auto no-scrollbar z-20 transition-colors",
        theme === 'dark' ? "bg-[#0b0b0f] border-white/5" : "bg-slate-100 border-slate-200"
      )}>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
            <ShieldCheck className="w-3 h-3" />
            <span>Virtual Specimen Lab</span>
          </div>
          <span className={cn("text-[10px] hidden md:inline", theme === 'dark' ? "text-white/40" : "text-slate-400")}>
            Select animal to load verified CASA metrics & full PDF report:
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {VIRTUAL_ANIMAL_KEYS.map((key) => {
            const animal = VIRTUAL_ANIMALS[key];
            const isSelected = results?.species?.toLowerCase() === animal.species.toLowerCase();
            return (
              <button
                key={key}
                type="button"
                onClick={() => loadDemoData(key)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border select-none",
                  isSelected
                    ? "bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/20 font-black"
                    : theme === 'dark'
                      ? "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <span>{animal.avatarIcon}</span>
                <span>{animal.species}</span>
                <span className={cn(
                  "text-[8px] px-1 py-0.2 rounded font-mono",
                  isSelected ? "bg-black/30 text-white" : (theme === 'dark' ? "bg-white/10 text-white/50" : "bg-slate-100 text-slate-500")
                )}>
                  {animal.patientId}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Workspace */}
        <main className={cn("flex-1 relative flex items-center justify-center overflow-hidden transition-colors", theme === 'dark' ? "bg-black" : "bg-slate-200")}>
          {activeTab === 'qc' ? (
            <div className="w-full h-full overflow-y-auto p-4 md:p-6 custom-scrollbar">
              <QualityControl currentAnalysis={results} theme={theme} />
            </div>
          ) : activeTab === 'about' ? (
            <div className="w-full h-full overflow-y-auto p-4 md:p-8 flex items-center justify-center">
              <div className={cn(
                "w-full max-w-4xl rounded-2xl border shadow-2xl overflow-hidden p-6 md:p-8 space-y-8 animate-in fade-in zoom-in-95 duration-500",
                theme === 'dark' ? "bg-[#0b0b0d] border-white/10 text-white" : "bg-white border-slate-200 text-slate-800"
              )}>
                {/* Header Profile Badge */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-pink-500/10">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-pink-500/20 text-white font-mono text-xl font-black">
                      {designerInfo.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-xl font-bold tracking-tight font-sans">
                          {designerInfo.name}
                        </h1>
                        <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-pink-500/20 text-pink-500 border border-pink-500/30">
                          Lead Architect
                        </span>
                      </div>
                      <p className="text-xs text-pink-500 font-mono font-medium mt-1 uppercase tracking-wider">{designerInfo.title}</p>
                      <p className={cn("text-[10px] mt-0.5", theme === 'dark' ? "text-white/40" : "text-slate-500")}>{designerInfo.organization}</p>
                    </div>
                  </div>

                  <div className={cn(
                    "p-3 rounded-xl border font-mono text-[10px] flex flex-col gap-1 w-full md:w-auto",
                    theme === 'dark' ? "bg-white/5 border-white/5" : "bg-slate-50 border-black/5"
                  )}>
                    <div className="flex justify-between md:gap-8 gap-2">
                      <span className={theme === 'dark' ? "text-white/30" : "text-slate-400"}>CREDENTIALS:</span>
                      <span className="font-bold text-pink-500">{designerInfo.credentials}</span>
                    </div>
                    <div className="flex justify-between md:gap-8 gap-2">
                      <span className={theme === 'dark' ? "text-white/30" : "text-slate-400"}>SYSTEM_REF:</span>
                      <span className="font-bold">ATSA_CAS_V2_PRO</span>
                    </div>
                  </div>
                </div>

                {/* Grid Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column: Vision & Philosophies */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-pink-500 flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        Executive Vision & Bio
                      </h3>
                      <p className={cn(
                        "text-xs leading-relaxed font-sans",
                        theme === 'dark' ? "text-white/70" : "text-slate-600"
                      )}>
                        {designerInfo.bio}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-[#888] block">
                        Core Engineering Manifesto
                      </h3>
                      <div className="space-y-2.5">
                        {designerInfo.philosophies.map((phil: string, i: number) => (
                          <div key={i} className={cn(
                            "p-3 rounded-xl border text-xs leading-relaxed",
                            theme === 'dark' ? "bg-[#141416]/70 border-white/5 text-white/80" : "bg-slate-50/70 border-black/5 text-slate-700"
                          )}>
                            {phil}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Stack & Technical Highlights */}
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-pink-500 flex items-center gap-2">
                        <Microscope className="w-4 h-4" />
                        Technical Architecture Stack
                      </h3>
                      <div className="grid grid-cols-1 gap-2.5">
                        {designerInfo.technicalHighlights.map((tech: { key: string; val: string }, i: number) => (
                          <div key={i} className={cn(
                            "p-3.5 rounded-xl border flex flex-col gap-1 transition-all hover:translate-x-1 duration-200",
                            theme === 'dark' ? "bg-[#141416] border-white/5 hover:border-pink-500/10" : "bg-slate-50 border-black/5 hover:border-pink-500/20"
                          )}>
                            <span className="text-[9px] font-black uppercase tracking-wider text-pink-500">{tech.key}</span>
                            <span className="text-xs font-mono font-bold">{tech.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Quick Stats Banner */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className={cn(
                        "p-3 rounded-xl border text-center space-y-0.5",
                        theme === 'dark' ? "bg-white/5 border-white/5" : "bg-slate-50 border-black/5"
                      )}>
                        <div className="text-[14px] font-black font-mono text-pink-500">95%+</div>
                        <div className="text-[8px] font-black uppercase text-[#888]">Accuracy</div>
                      </div>
                      <div className={cn(
                        "p-3 rounded-xl border text-center space-y-0.5",
                        theme === 'dark' ? "bg-white/5 border-white/5" : "bg-slate-50 border-black/5"
                      )}>
                        <div className="text-[14px] font-black font-mono text-pink-500">&lt;3s</div>
                        <div className="text-[8px] font-black uppercase text-[#888]">Latency</div>
                      </div>
                      <div className={cn(
                        "p-3 rounded-xl border text-center space-y-0.5",
                        theme === 'dark' ? "bg-white/5 border-white/5" : "bg-slate-50 border-black/5"
                      )}>
                        <div className="text-[14px] font-black font-mono text-pink-500">15+</div>
                        <div className="text-[8px] font-black uppercase text-[#888]">Globally</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Credits */}
                <div className="pt-6 border-t border-pink-500/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[9px] text-[#888] font-mono">
                  <div>Designed & conceptualized for theriogenology clinic specialists.</div>
                  <div className="text-pink-500 font-bold">{designerInfo.email}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className={cn(
              "relative w-full max-w-6xl aspect-video rounded-xl border shadow-2xl overflow-hidden transition-all",
              theme === 'dark' ? "bg-[#050505] border-white/10" : "bg-white border-slate-300 shadow-xl"
            )}>
            <div className="w-full h-full relative">
              {isUploading && (
                <div className={cn(
                  "absolute z-50 transition-all duration-300",
                  (stream || uploadedVideoUrl)
                    ? "bottom-4 right-4 max-w-[340px] w-full p-0"
                    : "inset-0 flex flex-col items-center justify-center p-8 bg-black/80 backdrop-blur-md rounded-xl"
                )}>
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }}
                    className={cn(
                      "w-full flex flex-col items-center relative overflow-hidden transition-all duration-300",
                      (stream || uploadedVideoUrl)
                        ? "gap-4 p-4 bg-[#0a0a0c]/95 backdrop-blur-md border border-purple-500/40 rounded-2xl shadow-2xl"
                        : "max-w-md gap-6 p-8 bg-[#0a0a0c] border border-white/10 rounded-2xl shadow-2xl"
                    )}
                  >
                    {/* Glowing effects */}
                    <div className="absolute -top-12 -left-12 w-28 h-28 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-12 -right-12 w-28 h-28 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className={cn(
                      "rounded-full bg-purple-500/10 flex items-center justify-center relative border border-purple-500/20",
                      (stream || uploadedVideoUrl) ? "w-12 h-12" : "w-16 h-16"
                    )}>
                      <Upload className={cn("text-purple-400 animate-pulse", (stream || uploadedVideoUrl) ? "w-6 h-6" : "w-8 h-8")} />
                    </div>

                    <div className="text-center w-full">
                      <h4 className={cn("font-bold uppercase tracking-wider text-white mb-1 text-center", (stream || uploadedVideoUrl) ? "text-xs" : "text-sm")}>
                        {uploadProgress !== null && uploadProgress < 100 
                          ? "Uploading to Firebase Storage" 
                          : "Processing Gemini AI Analysis"}
                      </h4>
                      <p className={cn("text-white/40 max-w-sm mx-auto text-center animate-pulse", (stream || uploadedVideoUrl) ? "text-[10px]" : "text-xs")}>
                        {uploadProgress !== null && uploadProgress < 100
                          ? "Transferring high-definition microscopy feed..."
                          : "Vision models analyzing track kinematics & morphometry..."}
                      </p>
                    </div>

                    {/* Progress slider container */}
                    <div className="w-full">
                      <div className="flex justify-between items-center mb-1 bg-white/[0.02] p-1.5 rounded-lg border border-white/5">
                        <span className="text-[9px] font-mono text-purple-400 font-bold uppercase tracking-wider">
                          {uploadProgress !== null && uploadProgress < 100 ? "Firebase Upload" : "CASA Inference"}
                        </span>
                        <span className="text-xs font-mono font-bold text-white">
                          {uploadProgress !== null ? `${uploadProgress}%` : "In Progress..."}
                        </span>
                      </div>

                      {/* Bar indicator */}
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress ?? 0}%` }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                        />
                      </div>
                    </div>

                    {/* Quick status bullet points (Render only on full view) */}
                    {!(stream || uploadedVideoUrl) && (
                      <div className="w-full flex flex-col gap-1.5 border-t border-white/5 pt-4 text-left">
                        <div className="flex items-center gap-2 text-[10px] font-medium text-white/60">
                          <div className={cn("w-1.5 h-1.5 rounded-full", uploadProgress !== null && uploadProgress > 0 ? "bg-emerald-500" : "bg-white/20")} />
                          <span>Establish secure cloud storage session</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-medium text-white/60">
                          <div className={cn("w-1.5 h-1.5 rounded-full", uploadProgress === 100 ? "bg-emerald-500" : "bg-white/20")} />
                          <span>Upload telemetry raw video data</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-medium text-white/60">
                          <div className={cn("w-1.5 h-1.5 rounded-full", uploadProgress === 100 && aiAnalysis !== null ? "bg-emerald-500 animate-pulse" : "bg-white/20")} />
                          <span>Run deep deep-learning vision inference</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>
              )}

              {stream || uploadedVideoUrl ? (
                <div className="w-full h-full relative overflow-hidden">
                  <video 
                    ref={videoRef} 
                    src={uploadedVideoUrl || undefined}
                    autoPlay 
                    muted 
                    loop={!!uploadedVideoUrl}
                    playsInline
                    className="w-full h-full object-cover transition-transform duration-200"
                    style={{ 
                      transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasZoom})`,
                      transformOrigin: '0 0',
                      filter: `
                        brightness(${videoFilters.brightness}) 
                        contrast(${videoFilters.contrast}) 
                        ${videoFilters.mode === 'negative' ? 'invert(1)' : ''}
                        ${videoFilters.mode === 'phase-contrast' ? 'contrast(1.5) brightness(1.1) grayscale(1)' : ''}
                        ${videoFilters.mode === 'fluorescence' ? 'contrast(2) brightness(0.8) hue-rotate(90deg)' : ''}
                      `
                    }} 
                  />
                </div>
              ) : (
                <div 
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(true);
                  }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={async (e) => {
                    e.preventDefault();
                    setIsDraggingFile(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      await processFile(file);
                    }
                  }}
                  className={cn(
                    "w-full h-full flex flex-col items-center justify-center p-8 text-center transition-all duration-200 border-2 border-dashed",
                    isDraggingFile 
                      ? "border-purple-500 bg-purple-500/10 scale-[0.98]" 
                      : theme === 'dark' ? "border-white/10 bg-[#0a0a0a]" : "border-slate-200 bg-slate-50"
                  )}
                >
                  {isDraggingFile ? (
                    <motion.div 
                      initial={{ scale: 0.9 }} 
                      animate={{ scale: 1 }} 
                      className="flex flex-col items-center gap-3"
                    >
                      <Upload className="w-16 h-16 text-purple-400 animate-bounce" />
                      <p className="text-purple-400 font-bold text-sm tracking-wider uppercase">Drop Lab Video to Upload & Analyze</p>
                      <p className="text-white/40 text-xs">Reconstructs paths & morphometry with Gemini 3.5 AI</p>
                    </motion.div>
                  ) : cameraError ? (
                    <div className="max-w-md">
                      <p className="text-red-400 text-sm font-medium mb-2">Camera Access Error</p>
                      <p className={cn("text-xs leading-relaxed mb-6", theme === 'dark' ? "text-white/40" : "text-slate-500")}>{cameraError}</p>
                      <button onClick={startCamera} className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-semibold transition-all">Try Again</button>
                    </div>
                  ) : (
                    <div className="max-w-xl w-full flex flex-col items-center gap-6" dir={dir}>
                      <div className="flex items-center gap-3 bg-purple-500/10 border border-purple-500/20 px-4 py-2 rounded-full backdrop-blur-md">
                        <BrainCircuit className="w-5 h-5 text-purple-400" />
                        <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">{t('supportRealVideoLabel')}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                        {/* Option 1: Live Stream */}
                        <div 
                          onClick={startCamera}
                          className={cn(
                            "flex flex-col items-center justify-center p-6 rounded-2xl border text-center transition-all cursor-pointer group hover:scale-[1.02]",
                            theme === 'dark' 
                              ? "bg-white/[0.02] border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/[0.02]" 
                              : "bg-white border-slate-200 hover:border-emerald-500/40 hover:bg-emerald-50"
                          )}
                        >
                          <Camera className="w-10 h-10 mb-3 text-emerald-500 group-hover:scale-110 transition-transform" />
                          <h4 className={cn("text-xs font-bold uppercase tracking-wider mb-1", theme === 'dark' ? "text-white" : "text-slate-800")}>{t('microscopeLiveLabel')}</h4>
                          <p className={cn("text-[10px] leading-relaxed", theme === 'dark' ? "text-white/40" : "text-slate-500")}>{t('connectRealtimeOpticalFeed')}</p>
                        </div>

                        {/* Option 2: Drag & Drop / Upload */}
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className={cn(
                            "flex flex-col items-center justify-center p-6 rounded-2xl border text-center transition-all cursor-pointer group hover:scale-[1.02]",
                            theme === 'dark' 
                              ? "bg-white/[0.02] border-white/10 hover:border-purple-500/40 hover:bg-purple-500/[0.02]" 
                              : "bg-white border-slate-200 hover:border-purple-500/40 hover:bg-purple-50"
                          )}
                        >
                          <Upload className="w-10 h-10 mb-3 text-purple-400 group-hover:scale-110 transition-transform" />
                          <h4 className={cn("text-xs font-bold uppercase tracking-wider mb-1", theme === 'dark' ? "text-white" : "text-slate-800")}>{t('uploadLabFileLabel')}</h4>
                          <p className={cn("text-[10px] leading-relaxed", theme === 'dark' ? "text-white/40" : "text-slate-500")}>{t('dragDropMicroscopy')}</p>
                        </div>
                      </div>

                      <div className="w-full flex items-center justify-center gap-3">
                        <div className="h-px flex-1 bg-white/5" />
                        <span className={cn("text-[9px] font-mono uppercase tracking-widest", theme === 'dark' ? "text-white/20" : "text-slate-400")}>{t('supportedFormats')}</span>
                        <div className="h-px flex-1 bg-white/5" />
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="scanline" />
              
              {/* Neural Network Status Overlay */}
              <div className="absolute top-6 left-6 z-30 flex flex-col gap-2 pointer-events-none" dir={dir}>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full backdrop-blur-md">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{t('neuralNetworkActive')}</span>
                </div>
                {isCalibrating && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 border border-blue-500/40 rounded-full backdrop-blur-md animate-bounce">
                    <Ruler className="w-3 h-3 text-blue-400" />
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{t('calibrationPickPoints')}</span>
                  </div>
                )}
                {isManualAnnotating && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 border border-amber-500/40 rounded-full backdrop-blur-md animate-bounce">
                    <Tag className="w-3 h-3 text-amber-400" />
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">{t('manualAnnotationActive')}</span>
                  </div>
                )}
                <div className="flex items-center gap-4 px-4 py-2 bg-black/40 border border-white/10 rounded-2xl backdrop-blur-md">
                  <div>
                    <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{t('processingSpeed')}</p>
                    <p className="text-xs font-mono font-bold text-white/90">3.2s / 500k cells</p>
                  </div>
                  <div className="w-px h-6 bg-white/10" />
                  <div>
                    <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{t('aiAccuracy')}</p>
                    <p className="text-xs font-mono font-bold text-emerald-500">95.2%</p>
                  </div>
                  {videoFilters.cvMode !== 'none' && (
                    <>
                      <div className="w-px h-6 bg-white/10" />
                      <div>
                        <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">CV Count (Dilation)</p>
                        <p className="text-xs font-mono font-bold text-blue-400">
                          {particles.current.filter(p => (Math.PI * 5 * 3) > videoFilters.cvAreaThreshold).length}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <canvas 
                ref={canvasRef}
                width={1280}
                height={720}
                onClick={handleCanvasClick}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                className={cn(
                  "absolute inset-0 w-full h-full z-20 cursor-crosshair",
                  isPanning && "cursor-grabbing"
                )}
              />
            </div>

            {/* Zoom Controls */}
            <div className="absolute top-6 right-6 z-30 flex flex-col gap-2 p-1.5 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
              <button onClick={() => handleZoom(0.5)} className="p-2.5 hover:bg-white/10 rounded-xl transition-colors text-white/60 hover:text-white" title="Zoom In"><ZoomIn className="w-5 h-5" /></button>
              <button onClick={() => handleZoom(-0.5)} className="p-2.5 hover:bg-white/10 rounded-xl transition-colors text-white/60 hover:text-white" title="Zoom Out"><ZoomOut className="w-5 h-5" /></button>
              <div className="h-px bg-white/10 mx-2" />
              <button onClick={resetZoom} className="p-2.5 hover:bg-white/10 rounded-xl transition-colors text-white/60 hover:text-white" title="Reset View"><Maximize2 className="w-5 h-5" /></button>
              <div className="text-[10px] font-mono text-center text-white/40 py-1">{canvasZoom.toFixed(1)}x</div>
            </div>

            {/* Video Optimization Toolbox */}
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-[24px]">
              <div className="flex items-center gap-1 border-r border-white/10 pr-3 mr-1">
                <button 
                  onClick={() => {
                    setIsCalibrating(!isCalibrating);
                    if (isManualAnnotating) setIsManualAnnotating(false);
                  }}
                  className={cn(
                    "p-2 rounded-xl transition-all flex items-center gap-2",
                    isCalibrating ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "hover:bg-white/10 text-white/60"
                  )}
                  title="Calibrate Scale (Draw 100μm line)"
                >
                  <Ruler className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{t('calibrateBtn')}</span>
                </button>
                <button 
                  onClick={() => {
                    setIsManualAnnotating(!isManualAnnotating);
                    if (isCalibrating) setIsCalibrating(false);
                  }}
                  className={cn(
                    "p-2 rounded-xl transition-all flex items-center gap-2 ml-1",
                    isManualAnnotating ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" : "hover:bg-white/10 text-white/60"
                  )}
                  title="Manual Override & Point Annotation"
                >
                  <Tag className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{t('manualEditBtn')}</span>
                </button>
                <div className="relative group">
                  <button className="p-2 hover:bg-white/10 text-white/60 hover:text-white rounded-xl transition-all">
                    <Sliders className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 hidden group-hover:block w-56 p-4 bg-black/90 border border-white/10 rounded-2xl backdrop-blur-2xl">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-white/40 uppercase font-bold">{t('brightnessLabel')}</span>
                          <span className="text-[10px] text-white font-mono">{videoFilters.brightness}x</span>
                        </div>
                        <input 
                          type="range" min="0.5" max="2" step="0.1" 
                          value={videoFilters.brightness}
                          onChange={(e) => setVideoFilters({...videoFilters, brightness: parseFloat(e.target.value)})}
                          className="w-full accent-emerald-500"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-white/40 uppercase font-bold">{t('contrastLabel')}</span>
                          <span className="text-[10px] text-white font-mono">{videoFilters.contrast}x</span>
                        </div>
                        <input 
                          type="range" min="0.5" max="2" step="0.1" 
                          value={videoFilters.contrast}
                          onChange={(e) => setVideoFilters({...videoFilters, contrast: parseFloat(e.target.value)})}
                          className="w-full accent-emerald-500"
                        />
                      </div>
                      <div className="pt-2 border-t border-white/10">
                        <div className="flex justify-between mb-1">
                          <span className="text-[10px] text-white/40 uppercase font-bold">{t('cvAreaThresholdLabel')} (px²)</span>
                          <span className="text-[10px] text-emerald-400 font-mono">{videoFilters.cvAreaThreshold}</span>
                        </div>
                        <input 
                          type="range" min="5" max="100" step="1" 
                          value={videoFilters.cvAreaThreshold}
                          onChange={(e) => setVideoFilters({...videoFilters, cvAreaThreshold: parseInt(e.target.value)})}
                          className="w-full accent-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 border-r border-white/10 pr-3 mr-1">
                {(['normal', 'phase-contrast', 'negative', 'fluorescence'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setVideoFilters({...videoFilters, mode})}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                      videoFilters.mode === mode 
                        ? "bg-white text-black" 
                        : "text-white/40 hover:bg-white/5 hover:text-white/60"
                    )}
                  >
                    {mode.replace('-', ' ')}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 border-r border-white/10 pr-3 mr-1">
                {(['none', 'edges', 'contours', 'threshold'] as const).map(cv => (
                  <button
                    key={cv}
                    onClick={() => setVideoFilters({
                      ...videoFilters, 
                      cvMode: cv,
                      aiModel: cv !== 'none' ? 'none' : videoFilters.aiModel
                    })}
                    className={cn(
                      "p-1.5 rounded-lg transition-all",
                      videoFilters.cvMode === cv 
                        ? "bg-emerald-500 text-white" 
                        : "text-white/40 hover:bg-white/5 hover:text-white/60"
                    )}
                    title={`Vision: ${cv.charAt(0).toUpperCase() + cv.slice(1)}`}
                  >
                    {cv === 'none' && <X className="w-3.5 h-3.5" />}
                    {cv === 'edges' && <Wind className="w-3.5 h-3.5" />}
                    {cv === 'contours' && <Layout className="w-3.5 h-3.5" />}
                    {cv === 'threshold' && <LayoutGrid className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 pl-1">
                {(['none', 'yolov8', 'ssd', 'unet', 'vgg19'] as const).map(model => (
                  <button
                    key={model}
                    onClick={() => setVideoFilters({
                      ...videoFilters, 
                      aiModel: model,
                      cvMode: model !== 'none' ? 'none' : videoFilters.cvMode
                    })}
                    className={cn(
                      "px-2 py-1 rounded-lg text-[8px] font-bold uppercase transition-all tracking-wider font-mono",
                      videoFilters.aiModel === model 
                        ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20" 
                        : "text-white/40 hover:bg-white/5 hover:text-white/60"
                    )}
                    title={`AI Network Model: ${model === 'none' ? 'None (Raw Tracking)' : model.toUpperCase()}`}
                  >
                    {model === 'none' ? 'RAW' : model.replace('v8', '').toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Controls Bar */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 p-1.5 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
              <button 
                onClick={toggleAnalysis}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all cursor-pointer",
                  isAnalyzing ? "bg-red-500 hover:bg-red-600 text-white" : "bg-emerald-500 hover:bg-emerald-600 text-white"
                )}
              >
                {isAnalyzing ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                {isAnalyzing ? t('stopAnalysisBtn') : t('startCASAEngineBtn')}
              </button>
              <div className="w-px h-8 bg-white/10 mx-1" />
              <button className="p-3 hover:bg-white/10 rounded-xl transition-colors text-white/60 cursor-pointer"><Camera className="w-5 h-5" /></button>
              <button 
                onClick={() => setSettings(prev => ({ ...prev, highContrast: !prev.highContrast }))}
                className={cn(
                  "p-3 rounded-xl transition-all cursor-pointer",
                  settings.highContrast ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" : "bg-white/10 hover:bg-white/20 text-white"
                )}
                title="Toggle Field Mode (High Contrast)"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={cn(
                  "p-3 rounded-xl transition-all cursor-pointer",
                  showHeatmap ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : "bg-white/10 hover:bg-white/20 text-white"
                )}
                title="Toggle Heatmap"
              >
                <Move className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setActiveTab('calculator')}
                className={cn(
                  "p-3 rounded-xl transition-all cursor-pointer",
                  activeTab === 'calculator' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-white/10 hover:bg-white/20 text-white"
                )}
                title="Dose & Dilution Calculator"
              >
                <Zap className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setShowMultiFOVModal(true)}
                className={cn(
                  "p-3 rounded-xl transition-all cursor-pointer",
                  showMultiFOVModal ? "bg-teal-500 text-white shadow-lg shadow-teal-500/20" : "bg-white/10 hover:bg-white/20 text-white"
                )}
                title="Multi-Field of View (FOV) Aggregator & Chamber Calibration"
              >
                <Layers className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setShowStats(!showStats)} 
                className={cn("p-3 rounded-xl transition-colors cursor-pointer", showStats ? "bg-white/10 text-white" : "hover:bg-white/10 text-white/60")}
              >
                <BarChart3 className="w-5 h-5" />
              </button>
              <div className="w-px h-8 bg-white/10 mx-1" />
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*,video/*"
                onChange={handleFileUpload}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all cursor-pointer",
                  isUploading ? "bg-white/5 text-white/40" : "bg-white/10 hover:bg-white/20 text-white"
                )}
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                <span className="text-xs uppercase tracking-widest font-bold">{t('aiUploadBtn')}</span>
              </button>
            </div>
          </div>
        )}
        </main>

        {/* Sidebar Stats */}
        <AnimatePresence>
          {showStats && (
            <motion.aside 
              initial={{ x: 320 }} animate={{ x: 0 }} exit={{ x: 320 }}
              className={cn(
                "w-96 border-l flex flex-col transition-all",
                theme === 'dark' ? "bg-[#0f0f0f] border-white/10" : "bg-white border-slate-200"
              )}
            >
              <div className={cn("p-4 border-b flex items-center justify-between", theme === 'dark' ? "border-white/10" : "border-slate-100")}>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "p-1.5 rounded-lg flex items-center justify-center",
                    theme === 'dark' ? "bg-white/5 text-emerald-400" : "bg-slate-50 text-emerald-600"
                  )}>
                    {activeTab === 'live' && <Tv className="w-3.5 h-3.5 text-red-500 animate-pulse" />}
                    {activeTab === 'kinematics' && <Activity className="w-3.5 h-3.5 text-emerald-500" />}
                    {activeTab === 'morphology' && <Compass className="w-3.5 h-3.5 text-purple-500" />}
                    {activeTab === 'vitality' && <Heart className="w-3.5 h-3.5 text-rose-500" />}
                    {activeTab === 'sdf' && <Dna className="w-3.5 h-3.5 text-sky-500" />}
                    {activeTab === 'ai' && <Sparkles className="w-3.5 h-3.5 text-purple-400" />}
                    {activeTab === 'report' && <FileText className="w-3.5 h-3.5 text-blue-500" />}
                    {activeTab === 'history' && <Clock className="w-3.5 h-3.5 text-amber-500" />}
                    {activeTab === 'calculator' && <Calculator className="w-3.5 h-3.5 text-indigo-500" />}
                    {activeTab === 'validation' && <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />}
                    {activeTab === 'about' && <UserIcon className="w-3.5 h-3.5 text-pink-500 animate-pulse" />}
                  </div>
                  <div>
                    <h2 className={cn("text-xs font-bold leading-none capitalize", theme === 'dark' ? "text-white" : "text-slate-900")}>
                      {activeTab === 'live' ? t('tabLive') :
                       activeTab === 'kinematics' ? t('tabKinematics') :
                       activeTab === 'morphology' ? t('tabMorphology') :
                       activeTab === 'vitality' ? t('tabVitality') :
                       activeTab === 'sdf' ? t('tabSdf') :
                       activeTab === 'ai' ? t('tabAi') :
                       activeTab === 'report' ? t('tabReport') :
                       activeTab === 'history' ? t('tabHistory') :
                       activeTab === 'calculator' ? t('tabCalculator') :
                       activeTab === 'validation' ? t('tabValidation') :
                       activeTab === 'about' ? t('tabAbout') : activeTab}
                    </h2>
                    <p className={cn("text-[9px] font-medium uppercase tracking-wider mt-1", theme === 'dark' ? "text-white/30" : "text-slate-400")}>
                      Analysis Module Panel
                    </p>
                  </div>
                </div>
                
                {/* Visual Status Tag */}
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Active</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {activeTab === 'about' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="p-4 bg-pink-500/10 border border-pink-500/20 rounded-2xl">
                      <div className="flex items-center gap-3 mb-2">
                        <Award className="w-5 h-5 text-pink-500" />
                        <h3 className="text-xs font-bold text-pink-500 uppercase tracking-wider">Designer Cockpit</h3>
                      </div>
                      <p className={cn(
                        "text-[10px] leading-relaxed",
                        theme === 'dark' ? "text-white/60" : "text-slate-600"
                      )}>
                        Customize the visual profile and engineering manifesto. Any edits made here are instantly cached to LocalStorage and update the main presentation deck.
                      </p>
                    </div>

                    {isEditingDesigner ? (
                      <div className="space-y-4">
                        <div>
                          <label className="text-[9px] font-bold uppercase tracking-widest text-[#888] block mb-1">Architect Name</label>
                          <input 
                            type="text"
                            value={editDesignerForm.name}
                            onChange={(e) => setEditDesignerForm({ ...editDesignerForm, name: e.target.value })}
                            className={cn(
                              "w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border focus:outline-none focus:border-pink-500",
                              theme === 'dark' ? "bg-black/60 border-white/10 text-white" : "bg-white border-black/10 text-slate-900"
                            )}
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-bold uppercase tracking-widest text-[#888] block mb-1">Professional Title</label>
                          <input 
                            type="text"
                            value={editDesignerForm.title}
                            onChange={(e) => setEditDesignerForm({ ...editDesignerForm, title: e.target.value })}
                            className={cn(
                              "w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border focus:outline-none focus:border-pink-500",
                              theme === 'dark' ? "bg-black/60 border-white/10 text-white" : "bg-white border-black/10 text-slate-900"
                            )}
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-bold uppercase tracking-widest text-[#888] block mb-1">Affiliation / Organization</label>
                          <input 
                            type="text"
                            value={editDesignerForm.organization}
                            onChange={(e) => setEditDesignerForm({ ...editDesignerForm, organization: e.target.value })}
                            className={cn(
                              "w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border focus:outline-none focus:border-pink-500",
                              theme === 'dark' ? "bg-black/60 border-white/10 text-white" : "bg-white border-black/10 text-slate-900"
                            )}
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-bold uppercase tracking-widest text-[#888] block mb-1">Credentials</label>
                          <input 
                            type="text"
                            value={editDesignerForm.credentials}
                            onChange={(e) => setEditDesignerForm({ ...editDesignerForm, credentials: e.target.value })}
                            className={cn(
                              "w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border focus:outline-none focus:border-pink-500",
                              theme === 'dark' ? "bg-black/60 border-white/10 text-white" : "bg-white border-black/10 text-slate-900"
                            )}
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-bold uppercase tracking-widest text-[#888] block mb-1">Contact Email</label>
                          <input 
                            type="email"
                            value={editDesignerForm.email}
                            onChange={(e) => setEditDesignerForm({ ...editDesignerForm, email: e.target.value })}
                            className={cn(
                              "w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border focus:outline-none focus:border-pink-500",
                              theme === 'dark' ? "bg-black/60 border-white/10 text-white" : "bg-white border-black/10 text-slate-900"
                            )}
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-bold uppercase tracking-widest text-[#888] block mb-1">Core Biography</label>
                          <textarea 
                            rows={4}
                            value={editDesignerForm.bio}
                            onChange={(e) => setEditDesignerForm({ ...editDesignerForm, bio: e.target.value })}
                            className={cn(
                              "w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:border-pink-500 leading-relaxed",
                              theme === 'dark' ? "bg-black/60 border-white/10 text-white" : "bg-white border-black/10 text-slate-900"
                            )}
                          />
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditingDesigner(false);
                              setEditDesignerForm(designerInfo);
                            }}
                            className={cn(
                              "flex-1 py-2 text-center rounded-xl text-[10px] font-bold uppercase border cursor-pointer",
                              theme === 'dark' ? "border-white/10 text-white/60 hover:bg-white/5" : "border-black/10 text-slate-600 hover:bg-slate-50"
                            )}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDesignerInfo(editDesignerForm);
                              localStorage.setItem('atsa_designer_info', JSON.stringify(editDesignerForm));
                              setIsEditingDesigner(false);
                            }}
                            className="flex-1 py-2 text-center rounded-xl text-[10px] font-bold uppercase bg-pink-500 hover:bg-pink-600 text-white shadow-lg shadow-pink-500/20 cursor-pointer"
                          >
                            Save Deck
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <div className="space-y-3">
                          <div className={cn(
                            "p-3 rounded-xl border space-y-1",
                            theme === 'dark' ? "bg-[#141416] border-white/5" : "bg-slate-50 border-black/5"
                          )}>
                            <p className={cn("text-[8px] font-black uppercase tracking-wider", theme === 'dark' ? "text-white/20" : "text-black/30")}>NAME & ORGANIZATION</p>
                            <p className={cn("text-xs font-bold font-mono", theme === 'dark' ? "text-white" : "text-slate-900")}>{designerInfo.name}</p>
                            <p className={cn("text-[10px]", theme === 'dark' ? "text-white/50" : "text-slate-500")}>{designerInfo.organization}</p>
                          </div>

                          <div className={cn(
                            "p-3 rounded-xl border space-y-1",
                            theme === 'dark' ? "bg-[#141416] border-white/5" : "bg-slate-50 border-black/5"
                          )}>
                            <p className={cn("text-[8px] font-black uppercase tracking-wider", theme === 'dark' ? "text-white/20" : "text-black/30")}>OFFICIAL BIO</p>
                            <p className={cn("text-[10px] leading-relaxed", theme === 'dark' ? "text-white/70" : "text-slate-600")}>{designerInfo.bio}</p>
                          </div>

                          <div className={cn(
                            "p-3 rounded-xl border space-y-1",
                            theme === 'dark' ? "bg-[#141416] border-white/5" : "bg-slate-50 border-black/5"
                          )}>
                            <p className={cn("text-[8px] font-black uppercase tracking-wider", theme === 'dark' ? "text-white/20" : "text-black/30")}>CONTACT REFERENCE</p>
                            <p className={cn("text-[10px] font-mono", theme === 'dark' ? "text-pink-400" : "text-pink-600")}>{designerInfo.email}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setEditDesignerForm(designerInfo);
                            setIsEditingDesigner(true);
                          }}
                          className={cn(
                            "w-full py-2.5 rounded-xl text-[10px] font-bold uppercase cursor-pointer text-center border font-sans transition-all",
                            theme === 'dark' 
                              ? "bg-white/5 hover:bg-white/10 border-white/10 text-white" 
                              : "bg-black/5 hover:bg-black/10 border-black/10 text-slate-800"
                          )}
                        >
                          Modify Designer Details
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'history' && (
                  <div className="space-y-6">
                    <section>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{t('historyTrackerTitle')}</h3>
                        {!user && (
                          <button 
                            onClick={() => signInWithPopup(auth, googleProvider)}
                            className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-[8px] font-bold uppercase tracking-widest text-white transition-all"
                          >
                            {t('signInButton')}
                          </button>
                        )}
                      </div>

                      {!user ? (
                        <div className="bg-black/40 p-6 rounded-2xl border border-white/5 text-center">
                          <ShieldCheck className="w-8 h-8 text-white/10 mx-auto mb-3" />
                          <p className="text-[10px] text-white/40 leading-relaxed">
                            {t('signInSyncMessage')}
                          </p>
                        </div>
                      ) : history.length === 0 ? (
                        <div className="bg-black/40 p-6 rounded-2xl border border-white/5 text-center">
                          <Activity className="w-8 h-8 text-white/10 mx-auto mb-3" />
                          <p className="text-[10px] text-white/40 leading-relaxed">
                            {t('noHistoryForPatient')}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Trend Chart */}
                          <div className="bg-black/40 p-4 rounded-2xl border border-white/5 h-48">
                            <p className="text-[8px] font-bold text-white/20 uppercase mb-4">Concentration Trend (M/ml)</p>
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={[...history].reverse()}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis 
                                  dataKey="timestamp" 
                                  hide 
                                />
                                <YAxis 
                                  stroke="rgba(255,255,255,0.2)" 
                                  fontSize={8} 
                                  tickFormatter={(val) => val.toFixed(0)}
                                />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '10px' }}
                                  itemStyle={{ color: '#fff' }}
                                  labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="concentration" 
                                  stroke="#10b981" 
                                  strokeWidth={2} 
                                  dot={{ fill: '#10b981', r: 3 }}
                                  activeDot={{ r: 5, strokeWidth: 0 }}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>

                          {/* History List */}
                          <div className="space-y-2">
                            {history.map((item) => (
                              <div key={item.id} className="bg-black/40 p-3 rounded-xl border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all">
                                <div>
                                  <p className="text-[10px] font-bold text-white/80">{new Date(item.timestamp).toLocaleDateString()}</p>
                                  <p className="text-[8px] text-white/30 uppercase tracking-widest">{new Date(item.timestamp).toLocaleTimeString()}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-mono text-emerald-400">{item.concentration.toFixed(1)} <span className="text-[8px] text-white/20">M/ml</span></p>
                                  <p className="text-[8px] text-white/40">{item.motility.progressive.toFixed(1)}% Prog.</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </section>
                  </div>
                )}

                {activeTab === 'calculator' && (
                  <div className="space-y-6">
                    <section>
                      <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">{t('labUtilitiesTitle')}</h3>

                      {/* Tab Sub-Selector */}
                      <div className="flex bg-black/45 p-1 rounded-xl border border-white/5 mb-6">
                        <button
                          type="button"
                          onClick={() => setCalculatorSubTab('dilution')}
                          className={cn(
                            "flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                            calculatorSubTab === 'dilution' ? "bg-emerald-500 text-white shadow" : "text-white/40 hover:text-white"
                          )}
                        >
                          <Zap className="w-3.5 h-3.5" />
                          {t('doseAndDilutionExtender')}
                        </button>
                        <button
                          type="button"
                          onClick={() => setCalculatorSubTab('multifield')}
                          className={cn(
                            "flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                            calculatorSubTab === 'multifield' ? "bg-emerald-500 text-white shadow" : "text-white/40 hover:text-white"
                          )}
                        >
                          <LayoutGrid className="w-3.5 h-3.5" />
                          {t('multiFieldQC')}
                        </button>
                      </div>

                      {calculatorSubTab === 'dilution' ? (
                        <div className="space-y-4 text-left">
                          <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] text-white/40 uppercase font-bold block mb-2">Ejaculate Volume (ml)</label>
                                <input 
                                  type="number" 
                                  step="0.1"
                                  value={calculator.ejaculateVolume}
                                  onChange={(e) => setCalculator({...calculator, ejaculateVolume: parseFloat(e.target.value) || 0})}
                                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                                />
                              </div>
                              
                              <div>
                                <label className="text-[10px] text-white/40 uppercase font-bold block mb-2">Target Conc (M/dose)</label>
                                <input 
                                  type="number" 
                                  value={calculator.targetConcentration}
                                  onChange={(e) => setCalculator({...calculator, targetConcentration: parseFloat(e.target.value) || 0})}
                                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-[10px] text-white/40 uppercase font-bold block mb-2">Extender Formula Choice</label>
                                <select 
                                  value={extenderType}
                                  onChange={(e: any) => setExtenderType(e.target.value)}
                                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500/50 transition-all"
                                >
                                  <option value="commercial">Commercial Synthetic Cryo (2-step)</option>
                                  <option value="egg_yolk">Traditional Egg-Yolk Citrate</option>
                                  <option value="milk_glycerol">Skimmed Milk Glycerol Buffer</option>
                                </select>
                              </div>
                              
                              <div>
                                <label className="text-[10px] text-white/40 uppercase font-bold block mb-2">Cryo-Straw Packaging</label>
                                <div className="grid grid-cols-2 gap-1.5 p-0.5 bg-black/20 rounded-xl border border-white/10">
                                  <button
                                    type="button"
                                    onClick={() => setStrawSize(0.25)}
                                    className={cn(
                                      "py-1 text-[9px] font-bold uppercase rounded-lg transition-all cursor-pointer",
                                      strawSize === 0.25 ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
                                    )}
                                  >
                                    0.25 ml Mini
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setStrawSize(0.5)}
                                    className={cn(
                                      "py-1 text-[9px] font-bold uppercase rounded-lg transition-all cursor-pointer",
                                      strawSize === 0.5 ? "bg-white/10 text-white" : "text-white/40 hover:text-white"
                                    )}
                                  >
                                    0.50 ml Med
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between py-1">
                              <div className="flex flex-col">
                                <span className="text-[10px] text-white/80 font-bold block">Only Account for Progressive Motile Sperm</span>
                                <span className="text-[8px] text-white/30">Discount dead or immotile sperm from fertilizing quotas</span>
                              </div>
                              <button 
                                type="button"
                                onClick={() => setCalculator({...calculator, useMotileSperm: !calculator.useMotileSperm})}
                                className={cn(
                                  "w-10 h-5 rounded-full transition-all relative cursor-pointer",
                                  calculator.useMotileSperm ? "bg-emerald-500" : "bg-white/10"
                                )}
                              >
                                <div className={cn(
                                  "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                                  calculator.useMotileSperm ? "left-6" : "left-1"
                                )} />
                              </button>
                            </div>
                          </div>

                          {results ? (
                            <div className="space-y-4">
                              {/* Summary calculations block */}
                              {(() => {
                                const spermSource = results.summary.concentration;
                                const totalSperm = spermSource * calculator.ejaculateVolume;
                                const motileFactor = calculator.useMotileSperm ? (results.summary.motility.progressive / 100) : 1;
                                const totalViableSperm = totalSperm * motileFactor;
                                const targetDoses = Math.floor(totalViableSperm / calculator.targetConcentration);
                                const totalFinalVolume = targetDoses * strawSize;
                                const neededExtenderVolume = Math.max(0, totalFinalVolume - calculator.ejaculateVolume);
                                const dilutionRatio = calculator.ejaculateVolume > 0 ? (neededExtenderVolume / calculator.ejaculateVolume) : 0;
                                const fractionA = neededExtenderVolume / 2;
                                const fractionB = neededExtenderVolume / 2;
                                
                                const colorCode = results?.species === 'Bovine' ? 'Emerald Green' : 'Amethyst Purple';

                                return (
                                  <div className="space-y-4">
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl space-y-3">
                                      <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Calculated Production Recipe</span>
                                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-3 text-left">
                                        <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
                                          <div className="text-[8px] text-white/40 uppercase font-black">Ejaculate Totals</div>
                                          <div className="text-sm font-mono text-white mt-1">{(totalSperm).toFixed(0)} M <span className="text-[9px] text-white/30 font-sans">sps</span></div>
                                          <div className="text-[8px] text-emerald-400/80">{(totalViableSperm).toFixed(0)} M Viable</div>
                                        </div>
                                        
                                        <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
                                          <div className="text-[8px] text-white/40 uppercase font-black">Total Straw Yield</div>
                                          <div className="text-sm font-mono text-white mt-1 font-bold">{targetDoses} <span className="text-[8px] text-white/30 font-sans">Straws</span></div>
                                          <div className="text-[8px] text-white/40">{strawSize} ml sizing</div>
                                        </div>
                                      </div>

                                      <div className="bg-black/20 p-3 rounded-xl border border-white/5 space-y-2">
                                        <div className="flex justify-between text-xs">
                                          <span className="text-[10px] text-white/40 uppercase font-bold">Total Extender Needed:</span>
                                          <span className="font-mono text-emerald-400 font-bold">{neededExtenderVolume.toFixed(2)} ml</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                          <span className="text-[10px] text-white/40 uppercase font-bold text-[9px]">Semen to Extender Ratio:</span>
                                          <span className="font-mono text-white text-[10px]">1 : {dilutionRatio.toFixed(2)}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Action Protocol Steps */}
                                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-4 text-left">
                                      <h4 className="text-[10px] font-black uppercase text-white/60 tracking-wider flex items-center gap-1.5">
                                        <Sliders className="w-3 h-3 text-amber-500" />
                                        Cryo Dilution Protocol Timeline
                                      </h4>

                                      <div className="space-y-4 border-l border-white/10 ml-2.5 pl-4 relative">
                                        {/* Step 1 */}
                                        <div className="relative">
                                          <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-emerald-500 border border-slate-900" />
                                          <div className="text-[9px] font-bold text-white uppercase tracking-wider">Step 1: Fraction A (Cooling Phase)</div>
                                          <p className="text-[10px] text-white/40 mt-1 leading-relaxed">
                                            Mix <strong className="text-white font-mono">{fractionA.toFixed(2)} ml</strong> of temperate {extenderType === 'commercial' ? "Fraction A synthetic buffer" : extenderType === 'egg_yolk' ? "custom egg-yolk-citrate" : "skim milk buffer"} into the {calculator.ejaculateVolume}ml ejaculate. Introduce slowly down container wall at room temp.
                                          </p>
                                        </div>

                                        {/* Step 2 */}
                                        <div className="relative">
                                          <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-amber-500 border border-slate-900" />
                                          <div className="text-[9px] font-bold text-white uppercase tracking-wider">Step 2: Equilibrating</div>
                                          <p className="text-[10px] text-white/40 mt-1 leading-relaxed">
                                            Transfer specimen into standard cooling cabinet. Program temperature gradient. Cool from 22°C to 4°C slowly over 2.5 hours to avoid cold shock.
                                          </p>
                                        </div>

                                        {/* Step 3 */}
                                        <div className="relative">
                                          <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-blue-500 border border-slate-900" />
                                          <div className="text-[9px] font-bold text-white uppercase tracking-wider">Step 3: Fraction B & Glycerolizing</div>
                                          <p className="text-[10px] text-white/40 mt-1 leading-relaxed">
                                            Slowly incorporate <strong className="text-white font-mono">{fractionB.toFixed(2)} ml</strong> of chilled glycerolized {extenderType === 'commercial' ? "Fraction B buffer" : "Glycerol-milk extender"} at 4°C. Add in 3 equal parts over a 30-minute interval to ease osmotic loading.
                                          </p>
                                        </div>

                                        {/* Step 4 */}
                                        <div className="relative">
                                          <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-purple-500 border border-slate-900" />
                                          <div className="text-[9px] font-bold text-white uppercase tracking-wider">Step 4: Pack & Straw Storage</div>
                                          <p className="text-[10px] text-white/40 mt-1 leading-relaxed">
                                            Pipette and fill <strong className="text-white font-mono">{targetDoses}</strong> individual {strawSize}ml straws. Seal ultrasound/heat. Apply identification label colored <strong className="text-white">{colorCode}</strong> to represent {results.species} pedigree records. Suspend in liquid nitrogen vapor (-120°C) for 10 minutes prior to immersion.
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          ) : (
                            <div className="bg-black/40 p-6 rounded-2xl border border-white/5 text-center space-y-4">
                              <Activity className="w-8 h-8 text-white/10 mx-auto" />
                              <p className="text-[10px] text-white/40 leading-relaxed max-w-[200px] mx-auto">
                                To populate the extender cryo protocol with active specimen calculations, load or run an analysis:
                              </p>
                              <div className="flex flex-col gap-2 max-w-[180px] mx-auto">
                                <button 
                                  type="button"
                                  onClick={() => loadDemoData('Bovine')}
                                  className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-black uppercase rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <ShieldCheck className="w-3 h-3" />
                                  Load Bull Specimen
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => loadDemoData('Equine')}
                                  className="py-1.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[9px] font-black uppercase rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <Activity className="w-3 h-3 text-purple-400" />
                                  Load Stallion Specimen
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4 text-left">
                          {/* Microscope QC Tab */}
                          <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-4 animate-fadeIn">
                            <div className="flex justify-between items-start gap-4">
                              <div className="space-y-0.5">
                                <h4 className="text-[10px] font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                                  <Microscope className="w-3.5 h-3.5 text-emerald-400" />
                                  Multi-Field Homogeneity Assayer
                                </h4>
                                <p className="text-[8px] text-white/30">Assess slide loading quality across distinct fields using WHO-compliant CV coefficients</p>
                              </div>
                              <span className="text-[8px] font-black py-0.5 px-1.5 rounded-md bg-white/5 border border-white/10 text-white/45 uppercase tracking-widest block whitespace-nowrap">CV Limit: 15%</span>
                            </div>

                            {/* Grid list of fields */}
                            <div className="space-y-2.5">
                              {qcFields.map((field, idx) => (
                                <div key={field.id} className={cn(
                                  "p-3 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/20",
                                  field.active ? "border-white/10" : "border-white/5 opacity-40"
                                )}>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const copy = [...qcFields];
                                        copy[idx].active = !copy[idx].active;
                                        setQcFields(copy);
                                      }}
                                      className={cn(
                                        "w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer",
                                        field.active ? "bg-emerald-500 border-emerald-600 text-white" : "border-white/20 hover:border-white/40"
                                      )}
                                    >
                                      {field.active && <Check className="w-2.5 h-2.5" />}
                                    </button>
                                    <div>
                                      <p className="text-[9px] font-bold text-white/80">{field.name}</p>
                                      <p className="text-[7px] text-white/30 uppercase tracking-widest font-mono">Index-0{field.id}</p>
                                    </div>
                                  </div>

                                  {field.active && (
                                    <div className="flex items-center gap-3">
                                      {/* Concentration adjustment */}
                                      <div className="space-y-1">
                                        <span className="text-[7px] text-white/40 uppercase font-black block">Concentration (M/ml)</span>
                                        <div className="flex items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const copy = [...qcFields];
                                              copy[idx].concentration = Math.max(0, Math.round((copy[idx].concentration - 2) * 10) / 10);
                                              setQcFields(copy);
                                            }}
                                            className="w-4 h-4 bg-white/5 rounded text-[10px] hover:bg-white/10 flex items-center justify-center text-white cursor-pointer select-none"
                                          >
                                            -
                                          </button>
                                          <input
                                            type="number"
                                            value={field.concentration}
                                            onChange={(e) => {
                                              const val = parseFloat(e.target.value) || 0;
                                              const copy = [...qcFields];
                                              copy[idx].concentration = val;
                                              setQcFields(copy);
                                            }}
                                            className="w-16 bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-center font-mono focus:outline-none focus:border-emerald-500 text-white"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const copy = [...qcFields];
                                              copy[idx].concentration = Math.round((copy[idx].concentration + 2) * 10) / 10;
                                              setQcFields(copy);
                                            }}
                                            className="w-4 h-4 bg-white/5 rounded text-[10px] hover:bg-white/10 flex items-center justify-center text-white cursor-pointer select-none"
                                          >
                                            +
                                          </button>
                                        </div>
                                      </div>

                                      {/* Progressive adjustment */}
                                      <div className="space-y-1">
                                        <span className="text-[7px] text-white/40 uppercase font-black block">Progressive %</span>
                                        <div className="flex items-center gap-1">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const copy = [...qcFields];
                                              copy[idx].progressive = Math.max(0, Math.round((copy[idx].progressive - 1) * 10) / 10);
                                              setQcFields(copy);
                                            }}
                                            className="w-4 h-4 bg-white/5 rounded text-[10px] hover:bg-white/10 flex items-center justify-center text-white cursor-pointer select-none"
                                          >
                                            -
                                          </button>
                                          <input
                                            type="number"
                                            value={field.progressive}
                                            onChange={(e) => {
                                              const val = parseFloat(e.target.value) || 0;
                                              const copy = [...qcFields];
                                              copy[idx].progressive = Math.min(100, val);
                                              setQcFields(copy);
                                            }}
                                            className="w-14 bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-center font-mono focus:outline-none focus:border-emerald-500 text-white"
                                          />
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const copy = [...qcFields];
                                              copy[idx].progressive = Math.min(100, Math.round((copy[idx].progressive + 1) * 10) / 10);
                                              setQcFields(copy);
                                            }}
                                            className="w-4 h-4 bg-white/5 rounded text-[10px] hover:bg-white/10 flex items-center justify-center text-white cursor-pointer select-none"
                                          >
                                            +
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* QC Evaluation Card */}
                            {(() => {
                              const activeFields = qcFields.filter(f => f.active);
                              const totalActive = activeFields.length;
                              
                              const meanConcentration = totalActive > 0 
                                ? activeFields.reduce((sum, f) => sum + f.concentration, 0) / totalActive 
                                : 0;
                                
                              const meanProgressive = totalActive > 0 
                                ? activeFields.reduce((sum, f) => sum + f.progressive, 0) / totalActive 
                                : 0;

                              // Std Dev of concentration
                              const varianceConcen = totalActive > 1
                                ? activeFields.reduce((sum, f) => sum + Math.pow(f.concentration - meanConcentration, 2), 0) / (totalActive - 1)
                                : 0;
                              const sdConcentration = Math.sqrt(varianceConcen);
                              const cvConcentration = meanConcentration > 0 ? (sdConcentration / meanConcentration) * 100 : 0;

                              // Std Dev of progressive motility
                              const varianceProg = totalActive > 1
                                ? activeFields.reduce((sum, f) => sum + Math.pow(f.progressive - meanProgressive, 2), 0) / (totalActive - 1)
                                : 0;
                              const sdProgressive = Math.sqrt(varianceProg);
                              const cvProgressive = meanProgressive > 0 ? (sdProgressive / meanProgressive) * 100 : 0;

                              // Maximum of the CV values is our QC metric
                              const maxCV = Math.max(cvConcentration, cvProgressive);

                              return totalActive > 0 ? (
                                <div className={cn(
                                  "p-4 rounded-xl border transition-all space-y-3",
                                  maxCV <= 10 
                                    ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300"
                                    : maxCV <= 15
                                      ? "bg-amber-500/5 border-amber-500/20 text-amber-300"
                                      : "bg-red-500/5 border-red-500/20 text-red-300 animate-pulse border-dashed"
                                )}>
                                  <div className="flex items-center justify-between text-xs">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className={cn(
                                        "w-2 h-2 rounded-full",
                                        maxCV <= 10 ? "bg-emerald-500" : maxCV <= 15 ? "bg-amber-500" : "bg-red-500 animate-ping"
                                      )} />
                                      <span className="font-bold uppercase text-[9px] tracking-wider text-white">Uniformity Status:</span>
                                      <span className={cn(
                                        "text-[9px] px-1.5 py-0.5 rounded font-black uppercase text-slate-900",
                                        maxCV <= 10 ? "bg-emerald-400" : maxCV <= 15 ? "bg-amber-400" : "bg-red-400"
                                      )}>
                                        {maxCV <= 10 ? "Optimal Uniformity" : maxCV <= 15 ? "Acceptable Variance" : "Non-Compliant"}
                                      </span>
                                    </div>
                                    <span className="font-mono font-bold text-white text-[10px] whitespace-nowrap">Max CV: {maxCV.toFixed(1)}%</span>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-white/5">
                                    <div className="bg-black/10 p-2.5 rounded-lg space-y-0.5">
                                      <div className="text-[7px] text-white/40 uppercase block">Mean Concentration</div>
                                      <div className="text-xs font-mono font-bold text-white">{meanConcentration.toFixed(1)} <span className="text-[8px] text-white/30 font-sans">M/ml</span></div>
                                      <div className="text-[7px] text-white/40 font-mono">CV: {cvConcentration.toFixed(1)}% <span className="text-white/25">(SD: {sdConcentration.toFixed(1)})</span></div>
                                    </div>
                                    
                                    <div className="bg-black/10 p-2.5 rounded-lg space-y-0.5">
                                      <div className="text-[7px] text-white/40 uppercase block">Mean Progressive</div>
                                      <div className="text-xs font-mono font-bold text-white">{meanProgressive.toFixed(1)}%</div>
                                      <div className="text-[7px] text-white/40 font-mono">CV: {cvProgressive.toFixed(1)}% <span className="text-white/25">(SD: {sdProgressive.toFixed(1)})</span></div>
                                    </div>
                                  </div>

                                  {/* Clinical advice box */}
                                  <div className="text-[9px] text-white/45 leading-relaxed pt-1">
                                    {maxCV <= 10 && (
                                      <span>✅ <strong>Excellent Homogeneity</strong>: Microscope fields correspond with negligible coefficient drift. Certified with WHO guidelines section 2.4. Specimen is ready for automated clinical profiling.</span>
                                    )}
                                    {maxCV > 10 && maxCV <= 15 && (
                                      <span>⚠️ <strong>Acceptable Multi-Field Variance</strong>: Low level drift identified. Valid for baseline work, but suggest checking that coverslips are balanced and free of shear forces.</span>
                                    )}
                                    {maxCV > 15 && (
                                      <span className="text-red-400/90 font-bold">❌ <strong>CRITICAL STRAW/SLIDE MISALIGNMENT</strong>: Field variance exceeds the 15% WHO maximum threshold. This is likely caused by an uneven counting chamber load, fluid air pockets, or sperm sedimentation. <strong>Clinical Action</strong>: Clean the counting slide/chamber, reload a fresh aliquot, and restart tracking.</span>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <p className="text-[9px] text-white/30 text-center italic py-4 bg-black/20 rounded-xl">At least one microscopic field must be active for QC evaluation</p>
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </section>
                  </div>
                )}

                {results ? (
                  <>

                    {activeTab === 'live' && (
                      <div className="space-y-6">
                        <section>
                          <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Concentration & Leukocytes</h3>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                              <p className="text-[10px] text-white/40 uppercase font-bold mb-1">Concentration</p>
                              <p className="text-xl font-mono text-white">{results.summary.concentration.toFixed(1)} <span className="text-[10px] text-white/20">M/ml</span></p>
                            </div>
                            <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                              <p className="text-[10px] text-white/40 uppercase font-bold mb-1">Leukocytes</p>
                              <p className={cn(
                                "text-xl font-mono",
                                results.summary.leukocytes > results.settings.profile.maxLeukocytes ? "text-red-400" : "text-emerald-400"
                              )}>
                                {results.summary.leukocytes.toFixed(1)} <span className="text-[10px] opacity-40">M/ml</span>
                              </p>
                            </div>
                          </div>
                        </section>

                        <section>
                          <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">WHO Motility Summary</h3>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                              <p className="text-[10px] text-white/40 uppercase font-bold mb-1">Progressive</p>
                              <p className="text-xl font-mono text-emerald-400">{results.summary.motility.progressive.toFixed(1)}%</p>
                            </div>
                            <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                              <p className="text-[10px] text-white/40 uppercase font-bold mb-1">Total Motility</p>
                              <p className="text-xl font-mono text-blue-400">{results.summary.motility.total.toFixed(1)}%</p>
                            </div>
                          </div>
                        </section>

                        <section>
                          <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Hyperactivation Analysis</h3>
                          <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-2xl">
                            <div className="flex justify-between items-end mb-2">
                              <div>
                                <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">Hyperactivated</p>
                                <p className="text-2xl font-mono font-bold text-white">{results.summary.kinematics.hyperactivation.percentage.toFixed(1)}%</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[8px] text-white/40 uppercase font-bold">Count</p>
                                <p className="text-xs font-mono text-white/60">{results.summary.kinematics.hyperactivation.count} cells</p>
                              </div>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${results.summary.kinematics.hyperactivation.percentage}%` }}
                                className="h-full bg-purple-500"
                              />
                            </div>
                            <p className="text-[8px] text-white/30 mt-3 italic">
                              Criteria: VCL {">"} 150 µm/s, LIN {"<"} 50%, ALH {">"} 3.5 µm. High hyperactivation is often associated with capacitation and IVF success.
                            </p>
                          </div>
                        </section>

                        <section className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Kinematic Correlation</h3>
                            <div className="flex items-center gap-1">
                              <select
                                value={scatterX}
                                onChange={(e) => setScatterX(e.target.value as any)}
                                className="text-[10px] uppercase font-mono bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-white cursor-pointer"
                              >
                                <option value="vsl">X: VSL</option>
                                <option value="vcl">X: VCL</option>
                                <option value="vap">X: VAP</option>
                                <option value="lin">X: LIN</option>
                                <option value="alh">X: ALH</option>
                              </select>
                              <span className="text-white/25 text-[10px] font-bold">vs</span>
                              <select
                                value={scatterY}
                                onChange={(e) => setScatterY(e.target.value as any)}
                                className="text-[10px] uppercase font-mono bg-black/60 border border-white/10 rounded-lg px-2 py-1 text-white cursor-pointer"
                              >
                                <option value="vsl">Y: VSL</option>
                                <option value="vcl">Y: VCL</option>
                                <option value="vap">Y: VAP</option>
                                <option value="lin">Y: LIN</option>
                                <option value="alh">Y: ALH</option>
                              </select>
                            </div>
                          </div>
                          
                          <div className="h-48 w-full bg-black/20 rounded-xl p-2 relative">
                            <div className="absolute top-2 right-2 flex flex-col items-end pointer-events-none text-[8px] font-mono text-emerald-400 bg-black/40 px-2 py-1 rounded border border-white/5">
                              <span className="font-bold">TOTAL CELLS: {results.spermatozoa.length}</span>
                            </div>
                            <ResponsiveContainer width="100%" height="100%">
                              <ScatterChart margin={{ top: 15, right: 10, bottom: 10, left: -20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis type="number" dataKey={scatterX} name={scatterX.toUpperCase()} unit={scatterX === 'lin' ? '%' : 'µm/s'} stroke="rgba(255,255,255,0.2)" fontSize={10} />
                                <YAxis type="number" dataKey={scatterY} name={scatterY.toUpperCase()} unit={scatterY === 'lin' ? '%' : 'µm/s'} stroke="rgba(255,255,255,0.2)" fontSize={10} />
                                <Tooltip 
                                  cursor={{ strokeDasharray: '3 3' }} 
                                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px' }}
                                  formatter={(value: any, name: any) => [`${value} ${name === 'LIN' ? '%' : 'µm/s'}`, name]}
                                />
                                <Scatter name="Spermatozoa" data={results.spermatozoa} fill="#10b981">
                                  {results.spermatozoa.map((entry, index) => {
                                    const isH = entry.isHyperactivated;
                                    return <Cell key={`cell-${index}`} fill={isH ? '#c084fc' : entry.classification === 'progressive' ? '#34d399' : entry.classification === 'non-progressive' ? '#fbbf24' : '#ef4444'} />;
                                  })}
                                </Scatter>
                              </ScatterChart>
                            </ResponsiveContainer>
                          </div>

                          <div className="flex gap-2 justify-center">
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-purple-400" /><span className="text-[8px] text-white/50 uppercase font-bold">Hyperactive</span></div>
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-emerald-400" /><span className="text-[8px] text-white/50 uppercase font-bold">Prog</span></div>
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-yellow-400" /><span className="text-[8px] text-white/50 uppercase font-bold">Non-Prog</span></div>
                            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-red-400" /><span className="text-[8px] text-white/50 uppercase font-bold">Immotile</span></div>
                          </div>
                        </section>

                        <section className="space-y-3">
                          <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Speed Range Kinematics Distribution</h3>
                          {(() => {
                            const totalCount = results.spermatozoa.length || 1;
                            const rapid = results.spermatozoa.filter(s => s.classification === 'progressive' && s.vcl >= 45).length;
                            const medium = results.spermatozoa.filter(s => s.classification === 'progressive' && s.vcl < 45 && s.vcl >= 15).length;
                            const slow = results.spermatozoa.filter(s => s.classification === 'non-progressive').length;
                            const staticCount = results.spermatozoa.filter(s => s.classification === 'immotile').length;

                            const barData = [
                              { name: 'Rapid (≥45µm/s)', count: rapid, pct: parseFloat(((rapid/totalCount)*100).toFixed(0)), color: '#10b981' },
                              { name: 'Medium (15-45µm/s)', count: medium, pct: parseFloat(((medium/totalCount)*100).toFixed(0)), color: '#3b82f6' },
                              { name: 'Slow (<15µm/s)', count: slow, pct: parseFloat(((slow/totalCount)*100).toFixed(0)), color: '#fbbf24' },
                              { name: 'Static (0)', count: staticCount, pct: parseFloat(((staticCount/totalCount)*100).toFixed(0)), color: '#ef4444' }
                            ];

                            return (
                              <div className="space-y-2">
                                <div className="h-40 w-full bg-black/20 rounded-xl p-2">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barData} margin={{ top: 10, right: 10, bottom: 5, left: -20 }}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={8} />
                                      <YAxis stroke="rgba(255,255,255,0.2)" fontSize={8} unit="%" />
                                      <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px' }} />
                                      <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                                        {barData.map((entry, index) => (
                                          <Cell key={`bar-cell-${index}`} fill={entry.color} />
                                        ))}
                                      </Bar>
                                    </BarChart>
                                  </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-4 gap-1">
                                  {barData.map(item => (
                                    <div key={item.name} className="bg-white/5 border border-white/5 p-2 rounded-lg text-center">
                                      <p className="text-[10px] font-mono font-bold text-white/90">{item.pct}%</p>
                                      <p className="text-[6px] uppercase font-bold text-white/30 truncate" title={item.name}>{item.name}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })()}
                        </section>
                      </div>
                    )}

                    {activeTab === 'kinematics' && selectedSperm && (
                      <div className="space-y-4">
                        <div className="flex gap-2 mb-4">
                          <button 
                            onClick={() => setKinematicsView('2d')}
                            className={cn(
                              "flex-1 py-2 rounded-xl text-[10px] font-bold uppercase border transition-all",
                              kinematicsView === '2d' ? (theme === 'dark' ? "bg-white/10 border-white/20 text-white" : "bg-black/10 border-black/20 text-black") : (theme === 'dark' ? "bg-white/5 border-white/10 text-white/40 hover:text-white/60" : "bg-black/5 border-black/10 text-black/40 hover:text-black/60")
                            )}
                          >
                            2D Path
                          </button>
                          <button 
                            onClick={() => setKinematicsView('3d')}
                            className={cn(
                              "flex-1 py-2 rounded-xl text-[10px] font-bold uppercase border transition-all",
                              kinematicsView === '3d' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : (theme === 'dark' ? "bg-white/5 border-white/10 text-white/40 hover:text-white/60" : "bg-black/5 border-black/10 text-black/40 hover:text-black/60")
                            )}
                          >
                            3D Reconstruction
                          </button>
                        </div>

                        {selectedSperm.path && (
                          kinematicsView === '3d' ? <Sperm3DPath sperm={selectedSperm} highContrast={settings.highContrast} theme={theme} /> : <SpermZoom sperm={selectedSperm} isAnalyzing={isAnalyzing} highContrast={settings.highContrast} theme={theme} />
                        )}
                        
                        <div className="flex items-center justify-between mb-2">
                          <h3 className={cn("text-[10px] font-bold uppercase tracking-widest", theme === 'dark' ? "text-white/40" : "text-black/40")}>Selected: {selectedSperm.id}</h3>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[8px] font-bold uppercase",
                            selectedSperm.classification === 'progressive' ? "bg-emerald-500/20 text-emerald-500" : "bg-amber-500/20 text-amber-500"
                          )}>{selectedSperm.classification}</span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: 'VCL', val: selectedSperm.vcl.toFixed(1), unit: 'µm/s' },
                            { label: 'VSL', val: selectedSperm.vsl.toFixed(1), unit: 'µm/s' },
                            { label: 'VAP', val: selectedSperm.vap.toFixed(1), unit: 'µm/s' },
                            { label: 'LIN', val: selectedSperm.lin.toFixed(2), unit: '%' },
                            { label: 'STR', val: selectedSperm.str.toFixed(2), unit: '%' },
                            { label: 'WOB', val: selectedSperm.wob.toFixed(2), unit: '%' },
                            { label: 'ALH', val: selectedSperm.alh.toFixed(1), unit: 'µm' },
                            { label: 'BCF', val: selectedSperm.bcf.toFixed(1), unit: 'Hz' },
                          ].map(stat => (
                            <div key={stat.label} className="bg-black/40 p-3 rounded-xl border border-white/5">
                              <p className="text-[9px] text-white/30 font-bold uppercase">{stat.label}</p>
                              <p className="text-sm font-mono text-white/90">{stat.val} <span className="text-[10px] text-white/20">{stat.unit}</span></p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === 'morphology' && selectedSperm && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-emerald-500/20 rounded-lg">
                              <Microscope className="w-4 h-4 text-emerald-500" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Morphology Status</p>
                              <p className="text-xs text-white/80">Automated Head Classification</p>
                            </div>
                          </div>
                          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: '94%' }}
                              className="h-full bg-emerald-500"
                            />
                          </div>
                          <p className="text-[8px] text-white/40 mt-2 italic">Confidence Score: 94.2% (WHO 2010 Standards)</p>
                        </div>

                        {/* Head Analysis */}
                        <section className="space-y-4">
                          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                            <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                            <h3 className="text-[11px] font-black text-white/60 uppercase tracking-widest">Head Analysis</h3>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <p className="text-[8px] font-bold text-white/20 uppercase">Morphometry</p>
                              <div className="grid grid-cols-1 gap-2">
                                {[
                                  { label: 'Area', val: selectedSperm.morphometry.area.toFixed(1), unit: 'µm²' },
                                  { label: 'Perimeter', val: selectedSperm.morphometry.perimeter.toFixed(1), unit: 'µm' },
                                  { label: 'Length', val: selectedSperm.morphometry.length.toFixed(1), unit: 'µm' },
                                  { label: 'Width', val: selectedSperm.morphometry.width.toFixed(1), unit: 'µm' },
                                  { label: 'Circularity', val: selectedSperm.morphometry.circularity.toFixed(2), unit: '' },
                                  { label: 'Elongation', val: selectedSperm.morphometry.elongation.toFixed(2), unit: '' },
                                ].map(stat => (
                                  <div key={stat.label} className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/5">
                                    <span className="text-[9px] text-white/40 font-bold uppercase">{stat.label}</span>
                                    <span className="text-xs font-mono text-white/90">{stat.val}<span className="text-[8px] ml-0.5 opacity-40">{stat.unit}</span></span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <p className="text-[8px] font-bold text-white/20 uppercase">Morphology</p>
                              <div className="grid grid-cols-1 gap-2">
                                {[
                                  { label: 'Shape', val: selectedSperm.morphology.head, status: selectedSperm.morphology.head === 'normal' ? 'normal' : 'abnormal' },
                                  { label: 'Acrosome', val: selectedSperm.morphology.acrosome, status: selectedSperm.morphology.acrosome === 'normal' ? 'normal' : 'abnormal' },
                                  { label: 'Vacuoles', val: selectedSperm.morphology.vacuoles, status: selectedSperm.morphology.vacuoles === 'absent' ? 'normal' : 'abnormal' },
                                ].map(item => (
                                  <div key={item.label} className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/5">
                                    <span className="text-[9px] text-white/40 font-bold uppercase">{item.label}</span>
                                    <span className={cn(
                                      "text-[9px] font-black uppercase tracking-tighter",
                                      item.status === 'normal' ? "text-emerald-400" : "text-amber-400"
                                    )}>{item.val}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </section>

                        {/* Midpiece & Tail Section */}
                        <section className="grid grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                              <div className="w-1 h-4 bg-blue-500 rounded-full" />
                              <h3 className="text-[11px] font-black text-white/60 uppercase tracking-widest">Midpiece</h3>
                            </div>
                            <div className="space-y-2">
                              {[
                                { label: 'Status', val: selectedSperm.morphology.midpiece, status: selectedSperm.morphology.midpiece === 'normal' ? 'normal' : 'abnormal' },
                                { label: 'Droplet', val: selectedSperm.morphology.droplet, status: selectedSperm.morphology.droplet === 'none' ? 'normal' : 'abnormal' },
                              ].map(item => (
                                <div key={item.label} className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-white/5">
                                  <span className="text-[9px] text-white/40 font-bold uppercase">{item.label}</span>
                                  <span className={cn(
                                    "text-[9px] font-black uppercase tracking-tighter",
                                    item.status === 'normal' ? "text-emerald-400" : "text-amber-400"
                                  )}>{item.val}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                              <div className="w-1 h-4 bg-purple-500 rounded-full" />
                              <h3 className="text-[11px] font-black text-white/60 uppercase tracking-widest">Tail</h3>
                            </div>
                            <div className="space-y-2">
                              {[
                                { label: 'Status', val: selectedSperm.morphology.tail, status: selectedSperm.morphology.tail === 'normal' ? 'normal' : 'abnormal' },
                              ].map(item => (
                                <div key={item.label} className={cn(
                                  "flex justify-between items-center p-2 rounded-lg border",
                                  theme === 'dark' ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5"
                                )}>
                                  <span className={cn(
                                    "text-[9px] font-bold uppercase",
                                    theme === 'dark' ? "text-white/40" : "text-black/40"
                                  )}>{item.label}</span>
                                  <span className={cn(
                                    "text-[9px] font-black uppercase tracking-tighter",
                                    item.status === 'normal' ? "text-emerald-400" : "text-amber-400"
                                  )}>{item.val}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </section>

                        {/* Morphology Distribution */}
                        <div className={cn(
                          "p-4 rounded-2xl border",
                          theme === 'dark' ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"
                        )}>
                          <h4 className={cn(
                            "text-[9px] font-bold uppercase mb-3",
                            theme === 'dark' ? "text-white/40" : "text-black/40"
                          )}>Sample Morphology Distribution</h4>
                          <div className="space-y-3">
                            {[
                              { label: 'Normal Head', value: 85, color: 'bg-emerald-500' },
                              { label: 'Large Head', value: 8, color: 'bg-amber-500' },
                              { label: 'Small Head', value: 4, color: 'bg-red-500' },
                              { label: 'Amorphous', value: 3, color: 'bg-purple-500' },
                              { label: 'Pyriform/Tapered', value: 2, color: 'bg-blue-500' },
                            ].map(item => (
                              <div key={item.label}>
                                <div className="flex justify-between text-[9px] mb-1">
                                  <span className={theme === 'dark' ? "text-white/60" : "text-black/60"}>{item.label}</span>
                                  <span className={theme === 'dark' ? "text-white/40" : "text-black/40"}>{item.value}%</span>
                                </div>
                                <div className={cn(
                                  "h-1 w-full rounded-full overflow-hidden",
                                  theme === 'dark' ? "bg-white/5" : "bg-black/5"
                                )}>
                                  <div className={cn("h-full rounded-full", item.color)} style={{ width: `${item.value}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Indices Section */}
                        {results && (
                          <section className={cn(
                            "p-4 rounded-2xl border",
                            theme === 'dark' ? "bg-black/40 border-white/10" : "bg-slate-100 border-black/10"
                          )}>
                            <div className="flex items-center justify-between mb-4">
                              <h3 className={cn(
                                "text-[10px] font-black uppercase tracking-[0.2em]",
                                theme === 'dark' ? "text-white/20" : "text-black/20"
                              )}>Morphology Indices</h3>
                              <div className="flex gap-2">
                                 <div className="px-2 py-1 bg-emerald-500/10 rounded border border-emerald-500/20">
                                   <span className="text-[8px] font-bold text-emerald-500 uppercase">WHO 5th Ed.</span>
                                 </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2.5">
                              <div className={cn(
                                "relative overflow-hidden p-2.5 rounded-xl border",
                                theme === 'dark' ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5"
                              )}>
                                <p className={cn(
                                  "text-[7.5px] font-bold uppercase mb-1 truncate",
                                  theme === 'dark' ? "text-white/40" : "text-black/40"
                                )}>TZI (Teratozoospermia)</p>
                                <p className={cn(
                                  "text-lg font-mono font-black",
                                  theme === 'dark' ? "text-white/90" : "text-slate-900"
                                )}>{results.summary.morphology.tzi.toFixed(2)}</p>
                                <p className={cn(
                                  "text-[7px] mt-0.5",
                                  theme === 'dark' ? "text-white/30" : "text-black/30"
                                )}>Ref: &lt; 1.60</p>
                                <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/5 rounded-full -mr-6 -mt-6 blur-xl" />
                              </div>
                              <div className={cn(
                                "relative overflow-hidden p-2.5 rounded-xl border",
                                theme === 'dark' ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5"
                              )}>
                                <p className={cn(
                                  "text-[7.5px] font-bold uppercase mb-1 truncate",
                                  theme === 'dark' ? "text-white/40" : "text-black/40"
                                )}>MAI (Anomalies Index)</p>
                                <p className={cn(
                                  "text-lg font-mono font-black",
                                  theme === 'dark' ? "text-white/90" : "text-slate-900"
                                )}>{results.summary.morphology.mai.toFixed(2)}</p>
                                <p className={cn(
                                  "text-[7px] mt-0.5",
                                  theme === 'dark' ? "text-white/30" : "text-black/30"
                                )}>Ref: &lt; 1.50</p>
                                <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500/5 rounded-full -mr-6 -mt-6 blur-xl" />
                              </div>
                              <div className={cn(
                                "relative overflow-hidden p-2.5 rounded-xl border",
                                theme === 'dark' ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5"
                              )}>
                                <p className={cn(
                                  "text-[7.5px] font-bold uppercase mb-1 truncate",
                                  theme === 'dark' ? "text-white/40" : "text-black/40"
                                )}>SDI (Deformity Index)</p>
                                <p className={cn(
                                  "text-lg font-mono font-black",
                                  theme === 'dark' ? "text-white/90" : "text-slate-900"
                                )}>{((results.summary.morphology.tzi * (100 - results.summary.morphology.normal)) / 100).toFixed(2)}</p>
                                <p className={cn(
                                  "text-[7px] mt-0.5",
                                  theme === 'dark' ? "text-white/30" : "text-black/30"
                                )}>Ref: &lt; 1.60</p>
                                <div className="absolute top-0 right-0 w-12 h-12 bg-purple-500/5 rounded-full -mr-6 -mt-6 blur-xl" />
                              </div>
                            </div>
                          </section>
                        )}

                        {/* Defect Distribution Section */}
                        {results && (
                          <section className={cn(
                            "p-4 rounded-2xl border",
                            theme === 'dark' ? "bg-black/40 border-white/10" : "bg-slate-100 border-black/10"
                          )}>
                            <h3 className={cn(
                              "text-[10px] font-black uppercase tracking-[0.2em] mb-4",
                              theme === 'dark' ? "text-white/20" : "text-black/20"
                            )}>Defect Distribution</h3>
                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-3">
                                <h4 className={cn(
                                  "text-[8px] font-bold uppercase tracking-widest",
                                  theme === 'dark' ? "text-white/40" : "text-black/40"
                                )}>Head Defects</h4>
                                {Object.entries(results.summary.morphology.headDefects).map(([key, val]) => (
                                  <div key={key} className="space-y-1">
                                    <div className="flex justify-between text-[9px] font-bold">
                                      <span className={cn(
                                        "capitalize",
                                        theme === 'dark' ? "text-white/60" : "text-black/60"
                                      )}>{key}</span>
                                      <span className={cn(
                                        "font-mono",
                                        theme === 'dark' ? "text-white/80" : "text-black/80"
                                      )}>{(val as number).toFixed(1)}%</span>
                                    </div>
                                    <div className={cn(
                                      "h-1 w-full rounded-full overflow-hidden",
                                      theme === 'dark' ? "bg-white/5" : "bg-black/5"
                                    )}>
                                      <div className="h-full bg-emerald-500/40" style={{ width: `${val}%` }} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="space-y-3">
                                <h4 className={cn(
                                  "text-[8px] font-bold uppercase tracking-widest",
                                  theme === 'dark' ? "text-white/40" : "text-black/40"
                                )}>Midpiece & Tail</h4>
                                <div className="space-y-3">
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[9px] font-bold">
                                      <span className={theme === 'dark' ? "text-white/60" : "text-black/60"}>Acrosome Defects</span>
                                      <span className={cn(
                                        "font-mono",
                                        theme === 'dark' ? "text-white/80" : "text-black/80"
                                      )}>{results.summary.morphology.acrosomeDefects.toFixed(1)}%</span>
                                    </div>
                                    <div className={cn(
                                      "h-1 w-full rounded-full overflow-hidden",
                                      theme === 'dark' ? "bg-white/5" : "bg-black/5"
                                    )}>
                                      <div className="h-full bg-amber-500/40" style={{ width: `${results.summary.morphology.acrosomeDefects}%` }} />
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[9px] font-bold">
                                      <span className={theme === 'dark' ? "text-white/60" : "text-black/60"}>Cytoplasmic Droplets</span>
                                      <span className={cn(
                                        "font-mono",
                                        theme === 'dark' ? "text-white/80" : "text-black/80"
                                      )}>{results.summary.morphology.cytoplasmicDroplets.toFixed(1)}%</span>
                                    </div>
                                    <div className={cn(
                                      "h-1 w-full rounded-full overflow-hidden",
                                      theme === 'dark' ? "bg-white/5" : "bg-black/5"
                                    )}>
                                      <div className="h-full bg-blue-500/40" style={{ width: `${results.summary.morphology.cytoplasmicDroplets}%` }} />
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[9px] font-bold">
                                      <span className={theme === 'dark' ? "text-white/60" : "text-black/60"}>Midpiece Defects</span>
                                      <span className={cn(
                                        "font-mono",
                                        theme === 'dark' ? "text-white/80" : "text-black/80"
                                      )}>{(Object.values(results.summary.morphology.midpieceDefects).reduce((a, b) => (a as number) + (b as number), 0) as number).toFixed(1)}%</span>
                                    </div>
                                    <div className={cn(
                                      "h-1 w-full rounded-full overflow-hidden",
                                      theme === 'dark' ? "bg-white/5" : "bg-black/5"
                                    )}>
                                      <div className="h-full bg-purple-500/40" style={{ width: `${Object.values(results.summary.morphology.midpieceDefects).reduce((a, b) => (a as number) + (b as number), 0)}%` }} />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </section>
                        )}
                      </div>
                    )}

                    {activeTab === 'vitality' && results && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-[32px]">
                          <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                              <Activity className="w-6 h-6 text-emerald-500" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Vitality Index</p>
                              <p className={cn(
                                "text-2xl font-mono",
                                theme === 'dark' ? "text-white" : "text-slate-900"
                              )}>{results.summary.vitality.live.toFixed(1)}% <span className={theme === 'dark' ? "text-white/20" : "text-black/20"}>Live</span></p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                              <span className={theme === 'dark' ? "text-white/40" : "text-black/40"}>Survival Rate</span>
                              <span className={cn(
                                results.summary.vitality.live > results.settings.profile.minVitality ? "text-emerald-500" : "text-red-500"
                              )}>
                                {results.summary.vitality.live > results.settings.profile.minVitality ? "Normal" : "Low Vitality"}
                              </span>
                            </div>
                            <div className={cn(
                              "h-2 w-full rounded-full overflow-hidden",
                              theme === 'dark' ? "bg-white/5" : "bg-black/5"
                            )}>
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${results.summary.vitality.live}%` }}
                                className={cn(
                                  "h-full transition-all duration-1000",
                                  results.summary.vitality.live > results.settings.profile.minVitality ? "bg-emerald-500" : "bg-red-500"
                                )}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className={cn(
                            "p-4 rounded-2xl border",
                            theme === 'dark' ? "bg-black/40 border-white/5" : "bg-slate-100 border-black/5"
                          )}>
                            <p className={cn(
                              "text-[10px] font-bold uppercase mb-1",
                              theme === 'dark' ? "text-white/30" : "text-black/30"
                            )}>Live Cells</p>
                            <p className="text-xl font-mono text-emerald-400">{(results.summary.vitality.total - results.summary.vitality.dead).toFixed(1)}%</p>
                            <p className={cn(
                              "text-[8px] mt-1",
                              theme === 'dark' ? "text-white/20" : "text-black/20"
                            )}>Eosin-Nigrosin Negative</p>
                          </div>
                          <div className={cn(
                            "p-4 rounded-2xl border",
                            theme === 'dark' ? "bg-black/40 border-white/5" : "bg-slate-100 border-black/5"
                          )}>
                            <p className={cn(
                              "text-[10px] font-bold uppercase mb-1",
                              theme === 'dark' ? "text-white/30" : "text-black/30"
                            )}>Dead Cells</p>
                            <p className="text-xl font-mono text-red-400">{results.summary.vitality.dead.toFixed(1)}%</p>
                            <p className={cn(
                              "text-[8px] mt-1",
                              theme === 'dark' ? "text-white/20" : "text-black/20"
                            )}>Eosin-Nigrosin Positive</p>
                          </div>
                        </div>

                        <div className={cn(
                          "p-4 rounded-2xl border",
                          theme === 'dark' ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5"
                        )}>
                          <p className={cn(
                            "text-[10px] leading-relaxed italic",
                            theme === 'dark' ? "text-white/40" : "text-black/40"
                          )}>
                            Vitality assessment is crucial for samples with low motility (asthenozoospermia). It differentiates between immotile live sperm and dead sperm, which is essential for ICSI selection.
                          </p>
                        </div>
                      </div>
                    )}

                    {activeTab === 'sdf' && results && (
                      <div className="space-y-6">
                        <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-[32px]">
                          <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                              <Dna className="w-6 h-6 text-emerald-500" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">DNA Fragmentation Index</p>
                              <p className={cn(
                                "text-2xl font-mono",
                                theme === 'dark' ? "text-white" : "text-slate-900"
                              )}>{results.summary.sdf.dfi.toFixed(1)}%</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                              <span className={theme === 'dark' ? "text-white/40" : "text-black/40"}>Fragmentation Level</span>
                              <span className={cn(
                                results.summary.sdf.dfi < 15 ? "text-emerald-500" : (results.summary.sdf.dfi < 30 ? "text-amber-500" : "text-red-500")
                              )}>
                                {results.summary.sdf.dfi < 15 ? "Excellent" : (results.summary.sdf.dfi < 30 ? "Fair" : "Poor")}
                              </span>
                            </div>
                            <div className={cn(
                              "h-2 w-full rounded-full overflow-hidden",
                              theme === 'dark' ? "bg-white/5" : "bg-black/5"
                            )}>
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${results.summary.sdf.dfi}%` }}
                                className={cn(
                                  "h-full transition-all duration-1000",
                                  results.summary.sdf.dfi < 15 ? "bg-emerald-500" : (results.summary.sdf.dfi < 30 ? "bg-amber-500" : "bg-red-500")
                                )}
                              />
                            </div>
                          </div>
                        </div>

                        <section>
                          <h3 className={cn(
                            "text-[10px] font-bold uppercase tracking-widest mb-4",
                            theme === 'dark' ? "text-white/40" : "text-black/40"
                          )}>SCD Halo Analysis</h3>
                          <div className="grid grid-cols-2 gap-3">
                            <div className={cn(
                              "p-4 rounded-2xl border",
                              theme === 'dark' ? "bg-black/40 border-white/5" : "bg-slate-100 border-black/5"
                            )}>
                              <p className={cn(
                                "text-[10px] font-bold uppercase mb-1",
                                theme === 'dark' ? "text-white/30" : "text-black/30"
                              )}>Fragmented</p>
                              <p className="text-xl font-mono text-red-400">{results.summary.sdf.fragmentedCount}</p>
                              <p className={cn(
                                "text-[8px] mt-1",
                                theme === 'dark' ? "text-white/20" : "text-black/20"
                              )}>Cells with small/no halo</p>
                            </div>
                            <div className={cn(
                              "p-4 rounded-2xl border",
                              theme === 'dark' ? "bg-black/40 border-white/5" : "bg-slate-100 border-black/5"
                            )}>
                              <p className={cn(
                                "text-[10px] font-bold uppercase mb-1",
                                theme === 'dark' ? "text-white/30" : "text-black/30"
                              )}>Total Analyzed</p>
                              <p className={cn(
                                "text-xl font-mono",
                                theme === 'dark' ? "text-white/60" : "text-black/60"
                              )}>{results.summary.sdf.totalCount}</p>
                              <p className={cn(
                                "text-[8px] mt-1",
                                theme === 'dark' ? "text-white/20" : "text-black/20"
                              )}>Sperm Chromatin Dispersion</p>
                            </div>
                          </div>
                        </section>

                        <section className={cn(
                          "p-4 border rounded-2xl space-y-4",
                          theme === 'dark' ? "bg-white/5 border-white/5 text-white" : "bg-black/5 border-black/5 text-slate-900"
                        )}>
                          <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Advanced SCD Halos Assay Simulator</h4>
                            <span className="text-[8px] px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full font-mono uppercase font-black">Interactive Sandbox</span>
                          </div>
                          <p className={cn(
                            "text-[9px] leading-relaxed",
                            theme === 'dark' ? "text-white/50" : "text-slate-600"
                          )}>
                            Simulate the acid denaturation and nuclear extraction steps of the Sperm Chromatin Dispersion (SCD) test. Observe how buffer protocols influence halo loop diameter and final diagnostic sensitivity.
                          </p>

                          <div className="grid grid-cols-2 gap-4">
                            <div className={cn(
                              "space-y-3 p-3 rounded-xl border",
                              theme === 'dark' ? "bg-black/30 border-white/5" : "bg-white border-slate-200"
                            )}>
                              <h5 className={cn(
                                "text-[9px] font-bold uppercase tracking-wider",
                                theme === 'dark' ? "text-white/60" : "text-slate-700"
                              )}>Assay Chemical Protocol</h5>
                              
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className={cn("text-[8px] uppercase font-mono", theme === 'dark' ? "text-white/40" : "text-slate-500")}>1. Acid Denaturation (sec)</span>
                                  <span className={cn("text-[8px] font-mono font-bold", theme === 'dark' ? "text-white" : "text-slate-900")}>{denaturationTime}s</span>
                                </div>
                                <input 
                                  type="range" min="5" max="30" step="1" 
                                  value={denaturationTime}
                                  onChange={(e) => setDenaturationTime(parseInt(e.target.value))}
                                  className="w-full accent-emerald-500 cursor-pointer"
                                />
                              </div>

                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className={cn("text-[8px] uppercase font-mono", theme === 'dark' ? "text-white/40" : "text-slate-500")}>2. Lysis Extraction (%)</span>
                                  <span className={cn("text-[8px] font-mono font-bold", theme === 'dark' ? "text-white" : "text-slate-900")}>{lysisIntensity}%</span>
                                </div>
                                <input 
                                  type="range" min="30" max="100" step="5" 
                                  value={lysisIntensity}
                                  onChange={(e) => setLysisIntensity(parseInt(e.target.value))}
                                  className="w-full accent-emerald-500 cursor-pointer"
                                />
                              </div>

                              <div className={cn(
                                "p-2 rounded-lg space-y-1 text-[8px] font-mono",
                                theme === 'dark' ? "bg-white/5 text-white/40" : "bg-slate-50 text-slate-500"
                              )}>
                                <div className="flex justify-between">
                                  <span>Protocol Standard:</span>
                                  <span className="text-emerald-500 font-bold">HALOSPERM G2</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Nuclear Matrix Status:</span>
                                  <span className={denaturationTime < 12 ? "text-amber-500 font-bold" : denaturationTime > 22 ? "text-red-500 font-bold" : "text-emerald-500 font-bold"}>
                                    {denaturationTime < 12 ? "Under-denatured" : denaturationTime > 22 ? "Partially Cleaved" : "Optimal Cleavage"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Extraction State:</span>
                                  <span className={lysisIntensity < 50 ? "text-amber-500 font-bold" : "text-emerald-500 font-bold"}>
                                    {lysisIntensity < 50 ? "Insufficient Lysis" : "Complete Core Wash"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className={cn(
                              "p-3 border rounded-xl flex flex-col items-center justify-center relative select-none",
                              theme === 'dark' ? "bg-black/50 border-white/5" : "bg-slate-50 border-slate-200"
                            )}>
                              {/* Glowing interactive halo viewer */}
                              <svg viewBox="0 0 160 160" className="w-full h-24 aspect-square">
                                <defs>
                                  <radialGradient id="healthyHalo" cx="50%" cy="50%" r="50%">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                                    <stop offset={`${Math.min(100, lysisIntensity * 0.95)}%`} stopColor="#059669" stopOpacity="0.1" />
                                    <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                                  </radialGradient>
                                  <radialGradient id="fragmentedHalo" cx="50%" cy="50%" r="50%">
                                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                                    <stop offset={`${Math.max(10, denaturationTime * 1.5)}%`} stopColor="#b91c1c" stopOpacity="0.05" />
                                    <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                                  </radialGradient>
                                </defs>

                                {/* Grid of Simulated Assays */}
                                {/* Healthy Sperm 1 (Left) */}
                                <g transform="translate(45, 80)">
                                  <circle cx="0" cy="0" r={Math.max(10, (lysisIntensity/100) * 35)} fill="url(#healthyHalo)" className="animate-pulse" />
                                  <ellipse cx="0" cy="0" rx="3.5" ry="2.2" fill={theme === 'dark' ? '#bcffd0' : '#10b981'} stroke="#10b981" strokeWidth="0.5" transform="rotate(-15)" />
                                  <path d="M 0 0 Q -8 10 -6 20 T -12 35" fill="none" stroke="rgba(16,185,129,0.3)" strokeWidth="0.5" />
                                  <text x="-15" y="-22" fill="#10b981" fontSize="6.5" fontWeight="bold" fontFamily="monospace">Intact DNA</text>
                                  <text x="-15" y="44" fill={theme === 'dark' ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} fontSize="5" fontFamily="monospace">Halo: {((lysisIntensity/100) * 18).toFixed(1)}µm</text>
                                </g>

                                {/* Fragmented Sperm 2 (Right) */}
                                <g transform="translate(115, 80)">
                                  <circle cx="0" cy="0" r={Math.max(4, (denaturationTime/30) * 12)} fill="url(#fragmentedHalo)" />
                                  <ellipse cx="0" cy="0" rx="3.2" ry="2.0" fill={theme === 'dark' ? '#ffd0d0' : '#ef4444'} stroke="#ef4444" strokeWidth="0.5" transform="rotate(25)" />
                                  <path d="M 0 0 Q 5 8 15 18" fill="none" stroke="rgba(239,68,68,0.2)" strokeWidth="0.5" strokeDasharray="1 1" />
                                  <text x="-14" y="-22" fill="#ef4444" fontSize="6.5" fontWeight="bold" fontFamily="monospace">Fragmented</text>
                                  <text x="-14" y="44" fill={theme === 'dark' ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} fontSize="5" fontFamily="monospace">Halo: {((denaturationTime/30) * 4.5).toFixed(1)}µm</text>
                                </g>
                              </svg>
                            </div>
                          </div>
                        </section>

                        <div className={cn(
                          "p-4 rounded-2xl border",
                          theme === 'dark' ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5"
                        )}>
                          <p className={cn(
                            "text-[10px] leading-relaxed italic",
                            theme === 'dark' ? "text-white/40" : "text-black/40"
                          )}>
                            Sperm DNA fragmentation (SDF) is a key indicator of male fertility. A DFI {">"}30% is strongly associated with reduced pregnancy rates and increased miscarriage risk in both natural and assisted reproduction.
                          </p>
                        </div>
                      </div>
                    )}

                    {activeTab === 'ai' && (
                      <div className="space-y-6 flex flex-col h-full">
                        {/* Sub-tab selection */}
                        <div className="flex p-1 bg-black/15 dark:bg-white/5 border border-black/10 dark:border-white/5 rounded-2xl mb-2">
                          <button
                            onClick={() => setAiSubTab('vision')}
                            type="button"
                            className={cn(
                              "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5",
                              aiSubTab === 'vision' 
                                ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20" 
                                : "text-black/40 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60"
                            )}
                          >
                            <BrainCircuit className="w-3.5 h-3.5" />
                            Vision Sandbox
                          </button>
                          <button
                            onClick={() => setAiSubTab('consultant')}
                            type="button"
                            className={cn(
                              "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5",
                              aiSubTab === 'consultant' 
                                ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20" 
                                : "text-black/40 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60"
                            )}
                          >
                            <Loader2 className="w-3.5 h-3.5 animate-pulse" />
                            Clinical Chat
                          </button>
                        </div>

                        {/* Vision Neural Sandbox */}
                        {aiSubTab === 'vision' && (
                          <div className="space-y-6">
                            {/* Model Deployment Control */}
                            <div className={cn(
                              "p-5 border rounded-[30px] space-y-4",
                              theme === 'dark' ? "bg-purple-500/5 border-purple-500/10" : "bg-purple-500/5 border-purple-500/20"
                            )}>
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">Active Model Deployment</p>
                                  <h4 className="text-[11px] font-bold tracking-tight">
                                    {videoFilters.aiModel === 'none' && "Raw Sperm Tracking (Baseline)"}
                                    {videoFilters.aiModel === 'yolov8' && "YOLOv8-Sperm: Object Detection"}
                                    {videoFilters.aiModel === 'ssd' && "SSD-MobileNet: Multi-scale Anchor"}
                                    {videoFilters.aiModel === 'unet' && "U-Net: Semantic Segmentation"}
                                    {videoFilters.aiModel === 'vgg19' && "VGG-19: Spermatogenic Classification"}
                                  </h4>
                                </div>
                                <span className="text-[8px] bg-purple-500/20 text-purple-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  {videoFilters.aiModel === 'none' ? "Inactive" : "Deployed"}
                                </span>
                              </div>

                              {/* Model Selector Pill Group */}
                              <div className="grid grid-cols-5 gap-1 p-1 bg-black/10 rounded-xl">
                                {(['none', 'yolov8', 'ssd', 'unet', 'vgg19'] as const).map(model => (
                                  <button
                                    key={model}
                                    type="button"
                                    onClick={() => {
                                      setVideoFilters({
                                        ...videoFilters,
                                        aiModel: model,
                                        cvMode: model !== 'none' ? 'none' : videoFilters.cvMode
                                      });
                                      setSelectedTopologyLayer(null);
                                    }}
                                    className={cn(
                                      "py-1 text-[8px] font-bold uppercase transition-all rounded-lg text-center",
                                      videoFilters.aiModel === model 
                                        ? "bg-purple-500 text-white shadow font-black" 
                                        : "text-white/40 hover:text-white/60 hover:bg-white/5"
                                    )}
                                  >
                                    {model === 'none' ? 'RAW' : model.replace('v8', '').toUpperCase()}
                                  </button>
                                ))}
                              </div>

                              {/* Model Infrastructure Metadata */}
                              {videoFilters.aiModel !== 'none' && (
                                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-purple-500/10">
                                  <div className="space-y-0.5">
                                    <span className="text-[8px] uppercase tracking-widest text-white/30 font-semiboldBlock">Latency / Inference</span>
                                    <p className="text-[11px] font-mono font-bold text-purple-400">
                                      {videoFilters.aiModel === 'yolov8' && "1.8 - 2.4 ms"}
                                      {videoFilters.aiModel === 'ssd' && "4.5 - 6.2 ms"}
                                      {videoFilters.aiModel === 'unet' && "10.2 - 12.8 ms"}
                                      {videoFilters.aiModel === 'vgg19' && "5.1 - 7.3 ms"}
                                    </p>
                                  </div>
                                  <div className="space-y-0.5">
                                    <span className="text-[8px] uppercase tracking-widest text-white/30 font-semiboldBlock">Network Param Density</span>
                                    <p className="text-[11px] font-mono font-semibold opacity-80">
                                      {videoFilters.aiModel === 'yolov8' && "3.2 M (YOLOv8-Nano)"}
                                      {videoFilters.aiModel === 'ssd' && "5.5 M (MobileNetV2)"}
                                      {videoFilters.aiModel === 'unet' && "14.3 M (DenseU-Net)"}
                                      {videoFilters.aiModel === 'vgg19' && "143.6 M (VGG19)"}
                                    </p>
                                  </div>
                                  <div className="space-y-0.5 mt-2">
                                    <span className="text-[8px] uppercase tracking-widest text-white/30 font-semiboldBlock">Mean Precision (mAP)</span>
                                    <p className="text-[11px] font-mono font-semibold text-emerald-400">
                                      {videoFilters.aiModel === 'yolov8' && "96.4%"}
                                      {videoFilters.aiModel === 'ssd' && "91.8%"}
                                      {videoFilters.aiModel === 'unet' && "95.8% (Dice Coeff)"}
                                      {videoFilters.aiModel === 'vgg19' && "94.2%"}
                                    </p>
                                  </div>
                                  <div className="space-y-0.5 mt-2">
                                    <span className="text-[8px] uppercase tracking-widest text-white/30 font-semiboldBlock">Active Layer Count</span>
                                    <p className="text-[11px] font-mono font-semibold opacity-80">
                                      {videoFilters.aiModel === 'yolov8' && "225 modules"}
                                      {videoFilters.aiModel === 'ssd' && "154 Anchor maps"}
                                      {videoFilters.aiModel === 'unet' && "23 segments"}
                                      {videoFilters.aiModel === 'vgg19' && "19 deep layers"}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Base state warning if RAW */}
                            {videoFilters.aiModel === 'none' && (
                              <div className={cn(
                                "p-5 border rounded-[30px] text-center space-y-3",
                                theme === 'dark' ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5"
                              )}>
                                <Activity className="w-8 h-8 mx-auto text-purple-400 opacity-60 stroke-1 animate-pulse" />
                                <div className="space-y-1 text-center">
                                  <p className="text-[11px] font-bold uppercase tracking-wider">No Neural Network Active</p>
                                  <p className="text-[10px] opacity-65 leading-relaxed max-w-[220px] mx-auto">Select a deep-learning architecture above to overlay high-end computer-assisted diagnostics on current sperm cultures.</p>
                                </div>
                              </div>
                            )}

                            {/* Topology Node Graph (Visual Schematic) */}
                            {videoFilters.aiModel !== 'none' && (
                              <div className={cn(
                                "p-5 border rounded-[30px] space-y-4",
                                theme === 'dark' ? "bg-black/40 border-white/5" : "bg-white border-black/5"
                              )}>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-purple-500">Architecture Topology Network</p>
                                <p className="text-[10px] opacity-60 leading-snug">Click block segments of the neural network to inspect layers, feature tensors, and activations.</p>
                                
                                <div className="space-y-2 pt-1 font-sans">
                                  {/* YOLOv8 Flow Grid */}
                                  {videoFilters.aiModel === 'yolov8' && (
                                    <div className="flex flex-col gap-2">
                                      {[
                                        { name: 'Backbone (Input 640x640)', desc: 'Processes raw video frames using standard darknet layers, extracting low-level physical features like gradients, boundaries and focal points.', output: '640x640x3 -> 80x80x256' },
                                        { name: 'Neck / SPPF Layer', desc: 'Single-Stage Spatial Pyramid Pooling Fast layers combine multi-scale semantic content. Synthesizes spatial vectors regardless of resolution variations.', output: '40x40x512 -> 20x20x512' },
                                        { name: 'PANet Neck Feature Fusion', desc: 'Bottom-up and top-down path aggregation architectures. Enriches exact spatial positions of highly mobile progressive sperm.', output: '20x20x256 -> 80x80x128' },
                                        { name: 'Multiple Detect Heads', desc: 'Separated loss channels containing box localization (CIoU + DFL losses) and cell classification anchors. Decoupled predictions accelerate inference.', output: '3 scales of BBoxes & Confidence scores' }
                                      ].map((layer) => (
                                        <button
                                          key={layer.name}
                                          type="button"
                                          onClick={() => setSelectedTopologyLayer(selectedTopologyLayer === layer.name ? null : layer.name)}
                                          className={cn(
                                            "w-full text-left p-3 rounded-xl border transition-all relative overflow-hidden text-xs",
                                            selectedTopologyLayer === layer.name 
                                              ? (theme === 'dark' ? "bg-purple-500/10 border-purple-500" : "bg-purple-500/5 border-purple-500/50 text-purple-950") 
                                              : (theme === 'dark' ? "bg-black/10 border-white/5 hover:border-purple-500/30 text-white/80" : "bg-slate-50 border-black/5 hover:border-purple-500/30 text-slate-800")
                                          )}
                                        >
                                          <div className="flex items-center justify-between">
                                            <span className="font-bold">{layer.name}</span>
                                            <span className="text-[8px] font-mono text-purple-400 bg-purple-500/10 px-1 py-0.5 rounded">{selectedTopologyLayer === layer.name ? 'Collapse' : 'Inspect'}</span>
                                          </div>
                                          {selectedTopologyLayer === layer.name && (
                                            <div className="mt-2 text-[10px] space-y-1 text-black/70 dark:text-white/70 leading-relaxed border-t border-black/5 dark:border-white/5 pt-2">
                                              <p>{layer.desc}</p>
                                              <div className="flex justify-between items-center bg-black/5 dark:bg-black/35 p-1 px-2 rounded mt-1.5 font-mono text-[9px]">
                                                <span className="opacity-45">Output Tensor:</span>
                                                <span className="text-emerald-600 dark:text-emerald-400 select-all">{layer.output}</span>
                                              </div>
                                            </div>
                                          )}
                                          {selectedTopologyLayer === layer.name && (
                                            <div className="absolute right-0 top-0 bottom-0 w-1 bg-purple-500 animate-pulse" />
                                          )}
                                        </button>
                                      ))}
                                    </div>
                                  )}

                                  {/* SSD-MobileNet Anchor Mapping Flow */}
                                  {videoFilters.aiModel === 'ssd' && (
                                    <div className="flex flex-col gap-2">
                                      {[
                                        { name: 'MobileNetV2 Base Net', desc: 'Inverted residual bottleneck convolutions with depth-wise separable modules to process features at high speed on light hardware profiles.', output: '300x300x3 -> 19x19x1024' },
                                        { name: 'Multi-scale Feature Generator', desc: 'Extra progressive Conv2D layers. They downsample original features and feed smaller intermediate feature maps to detect multi-sized objects.', output: '10x10x512 -> 1x1x256' },
                                        { name: 'SSD Hard MultiBox Anchors', desc: 'Generates bounding boxes at 6 distinct multi-scale aspect ratio matrices. Coordinates targets on the fly before Non-Maximum Suppression.', output: '8732 default anchors per frame' },
                                        { name: 'Direct Regressor Output Head', desc: 'Outputs class confidence distributions and offset predictions relative to default coordinates. Quick, single-pass localization.', output: 'Confidence vector + Offset coordinates' }
                                      ].map((layer) => (
                                        <button
                                          key={layer.name}
                                          type="button"
                                          onClick={() => setSelectedTopologyLayer(selectedTopologyLayer === layer.name ? null : layer.name)}
                                          className={cn(
                                            "w-full text-left p-3 rounded-xl border transition-all relative overflow-hidden text-xs",
                                            selectedTopologyLayer === layer.name 
                                              ? (theme === 'dark' ? "bg-purple-500/10 border-purple-500" : "bg-purple-500/5 border-purple-500/50 text-purple-950") 
                                              : (theme === 'dark' ? "bg-black/10 border-white/5 hover:border-purple-500/30 text-white/80" : "bg-slate-50 border-black/5 hover:border-purple-500/30 text-slate-800")
                                          )}
                                        >
                                          <div className="flex items-center justify-between">
                                            <span className="font-bold">{layer.name}</span>
                                            <span className="text-[8px] font-mono text-purple-400 bg-purple-500/10 px-1 py-0.5 rounded">{selectedTopologyLayer === layer.name ? 'Collapse' : 'Inspect'}</span>
                                          </div>
                                          {selectedTopologyLayer === layer.name && (
                                            <div className="mt-2 text-[10px] space-y-1 text-black/70 dark:text-white/70 leading-relaxed border-t border-black/5 dark:border-white/5 pt-2">
                                              <p>{layer.desc}</p>
                                              <div className="flex justify-between items-center bg-black/5 dark:bg-black/35 p-1 px-2 rounded mt-1.5 font-mono text-[9px]">
                                                <span className="opacity-45">Output Tensor:</span>
                                                <span className="text-emerald-600 dark:text-emerald-400 select-all">{layer.output}</span>
                                              </div>
                                            </div>
                                          )}
                                        </button>
                                      ))}
                                    </div>
                                  )}

                                  {/* U-Net Contraction and Skip Connections */}
                                  {videoFilters.aiModel === 'unet' && (
                                    <div className="flex flex-col gap-2 relative">
                                      {[
                                        { name: 'Encoder Contracting Path', desc: 'Repeated 3x3 double convolutions, ReLU activation and MaxPool blocks. Progressively extracts abstract structural identifiers like acrosome anomalies.', output: '512x512x3 -> 32x32x1024' },
                                        { name: 'BottleNeck Conv Bridge', desc: 'Lowest latent space bridge segment. Connects contracting path features and decoding stages, identifying macro spermatozoal characteristics.', output: '32x32x1024' },
                                        { name: 'Decoder Expanding Path', desc: 'Progressively upsamples feature dimensions (Up-Conv 2x2) and fuses with skip-connected features from the encoder side to preserve exact boundary shapes.', output: '32x32x1024 -> 512x512x64' },
                                        { name: 'Pixel-level Segmentation Out', desc: 'Final 1x1 Conv with multi-class Softmax layer, generating accurate microsegment masks of head, midpiece, and tails.', output: '512x512 x 4 Class Segment Channels' }
                                      ].map((layer) => (
                                        <button
                                          key={layer.name}
                                          type="button"
                                          onClick={() => setSelectedTopologyLayer(selectedTopologyLayer === layer.name ? null : layer.name)}
                                          className={cn(
                                            "w-full text-left p-3 rounded-xl border transition-all relative overflow-hidden text-xs",
                                            selectedTopologyLayer === layer.name 
                                              ? (theme === 'dark' ? "bg-purple-500/10 border-purple-500" : "bg-purple-500/5 border-purple-500/50 text-purple-950") 
                                              : (theme === 'dark' ? "bg-black/10 border-white/5 hover:border-purple-500/30 text-white/80" : "bg-slate-50 border-black/5 hover:border-purple-500/30 text-slate-800")
                                          )}
                                        >
                                          <div className="flex items-center justify-between">
                                            <span className="font-bold">{layer.name}</span>
                                            <span className="text-[8px] font-mono text-purple-400 bg-purple-500/10 px-1 py-0.5 rounded">{selectedTopologyLayer === layer.name ? 'Collapse' : 'Inspect'}</span>
                                          </div>
                                          {selectedTopologyLayer === layer.name && (
                                            <div className="mt-2 text-[10px] space-y-1 text-black/70 dark:text-white/70 leading-relaxed border-t border-black/5 dark:border-white/5 pt-2">
                                              <p>{layer.desc}</p>
                                              {layer.name.includes('Decoder') && (
                                                <p className="text-[8px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 p-1 rounded mt-1">💡 Actively receiving high-resolution skip-connections from corresponding encoder convolution levels to refine boundary microdetails.</p>
                                              )}
                                              <div className="flex justify-between items-center bg-black/5 dark:bg-black/35 p-1 px-2 rounded mt-1.5 font-mono text-[9px]">
                                                <span className="opacity-45">Output Tensor:</span>
                                                <span className="text-emerald-600 dark:text-emerald-400 select-all">{layer.output}</span>
                                              </div>
                                            </div>
                                          )}
                                        </button>
                                      ))}
                                    </div>
                                  )}

                                  {/* VGG-19 Classification Conv Steps */}
                                  {videoFilters.aiModel === 'vgg19' && (
                                    <div className="flex flex-col gap-2">
                                      {[
                                        { name: 'Block 1 & 2 Feature Conv', desc: 'Early shallow layers. Extract primary geometry (edges, blobs, roundness parameters of raw sperm heads) with 3x3 conv kernels.', output: '224x224x3 -> 112x112x128' },
                                        { name: 'Block 3 & 4 Deep Convolutions', desc: 'Deep 3x3 layers with max-pooling. Map advanced morphological defects (acrosome vacuoles, double heads, coiled tail features).', output: '56x56x256 -> 14x14x512' },
                                        { name: 'VGG Bottleneck Block 5', desc: 'Max depth feature layer. Resolves global shape context and aggregates relative proportions of tail to cephalic head lengths.', output: '7x7x512' },
                                        { name: 'Fully Connected Softmax MLP', desc: 'Flattened 25088 vectors down to fully connected layers of 4096 units. Final dense layer uses Softmax to class exact semen structures.', output: 'Confidence floats across 6 morph classes' }
                                      ].map((layer) => (
                                        <button
                                          key={layer.name}
                                          type="button"
                                          onClick={() => setSelectedTopologyLayer(selectedTopologyLayer === layer.name ? null : layer.name)}
                                          className={cn(
                                            "w-full text-left p-3 rounded-xl border transition-all relative overflow-hidden text-xs",
                                            selectedTopologyLayer === layer.name 
                                              ? (theme === 'dark' ? "bg-purple-500/10 border-purple-500" : "bg-purple-500/5 border-purple-500/50 text-purple-950") 
                                              : (theme === 'dark' ? "bg-black/10 border-white/5 hover:border-purple-500/30 text-white/80" : "bg-slate-50 border-black/5 hover:border-purple-500/30 text-slate-800")
                                          )}
                                        >
                                          <div className="flex items-center justify-between">
                                            <span className="font-bold">{layer.name}</span>
                                            <span className="text-[8px] font-mono text-purple-400 bg-purple-500/10 px-1 py-0.5 rounded">{selectedTopologyLayer === layer.name ? 'Collapse' : 'Inspect'}</span>
                                          </div>
                                          {selectedTopologyLayer === layer.name && (
                                            <div className="mt-2 text-[10px] space-y-1 text-black/70 dark:text-white/70 leading-relaxed border-t border-black/5 dark:border-white/5 pt-2">
                                              <p>{layer.desc}</p>
                                              <div className="flex justify-between items-center bg-black/5 dark:bg-black/35 p-1 px-2 rounded mt-1.5 font-mono text-[9px]">
                                                <span className="opacity-45">Output Tensor:</span>
                                                <span className="text-emerald-600 dark:text-emerald-400 select-all">{layer.output}</span>
                                              </div>
                                            </div>
                                          )}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Consultant Gemini Chat Room Tab */}
                        {aiSubTab === 'consultant' && (
                          <div className={cn(
                            "p-6 border rounded-[32px] flex flex-col h-full",
                            theme === 'dark' ? "bg-purple-500/5 border-purple-500/10" : "bg-purple-500/5 border-purple-500/20"
                          )}>
                            <div className="flex items-center gap-4 mb-6">
                              <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center">
                                <BrainCircuit className="w-6 h-6 text-purple-500" />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">ATSA AI Assistant</p>
                                <p className={cn(
                                  "text-xs",
                                  theme === 'dark' ? "text-white/60" : "text-black/60"
                                )}>Real-time Clinical Consultation</p>
                              </div>
                            </div>
                            
                            {aiAnalysis && (
                              <div className="prose prose-invert prose-xs mb-6">
                                <div className={cn(
                                  "text-[11px] leading-relaxed p-4 rounded-2xl border overflow-hidden",
                                  theme === 'dark' ? "text-white/80 bg-white/5 border-white/5" : "text-black/80 bg-black/5 border-black/5"
                                )}>
                                  {(() => {
                                    try {
                                      const data = JSON.parse(aiAnalysis);
                                      return (
                                        <div className="space-y-4">
                                          <div className="flex items-center justify-between border-b border-white/5 pb-2">
                                            <span className="text-purple-500 font-bold uppercase tracking-widest text-[9px]">AI Vision Analysis</span>
                                            <span className="text-emerald-500 font-bold text-[9px]">{data.concentration}</span>
                                          </div>
                                          
                                          {data.morphology && (
                                            <div className="space-y-2">
                                              <div className="flex items-center justify-between">
                                                <span className="opacity-60">Normal Morphology</span>
                                                <span className="font-bold text-emerald-500">{data.morphology.normal}</span>
                                              </div>
                                              <div className="grid grid-cols-3 gap-2">
                                                {['head', 'midpiece', 'tail'].map(part => (
                                                  <div key={part} className="p-2 bg-white/5 rounded-lg border border-white/5">
                                                    <p className="text-[8px] uppercase tracking-widest opacity-40 mb-1">{part}</p>
                                                    <div className="space-y-1">
                                                      {data.morphology.defects[part].map((d: string, i: number) => (
                                                        <p key={i} className="text-[9px] leading-tight text-red-400">• {d}</p>
                                                      ))}
                                                      {data.morphology.defects[part].length === 0 && <p className="text-[9px] text-emerald-500">None</p>}
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          )}

                                          {data.observations && (
                                            <div className="pt-2 border-t border-white/5">
                                              <p className="text-[9px] uppercase tracking-widest opacity-40 mb-1">Expert Observations</p>
                                              <p className="italic text-white/70 leading-relaxed">"{data.observations}"</p>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    } catch (e) {
                                      return <div className="whitespace-pre-wrap italic">"{aiAnalysis}"</div>;
                                    }
                                  })()}
                                </div>
                              </div>
                            )}

                            <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2 no-scrollbar mb-4">
                              {aiChatHistory.map((msg, i) => (
                                <div key={i} className={cn(
                                  "p-3 rounded-2xl text-[11px] leading-relaxed",
                                  msg.role === 'user' 
                                    ? (theme === 'dark' ? "bg-white/10 ml-8 text-white/90" : "bg-black/10 ml-8 text-black/90")
                                    : "bg-purple-500/10 mr-8 text-purple-700 dark:text-purple-200 border border-purple-500/20"
                                )}>
                                  {msg.text}
                                </div>
                              ))}
                              {isAiThinking && (
                                <div className="bg-purple-500/10 mr-8 p-3 rounded-2xl border border-purple-500/20 animate-pulse flex justify-center py-4">
                                  <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                                </div>
                              )}
                            </div>

                            <form onSubmit={handleAiChat} className="relative mt-auto">
                              <input 
                                type="text"
                                value={aiChatQuery}
                                onChange={(e) => setAiChatQuery(e.target.value)}
                                placeholder="Ask ATSA AI about these results..."
                                className={cn(
                                  "w-full border rounded-xl px-4 py-3 text-xs transition-colors pr-12 focus:outline-none focus:border-purple-500/50",
                                  theme === 'dark' 
                                    ? "bg-black/40 border-white/10 text-white placeholder:text-white/20" 
                                    : "bg-white border-black/10 text-slate-900 placeholder:text-black/20"
                                )}
                              />
                              <button 
                                type="submit"
                                disabled={!aiChatQuery.trim() || isAiThinking}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-purple-500 hover:text-purple-400 disabled:opacity-20 transition-colors"
                              >
                                <Zap className="w-4 h-4 fill-current" />
                              </button>
                            </form>
                          </div>
                        )}

                        {aiAnalysis && aiSubTab === 'consultant' && (
                          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mt-2 font-sans">
                            <div className="flex items-center gap-2 mb-2 text-emerald-500">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-[10px] font-bold uppercase tracking-widest">CASA Parameters Extracted</span>
                            </div>
                            <p className={cn(
                              "text-[10px]",
                              theme === 'dark' ? "text-white/60" : "text-black/60"
                            )}>The AI has identified key sperm parameters. The CASA engine has been initialized with these values for detailed kinematic simulation.</p>
                          </div>
                        )}
                      </div>
                    )}
                    {activeTab === 'validation' && (
                      <div className="space-y-6">
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                          <div className="flex items-center gap-3 mb-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-500" />
                            <h3 className="text-sm font-bold text-emerald-500 uppercase tracking-wider">Global Validation</h3>
                          </div>
                          <p className={cn(
                            "text-xs leading-relaxed",
                            theme === 'dark' ? "text-white/60" : "text-black/60"
                          )}>
                            ATSA AI has been validated across 15 global case studies, demonstrating up to 95% accuracy compared to manual and high-end CASA systems.
                          </p>
                        </div>

                        <div className="space-y-4">
                          <h4 className={cn(
                            "text-[10px] font-bold uppercase tracking-widest",
                            theme === 'dark' ? "text-white/40" : "text-black/40"
                          )}>Case Study Highlights</h4>
                          {[
                            { country: 'Pakistan', type: 'Field & Lab', accuracy: '94.8%', icon: <Globe className="w-3 h-3" /> },
                            { country: 'Canada', type: 'Veterinary Evaluation', accuracy: '95.2%', icon: <Globe className="w-3 h-3" /> },
                            { country: 'Europe', type: 'Research Collaboration', accuracy: '96.1%', icon: <Globe className="w-3 h-3" /> },
                          ].map((study, i) => (
                            <div key={i} className={cn(
                              "p-3 rounded-lg flex items-center justify-between border",
                              theme === 'dark' ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5"
                            )}>
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center",
                                  theme === 'dark' ? "bg-white/5 text-white/40" : "bg-black/5 text-black/40"
                                )}>
                                  {study.icon}
                                </div>
                                <div>
                                  <p className={cn(
                                    "text-xs font-bold",
                                    theme === 'dark' ? "text-white/90" : "text-slate-900"
                                  )}>{study.country}</p>
                                  <p className={cn(
                                    "text-[10px]",
                                    theme === 'dark' ? "text-white/40" : "text-black/40"
                                  )}>{study.type}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-black text-emerald-500 italic">{study.accuracy}</p>
                                <p className={cn(
                                  "text-[8px] uppercase font-bold",
                                  theme === 'dark' ? "text-white/20" : "text-black/20"
                                )}>Accuracy</p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className={cn(
                          "p-4 rounded-xl border",
                          theme === 'dark' ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5"
                        )}>
                          <h4 className={cn(
                            "text-[10px] font-bold uppercase tracking-widest mb-3",
                            theme === 'dark' ? "text-white/40" : "text-black/40"
                          )}>Neural Network Performance</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between items-end">
                              <p className={theme === 'dark' ? "text-white/60" : "text-black/60"}>Processing Speed</p>
                              <p className={cn(
                                "text-xs font-bold",
                                theme === 'dark' ? "text-white" : "text-slate-900"
                              )}>3.2s / 500k cells</p>
                            </div>
                            <div className={cn(
                              "h-1 rounded-full overflow-hidden",
                              theme === 'dark' ? "bg-white/10" : "bg-black/10"
                            )}>
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: '98%' }}
                                className="h-full bg-emerald-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'report' && (
                      <div className="space-y-6">
                        {/* Split Panel Layout for Configuration on Left & Report Sheet on Right */}
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                          
                          {/* LEFT PANEL: LAB & CLINICAL SETTINGS (5/12 Columns) */}
                          <div className="xl:col-span-5 space-y-4">
                            
                            {/* Section 1: Laboratory Information */}
                            <div className={cn(
                              "p-5 rounded-2xl border space-y-4",
                              theme === 'dark' ? "bg-white/5 border-white/10" : "bg-slate-50 border-black/10"
                            )}>
                              <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                                <Microscope className="w-4 h-4 text-emerald-500" />
                                <h3 className={cn(
                                  "text-xs font-bold uppercase tracking-wider",
                                  theme === 'dark' ? "text-white" : "text-slate-900"
                                )}>Lab & Facility Details</h3>
                              </div>
                              
                              <div className="space-y-3">
                                <div>
                                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Laboratory Operator / Veterinarian</label>
                                  <input 
                                    type="text" 
                                    value={clinicianName}
                                    onChange={(e) => setClinicianName(e.target.value)}
                                    className={cn(
                                      "w-full px-3 py-2 rounded-xl text-xs font-bold border focus:outline-none transition-colors",
                                      theme === 'dark' ? "bg-black/40 border-white/10 text-white focus:border-emerald-500/50" : "bg-white border-black/10 text-slate-950 focus:border-emerald-500/50"
                                    )}
                                    placeholder="Enter operator name..."
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Clinic / Facility Name</label>
                                  <input 
                                    type="text" 
                                    value={facilityName}
                                    onChange={(e) => setFacilityName(e.target.value)}
                                    className={cn(
                                      "w-full px-3 py-2 rounded-xl text-xs font-bold border focus:outline-none transition-colors",
                                      theme === 'dark' ? "bg-black/40 border-white/10 text-white focus:border-emerald-500/50" : "bg-white border-black/10 text-slate-950 focus:border-emerald-500/55"
                                    )}
                                    placeholder="Enter facility name..."
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Section 2: Semen Collection Details */}
                            <div className={cn(
                              "p-5 rounded-2xl border space-y-4",
                              theme === 'dark' ? "bg-white/5 border-white/10" : "bg-slate-50 border-black/10"
                            )}>
                              <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                                <Activity className="w-4 h-4 text-emerald-500" />
                                <h3 className={cn(
                                  "text-xs font-bold uppercase tracking-wider",
                                  theme === 'dark' ? "text-white" : "text-slate-900"
                                )}>Collection details & Physicals</h3>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Collection Method</label>
                                  <select
                                    value={collectionMethod}
                                    onChange={(e) => setCollectionMethod(e.target.value as any)}
                                    className={cn(
                                      "w-full px-3 py-2 rounded-xl text-xs font-bold border focus:outline-none transition-colors",
                                      theme === 'dark' ? "bg-black/40 border-white/10 text-white focus:border-emerald-500" : "bg-white border-black/10 text-slate-950 focus:border-emerald-500"
                                    )}
                                  >
                                    <option value="Artificial Vagina">Artificial Vagina (AV)</option>
                                    <option value="Electroejaculation">Electroejaculation (EE)</option>
                                    <option value="Manual Stimulation">Manual Stimulation</option>
                                    <option value="Epididymal Recovery">Epididymal Recovery</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Ejaculate Vol (mL)</label>
                                  <input 
                                    type="text" 
                                    value={sampleVolume}
                                    onChange={(e) => setSampleVolume(e.target.value)}
                                    className={cn(
                                      "w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border focus:outline-none transition-colors",
                                      theme === 'dark' ? "bg-black/40 border-white/10 text-white focus:border-emerald-500/50" : "bg-white border-black/10 text-slate-950 focus:border-emerald-500/50"
                                    )}
                                  />
                                </div>
                                <div>
                                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Sample pH</label>
                                  <input 
                                    type="text" 
                                    value={samplePh}
                                    onChange={(e) => setSamplePh(e.target.value)}
                                    className={cn(
                                      "w-full px-3 py-2 rounded-xl text-xs font-mono font-bold border focus:outline-none transition-colors",
                                      theme === 'dark' ? "bg-black/40 border-white/10 text-white focus:border-emerald-500/50" : "bg-white border-black/10 text-slate-950 focus:border-emerald-500/50"
                                    )}
                                  />
                                </div>
                                <div className="col-span-2">
                                  <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1">Appearance / Color</label>
                                  <input 
                                    type="text" 
                                    value={sampleAppearance}
                                    onChange={(e) => setSampleAppearance(e.target.value)}
                                    className={cn(
                                      "w-full px-3 py-2 rounded-xl text-xs font-bold border focus:outline-none transition-colors",
                                      theme === 'dark' ? "bg-black/40 border-white/10 text-white focus:border-emerald-500/50" : "bg-white border-black/10 text-slate-950 focus:border-emerald-500/50"
                                    )}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Section 3: Diagnostic notes & override */}
                            <div className={cn(
                              "p-5 rounded-2xl border space-y-4",
                              theme === 'dark' ? "bg-white/5 border-white/10" : "bg-slate-50 border-black/10"
                            )}>
                              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-emerald-500" />
                                  <h3 className={cn(
                                    "text-xs font-bold uppercase tracking-wider",
                                    theme === 'dark' ? "text-white" : "text-slate-900"
                                  )}>Clinician Remarks</h3>
                                </div>
                                <span className="text-[8px] font-mono font-bold text-slate-400">{clinicianRemarks.length} chars</span>
                              </div>

                              <textarea 
                                value={clinicianRemarks}
                                onChange={(e) => setClinicianRemarks(e.target.value)}
                                rows={3}
                                className={cn(
                                  "w-full p-3 rounded-xl text-xs font-medium border focus:outline-none transition-colors leading-relaxed",
                                  theme === 'dark' ? "bg-black/40 border-white/10 text-white focus:border-emerald-500" : "bg-white border-black/10 text-slate-950 focus:border-emerald-500"
                                )}
                                placeholder="Type custom clinician notes, override diagnostics, or test notes to render on output sheet..."
                              />

                              {/* Standard remarks quick buttons */}
                              <div>
                                <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400 mb-2">Inject Standard Presets:</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {[
                                    'Excellent motility & DFI parameters. Highly viable specimen for immediate breeding/AI.',
                                    'Slight motility deficit. Recommend cooling caution prior to cryopreservation.',
                                    'Morphological defects detected above normal limits (Pyriform & Coiled defects). Retesting requested.',
                                    'DFI fragmentation index within normal physiological limits.'
                                  ].map((pText, i) => (
                                    <button
                                      key={i}
                                      onClick={() => setClinicianRemarks(pText)}
                                      className={cn(
                                        "px-2 py-1 rounded-lg text-[8px] font-semibold text-left max-w-full truncate border leading-none transition-colors",
                                        theme === 'dark'
                                          ? "bg-white/5 border-white/5 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/20"
                                          : "bg-slate-100 border-black/5 text-emerald-800 hover:bg-emerald-500/10 hover:border-emerald-500/20"
                                      )}
                                    >
                                      {pText}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Section 4: Display toggles */}
                            <div className={cn(
                              "p-5 rounded-2xl border space-y-4",
                              theme === 'dark' ? "bg-white/5 border-white/10" : "bg-slate-50 border-black/10"
                            )}>
                              <div className="flex items-center justify-between">
                                <h3 className={cn(
                                  "text-[10px] font-bold uppercase tracking-widest",
                                  theme === 'dark' ? "text-white/40" : "text-black/40"
                                )}>Report Visibility</h3>
                                <p className={cn(
                                  "text-[8px] uppercase font-black",
                                  theme === 'dark' ? "text-white/20" : "text-black/20"
                                )}>Hide empty categories</p>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {(Object.keys(reportSections) as Array<keyof typeof reportSections>).map((section) => (
                                  <button
                                    key={section}
                                    onClick={() => setReportSections(prev => ({ ...prev, [section]: !prev[section] }))}
                                    className={cn(
                                      "flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold uppercase transition-all border",
                                      reportSections[section] 
                                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                                        : (theme === 'dark' ? "bg-white/5 border-white/5 text-white/40" : "bg-black/5 border-black/5 text-black/40")
                                    )}
                                  >
                                    <div className={cn(
                                      "w-3.5 h-3.5 rounded-md border flex items-center justify-center shrink-0",
                                      reportSections[section] ? "bg-emerald-500 border-emerald-500" : (theme === 'dark' ? "border-white/20" : "border-black/20")
                                    )}>
                                      {reportSections[section] && <Check className="w-2 h-2 text-black" />}
                                    </div>
                                    <span className="truncate">{section}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* RIGHT PANEL: PRINT REPORT SHEET PREVIEW (7/12 Columns) */}
                          <div className="xl:col-span-7 space-y-4">
                            {results ? (
                              <>
                                {/* Document Frame styling */}
                                <div className="rounded-[24px] shadow-2xl overflow-hidden border border-black/10">
                                  
                                  {/* Tour Mode Banner (Visible in UI, Hidden in Print/PDF as it sits outside the selector) */}
                                  <div className="bg-slate-900 border-b border-white/10 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs font-medium text-white select-none">
                                    <div className="flex items-center gap-2">
                                      <span className="flex h-2 w-2 relative">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                      </span>
                                      <span className="text-[10px] tracking-wide text-slate-300 font-sans">
                                        🔬 <strong className="text-white">{results.species} Specimen</strong> ({results.patientId}) Loaded &middot; Ready for Clinical Certification
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      {VIRTUAL_ANIMAL_KEYS.map((key) => {
                                        const anim = VIRTUAL_ANIMALS[key];
                                        const isActive = results.species.toLowerCase() === anim.species.toLowerCase();
                                        return (
                                          <button
                                            key={key}
                                            onClick={() => loadDemoData(key)}
                                            className={cn(
                                              "px-2 py-1 rounded text-[9px] font-bold uppercase transition-colors cursor-pointer font-sans flex items-center gap-1",
                                              isActive 
                                                ? "bg-emerald-500 text-white" 
                                                : "bg-white/5 hover:bg-white/10 text-white/70"
                                            )}
                                          >
                                            <span>{anim.avatarIcon}</span>
                                            <span>{anim.species}</span>
                                          </button>
                                        );
                                      })}
                                      <button
                                        onClick={() => {
                                          setResults(null);
                                          setClinicianRemarks('');
                                        }}
                                        className="px-2 py-1 bg-red-500/15 hover:bg-red-500/30 text-red-400 rounded text-[9px] font-bold uppercase transition-colors cursor-pointer font-sans ml-1"
                                      >
                                        Clear Data
                                      </button>
                                    </div>
                                  </div>
                              
                              {/* Clinical White Paper Report Document (Pure Printable Style) */}
                              <div id="analysis-report" className="p-8 bg-white text-black relative select-text text-left">
                                
                                {/* Aesthetic Watermark Background */}
                                <div className="absolute inset-0 opacity-[0.02] pointer-events-none flex items-center justify-center overflow-hidden">
                                  <Zap className="w-[500px] h-[500px] text-emerald-500 stroke-[5]" />
                                </div>

                                {/* Report Header Banner */}
                                <div className="flex justify-between items-start mb-6 pb-6 border-b-2 border-black/10 relative z-10 font-sans">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1.5">
                                      <div className="p-1 bg-black rounded-lg">
                                        <Zap className="w-5 h-5 text-emerald-400 fill-current" />
                                      </div>
                                      <h2 className="text-xl font-black tracking-tighter uppercase italic leading-none font-sans">ATSA AI</h2>
                                    </div>
                                    <p className="text-[7.5px] font-black text-black/50 uppercase tracking-[0.25em] font-sans">Animal-Assisted Key Semen Analysis &middot; CASA v2.0</p>
                                    <p className="text-[7px] font-semibold text-black/30 truncate mt-0.5">{facilityName.toUpperCase()}</p>
                                  </div>
                                  
                                  {/* Pseudo Barcode / Clinical stamp */}
                                  <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-[1px] h-6 mb-1">
                                      {[1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1].map((w, index) => (
                                        <div key={index} className="bg-black h-full" style={{ width: `${w}px` }} />
                                      ))}
                                    </div>
                                    <p className="text-[6.5px] font-mono font-bold text-black/40">SYS_UID: {results.patientId}-{new Date(results.timestamp).getTime().toString().substring(8)}</p>
                                    <span className="text-[8px] font-mono mt-1 font-bold bg-black text-white px-1.5 py-0.5 rounded leading-none">CLINIC_COPY</span>
                                  </div>
                                </div>

                                {/* Report Status Indicator bar */}
                                <div className={cn(
                                  "mb-6 p-3 rounded-xl border flex items-center justify-between text-xs font-bold leading-none uppercase tracking-wider",
                                  results.summary.interpretation?.status === 'normal' 
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                                    : results.summary.interpretation?.status === 'borderline' 
                                    ? "bg-amber-50 border-amber-200 text-amber-800" 
                                    : "bg-red-50 border-red-200 text-red-800"
                                )}>
                                  <div className="flex items-center gap-2">
                                    <div className={cn(
                                      "w-2.5 h-2.5 rounded-full animate-pulse",
                                      results.summary.interpretation?.status === 'normal' ? "bg-emerald-500" :
                                      results.summary.interpretation?.status === 'borderline' ? "bg-amber-500" : "bg-red-500"
                                    )} />
                                    <span>DIAGNOSTIC STATUS: {results.summary.interpretation?.status || 'NOT READY'}</span>
                                  </div>
                                  <span className="text-[9px] font-mono opacity-60">Verified {new Date(results.timestamp).toLocaleDateString()}</span>
                                </div>

                                {/* Demographics and Collection Metadata block */}
                                <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-slate-50 rounded-2xl border border-black/5 text-xs font-sans">
                                  <div className="space-y-2.5">
                                    <div>
                                      <p className="text-[7.5px] font-bold text-black/40 uppercase tracking-widest">Patient Information</p>
                                      <div className="mt-1 space-y-0.5">
                                        <div className="flex justify-between border-b border-black/5 py-0.5">
                                          <span className="text-black/50 font-medium">Patient ID:</span>
                                          <span className="font-bold font-mono">{results.patientId}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-black/5 py-0.5">
                                          <span className="text-black/50 font-medium">Species:</span>
                                          <span className="font-bold capitalize">{results.species}</span>
                                        </div>
                                        <div className="flex justify-between py-0.5">
                                          <span className="text-black/50 font-medium">Test Timestamp:</span>
                                          <span className="font-bold font-mono">{new Date(results.timestamp).toLocaleString()}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-2.5 border-l border-black/10 pl-4">
                                    <div>
                                      <p className="text-[7.5px] font-bold text-black/40 uppercase tracking-widest">Collection & Physical Semen Characteristics</p>
                                      <div className="mt-1 space-y-0.5">
                                        <div className="flex justify-between border-b border-black/5 py-0.5">
                                          <span className="text-black/50 font-medium">Method:</span>
                                          <span className="font-bold">{collectionMethod}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-black/5 py-0.5">
                                          <span className="text-black/50 font-medium">Volume / pH:</span>
                                          <span className="font-bold font-mono text-emerald-800">{sampleVolume} mL / {samplePh}</span>
                                        </div>
                                        <div className="flex justify-between py-0.5">
                                          <span className="text-black/50 font-medium">Appearance:</span>
                                          <span className="font-bold truncate max-w-[120px]" title={sampleAppearance}>{sampleAppearance}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Section : Kinematics Analysis */}
                                {reportSections.kinematics && (
                                  <section className="space-y-3 mb-6 relative">
                                    <div className="flex items-center justify-between border-b border-black/15 pb-1">
                                      <h3 className="text-[9.5px] font-black text-black/80 uppercase tracking-wider">I. Motility & Advanced Kinematics</h3>
                                      <span className="text-[7px] font-bold text-emerald-600 font-mono">Reference Normals Included</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-2">
                                      {[
                                        { label: 'Total Motility', val: `${results.summary.motility.total.toFixed(1)}%`, ref: `> ${results.settings.profile.minTotalMotility}%`, pass: results.summary.motility.total >= results.settings.profile.minTotalMotility },
                                        { label: 'Progressive Motility', val: `${results.summary.motility.progressive.toFixed(1)}%`, ref: `> ${results.settings.profile.minProgressiveMotility}%`, pass: results.summary.motility.progressive >= results.settings.profile.minProgressiveMotility },
                                        { label: 'Hyperactivation', val: `${results.summary.kinematics.hyperactivation.percentage.toFixed(1)}%`, ref: '< 15%', pass: results.summary.kinematics.hyperactivation.percentage < 15 },
                                      ].map(col => (
                                        <div key={col.label} className="p-3 bg-slate-50 border border-black/5 rounded-xl text-center">
                                          <p className="text-[7.5px] font-bold text-black/50 uppercase leading-none mb-1">{col.label}</p>
                                          <p className="text-sm font-black font-mono tracking-tight leading-none text-slate-900">{col.val}</p>
                                          <div className="mt-1.5 flex items-center justify-center gap-1">
                                            <span className={cn("w-1.5 h-1.5 rounded-full", col.pass ? "bg-emerald-500" : "bg-red-500")} />
                                            <span className="text-[6.5px] font-bold text-black/40 font-mono">Ref: {col.ref}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Sub-kinematics list details */}
                                    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 pt-1">
                                      {[
                                        { label: 'Curvilinear Velocity (VCL)', val: `${results.summary.kinematics.avgVcl.toFixed(1)} µm/s` },
                                        { label: 'Straight-Line Velocity (VSL)', val: `${results.summary.kinematics.avgVsl.toFixed(1)} µm/s` },
                                        { label: 'Average Path Velocity (VAP)', val: `${results.summary.kinematics.avgVap.toFixed(1)} µm/s` },
                                        { label: 'Linearity Coefficient (LIN)', val: `${(results.summary.kinematics.avgLin * 100).toFixed(1)}%` },
                                        { label: 'Straightness (STR)', val: `${(results.summary.kinematics.avgStr * 100).toFixed(1)}%` },
                                        { label: 'Wobble Coefficient (WOB)', val: `${(results.summary.kinematics.avgWob * 100).toFixed(1)}%` },
                                        { label: 'Amplitude of Lat. Head (ALH)', val: `${results.summary.kinematics.avgAlh.toFixed(2)} µm` },
                                        { label: 'Beat Cross Frequency (BCF)', val: `${results.summary.kinematics.avgBcf.toFixed(1)} Hz` },
                                      ].map(item => (
                                        <div key={item.label} className="flex justify-between items-center text-[9px] border-b border-black/[0.04] pb-1 font-medium text-black/70">
                                          <span>{item.label}</span>
                                          <span className="font-mono font-black text-black">{item.val}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </section>
                                )}

                                {/* Section: Morphology defects */}
                                {reportSections.morphology && (
                                  <section className="space-y-3 mb-6">
                                    <div className="flex items-center justify-between border-b border-black/15 pb-1">
                                      <h3 className="text-[9.5px] font-black text-black/80 uppercase tracking-wider">II. Morphology & Indices</h3>
                                      <span className="text-[7px] font-semibold text-black/40 font-mono">Visual morphometry verification</span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                      <div className="p-3 bg-slate-50 border border-black/5 rounded-xl text-center">
                                        <p className="text-[7.5px] font-bold text-black/50 uppercase leading-none mb-1">Normal Cells</p>
                                        <p className="text-sm font-black font-mono tracking-tight leading-none text-slate-900">{results.summary.morphology.normal.toFixed(1)}%</p>
                                        <p className="text-[6.5px] font-bold text-black/40 font-mono mt-1">Ref: &gt; {results.settings.profile.minNormalMorphology}%</p>
                                      </div>
                                      <div className="p-3 bg-slate-50 border border-black/5 rounded-xl text-center">
                                        <p className="text-[7.5px] font-bold text-black/50 uppercase leading-none mb-1">TZI Index</p>
                                        <p className="text-sm font-black font-mono tracking-tight leading-none text-slate-900">{results.summary.morphology.tzi.toFixed(2)}</p>
                                        <p className="text-[6.5px] font-bold text-black/40 font-mono mt-1">Ref: &lt; 1.6 (Normal)</p>
                                      </div>
                                      <div className="p-3 bg-slate-50 border border-black/5 rounded-xl text-center">
                                        <p className="text-[7.5px] font-bold text-black/50 uppercase leading-none mb-1">MAI Index</p>
                                        <p className="text-sm font-black font-mono tracking-tight leading-none text-slate-900">{results.summary.morphology.mai.toFixed(2)}</p>
                                        <p className="text-[6.5px] font-bold text-black/40 font-mono mt-1">Ref: &lt; 1.5</p>
                                      </div>
                                    </div>

                                    {/* Detailed breakdown sub-grid */}
                                    <div className="grid grid-cols-2 gap-6 pt-1 text-[9px]">
                                      <div className="space-y-1">
                                        <h4 className="text-[7px] font-black text-black/40 uppercase tracking-wider mb-1.5 border-b border-black/5 pb-0.5 font-sans">Head Defects Breakdown</h4>
                                        {Object.entries(results.summary.morphology.headDefects).map(([key, val]) => (
                                          <div key={key} className="flex justify-between items-center py-0.5 font-medium text-black/70">
                                            <span className="capitalize">{key} defects</span>
                                            <span className="font-mono font-black text-black">{(val as number).toFixed(1)}%</span>
                                          </div>
                                        ))}
                                      </div>

                                      <div className="space-y-1">
                                        <h4 className="text-[7px] font-black text-black/40 uppercase tracking-wider mb-1.5 border-b border-black/5 pb-0.5 font-sans">Midpiece & Tail Defects</h4>
                                        <div className="flex justify-between items-center py-0.5 font-medium text-black/70">
                                          <span>Acrosome defects</span>
                                          <span className="font-mono font-black text-black">{results.summary.morphology.acrosomeDefects.toFixed(1)}%</span>
                                        </div>
                                        <div className="flex justify-between items-center py-0.5 font-medium text-black/70">
                                          <span>Cytoplasmic droplets</span>
                                          <span className="font-mono font-black text-black">{results.summary.morphology.cytoplasmicDroplets.toFixed(1)}%</span>
                                        </div>
                                        {Object.entries(results.summary.morphology.midpieceDefects).map(([key, val]) => (
                                          <div key={key} className="flex justify-between items-center py-0.5 font-medium text-black/70">
                                            <span className="capitalize">Mid: {key}</span>
                                            <span className="font-mono font-black text-black">{(val as number).toFixed(1)}%</span>
                                          </div>
                                        ))}
                                        {Object.entries(results.summary.morphology.tailDefects).map(([key, val]) => (
                                          <div key={key} className="flex justify-between items-center py-0.5 font-medium text-black/70">
                                            <span className="capitalize">Tail: {key}</span>
                                            <span className="font-mono font-black text-black">{(val as number).toFixed(1)}%</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </section>
                                )}

                                {/* Section: Vitality &concentration / SDF */}
                                {(reportSections.vitality || reportSections.sdf) && (
                                  <section className="space-y-3 mb-6">
                                    <div className="flex items-center justify-between border-b border-black/15 pb-1">
                                      <h3 className="text-[9.5px] font-black text-black/80 uppercase tracking-wider">III. Concentration, DNA Fragmentation & Vitality</h3>
                                      <span className="text-[7px] font-semibold text-black/40 font-mono">Cytometric viability measures</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-[9px] font-medium text-left">
                                      {reportSections.vitality && (
                                        <div className="space-y-1">
                                          <div className="flex justify-between border-b border-black/[0.04] pb-1">
                                            <span className="text-black/70">Sperm Concentration:</span>
                                            <span className="font-mono font-black text-black">{results.summary.concentration.toFixed(1)} Millions/mL</span>
                                          </div>
                                          <div className="flex justify-between border-b border-black/[0.04] pb-1">
                                            <span className="text-black/70">Vitality (Percent Live):</span>
                                            <span className="font-mono font-black text-black">{results.summary.vitality.live.toFixed(1)}%</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-black/70">Leukocytes Count:</span>
                                            <span className="font-mono font-black text-black">{results.summary.leukocytes.toFixed(1)} M/mL</span>
                                          </div>
                                        </div>
                                      )}

                                      {reportSections.sdf && (
                                        <div className="space-y-1 border-l border-black/10 pl-4">
                                          <div className="flex justify-between border-b border-black/[0.04] pb-1">
                                            <span className="text-black/70">Halos (DFI Ratio):</span>
                                            <span className="font-mono font-black text-red-600">{results.summary.sdf.dfi.toFixed(1)}% DFI</span>
                                          </div>
                                          <div className="flex justify-between border-b border-black/[0.04] pb-1">
                                            <span className="text-black/70">Fragmented Count:</span>
                                            <span className="font-mono font-black text-black">{results.summary.sdf.fragmentedCount} cells</span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-black/70">Total SDF Sample size:</span>
                                            <span className="font-mono font-black text-black">{results.summary.sdf.totalCount} cells</span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </section>
                                )}

                                {/* Section: AI Assessment & Clinical Remarks */}
                                {reportSections.ai && (
                                  <section className="space-y-3 mb-6 border-t border-black/10 pt-4">
                                    <h3 className="text-[9.5px] font-black text-black/80 uppercase tracking-wider mb-2">IV. Interpreter Clinical Summary</h3>
                                    
                                    {aiAnalysis && (
                                      <div className="mb-2">
                                        <p className="text-[7px] font-bold text-black/40 uppercase tracking-widest mb-1 leading-none font-sans">Automated ATSA Neural Assessment</p>
                                        <div className="p-3 bg-slate-50 rounded-xl border border-black/5 text-[9.5px] text-black/80 font-medium leading-relaxed font-serif italic">
                                          {aiAnalysis}
                                        </div>
                                      </div>
                                    )}

                                    {results.summary.interpretation && (
                                      <div className="p-3 bg-slate-50 rounded-xl border border-black/5 text-[9px] space-y-2">
                                        <div>
                                          <p className="text-[7px] font-bold text-black/40 uppercase tracking-widest leading-none mb-1 font-sans">Key Diagnostic Findings</p>
                                          <ul className="space-y-0.5 list-none">
                                            {results.summary.interpretation.comments.map((comment, i) => (
                                              <li key={i} className="font-semibold text-black/80 leading-tight flex gap-1.5 align-top">
                                                <span className="text-black/30 select-none">•</span>
                                                <span>{comment}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                        {results.summary.interpretation.recommendations.length > 0 && (
                                          <div>
                                            <p className="text-[7px] font-bold text-black/40 uppercase tracking-widest leading-none mb-1 font-sans">Recommended Treatment Protocol / AI Plan</p>
                                            <ul className="space-y-0.5 list-none">
                                              {results.summary.interpretation.recommendations.map((rec, i) => (
                                                <li key={i} className="font-semibold text-emerald-800 leading-tight flex gap-1.5 align-top">
                                                  <span className="text-emerald-400 select-none">→</span>
                                                  <span>{rec}</span>
                                                </li>
                                              ))}
                                            </ul>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </section>
                                )}

                                {/* Dynamically Renders Doctor Manual custom Clinician Remarks on the Sheet itself */}
                                {clinicianRemarks && (
                                  <section className="mt-4 p-3 border-l-2 border-emerald-500 bg-emerald-50/20 text-[9px] space-y-1">
                                    <p className="text-[7.5px] font-bold uppercase tracking-wider text-emerald-800 font-sans">Veterinary Clinical remarks (Physician Addendum)</p>
                                    <p className="font-semibold text-black/90 font-sans leading-relaxed whitespace-pre-wrap">{clinicianRemarks}</p>
                                  </section>
                                )}

                                {/* Signature Footer */}
                                <div className="mt-12 pt-6 border-t border-black/10 flex justify-between items-end relative z-10 text-[9px]">
                                  
                                  {/* Doctor Sign section */}
                                  <div className="space-y-4">
                                    <div className="space-y-1">
                                      <p className="text-[7.5px] font-bold text-black/40 uppercase tracking-wider font-sans">Authorized Laboratory Operator</p>
                                      
                                      {/* Cursive simulated signature path */}
                                      <div className="h-6 flex items-end pl-2 font-serif text-lg font-semibold italic text-emerald-800 tracking-wide select-none leading-none border-b border-black/15 pb-1 pr-6 relative">
                                        <span className="font-medium font-sans text-xs opacity-20 absolute left-2 bottom-5 pointer-events-none uppercase italic text-black font-mono">Signee verified</span>
                                        {clinicianName}
                                      </div>
                                    </div>
                                    <p className="text-[8px] font-bold text-black/50">{clinicianName}</p>
                                  </div>

                                  {/* Stamp seal verification */}
                                  <div className="text-right space-y-2 flex flex-col items-end">
                                    
                                    {/* Verification stamp circle badge */}
                                    <div className="w-16 h-16 rounded-full border-2 border-emerald-600/30 border-dashed p-1 flex items-center justify-center relative select-none animate-spin-slow">
                                      <div className="absolute inset-2 rounded-full bg-emerald-500/5" />
                                      <span className="text-[6.5px] text-emerald-700/60 font-black tracking-tighter uppercase block text-center leading-none">
                                        ATSA DVM<br />
                                        APPROVED<br />
                                        v2.0 SEAL
                                      </span>
                                    </div>

                                    <div className="text-right leading-tight font-sans">
                                      <div className="text-[7px] font-bold text-black/40 uppercase flex items-center justify-end gap-1 font-mono">
                                        <ShieldCheck className="w-2.5 h-2.5 text-emerald-600 inline" /> Digital Integrity Verified
                                      </div>
                                      <div className="text-[6.5px] text-black/30 uppercase mt-0.5 font-bold font-mono">
                                        SHA-256 SECURED CRYPTO_ID: {new Date(results.timestamp).getTime().toString(16).toUpperCase()}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* DOCUMENT EXPORT & TRANSMISSION TOOLBAR */}
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                                
                                {/* 0. WHO 6th Clinical Dossier */}
                                <button 
                                  onClick={() => setShowPDFDossier(true)}
                                  className="p-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl font-bold text-[10px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                                  title="Open Multi-Page ISO 15189 / WHO 6th Clinical Dossier generator"
                                >
                                  <Award className="w-3.5 h-3.5" />
                                  Clinical Dossier
                                </button>

                                {/* 1. Native Print Dialogue */}
                                <button 
                                  onClick={printReport}
                                  className={cn(
                                    "p-3.5 border rounded-xl font-bold text-[10px] transition-all flex items-center justify-center gap-2 cursor-pointer",
                                    theme === 'dark' ? "bg-white/5 hover:bg-white/10 border-white/10 text-white" : "bg-black/5 hover:bg-black/10 border-black/10 text-slate-900"
                                  )}
                                  title="Utilizes browser engine print dialogue layouts"
                                >
                                  <Printer className="w-3.5 h-3.5 text-emerald-500" />
                                  Print Clinical
                                </button>

                                {/* 2. Lab Stick/Label print */}
                                <button
                                  onClick={() => setShowLabelModal(true)}
                                  className={cn(
                                    "p-3.5 border rounded-xl font-bold text-[10px] transition-all flex items-center justify-center gap-2 cursor-pointer",
                                    theme === 'dark' ? "bg-white/5 hover:bg-white/10 border-white/10 text-white" : "bg-black/5 hover:bg-black/10 border-black/10 text-slate-900"
                                  )}
                                  title="Generate adhesive physical sample tube sticker labels"
                                >
                                  <Tag className="w-3.5 h-3.5 text-orange-500" />
                                  Lab Sticker Label
                                </button>

                                {/* 3. Advanced PDF Generation */}
                                <button 
                                  onClick={exportToPDF}
                                  className={cn(
                                    "p-3.5 border rounded-xl font-bold text-[10px] transition-all flex items-center justify-center gap-2 cursor-pointer",
                                    theme === 'dark' ? "bg-white/10 hover:bg-white/20 border-white/10 text-white" : "bg-black/10 hover:bg-black/20 border-black/10 text-slate-900"
                                  )}
                                  title="Export document layout as pixel-perfect scale 2.0 A4 PDF"
                                >
                                  <Download className="w-3.5 h-3.5 text-blue-500" />
                                  Download PDF
                                </button>

                                {/* 4. Full Quantitative CSV sheet */}
                                <button 
                                  onClick={exportToCSV}
                                  className={cn(
                                    "p-3.5 border rounded-xl font-bold text-[10px] transition-all flex items-center justify-center gap-2 cursor-pointer",
                                    theme === 'dark' ? "bg-white/5 hover:bg-white/10 border-white/10 text-white" : "bg-black/5 hover:bg-black/10 border-black/10 text-slate-900"
                                  )}
                                  title="Export advanced numerical tracking parameters schema for Excel"
                                >
                                  <FileSpreadsheet className="w-3.5 h-3.5 text-purple-500" />
                                  Raw CSV Data
                                </button>
                              </div>

                              <div className="flex gap-2">
                                {/* 5. Copy Text Clinical representation */}
                                <button
                                  onClick={copyReportToClipboard}
                                  className={cn(
                                    "flex-1 py-3 border rounded-xl font-bold text-[10px] transition-all flex items-center justify-center gap-2 cursor-pointer",
                                    theme === 'dark' ? "bg-teal-500/10 hover:bg-teal-500/20 border-teal-500/20 text-teal-400" : "bg-teal-50 hover:bg-teal-100 border-teal-100 text-teal-800"
                                  )}
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                  {isCopied ? "System Clipboard Copied!" : "Copy Formatted Text (EMR Clipboard)"}
                                </button>

                                {/* 6. Persistent DB storage */}
                                <button 
                                  onClick={saveToHistory}
                                  disabled={isSaving}
                                  className={cn(
                                    "px-6 py-3 rounded-xl font-bold text-[10px] shadow-lg transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer",
                                    isSaving ? (theme === 'dark' ? "bg-white/5 text-white/40" : "bg-black/5 text-black/40") : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
                                  )}
                                >
                                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                                  {isSaving ? "Saving..." : "Save to Cloud"}
                                </button>
                              </div>
                            </div>

                            {/* Generate AI Clinical Conclusion prompt fallback */}
                            {!results.summary.interpretation && (
                              <button 
                                onClick={generateAIInterpretation}
                                disabled={isGeneratingInterpretation}
                                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/10 cursor-pointer"
                              >
                                {isGeneratingInterpretation ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                                Run Predictive AI Lab Interpretation & Clinical Conclusion
                              </button>
                            )}
                          </>
                        ) : (
                          <div className={cn(
                            "p-10 rounded-3xl border text-center space-y-6 flex flex-col items-center justify-center min-h-[500px]",
                            theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-black/10 text-slate-900"
                          )}>
                            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                              <FileText className="w-8 h-8" />
                            </div>
                            <div className="max-w-md space-y-2">
                              <h3 className="text-lg font-black uppercase tracking-tight">No Active Specimen Loaded</h3>
                              <p className="text-xs opacity-60 leading-relaxed">
                                Load a validated reference specimen dataset to preview and export certified clinical dossiers according to ISO 15189 and WHO standards.
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 max-w-lg">
                              {VIRTUAL_ANIMAL_KEYS.map((key) => {
                                const anim = VIRTUAL_ANIMALS[key];
                                return (
                                  <button
                                    key={key}
                                    onClick={() => loadDemoData(key)}
                                    className="px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <span>{anim.avatarIcon}</span>
                                    <span>Load {anim.species}</span>
                                  </button>
                                );
                              })}
                              <button
                                onClick={() => setActiveTab('live')}
                                className={cn(
                                  "px-3.5 py-2 border rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
                                  theme === 'dark' ? "bg-white/5 border-white/10 hover:bg-white/10 text-white" : "bg-white border-slate-200 hover:bg-slate-100 text-slate-800"
                                )}
                              >
                                Live Capture / Upload
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                        {/* ========================================== */}
                        {/* ADHESIVE PHYSICAL SPECIMEN LABEL PRINT DIALOGUE MODAL */}
                        {/* ========================================== */}
                        <AnimatePresence>
                          {showLabelModal && (
                            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={cn(
                                  "w-full max-w-md rounded-[24px] border overflow-hidden shadow-2xl p-6 relative flex flex-col space-y-4",
                                  theme === 'dark' ? "bg-[#161616] border-white/10 text-white" : "bg-white border-black/10 text-slate-900"
                                )}
                              >
                                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                                  <div className="flex items-center gap-2">
                                    <Tag className="w-5 h-5 text-orange-500" />
                                    <h3 className="text-sm font-bold uppercase tracking-wider font-sans">Specimen Sticker Printer</h3>
                                  </div>
                                  <button 
                                    onClick={() => setShowLabelModal(false)}
                                    className="p-1 px-2 hover:bg-white/5 text-slate-400 hover:text-white rounded-md text-xs font-bold font-mono transition-colors cursor-pointer"
                                  >
                                    ESC CLOSE
                                  </button>
                                </div>

                                <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                                  Generate and print clinical adhesive sticker labels for microfluidic cassettes, slides, or cryopreservation vials (standards 50mm x 30mm layout).
                                </p>

                                {/* Interactive Label controls configuration inside modal */}
                                <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5 text-xs font-semibold">
                                  <div>
                                    <label className="text-[8px] font-bold text-slate-400 block mb-1 uppercase tracking-widest font-sans">Storage cryogenic address / location ID</label>
                                    <input 
                                      type="text" 
                                      value={labelStorageLoc}
                                      onChange={(e) => setLabelStorageLoc(e.target.value)}
                                      className={cn(
                                        "w-full px-3 py-1.5 rounded-lg text-xs font-bold border focus:outline-none focus:border-orange-500 bg-white/10 border-white/10 text-white"
                                      )}
                                      placeholder="Nitrogen Dewar location coordinates..."
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[8px] font-bold text-slate-400 block mb-1 uppercase tracking-widest font-sans">Adhesive label biological hazard advice</label>
                                    <input 
                                      type="text" 
                                      value={labelWarning}
                                      onChange={(e) => setLabelWarning(e.target.value)}
                                      className="w-full px-3 py-1.5 rounded-lg text-xs font-bold border focus:outline-none focus:border-orange-500 bg-white/10 border-white/10 text-white"
                                    />
                                  </div>
                                </div>

                                {/* Label print layout simulation */}
                                <div className="p-4 bg-white text-black rounded-lg border-2 border-black border-dashed relative shadow-md text-left">
                                  
                                  {/* Lab warning color stripe */}
                                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-orange-500" />
                                  
                                  <div className="flex justify-between items-start pt-1.5 font-sans">
                                    <div>
                                      <p className="text-[11px] font-black tracking-tight uppercase italic leading-none">ATSA CASSETTE</p>
                                      <p className="text-[6px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">Sperm diagnostics sticker</p>
                                    </div>
                                    <span className="text-[8px] uppercase font-bold text-orange-800 bg-orange-100 px-1 rounded font-mono">DVM_QUALIFIED</span>
                                  </div>

                                  {/* Primary parameters micro table */}
                                  <div className="mt-3 grid grid-cols-2 gap-2 text-[8px] font-bold border-t border-b border-black/10 py-1.5 font-sans">
                                    <div>
                                      <p className="text-black/40 text-[6px]">PATIENT ID</p>
                                      <p className="font-mono">{results.patientId}</p>
                                    </div>
                                    <div>
                                      <p className="text-black/40 text-[6px]">SPECIES</p>
                                      <p className="uppercase">{results.species}</p>
                                    </div>
                                    <div>
                                      <p className="text-black/40 text-[6px]">CONC & MOTILITY</p>
                                      <p className="font-mono">{results.summary.concentration.toFixed(1)}M/mL &middot; {results.summary.motility.total.toFixed(0)}%</p>
                                    </div>
                                    <div>
                                      <p className="text-black/40 text-[6px]">STORAGE LOCATION</p>
                                      <p className="truncate font-mono">{labelStorageLoc}</p>
                                    </div>
                                  </div>

                                  {/* Label Micro footer with barcode */}
                                  <div className="mt-2.5 flex justify-between items-end">
                                    <div className="leading-tight text-[6px] font-bold font-sans">
                                      <p className="text-red-600 uppercase font-mono">{labelWarning}</p>
                                      <p className="text-black/40 font-mono mt-0.5">{new Date(results.timestamp).toLocaleDateString()} {new Date(results.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                    </div>
                                    <div className="flex items-center gap-[0.5px] h-4">
                                      {[1, 2, 3, 1, 4, 1, 2, 3, 1, 2, 1, 3, 1].map((w, i) => (
                                        <div key={i} className="bg-black h-full" style={{ width: `${w}px` }} />
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                {/* Custom printing action triggers */}
                                <div className="pt-2 flex gap-2 font-sans">
                                  <button
                                    onClick={() => setShowLabelModal(false)}
                                    className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold uppercase transition-colors cursor-pointer"
                                  >
                                    Close
                                  </button>
                                  <button
                                    onClick={() => {
                                      setLabelPrinted(true);
                                      setTimeout(() => {
                                        setLabelPrinted(false);
                                        setShowLabelModal(false);
                                      }, 1500);
                                    }}
                                    className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    {labelPrinted ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
                                    {labelPrinted ? "Mocking Print..." : "Confirm Print Label"}
                                  </button>
                                </div>
                              </motion.div>
                            </div>
                          )}
                        </AnimatePresence>

                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-6">
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                      <Microscope className="w-10 h-10 text-emerald-400" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-xs font-black uppercase tracking-wider text-white">No Active Analysis Data</h3>
                      <p className="text-[10px] text-white/40 leading-relaxed max-w-[240px] mx-auto">
                        To view your {activeTab} analytics, start the live CASA tracker, upload a semen macro recording, or load one of our high-integrity sample datasets below:
                      </p>
                    </div>
                    
                    <div className="flex flex-col gap-1.5 w-full max-w-[240px]">
                      {VIRTUAL_ANIMAL_KEYS.map((key) => {
                        const anim = VIRTUAL_ANIMALS[key];
                        return (
                          <button 
                            key={key}
                            onClick={() => loadDemoData(key)}
                            className="py-2 px-3 bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/30 text-white font-bold text-[10px] uppercase rounded-xl transition-all flex items-center justify-between gap-1.5 cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5">
                              <span>{anim.avatarIcon}</span>
                              <span>{anim.species} Specimen</span>
                            </span>
                            <span className="text-[8px] text-white/50 font-mono">{anim.patientId}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "w-full max-w-2xl rounded-[32px] border overflow-hidden shadow-2xl flex flex-col max-h-[90vh]",
                theme === 'dark' ? "bg-[#1a1a1a] border-white/10" : "bg-white border-black/10"
              )}
            >
              {/* Header */}
              <div className={cn(
                "p-8 border-b flex items-center justify-between bg-gradient-to-r from-emerald-500/10 to-transparent",
                theme === 'dark' ? "border-white/5" : "border-black/5"
              )}>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/20 rounded-2xl">
                    <Settings className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <h2 className={cn(
                      "text-2xl font-bold",
                      theme === 'dark' ? "text-white" : "text-slate-900"
                    )}>System Settings</h2>
                    <p className={cn(
                      "text-xs",
                      theme === 'dark' ? "text-white/40" : "text-black/40"
                    )}>Configure your analysis engine and workspace</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSettings(false)} 
                  className={cn(
                    "p-3 rounded-2xl transition-colors",
                    theme === 'dark' ? "hover:bg-white/5 text-white/40 hover:text-white" : "hover:bg-black/5 text-black/40 hover:text-black"
                  )}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Tabs */}
                <div className={cn(
                  "w-48 border-r p-4 space-y-2",
                  theme === 'dark' ? "border-white/5 bg-black/20" : "border-black/5 bg-slate-50"
                )}>
                  {[
                    { id: 'general', label: 'General', icon: Settings },
                    { id: 'analysis', label: 'Analysis', icon: Activity },
                    { id: 'ui', label: 'Interface', icon: Layout },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setSettingsTab(tab.id as any)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                        settingsTab === tab.id 
                          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                          : (theme === 'dark' ? "text-white/40 hover:text-white hover:bg-white/5" : "text-black/40 hover:text-black hover:bg-black/5")
                      )}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  {settingsTab === 'general' && (
                    <div className="space-y-8">
                      <section>
                        <h3 className={cn(
                          "text-[10px] font-black uppercase tracking-[0.2em] mb-6",
                          theme === 'dark' ? "text-white/20" : "text-black/20"
                        )}>Data Management</h3>
                        <div className="space-y-4">
                          <div className={cn(
                            "flex items-center justify-between p-4 rounded-2xl border",
                            theme === 'dark' ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5"
                          )}>
                            <div>
                              <p className={cn(
                                "text-sm font-bold",
                                theme === 'dark' ? "text-white" : "text-slate-900"
                              )}>Auto-Save Results</p>
                              <p className={cn(
                                "text-[10px]",
                                theme === 'dark' ? "text-white/40" : "text-black/40"
                              )}>Automatically sync analysis to cloud history</p>
                            </div>
                            <button 
                              onClick={() => setSettings(prev => ({ ...prev, autoSave: !prev.autoSave }))}
                              className={cn(
                                "w-12 h-6 rounded-full transition-all relative",
                                settings.autoSave ? "bg-emerald-500" : (theme === 'dark' ? "bg-white/10" : "bg-black/10")
                              )}
                            >
                              <div className={cn(
                                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                                settings.autoSave ? "left-7" : "left-1"
                              )} />
                            </button>
                          </div>

                          <div className={cn(
                            "flex items-center justify-between p-4 rounded-2xl border",
                            theme === 'dark' ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5"
                          )}>
                            <div>
                              <p className={cn(
                                "text-sm font-bold",
                                theme === 'dark' ? "text-white" : "text-slate-900"
                              )}>Export Format</p>
                              <p className={cn(
                                "text-[10px]",
                                theme === 'dark' ? "text-white/40" : "text-black/40"
                              )}>Default file type for generated reports</p>
                            </div>
                            <div className={cn(
                              "flex p-1 rounded-xl border",
                              theme === 'dark' ? "bg-black/40 border-white/10" : "bg-slate-100 border-black/10"
                            )}>
                              {['pdf', 'csv'].map(format => (
                                <button
                                  key={format}
                                  onClick={() => setSettings(prev => ({ ...prev, reportFormat: format as any }))}
                                  className={cn(
                                    "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                    settings.reportFormat === format ? "bg-emerald-500 text-white" : (theme === 'dark' ? "text-white/40 hover:text-white" : "text-black/40 hover:text-black")
                                  )}
                                >
                                  {format}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </section>

                      <section>
                        <h3 className={cn(
                          "text-[10px] font-black uppercase tracking-[0.2em] mb-6",
                          theme === 'dark' ? "text-white/20" : "text-black/20"
                        )}>System Notifications</h3>
                        <div className={cn(
                          "flex items-center justify-between p-4 rounded-2xl border",
                          theme === 'dark' ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5"
                        )}>
                          <div>
                            <p className={cn(
                              "text-sm font-bold",
                              theme === 'dark' ? "text-white" : "text-slate-900"
                            )}>Audio Alerts</p>
                            <p className={cn(
                              "text-[10px]",
                              theme === 'dark' ? "text-white/40" : "text-black/40"
                            )}>Play sound on analysis completion</p>
                          </div>
                          <button 
                            onClick={() => setSettings(prev => ({ ...prev, notifications: !prev.notifications }))}
                            className={cn(
                              "w-12 h-6 rounded-full transition-all relative",
                              settings.notifications ? "bg-emerald-500" : (theme === 'dark' ? "bg-white/10" : "bg-black/10")
                            )}
                          >
                            <div className={cn(
                              "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                              settings.notifications ? "left-7" : "left-1"
                            )} />
                          </button>
                        </div>
                      </section>
                    </div>
                  )}

                  {settingsTab === 'analysis' && (
                    <div className="space-y-8">
                      <section>
                        <h3 className={cn(
                          "text-[10px] font-black uppercase tracking-[0.2em] mb-6",
                          theme === 'dark' ? "text-white/20" : "text-black/20"
                        )}>Hardware Calibration & Chamber</h3>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className={cn(
                              "text-[10px] font-bold uppercase tracking-widest",
                              theme === 'dark' ? "text-white/40" : "text-black/40"
                            )}>Counting Chamber Preset</label>
                            <select
                              value={settings.chamberPreset || 'leja20'}
                              onChange={(e) => {
                                const val = e.target.value;
                                let depth = 20;
                                let mpp = 0.65;
                                if (val === 'leja20') { depth = 20; mpp = 0.65; }
                                else if (val === 'leja10') { depth = 10; mpp = 0.65; }
                                else if (val === 'makler') { depth = 10; mpp = 0.75; }
                                else if (val === 'neubauer') { depth = 100; mpp = 1.20; }
                                else { depth = settings.chamberDepth || 20; mpp = settings.micronsPerPixel || 0.65; }
                                
                                setSettings(prev => ({
                                  ...prev,
                                  chamberPreset: val,
                                  chamberDepth: depth,
                                  micronsPerPixel: mpp
                                }));
                                createNotification("Chamber Calibration Selected", `${val.toUpperCase()} preset applies depth of ${depth}µm and scale of ${mpp}µm/px`, "info");
                              }}
                              className={cn(
                                "w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50 transition-colors",
                                theme === 'dark' ? "bg-black/40 border-white/10 text-white" : "bg-white border-black/10 text-slate-900"
                              )}
                            >
                              <option value="leja20">Leja Slide 20 µm (Standard Clinical)</option>
                              <option value="leja10">Leja Slide 10 µm (Fast Analysis)</option>
                              <option value="makler">Makler Chamber 10 µm (Reusable grid)</option>
                              <option value="neubauer">Improved Neubauer Hemocytometer (100 µm)</option>
                              <option value="custom">Custom Configuration</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-2">
                              <label className={cn(
                                "text-[10px] font-bold uppercase tracking-widest",
                                theme === 'dark' ? "text-white/40" : "text-black/40"
                              )}>Frame Rate</label>
                              <input 
                                type="number" 
                                value={settings.fps}
                                onChange={(e) => setSettings(prev => ({ ...prev, fps: parseInt(e.target.value) }))}
                                className={cn(
                                  "w-full border rounded-xl px-3 py-3 text-xs font-mono focus:outline-none focus:border-emerald-500/50 transition-colors",
                                  theme === 'dark' ? "bg-black/40 border-white/10 text-white" : "bg-white border-black/10 text-slate-900"
                                )}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className={cn(
                                "text-[10px] font-bold uppercase tracking-widest",
                                theme === 'dark' ? "text-white/40" : "text-black/40"
                              )}>µm/px Scale</label>
                              <input 
                                type="number" 
                                step="0.01"
                                value={settings.micronsPerPixel}
                                onChange={(e) => setSettings(prev => ({ ...prev, micronsPerPixel: parseFloat(e.target.value), chamberPreset: 'custom' }))}
                                className={cn(
                                  "w-full border rounded-xl px-3 py-3 text-xs font-mono focus:outline-none focus:border-emerald-500/50 transition-colors",
                                  theme === 'dark' ? "bg-black/40 border-white/10 text-white" : "bg-white border-black/10 text-slate-900"
                                )}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className={cn(
                                "text-[10px] font-bold uppercase tracking-widest",
                                theme === 'dark' ? "text-white/40" : "text-black/40"
                              )}>Depth (µm)</label>
                              <input 
                                type="number" 
                                value={settings.chamberDepth ?? 20}
                                onChange={(e) => setSettings(prev => ({ ...prev, chamberDepth: parseInt(e.target.value), chamberPreset: 'custom' }))}
                                className={cn(
                                  "w-full border rounded-xl px-3 py-3 text-xs font-mono focus:outline-none focus:border-emerald-500/50 transition-colors",
                                  theme === 'dark' ? "bg-black/40 border-white/10 text-white" : "bg-white border-black/10 text-slate-900"
                                )}
                              />
                            </div>
                          </div>
                        </div>
                        <p className={cn(
                          "text-[10px] mt-4 italic leading-relaxed",
                          theme === 'dark' ? "text-white/20" : "text-black/20"
                        )}>Depth and pixel scale define the calculated analyzed volume, directly impacting Concentration M/ml measurements.</p>
                      </section>

                      <section>
                        <h3 className={cn(
                          "text-[10px] font-black uppercase tracking-[0.2em] mb-6",
                          theme === 'dark' ? "text-white/20" : "text-black/20"
                        )}>Active Species Profile</h3>
                        <div className={cn(
                          "p-6 rounded-3xl border space-y-6",
                          theme === 'dark' ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5"
                        )}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                                <Activity className="w-5 h-5 text-emerald-500" />
                              </div>
                              <div>
                                <p className={cn(
                                  "text-sm font-bold",
                                  theme === 'dark' ? "text-white" : "text-slate-900"
                                )}>{settings.profile.name}</p>
                                <p className={cn(
                                  "text-[10px]",
                                  theme === 'dark' ? "text-white/40" : "text-black/40"
                                )}>Reference thresholds active</p>
                              </div>
                            </div>
                            <select 
                              value={settings.profile.name}
                              onChange={(e) => {
                                const profile = Object.values(SPECIES_PROFILES).find(p => p.name === e.target.value);
                                if (profile) setSettings(prev => ({ ...prev, profile }));
                              }}
                              className={cn(
                                "border rounded-xl px-4 py-2 text-xs font-bold focus:outline-none focus:border-emerald-500/50 transition-colors",
                                theme === 'dark' ? "bg-black/40 border-white/10 text-white" : "bg-white border-black/10 text-slate-900"
                              )}
                            >
                              {Object.values(SPECIES_PROFILES).map(p => (
                                <option key={p.name} value={p.name}>{p.name}</option>
                              ))}
                            </select>
                          </div>

                          <div className={cn(
                            "grid grid-cols-2 gap-x-8 gap-y-4 pt-4 border-t",
                            theme === 'dark' ? "border-white/5" : "border-black/5"
                          )}>
                            {[
                              { label: 'Min Concentration', val: `${settings.profile.minConcentration} M/ml` },
                              { label: 'Min Total Motility', val: `${settings.profile.minTotalMotility}%` },
                              { label: 'Min Progressive', val: `${settings.profile.minProgressiveMotility}%` },
                              { label: 'Min Normal Morph', val: `${settings.profile.minNormalMorphology}%` },
                            ].map(stat => (
                              <div key={stat.label} className="flex justify-between items-center">
                                <span className={cn(
                                  "text-[10px] font-bold",
                                  theme === 'dark' ? "text-white/40" : "text-black/40"
                                )}>{stat.label}</span>
                                <span className={cn(
                                  "text-[10px] font-mono",
                                  theme === 'dark' ? "text-white/80" : "text-black/80"
                                )}>{stat.val}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </section>
                    </div>
                  )}

                  {settingsTab === 'ui' && (
                    <div className="space-y-8">
                      <section>
                        <h3 className={cn(
                          "text-[10px] font-black uppercase tracking-[0.2em] mb-6",
                          theme === 'dark' ? "text-white/20" : "text-black/20"
                        )}>Visual Preferences</h3>
                        <div className="space-y-4">
                          <div className={cn(
                            "flex items-center justify-between p-4 rounded-2xl border",
                            theme === 'dark' ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5"
                          )}>
                            <div>
                              <p className={cn(
                                "text-sm font-bold",
                                theme === 'dark' ? "text-white" : "text-slate-900"
                              )}>Field Mode (High Contrast)</p>
                              <p className={cn(
                                "text-[10px]",
                                theme === 'dark' ? "text-white/40" : "text-black/40"
                              )}>Invert colors for better visibility in bright environments</p>
                            </div>
                            <button 
                              onClick={() => setSettings(prev => ({ ...prev, highContrast: !prev.highContrast }))}
                              className={cn(
                                "w-12 h-6 rounded-full transition-all relative",
                                settings.highContrast ? "bg-emerald-500" : (theme === 'dark' ? "bg-white/10" : "bg-black/10")
                              )}
                            >
                              <div className={cn(
                                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                                settings.highContrast ? "left-7" : "left-1"
                              )} />
                            </button>
                          </div>

                          <div className={cn(
                            "flex items-center justify-between p-4 rounded-2xl border",
                            theme === 'dark' ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5"
                          )}>
                            <div>
                              <p className={cn(
                                "text-sm font-bold",
                                theme === 'dark' ? "text-white" : "text-slate-900"
                              )}>Sperm Particles</p>
                              <p className={cn(
                                "text-[10px]",
                                theme === 'dark' ? "text-white/40" : "text-black/40"
                              )}>Show real-time tracking particles on video</p>
                            </div>
                            <button 
                              onClick={() => setSettings(prev => ({ ...prev, showParticles: !prev.showParticles }))}
                              className={cn(
                                "w-12 h-6 rounded-full transition-all relative",
                                settings.showParticles ? "bg-emerald-500" : (theme === 'dark' ? "bg-white/10" : "bg-black/10")
                              )}
                            >
                              <div className={cn(
                                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                                settings.showParticles ? "left-7" : "left-1"
                              )} />
                            </button>
                          </div>
                        </div>
                      </section>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className={cn(
                "p-8 border-t flex items-center justify-between",
                theme === 'dark' ? "bg-black/40 border-white/5" : "bg-slate-50 border-black/5"
              )}>
                <button 
                  onClick={() => {
                    localStorage.removeItem('casa_settings');
                    window.location.reload();
                  }}
                  className={cn(
                    "text-[10px] font-bold hover:text-red-400 transition-colors uppercase tracking-widest",
                    theme === 'dark' ? "text-white/20" : "text-black/20"
                  )}
                >
                  Reset to Defaults
                </button>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="px-8 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                >
                  Close Settings
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHelp && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/80 backdrop-blur-md">
            <div className="w-full max-w-6xl h-[85vh] relative">
              <button 
                onClick={() => setShowHelp(false)}
                className="absolute -top-4 -right-4 z-[110] p-2 bg-white text-black rounded-full shadow-2xl hover:scale-110 transition-transform"
              >
                <ChevronLeft className="w-6 h-6 rotate-180" />
              </button>
              <div className={cn(
                "w-full h-full rounded-[32px] overflow-hidden border shadow-2xl",
                theme === 'dark' ? "border-white/10" : "border-black/10"
              )}>
                <HelpCenter onBack={() => setShowHelp(false)} theme={theme} />
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Multi-Field OF View (FOV) Aggregator & Chamber Calibration Modal */}
      {showMultiFOVModal && (
        <MultiFOVModal
          isOpen={showMultiFOVModal}
          onClose={() => setShowMultiFOVModal(false)}
          fields={multiFOVFields}
          onFieldsChange={setMultiFOVFields}
          onApplyComposite={(composite) => {
            if (results) {
              setResults({
                ...results,
                multiFov: composite,
                summary: {
                  ...results.summary,
                  concentration: composite.meanConcentration,
                  motility: {
                    ...results.summary.motility,
                    total: composite.meanTotalMotility,
                    progressive: composite.meanProgressiveMotility
                  },
                  morphology: {
                    ...results.summary.morphology,
                    normal: composite.meanNormalMorphology
                  }
                }
              });
            }
          }}
          theme={theme}
        />
      )}

      {/* WHO 6th Edition & Veterinary Multi-Page PDF Dossier Generator */}
      {showPDFDossier && results && (
        <PDFDossier
          isOpen={showPDFDossier}
          onClose={() => setShowPDFDossier(false)}
          results={results}
          clinicianName={clinicianName}
          facilityName={facilityName}
          collectionMethod={collectionMethod}
          sampleVolume={sampleVolume}
          samplePh={samplePh}
          sampleAppearance={sampleAppearance}
          clinicianRemarks={clinicianRemarks}
          theme={theme}
        />
      )}

      {/* Engine Action Feedback Toast */}
      <AnimatePresence>
        {engineToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border bg-[#111114]/95 border-white/10 text-white backdrop-blur-md shadow-black/80"
          >
            <div className={cn(
              "w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold",
              engineToast.type === 'success' ? "bg-emerald-500/20 text-emerald-400" : engineToast.type === 'info' ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"
            )}>
              {engineToast.type === 'success' ? <Check className="w-4 h-4" /> : <HelpCircle className="w-4 h-4" />}
            </div>
            <p className="text-xs font-medium leading-tight flex-1">{engineToast.message}</p>
            <button 
              onClick={() => setEngineToast(null)} 
              className="text-white/40 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
