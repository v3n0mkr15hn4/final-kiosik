/**
 * speechRecognition.js - Unified STT Manager
 *
 * Primary: Sarvam STT (chunked continuous loop)
 * Fallback: Web Speech API
 */

import { sarvamSTT, getSarvamCode } from '../api/sarvamApi.js';
import { getSTTLangCode } from '../brain/multilingualProcessor.js';

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
let _mode = 'idle'; // idle | sarvam | browser

const SARVAM_CHUNK_MS = 4500;
const RESTART_MS = 500;

export function isWebSpeechSupported() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function cleanupStream() {
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

    if (interim) {
      console.log('Transcript:', interim);
      _onInterim(interim);
    }
    if (final) {
      console.log('Transcript:', final);
      _onResult(final);
    }
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
        try {
          if (_shouldRestart && !_isListening && localSessionId === _sessionId) {
            console.log('Restarting listener');
            recognition.start();
            _isListening = true;
            console.log('Listening...');
          }
        } catch {
          // noop
        }
      }, RESTART_MS);
    }
  };

  try {
    recognition.start();
    _isListening = true;
    _mode = 'browser';
    console.log('Microphone active');
    console.log('Listening...');
    return true;
  } catch {
    return false;
  }
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

      try {
        _onInterim?.('...');
        const langCode = getSarvamCode(_language);
        const result = await sarvamSTT(blob, langCode);
        const transcript = result?.transcript?.trim() || '';
        if (transcript) {
          console.log('Transcript:', transcript);
          _onResult?.(transcript);
        }
      } catch (err) {
        _onError?.(err.message || 'stt_failed');
      } finally {
        if (_shouldRestart && localSessionId === _sessionId && _mode === 'sarvam') {
          setTimeout(() => {
            console.log('Restarting listener');
            runSarvamChunk(localSessionId);
          }, RESTART_MS);
        }
      }
    };

    _mediaRecorder.start(250);
    _isListening = true;
    _mode = 'sarvam';
    console.log('Microphone active');
    console.log('Listening...');

    setTimeout(() => {
      if (_mediaRecorder?.state === 'recording' && localSessionId === _sessionId) {
        _mediaRecorder.stop();
      }
    }, SARVAM_CHUNK_MS);
  } catch (err) {
    _onError?.(err.message || 'mic_denied');
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

export function startSTT(opts = {}) {
  return startMediaRecorderSTT(opts);
}

export function stopSTT() {
  _shouldRestart = false;
  _sessionId += 1;

  if (_recognition) {
    try { _recognition.abort(); } catch {}
    _recognition = null;
  }

  if (_mediaRecorder?.state === 'recording') {
    try { _mediaRecorder.stop(); } catch {}
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
};
