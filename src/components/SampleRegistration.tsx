import React, { useState } from 'react';
import { 
  User, 
  Dna, 
  Calendar, 
  FileText, 
  X,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SAMPLE_SPECIES, SPECIES_PROFILES } from '../utils';
import { cn } from '../utils';
import { useLanguage } from '../context/LanguageContext';

interface SampleRegistrationProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (data: any) => void;
  theme?: 'light' | 'dark';
}

export const SampleRegistration: React.FC<SampleRegistrationProps> = ({ isOpen, onClose, onRegister, theme = 'dark' }) => {
  const { t, dir } = useLanguage();
  const [formData, setFormData] = useState({
    patientId: '',
    species: 'Bovine',
    collectionTime: (() => {
      const now = new Date();
      const offset = now.getTimezoneOffset() * 60000;
      return new Date(now.getTime() - offset).toISOString().slice(0, 16);
    })(),
    abstinenceDays: '3',
    preparationMethod: 'Neat',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onRegister({
      ...formData,
      profile: SPECIES_PROFILES[formData.species]
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir={dir}>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={cn(
              "relative w-full max-w-lg border rounded-3xl shadow-2xl overflow-hidden transition-colors",
              theme === 'dark' ? "bg-[#0f0f0f] border-white/10" : "bg-white border-black/10"
            )}
          >
            <div className={cn(
              "p-6 border-b flex items-center justify-between",
              theme === 'dark' ? "border-white/10 bg-gradient-to-r from-emerald-500/10 to-transparent" : "border-black/10 bg-gradient-to-r from-emerald-500/5 to-transparent"
            )}>
              <div>
                <h2 className={cn(
                  "text-xl font-semibold",
                  theme === 'dark' ? "text-white" : "text-slate-900"
                )}>{t('registerSampleTitle')}</h2>
                <p className={cn(
                  "text-xs mt-1",
                  theme === 'dark' ? "text-white/40" : "text-black/40"
                )}>{t('captureMetadata')}</p>
              </div>
              <button 
                onClick={onClose}
                className={cn(
                  "p-2 rounded-full transition-colors cursor-pointer",
                  theme === 'dark' ? "hover:bg-white/5 text-white/40 hover:text-white" : "hover:bg-black/5 text-black/40 hover:text-black"
                )}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className={cn(
                "rounded-2xl border p-3",
                theme === 'dark' ? "border-amber-400/30 bg-amber-400/10" : "border-amber-500/30 bg-amber-50"
              )} role="note">
                <p className={cn(
                  "text-[10px] font-black uppercase tracking-widest",
                  theme === 'dark' ? "text-amber-300" : "text-amber-800"
                )}>{t('researchPrototypeNoticeTitle')}</p>
                <p className={cn(
                  "mt-1 text-[11px] leading-relaxed",
                  theme === 'dark' ? "text-white/65" : "text-slate-700"
                )}>{t('researchPrototypeNoticeBody')}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={cn(
                    "text-[10px] font-bold uppercase tracking-widest flex items-center gap-2",
                    theme === 'dark' ? "text-white/40" : "text-black/40"
                  )}>
                    <User className="w-3 h-3" /> {t('patientIdLabel')}
                  </label>
                  <input 
                    required
                    type="text"
                    value={formData.patientId}
                    onChange={e => setFormData({...formData, patientId: e.target.value})}
                    placeholder="e.g. PAT-9928"
                    className={cn(
                       "w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all",
                      theme === 'dark' ? "bg-black/40 border-white/10 text-white placeholder:text-white/20" : "bg-slate-50 border-black/10 text-slate-900 placeholder:text-black/20"
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className={cn(
                    "text-[10px] font-bold uppercase tracking-widest flex items-center gap-2",
                    theme === 'dark' ? "text-white/40" : "text-black/40"
                  )}>
                    <Dna className="w-3 h-3" /> {t('species')}
                  </label>
                  <select 
                    value={formData.species}
                    onChange={e => setFormData({...formData, species: e.target.value})}
                    className={cn(
                      "w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none",
                      theme === 'dark' ? "bg-black/40 border-white/10 text-white" : "bg-slate-50 border-black/10 text-slate-900"
                    )}
                  >
                    {SAMPLE_SPECIES.map(s => <option key={s} value={s} className={theme === 'dark' ? "bg-[#0f0f0f]" : "bg-white"}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={cn(
                    "text-[10px] font-bold uppercase tracking-widest flex items-center gap-2",
                    theme === 'dark' ? "text-white/40" : "text-black/40"
                  )}>
                    <Calendar className="w-3 h-3" /> {t('collectionTime')}
                  </label>
                  <input 
                    required
                    type="datetime-local"
                    value={formData.collectionTime}
                    onChange={e => setFormData({...formData, collectionTime: e.target.value})}
                    className={cn(
                      "w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all",
                      theme === 'dark' ? "bg-black/40 border-white/10 text-white" : "bg-slate-50 border-black/10 text-slate-900"
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <label className={cn(
                    "text-[10px] font-bold uppercase tracking-widest flex items-center gap-2",
                    theme === 'dark' ? "text-white/40" : "text-black/40"
                  )}>
                    {t('abstinenceDays')}
                  </label>
                  <input 
                    type="number"
                    value={formData.abstinenceDays}
                    onChange={e => setFormData({...formData, abstinenceDays: e.target.value})}
                    className={cn(
                      "w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all",
                      theme === 'dark' ? "bg-black/40 border-white/10 text-white" : "bg-slate-50 border-black/10 text-slate-900"
                    )}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className={cn(
                  "text-[10px] font-bold uppercase tracking-widest flex items-center gap-2",
                  theme === 'dark' ? "text-white/40" : "text-black/40"
                )}>
                  <FileText className="w-3 h-3" /> {t('preparationNotesLabel')}
                </label>
                <textarea 
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  placeholder={t('preparationNotesPlaceholder')}
                  className={cn(
                    "w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all h-24 resize-none",
                    theme === 'dark' ? "bg-black/40 border-white/10 text-white placeholder:text-white/20" : "bg-slate-50 border-black/10 text-slate-900 placeholder:text-black/20"
                  )}
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 group cursor-pointer"
                >
                  {t('confirmRegistration')}
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </form>

            <div className={cn(
              "p-4 border-t flex items-center gap-3",
              theme === 'dark' ? "bg-black/20 border-white/5" : "bg-slate-50 border-black/5"
            )}>
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <p className={cn(
                "text-[10px] leading-tight",
                theme === 'dark' ? "text-white/40" : "text-black/40"
              )}>
                {t('dataPrivacyStandards')}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
