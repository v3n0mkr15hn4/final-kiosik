/**
 * speechRecognition.js — Unified STT Manager
 *
 * Two-tier strategy:
 *   Tier 1: Browser SpeechRecognition — fast interim results, no upload latency
 *   Tier 2: Sarvam (MediaRecorder) — higher accuracy, handles more Indian languages
 *
 * Sarvam chunking uses silence-energy-based flush instead of fixed 4500ms gap,
 * eliminating the 500ms restart window that dropped words.
 */

import { sarvamSTT, getSarvamCode } from '../api/sarvamApi.js';
import { getSTTLangCode } from '../brain/multilingualProcessor.js';
import { whisperTranscribe, loadWhisper, isWhisperLoaded } from './localSTT.js';
import { startVAD, stopVAD } from './vadDetector.js';
import { stopTTS, isSpeaking } from '../../utils/ttsService.js';

// Languages where Sarvam bridges through Hindi — local Whisper is more accurate
const WHISPER_PREFERRED_LANGS = new Set([
  'ur', 'mai', 'kok', 'doi', 'ne', 'sa', 'brx', 'ks', 'mni', 'sat', 'sd',
]);

// Tier-1 languages that also have a real Whisper model entry (WHISPER_LANG_MAP
// in localSTT.js) — used only when offline, so Sarvam/browser STT stays
// preferred whenever a network is actually available.
const OFFLINE_FALLBACK_LANGS = new Set(['en', 'hi', 'as']);

let _recognition = null;
let _mediaRecorder = null;
let _stream = null;
let _audioChunks = [];
let _isListening = false;
let _onResult = null;
let _onInterim = null;
let _onError = null;
let _shouldRestart = false;
let _sessionId = 0;
let _language = 'en';
let _defaultLanguage = 'en-IN'; // session language (set by configureSTT)
let _mode = 'idle'; // idle | sarvam | browser

// Session language source — SessionContext is the only caller.
// Call sites must not hardcode language strings.
export function configureSTT(language) {
  if (typeof language === 'string' && language) _defaultLanguage = language;
}

// Silence detection for Sarvam chunking
let _silenceCtx = null;
let _silenceAnalyser = null;
let _silenceFrame = null;

const SILENCE_THRESHOLD = 8;      // RMS below this = silence
const SILENCE_HOLD_MS = 1200;      // flush chunk after this many ms of silence
const MAX_CHUNK_MS = 6000;         // flush anyway after 6s regardless of silence
const MIN_CHUNK_MS = 300;          // don't flush if chunk is too short (click noise)
const RESTART_MS = 100;            // gap between Sarvam chunks (reduced from 500ms)

export function isWebSpeechSupported() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function cleanupStream() {
  if (_silenceFrame) { cancelAnimationFrame(_silenceFrame); _silenceFrame = null; }
  if (_silenceCtx) { try { _silenceCtx.close(); } catch { /* ok */ } _silenceCtx = null; }
  _silenceAnalyser = null;
  stopVAD();

  if (_stream) {
    _stream.getTracks().forEach((t) => t.stop());
    _stream = null;
  }
}

async function ensureStream() {
  if (_stream) return _stream;
  _stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  return _stream;
}

// ── Tier 1: Browser SpeechRecognition ────────────────────────────────────────

export function startBrowserSTT(opts = {}) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return false;

  stopSTT();

  _onResult = opts.onResult || (() => {});
  _onInterim = opts.onInterim || (() => {});
  _onError = opts.onError || (() => {});

  const recognition = new SpeechRecognition();
  const localSessionId = ++_sessionId;
  _shouldRestart = !!(opts.continuous && opts.autoRestart !== false);
  _recognition = recognition;

  recognition.lang = getSTTLangCode(opts.language || 'en');
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 5;

  recognition.onresult = (event) => {
    let interim = '';
    let final = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const res = event.results[i];
      const text = res[0]?.transcript || '';
      if (res.isFinal) final += text;
      else interim += text;
    }
    if (interim) _onInterim(interim);
    if (final) _onResult(final);
  };

  recognition.onerror = (e) => {
    const ignorable = new Set(['no-speech', 'aborted', 'audio-capture']);
    if (!ignorable.has(e.error)) _onError(e.error);
    _isListening = false;
  };

  recognition.onend = () => {
    _isListening = false;
    if (_shouldRestart && localSessionId === _sessionId) {
      setTimeout(() => {
        if (_shouldRestart && !_isListening && localSessionId === _sessionId) {
          try { recognition.start(); _isListening = true; } catch { /* ok */ }
        }
      }, RESTART_MS);
    }
  };

  try {
    recognition.start();
    _isListening = true;
    _mode = 'browser';
    return true;
  } catch {
    return false;
  }
}

// ── Tier 2: Sarvam STT with neural VAD-based flushing ────────────────────────
// Silero VAD replaces the old RMS-energy loop, which misfired on kiosk
// ambient noise (AC hum, crowd, fluorescent buzz). VAD also enables barge-in:
// if the kiosk is mid-TTS and the user starts talking, we cut TTS instantly.

function attachSilenceDetector(stream, onSilence) {
  startVAD(stream, {
    onSpeechStart: () => {
      if (isSpeaking()) stopTTS(); // barge-in
    },
    onSpeechEnd: () => onSilence(),
  }).catch(() => { /* VAD unavailable — MAX_CHUNK_MS hard cap still flushes */ });
}

async function runSarvamChunk(localSessionId) {
  if (!_shouldRestart || localSessionId !== _sessionId) return;

  try {
    const stream = await ensureStream();
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';

    _audioChunks = [];
    _mediaRecorder = new MediaRecorder(stream, { mimeType });

    _mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) _audioChunks.push(e.data);
    };

    _mediaRecorder.onstop = async () => {
      if (localSessionId !== _sessionId) return;

      const blob = new Blob(_audioChunks, { type: mimeType });
      _audioChunks = [];

      if (blob.size < 1000) {
        // Too small — likely silence or noise; restart without sending
        if (_shouldRestart && localSessionId === _sessionId && _mode === 'sarvam') {
          setTimeout(() => runSarvamChunk(localSessionId), RESTART_MS);
        }
        return;
      }

      try {
        _onInterim?.('...');
        const langCode = getSarvamCode(_language);
        const result = await sarvamSTT(blob, langCode);
        const transcript = result?.transcript?.trim() || '';
        if (transcript) _onResult?.(transcript);
      } catch (err) {
        _onError?.(err.message || 'stt_failed');
      } finally {
        if (_shouldRestart && localSessionId === _sessionId && _mode === 'sarvam') {
          setTimeout(() => runSarvamChunk(localSessionId), RESTART_MS);
        }
      }
    };

    _mediaRecorder.start(250); // 250ms timeslice for ondataavailable chunks
    _isListening = true;
    _mode = 'sarvam';

    // Attach silence detector to decide when to flush
    attachSilenceDetector(stream, () => {
      if (_mediaRecorder?.state === 'recording' && localSessionId === _sessionId) {
        _mediaRecorder.stop();
      }
    });

    // Hard cap: flush after MAX_CHUNK_MS regardless
    setTimeout(() => {
      if (_mediaRecorder?.state === 'recording' && localSessionId === _sessionId) {
        _mediaRecorder.stop();
      }
    }, MAX_CHUNK_MS);

  } catch (err) {
    _onError?.(err.message || 'mic_denied');
    // Fallback to browser STT if mic setup fails
    if (_shouldRestart && localSessionId === _sessionId && isWebSpeechSupported()) {
      startBrowserSTT({
        language: _language,
        onResult: _onResult,
        onInterim: _onInterim,
        onError: _onError,
        continuous: true,
        autoRestart: true,
      });
    }
  }
}

// ── Tier 3: Local Whisper STT — offline, 4GB-RAM-safe, all 22 Indian langs ──

async function runWhisperChunk(localSessionId) {
  if (!_shouldRestart || localSessionId !== _sessionId) return;

  try {
    const stream = await ensureStream();
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm';

    _audioChunks = [];
    _mediaRecorder = new MediaRecorder(stream, { mimeType });

    _mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) _audioChunks.push(e.data);
    };

    _mediaRecorder.onstop = async () => {
      if (localSessionId !== _sessionId) return;

      const blob = new Blob(_audioChunks, { type: mimeType });
      _audioChunks = [];

      if (blob.size < 1000) {
        if (_shouldRestart && localSessionId === _sessionId && _mode === 'whisper') {
          setTimeout(() => runWhisperChunk(localSessionId), RESTART_MS);
        }
        return;
      }

      try {
        _onInterim?.('...');
        const baseLang = (_language || 'hi').split('-')[0];
        const result = await whisperTranscribe(blob, baseLang);
        const transcript = result?.transcript?.trim() || '';
        if (transcript) _onResult?.(transcript);
      } catch (err) {
        // Local Whisper failed — fall back to Sarvam with Hindi bridge
        console.warn('[STT] Local Whisper failed, falling to Sarvam bridge:', err.message);
        try {
          const langCode = getSarvamCode(_language);
          const sarvamResult = await sarvamSTT(blob, langCode);
          const transcript = sarvamResult?.transcript?.trim() || '';
          if (transcript) _onResult?.(transcript);
        } catch (sarvamErr) {
          _onError?.(sarvamErr.message || 'stt_failed');
        }
      } finally {
        if (_shouldRestart && localSessionId === _sessionId && _mode === 'whisper') {
          setTimeout(() => runWhisperChunk(localSessionId), RESTART_MS);
        }
      }
    };

    _mediaRecorder.start(250);
    _isListening = true;
    _mode = 'whisper';

    attachSilenceDetector(stream, () => {
      if (_mediaRecorder?.state === 'recording' && localSessionId === _sessionId) {
        _mediaRecorder.stop();
      }
    });

    setTimeout(() => {
      if (_mediaRecorder?.state === 'recording' && localSessionId === _sessionId) {
        _mediaRecorder.stop();
      }
    }, MAX_CHUNK_MS);

  } catch (err) {
    _onError?.(err.message || 'mic_denied');
    if (_shouldRestart && localSessionId === _sessionId) {
      _mode = 'idle';
      runSarvamChunk(localSessionId);
    }
  }
}

// ── Primary entry point ───────────────────────────────────────────────────────

/**
 * Start STT. Routes based on language:
 *   Tier-1 langs (en, hi, ta, etc.) → Browser STT → Sarvam
 *   Tier-2 langs (mai, brx, ur, etc.) → Bhashini (native) → Sarvam bridge fallback
 */
export function startSTT(opts = {}) {
  stopSTT();

  _onResult = opts.onResult || (() => {});
  _onInterim = opts.onInterim || (() => {});
  _onError = opts.onError || (() => {});
  _language = opts.language || _defaultLanguage || 'en';
  _shouldRestart = opts.continuous !== false;

  const baseLang = (_language || 'en').split('-')[0];

  // Tier-2 languages → local Whisper (browser Web Speech has no model for these)
  if (WHISPER_PREFERRED_LANGS.has(baseLang)) {
    const localSessionId = ++_sessionId;
    runWhisperChunk(localSessionId);
    return true;
  }

  // Offline + a language Whisper natively supports (en/hi/as/etc, see
  // WHISPER_LANG_MAP in localSTT.js) → skip straight to Whisper. Browser Web
  // Speech isn't reliably offline either — most browsers proxy it through
  // Google's cloud STT — and Sarvam obviously needs a network. Without this
  // branch, going offline on en/hi/as just silently fails instead of falling
  // back to the one path that's genuinely local.
  if (!navigator.onLine && OFFLINE_FALLBACK_LANGS.has(baseLang)) {
    const localSessionId = ++_sessionId;
    runWhisperChunk(localSessionId);
    return true;
  }

  // Tier-1 languages → try browser STT first (fast, interim results)
  if (isWebSpeechSupported() && opts.preferSarvam !== true) {
    const started = startBrowserSTT({
      language: _language,
      onResult: _onResult,
      onInterim: _onInterim,
      onError: (err) => {
        const criticalErrors = new Set(['not-allowed', 'service-not-allowed']);
        if (criticalErrors.has(err)) {
          _onError(err);
          return;
        }
        if (_shouldRestart && _mode === 'browser') {
          _mode = 'idle';
          const localSessionId = ++_sessionId;
          _shouldRestart = true;
          runSarvamChunk(localSessionId);
        }
      },
      continuous: true,
      autoRestart: opts.autoRestart !== false,
    });
    if (started) return true;
  }

  // Sarvam path
  const localSessionId = ++_sessionId;
  runSarvamChunk(localSessionId);
  return true;
}

export async function startMediaRecorderSTT(opts = {}) {
  stopSTT();
  _onResult = opts.onResult || (() => {});
  _onInterim = opts.onInterim || (() => {});
  _onError = opts.onError || (() => {});
  _language = opts.language || 'en';
  _shouldRestart = true;

  const localSessionId = ++_sessionId;
  await runSarvamChunk(localSessionId);
  return true;
}

export function stopSTT() {
  _shouldRestart = false;
  _sessionId += 1;

  if (_recognition) {
    try { _recognition.abort(); } catch { /* ok */ }
    _recognition = null;
  }

  if (_mediaRecorder?.state === 'recording') {
    try { _mediaRecorder.stop(); } catch { /* ok */ }
  }
  _mediaRecorder = null;

  cleanupStream();
  _mode = 'idle';
  _isListening = false;
}

export function isSTTActive() {
  return _isListening;
}

export default {
  startBrowserSTT,
  startMediaRecorderSTT,
  startSTT,
  stopSTT,
  isSTTActive,
  isWebSpeechSupported,
  configureSTT,
};
