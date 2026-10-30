import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Cloud, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { getPendingQueueCounts, drainOfflineQueueToFirestore } from '../services/offlineSyncService';
import { cn } from '../utils';

interface OfflineFieldIndicatorProps {
  userId?: string;
  theme?: 'light' | 'dark';
  onSyncCompleted?: (message: string) => void;
}

export const OfflineFieldIndicator: React.FC<OfflineFieldIndicatorProps> = ({
  userId,
  theme = 'dark',
  onSyncCompleted
}) => {
  const isOnline = useOnlineStatus();
  const [pendingCounts, setPendingCounts] = useState({ analyses: 0, samples: 0, total: 0 });
  const [isSyncing, setIsSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);

  // Poll / check pending records
  const refreshPendingCounts = async () => {
    try {
      const counts = await getPendingQueueCounts();
      setPendingCounts(counts);
    } catch (e) {
      // IndexedDB might not be initialized
    }
  };

  useEffect(() => {
    refreshPendingCounts();
    const interval = setInterval(refreshPendingCounts, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingCounts.total > 0 && userId && !isSyncing) {
      handleSyncNow();
    }
  }, [isOnline, pendingCounts.total, userId]);

  const handleSyncNow = async () => {
    if (!userId || !isOnline || isSyncing) return;
    setIsSyncing(true);
    try {
      const result = await drainOfflineQueueToFirestore(userId);
      await refreshPendingCounts();
      setJustSynced(true);
      setTimeout(() => setJustSynced(false), 3000);
      if (onSyncCompleted) {
        onSyncCompleted(`Cloud sync complete: ${result.syncedAnalyses} analyses, ${result.syncedSamples} samples synchronized.`);
      }
    } catch (err) {
      console.warn('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // If online and no items pending, render a clean, low-profile online pill
  if (isOnline && pendingCounts.total === 0) {
    return (
      <div 
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border transition-colors select-none",
          theme === 'dark' 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
            : "bg-emerald-50 border-emerald-200 text-emerald-700"
        )}
        title="Connected to ATSA Cloud Workstation (Firestore Live)"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <Wifi className="w-3 h-3 text-emerald-400" />
        <span className="hidden sm:inline">Cloud Online</span>
      </div>
    );
  }

  // If offline
  if (!isOnline) {
    return (
      <div 
        className={cn(
          "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono font-bold border shadow-lg transition-all select-none animate-pulse",
          "bg-amber-500/15 border-amber-500/40 text-amber-400"
        )}
        title="Device is offline. CASA engine runs locally with IndexedDB queue."
      >
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        <WifiOff className="w-3.5 h-3.5 text-amber-400" />
        <span>Field Mode (Offline)</span>
        {pendingCounts.total > 0 && (
          <span className="px-1.5 py-0.2 rounded-md bg-amber-500/30 text-amber-300 font-black">
            {pendingCounts.total} queued
          </span>
        )}
      </div>
    );
  }

  // If online with pending sync queue
  return (
    <div 
      className={cn(
        "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-mono font-bold border transition-all select-none",
        theme === 'dark' 
          ? "bg-blue-500/15 border-blue-500/30 text-blue-300" 
          : "bg-blue-50 border-blue-200 text-blue-700"
      )}
    >
      <Cloud className="w-3.5 h-3.5 text-blue-400" />
      <span>{pendingCounts.total} Pending Sync</span>
      <button
        type="button"
        onClick={handleSyncNow}
        disabled={isSyncing}
        className={cn(
          "flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-blue-500 hover:bg-blue-600 text-white cursor-pointer transition-all shadow-sm",
          isSyncing && "opacity-75 cursor-wait"
        )}
        title="Drain pending records to Firestore"
      >
        <RefreshCw className={cn("w-2.5 h-2.5", isSyncing && "animate-spin")} />
        <span>{isSyncing ? "Syncing..." : "Sync"}</span>
      </button>
    </div>
  );
};
