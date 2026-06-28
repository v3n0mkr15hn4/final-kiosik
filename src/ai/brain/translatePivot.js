/**
 * translatePivot.js — Assamese → English → reason → English → Assamese
 *
 * Open LLMs reason far better in English than Assamese — training data is
 * overwhelmingly English. This pivots through English for the reasoning step,
 * using sarvamTranslate() already wired for Tier-2 bridge languages.
 *
 * Only engages for Assamese. chatProxy is the server /api/chat proxy
 * injected by conversationManager.js — keeps AI key server-side.
 */
import { sarvamTranslate } from '../api/sarvamApi.js';

const PIVOT_LANGS = new Set(['as']);

export function needsPivot(language) {
  const base = (language || '').toLowerCase().split('-')[0];
  return PIVOT_LANGS.has(base);
}

/**
 * Run one conversation turn through the English pivot.
 *
 * @param {string}   userMessage  - original Assamese transcript
 * @param {string}   language     - 'as' or 'as-IN'
 * @param {string}   currentPath  - current route (e.g. '/electricity')
 * @param {Function} chatProxy    - callServerChatProxy(msg, lang, path) → reply string
 */
export async function processWithEnglishPivot(userMessage, language, currentPath, chatProxy) {
  const sourceLangCode = language.includes('-') ? language : `${language}-IN`;

  const englishUserMessage = await sarvamTranslate(userMessage, sourceLangCode, 'en-IN');

  const englishReply = await chatProxy(englishUserMessage, 'en', currentPath);
  if (!englishReply) return null;

  const [translatedResponse] = await Promise.all([
    sarvamTranslate(englishReply, 'en-IN', sourceLangCode),
  ]);

  return {
    intent: 'general_response',
    response: translatedResponse,
    speechSummary: translatedResponse,
    language: language.split('-')[0],
    confidence: 0.8,
    action: null,
    followUp: null,
    suggestions: [],
    pivoted: true,
  };
}
