/**
 * Dynamic Translation Service using Sarvam AI Translate API (Mayura v1)
 * 
 * Translates English UI strings to any of the 22 Indian languages.
 * Uses localStorage caching to avoid redundant API calls.
 * For Sarvam-supported languages: direct translation
 * For unsupported languages: bridge through closest Sarvam language
 */
import { api } from './apiService';
import { isSarvamTranslateSupported, getSarvamLangCode, getLanguageByCode } from './languageConfig';

const CACHE_PREFIX = 'suvidha_i18n_';
const CACHE_VERSION = 'v1';
const BATCH_SIZE = 25; // Translate 25 strings per API call

/**
 * Get cached translations for a language
 */
function getCachedTranslations(langCode) {
  try {
    const key = `${CACHE_PREFIX}${CACHE_VERSION}_${langCode}`;
    const cached = localStorage.getItem(key);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Cache valid for 7 days
      if (parsed.timestamp && Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) {
        return parsed.translations;
      }
    }
  } catch (e) {
    console.warn('Translation cache read error:', e);
  }
  return null;
}

/**
 * Save translations to cache
 */
function setCachedTranslations(langCode, translations) {
  try {
    const key = `${CACHE_PREFIX}${CACHE_VERSION}_${langCode}`;
    localStorage.setItem(key, JSON.stringify({
      timestamp: Date.now(),
      translations
    }));
  } catch (e) {
    console.warn('Translation cache write error:', e);
  }
}

/**
 * Flatten a nested translations object to dot-notation keys
 * e.g., { app: { title: "SUVIDHA" } } → { "app.title": "SUVIDHA" }
 */
function flattenObject(obj, prefix = '') {
  const result = {};
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(result, flattenObject(obj[key], fullKey));
    } else {
      result[fullKey] = obj[key];
    }
  }
  return result;
}

/**
 * Unflatten dot-notation keys back to nested object
 * e.g., { "app.title": "SUVIDHA" } → { app: { title: "SUVIDHA" } }
 */
function unflattenObject(obj) {
  const result = {};
  for (const key in obj) {
    const parts = key.split('.');
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = obj[key];
  }
  return result;
}

/**
 * Translate a batch of strings using Sarvam API
 */
async function translateBatch(texts, targetLangCode) {
  const sarvamCode = getSarvamLangCode(targetLangCode);
  
  try {
    const response = await api.post('/api/sarvam/batch-translate', {
      texts,
      source_language_code: 'en-IN',
      target_language_code: sarvamCode,
      speaker_gender: 'Male',
      mode: 'formal',
      model: 'mayura:v1'
    });
    
    return response.translations || texts; // fallback to original if API fails
  } catch (error) {
    console.error('Batch translation error:', error);
    return texts; // Return originals on failure
  }
}

/**
 * Translate all English strings for a target language
 * @param {object} englishTranslations - The full English translations object (nested)
 * @param {string} targetLangCode - Target language code (e.g., 'bn', 'gu')
 * @returns {object} Translated nested object in the same structure
 */
export async function translateAllStrings(englishTranslations, targetLangCode) {
  // Skip English
  if (targetLangCode === 'en') return englishTranslations;
  
  // Check cache first
  const cached = getCachedTranslations(targetLangCode);
  if (cached) {
    console.log(`[i18n] Using cached translations for ${targetLangCode}`);
    return cached;
  }
  
  console.log(`[i18n] Translating to ${targetLangCode} via Sarvam API...`);
  
  // Flatten the English object
  const flat = flattenObject(englishTranslations.translation || englishTranslations);
  const keys = Object.keys(flat);
  const values = Object.values(flat);
  
  // Filter out strings that have interpolation patterns like {{variable}} - keep them as-is
  const toTranslate = [];
  const toTranslateKeys = [];
  const preserved = {};
  
  for (let i = 0; i < keys.length; i++) {
    const val = values[i];
    if (typeof val !== 'string') {
      preserved[keys[i]] = val;
      continue;
    }
    toTranslate.push(val);
    toTranslateKeys.push(keys[i]);
  }
  
  // Translate in batches
  const translatedValues = [];
  for (let i = 0; i < toTranslate.length; i += BATCH_SIZE) {
    const batch = toTranslate.slice(i, i + BATCH_SIZE);
    const translated = await translateBatch(batch, targetLangCode);
    translatedValues.push(...translated);
    
    // Small delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < toTranslate.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  
  // Reconstruct flat object with translated values
  const translatedFlat = { ...preserved };
  for (let i = 0; i < toTranslateKeys.length; i++) {
    let translated = translatedValues[i] || toTranslate[i];
    
    // Preserve interpolation variables {{variable}}
    const originalInterpolations = toTranslate[i].match(/\{\{[^}]+\}\}/g);
    if (originalInterpolations) {
      // Make sure translated text still has them
      const translatedInterpolations = translated.match(/\{\{[^}]+\}\}/g);
      if (!translatedInterpolations || translatedInterpolations.length !== originalInterpolations.length) {
        // If API mangled the interpolations, append them
        for (const interp of originalInterpolations) {
          if (!translated.includes(interp)) {
            translated += ` ${interp}`;
          }
        }
      }
    }
    
    translatedFlat[toTranslateKeys[i]] = translated;
  }
  
  // Unflatten back to nested structure
  const result = { translation: unflattenObject(translatedFlat) };
  
  // Cache the result
  setCachedTranslations(targetLangCode, result);
  
  console.log(`[i18n] Translation to ${targetLangCode} complete (${toTranslate.length} strings)`);
  return result;
}

/**
 * Clear translation cache for a specific language or all languages
 */
export function clearTranslationCache(langCode = null) {
  if (langCode) {
    localStorage.removeItem(`${CACHE_PREFIX}${CACHE_VERSION}_${langCode}`);
  } else {
    // Clear all translation caches
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  }
}

/**
 * Get translation status for UI display
 */
export function getTranslationStatus(langCode) {
  const lang = getLanguageByCode(langCode);
  const cached = getCachedTranslations(langCode);
  
  return {
    language: lang,
    isCached: !!cached,
    isNativeSupport: isSarvamTranslateSupported(langCode),
    supportLevel: lang.translateSupported ? 'full' : (lang.sarvamCode ? 'partial' : 'basic')
  };
}
