import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

const DB_NAME = 'atsa_field_db';
const DB_VERSION = 1;
const ANALYSES_STORE = 'queued_analyses';
const SAMPLES_STORE = 'queued_samples';

export interface QueuedAnalysisRecord {
  localId?: number;
  queuedAt: string;
  data: any;
}

export interface QueuedSampleRecord {
  localId?: number;
  queuedAt: string;
  data: any;
}

function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(ANALYSES_STORE)) {
        db.createObjectStore(ANALYSES_STORE, { keyPath: 'localId', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(SAMPLES_STORE)) {
        db.createObjectStore(SAMPLES_STORE, { keyPath: 'localId', autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Queue an analysis in IndexedDB when device is offline in the field
 */
export async function queueOfflineAnalysis(analysisData: any): Promise<number> {
  const dbInstance = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(ANALYSES_STORE, 'readwrite');
    const store = tx.objectStore(ANALYSES_STORE);
    const item: QueuedAnalysisRecord = {
      queuedAt: new Date().toISOString(),
      data: analysisData
    };
    const req = store.add(item);
    req.onsuccess = () => resolve(req.result as number);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Queue a sample registration in IndexedDB when device is offline
 */
export async function queueOfflineSample(sampleData: any): Promise<number> {
  const dbInstance = await openIndexedDB();
  return new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(SAMPLES_STORE, 'readwrite');
    const store = tx.objectStore(SAMPLES_STORE);
    const item: QueuedSampleRecord = {
      queuedAt: new Date().toISOString(),
      data: sampleData
    };
    const req = store.add(item);
    req.onsuccess = () => resolve(req.result as number);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Count how many records are awaiting cloud sync
 */
export async function getPendingQueueCounts(): Promise<{ analyses: number; samples: number; total: number }> {
  try {
    const dbInstance = await openIndexedDB();
    const countStore = (storeName: string): Promise<number> => {
      return new Promise((resolve, reject) => {
        const tx = dbInstance.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.count();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    };

    const analysesCount = await countStore(ANALYSES_STORE);
    const samplesCount = await countStore(SAMPLES_STORE);
    return {
      analyses: analysesCount,
      samples: samplesCount,
      total: analysesCount + samplesCount
    };
  } catch (err) {
    console.warn('Could not read pending offline queue count:', err);
    return { analyses: 0, samples: 0, total: 0 };
  }
}

/**
 * Drain queued records to Firestore once connection is restored
 */
export async function drainOfflineQueueToFirestore(
  userId: string,
  onProgress?: (syncedCount: number, totalCount: number) => void
): Promise<{ syncedAnalyses: number; syncedSamples: number }> {
  if (!navigator.onLine) {
    throw new Error('Device is still offline.');
  }

  const dbInstance = await openIndexedDB();
  let syncedAnalyses = 0;
  let syncedSamples = 0;

  // 1. Drain Samples
  const samples: QueuedSampleRecord[] = await new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(SAMPLES_STORE, 'readonly');
    const store = tx.objectStore(SAMPLES_STORE);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  for (const item of samples) {
    try {
      const payload = {
        ...item.data,
        uid: userId,
        syncedFromOffline: true,
        offlineQueuedAt: item.queuedAt
      };
      await addDoc(collection(db, 'samples'), payload);

      // Remove from store
      await new Promise<void>((res, rej) => {
        const delTx = dbInstance.transaction(SAMPLES_STORE, 'readwrite');
        const delStore = delTx.objectStore(SAMPLES_STORE);
        const delReq = delStore.delete(item.localId!);
        delReq.onsuccess = () => res();
        delReq.onerror = () => rej(delReq.error);
      });
      syncedSamples++;
      if (onProgress) onProgress(syncedSamples + syncedAnalyses, samples.length);
    } catch (err) {
      console.error('Failed to sync queued sample:', err);
    }
  }

  // 2. Drain Analyses
  const analyses: QueuedAnalysisRecord[] = await new Promise((resolve, reject) => {
    const tx = dbInstance.transaction(ANALYSES_STORE, 'readonly');
    const store = tx.objectStore(ANALYSES_STORE);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  for (const item of analyses) {
    try {
      const payload = {
        ...item.data,
        uid: userId,
        syncedFromOffline: true,
        offlineQueuedAt: item.queuedAt
      };
      await addDoc(collection(db, 'analyses'), payload);

      // Remove from store
      await new Promise<void>((res, rej) => {
        const delTx = dbInstance.transaction(ANALYSES_STORE, 'readwrite');
        const delStore = delTx.objectStore(ANALYSES_STORE);
        const delReq = delStore.delete(item.localId!);
        delReq.onsuccess = () => res();
        delReq.onerror = () => rej(delReq.error);
      });
      syncedAnalyses++;
      if (onProgress) onProgress(syncedSamples + syncedAnalyses, samples.length + analyses.length);
    } catch (err) {
      console.error('Failed to sync queued analysis:', err);
    }
  }

  return { syncedAnalyses, syncedSamples };
}
