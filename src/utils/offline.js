/**
 * Offline Manager
 * Handles offline detection, form data caching in IndexedDB,
 * and queued submission when connectivity is restored.
 */

const DB_NAME = 'suvidha-offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending-submissions';

// Open IndexedDB
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
};

// Save a pending submission for later sync
export const savePendingSubmission = async (data) => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const entry = {
      ...data,
      savedAt: new Date().toISOString(),
      synced: false,
    };
    store.add(entry);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error('Failed to save offline:', error);
    // Fallback to localStorage
    const pending = JSON.parse(localStorage.getItem('pending-submissions') || '[]');
    pending.push({ ...data, savedAt: new Date().toISOString(), synced: false });
    localStorage.setItem('pending-submissions', JSON.stringify(pending));
    return true;
  }
};

// Get all pending submissions
export const getPendingSubmissions = async () => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result.filter(r => !r.synced));
      request.onerror = () => reject(request.error);
    });
  } catch {
    const pending = JSON.parse(localStorage.getItem('pending-submissions') || '[]');
    return pending.filter(r => !r.synced);
  }
};

// Mark a submission as synced
export const markAsSynced = async (id) => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => {
      const record = request.result;
      if (record) {
        record.synced = true;
        store.put(record);
      }
    };
  } catch {
    // Fallback
    const pending = JSON.parse(localStorage.getItem('pending-submissions') || '[]');
    const updated = pending.map(r => r.id === id ? { ...r, synced: true } : r);
    localStorage.setItem('pending-submissions', JSON.stringify(updated));
  }
};

// Clear all synced submissions
export const clearSyncedSubmissions = async () => {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      request.result.forEach(record => {
        if (record.synced) store.delete(record.id);
      });
    };
  } catch {
    const pending = JSON.parse(localStorage.getItem('pending-submissions') || '[]');
    localStorage.setItem('pending-submissions', JSON.stringify(pending.filter(r => !r.synced)));
  }
};

// Check online status
export const isOnline = () => navigator.onLine;

// Network status listeners
export const onNetworkChange = (callback) => {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

// Attempt to sync pending submissions
export const syncPendingSubmissions = async (apiSubmitFn) => {
  if (!isOnline()) return { synced: 0, failed: 0 };
  
  const pending = await getPendingSubmissions();
  let synced = 0;
  let failed = 0;

  for (const submission of pending) {
    try {
      await apiSubmitFn(submission);
      await markAsSynced(submission.id);
      synced++;
    } catch {
      failed++;
    }
  }

  if (synced > 0) {
    await clearSyncedSubmissions();
  }

  return { synced, failed };
};

export default {
  savePendingSubmission,
  getPendingSubmissions,
  markAsSynced,
  clearSyncedSubmissions,
  isOnline,
  onNetworkChange,
  syncPendingSubmissions,
};
