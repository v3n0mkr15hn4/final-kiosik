/**
 * wakeWord.js — Wake Word Detector
 *
 * Runs a continuous, low-power Web Speech API listener in the background.
 * When "Hey Suvidha" (or any variant) is detected, fires an activation callback.
 *
 * Completely replaces the old WakeWordListener.jsx logic with a pure JS module
 * that can be controlled from VoiceAssistantProvider.
 */

import { isWakeWord, WAKE_WORDS } from '../brain/multilingualProcessor.js';
import { getSTTLangCode } from '../brain/multilingualProcessor.js';

// ── Internal state ─────────────────────────────────────────────────────────

let _recognition = null;
let _isActive = false;
let _onWakeWord = null;
let _restartTimeout = null;
let _pausedForConversation = false;
let _language = 'en';
let _sessionId = 0;

// ── Wake word listener ────────────────────────────────────────────────────

/**
 * Start background wake word detection.
 *
 * @param {Function} onWakeWord - called when wake word is detected
 * @param {string}   language   - current UI language
 */
export function startWakeWordDetection(onWakeWord, language = 'en') {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn('[WakeWord] Web Speech API not supported');
    return;
  }

  _language = language || _language;
  if (_isActive) return; // already running

  _onWakeWord = onWakeWord;
  const localSession = ++_sessionId;

  const recognition = new SpeechRecognition();
  _recognition = recognition;

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 5;
  recognition.lang = getSTTLangCode(_language);

  recognition.onresult = (event) => {
    if (_pausedForConversation) return;

    for (let i = event.resultIndex; i < event.results.length; i++) {
      // Check all alternatives
      for (let j = 0; j < event.results[i].length; j++) {
        const transcript = event.results[i][j].transcript?.toLowerCase().trim() || '';
        const normalized = transcript
          .toLowerCase()
          .replace(/[^\w\s]/g, '')
          .trim();
        console.log('Transcript:', normalized);
        if (isWakeWord(normalized)) {
          console.log('Wake word detected');
          _onWakeWord?.();
          return;
        }
      }
    }
  };

  recognition.onerror = (e) => {
    // 'network' = Web Speech can't reach Google's online ASR backend (offline /
    // blocked). It's expected on a kiosk with no internet — don't spam the log,
    // and back off harder so we're not hammering a dead endpoint every 2s.
    const ignorable = new Set(['no-speech', 'aborted', 'audio-capture', 'network']);
    if (!ignorable.has(e.error)) {
      console.warn('[WakeWord] Error:', e.error);
    }
    _isActive = false;
    scheduleRestart(localSession, e.error === 'network' ? 15000 : 2000);
  };

  recognition.onend = () => {
    _isActive = false;
    if (!_pausedForConversation) {
      scheduleRestart(localSession);
    }
  };

  try {
    recognition.start();
    _isActive = true;
    console.log('Microphone active');
    console.log('Listening...');
  } catch (err) {
    console.warn('[WakeWord] Could not start:', err.message);
  }
}

function scheduleRestart(localSession, delay = 2000) {
  if (_pausedForConversation) return;
  clearTimeout(_restartTimeout);
  _restartTimeout = setTimeout(() => {
    if (!_pausedForConversation && localSession === _sessionId) {
      startWakeWordDetection(_onWakeWord, _language);
    }
  }, delay);
}

/**
 * Stop wake word detection.
 */
export function stopWakeWordDetection() {
  clearTimeout(_restartTimeout);
  _sessionId += 1;
  if (_recognition) {
    try { _recognition.abort(); } catch { /* ok */ }
    _recognition = null;
  }
  _isActive = false;
}

/**
 * Pause wake word detection while conversation is active.
 * (Prevents wake word from triggering mid-conversation)
 */
export function pauseWakeWord() {
  _pausedForConversation = true;
  if (_recognition) {
    try { _recognition.abort(); } catch { /* ok */ }
  }
  _isActive = false;
  clearTimeout(_restartTimeout);
}

/**
 * Resume wake word detection after conversation ends.
 */
export function resumeWakeWord(language = 'en') {
  _language = language || _language;
  _pausedForConversation = false;
  clearTimeout(_restartTimeout);
  _restartTimeout = setTimeout(() => {
    startWakeWordDetection(_onWakeWord, _language);
  }, 1500);
}

export function isWakeWordActive() {
  return _isActive;
}

export { WAKE_WORDS };

export default {
  startWakeWordDetection,
  stopWakeWordDetection,
  pauseWakeWord,
  resumeWakeWord,
  isWakeWordActive,
};
