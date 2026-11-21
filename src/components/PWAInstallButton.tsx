import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2, Share2, PlusSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { cn } from '../utils';

interface PWAInstallButtonProps {
  theme?: 'light' | 'dark';
  className?: string;
  variant?: 'compact' | 'full';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ 
  theme = 'dark',
  className = '',
  variant = 'compact'
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already running inside installed standalone PWA, suppress the button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    setIsInstalling(true);
    try {
      await install();
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <>
      {isInstallable && (
        <button
          type="button"
          onClick={handleInstallClick}
          disabled={isInstalling}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 border",
            theme === 'dark'
              ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-emerald-500/10"
              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200",
            className
          )}
          title="Install ATSA CASA on your device for fast offline lab access"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>{variant === 'compact' ? 'Install App' : 'Install Lab App (PWA)'}</span>
        </button>
      )}

      {isIOS && !isInstallable && (
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border",
            theme === 'dark'
              ? "bg-white/5 hover:bg-white/10 text-white/80 border-white/10"
              : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200",
            className
          )}
          title="Install ATSA CASA on iPhone or iPad"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Install on iOS</span>
        </button>
      )}

      {/* iOS Safari Home Screen Guide Modal */}
      <AnimatePresence>
        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className={cn(
                "w-full max-w-sm rounded-[28px] border shadow-2xl p-6 relative overflow-hidden",
                theme === 'dark' ? "bg-[#0e0e12] border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">Install on iPhone / iPad</h3>
                    <p className={cn("text-[10px]", theme === 'dark' ? "text-white/40" : "text-slate-500")}>Run offline in field barns</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-white/40 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 my-5 text-xs">
                <div className={cn("p-3 rounded-xl border flex items-center gap-3", theme === 'dark' ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100")}>
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold block">1. Tap Share</span>
                    <span className="text-[11px] opacity-70">Tap the Share icon in Safari’s navigation bar</span>
                  </div>
                </div>

                <div className={cn("p-3 rounded-xl border flex items-center gap-3", theme === 'dark' ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100")}>
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold block">2. Add to Home Screen</span>
                    <span className="text-[11px] opacity-70">Scroll down and tap "Add to Home Screen"</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                Got It
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
