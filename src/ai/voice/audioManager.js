/**
 * audioManager.js — Audio Session Manager
 * Manages AudioContext, mic permissions, audio unlock, and visualiser data.
 */

let _audioContext = null;
let _permissionState = 'unknown';
let _audioUnlocked = false;
let _analyser = null;
let _analyserData = null;
let _micSourceNode = null;

export function getAudioContext() {
  if (!_audioContext || _audioContext.state === 'closed') {
    _audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (_audioContext.state === 'suspended') _audioContext.resume();
  return _audioContext;
}

export async function requestMicPermission() {
  try {
    if (navigator.permissions) {
      const result = await navigator.permissions.query({ name: 'microphone' });
      _permissionState = result.state;
      if (result.state === 'granted') return true;
      if (result.state === 'denied') return false;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(t => t.stop());
    _permissionState = 'granted';
    return true;
  } catch {
    _permissionState = 'denied';
    return false;
  }
}

export function getMicPermissionState() { return _permissionState; }

export async function isMicAvailable() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.some(d => d.kind === 'audioinput');
  } catch { return false; }
}

export function unlockAudio() {
  if (_audioUnlocked) return;
  try {
    const ctx = getAudioContext();
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
    _audioUnlocked = true;
  } catch { /* ok */ }
}

export function startVisualiser(stream) {
  if (!stream) return null;
  try {
    const ctx = getAudioContext();
    _micSourceNode = ctx.createMediaStreamSource(stream);
    _analyser = ctx.createAnalyser();
    _analyser.fftSize = 256;
    _analyserData = new Uint8Array(_analyser.frequencyBinCount);
    _micSourceNode.connect(_analyser);
    return _analyser;
  } catch { return null; }
}

export function getVisualiserData() {
  if (!_analyser || !_analyserData) return null;
  _analyser.getByteFrequencyData(_analyserData);
  return _analyserData;
}

export function stopVisualiser() {
  if (_micSourceNode) { try { _micSourceNode.disconnect(); } catch { /* ok */ } _micSourceNode = null; }
  _analyser = null;
  _analyserData = null;
}

export default { getAudioContext, requestMicPermission, getMicPermissionState, isMicAvailable, unlockAudio, startVisualiser, getVisualiserData, stopVisualiser };
