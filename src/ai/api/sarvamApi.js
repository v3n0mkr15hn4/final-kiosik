/**
 * sarvamApi.js — Sarvam AI API Client
 *
 * Handles:
 *  - Speech-to-Text  (Saarasv3)  — supports all 8 Indian languages + mixed-language
 *  - Text-to-Speech  (Bulbulv3)  — natural Indian language voices
 *  - Translation     (Mayurav1)  — auto-detect + translate
 *
 * All requests go through the backend proxy at /api/sarvam/* to keep
 * the API key off the client bundle.
 */

const BASE = '/api/sarvam';

// Language code normalisation — Sarvam uses BCP-47 codes
export const SARVAM_LANG_MAP = {
  en: 'en-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  bn: 'bn-IN',
  as: 'as-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  pa: 'pa-IN',
  or: 'or-IN',
  // Fallback bridge languages
  ur: 'hi-IN',
  mai: 'hi-IN',
  kok: 'hi-IN',
  ne: 'hi-IN',
  sa: 'hi-IN',
};

export const getSarvamCode = (lang) =>
  SARVAM_LANG_MAP[lang?.toLowerCase()?.split('-')[0]] || 'hi-IN';

// ── Speech-to-Text ──────────────────────────────────────────────────────────

/**
 * Transcribe audio blob via Sarvam Saarasv3.
 * Falls back to 'en-IN' if the language code isn't natively supported.
 *
 * @param {Blob}   audioBlob    - WebM or WAV audio blob
 * @param {string} languageCode - BCP-47 code like 'hi-IN', 'ta-IN'
 * @returns {Promise<{ transcript: string, detectedLanguage?: string }>}
 */
export async function sarvamSTT(audioBlob, languageCode = 'hi-IN') {
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
  formData.append('language_code', languageCode);
  // Enable multilingual — handles code-switching (e.g. Tamil + English)
  formData.append('model', 'saaras:v2');

  const resp = await fetch(`${BASE}/speech-to-text`, {
    method: 'POST',
    body: formData,
    signal: AbortSignal.timeout(20000),
  });

  if (!resp.ok) {
    const err = await resp.text().catch(() => '');
    throw new Error(`Sarvam STT ${resp.status}: ${err}`);
  }

  const data = await resp.json();
  return {
    transcript: data.transcript || data.text || '',
    detectedLanguage: data.language_code || languageCode,
  };
}

// ── Text-to-Speech ──────────────────────────────────────────────────────────

/**
 * Synthesise text using Sarvam Bulbulv3.
 * Returns an ArrayBuffer of audio data (MP3/WAV).
 *
 * @param {string} text           - text to synthesise
 * @param {string} languageCode   - BCP-47 code
 * @param {string} gender         - 'male' | 'female'
 * @returns {Promise<ArrayBuffer>}
 */
export async function sarvamTTS(text, languageCode = 'hi-IN', gender = 'female') {
  const resp = await fetch(`${BASE}/text-to-speech`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      inputs: [text.slice(0, 500)], // Sarvam limit
      target_language_code: languageCode,
      expected_gender: gender,
      model: 'bulbul:v1',
      enable_preprocessing: true,
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!resp.ok) {
    throw new Error(`Sarvam TTS ${resp.status}`);
  }

  return resp.arrayBuffer();
}

// ── Translation ─────────────────────────────────────────────────────────────

/**
 * Translate text using Sarvam Mayurav1.
 *
 * @param {string} text               - input text
 * @param {string} sourceLangCode     - BCP-47 source language
 * @param {string} targetLangCode     - BCP-47 target language
 * @returns {Promise<string>}          - translated text
 */
export async function sarvamTranslate(text, sourceLangCode, targetLangCode) {
  const resp = await fetch(`${BASE}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: text,
      source_language_code: sourceLangCode,
      target_language_code: targetLangCode,
      speaker_gender: 'Male',
      mode: 'formal',
      model: 'mayura:v1',
      enable_preprocessing: false,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!resp.ok) {
    throw new Error(`Sarvam Translate ${resp.status}`);
  }

  const data = await resp.json();
  return data.translated_text || text;
}

// ── Language Detection ──────────────────────────────────────────────────────

/**
 * Detect the primary language in a transcript using heuristics.
 * Returns a base language code like 'ta', 'hi', 'en', etc.
 */
export function detectLanguageFromText(text) {
  if (!text) return 'en';

  const patterns = {
    ta: /[\u0B80-\u0BFF]/,
    hi: /[\u0900-\u097F]/,
    bn: /[\u0980-\u09FF]/,
    as: /[\u0980-\u09FF]/, // Same Unicode range as Bengali; disambiguate by context
    te: /[\u0C00-\u0C7F]/,
    kn: /[\u0C80-\u0CFF]/,
    ml: /[\u0D00-\u0D7F]/,
    gu: /[\u0A80-\u0AFF]/,
    pa: /[\u0A00-\u0A7F]/,
    or: /[\u0B00-\u0B7F]/,
  };

  for (const [lang, re] of Object.entries(patterns)) {
    if (re.test(text)) return lang;
  }

  return 'en';
}

export default { sarvamSTT, sarvamTTS, sarvamTranslate, detectLanguageFromText, getSarvamCode };
