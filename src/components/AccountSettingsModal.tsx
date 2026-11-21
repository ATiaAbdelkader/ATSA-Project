import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  Settings, 
  Building2, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Sparkles, 
  X, 
  Check, 
  Camera, 
  LogOut, 
  Copy, 
  Sliders, 
  SlidersHorizontal,
  Microscope,
  FileText,
  Volume2,
  VolumeX,
  Eye,
  CheckCircle2,
  Layers,
  HelpCircle,
  ExternalLink,
  Save,
  Laptop
} from 'lucide-react';
import { cn } from '../utils';
import { useLanguage } from '../context/LanguageContext';
import type { User as FirebaseUser } from 'firebase/auth';

export interface UserProfileData {
  displayName: string;
  email: string;
  role: string;
  sector: string;
  institution: string;
  specialization: string;
  phone: string;
  photoURL: string;
  defaultSpecies: string;
  unitScale: 'µm' | 'mm';
  autoSaveReports: boolean;
  highContrastMode: boolean;
  soundAlerts: boolean;
  themePreference: 'light' | 'dark';
}

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: FirebaseUser | null;
  profileData: UserProfileData;
  onSaveProfile: (updated: UserProfileData) => Promise<void>;
  onLogout: () => void;
  theme: 'light' | 'dark';
}

const PRESET_AVATARS = [
  {
    id: 'scientist-1',
    label: 'Lab Specialist (Teal)',
    url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=256&q=80',
  },
  {
    id: 'scientist-2',
    label: 'Theriogenologist (Blue)',
    url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=256&q=80',
  },
  {
    id: 'scientist-3',
    label: 'Senior Embryologist (Emerald)',
    url: 'https://images.unsplash.com/photo-1594824813588-e2bd62d55989?auto=format&fit=crop&w=256&q=80',
  },
  {
    id: 'scientist-4',
    label: 'Andrology Researcher (Slate)',
    url: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=256&q=80',
  },
  {
    id: 'scientist-5',
    label: 'Lab Director (Dark)',
    url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=256&q=80',
  }
];

const PRESET_ROLES = [
  'Senior Embryologist',
  'Lead Theriogenologist',
  'Laboratory Director',
  'Veterinary Andrologist',
  'CASA Systems Specialist',
  'Quality Assurance Manager',
  'Reproduction Research Fellow'
];

export const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  profileData,
  onSaveProfile,
  onLogout,
  theme
}) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'profile' | 'workstation' | 'security'>('profile');
  const [formData, setFormData] = useState<UserProfileData>(profileData);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedUid, setCopiedUid] = useState(false);
  const [showCustomAvatarInput, setShowCustomAvatarInput] = useState(false);

  // Sync form data when profileData or modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(profileData);
      setShowCustomAvatarInput(false);
    }
  }, [isOpen, profileData]);

  if (!isOpen) return null;

  const isGuest = user?.uid === 'jury_guest_pass';

  const handleCopyUid = () => {
    const idToCopy = user?.uid || 'guest-session';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(idToCopy);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveProfile(formData);
      onClose();
    } catch (error) {
      console.error('Failed to update profile settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md overflow-y-auto">
        {/* Backdrop dismiss */}
        <div className="fixed inset-0 -z-10" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "w-full max-w-3xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]",
            theme === 'dark' 
              ? "bg-[#0d0d10] border-white/10 text-white" 
              : "bg-white border-slate-200 text-slate-900 shadow-slate-300/40"
          )}
        >
          {/* Header Banner */}
          <div className={cn(
            "p-6 sm:p-7 border-b relative overflow-hidden",
            theme === 'dark' 
              ? "bg-gradient-to-r from-emerald-950/40 via-[#121217] to-teal-950/30 border-white/10" 
              : "bg-gradient-to-r from-emerald-50 via-slate-50 to-teal-50/50 border-slate-200"
          )}>
            <div className="flex items-start justify-between gap-4 relative z-10">
              <div className="flex items-center gap-4 sm:gap-5">
                {/* User Avatar with Edit Overlay */}
                <div className="relative group shrink-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    {formData.photoURL ? (
                      <img 
                        src={formData.photoURL} 
                        alt={formData.displayName} 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-xl sm:text-2xl font-black text-white">
                        {formData.displayName?.charAt(0) || 'U'}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCustomAvatarInput(prev => !prev)}
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg transition-transform hover:scale-110 cursor-pointer"
                    title={t('avatarUrl')}
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                      {formData.displayName || user?.displayName || 'Laboratory Specialist'}
                    </h2>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border",
                      isGuest 
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/30" 
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    )}>
                      {isGuest ? 'Jury Guest Pass' : 'Google Verified'}
                    </span>
                  </div>
                  <p className={cn("text-xs sm:text-sm font-medium", theme === 'dark' ? "text-emerald-400" : "text-emerald-600")}>
                    {formData.role || 'Theriogenology & CASA Specialist'} • <span className={theme === 'dark' ? "text-white/60" : "text-slate-500"}>{formData.sector || 'Lab Sector A-4'}</span>
                  </p>
                  <p className={cn("text-xs", theme === 'dark' ? "text-white/40" : "text-slate-400")}>
                    {formData.institution || 'ATSA Reproductive Science Center'}
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "p-2 rounded-xl transition-colors cursor-pointer",
                  theme === 'dark' ? "bg-white/5 hover:bg-white/10 text-white/60 hover:text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900"
                )}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick UID & System Pill */}
            <div className="mt-4 pt-4 border-t border-black/5 dark:border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className={cn("text-[10px] uppercase font-bold tracking-wider", theme === 'dark' ? "text-white/30" : "text-slate-400")}>
                  System UID:
                </span>
                <code className={cn(
                  "px-2 py-0.5 rounded font-mono text-[11px] font-semibold",
                  theme === 'dark' ? "bg-white/5 text-emerald-400" : "bg-slate-200/60 text-emerald-700"
                )}>
                  {user?.uid ? `${user.uid.slice(0, 14)}...` : 'guest_session'}
                </code>
                <button
                  type="button"
                  onClick={handleCopyUid}
                  className="p-1 rounded hover:bg-emerald-500/20 text-emerald-400 transition-colors cursor-pointer"
                  title="Copy UID"
                >
                  {copiedUid ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className={cn("text-[11px] font-medium", theme === 'dark' ? "text-white/60" : "text-slate-500")}>
                  {t('activeSession')}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className={cn(
            "flex items-center gap-2 px-6 pt-3 border-b overflow-x-auto",
            theme === 'dark' ? "border-white/10 bg-[#0a0a0d]" : "border-slate-200 bg-slate-50/70"
          )}>
            {[
              { id: 'profile', icon: User, label: t('profileDetails') },
              { id: 'workstation', icon: SlidersHorizontal, label: t('workstationPrefs') },
              { id: 'security', icon: ShieldCheck, label: t('securitySession') }
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap",
                    isActive
                      ? "border-emerald-500 text-emerald-500 bg-emerald-500/5"
                      : theme === 'dark'
                        ? "border-transparent text-white/50 hover:text-white hover:bg-white/5"
                        : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Tab 1: Profile Details */}
            {activeTab === 'profile' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Avatar Picker Section */}
                <div className={cn(
                  "p-4 rounded-2xl border space-y-3",
                  theme === 'dark' ? "bg-white/[0.02] border-white/10" : "bg-slate-50 border-slate-200"
                )}>
                  <div className="flex items-center justify-between">
                    <label className={cn("text-xs font-bold uppercase tracking-wider", theme === 'dark' ? "text-white/70" : "text-slate-700")}>
                      {t('presetAvatars')}
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCustomAvatarInput(prev => !prev)}
                      className="text-xs text-emerald-500 hover:underline font-semibold cursor-pointer"
                    >
                      {showCustomAvatarInput ? 'Hide URL input' : 'Enter Custom Image URL'}
                    </button>
                  </div>

                  {/* Preset Avatar Gallery */}
                  <div className="grid grid-cols-5 gap-3">
                    {PRESET_AVATARS.map(avatar => {
                      const isSelected = formData.photoURL === avatar.url;
                      return (
                        <button
                          key={avatar.id}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, photoURL: avatar.url }))}
                          className={cn(
                            "relative rounded-xl overflow-hidden aspect-square border-2 transition-all cursor-pointer group",
                            isSelected
                              ? "border-emerald-500 ring-2 ring-emerald-500/30 scale-105"
                              : "border-transparent hover:border-slate-400 opacity-80 hover:opacity-100"
                          )}
                          title={avatar.label}
                        >
                          <img src={avatar.url} alt={avatar.label} className="w-full h-full object-cover" />
                          {isSelected && (
                            <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 drop-shadow" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom URL Input */}
                  {showCustomAvatarInput && (
                    <div className="pt-2">
                      <input
                        type="url"
                        placeholder="https://example.com/my-avatar.jpg"
                        value={formData.photoURL}
                        onChange={(e) => setFormData(prev => ({ ...prev, photoURL: e.target.value }))}
                        className={cn(
                          "w-full px-4 py-2.5 rounded-xl text-xs border focus:outline-none focus:ring-2 focus:ring-emerald-500/50",
                          theme === 'dark' ? "bg-black/30 border-white/10 text-white" : "bg-white border-slate-300 text-slate-900"
                        )}
                      />
                    </div>
                  )}
                </div>

                {/* Grid of Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Display Name */}
                  <div className="space-y-1.5">
                    <label className={cn("text-xs font-bold uppercase tracking-wider flex items-center gap-1.5", theme === 'dark' ? "text-white/70" : "text-slate-700")}>
                      <User className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{t('displayName')}</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.displayName}
                      onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                      className={cn(
                        "w-full px-4 py-2.5 rounded-xl text-sm border font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50",
                        theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                      )}
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className={cn("text-xs font-bold uppercase tracking-wider flex items-center gap-1.5", theme === 'dark' ? "text-white/70" : "text-slate-700")}>
                      <Mail className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{t('emailAddress')}</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      readOnly={!isGuest}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className={cn(
                        "w-full px-4 py-2.5 rounded-xl text-sm border font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50",
                        !isGuest ? "opacity-70 cursor-not-allowed" : "",
                        theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                      )}
                    />
                    {!isGuest && (
                      <span className="text-[10px] text-slate-400">Linked to Google Authentication profile</span>
                    )}
                  </div>

                  {/* Clinical Role / Title */}
                  <div className="space-y-1.5">
                    <label className={cn("text-xs font-bold uppercase tracking-wider flex items-center gap-1.5", theme === 'dark' ? "text-white/70" : "text-slate-700")}>
                      <Microscope className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{t('clinicalRole')}</span>
                    </label>
                    <input
                      type="text"
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                      className={cn(
                        "w-full px-4 py-2.5 rounded-xl text-sm border font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50",
                        theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                      )}
                    />
                    {/* Quick Role Suggestions */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {PRESET_ROLES.slice(0, 3).map(role => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, role }))}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold cursor-pointer transition-colors"
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lab Sector / Workstation ID */}
                  <div className="space-y-1.5">
                    <label className={cn("text-xs font-bold uppercase tracking-wider flex items-center gap-1.5", theme === 'dark' ? "text-white/70" : "text-slate-700")}>
                      <Layers className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{t('labSector')}</span>
                    </label>
                    <input
                      type="text"
                      value={formData.sector}
                      onChange={(e) => setFormData(prev => ({ ...prev, sector: e.target.value }))}
                      placeholder="e.g. Lab Sector A-4"
                      className={cn(
                        "w-full px-4 py-2.5 rounded-xl text-sm border font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50",
                        theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                      )}
                    />
                  </div>

                  {/* Institution / Facility */}
                  <div className="space-y-1.5">
                    <label className={cn("text-xs font-bold uppercase tracking-wider flex items-center gap-1.5", theme === 'dark' ? "text-white/70" : "text-slate-700")}>
                      <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{t('institution')}</span>
                    </label>
                    <input
                      type="text"
                      value={formData.institution}
                      onChange={(e) => setFormData(prev => ({ ...prev, institution: e.target.value }))}
                      className={cn(
                        "w-full px-4 py-2.5 rounded-xl text-sm border font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50",
                        theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                      )}
                    />
                  </div>

                  {/* Contact Phone / Extension */}
                  <div className="space-y-1.5">
                    <label className={cn("text-xs font-bold uppercase tracking-wider flex items-center gap-1.5", theme === 'dark' ? "text-white/70" : "text-slate-700")}>
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{t('contactPhone')}</span>
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="e.g. +1 (555) 019-2834 ext. 42"
                      className={cn(
                        "w-full px-4 py-2.5 rounded-xl text-sm border font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50",
                        theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                      )}
                    />
                  </div>
                </div>

                {/* Specialization */}
                <div className="space-y-1.5">
                  <label className={cn("text-xs font-bold uppercase tracking-wider flex items-center gap-1.5", theme === 'dark' ? "text-white/70" : "text-slate-700")}>
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{t('specialization')}</span>
                  </label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                    placeholder="e.g. Equine & Bovine In-Vitro Fertilization, Cryopreservation Kinematics"
                    className={cn(
                      "w-full px-4 py-2.5 rounded-xl text-sm border font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50",
                      theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-slate-50 border-slate-300 text-slate-900"
                    )}
                  />
                </div>
              </motion.div>
            )}

            {/* Tab 2: Workstation Adjustments & CASA Engine Preferences */}
            {activeTab === 'workstation' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Default Species Selection */}
                <div className="space-y-2">
                  <label className={cn("text-xs font-bold uppercase tracking-wider", theme === 'dark' ? "text-white/70" : "text-slate-700")}>
                    {t('defaultSpecies')}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {['Bovine', 'Equine', 'Porcine', 'Ovine'].map(species => {
                      const isSelected = formData.defaultSpecies === species;
                      return (
                        <button
                          key={species}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, defaultSpecies: species }))}
                          className={cn(
                            "p-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer flex items-center justify-between",
                            isSelected
                              ? "bg-emerald-500/15 border-emerald-500 text-emerald-400"
                              : theme === 'dark'
                                ? "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                                : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                          )}
                        >
                          <span>{species}</span>
                          {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Velocity Measurement Scale */}
                <div className="space-y-2">
                  <label className={cn("text-xs font-bold uppercase tracking-wider", theme === 'dark' ? "text-white/70" : "text-slate-700")}>
                    {t('unitScale')}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, unitScale: 'µm' }))}
                      className={cn(
                        "p-4 rounded-xl border text-left transition-all cursor-pointer",
                        formData.unitScale === 'µm'
                          ? "bg-emerald-500/15 border-emerald-500 text-emerald-400"
                          : theme === 'dark' ? "bg-white/5 border-white/10 text-white/70" : "bg-slate-50 border-slate-200 text-slate-700"
                      )}
                    >
                      <div className="font-bold text-sm">Micrometers (µm / sec)</div>
                      <div className="text-[11px] opacity-70 mt-0.5">WHO Standard for CASA sperm kinematics (VCL, VSL, VAP)</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, unitScale: 'mm' }))}
                      className={cn(
                        "p-4 rounded-xl border text-left transition-all cursor-pointer",
                        formData.unitScale === 'mm'
                          ? "bg-emerald-500/15 border-emerald-500 text-emerald-400"
                          : theme === 'dark' ? "bg-white/5 border-white/10 text-white/70" : "bg-slate-50 border-slate-200 text-slate-700"
                      )}
                    >
                      <div className="font-bold text-sm">Millimeters (mm / sec)</div>
                      <div className="text-[11px] opacity-70 mt-0.5">Macro-scale tracking for extended motility chambers</div>
                    </button>
                  </div>
                </div>

                {/* Toggle Switches */}
                <div className="space-y-3 pt-2">
                  {/* Auto-Export Reports */}
                  <div className={cn(
                    "p-4 rounded-2xl border flex items-center justify-between gap-4",
                    theme === 'dark' ? "bg-white/[0.02] border-white/10" : "bg-slate-50 border-slate-200"
                  )}>
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold">{t('autoSaveReports')}</div>
                        <div className={cn("text-xs", theme === 'dark' ? "text-white/40" : "text-slate-500")}>
                          Automatically trigger PDF compilation upon completing 3 FOV samples
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, autoSaveReports: !prev.autoSaveReports }))}
                      className={cn(
                        "w-12 h-6 rounded-full transition-colors relative cursor-pointer",
                        formData.autoSaveReports ? "bg-emerald-500" : (theme === 'dark' ? "bg-white/20" : "bg-slate-300")
                      )}
                    >
                      <span className={cn(
                        "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-md",
                        formData.autoSaveReports ? "left-6" : "left-0.5"
                      )} />
                    </button>
                  </div>

                  {/* High-Contrast Mode */}
                  <div className={cn(
                    "p-4 rounded-2xl border flex items-center justify-between gap-4",
                    theme === 'dark' ? "bg-white/[0.02] border-white/10" : "bg-slate-50 border-slate-200"
                  )}>
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400">
                        <Eye className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold">{t('highContrastMode')}</div>
                        <div className={cn("text-xs", theme === 'dark' ? "text-white/40" : "text-slate-500")}>
                          Enhance fluorophore and phase-contrast edges in low-light laboratory suites
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, highContrastMode: !prev.highContrastMode }))}
                      className={cn(
                        "w-12 h-6 rounded-full transition-colors relative cursor-pointer",
                        formData.highContrastMode ? "bg-emerald-500" : (theme === 'dark' ? "bg-white/20" : "bg-slate-300")
                      )}
                    >
                      <span className={cn(
                        "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-md",
                        formData.highContrastMode ? "left-6" : "left-0.5"
                      )} />
                    </button>
                  </div>

                  {/* Sound Alerts */}
                  <div className={cn(
                    "p-4 rounded-2xl border flex items-center justify-between gap-4",
                    theme === 'dark' ? "bg-white/[0.02] border-white/10" : "bg-slate-50 border-slate-200"
                  )}>
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400">
                        {formData.soundAlerts ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="text-sm font-bold">{t('soundAlerts')}</div>
                        <div className={cn("text-xs", theme === 'dark' ? "text-white/40" : "text-slate-500")}>
                          Audible chime when high-speed motility video rendering finishes
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, soundAlerts: !prev.soundAlerts }))}
                      className={cn(
                        "w-12 h-6 rounded-full transition-colors relative cursor-pointer",
                        formData.soundAlerts ? "bg-emerald-500" : (theme === 'dark' ? "bg-white/20" : "bg-slate-300")
                      )}
                    >
                      <span className={cn(
                        "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-md",
                        formData.soundAlerts ? "left-6" : "left-0.5"
                      )} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Tab 3: Security & Session */}
            {activeTab === 'security' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Auth Details Card */}
                <div className={cn(
                  "p-5 rounded-2xl border space-y-4",
                  theme === 'dark' ? "bg-white/[0.02] border-white/10" : "bg-slate-50 border-slate-200"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold">{t('authMethod')}</h4>
                        <p className={cn("text-xs", theme === 'dark' ? "text-white/40" : "text-slate-500")}>
                          {isGuest ? 'Bypass Reviewer Credential' : 'Firebase Google Authentication (OAuth 2.0)'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                      Connected
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                    <div className={cn("p-3 rounded-xl", theme === 'dark' ? "bg-black/20" : "bg-white border border-slate-200")}>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Database Sync</span>
                      <span className="font-semibold text-emerald-400">Cloud Firestore (Active)</span>
                    </div>
                    <div className={cn("p-3 rounded-xl", theme === 'dark' ? "bg-black/20" : "bg-white border border-slate-200")}>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Local Storage Cache</span>
                      <span className="font-semibold text-emerald-400">Offline Fallback Enabled</span>
                    </div>
                  </div>
                </div>

                {/* Sign Out Card */}
                <div className={cn(
                  "p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4",
                  theme === 'dark' ? "bg-red-500/5 border-red-500/20" : "bg-red-50 border-red-200"
                )}>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-red-400">Sign Out of Workstation</h4>
                    <p className={cn("text-xs", theme === 'dark' ? "text-white/40" : "text-slate-500")}>
                      Closes the active CASA session and clears authentication tokens from this browser.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onLogout();
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all shadow-md cursor-pointer shrink-0"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('logout')}</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Footer Buttons */}
            <div className={cn(
              "pt-4 border-t flex items-center justify-between gap-3",
              theme === 'dark' ? "border-white/10" : "border-slate-200"
            )}>
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer",
                  theme === 'dark' ? "bg-white/5 hover:bg-white/10 text-white/70" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                )}
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t('saving')}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>{t('saveChanges')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
