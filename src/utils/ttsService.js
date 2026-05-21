import { getAudio, setAudio } from './offlineAudioCache';

const PRIORITY_ORDER = { error: 3, warning: 2, normal: 1 };

// All 12 languages Sarvam TTS/STT natively supports
const LANGUAGE_MAP = {
  en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN',
  kn: 'kn-IN', ml: 'ml-IN', mr: 'mr-IN', gu: 'gu-IN',
  bn: 'bn-IN', or: 'or-IN', pa: 'pa-IN', as: 'as-IN',
};

// Languages Sarvam TTS doesn't fully support — bridge via Hindi
// as-IN needs beta access; bridge via translation for now
const HINDI_BRIDGE_LANGS = new Set([
  'ur', 'ks', 'sd', 'mai', 'kok', 'doi', 'ne', 'sa', 'mni', 'sat', 'as',
]);

// Sarvam bulbul:v3 compatible speakers (updated May 2026)
const SPEAKER_MAP = {
  'hi-IN': 'anand', 'en-IN': 'ritu', 'ta-IN': 'kavitha',
  'te-IN': 'ratan', 'kn-IN': 'mani', 'ml-IN': 'roopa',
  'mr-IN': 'sumit', 'gu-IN': 'pooja', 'bn-IN': 'neha',
  'or-IN': 'priya', 'pa-IN': 'rahul', 'as-IN': 'anand',
};

const CACHE_LIMIT = 60;

class TTSService {
  constructor() {
    this.queue = [];
    this.isPlaying = false;
    this.currentAudio = null;
    this.currentObjectUrl = null;
    this.pausedByVoiceCommand = false;
    this.sequence = 0;
    this.audioCache = new Map();
    this.cacheOrder = [];

    // Detect streaming MP3 support once
    this._streamingSupported = this._checkStreamingSupport();
  }

  _checkStreamingSupport() {
    if (typeof window === 'undefined') return false;
    if (!('MediaSource' in window)) return false;
    return MediaSource.isTypeSupported('audio/mpeg');
  }

  getLanguageInfo(language) {
    if (!language || typeof language !== 'string') {
      return { code: 'en-IN', needsBridge: false, originalLang: 'en' };
    }
    const baseLang = language.toLowerCase().split('-')[0];
    if (HINDI_BRIDGE_LANGS.has(baseLang)) {
      return { code: 'hi-IN', needsBridge: true, originalLang: baseLang };
    }
    return { code: LANGUAGE_MAP[baseLang] || 'en-IN', needsBridge: false, originalLang: baseLang };
  }

  getLanguageCode(language) {
    return this.getLanguageInfo(language).code;
  }

  getCacheKey(text, langCode, options) {
    const speaker = options?.speaker || SPEAKER_MAP[langCode] || 'meera';
    return `${langCode}::${speaker}::${text.trim().slice(0, 80)}`;
  }

  setVoiceCommandActive(isActive) {
    this.pausedByVoiceCommand = Boolean(isActive);
    if (this.pausedByVoiceCommand) {
      if (this.currentAudio && !this.currentAudio.paused) this.currentAudio.pause();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      return;
    }
    if (this.currentAudio && this.currentAudio.paused) {
      this.currentAudio.play().catch(() => { this.isPlaying = false; this.processQueue(); });
      return;
    }
    this.processQueue();
  }

  stop() {
    this.queue = [];
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
      this.currentObjectUrl = null;
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    this.isPlaying = false;
  }

  speak(text, options = {}) {
    const trimmed = typeof text === 'string' ? text.trim() : '';
    if (!trimmed) return Promise.resolve();

    const priority = options.priority || 'normal';
    const queueItem = { id: ++this.sequence, text: trimmed, options, priority, resolve: null, reject: null };
    const promise = new Promise((resolve, reject) => { queueItem.resolve = resolve; queueItem.reject = reject; });

    if (options.interrupt === true || priority === 'error') this.stop();
    this.queue.push(queueItem);
    this.processQueue();
    return promise;
  }

  async processQueue() {
    if (this.isPlaying || this.pausedByVoiceCommand || this.queue.length === 0) return;

    const nextIndex = this.getNextQueueItemIndex();
    const item = this.queue.splice(nextIndex, 1)[0];
    this.isPlaying = true;

    try {
      await this.playItem(item);
      item.resolve(true);
    } catch (error) {
      item.reject(error);
    } finally {
      this.isPlaying = false;
      this.currentAudio = null;
      this.currentObjectUrl = null;
      if (!this.pausedByVoiceCommand) this.processQueue();
    }
  }

  getNextQueueItemIndex() {
    let bestIndex = 0, bestPriority = -1, bestId = Number.MAX_SAFE_INTEGER;
    for (let i = 0; i < this.queue.length; i++) {
      const item = this.queue[i];
      const p = PRIORITY_ORDER[item.priority] || 1;
      if (p > bestPriority || (p === bestPriority && item.id < bestId)) {
        bestPriority = p; bestId = item.id; bestIndex = i;
      }
    }
    return bestIndex;
  }

  async playItem(item) {
    const langInfo = this.getLanguageInfo(item.options?.language);
    const cacheKey = this.getCacheKey(item.text, langInfo.code, item.options);

    // 1. In-memory cache
    if (this.audioCache.has(cacheKey)) {
      try { await this.playAudioFromObjectUrl(this.audioCache.get(cacheKey), item.options?.volume); return; } catch { /* fall through */ }
    }

    // 2. IndexedDB offline cache
    try {
      const cachedBlob = await getAudio(cacheKey);
      if (cachedBlob) {
        const url = URL.createObjectURL(cachedBlob);
        this._addToMemCache(cacheKey, url);
        await this.playAudioFromObjectUrl(url, item.options?.volume);
        return;
      }
    } catch { /* IndexedDB unavailable */ }

    // 3. Try Sarvam streaming TTS (fastest — plays in ~200ms)
    try {
      await this.playStreaming(item.text, langInfo, item.options);
      return;
    } catch (streamErr) {
      console.warn('[TTS] Streaming failed, trying batch fallback:', streamErr.message);
    }

    // 4. Batch TTS fallback (collects full blob then plays)
    try {
      const url = await this.fetchBatchObjectUrl(item.text, langInfo, item.options);
      this._addToMemCache(cacheKey, url);
      await this.playAudioFromObjectUrl(url, item.options?.volume);
      return;
    } catch (batchErr) {
      console.warn('[TTS] Batch TTS failed, using Web Speech:', batchErr.message);
    }

    // 5. Browser Web Speech API (always works, lower quality)
    await this.playFallback(item.text, langInfo.code);
  }

  // ── Streaming TTS ─────────────────────────────────────────────────────────
  async playStreaming(text, langInfo, options = {}) {
    const endpoint = langInfo.needsBridge
      ? '/api/sarvam/tts-stream-bridge'
      : '/api/sarvam/text-to-speech-stream';

    const body = langInfo.needsBridge
      ? { text, sourceLangCode: langInfo.originalLang, pace: options.pace || 1.0 }
      : {
          text,
          target_language_code: langInfo.code,
          speaker: options.speaker || SPEAKER_MAP[langInfo.code] || 'meera',
          pace: options.pace || 1.0,
          enable_preprocessing: true,
        };

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(25000),
    });

    if (!resp.ok) throw new Error(`Streaming TTS HTTP ${resp.status}`);

    // Use MediaSource for true real-time streaming playback
    if (this._streamingSupported) {
      return this.playStreamingWithMediaSource(resp.body, options?.volume);
    }

    // Fallback: collect blob and play (still faster than batch WAV)
    const blob = await resp.blob();
    if (!blob.size) throw new Error('Empty streaming response');

    // Cache in IndexedDB for offline
    const cacheKey = this.getCacheKey(text, langInfo.code, options);
    setAudio(cacheKey, blob).catch(() => {});

    const url = URL.createObjectURL(blob);
    this._addToMemCache(cacheKey, url);
    return this.playAudioFromObjectUrl(url, options?.volume);
  }

  playStreamingWithMediaSource(readableStream, volume = 1) {
    return new Promise((resolve, reject) => {
      const mediaSource = new MediaSource();
      const audio = new Audio();
      audio.volume = Math.max(0, Math.min(1, Number(volume)));
      audio.src = URL.createObjectURL(mediaSource);

      this.currentAudio = audio;

      let sourceBuffer;
      let finished = false;
      const pendingChunks = [];
      let appending = false;

      const appendNext = () => {
        if (appending || pendingChunks.length === 0) return;
        if (sourceBuffer.updating) return;
        appending = true;
        const chunk = pendingChunks.shift();
        try {
          sourceBuffer.appendBuffer(chunk);
        } catch {
          appending = false;
        }
      };

      mediaSource.addEventListener('sourceopen', async () => {
        try {
          sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg');
          sourceBuffer.addEventListener('updateend', () => {
            appending = false;
            if (pendingChunks.length > 0) {
              appendNext();
            } else if (finished && !sourceBuffer.updating) {
              try { mediaSource.endOfStream(); } catch { /* already ended */ }
            }
          });

          // Start playing immediately — audio begins as soon as first chunk arrives
          audio.play().catch(() => {});

          const reader = readableStream.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              finished = true;
              if (!sourceBuffer.updating && pendingChunks.length === 0) {
                try { mediaSource.endOfStream(); } catch { /* ok */ }
              }
              break;
            }
            pendingChunks.push(value);
            appendNext();
          }
        } catch (err) {
          reject(err);
        }
      }, { once: true });

      audio.onended = () => resolve(true);
      audio.onerror = () => reject(new Error('MediaSource playback error'));

      // Timeout safety
      setTimeout(() => { if (!audio.ended) { audio.pause(); resolve(true); } }, 30000);
    });
  }

  // ── Batch TTS (WAV) — fallback ────────────────────────────────────────────
  async fetchBatchObjectUrl(text, langInfo, options = {}) {
    let textToSpeak = text;
    let targetLangCode = langInfo.code;

    if (langInfo.needsBridge) {
      try {
        const r = await fetch('/api/sarvam/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: text, source_language_code: `${langInfo.originalLang}-IN`, target_language_code: 'hi-IN', model: 'mayura:v1', mode: 'formal' }),
          signal: AbortSignal.timeout(8000),
        });
        const d = await r.json();
        if (d?.translated_text) { textToSpeak = d.translated_text; targetLangCode = 'hi-IN'; }
      } catch { targetLangCode = 'en-IN'; }
    }

    const resp = await fetch('/api/sarvam/text-to-speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: [textToSpeak], target_language_code: targetLangCode, expected_gender: 'female', model: 'bulbul:v3' }),
      signal: AbortSignal.timeout(20000),
    });

    if (!resp.ok) throw new Error(`Batch TTS HTTP ${resp.status}`);
    const blob = await resp.blob();
    if (!blob.size) throw new Error('Empty batch TTS response');

    const cacheKey = this.getCacheKey(text, langInfo.code, options);
    setAudio(cacheKey, blob).catch(() => {});
    return URL.createObjectURL(blob);
  }

  _addToMemCache(key, url) {
    this.audioCache.set(key, url);
    this.cacheOrder.push(key);
    while (this.cacheOrder.length > CACHE_LIMIT) {
      const old = this.cacheOrder.shift();
      const oldUrl = this.audioCache.get(old);
      if (oldUrl) URL.revokeObjectURL(oldUrl);
      this.audioCache.delete(old);
    }
  }

  playAudioFromObjectUrl(objectUrl, volume = 1) {
    return new Promise((resolve, reject) => {
      const audio = new Audio(objectUrl);
      audio.preload = 'auto';
      audio.volume = Math.max(0, Math.min(1, Number(volume)));
      this.currentAudio = audio;
      this.currentObjectUrl = objectUrl;

      const cleanup = () => { audio.onended = null; audio.onerror = null; };
      audio.onended = () => { cleanup(); resolve(true); };
      audio.onerror = () => { cleanup(); reject(new Error('Audio playback failed')); };
      audio.play().catch(err => { cleanup(); reject(err); });
    });
  }

  playFallback(text, languageCode) {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) { resolve(true); return; }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = languageCode;
      utterance.rate = 0.9;
      utterance.volume = 1;

      const voices = window.speechSynthesis.getVoices();
      const langBase = languageCode.split('-')[0];
      const match = voices.find(v => v.lang.startsWith(languageCode))
        || voices.find(v => v.lang.startsWith(langBase))
        || voices.find(v => v.lang.startsWith('hi'));
      if (match) utterance.voice = match;

      utterance.onend = () => resolve(true);
      utterance.onerror = () => resolve(true); // resolve to not block queue
      window.speechSynthesis.speak(utterance);
    });
  }
}

const ttsService = new TTSService();

export const speak = (text, options) => ttsService.speak(text, options);
export const stopTTS = () => ttsService.stop();
export const setVoiceCommandActive = (isActive) => ttsService.setVoiceCommandActive(isActive);
export const mapLanguageCode = (language) => ttsService.getLanguageCode(language);
export const getLanguageInfo = (language) => ttsService.getLanguageInfo(language);

export default ttsService;
