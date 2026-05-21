/**
 * IndexedDB-backed audio cache for offline TTS playback.
 * Stores Blob objects keyed by "{langCode}::{text}".
 * Max 500 entries with LRU eviction tracked in a separate metadata store.
 */

const DB_NAME = 'suvidha-audio-cache';
const DB_VERSION = 1;
const AUDIO_STORE = 'audio-blobs';
const META_STORE = 'cache-meta';
const MAX_ENTRIES = 500;

let _db = null;

function openDB() {
  if (_db) return Promise.resolve(_db);

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(AUDIO_STORE)) {
        db.createObjectStore(AUDIO_STORE);
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        // Stores { key, accessedAt } for LRU tracking
        const meta = db.createObjectStore(META_STORE, { keyPath: 'key' });
        meta.createIndex('accessedAt', 'accessedAt', { unique: false });
      }
    };

    req.onsuccess = (event) => {
      _db = event.target.result;
      resolve(_db);
    };

    req.onerror = () => reject(req.error);
  });
}

function makeKey(rawKey) {
  // Truncate to 120 chars to keep key size manageable
  return rawKey.slice(0, 120);
}

/**
 * Retrieve cached audio Blob. Returns null if not found.
 */
export async function getAudio(rawKey) {
  try {
    const db = await openDB();
    const key = makeKey(rawKey);

    const blob = await new Promise((resolve, reject) => {
      const tx = db.transaction(AUDIO_STORE, 'readonly');
      const req = tx.objectStore(AUDIO_STORE).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });

    if (blob) {
      // Update LRU access time
      touchMeta(db, key).catch(() => {});
    }

    return blob;
  } catch {
    return null;
  }
}

/**
 * Store audio Blob in cache.
 */
export async function setAudio(rawKey, blob) {
  try {
    const db = await openDB();
    const key = makeKey(rawKey);

    await new Promise((resolve, reject) => {
      const tx = db.transaction([AUDIO_STORE, META_STORE], 'readwrite');
      tx.objectStore(AUDIO_STORE).put(blob, key);
      tx.objectStore(META_STORE).put({ key, accessedAt: Date.now() });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });

    // Enforce max size in background
    evictIfNeeded(db).catch(() => {});
  } catch {
    // Cache write failure is non-fatal
  }
}

async function touchMeta(db, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(META_STORE, 'readwrite');
    tx.objectStore(META_STORE).put({ key, accessedAt: Date.now() });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function evictIfNeeded(db) {
  const count = await new Promise((resolve, reject) => {
    const tx = db.transaction(META_STORE, 'readonly');
    const req = tx.objectStore(META_STORE).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  if (count <= MAX_ENTRIES) return;

  const toEvict = count - MAX_ENTRIES;

  // Get oldest entries by accessedAt
  const oldest = await new Promise((resolve, reject) => {
    const tx = db.transaction(META_STORE, 'readonly');
    const store = tx.objectStore(META_STORE);
    const idx = store.index('accessedAt');
    const keys = [];
    const req = idx.openCursor();
    req.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor && keys.length < toEvict) {
        keys.push(cursor.value.key);
        cursor.continue();
      } else {
        resolve(keys);
      }
    };
    req.onerror = () => reject(req.error);
  });

  if (!oldest.length) return;

  await new Promise((resolve, reject) => {
    const tx = db.transaction([AUDIO_STORE, META_STORE], 'readwrite');
    const audioStore = tx.objectStore(AUDIO_STORE);
    const metaStore = tx.objectStore(META_STORE);
    oldest.forEach((key) => {
      audioStore.delete(key);
      metaStore.delete(key);
    });
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Pre-fetch and cache a list of phrases for a given language.
 * @param {string} langCode - e.g. 'te', 'hi', 'kn'
 * @param {string[]} phrases - English phrases to translate+cache
 * @param {(done: number, total: number) => void} onProgress
 */
export async function preCachePhrases(langCode, phrases, onProgress) {
  const total = phrases.length;
  let done = 0;

  for (const phrase of phrases) {
    try {
      // Check if already cached
      const cacheKey = `${langCode}-IN::default::1.00::${phrase}`;
      const existing = await getAudio(makeKey(cacheKey));
      if (existing) {
        done++;
        onProgress?.(done, total);
        continue;
      }

      // Call TTS endpoint — server handles translation if needed
      const payload = { inputs: [phrase], target_language_code: `${langCode}-IN`, expected_gender: 'female', model: 'bulbul:v3' };
      const resp = await fetch('/api/sarvam/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      });

      if (resp.ok) {
        const blob = await resp.blob();
        if (blob.size > 0) {
          await setAudio(cacheKey, blob);
        }
      }
    } catch {
      // Non-fatal — skip this phrase
    }

    done++;
    onProgress?.(done, total);

    // Small delay to avoid hammering the API
    await new Promise(r => setTimeout(r, 150));
  }
}

/**
 * Clear all cached audio (useful for language change or storage cleanup).
 */
export async function clearAll() {
  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction([AUDIO_STORE, META_STORE], 'readwrite');
      tx.objectStore(AUDIO_STORE).clear();
      tx.objectStore(META_STORE).clear();
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Non-fatal
  }
}

/**
 * Return approximate entry count.
 */
export async function getCacheSize() {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(META_STORE, 'readonly');
      const req = tx.objectStore(META_STORE).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return 0;
  }
}
