/**
 * Language configuration for Indian languages
 *
 * Core static languages: English, Hindi, Tamil, Assamese (full JSON locales)
 * Dynamic languages: Bengali, Telugu, Marathi, Gujarati, Kannada, Malayalam,
 *                    Punjabi, Odia, Urdu (loaded via Sarvam Translate API at runtime)
 */

export const SARVAM_SUPPORTED_LANGUAGES = [
  'en', 'hi', 'ta', 'as', 'bn', 'te', 'mr', 'gu', 'kn', 'ml', 'pa', 'or'
];

export const ALL_LANGUAGES = [
  // ─── Core supported languages (static JSON) ───
  { code: 'en', label: 'English',    native: 'English',    script: 'Latin',      sarvamCode: 'en-IN', sttSupported: true, ttsSupported: true, translateSupported: true },
  { code: 'hi', label: 'Hindi',      native: 'हिन्दी',      script: 'Devanagari', sarvamCode: 'hi-IN', sttSupported: true, ttsSupported: true, translateSupported: true },
  { code: 'ta', label: 'Tamil',      native: 'தமிழ்',       script: 'Tamil',      sarvamCode: 'ta-IN', sttSupported: true, ttsSupported: true, translateSupported: true },
  { code: 'as', label: 'Assamese',   native: 'অসমীয়া',      script: 'Bengali',    sarvamCode: 'as-IN', sttSupported: true, ttsSupported: true, translateSupported: true },

  // ─── Additional Indian languages (dynamic via Sarvam Translate) ───
  { code: 'bn', label: 'Bengali',    native: 'বাংলা',       script: 'Bengali',    sarvamCode: 'bn-IN', sttSupported: true, ttsSupported: true, translateSupported: true },
  { code: 'te', label: 'Telugu',     native: 'తెలుగు',       script: 'Telugu',     sarvamCode: 'te-IN', sttSupported: true, ttsSupported: true, translateSupported: true },
  { code: 'mr', label: 'Marathi',    native: 'मराठी',       script: 'Devanagari', sarvamCode: 'mr-IN', sttSupported: true, ttsSupported: true, translateSupported: true },
  { code: 'gu', label: 'Gujarati',   native: 'ગુજરાતી',     script: 'Gujarati',   sarvamCode: 'gu-IN', sttSupported: true, ttsSupported: true, translateSupported: true },
  { code: 'kn', label: 'Kannada',    native: 'ಕನ್ನಡ',        script: 'Kannada',    sarvamCode: 'kn-IN', sttSupported: true, ttsSupported: true, translateSupported: true },
  { code: 'ml', label: 'Malayalam',  native: 'മലയാളം',      script: 'Malayalam',  sarvamCode: 'ml-IN', sttSupported: true, ttsSupported: true, translateSupported: true },
  { code: 'pa', label: 'Punjabi',    native: 'ਪੰਜਾਬੀ',       script: 'Gurmukhi',   sarvamCode: 'pa-IN', sttSupported: true, ttsSupported: true, translateSupported: true },
  { code: 'or', label: 'Odia',       native: 'ଓଡ଼ିଆ',        script: 'Odia',       sarvamCode: 'od-IN', sttSupported: true, ttsSupported: true, translateSupported: true },
  { code: 'ur', label: 'Urdu',       native: 'اردو',         script: 'Arabic',     sarvamCode: 'ur-IN', sttSupported: false, ttsSupported: false, translateSupported: false },
];

/**
 * Get language config by code
 */
export function getLanguageByCode(code) {
  return ALL_LANGUAGES.find(l => l.code === code) || ALL_LANGUAGES[0];
}

/**
 * Get the Sarvam API language code for a given app language code
 * Falls back to Hindi for unsupported languages with Devanagari script
 */
export function getSarvamLangCode(code) {
  const lang = getLanguageByCode(code);
  if (lang.sarvamCode) return lang.sarvamCode;
  // For Bengali-script languages, use Hindi as closest match
  if (lang.script === 'Bengali') return 'hi-IN';
  // Default fallback to Hindi
  return 'hi-IN';
}

/**
 * Check if a language is natively supported by Sarvam for translation
 */
export function isSarvamTranslateSupported(code) {
  return SARVAM_SUPPORTED_LANGUAGES.includes(code);
}

/**
 * Check if STT is supported for a language
 */
export function isSTTSupported(code) {
  const lang = getLanguageByCode(code);
  return lang.sttSupported;
}

/**
 * Check if TTS is supported for a language
 */
export function isTTSSupported(code) {
  const lang = getLanguageByCode(code);
  return lang.ttsSupported;
}

/**
 * Get languages grouped by support level for UI display
 */
export function getLanguagesByTier() {
  return {
    full: ALL_LANGUAGES.filter(l => l.translateSupported),           // Full Sarvam support
    partial: ALL_LANGUAGES.filter(l => !l.translateSupported && l.sarvamCode), // Partial support
    basic: ALL_LANGUAGES.filter(l => !l.sarvamCode),                 // Basic/bridged support
  };
}

/**
 * Get abbreviated label for header display (first 2 chars of native name)
 */
export function getAbbreviatedLabel(code) {
  const lang = getLanguageByCode(code);
  return lang.native.substring(0, 2);
}

export default ALL_LANGUAGES;
