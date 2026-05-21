/**
 * transcriptManager.js — Live Transcript State Manager
 * Manages interim and final transcript display during voice input.
 */

let _subscribers = [];
let _interimText = '';
let _finalText = '';
let _history = [];

function notify() {
  const state = { interim: _interimText, final: _finalText, history: [..._history] };
  _subscribers.forEach(fn => fn(state));
}

export function subscribeTranscript(fn) {
  _subscribers.push(fn);
  return () => { _subscribers = _subscribers.filter(s => s !== fn); };
}

export function setInterimTranscript(text) {
  _interimText = text || '';
  notify();
}

export function setFinalTranscript(text) {
  _finalText = text || '';
  _interimText = '';
  if (text?.trim()) {
    _history.push({ text, timestamp: Date.now(), type: 'user' });
    if (_history.length > 50) _history = _history.slice(-50);
  }
  notify();
}

export function addAITranscript(text) {
  if (text?.trim()) {
    _history.push({ text, timestamp: Date.now(), type: 'ai' });
    if (_history.length > 50) _history = _history.slice(-50);
  }
  notify();
}

export function clearTranscript() {
  _interimText = '';
  _finalText = '';
  notify();
}

export function getTranscriptHistory() {
  return [..._history];
}

export default { subscribeTranscript, setInterimTranscript, setFinalTranscript, addAITranscript, clearTranscript, getTranscriptHistory };
