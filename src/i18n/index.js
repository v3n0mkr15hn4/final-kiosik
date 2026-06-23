import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en.json';
import hiTranslation from './locales/hi.json';
import taTranslation from './locales/ta.json';
import asTranslation from './locales/as.json';
import bnTranslation from './locales/bn.json';
import teTranslation from './locales/te.json';
import mrTranslation from './locales/mr.json';
import guTranslation from './locales/gu.json';
import knTranslation from './locales/kn.json';
import mlTranslation from './locales/ml.json';
import paTranslation from './locales/pa.json';
import orTranslation from './locales/or.json';
import urTranslation from './locales/ur.json';
import maiTranslation from './locales/mai.json';
import kokTranslation from './locales/kok.json';
import doiTranslation from './locales/doi.json';
import neTranslation from './locales/ne.json';
import saTranslation from './locales/sa.json';
import brxTranslation from './locales/brx.json';
import ksTranslation from './locales/ks.json';
import mniTranslation from './locales/mni.json';
import satTranslation from './locales/sat.json';
import sdTranslation from './locales/sd.json';
import { ALL_LANGUAGES } from '../utils/languageConfig';
import { translateAllStrings } from '../utils/translationService';

// Static resources — all 23 languages ship with a translated JSON locale file.
// Dynamic Sarvam-API translation (loadDynamicTranslations below) only kicks in
// as a fallback for a language code that isn't in this list.
const resources = {
  en: enTranslation,
  hi: hiTranslation,
  ta: taTranslation,
  as: asTranslation,
  bn: bnTranslation,
  te: teTranslation,
  mr: mrTranslation,
  gu: guTranslation,
  kn: knTranslation,
  ml: mlTranslation,
  pa: paTranslation,
  or: orTranslation,
  ur: urTranslation,
  mai: maiTranslation,
  kok: kokTranslation,
  doi: doiTranslation,
  ne: neTranslation,
  sa: saTranslation,
  brx: brxTranslation,
  ks: ksTranslation,
  mni: mniTranslation,
  sat: satTranslation,
  sd: sdTranslation
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
  // Already has a static translation bundle — no API call needed
  if (Object.prototype.hasOwnProperty.call(resources, langCode)) {
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
  const baseLanguage = (lng || 'en').toLowerCase().split('-')[0];
  document.documentElement.lang = baseLanguage;
  document.documentElement.dir = ['ur', 'ks', 'sd'].includes(baseLanguage) ? 'rtl' : 'ltr';
});

export default i18n;
