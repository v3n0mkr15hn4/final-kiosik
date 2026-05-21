import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en.json';
import hiTranslation from './locales/hi.json';
import taTranslation from './locales/ta.json';
import asTranslation from './locales/as.json';
import { ALL_LANGUAGES } from '../utils/languageConfig';
import { translateAllStrings } from '../utils/translationService';

// Static resources for languages with full JSON locale files
const resources = {
  en: enTranslation,
  hi: hiTranslation,
  ta: taTranslation,
  as: asTranslation
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

/**
 * Load translations dynamically for a language that doesn't have a static JSON file.
 * Uses Sarvam AI Translate API with localStorage caching.
 * 
 * @param {string} langCode - Language code to load (e.g., 'bn', 'gu', 'kn')
 * @returns {Promise<boolean>} Whether translations were loaded successfully
 */
export async function loadDynamicTranslations(langCode) {
  // Already has static translations
  if (['en', 'hi', 'ta', 'as'].includes(langCode)) {
    return true;
  }

  // Check if already loaded in this session
  if (i18n.hasResourceBundle(langCode, 'translation')) {
    return true;
  }

  try {
    const translated = await translateAllStrings(enTranslation, langCode);
    const bundle = translated.translation || translated;
    i18n.addResourceBundle(langCode, 'translation', bundle, true, true);
    console.log(`[i18n] Dynamic translations loaded for: ${langCode}`);
    return true;
  } catch (error) {
    console.error(`[i18n] Failed to load translations for ${langCode}:`, error);
    // The fallback to English will kick in automatically
    return false;
  }
}

/**
 * Change language with dynamic translation support.
 * Call this instead of i18n.changeLanguage() directly.
 */
export async function changeLanguageSafe(langCode) {
  // Load translations first if needed
  await loadDynamicTranslations(langCode);
  // Then switch
  await i18n.changeLanguage(langCode);
  // Persist to sessionStorage for ModeSelection compatibility
  sessionStorage.setItem('userLanguage', langCode);
  return true;
}

/**
 * Get the list of all supported language codes for the app
 */
export function getSupportedLanguages() {
  return ALL_LANGUAGES;
}

// ← NEW: Dynamically set <html lang=""> and dir for WCAG + screen readers
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  document.documentElement.dir = ['ur', 'ks', 'sd'].includes(lng) ? 'rtl' : 'ltr';
});

export default i18n;
