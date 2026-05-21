/* eslint-disable no-restricted-globals */
/**
 * Service Worker for SUVIDHA 2026 Kiosk
 * - Cache-first for static assets
 * - Network-first for API (with offline fallback)
 * - POST /api/sarvam/text-to-speech and /tts-bridge responses are cached
 *   keyed by a hash of request body so TTS works offline
 */

const CACHE_NAME = 'suvidha-v3';
const TTS_CACHE_NAME = 'suvidha-tts-v1';
const MAX_TTS_CACHE = 300;

const STATIC_ASSETS = [
  '/index.html',
  '/favicon.svg',
];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((n) => n !== CACHE_NAME && n !== TTS_CACHE_NAME)
          .map((n) => caches.delete(n))
      )
    )
  );
  self.clients.claim();
});

// ── Simple hash for cache key from request body string ───────────────────────
async function hashBody(bodyText) {
  const encoded = new TextEncoder().encode(bodyText);
  const hashBuf = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
}

// ── TTS POST caching helper ──────────────────────────────────────────────────
const TTS_PATHS = ['/api/sarvam/text-to-speech', '/api/sarvam/tts-bridge'];

async function handleTTSPost(event) {
  const req = event.request.clone();
  let bodyText = '';
  try { bodyText = await req.text(); } catch { /* ignore */ }

  const hash = await hashBody(bodyText + req.url);
  const cacheKey = new Request(`/tts-cache/${hash}`);

  const ttsCache = await caches.open(TTS_CACHE_NAME);
  const cached = await ttsCache.match(cacheKey);
  if (cached) return cached;

  // Network not available
  try {
    const networkResp = await fetch(event.request.clone());
    if (networkResp.ok) {
      const respToCache = networkResp.clone();
      // Evict oldest if over limit
      ttsCache.keys().then((keys) => {
        if (keys.length >= MAX_TTS_CACHE) {
          ttsCache.delete(keys[0]);
        }
      });
      ttsCache.put(cacheKey, respToCache);
    }
    return networkResp;
  } catch {
    return new Response(null, { status: 503, statusText: 'Offline — TTS not cached' });
  }
}

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Intercept TTS POST requests for caching
  if (request.method === 'POST' && TTS_PATHS.some((p) => url.pathname === p)) {
    event.respondWith(handleTTSPost(event));
    return;
  }

  // Skip other non-GET requests
  if (request.method !== 'GET') return;

  // API GET calls — network first, fallback to cache
  if (url.pathname.startsWith('/api')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static assets — cache first, network fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.status === 200) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
        }
        return response;
      });
    }).catch(() => {
      if (request.mode === 'navigate') return caches.match('/index.html');
    })
  );
});

// ── Background sync ───────────────────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-submissions') {
    event.waitUntil(syncPendingSubmissions());
  }
});

async function syncPendingSubmissions() {
  const clients = await self.clients.matchAll();
  clients.forEach((client) => client.postMessage({ type: 'SYNC_SUBMISSIONS' }));
}
