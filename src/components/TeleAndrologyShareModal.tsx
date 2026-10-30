import React, { useState } from 'react';
import { 
  Globe, 
  Share2, 
  Lock, 
  Clock, 
  Copy, 
  Check, 
  Eye, 
  Sparkles, 
  ShieldCheck, 
  QrCode, 
  Mail, 
  ExternalLink,
  X,
  FileText,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';
import type { AnalysisResult } from '../types';

interface TeleAndrologyShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: AnalysisResult | null;
  theme?: 'light' | 'dark';
}

export const TeleAndrologyShareModal: React.FC<TeleAndrologyShareModalProps> = ({
  isOpen,
  onClose,
  analysis,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';
  const [accessScope, setAccessScope] = useState<'dossier' | 'interactive' | 'full_audit'>('interactive');
  const [expiryDays, setExpiryDays] = useState<'1' | '7' | '30' | 'never'>('7');
  const [requirePin, setRequirePin] = useState(false);
  const [pinCode, setPinCode] = useState('4892');
  const [includeFlagellar, setIncludeFlagellar] = useState(true);
  const [includeMorphometry, setIncludeMorphometry] = useState(true);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('Dr. Marcus Vance, Theriogenologist');
  const [isCopied, setIsCopied] = useState(false);
  const [showSpecialistPreview, setShowSpecialistPreview] = useState(false);

  if (!isOpen) return null;

  const patientId = analysis?.patientId || 'BOV-9872';
  const species = analysis?.species || 'Bovine';
  const generatedToken = `atsa_${patientId.toLowerCase()}_${Date.now().toString(36)}`;
  const shareUrl = `${window.location.origin}/?consultToken=${generatedToken}&scope=${accessScope}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent(`[ATSA Consultation Request] Semen Evaluation Dossier: ${patientId} (${species})`);
    const body = encodeURIComponent(
      `Dear ${recipientName},\n\nYou have been requested to provide a clinical tele-andrology second opinion consultation on specimen ${patientId} (${species}).\n\nAccess the certified digital evaluation dossier here:\n${shareUrl}\n\nAccess Expiry: ${expiryDays === 'never' ? 'Indefinite' : `${expiryDays} Days`}\n${requirePin ? `Access PIN: ${pinCode}\n` : ''}\nThank you,\nCentral Semen Pathology & Cryopreservation Laboratory`
    );
    window.location.href = `mailto:${recipientEmail}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className={cn(
        "w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]",
        isDark ? "bg-[#0c0c12] border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"
      )}>
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold uppercase tracking-wider">Tele-Andrology Consulting Portal</h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Secure Peer Review
                </span>
              </div>
              <p className={cn("text-xs mt-0.5", isDark ? "text-white/50" : "text-slate-500")}>
                Generate encrypted read-only share link for consulting veterinarians &amp; embryologists
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          {/* Specimen Brief */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-xs">
                {species.slice(0, 3).toUpperCase()}
              </div>
              <div>
                <span className="text-xs font-bold text-white font-mono">{patientId}</span>
                <span className="text-[10px] text-white/50 block">{species} &bull; Motility: {analysis?.summary.motility.progressive || 62.4}% &bull; Conc: {analysis?.summary.concentration || 580.0} M/mL</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[9px] uppercase tracking-wider font-bold text-emerald-400 block">SFT Certified</span>
              <span className="text-[9px] text-white/40 font-mono">{new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {/* Configuration Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Scope Level */}
            <div>
              <label className="text-[10px] uppercase font-bold text-white/50 block mb-2">Consulting Access Scope</label>
              <div className="space-y-1.5">
                {[
                  { id: 'interactive', label: 'Interactive Player & Waves', desc: 'Allows scrubbing video, kinematics & kymograph' },
                  { id: 'dossier', label: 'Clinical Dossier Only', desc: 'Read-only verified PDF evaluation summary' },
                  { id: 'full_audit', label: 'Full Audit Trail & Raw CSV', desc: 'Includes raw cell coordinates & QA stamps' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setAccessScope(opt.id as any)}
                    className={cn(
                      "w-full p-2.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col",
                      accessScope === opt.id
                        ? "bg-purple-500/20 border-purple-500/50 text-purple-200"
                        : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10"
                    )}
                  >
                    <span className="text-xs font-bold">{opt.label}</span>
                    <span className="text-[9px] text-white/40">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Expiration & Security Settings */}
            <div className="space-y-4">
              <div>
                <label className="text-[10px] uppercase font-bold text-white/50 block mb-2">Link Expiry Period</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: '1', label: '24h' },
                    { id: '7', label: '7 Days' },
                    { id: '30', label: '30 Days' },
                    { id: 'never', label: 'Never' }
                  ].map(exp => (
                    <button
                      key={exp.id}
                      onClick={() => setExpiryDays(exp.id as any)}
                      className={cn(
                        "py-2 px-1 rounded-xl text-xs font-bold text-center border transition-all cursor-pointer",
                        expiryDays === exp.id
                          ? "bg-purple-500/20 border-purple-500 text-purple-300"
                          : "bg-white/5 border-white/5 text-white/60 hover:bg-white/10"
                      )}
                    >
                      {exp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* PIN Code Toggle */}
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-bold text-white/80">Require 4-Digit Passcode</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={requirePin}
                    onChange={(e) => setRequirePin(e.target.checked)}
                    className="accent-purple-500 cursor-pointer"
                  />
                </div>
                {requirePin && (
                  <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    <span className="text-[10px] text-white/40 uppercase">PIN Code:</span>
                    <input
                      type="text"
                      maxLength={6}
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value)}
                      className="w-24 px-2 py-1 bg-black/50 border border-white/20 rounded text-center text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                )}
              </div>

              {/* Inclusions */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-white/50 block">Include Advanced Bio-Data</label>
                <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeFlagellar}
                    onChange={(e) => setIncludeFlagellar(e.target.checked)}
                    className="accent-purple-500 cursor-pointer"
                  />
                  <span>Flagellar Waveform &amp; SpermQ Kymograph</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-white/70 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeMorphometry}
                    onChange={(e) => setIncludeMorphometry(e.target.checked)}
                    className="accent-purple-500 cursor-pointer"
                  />
                  <span>Kruger Strict Morphometry Gallery</span>
                </label>
              </div>
            </div>
          </div>

          {/* Generated Share Link Box */}
          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 block">
              Direct Peer-Review Consultation URL
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-xs font-mono text-purple-200 select-all focus:outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-500/20 shrink-0 cursor-pointer"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{isCopied ? "Copied Link!" : "Copy Link"}</span>
              </button>
            </div>
          </div>

          {/* Email Specialist Dispatch */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block">
              Direct Email Dispatch to Consultant
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Specialist Name (e.g. Dr. Vance)"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
              />
              <input
                type="email"
                placeholder="consultant@andrology.org"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="flex justify-between items-center pt-1">
              <button
                onClick={() => setShowSpecialistPreview(!showSpecialistPreview)}
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{showSpecialistPreview ? "Hide Specialist View" : "Preview External Review Deck"}</span>
              </button>
              <button
                onClick={handleSendEmail}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Draft Email</span>
              </button>
            </div>
          </div>

          {/* Preview of what external reviewer sees */}
          {showSpecialistPreview && (
            <div className="p-4 rounded-xl border border-dashed border-purple-500/40 bg-black/40 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                <UserCheck className="w-4 h-4 text-purple-400" />
                <span>Simulated Specialist Consulting Portal View</span>
              </div>
              <div className="text-[11px] text-white/70 space-y-1">
                <p>&bull; <strong>Review Mode:</strong> Read-Only Certified Theriogenology Evaluation</p>
                <p>&bull; <strong>Scope:</strong> {accessScope.toUpperCase()} &bull; Expiration: {expiryDays === 'never' ? 'Indefinite' : `${expiryDays} Days`}</p>
                <p>&bull; <strong>Audit Stamp:</strong> Cryptographically Verified CASA Session #{generatedToken.slice(0, 16)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-end gap-2 bg-white/5">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white bg-white/5 hover:bg-white/10 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
