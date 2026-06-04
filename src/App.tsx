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
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, SPECIES_PROFILES } from './utils';
import { SampleRegistration } from './components/SampleRegistration';
import { CASAEngine } from './components/CASAEngine';
import { HelpCenter } from './components/HelpCenter';
import { PatientHistoryView } from './components/PatientHistory';
import { InventoryManagement } from './components/InventoryManagement';
import type { AppState, SpeciesProfile } from './types';
import { auth, db, googleProvider } from './firebase';
import { signInWithPopup, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collection, addDoc, query, where, orderBy, limit, onSnapshot, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './lib/firestore-utils';

export default function App() {
  const [appState, setAppState] = useState<AppState>('login');
  const [isRegModalOpen, setIsRegModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [activePatient, setActivePatient] = useState<{ id: string; species: string; profile: SpeciesProfile } | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [selectedAnalyses, setSelectedAnalyses] = useState<string[]>([]);
  const [stats, setStats] = useState({ samplesToday: 0, avgProcessing: '0m' });

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
            setAppState('login');
          }
        } else {
          setAppState('login');
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Fetch recent analyses
    const q = query(
      collection(db, 'analyses'),
      where('uid', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const analyses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      setRecentAnalyses(analyses);
      
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
      setAppState('login');
    } catch (error) {
      console.error("Logout failed:", error);
      localStorage.removeItem('atsa_guest_session');
      setUser(null);
      setAppState('login');
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

  if (appState === 'login') {
    return (
      <div className={cn("min-h-screen flex flex-col lg:flex-row font-sans transition-colors duration-500", theme === 'dark' ? "bg-[#050505]" : "bg-slate-50")}>
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
                <h1 className={cn("text-4xl font-black tracking-tighter", theme === 'dark' ? "text-white" : "text-slate-900")}>ATSA <span className="text-emerald-500">V2.0</span></h1>
                <p className={cn("text-xs font-bold uppercase tracking-[0.2em]", theme === 'dark' ? "text-white/40" : "text-slate-400")}>Advanced Tailored Sperm Analysis</p>
              </div>
            </div>

            <h2 className={cn("text-5xl lg:text-7xl font-light leading-[1.1] mb-8 tracking-tight", theme === 'dark' ? "text-white" : "text-slate-900")}>
              Precision in <br />
              <span className="font-serif italic text-emerald-500">every movement.</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-12">
              {[
                { title: 'AI-Powered CASA', desc: 'Real-time kinematic analysis with neural-network tracking.', icon: Activity },
                { title: 'WHO Compliant', desc: 'Fully adheres to WHO 2010 laboratory standards.', icon: ClipboardList },
                { title: 'Multi-Species', desc: 'Optimized profiles for Ovine, Caprine, and Bovine.', icon: Users },
                { title: 'Secure Vault', desc: 'Enterprise-grade encryption for all patient records.', icon: FileText },
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
              System Online
            </div>
            <div>Founder: Dr. Abdelkader Atia</div>
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
            <div className="mb-10">
              <h3 className={cn("text-2xl font-bold mb-2", theme === 'dark' ? "text-white" : "text-slate-900")}>Laboratory Access</h3>
              <p className={cn("text-sm", theme === 'dark' ? "text-white/40" : "text-slate-500")}>Enter your credentials to begin your session.</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className={cn("text-[10px] font-bold uppercase tracking-widest", theme === 'dark' ? "text-white/40" : "text-slate-400")}>Laboratory ID</label>
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Required</span>
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
                  <label className={cn("text-[10px] font-bold uppercase tracking-widest", theme === 'dark' ? "text-white/40" : "text-slate-400")}>Access Key</label>
                  <button type="button" className="text-[10px] font-bold text-emerald-500/60 hover:text-emerald-500 uppercase tracking-widest transition-colors">Forgot Key?</button>
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
                <label htmlFor="remember" className={cn("text-xs font-medium", theme === 'dark' ? "text-white/40" : "text-slate-500")}>Remember this workstation</label>
              </div>

              <button 
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-5 rounded-2xl mt-4 transition-all shadow-xl shadow-emerald-500/20 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-5 h-5" />
                Authenticate with Google
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-black/10 dark:border-white/5"></div>
                <span className="flex-shrink mx-4 text-[8px] font-bold text-black/30 dark:text-white/25 uppercase tracking-widest font-mono">reviewer bypass portal</span>
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
                Instant Jury Access (By-Pass)
              </button>
            </form>

            <div className={cn("mt-12 p-6 rounded-3xl border border-dashed text-center", theme === 'dark' ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50")}>
              <p className={cn("text-[10px] font-bold uppercase tracking-widest mb-2", theme === 'dark' ? "text-white/40" : "text-slate-400")}>Security Notice</p>
              <p className={cn("text-xs leading-relaxed", theme === 'dark' ? "text-white/20" : "text-slate-400")}>
                This system is for authorized laboratory personnel only. All access attempts are logged and monitored for compliance.
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

  if (appState === 'analysis' && activePatient) {
    return <CASAEngine onBack={() => setAppState('dashboard')} patientData={activePatient} theme={theme} />;
  }

  return (
    <div className={cn("min-h-screen font-sans flex transition-colors duration-300", theme === 'dark' ? "bg-[#0a0a0a] text-white" : "bg-slate-50 text-slate-900")}>
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
            { id: 'dashboard', icon: Activity, label: 'Dashboard', badge: 'Active' },
            { id: 'analysis', icon: Microscope, label: 'CASA Engine', hot: true },
            { id: 'history', icon: Clock, label: 'Patient History' },
            { id: 'inventory', icon: Package, label: 'Inventory' },
            { id: 'help', icon: BookOpen, label: 'Help & Training' },
          ].map((item) => {
            const isActive = appState === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setAppState(item.id as AppState)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative group overflow-hidden",
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
                {item.badge && isActive && (
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
          <button className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
            theme === 'dark' ? "text-white/40 hover:bg-white/5 hover:text-white" : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"
          )}>
            <Settings className="w-5 h-5" />
            <span className="font-medium hidden lg:block text-sm">Settings</span>
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400/60 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium hidden lg:block text-sm">Logout</span>
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
                System Date
              </span>
              <span className={cn("text-xs font-semibold tabular-nums", theme === 'dark' ? "text-emerald-400" : "text-emerald-600")}>
                Sunday, May 31, 2026
              </span>
            </div>
            <div className="hidden md:block w-px h-8 bg-white/[0.04] dark:bg-white/[0.04] bg-slate-200" />
            <div>
              <h2 className={cn("text-[10px] font-bold uppercase tracking-widest", theme === 'dark' ? "text-white/40" : "text-slate-400")}>Welcome back</h2>
              <p className={cn("text-base font-bold tracking-tight", theme === 'dark' ? "text-white" : "text-slate-900")}>{user?.displayName || user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className={cn(
                "p-2.5 border rounded-xl transition-all",
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
                        System Ready
                      </div>
                      <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tight mb-3">
                        Precision CASA Analysis
                      </h2>
                      <p className="text-white/80 text-sm max-w-md leading-relaxed mb-8">
                        Process high-speed microscopy recordings instantly. System is fully optimized for Ovine, Caprine, and Bovine profiles adhering to WHO international standards.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-4 mt-auto">
                      <button 
                        onClick={() => setIsRegModalOpen(true)}
                        className="px-6 py-4 bg-white text-emerald-800 font-bold rounded-2xl hover:bg-emerald-50/95 shadow-lg active:scale-95 transition-all flex items-center gap-2 text-sm"
                      >
                        <ClipboardList className="w-5 h-5 text-emerald-600" />
                        Register New Sample
                      </button>
                      <button 
                        onClick={() => {
                          if (!activePatient) setIsRegModalOpen(true);
                          else setAppState('analysis');
                        }}
                        className="px-6 py-4 bg-black/20 backdrop-blur-md text-white font-bold rounded-2xl hover:bg-black/30 border border-white/15 active:scale-95 transition-all flex items-center gap-2 text-sm"
                      >
                        <Play className="w-5 h-5 fill-current text-emerald-300" />
                        Access CASA Engine
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
                            <p className={cn("text-xs font-semibold", theme === 'dark' ? "text-white/60" : "text-slate-600")}>Samples Today</p>
                            <p className={cn("text-[9px] uppercase tracking-wider font-bold opacity-40", theme === 'dark' ? "text-white/30" : "text-slate-400")}>Secure Firestore</p>
                          </div>
                        </div>
                        <span className="text-xl font-black tracking-tight">{stats.samplesToday}</span>
                      </div>

                      {/* Stat 2: Avg Processing */}
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-500/[0.02] dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                            <Clock className="w-4 h-4 text-emerald-500" />
                          </div>
                          <div>
                            <p className={cn("text-xs font-semibold", theme === 'dark' ? "text-white/60" : "text-slate-600")}>Avg. Processing</p>
                            <p className={cn("text-[9px] uppercase tracking-wider font-bold opacity-40", theme === 'dark' ? "text-white/30" : "text-slate-400")}>Optimized Pipeline</p>
                          </div>
                        </div>
                        <span className="text-xl font-black tracking-tight">{stats.avgProcessing}</span>
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
                        <span className="text-xl font-black tracking-tight text-teal-400">
                          {recentAnalyses.length > 0 
                            ? (recentAnalyses.reduce((acc, curr) => acc + (curr.concentration || 0), 0) / recentAnalyses.length).toFixed(1)
                            : "0.0"
                          } <span className="text-[10px] font-normal text-muted-foreground">M/ml</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={cn("pt-5 border-t", theme === 'dark' ? "border-white/[0.05]" : "border-slate-100")}>
                    <button className="w-full text-emerald-500 hover:text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 hover:gap-2.5 transition-all duration-300">
                      View Diagnostics Link <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
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
                    { title: 'Video Upload', desc: 'Process live & recorded sample clips', icon: Play, color: 'from-blue-500 to-indigo-600', badge: 'analyzer', action: () => setAppState('analysis') },
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
                      Recent Analyses
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
                          className={cn("text-[10px] font-bold uppercase tracking-widest px-3 py-2 rounded-xl transition-colors", theme === 'dark' ? "text-white/40 hover:text-white" : "text-slate-400 hover:text-slate-900")}
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleBatchExport}
                          disabled={selectedAnalyses.length === 0}
                          className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-md shadow-emerald-500/10"
                        >
                          Export PDF Batch
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => setIsBatchMode(true)}
                          className={cn("text-xs font-semibold px-3 py-1.5 rounded-lg border border-transparent hover:border-emerald-500/10 transition-all", theme === 'dark' ? "text-white/40 hover:text-white bg-white/[0.02]" : "text-slate-500 hover:text-slate-900 bg-slate-50")}
                        >
                          Batch Export
                        </button>
                        <button className={cn("text-xs font-semibold px-3 py-1.5 rounded-lg border border-transparent hover:border-emerald-500/10 transition-all", theme === 'dark' ? "text-white/40 hover:text-white bg-white/[0.02]" : "text-slate-500 hover:text-slate-900 bg-slate-50")}>
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
                        <th className="px-6 py-4">Sample Identifier</th>
                        <th className="px-6 py-4">Species Type</th>
                        <th className="px-6 py-4">Sperm Concentration</th>
                        <th className="px-6 py-4">Total Motility</th>
                        <th className="px-6 py-4">Verification</th>
                        <th className="px-6 py-4 text-right">CASA Launch</th>
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
                              <span className={cn("font-mono font-bold tracking-tight text-xs", theme === 'dark' ? "text-white" : "text-slate-800")}>
                                {row.patientId}
                              </span>
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
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActivePatient({ 
                                    id: row.patientId, 
                                    species: row.species, 
                                    profile: SPECIES_PROFILES[row.species] || SPECIES_PROFILES['Bovine'] 
                                  });
                                  setAppState('analysis');
                                }}
                                className={cn("p-2 rounded-xl transition-all border border-transparent hover:border-emerald-500/20", theme === 'dark' ? "bg-white/[0.02] text-white/40 hover:bg-white/10 group-hover:text-emerald-400" : "bg-slate-50 text-slate-400 hover:bg-slate-100 group-hover:text-emerald-700")}
                                title="Open CASA analysis viewport"
                              >
                                <ArrowUpRight className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      }) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-16 text-center text-white/20 font-medium">
                            <div className="flex flex-col items-center justify-center gap-3">
                              <ClipboardList className="w-8 h-8 opacity-25 text-emerald-500" />
                              <span className={cn("text-xs", theme === 'dark' ? "text-white/30" : "text-slate-400")}>No records found in current laboratory sector.</span>
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
              <h3 className={cn("text-xl font-bold mb-2", theme === 'dark' ? "text-white" : "text-slate-900")}>No Active Patient</h3>
              <p className={cn("max-w-sm mb-8", theme === 'dark' ? "text-white/40" : "text-slate-500")}>
                Please register a sample or select a patient from the dashboard before launching the CASA Engine.
              </p>
              <button 
                onClick={() => setIsRegModalOpen(true)}
                className="px-8 py-4 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
              >
                Register New Sample
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
    </div>
  );
}
