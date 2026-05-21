/**
 * speechSynthesis.js — Unified TTS Manager
 *
 * Priority chain:
 * 1. Sarvam AI TTS (via backend) — natural Indian language voices
 * 2. Web SpeechSynthesis API  — fast fallback, browser built-in
 *
 * Features:
 * - Barge-in support (stop speaking when user starts)
 * - Queue management
 * - Preprocessing for natural speech
 * - Language-appropriate voice selection
 */

import { sarvamTTS, getSarvamCode } from '../api/sarvamApi.js';

// ── Internal state ─────────────────────────────────────────────────────────

let _currentAudio = null;       // HTMLAudioElement (Sarvam)
let _isSpeaking = false;
let _speakQueue = [];
let _currentUtterance = null;   // SpeechSynthesisUtterance (browser fallback)

// ── Text preprocessing ────────────────────────────────────────────────────

function preprocessForTTS(text) {
  return (text || '')
    .replace(/<[^>]*>/g, '')              // strip HTML
    .replace(/\*\*(.*?)\*\*/g, '$1')     // **bold** → plain
    .replace(/\*(.*?)\*/g, '$1')         // *italic* → plain
    .replace(/[→←•]/g, ',')             // arrows/bullets → pause
    .replace(/\n+/g, '. ')              // newlines → sentences
    .replace(/\s{2,}/g, ' ')
    .replace(/\.{2,}/g, '.')
    .replace(/[_`#]/g, '')
    .trim()
    .slice(0, 500);                       // Sarvam limit
}

// ── Sarvam TTS ────────────────────────────────────────────────────────────

/**
 * Speak text using Sarvam AI TTS.
 * Returns a promise that resolves when speech ends.
 */
async function speakViaSarvam(text, language = 'en', gender = 'female') {
  const langCode = getSarvamCode(language);
  const processed = preprocessForTTS(text);
  if (!processed) return;

  try {
    const audioBuffer = await sarvamTTS(processed, langCode, gender);
    if (!audioBuffer || audioBuffer.byteLength === 0) {
      throw new Error('Empty audio response');
    }

    const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    _currentAudio = audio;

    return new Promise((resolve, reject) => {
      audio.onended = () => {
        URL.revokeObjectURL(url);
        _currentAudio = null;
        _isSpeaking = false;
        resolve();
        processQueue();
      };
      audio.onerror = (e) => {
        URL.revokeObjectURL(url);
        _currentAudio = null;
        _isSpeaking = false;
        reject(e);
        processQueue();
      };
      _isSpeaking = true;
      audio.play().catch(reject);
    });

  } catch (err) {
    console.warn('[TTS] Sarvam failed, using browser fallback:', err.message);
    return speakViaBrowser(text, language);
  }
}

// ── Browser SpeechSynthesis fallback ─────────────────────────────────────

const BROWSER_LANG_MAP = {
  en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN',
  kn: 'kn-IN', ml: 'ml-IN', bn: 'bn-IN', as: 'as-IN',
  mr: 'mr-IN', gu: 'gu-IN', pa: 'pa-IN', or: 'or-IN',
};

function getBestVoice(langCode) {
  const voices = window.speechSynthesis?.getVoices() || [];
  return (
    voices.find(v => v.lang === langCode && v.localService) ||
    voices.find(v => v.lang.startsWith(langCode.split('-')[0])) ||
    voices.find(v => v.lang === 'en-IN') ||
    voices[0] ||
    null
  );
}

function speakViaBrowser(text, language = 'en', lifecycle = {}) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) { resolve(); return; }

    window.speechSynthesis.cancel();
    const processed = preprocessForTTS(text);
    if (!processed) { resolve(); return; }

    const utterance = new SpeechSynthesisUtterance(processed);
    _currentUtterance = utterance;

    const langCode = BROWSER_LANG_MAP[language] || 'en-IN';
    utterance.lang = langCode;
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to get a good voice
    const voice = getBestVoice(langCode);
    if (voice) utterance.voice = voice;

    utterance.onstart = () => {
      lifecycle.onStart?.();
    };
    utterance.onend = () => {
      lifecycle.onEnd?.();
      _isSpeaking = false;
      _currentUtterance = null;
      resolve();
      processQueue();
    };
    utterance.onerror = () => {
      lifecycle.onEnd?.();
      _isSpeaking = false;
      _currentUtterance = null;
      resolve(); // don't reject — gracefully continue
    };

    _isSpeaking = true;
    window.speechSynthesis.speak(utterance);

    // Safety timeout — some browsers hang
    setTimeout(() => {
      if (_isSpeaking) {
        window.speechSynthesis.cancel();
        _isSpeaking = false;
        resolve();
      }
    }, 30000);
  });
}

// ── Queue management ──────────────────────────────────────────────────────

function processQueue() {
  if (_speakQueue.length === 0) return;
  const next = _speakQueue.shift();
  speakInternal(next.text, next.language, next.gender, next.lifecycle)
    .then(next.resolve)
    .catch(next.reject);
}

async function speakInternal(text, language, gender, lifecycle = {}) {
  // Try Sarvam first
  try {
    lifecycle.onStart?.();
    await speakViaSarvam(text, language, gender);
    lifecycle.onEnd?.();
  } catch {
    await speakViaBrowser(text, language, lifecycle);
  }
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Speak text in the given language.
 * If already speaking, queues the request (unless interrupt=true).
 *
 * @param {string}  text
 * @param {Object}  opts
 * @param {string}  opts.language   - language code ('hi', 'ta', etc.)
 * @param {string}  opts.gender     - 'female' | 'male'
 * @param {boolean} opts.interrupt  - stop current speech and speak immediately
 * @returns {Promise<void>}
 */
export function speak(text, opts = {}) {
  const {
    language = 'en',
    gender = 'female',
    interrupt = false,
    onStart = null,
    onEnd = null,
  } = opts;
  const processed = preprocessForTTS(text);
  if (!processed) return Promise.resolve();

  if (interrupt) {
    stopSpeaking();
  }

  if (_isSpeaking) {
    return new Promise((resolve, reject) => {
      _speakQueue.push({
        text: processed, language, gender, resolve, reject,
        lifecycle: { onStart, onEnd },
      });
    });
  }

  return speakInternal(processed, language, gender, { onStart, onEnd });
}

/**
 * Stop all current and queued speech.
 */
export function stopSpeaking() {
  // Stop Sarvam audio
  if (_currentAudio) {
    _currentAudio.pause();
    _currentAudio = null;
  }
  // Stop browser TTS
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  _currentUtterance = null;
  _isSpeaking = false;
  _speakQueue = [];
}

/**
 * Check if TTS is currently active.
 */
export function isSpeaking() {
  return _isSpeaking;
}

export default { speak, stopSpeaking, isSpeaking };
