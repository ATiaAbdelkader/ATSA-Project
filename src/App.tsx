import React, { useState, useEffect } from 'react';
import { 
  Microscope, 
  ClipboardList, 
  BookOpen, 
  LogOut, 
  Settings, 
  Bell,
  ChevronRight,
  Activity,
  Users,
  Clock,
  ArrowUpRight,
  Play,
  FileText,
  Sun,
  Moon,
  LogIn,
  Package,
  Check,
  Award,
  Upload,
  Eye,
  Download,
  X,
  TrendingUp,
  TrendingDown,
  Globe,
  ArrowLeft,
  Trash2,
  Flag,
  MoreVertical,
  AlertTriangle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { cn, SPECIES_PROFILES } from './utils';
import { SampleRegistration } from './components/SampleRegistration';
import { CASAEngine } from './components/CASAEngine';
import { HelpCenter } from './components/HelpCenter';
import { PatientHistoryView } from './components/PatientHistory';
import { InventoryManagement } from './components/InventoryManagement';
import { PerformanceTrendsChart } from './components/PerformanceTrendsChart';
import { LandingPage } from './components/LandingPage';
import { CountUpNumber } from './components/CountUpNumber';
import { VIRTUAL_ANIMALS, VIRTUAL_ANIMAL_KEYS } from './data/virtualAnimalDatasets';
import type { AppState, SpeciesProfile } from './types';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collection, addDoc, query, where, orderBy, limit, onSnapshot, Timestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './lib/firestore-utils';
import { useLanguage } from './context/LanguageContext';

export default function App() {
  const { language, setLanguage, t, dir } = useLanguage();
  
  const LanguageSelect = () => {
    return (
      <div className="flex items-center gap-1 p-1 bg-black/10 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/[0.05]">
        {(['en', 'fr', 'ar'] as const).map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => setLanguage(lang)}
            className={cn(
              "px-3 py-1.5 text-[10px] font-black rounded-xl uppercase tracking-wider transition-all cursor-pointer",
              language === lang 
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/15" 
                : "text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            {lang}
          </button>
        ))}
      </div>
    );
  };

  const [appState, setAppState] = useState<AppState>('landing');
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [activePatient, setActivePatient] = useState<{ id: string; species: string; profile: SpeciesProfile } | null>(null);
  const [analysisInitialAction, setAnalysisInitialAction] = useState<'camera' | 'upload' | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
  const [recent30DaysAnalyses, setRecent30DaysAnalyses] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>([]);
  const [stats, setStats] = useState({ samplesToday: 0, avgProcessing: '0m' });
  const [previewAnalysis, setPreviewAnalysis] = useState<any | null>(null);
  const [sampleToDelete, setSampleToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);
  const [actionToast, setActionToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Close active dropdown action menu on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveActionMenuId(null);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Auto-dismiss action feedback toast after 3.5s
  useEffect(() => {
    if (actionToast) {
      const timer = setTimeout(() => setActionToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [actionToast]);

  // Generate average sperm concentration data for the last 30 days
  const getTrendsData = () => {
    const dates: { [key: string]: { sum: number; count: number; dateStr: string } } = {};
    
    // Generate dates for the last 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0]; // YYYY-MM-DD
      const dateStr = d.toLocaleDateString(language === 'fr' ? 'fr-FR' : language === 'ar' ? 'ar-EG' : 'en-US', {
        month: 'short',
        day: 'numeric',
      });
      dates[key] = { sum: 0, count: 0, dateStr };
    }

    // Accumulate actual sample metrics from firestore
    recent30DaysAnalyses.forEach(analysis => {
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
      if (dates[dateKey] !== undefined) {
        dates[dateKey].sum += analysis.concentration || 0;
        dates[dateKey].count += 1;
      }
    });

    // Map into chronological data array
    return Object.keys(dates).sort().map(key => {
      const entry = dates[key];
      const avg = entry.count > 0 ? Number((entry.sum / entry.count).toFixed(1)) : 0;
      return {
        date: entry.dateStr,
        concentration: avg,
        count: entry.count,
        key: key
      };
    });
  };

  const trendData = getTrendsData();

  // Compliance calculations for the last 30 days of data against WHO 2010 ref (>= 15 M/ml)
  const complianceStats = (() => {
    const totalWithConc = recent30DaysAnalyses.filter(a => a.concentration !== undefined);
    if (totalWithConc.length === 0) return { percent: 0, count: 0, total: 0 };
    const compliant = totalWithConc.filter(a => (a.concentration || 0) >= 15);
    return {
      percent: Math.round((compliant.length / totalWithConc.length) * 100),
      count: compliant.length,
      total: totalWithConc.length
    };
  })();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setAppState('dashboard');
      } else {
        const savedGuest = localStorage.getItem('atsa_guest_session');
        if (savedGuest) {
          try {
            const parsed = JSON.parse(savedGuest);
            setUser(parsed);
            setAppState('dashboard');
          } catch (e) {
            setAppState('landing');
          }
        } else {
          setAppState('landing');
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Fetch recent analyses (up to 150) for both recent list and 30-day trend calculation
    const q = query(
      collection(db, 'analyses'),
      where('uid', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(150)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const analyses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      setRecentAnalyses(analyses.slice(0, 5));
      setRecent30DaysAnalyses(analyses);
      
      // Calculate basic stats for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayAnalyses = analyses.filter(a => new Date(a.timestamp).getTime() >= today.getTime());
      setStats({
        samplesToday: todayAnalyses.length,
        avgProcessing: '4.2m' // Mock for now, could be calculated if we store duration
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'analyses');
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('uid', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotifications(notifs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notifications');
    });

    return () => unsubscribe();
  }, [user]);

  const handleBatchExport = async () => {
    if (selectedAnalyses.length === 0) return;
    
    const { default: jsPDF } = await import('jspdf');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const selectedData = recentAnalyses.filter(a => selectedAnalyses.includes(a.id));
    
    pdf.setFontSize(20);
    pdf.setTextColor(16, 185, 129); // Emerald 500
    pdf.text('ATSA AI - Consolidated Laboratory Report', 20, 20);
    
    pdf.setFontSize(10);
    pdf.setTextColor(100);
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, 20, 28);
    pdf.text(`Total Records: ${selectedData.length}`, 20, 33);
    
    let y = 45;
    selectedData.forEach((row, index) => {
      if (y > 250) {
        pdf.addPage();
        y = 20;
      }
      
      pdf.setDrawColor(230);
      pdf.line(20, y, 190, y);
      y += 10;
      
      pdf.setFontSize(12);
      pdf.setTextColor(0);
      pdf.text(`Sample: ${row.patientId} (${row.species})`, 20, y);
      
      pdf.setFontSize(9);
      pdf.setTextColor(100);
      pdf.text(`Date: ${new Date(row.timestamp).toLocaleString()}`, 140, y);
      
      y += 7;
      pdf.text(`Concentration: ${row.concentration?.toFixed(1)} M/ml`, 25, y);
      pdf.text(`Total Motility: ${row.motility?.total?.toFixed(1)}%`, 75, y);
      pdf.text(`Status: ${row.interpretation?.status?.toUpperCase() || 'COMPLETED'}`, 125, y);
      
      y += 10;
    });
    
    pdf.save(`ATSA-Batch-Report-${new Date().getTime()}.pdf`);
    setIsBatchMode(false);
    setSelectedAnalyses([]);
    setActionToast({
      message: `${t('batchReportExportSuccess')} (${selectedData.length} records)`,
      type: 'success'
    });
  };

  const handleSingleExport = async (row: any) => {
    if (!row) return;
    
    const { default: jsPDF } = await import('jspdf');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    // Header Branding Banner
    pdf.setFillColor(10, 10, 12);
    pdf.rect(0, 0, 210, 40, 'F');
    
    pdf.setFontSize(24);
    pdf.setTextColor(16, 185, 129); // Emerald 500
    pdf.setFont('helvetica', 'bold');
    pdf.text('ATSA CASA', 15, 25);
    
    pdf.setFontSize(10);
    pdf.setTextColor(150, 150, 150);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Automated Theriogenology Sperm Analyzer', 15, 32);
    
    pdf.setFontSize(8);
    pdf.setTextColor(110, 110, 110);
    pdf.text(`REPORT ID: ${row.id || 'N/A'}`, 140, 25);
    pdf.text(`GENERATED: ${new Date().toLocaleString()}`, 140, 32);
    
    // Patient Information Block
    pdf.setFillColor(245, 247, 250);
    pdf.rect(15, 50, 180, 35, 'F');
    
    pdf.setFontSize(10);
    pdf.setTextColor(100, 110, 120);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PATIENT DEMOGRAPHICS & ANIMAL IDENTITY', 20, 58);
    
    pdf.setDrawColor(220, 225, 230);
    pdf.line(20, 61, 190, 61);
    
    pdf.setFontSize(9);
    pdf.setTextColor(40, 45, 50);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Patient ID: ${row.patientId || 'N/A'}`, 25, 68);
    pdf.text(`Species Group: ${row.species || 'N/A'}`, 25, 76);
    pdf.text(`Analysis Timestamp: ${row.timestamp ? new Date(row.timestamp).toLocaleString() : 'N/A'}`, 100, 68);
    pdf.text(`Diagnostic Protocol: WHO 2010 Standard`, 100, 76);
    
    // Core Diagnostic Metrics Table
    pdf.setFontSize(12);
    pdf.setTextColor(16, 185, 129);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SPERM METRICS SUMMARY', 15, 100);
    
    pdf.setDrawColor(16, 185, 129);
    pdf.setLineWidth(0.5);
    pdf.line(15, 103, 195, 103);
    pdf.setLineWidth(0.1);
    
    // Table content starting position
    let currentY = 112;
    
    const drawMetricRow = (label: string, value: string, spec: string, desc: string) => {
      pdf.setFontSize(9);
      pdf.setTextColor(60, 65, 70);
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, 20, currentY);
      
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'bold');
      pdf.text(value, 75, currentY);
      
      pdf.setTextColor(120, 125, 130);
      pdf.setFont('helvetica', 'normal');
      pdf.text(spec, 110, currentY);
      pdf.text(desc, 140, currentY);
      
      pdf.setDrawColor(240, 242, 245);
      pdf.line(15, currentY + 3, 195, currentY + 3);
      currentY += 10;
    };
    
    drawMetricRow(
      'Concentration', 
      row.concentration ? `${row.concentration.toFixed(1)} M/ml` : 'N/A',
      'Normal threshold: >= 15 M/ml',
      'Volumetric sperm cell count'
    );
    drawMetricRow(
      'Total Motility', 
      row.motility?.total ? `${row.motility.total.toFixed(1)}%` : 'N/A',
      'Normal threshold: >= 40%',
      'Sperm cells with active motion'
    );
    drawMetricRow(
      'Progressive Motility', 
      row.motility?.progressive ? `${row.motility.progressive.toFixed(1)}%` : 'N/A',
      'Normal threshold: >= 32%',
      'Sperm moving in straight line'
    );
    drawMetricRow(
      'Normal Morphology', 
      row.morphology?.normal ? `${row.morphology.normal.toFixed(1)}%` : 'N/A',
      'Normal threshold: >= 4%',
      'Proportion of fully standard forms'
    );
    drawMetricRow(
      'Sperm Vitality', 
      row.vitality?.live ? `${row.vitality.live.toFixed(1)}%` : 'N/A',
      'Normal threshold: >= 58%',
      'Percentage of live/viable sperm'
    );
    drawMetricRow(
      'DNA Fragmentation Index (SDF)', 
      row.sdf?.dfi ? `${row.sdf.dfi.toFixed(1)}%` : 'N/A',
      'Optimal threshold: < 15% DFI',
      'Sperm Chromatin Structure Assay (SCSA)'
    );
    
    // Clinical Interpretation & Recommendations
    currentY += 5;
    pdf.setFillColor(252, 242, 243);
    pdf.rect(15, currentY, 180, 45, 'F');
    
    pdf.setFontSize(10);
    pdf.setTextColor(190, 30, 40);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CLINICAL ASSESSMENT & DIAGNOSTIC INTERPRETATION', 20, currentY + 8);
    
    pdf.setDrawColor(240, 210, 212);
    pdf.line(20, currentY + 11, 190, currentY + 11);
    
    pdf.setFontSize(9);
    pdf.setTextColor(50, 50, 50);
    pdf.setFont('helvetica', 'normal');
    
    const interpretationText = row.interpretation?.recommendation || 
      (row.interpretation?.status === 'normal' 
        ? "Sample indicates high-quality and viable characteristics. All measured parameters satisfy clinical standards for breeding and cryopreservation." 
        : "Parameters exhibit suboptimal scores in multiple fields. Clinical consultation or treatment protocols are recommended.");
    
    // Split text into lines to avoid overflow
    const splitText = pdf.splitTextToSize(interpretationText, 170);
    let textY = currentY + 17;
    splitText.forEach((textLine: string) => {
      pdf.text(textLine, 22, textY);
      textY += 5;
    });
    
    // Validation Footer Signature Line
    pdf.setFontSize(8);
    pdf.setTextColor(130, 135, 140);
    pdf.text('VALIDATOR: Abdelkader Atia, App Architect & Lead Designer', 15, 260);
    pdf.text('SIGNATURE: OFFICIAL ATSA CRYPTO VERIFIED SIGN-OFF', 15, 265);
    
    pdf.setDrawColor(200, 205, 210);
    pdf.line(15, 255, 195, 255);
    pdf.line(140, 280, 195, 280);
    pdf.text('Theriogenology Laboratory Specialist Seal', 140, 284);
    
    pdf.save(`ATSA-Diagnostic-Report-${row.patientId}-${row.species}.pdf`);
    setActionToast({
      message: `${t('reportExportSuccess')} (${row.patientId || row.id})`,
      type: 'success'
    });
  };

  const handleDeleteSample = async (sample: any) => {
    if (!sample) return;
    setIsDeleting(true);
    try {
      if (sample.id && !sample.id.startsWith('BOV-') && !sample.id.startsWith('EQU-') && !sample.id.startsWith('CAN-') && !sample.id.startsWith('POR-') && !sample.id.startsWith('OVI-') && !sample.isVirtual) {
        try {
          await deleteDoc(doc(db, 'analyses', sample.id));
        } catch (err) {
          console.warn('Firestore deletion notice:', err);
        }
      }
      
      // Update local state immediately
      setRecentAnalyses(prev => prev.filter(a => a.id !== sample.id));
      setRecent30DaysAnalyses(prev => prev.filter(a => a.id !== sample.id));
      setSelectedAnalyses(prev => prev.filter(id => id !== sample.id));
      if (previewAnalysis?.id === sample.id) {
        setPreviewAnalysis(null);
      }
      
      setActionToast({
        message: `Sample ${sample.patientId || sample.id} deleted successfully.`,
        type: 'success'
      });
    } catch (error) {
      console.error('Error deleting sample:', error);
      setActionToast({
        message: 'Failed to delete sample. Please try again.',
        type: 'error'
      });
    } finally {
      setIsDeleting(false);
      setSampleToDelete(null);
      setActiveActionMenuId(null);
    }
  };

  const handleToggleFlag = async (sample: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextFlagged = !sample.flagged;
    
    // Optimistic local update
    setRecentAnalyses(prev => prev.map(a => a.id === sample.id ? { ...a, flagged: nextFlagged } : a));
    setRecent30DaysAnalyses(prev => prev.map(a => a.id === sample.id ? { ...a, flagged: nextFlagged } : a));
    
    setActionToast({
      message: nextFlagged 
        ? `Sample ${sample.patientId || sample.id} marked as flagged for clinical review.` 
        : `Flag removed from sample ${sample.patientId || sample.id}.`,
      type: nextFlagged ? 'info' : 'success'
    });

    try {
      if (sample.id && !sample.id.startsWith('BOV-') && !sample.id.startsWith('EQU-') && !sample.id.startsWith('CAN-') && !sample.id.startsWith('POR-') && !sample.id.startsWith('OVI-') && !sample.isVirtual) {
        await updateDoc(doc(db, 'analyses', sample.id), {
          flagged: nextFlagged,
          flaggedAt: nextFlagged ? new Date().toISOString() : null
        });
      }
    } catch (err) {
      console.warn('Firestore flag update fallback:', err);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleGuestLogin = () => {
    const mockUser = {
      uid: "jury_guest_pass",
      email: "jury@atsa-conference.org",
      displayName: "Conference Jury Member",
      photoURL: null
    } as User;
    setUser(mockUser);
    localStorage.setItem('atsa_guest_session', JSON.stringify(mockUser));
    setAppState('dashboard');
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('atsa_guest_session');
      await signOut(auth);
      setUser(null);
      setAppState('landing');
    } catch (error) {
      console.error("Logout failed:", error);
      localStorage.removeItem('atsa_guest_session');
      setUser(null);
      setAppState('landing');
    }
  };

  const handleRegisterSample = async (data: any) => {
    if (!user) return;
    
    const path = 'samples';
    try {
      // Save sample registration to Firestore
      await addDoc(collection(db, path), {
        patientId: data.patientId,
        species: data.species,
        collectionTime: data.collectionTime,
        abstinenceDays: data.abstinenceDays,
        notes: data.notes,
        uid: user.uid,
        timestamp: Timestamp.now()
      });

      setActivePatient({ id: data.patientId, species: data.species, profile: data.profile });
      setIsRegModalOpen(false);
      setAppState('analysis');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  if (appState === 'landing') {
    return (
      <LandingPage
        onEnterApp={() => setAppState('login')}
        onGuestLogin={handleGuestLogin}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  if (appState === 'login') {
    return (
      <div dir={dir} className={cn("min-h-screen flex flex-col lg:flex-row font-sans transition-colors duration-500 relative", theme === 'dark' ? "bg-[#050505]" : "bg-slate-50")}>
        {/* Top Left Return to Landing button */}
        <button
          onClick={() => setAppState('landing')}
          className={cn(
            "absolute top-6 left-6 z-30 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold border transition-all hover:scale-105 cursor-pointer backdrop-blur-md",
            theme === 'dark'
              ? "bg-white/5 border-white/10 text-white/80 hover:text-white hover:bg-white/10 shadow-lg"
              : "bg-white/90 border-slate-200 text-slate-700 hover:text-slate-900 shadow-md"
          )}
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span>Product Overview</span>
        </button>

        {/* Left Side: Information & Branding */}
        <div className={cn(
          "flex-1 relative overflow-hidden flex flex-col justify-center p-12 lg:p-24",
          theme === 'dark' ? "bg-[#0a0a0a]" : "bg-white"
        )}>
          {/* Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className={cn("absolute top-[-10%] left-[-10%] w-[60%] h-[60%] blur-[150px] rounded-full opacity-20", theme === 'dark' ? "bg-emerald-500" : "bg-emerald-500/30")} />
            <div className={cn("absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] blur-[150px] rounded-full opacity-20", theme === 'dark' ? "bg-blue-500" : "bg-blue-500/30")} />
          </div>

          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="relative z-10"
          >
            <div className="flex items-center gap-4 mb-12">
              <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20">
                <Microscope className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className={cn("text-4xl font-black tracking-tighter", theme === 'dark' ? "text-white" : "text-slate-900")}>{t('brandTitle')} <span className="text-emerald-500">V2.0</span></h1>
                <p className={cn("text-xs font-bold uppercase tracking-[0.2em]", theme === 'dark' ? "text-white/40" : "text-slate-400")}>{t('brandSubtitle')}</p>
              </div>
            </div>

            <h2 className={cn("text-5xl lg:text-7xl font-light leading-[1.1] mb-8 tracking-tight", theme === 'dark' ? "text-white" : "text-slate-900")}>
              {t('sloganPrefix')} <br />
              <span className="font-serif italic text-emerald-500">{t('sloganHighlight')}</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-12">
              {[
                { title: t('feature1Title'), desc: t('feature1Desc'), icon: Activity },
                { title: t('feature2Title'), desc: t('feature2Desc'), icon: ClipboardList },
                { title: t('feature3Title'), desc: t('feature3Desc'), icon: Users },
                { title: t('feature4Title'), desc: t('feature4Desc'), icon: FileText },
              ].map((feature, i) => (
                <motion.div 
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + (i * 0.1) }}
                  className="space-y-2"
                >
                  <div className={cn("flex items-center gap-2 font-bold text-[10px] uppercase tracking-widest", theme === 'dark' ? "text-emerald-400" : "text-emerald-600")}>
                    <feature.icon className="w-3 h-3" />
                    {feature.title}
                  </div>
                  <p className={cn("text-sm leading-relaxed max-w-[240px]", theme === 'dark' ? "text-white/40" : "text-slate-500")}>
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div className={cn("mt-auto pt-12 flex flex-wrap items-center gap-x-8 gap-y-4 text-[10px] font-bold uppercase tracking-widest", theme === 'dark' ? "text-white/20" : "text-slate-300")}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {t('systemOnline')}
            </div>
            <div>{t('founder')}</div>
            <div>v2.0.1309-STABLE</div>
            <div>© 2026 ATSA TECHNOLOGIES</div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className={cn(
          "w-full lg:w-[480px] flex flex-col justify-center p-8 lg:p-16 border-l",
          theme === 'dark' ? "bg-[#050505] border-white/5" : "bg-slate-50 border-slate-200"
        )}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full max-w-sm mx-auto"
          >
            <div className="mb-10 flex flex-col gap-6">
              <div className="flex justify-end">
                <LanguageSelect />
              </div>
              <div>
                <h3 className={cn("text-2xl font-bold mb-2", theme === 'dark' ? "text-white" : "text-slate-900")}>{t('labAccess')}</h3>
                <p className={cn("text-sm", theme === 'dark' ? "text-white/40" : "text-slate-500")}>{t('labAccessDesc')}</p>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className={cn("text-[10px] font-bold uppercase tracking-widest", theme === 'dark' ? "text-white/40" : "text-slate-400")}>{t('labId')}</label>
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">{t('required')}</span>
                </div>
                <div className="relative group">
                  <input 
                    type="text" 
                    placeholder="LAB-SECTOR-A4"
                    className={cn(
                      "w-full border rounded-2xl px-5 py-4 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50",
                      theme === 'dark' ? "bg-white/5 border-white/10 text-white placeholder:text-white/10" : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-300"
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className={cn("text-[10px] font-bold uppercase tracking-widest", theme === 'dark' ? "text-white/40" : "text-slate-400")}>{t('accessKey')}</label>
                  <button type="button" className="text-[10px] font-bold text-emerald-500/60 hover:text-emerald-500 uppercase tracking-widest transition-colors">{t('forgotKey')}</button>
                </div>
                <div className="relative group">
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    className={cn(
                      "w-full border rounded-2xl px-5 py-4 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/50",
                      theme === 'dark' ? "bg-white/5 border-white/10 text-white placeholder:text-white/10" : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-300"
                    )}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 px-1">
                <input type="checkbox" id="remember" className="w-4 h-4 rounded border-emerald-500/20 bg-emerald-500/10 text-emerald-500 focus:ring-emerald-500/50" />
                <label htmlFor="remember" className={cn("text-xs font-medium", theme === 'dark' ? "text-white/40" : "text-slate-500")}>{t('rememberWorkstation')}</label>
              </div>

              <button 
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-5 rounded-2xl mt-4 transition-all shadow-xl shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-5 h-5" />
                {t('authGoogle')}
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-black/10 dark:border-white/5"></div>
                <span className="flex-shrink mx-4 text-[8px] font-bold text-black/30 dark:text-white/25 uppercase tracking-widest font-mono">{t('reviewerBypass')}</span>
                <div className="flex-grow border-t border-black/10 dark:border-white/5"></div>
              </div>

              <button 
                type="button"
                onClick={handleGuestLogin}
                className={cn(
                  "w-full font-bold py-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 border cursor-pointer text-xs uppercase tracking-wider",
                  theme === 'dark' 
                    ? "bg-[#111] hover:bg-white/5 text-amber-400 border-amber-500/30" 
                    : "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200"
                )}
              >
                <Award className="w-4 h-4 text-amber-500" />
                {t('instantJuryAccess')}
              </button>
            </form>

            <div className={cn("mt-12 p-6 rounded-3xl border border-dashed text-center", theme === 'dark' ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50")}>
              <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-2", theme === 'dark' ? "text-white/40" : "text-slate-400")}>{t('securityNoticeTitle')}</p>
              <p className={cn("text-xs leading-relaxed", theme === 'dark' ? "text-white/20" : "text-slate-400")}>
                {t('securityNoticeDesc')}
              </p>
            </div>
          </motion.div>

          <button 
            onClick={toggleTheme}
            className={cn(
              "mt-auto self-center p-4 rounded-2xl border transition-all hover:scale-110 active:scale-95",
              theme === 'dark' ? "bg-white/5 border-white/10 text-white/60 hover:text-white" : "bg-white border-slate-200 text-slate-400 hover:text-slate-900"
            )}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    );
  }

  if (appState === 'analysis') {
    return (
      <CASAEngine 
        onBack={() => {
          setAnalysisInitialAction(null);
          setAppState('dashboard');
        }} 
        patientData={activePatient || { id: 'BOV-9872', species: 'Bovine', profile: SPECIES_PROFILES['Bovine'] }} 
        theme={theme} 
        initialAction={analysisInitialAction}
      />
    );
  }

  return (
    <div dir={dir} className={cn("min-h-screen font-sans flex transition-colors duration-300", theme === 'dark' ? "bg-[#0a0a0a] text-white" : "bg-slate-50 text-slate-900")}>
      {/* Sidebar Navigation */}
      <aside className={cn(
        "w-20 lg:w-64 border-r flex flex-col transition-all relative z-30 shrink-0",
        theme === 'dark' 
          ? "bg-[#09090b] border-white/[0.06]" 
          : "bg-white border-slate-200/80 shadow-[1px_0_10px_rgba(0,0,0,0.01)]"
      )}>
        {/* Glow accent for sidebar */}
        {theme === 'dark' && (
          <div className="absolute top-0 left-0 w-[1px] h-[full] bg-gradient-to-b from-emerald-500/20 via-transparent to-transparent pointer-events-none text-transparent" />
        )}

        <div className="p-6 flex items-center gap-3 border-b border-light/5 border-white/[0.04] dark:border-white/[0.04] border-slate-100">
          <div className="relative group shrink-0">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl opacity-40 blur-sm group-hover:opacity-75 transition duration-500" />
            <div className="relative w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <Microscope className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="hidden lg:flex flex-col">
            <span className={cn("font-black text-lg tracking-tight leading-none", theme === 'dark' ? "text-white" : "text-slate-900")}>
              ATSA <span className="text-emerald-500 font-normal">V2.0</span>
            </span>
            <span className={cn("text-[8px] font-bold tracking-widest mt-1 opacity-50", theme === 'dark' ? "text-white/40" : "text-slate-400")}>
              CASA SYSTEMS
            </span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1.5">
          {[
            { id: 'dashboard', icon: Activity, label: t('dashboard'), badge: t('active') },
            { id: 'analysis', icon: Microscope, label: t('casaEngine'), hot: true },
            { id: 'upload_video', icon: Upload, label: t('uploadVideo') },
            { id: 'history', icon: Clock, label: t('patientHistory') },
            { id: 'inventory', icon: Package, label: t('inventory') },
            { id: 'help', icon: BookOpen, label: t('helpOverview') },
          ].map((item) => {
            const isActive = item.id === 'upload_video'
              ? (appState === 'analysis' && analysisInitialAction === 'upload')
              : (item.id === 'analysis'
                ? (appState === 'analysis' && analysisInitialAction !== 'upload')
                : appState === item.id);

            const handleClick = () => {
              if (item.id === 'upload_video') {
                setAnalysisInitialAction('upload');
                if (!activePatient) {
                  setIsRegModalOpen(true);
                } else {
                  setAppState('analysis');
                }
              } else {
                if (item.id === 'analysis') {
                  setAnalysisInitialAction(null);
                }
                setAppState(item.id as AppState);
              }
            };

            return (
              <button
                key={item.id}
                onClick={handleClick}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative group overflow-hidden cursor-pointer",
                  isActive
                    ? "bg-gradient-to-r from-emerald-500/[0.08] to-emerald-500/[0.02] text-emerald-500 border-l-2 border-emerald-500 font-semibold"
                    : theme === 'dark'
                      ? "text-white/40 hover:bg-white/[0.02] hover:text-white"
                      : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon className={cn(
                  "w-5 h-5 transition-transform duration-300 group-hover:scale-110",
                  isActive 
                    ? "text-emerald-500" 
                    : theme === 'dark' ? "group-hover:text-white" : "group-hover:text-slate-900"
                )} />
                <span className="font-medium hidden lg:block text-sm">{item.label}</span>
                
                {/* Optional Badge decoration */}
                {item.id === 'dashboard' && isActive && (
                  <span className="hidden lg:inline-block absolute right-4 text-[8px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">
                    {item.badge}
                  </span>
                )}
                {item.hot && !isActive && (
                  <span className="absolute right-4 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse hidden lg:block" />
                )}
              </button>
            );
          })}
        </nav>

        <div className={cn("p-4 border-t space-y-1.5", theme === 'dark' ? "border-white/[0.04]" : "border-slate-100")}>
          <button 
            onClick={() => setAppState('landing')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer",
              theme === 'dark' ? "text-emerald-400/80 hover:bg-emerald-500/10 hover:text-emerald-300" : "text-emerald-700 hover:bg-emerald-50 hover:text-emerald-900"
            )}
          >
            <Globe className="w-5 h-5" />
            <span className="font-medium hidden lg:block text-sm">Product Overview</span>
          </button>
          <button className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer",
            theme === 'dark' ? "text-white/40 hover:bg-white/5 hover:text-white" : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"
          )}>
            <Settings className="w-5 h-5" />
            <span className="font-medium hidden lg:block text-sm">{t('settings')}</span>
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400/60 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium hidden lg:block text-sm">{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className={cn(
          "h-20 border-b flex items-center justify-between px-8 backdrop-blur-md sticky top-0 z-20 transition-all duration-300",
          theme === 'dark' ? "bg-[#09090b]/90 border-white/[0.04]" : "bg-white/90 border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
        )}>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col">
              <span className={cn("text-[9px] font-black uppercase tracking-widest leading-none mb-1.5", theme === 'dark' ? "text-white/30" : "text-slate-400")}>
                {t('systemDate')}
              </span>
              <span className={cn("text-xs font-semibold tabular-nums", theme === 'dark' ? "text-emerald-400" : "text-emerald-600")}>
                {new Date().toLocaleDateString(language === 'ar' ? 'ar-EG' : language === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <div className="hidden md:block w-px h-8 bg-white/[0.04] dark:bg-white/[0.04] bg-slate-200" />
            <div>
              <h2 className={cn("text-[10px] font-bold uppercase tracking-widest", theme === 'dark' ? "text-white/40" : "text-slate-400")}>{t('welcomeBack')}</h2>
              <p className={cn("text-base font-bold tracking-tight", theme === 'dark' ? "text-white" : "text-slate-900")}>{user?.displayName || user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <LanguageSelect />
            <button 
              onClick={toggleTheme}
              className={cn(
                "p-2.5 border rounded-xl transition-all cursor-pointer",
                theme === 'dark' ? "bg-white/5 border-white/10 text-white/60 hover:text-white" : "bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-900"
              )}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={cn(
                  "p-2.5 border rounded-xl transition-all relative",
                  theme === 'dark' ? "bg-white/5 border-white/10 text-white/60 hover:text-white" : "bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-900",
                  showNotifications && (theme === 'dark' ? "bg-white/10 text-white" : "bg-slate-100 text-slate-900")
                )}
              >
                <Bell className="w-5 h-5" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-[#0a0a0a]" />
                )}
              </button>
              
              {/* Notifications Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className={cn(
                      "absolute right-0 mt-2 w-80 border rounded-2xl shadow-2xl overflow-hidden z-50",
                      theme === 'dark' ? "bg-[#0f0f0f] border-white/10" : "bg-white border-black/10"
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className={cn("p-4 border-b flex items-center justify-between", theme === 'dark' ? "border-white/5 bg-white/5" : "border-black/5 bg-black/5")}>
                      <h4 className={cn("text-xs font-bold uppercase tracking-widest", theme === 'dark' ? "text-white" : "text-slate-900")}>Notifications</h4>
                      <button 
                        onClick={async () => {
                          const unread = notifications.filter(n => !n.read);
                          for (const n of unread) {
                            const { doc, updateDoc } = await import('firebase/firestore');
                            await updateDoc(doc(db, 'notifications', n.id), { read: true });
                          }
                        }}
                        className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 uppercase tracking-widest"
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div 
                            key={n.id} 
                            className={cn(
                              "p-4 border-b last:border-0 transition-colors cursor-pointer",
                              !n.read ? (theme === 'dark' ? "bg-emerald-500/5" : "bg-emerald-500/5") : "hover:bg-white/5",
                              theme === 'dark' ? "border-white/5" : "border-black/5"
                            )}
                            onClick={async () => {
                              if (!n.read) {
                                const { doc, updateDoc } = await import('firebase/firestore');
                                await updateDoc(doc(db, 'notifications', n.id), { read: true });
                              }
                              if (n.link) {
                                // Handle navigation if link exists
                              }
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "w-2 h-2 rounded-full mt-1.5 shrink-0",
                                n.type === 'error' ? "bg-red-500" : n.type === 'warning' ? "bg-amber-500" : "bg-emerald-500",
                                n.read && "opacity-0"
                              )} />
                              <div className="space-y-1">
                                <p className={cn("text-sm font-semibold leading-tight", theme === 'dark' ? "text-white" : "text-slate-900")}>{n.title}</p>
                                <p className={cn("text-xs leading-relaxed", theme === 'dark' ? "text-white/40" : "text-slate-500")}>{n.message}</p>
                                <p className={cn("text-[10px] font-medium", theme === 'dark' ? "text-white/20" : "text-slate-400")}>
                                  {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center">
                          <p className={cn("text-xs", theme === 'dark' ? "text-white/20" : "text-slate-400")}>No notifications yet</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className={cn("h-10 w-px mx-2", theme === 'dark' ? "bg-white/10" : "bg-slate-200")} />
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className={cn("text-sm font-medium", theme === 'dark' ? "text-white" : "text-slate-900")}>Laboratory Personnel</p>
                <p className={cn("text-xs", theme === 'dark' ? "text-white/40" : "text-slate-400")}>Lab Sector A-4</p>
              </div>
              {user?.photoURL ? (
                <img src={user.photoURL} alt="User" className="w-10 h-10 rounded-full border-2 border-white/10" referrerPolicy="no-referrer" />
              ) : (
                <div className={cn("w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 border-2", theme === 'dark' ? "border-white/10" : "border-slate-200")} />
              )}
            </div>
          </div>
        </header>

        <div className={cn("flex-1 overflow-y-auto transition-colors duration-300", theme === 'dark' ? "bg-[#0a0a0a]" : "bg-slate-50")}>
          {appState === 'dashboard' && (
            <div className="p-8 max-w-7xl mx-auto space-y-8">
              {/* Hero Section & Laboratory Performance */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Hero card */}
                <div className="lg:col-span-2 p-8 bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 rounded-[32px] relative overflow-hidden group shadow-[0_12px_40px_rgba(16,185,129,0.15)] transition-transform duration-500 hover:scale-[1.005]">
                  {/* Subtle ambient light patterns inside card */}
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-70 pointer-events-none" />
                  <div className="absolute -top-12 -left-12 w-40 h-40 bg-teal-400/20 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/15 mb-6 text-xs text-white/95 font-bold uppercase tracking-widest leading-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                        {t('systemReady')}
                      </div>
                      <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tight mb-3">
                        {t('precisionAnalysis')}
                      </h2>
                      <p className="text-white/80 text-sm max-w-md leading-relaxed mb-8">
                        {t('heroDescription')}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-4 mt-auto">
                      <button 
                        onClick={() => setIsRegModalOpen(true)}
                        className="px-6 py-4 bg-white text-emerald-800 font-bold rounded-2xl hover:bg-emerald-50/95 shadow-lg active:scale-95 transition-all flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <ClipboardList className="w-5 h-5 text-emerald-600" />
                        {t('registerNewSample')}
                      </button>
                      <button 
                        onClick={() => {
                          if (!activePatient) setIsRegModalOpen(true);
                          else setAppState('analysis');
                        }}
                        className="px-6 py-4 bg-black/20 backdrop-blur-md text-white font-bold rounded-2xl hover:bg-black/30 border border-white/15 active:scale-95 transition-all flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <Play className="w-5 h-5 fill-current text-emerald-300" />
                        {t('accessCasaEngine')}
                      </button>
                    </div>
                  </div>
                  <Microscope className="absolute right-[-30px] bottom-[-30px] w-72 h-72 text-white/10 rotate-[-12deg] group-hover:rotate-[-8deg] group-hover:scale-105 transition-all duration-700 ease-out pointer-events-none" />
                </div>

                {/* Lab Performance Overview Card */}
                <div className={cn(
                  "p-8 border rounded-[32px] flex flex-col justify-between transition-all duration-300 relative overflow-hidden",
                  theme === 'dark' 
                    ? "bg-[#09090b] border-white/[0.06] shadow-[0_10px_30px_rgba(0,0,0,0.2)]" 
                    : "bg-white border-slate-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.02)]"
                )}>
                  {theme === 'dark' && (
                    <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                  )}
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className={cn("text-[10px] font-black uppercase tracking-widest", theme === 'dark' ? "text-white/40" : "text-slate-400")}>
                        Lab Performance Monitoring
                      </h3>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Database Connected" />
                    </div>

                    <div className="space-y-5">
                      {/* Stat 1: Samples Today */}
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-500/[0.02] dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-blue-500/10 rounded-xl">
                            <Users className="w-4 h-4 text-blue-500" />
                          </div>
                          <div>
                            <p className={cn("text-xs font-semibold", theme === 'dark' ? "text-white/60" : "text-slate-600")}>{t('statsToday')}</p>
                            <p className={cn("text-[9px] uppercase tracking-wider font-bold opacity-40", theme === 'dark' ? "text-white/30" : "text-slate-400")}>Secure Firestore</p>
                          </div>
                        </div>
                        <span className="text-xl font-black tracking-tight font-mono">
                          <CountUpNumber value={stats.samplesToday} decimals={0} duration={1200} />
                        </span>
                      </div>

                      {/* Stat 2: Avg Processing */}
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-500/[0.02] dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                            <Clock className="w-4 h-4 text-emerald-500" />
                          </div>
                          <div>
                            <p className={cn("text-xs font-semibold", theme === 'dark' ? "text-white/60" : "text-slate-600")}>{t('avgProcessing')}</p>
                            <p className={cn("text-[9px] uppercase tracking-wider font-bold opacity-40", theme === 'dark' ? "text-white/30" : "text-slate-400")}>Optimized Pipeline</p>
                          </div>
                        </div>
                        <span className="text-xl font-black tracking-tight font-mono">{stats.avgProcessing}</span>
                      </div>

                      {/* Stat 3: Real Average Concentration across loaded analysis (Tailored Metric) */}
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-500/[0.02] dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-teal-500/10 rounded-xl">
                            <Activity className="w-4 h-4 text-teal-500" />
                          </div>
                          <div>
                            <p className={cn("text-xs font-semibold", theme === 'dark' ? "text-white/60" : "text-slate-600")}>Avg. Concentration</p>
                            <p className={cn("text-[9px] uppercase tracking-wider font-bold opacity-40", theme === 'dark' ? "text-white/30" : "text-slate-400")}>Live Bio-Metric</p>
                          </div>
                        </div>
                        <span className="text-xl font-black tracking-tight text-teal-400 font-mono">
                          <CountUpNumber 
                            value={
                              recentAnalyses.length > 0 
                                ? (recentAnalyses.reduce((acc, curr) => acc + (curr.concentration || 0), 0) / recentAnalyses.length)
                                : (recent30DaysAnalyses.length > 0
                                    ? (recent30DaysAnalyses.reduce((acc, curr) => acc + (curr.concentration || 0), 0) / recent30DaysAnalyses.length)
                                    : 0)
                            } 
                            decimals={1} 
                            duration={1400}
                          /> <span className="text-[10px] font-normal text-muted-foreground font-sans">M/ml</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={cn("pt-5 border-t", theme === 'dark' ? "border-white/[0.05]" : "border-slate-100")}>
                    <button className="w-full text-emerald-500 hover:text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 hover:gap-2.5 transition-all duration-300 cursor-pointer">
                      View Diagnostics Link <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </section>

              {/* Performance Trends of Clinic */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Performance Trends Chart with Hover-To-Zoom & Detailed Tooltip */}
                <div className="lg:col-span-2">
                  <PerformanceTrendsChart 
                    analyses={recent30DaysAnalyses} 
                    theme={theme} 
                    language={language}
                    onSelectSample={(sample) => {
                      if (sample.patientId) {
                        const profileKey = (sample.species?.toLowerCase() || 'human') as keyof typeof SPECIES_PROFILES;
                        setActivePatient({
                          id: sample.patientId,
                          species: sample.species || 'Human',
                          profile: SPECIES_PROFILES[profileKey] || SPECIES_PROFILES.human
                        });
                      }
                      setAppState('history');
                    }}
                  />
                </div>

                {/* WHO Reference Compliance Meter */}
                <div className={cn(
                  "lg:col-span-1 p-8 border rounded-[32px] flex flex-col justify-between transition-all duration-300 relative overflow-hidden",
                  theme === 'dark' 
                    ? "bg-[#09090b] border-white/[0.06] shadow-[0_10px_30px_rgba(0,0,0,0.2)]" 
                    : "bg-white border-slate-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.02)]"
                )}>
                  {theme === 'dark' && (
                    <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-emerald-500/[0.02] rounded-full blur-3xl pointer-events-none" />
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className={cn("text-[10px] font-black uppercase tracking-widest", theme === 'dark' ? "text-white/40" : "text-slate-400")}>
                        WHO Reference Compliance
                      </h3>
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-black bg-blue-500/10 text-blue-500 border border-blue-500/10 uppercase">
                        WHO 2010
                      </span>
                    </div>

                    <div className="flex flex-col items-center justify-center py-4 text-center">
                      <div className="relative w-28 h-28 flex items-center justify-center mb-4">
                        {/* Outer circular indicator tracks compliance */}
                        <svg className="w-full h-full transform -rotate-90">
                          <circle 
                            cx="56" 
                            cy="56" 
                            r="48" 
                            className="stroke-slate-100 dark:stroke-white/[0.02]" 
                            strokeWidth="8" 
                            fill="transparent" 
                          />
                          <circle 
                            cx="56" 
                            cy="56" 
                            r="48" 
                            className="stroke-emerald-500 transition-all duration-1000 ease-out" 
                            strokeWidth="8" 
                            fill="transparent" 
                            strokeDasharray={301.6}
                            strokeDashoffset={301.6 - (301.6 * (complianceStats.percent || 1)) / 100}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center text-center">
                          <span className={cn("text-2xl font-black font-mono tracking-tighter", theme === 'dark' ? "text-white" : "text-slate-900")}>
                            {complianceStats.percent}%
                          </span>
                          <span className="text-[8px] font-black tracking-wider uppercase opacity-45">Pass Rate</span>
                        </div>
                      </div>

                      <h4 className={cn("text-xs font-bold font-sans mt-2 mb-1", theme === 'dark' ? "text-white" : "text-slate-800")}>
                        Reference Limit Guidelines
                      </h4>
                      <p className={cn("text-[10px] max-w-[200px] leading-relaxed", theme === 'dark' ? "text-white/40" : "text-slate-500")}>
                        Percentage of laboratory specimens meeting the standard WHO 2010 concentration limit of <strong className="text-emerald-500 font-bold">≥ 15 M/ml</strong>.
                      </p>
                    </div>
                  </div>

                  <div className={cn("pt-4 mt-4 border-t flex items-center justify-between text-[10px] font-mono", theme === 'dark' ? "border-white/[0.04] text-white/40" : "border-slate-100 text-slate-500")}>
                    <span>Compliant Cases:</span>
                    <strong className="text-emerald-500 font-bold">{complianceStats.count} / {complianceStats.total}</strong>
                  </div>
                </div>
              </section>

              {/* 5-Animal Virtual Clinical Library Showcase */}
              <section>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-500 border border-emerald-500/20">
                      <Microscope className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className={cn("text-xs font-black uppercase tracking-wider", theme === 'dark' ? "text-white" : "text-slate-900")}>
                        Multi-Species Virtual Datasets & Clinical PDF Dossiers
                      </h3>
                      <p className={cn("text-[10px]", theme === 'dark' ? "text-white/40" : "text-slate-400")}>
                        Select a validated species dataset to explore high-resolution kinematics, Kruger strict morphology, and export full certified PDF reports
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  {VIRTUAL_ANIMAL_KEYS.map((key) => {
                    const animal = VIRTUAL_ANIMALS[key];
                    return (
                      <div
                        key={key}
                        className={cn(
                          "group p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between relative overflow-hidden",
                          theme === 'dark'
                            ? "bg-[#09090b] border-white/[0.06] hover:border-emerald-500/30 hover:bg-[#0d0d12]"
                            : "bg-white border-slate-200/80 hover:border-emerald-500/40 hover:shadow-md"
                        )}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-2xl p-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5">
                              {animal.avatarIcon}
                            </span>
                            <span className={cn(
                              "text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
                              animal.results.summary.interpretation.status === 'normal' 
                                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            )}>
                              {animal.results.summary.interpretation.status}
                            </span>
                          </div>

                          <div>
                            <h4 className={cn("text-sm font-bold tracking-tight", theme === 'dark' ? "text-white" : "text-slate-900")}>
                              {animal.species}
                            </h4>
                            <p className="text-[10px] text-emerald-500 font-mono font-medium">
                              {animal.patientId} &middot; {animal.breed}
                            </p>
                          </div>

                          <div className={cn("p-2 rounded-xl text-[9px] space-y-1 font-mono", theme === 'dark' ? "bg-white/[0.02] border border-white/[0.04]" : "bg-slate-50 border border-slate-100")}>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Conc:</span>
                              <span className="font-bold">{animal.results.summary.concentration} M/ml</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Prog Motility:</span>
                              <span className="font-bold text-emerald-500">{animal.results.summary.motility.progressive}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Normal Morph:</span>
                              <span className="font-bold">{animal.results.summary.morphology.normal}%</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 mt-3 border-t border-black/5 dark:border-white/5 flex gap-1.5">
                          <button
                            onClick={() => {
                              setActivePatient({
                                id: animal.patientId,
                                species: animal.species,
                                profile: SPECIES_PROFILES[animal.species] || SPECIES_PROFILES['Bovine']
                              });
                              setAppState('analysis');
                            }}
                            className="flex-1 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm"
                          >
                            <Play className="w-2.5 h-2.5 fill-current" />
                            <span>Analyze</span>
                          </button>
                          <button
                            onClick={() => {
                              setPreviewAnalysis({
                                id: animal.patientId,
                                patientId: animal.patientId,
                                species: animal.species,
                                concentration: animal.results.summary.concentration,
                                motility: animal.results.summary.motility,
                                morphology: animal.results.summary.morphology,
                                date: new Date().toISOString(),
                                interpretation: animal.results.summary.interpretation,
                                clinicianRemarks: animal.clinicianRemarks,
                                ...animal.results
                              });
                            }}
                            className={cn(
                              "p-1.5 rounded-lg border text-[9px] font-bold transition-all flex items-center justify-center cursor-pointer",
                              theme === 'dark' ? "border-white/10 hover:bg-white/10 text-white" : "border-slate-200 hover:bg-slate-100 text-slate-700"
                            )}
                            title="Quick PDF Report Preview"
                          >
                            <Download className="w-3 h-3 text-emerald-500" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Quick Actions Grid */}
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <h3 className={cn("text-[10px] font-black uppercase tracking-widest", theme === 'dark' ? "text-white/40" : "text-slate-400")}>
                    Guided Laboratory Workflows
                  </h3>
                  <div className="h-px flex-1 bg-white/[0.04] dark:bg-white/[0.04] bg-slate-200" />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {[
                    { 
                      title: 'Video Upload', 
                      desc: 'Process live & recorded sample clips', 
                      icon: Play, 
                      color: 'from-blue-500 to-indigo-600', 
                      badge: 'analyzer', 
                      action: () => {
                        setAnalysisInitialAction('upload');
                        if (!activePatient) {
                          setIsRegModalOpen(true);
                        } else {
                          setAppState('analysis');
                        }
                      } 
                    },
                    { title: 'Morphometry', desc: 'Detailed length & curvature measurements', icon: Activity, color: 'from-purple-500 to-pink-600', badge: 'standard', action: () => setAppState('analysis') },
                    { title: 'Inventory', desc: 'Track reagents, slide lots & lab supplies', icon: Package, color: 'from-amber-500 to-orange-600', badge: 'lot-tracker', action: () => setAppState('inventory') },
                    { title: 'Help Center', desc: 'Access clinical protocols & WHO materials', icon: BookOpen, color: 'from-indigo-500 to-teal-600', badge: 'manual', action: () => setAppState('help') },
                    { title: 'Reports', desc: 'Export certified clinical PDF exports', icon: FileText, color: 'from-emerald-500 to-teal-600', badge: 'records', action: () => setAppState('dashboard') },
                  ].map((card, i) => (
                    <motion.div 
                      key={card.title}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      onClick={card.action}
                      className={cn(
                        "group p-6 border rounded-[24px] transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col justify-between h-[210px]",
                        theme === 'dark' 
                          ? "bg-[#09090b] border-white/[0.05] hover:border-emerald-500/20 shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_30px_rgba(16,185,129,0.04)]" 
                          : "bg-white border-slate-200/80 hover:border-emerald-500/20 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.03)]"
                      )}
                    >
                      {/* Interactive glow aura on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-emerald-500/0 to-emerald-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md bg-gradient-to-br transition-all duration-300 group-hover:scale-110", card.color)}>
                            <card.icon className="w-5 h-5 text-white" />
                          </div>
                          <span className={cn(
                            "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border",
                            theme === 'dark' ? "border-white/[0.04] bg-white/[0.02] text-white/40" : "border-slate-100 bg-slate-50 text-slate-400"
                          )}>
                            {card.badge}
                          </span>
                        </div>
                        <h4 className={cn("text-base font-bold mb-1 tracking-tight transition-colors duration-300 group-hover:text-emerald-500", theme === 'dark' ? "text-white" : "text-slate-900")}>
                          {card.title}
                        </h4>
                        <p className={cn("text-xs leading-relaxed opacity-70 mb-3", theme === 'dark' ? "text-white/40" : "text-slate-500")}>
                          {card.desc}
                        </p>
                      </div>

                      <div className={cn(
                        "flex items-center text-[9px] font-black tracking-widest mt-auto border-t pt-3 transition-colors duration-300",
                        theme === 'dark' ? "text-white/20 group-hover:text-emerald-400 border-white/[0.04]" : "text-slate-300 group-hover:text-emerald-600 border-slate-100"
                      )}>
                        INITIATE <ChevronRight className="w-3 h-3 ml-1 transition-transform group-hover:translate-x-1" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Recent Activity */}
              <section className={cn(
                "border rounded-[32px] overflow-hidden transition-all duration-300",
                theme === 'dark' 
                  ? "bg-[#09090b] border-white/[0.06] shadow-[0_12px_45px_rgba(0,0,0,0.3)]" 
                  : "bg-white border-slate-200/80 shadow-[0_12px_45px_rgba(0,0,0,0.01)]"
              )}>
                <div className={cn("p-6 border-b flex items-center justify-between", theme === 'dark' ? "border-white/[0.04]" : "border-slate-100")}>
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className={cn("text-sm font-bold uppercase tracking-wider", theme === 'dark' ? "text-white" : "text-slate-900")}>
                      {t('recentSpermAnalyses')}
                    </h3>
                    {isBatchMode && (
                      <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-black rounded-lg">
                        {selectedAnalyses.length} SELECTED
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {isBatchMode ? (
                      <>
                        <button 
                          onClick={() => {
                            setIsBatchMode(false);
                            setSelectedAnalyses([]);
                          }}
                          className={cn("text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-xl transition-colors cursor-pointer", theme === 'dark' ? "text-white/40 hover:text-white" : "text-slate-400 hover:text-slate-900")}
                        >
                          {t('cancel')}
                        </button>
                        <button 
                          onClick={handleBatchExport}
                          disabled={selectedAnalyses.length === 0}
                          className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-md shadow-emerald-500/10 cursor-pointer"
                        >
                          {t('batchExportSelected')}
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => setIsBatchMode(true)}
                          className={cn("text-xs font-semibold px-3 py-1.5 rounded-lg border border-transparent hover:border-emerald-500/10 transition-all cursor-pointer", theme === 'dark' ? "text-white/40 hover:text-white bg-white/[0.02]" : "text-slate-500 hover:text-slate-900 bg-slate-50")}
                        >
                          {t('batchMode')}
                        </button>
                        <button className={cn("text-xs font-semibold px-3 py-1.5 rounded-lg border border-transparent hover:border-emerald-500/10 transition-all cursor-pointer", theme === 'dark' ? "text-white/40 hover:text-white bg-white/[0.02]" : "text-slate-500 hover:text-slate-900 bg-slate-50")}>
                          View All
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className={cn("text-[9px] font-black uppercase tracking-widest border-b", theme === 'dark' ? "text-white/30 border-white/[0.04]" : "text-slate-400 border-slate-100")}>
                        {isBatchMode && <th className="px-6 py-4 w-10"></th>}
                        <th className="px-6 py-4">{t('id')}</th>
                        <th className="px-6 py-4">{t('species')}</th>
                        <th className="px-6 py-4">{t('concentrationValue')}</th>
                        <th className="px-6 py-4">{t('motility')}</th>
                        <th className="px-6 py-4">Verification</th>
                        <th className="px-6 py-4 text-right">{t('quickActions')}</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-slate-100 dark:divide-white/[0.04]">
                      {recentAnalyses.length > 0 ? recentAnalyses.map((row) => {
                        // Dynamic species badges
                        const speciesColors: Record<string, string> = {
                          Ovine: 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/15',
                          Caprine: 'bg-purple-500/10 text-purple-500 dark:text-purple-400 border-purple-500/15',
                          Bovine: 'bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/15',
                        };
                        const badgeClasses = speciesColors[row.species] || 'bg-slate-500/10 text-slate-500 border-slate-500/15';

                        return (
                          <tr 
                            key={row.id} 
                            onClick={() => {
                              if (isBatchMode) {
                                setSelectedAnalyses(prev => 
                                  prev.includes(row.id) ? prev.filter(id => id !== row.id) : [...prev, row.id]
                                );
                              }
                            }}
                            className={cn(
                              "transition-all duration-200 group", 
                              theme === 'dark' ? "hover:bg-white/[0.015]" : "hover:bg-slate-50/70",
                              isBatchMode && "cursor-pointer",
                              selectedAnalyses.includes(row.id) && (theme === 'dark' ? "bg-emerald-500/5" : "bg-emerald-500/5")
                            )}
                          >
                            {isBatchMode && (
                              <td className="px-6 py-4">
                                <div className={cn(
                                  "w-4 h-4 rounded border flex items-center justify-center transition-all",
                                  selectedAnalyses.includes(row.id) 
                                    ? "bg-emerald-500 border-emerald-500" 
                                    : (theme === 'dark' ? "border-white/20" : "border-slate-300")
                                  )}>
                                  {selectedAnalyses.includes(row.id) && <Check className="w-3 h-3 text-white" />}
                                </div>
                              </td>
                            )}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={cn("font-mono font-bold tracking-tight text-xs", theme === 'dark' ? "text-white" : "text-slate-800")}>
                                  {row.patientId}
                                </span>
                                {row.flagged && (
                                  <span 
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30 text-[9px] font-bold tracking-wide"
                                    title={t('flaggedForReview')}
                                  >
                                    <Flag className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                                    <span>FLAGGED</span>
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold border", badgeClasses)}>
                                {row.species}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={cn("font-bold text-xs font-mono", theme === 'dark' ? "text-white/80" : "text-slate-700")}>
                                {row.concentration?.toFixed(1)}{' '}
                                <span className="text-[10px] opacity-40">M/ml</span>
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <div className="w-12 bg-slate-200 dark:bg-white/[0.06] h-1.5 rounded-full overflow-hidden block">
                                  <div 
                                    className="bg-emerald-500 h-full rounded-full" 
                                    style={{ width: `${Math.min(row.motility?.total || 0, 100)}%` }}
                                  />
                                </div>
                                <span className={cn("font-bold font-mono text-xs", theme === 'dark' ? "text-white/80" : "text-slate-700")}>
                                  {row.motility?.total?.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                                row.interpretation?.status === 'normal' 
                                  ? "bg-emerald-500/5 text-emerald-500 border-emerald-500/10" 
                                  : "bg-red-500/5 text-red-500 border-red-500/10"
                                )}>
                                <span className={cn("w-1.5 h-1.5 rounded-full", row.interpretation?.status === 'normal' ? 'bg-emerald-400' : 'bg-red-400')} />
                                {row.interpretation?.status || 'Completed'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5 relative">
                                {/* Direct Action: View Report */}
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewAnalysis(row);
                                  }}
                                  className={cn(
                                    "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all border cursor-pointer group/btn", 
                                    theme === 'dark' 
                                      ? "bg-white/[0.02] text-white/70 hover:bg-emerald-500/10 hover:text-emerald-400 border-white/[0.06] hover:border-emerald-500/20" 
                                      : "bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 border-slate-200/70 hover:border-emerald-500/30"
                                  )}
                                  title={t('viewReport')}
                                >
                                  <FileText className="w-3.5 h-3.5 text-emerald-500 transition-transform group-hover/btn:scale-110" />
                                  <span className="hidden xl:inline text-[11px] font-bold">{t('viewReport')}</span>
                                </button>

                                {/* Direct Action: Mark as Flagged */}
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleFlag(row, e);
                                  }}
                                  className={cn(
                                    "p-1.5 rounded-xl transition-all border cursor-pointer",
                                    row.flagged
                                      ? "bg-amber-500/15 text-amber-500 border-amber-500/30 hover:bg-amber-500/25"
                                      : (theme === 'dark' 
                                          ? "bg-white/[0.02] text-white/40 hover:bg-white/10 hover:text-amber-400 border-white/[0.06] hover:border-amber-500/20" 
                                          : "bg-slate-50 text-slate-400 hover:bg-amber-50 hover:text-amber-600 border-slate-200/70 hover:border-amber-500/30")
                                  )}
                                  title={row.flagged ? t('unmarkFlagged') : t('markAsFlagged')}
                                >
                                  <Flag className={cn("w-3.5 h-3.5 transition-transform hover:scale-110", row.flagged && "fill-amber-500 text-amber-500")} />
                                </button>

                                {/* Direct Action: Delete Sample */}
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSampleToDelete(row);
                                  }}
                                  className={cn(
                                    "p-1.5 rounded-xl transition-all border cursor-pointer",
                                    theme === 'dark' 
                                      ? "bg-white/[0.02] text-white/40 hover:bg-red-500/10 hover:text-red-400 border-white/[0.06] hover:border-red-500/20" 
                                      : "bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 border-slate-200/70 hover:border-red-500/30"
                                  )}
                                  title={t('deleteSample')}
                                >
                                  <Trash2 className="w-3.5 h-3.5 transition-transform hover:scale-110" />
                                </button>

                                {/* Quick Actions Dropdown Menu Trigger */}
                                <div className="relative">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveActionMenuId(activeActionMenuId === row.id ? null : row.id);
                                    }}
                                    className={cn(
                                      "p-1.5 rounded-xl transition-all border cursor-pointer",
                                      activeActionMenuId === row.id
                                        ? (theme === 'dark' ? "bg-white/15 text-white border-white/20" : "bg-slate-200 text-slate-900 border-slate-300")
                                        : (theme === 'dark' ? "bg-white/[0.02] text-white/40 hover:bg-white/10 hover:text-white border-white/[0.06]" : "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-700 border-slate-200/70")
                                    )}
                                    title={t('quickActions')}
                                  >
                                    <MoreVertical className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Quick Actions Dropdown Menu Popover */}
                                  <AnimatePresence>
                                    {activeActionMenuId === row.id && (
                                      <motion.div
                                        initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                        transition={{ duration: 0.15 }}
                                        onClick={(e) => e.stopPropagation()}
                                        className={cn(
                                          "absolute right-0 top-full mt-1.5 w-52 rounded-xl shadow-2xl border py-1.5 z-40 text-left backdrop-blur-md",
                                          theme === 'dark' ? "bg-[#141417]/95 border-white/10 text-white shadow-black/80" : "bg-white/95 border-slate-200 text-slate-800 shadow-slate-300/60"
                                        )}
                                      >
                                        <div className="px-3 py-1.5 border-b border-slate-100 dark:border-white/5">
                                          <p className="text-[10px] font-black uppercase tracking-wider opacity-40">{t('quickActions')}</p>
                                          <p className="text-xs font-mono font-bold truncate">{row.patientId}</p>
                                        </div>
                                        
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveActionMenuId(null);
                                            setPreviewAnalysis(row);
                                          }}
                                          className={cn(
                                            "w-full px-3 py-2 text-xs flex items-center gap-2.5 transition-colors cursor-pointer text-left",
                                            theme === 'dark' ? "hover:bg-white/5 hover:text-emerald-400" : "hover:bg-slate-50 hover:text-emerald-600"
                                          )}
                                        >
                                          <FileText className="w-4 h-4 text-emerald-500" />
                                          <span>{t('viewReport')}</span>
                                        </button>

                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveActionMenuId(null);
                                            handleToggleFlag(row, e);
                                          }}
                                          className={cn(
                                            "w-full px-3 py-2 text-xs flex items-center gap-2.5 transition-colors cursor-pointer text-left",
                                            row.flagged
                                              ? (theme === 'dark' ? "text-amber-400 hover:bg-white/5" : "text-amber-600 hover:bg-amber-50")
                                              : (theme === 'dark' ? "hover:bg-white/5 hover:text-amber-400" : "hover:bg-slate-50 hover:text-amber-600")
                                          )}
                                        >
                                          <Flag className={cn("w-4 h-4", row.flagged ? "fill-amber-500 text-amber-500" : "text-amber-500")} />
                                          <span>{row.flagged ? t('unmarkFlagged') : t('markAsFlagged')}</span>
                                        </button>

                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveActionMenuId(null);
                                            setActivePatient({ 
                                              id: row.patientId, 
                                              species: row.species, 
                                              profile: SPECIES_PROFILES[row.species] || SPECIES_PROFILES['Bovine'] 
                                            });
                                            setAppState('analysis');
                                          }}
                                          className={cn(
                                            "w-full px-3 py-2 text-xs flex items-center gap-2.5 transition-colors cursor-pointer text-left",
                                            theme === 'dark' ? "hover:bg-white/5 hover:text-emerald-400" : "hover:bg-slate-50 hover:text-emerald-600"
                                          )}
                                        >
                                          <ArrowUpRight className="w-4 h-4 text-teal-400" />
                                          <span>Launch CASA Viewport</span>
                                        </button>

                                        <div className="my-1 border-t border-slate-100 dark:border-white/5" />

                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveActionMenuId(null);
                                            setSampleToDelete(row);
                                          }}
                                          className="w-full px-3 py-2 text-xs flex items-center gap-2.5 transition-colors cursor-pointer text-left text-red-500 hover:bg-red-500/10"
                                        >
                                          <Trash2 className="w-4 h-4 text-red-500" />
                                          <span>{t('deleteSample')}</span>
                                        </button>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-16 text-center text-white/20 font-medium">
                            <div className="flex flex-col items-center justify-center gap-3">
                              <ClipboardList className="w-8 h-8 opacity-25 text-emerald-500" />
                              <span className={cn("text-xs", theme === 'dark' ? "text-white/30" : "text-slate-400")}>{t('noAnalysesFound')}</span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {appState === 'help' && <HelpCenter onBack={() => setAppState('dashboard')} theme={theme} />}
          {appState === 'history' && <PatientHistoryView onBack={() => setAppState('dashboard')} theme={theme} />}
          {appState === 'inventory' && (
            <div className="p-8 max-w-7xl mx-auto">
              <InventoryManagement onBack={() => setAppState('dashboard')} theme={theme} />
            </div>
          )}
          {appState === 'analysis' && !activePatient && (
            <div className="h-full flex flex-col items-center justify-center text-center p-12">
              <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mb-6", theme === 'dark' ? "bg-white/5" : "bg-slate-100")}>
                <Microscope className={cn("w-10 h-10", theme === 'dark' ? "text-white/10" : "text-slate-200")} />
              </div>
              <h3 className={cn("text-xl font-bold mb-2", theme === 'dark' ? "text-white" : "text-slate-900")}>{t('noActivePatient')}</h3>
              <p className={cn("max-w-sm mb-8", theme === 'dark' ? "text-white/40" : "text-slate-500")}>
                {t('pleaseRegisterSampleMessage')}
              </p>
              <button 
                onClick={() => setIsRegModalOpen(true)}
                className="px-8 py-4 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                {t('registerNewSample')}
              </button>
            </div>
          )}
        </div>
      </main>

      <SampleRegistration 
        isOpen={isRegModalOpen} 
        onClose={() => setIsRegModalOpen(false)} 
        onRegister={handleRegisterSample}
        theme={theme}
      />

      {/* Mini Modal-based PDF Previewer */}
      <AnimatePresence>
        {previewAnalysis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
            onClick={() => setPreviewAnalysis(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.5 }}
              className={cn(
                "w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row border cursor-default",
                theme === 'dark' ? "bg-[#0b0b0d] border-white/10 text-white" : "bg-white border-slate-200 text-slate-800"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left Column: True-to-Life PDF Draft Document Preview */}
              <div className="flex-1 p-6 md:p-8 bg-[#f8fafc] dark:bg-black/30 border-r border-slate-100 dark:border-white/5 flex flex-col justify-between max-h-[85vh] overflow-y-auto">
                <div className="space-y-6">
                  {/* Document Header */}
                  <div className="flex justify-between items-start border-b border-slate-200 dark:border-white/10 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-emerald-500 flex items-center justify-center text-white text-xs font-black">A</div>
                        <h4 className="text-sm font-black tracking-wider uppercase text-emerald-500 font-mono">ATSA DIAGNOSTICS</h4>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-white/30 uppercase tracking-widest mt-1 font-mono">Consolidated Lab Report summary</p>
                    </div>
                    <div className="text-right font-mono text-[9px] text-slate-400 dark:text-white/30 space-y-0.5">
                      <div>ID: {previewAnalysis.id?.substring(0, 8) || 'DRAFT'}</div>
                      <div>DATE: {previewAnalysis.timestamp ? new Date(previewAnalysis.timestamp).toLocaleDateString() : 'N/A'}</div>
                    </div>
                  </div>

                  {/* Patient Info Sub-Grid */}
                  <div className="p-4 bg-slate-100 dark:bg-white/[0.03] rounded-xl border border-slate-200/50 dark:border-white/[0.05] grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-wider block">Patient / Breed ID</span>
                      <strong className="text-slate-800 dark:text-white font-mono">{previewAnalysis.patientId || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-wider block">Species Group</span>
                      <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded border border-emerald-500/10 inline-block mt-0.5">{previewAnalysis.species || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-wider block">Standard Reference</span>
                      <strong className="text-slate-700 dark:text-white/70">WHO 2010 Manual</strong>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-wider block">Authentication Seal</span>
                      <span className="text-[10px] text-emerald-500 font-bold font-mono">✓ ATSA CRYPTO SIGNED</span>
                    </div>
                  </div>

                  {/* Diagnostic KPI Matrix */}
                  <div className="space-y-3">
                    <h5 className="text-[10px] font-black uppercase text-slate-400 dark:text-white/30 tracking-widest">Sperm Parameters Diagnostic Grid</h5>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      <div className="p-3 bg-white dark:bg-[#111] rounded-xl border border-slate-200 dark:border-white/5 space-y-1">
                        <span className="text-[9px] text-slate-400 dark:text-white/40 block">Concentration</span>
                        <div className="text-sm font-bold font-mono text-emerald-500">
                          {previewAnalysis.concentration?.toFixed(1) || 'N/A'} <span className="text-[9px] opacity-60">M/ml</span>
                        </div>
                      </div>
                      <div className="p-3 bg-white dark:bg-[#111] rounded-xl border border-slate-200 dark:border-white/5 space-y-1">
                        <span className="text-[9px] text-slate-400 dark:text-white/40 block">Total Motility</span>
                        <div className="text-sm font-bold font-mono text-emerald-500">
                          {previewAnalysis.motility?.total?.toFixed(1) || 'N/A'}%
                        </div>
                      </div>
                      <div className="p-3 bg-white dark:bg-[#111] rounded-xl border border-slate-200 dark:border-white/5 space-y-1">
                        <span className="text-[9px] text-slate-400 dark:text-white/40 block">Progressive</span>
                        <div className="text-sm font-bold font-mono text-emerald-500">
                          {previewAnalysis.motility?.progressive?.toFixed(1) || 'N/A'}%
                        </div>
                      </div>
                      <div className="p-3 bg-white dark:bg-[#111] rounded-xl border border-slate-200 dark:border-white/5 space-y-1">
                        <span className="text-[9px] text-slate-400 dark:text-white/40 block">Morphology (Normal)</span>
                        <div className="text-sm font-bold font-mono text-emerald-500">
                          {previewAnalysis.morphology?.normal?.toFixed(1) || 'N/A'}%
                        </div>
                      </div>
                      <div className="p-3 bg-white dark:bg-[#111] rounded-xl border border-slate-200 dark:border-white/5 space-y-1">
                        <span className="text-[9px] text-slate-400 dark:text-white/40 block">Vitality (Live)</span>
                        <div className="text-sm font-bold font-mono text-emerald-500">
                          {previewAnalysis.vitality?.live?.toFixed(1) || 'N/A'}%
                        </div>
                      </div>
                      <div className="p-3 bg-white dark:bg-[#111] rounded-xl border border-slate-200 dark:border-white/5 space-y-1">
                        <span className="text-[9px] text-slate-400 dark:text-white/40 block">SDF (DFI)</span>
                        <div className="text-sm font-bold font-mono text-emerald-500">
                          {previewAnalysis.sdf?.dfi?.toFixed(1) || 'N/A'}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation Assessment Block */}
                  <div className="p-4 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.02] rounded-xl border border-emerald-500/10 space-y-1.5">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-500 uppercase block">Expert Recommendation Summary</span>
                    <p className="text-xs text-slate-600 dark:text-white/70 leading-relaxed font-sans">
                      {previewAnalysis.interpretation?.recommendation || 
                        (previewAnalysis.interpretation?.status === 'normal' 
                          ? "This specimen indicates high concentration metrics and standard sperm morphology parameters aligning with optimal clinical ranges."
                          : "Specimen demonstrates slight deviation from standard ranges. Consider specialized nutrition plans or repeated diagnostic collection in 30 days.")}
                    </p>
                  </div>
                </div>

                {/* Technical Meta Footer in Document */}
                <div className="mt-8 pt-4 border-t border-slate-200 dark:border-white/10 flex justify-between items-center text-[8px] font-mono text-slate-400">
                  <span>Certified by Abdelkader Atia / Lead Theriogenologist</span>
                  <span className="text-emerald-500 font-bold">ATSA CRYPTO VALIDATED</span>
                </div>
              </div>

              {/* Right Column: Actions Pane */}
              <div className="w-full md:w-80 p-6 md:p-8 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-md font-bold tracking-tight font-sans">Report Preview</h4>
                      <p className="text-xs text-slate-400 dark:text-white/40 mt-1 font-mono">DOC ID: {previewAnalysis.id?.substring(0, 8) || 'DRAFT'}</p>
                    </div>
                    <button
                      onClick={() => setPreviewAnalysis(null)}
                      className="p-1.5 rounded-lg border border-transparent hover:border-slate-200 dark:hover:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer text-slate-400 hover:text-slate-800 dark:hover:text-white inline-flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-white/50 leading-relaxed font-sans">
                    This in-browser document is a certified digital preview. You can finalize clinical signoff and compile a production-ready **A4 format PDF report** for instant offline export.
                  </p>

                  <div className="pt-2">
                    <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100 dark:border-white/5">
                      <span className="text-slate-400">File Type</span>
                      <span className="font-mono font-bold text-emerald-500">A4 PDF Report</span>
                    </div>
                    <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100 dark:border-white/5">
                      <span className="text-slate-400 font-sans">Standard</span>
                      <span className="font-sans font-medium">WHO 2010 v1.2</span>
                    </div>
                    <div className="flex items-center justify-between text-xs py-2">
                      <span className="text-slate-400">Status</span>
                      <span className="font-sans px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-emerald-500 bg-emerald-500/10 border border-emerald-500/20">
                        {previewAnalysis.interpretation?.status || 'Completed'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-4">
                  <button
                    onClick={() => handleSingleExport(previewAnalysis)}
                    className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/15 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    {t('tabReport')} (PDF)
                  </button>
                  <button
                    onClick={() => setPreviewAnalysis(null)}
                    className={cn(
                      "w-full py-3.5 px-4 text-xs font-black uppercase tracking-widest rounded-xl transition-colors cursor-pointer text-center",
                      theme === 'dark' ? "bg-white/5 hover:bg-white/10 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-800"
                    )}
                  >
                    {t('cancel')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Sample Confirmation Modal */}
      <AnimatePresence>
        {sampleToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              if (!isDeleting) setSampleToDelete(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "w-full max-w-md rounded-2xl p-6 shadow-2xl border space-y-5",
                theme === 'dark' ? "bg-[#111114] border-white/10 text-white" : "bg-white border-slate-200 text-slate-800"
              )}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 text-red-500">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold tracking-tight">{t('confirmDeleteSampleTitle')}</h3>
                  <p className={cn("text-xs leading-relaxed", theme === 'dark' ? "text-white/60" : "text-slate-500")}>
                    {t('confirmDeleteSampleDesc')}
                  </p>
                </div>
              </div>

              <div className={cn("p-3.5 rounded-xl border space-y-2 text-xs", theme === 'dark' ? "bg-white/[0.02] border-white/5" : "bg-slate-50 border-slate-100")}>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Sample ID</span>
                  <span className="font-mono font-bold">{sampleToDelete.patientId || sampleToDelete.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Species</span>
                  <span className="font-semibold text-emerald-500">{sampleToDelete.species}</span>
                </div>
                {sampleToDelete.timestamp && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Recorded Date</span>
                    <span className="font-mono text-[11px] opacity-70">
                      {new Date(sampleToDelete.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setSampleToDelete(null)}
                  className={cn(
                    "px-4 py-2.5 text-xs font-bold rounded-xl transition-colors cursor-pointer",
                    theme === 'dark' ? "bg-white/5 hover:bg-white/10 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  )}
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => handleDeleteSample(sampleToDelete)}
                  className="px-5 py-2.5 text-xs font-bold bg-red-500 hover:bg-red-600 active:scale-[0.99] text-white rounded-xl transition-all shadow-lg shadow-red-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{t('deleteSample')}</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Feedback Toast */}
      <AnimatePresence>
        {actionToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border bg-[#111114]/95 border-white/10 text-white backdrop-blur-md shadow-black/80"
          >
            <div className={cn(
              "w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold",
              actionToast.type === 'success' ? "bg-emerald-500/20 text-emerald-400" : actionToast.type === 'info' ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"
            )}>
              {actionToast.type === 'success' ? <Check className="w-4 h-4" /> : actionToast.type === 'info' ? <Flag className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            </div>
            <p className="text-xs font-medium leading-tight flex-1">{actionToast.message}</p>
            <button 
              onClick={() => setActionToast(null)} 
              className="text-white/40 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
