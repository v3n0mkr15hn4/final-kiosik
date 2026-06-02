// Thin re-export — all TTS routes through ttsService to ensure one voice, one queue.
export { speak, stopTTS as stopSpeaking, isSpeaking } from '../../utils/ttsService';
export { speak as default } from '../../utils/ttsService';
