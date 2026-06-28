/**
 * vadDetector.js — Silero VAD (neural) replacement for the RMS-energy silence
 * loop in speechRecognition.js. RMS-threshold misfires on kiosk ambient noise
 * (AC hum, crowd, fluorescent buzz); Silero VAD is a real speech classifier.
 *
 * Assets served from /public (copied from node_modules at build time):
 *   silero_vad_v5.onnx, vad.worklet.bundle.min.js, ort-wasm-simd-threaded*.wasm
 */
import { MicVAD } from '@ricky0123/vad-web';

let _vad = null;

/**
 * Start neural VAD on the given (already-open) MediaStream.
 * onSpeechStart fires the instant speech is detected — used for barge-in.
 * onSpeechEnd fires after trailing silence — used to flush the STT chunk.
 *
 * @param {MediaStream} stream
 * @param {{ onSpeechStart?: () => void, onSpeechEnd?: () => void }} handlers
 */
export async function startVAD(stream, { onSpeechStart, onSpeechEnd } = {}) {
  stopVAD();

  _vad = await MicVAD.new({
    stream,
    baseAssetPath: '/',
    onnxWASMBasePath: '/',
    model: 'v5',
    positiveSpeechThreshold: 0.6,
    negativeSpeechThreshold: 0.4,
    minSpeechFrames: 3,
    onSpeechStart: () => onSpeechStart?.(),
    onSpeechEnd: () => onSpeechEnd?.(),
  });

  _vad.start();
  return _vad;
}

export function stopVAD() {
  if (_vad) {
    try { _vad.pause(); } catch { /* ok */ }
    try { _vad.destroy(); } catch { /* ok */ }
    _vad = null;
  }
}

export function isVADActive() {
  return _vad !== null;
}
