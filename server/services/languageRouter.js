/**
 * Language Router — Smart routing for 22 Indian languages
 * Uses Sarvam AI for supported languages (12), HuggingFace for the rest (10).
 * Never throws — always returns { error: true, message } on failure.
 */

import axios from 'axios';

// ← NEW: Sarvam-first languages (already handled by existing sarvam.js)
const SARVAM_LANGS = ['hi', 'en', 'ta', 'te', 'kn', 'ml', 'mr', 'gu', 'bn', 'or', 'pa', 'as'];

// ← NEW: IndicTrans2 flores200 language codes
const LANG_MAP = {
  as: 'asm_Beng', bn: 'ben_Beng', bo: 'bod_Tibt',
  doi: 'doi_Deva', gu: 'guj_Gujr', hi: 'hin_Deva',
  kn: 'kan_Knda', ks: 'kas_Arab', kok: 'kok_Deva',
  mai: 'mai_Deva', ml: 'mal_Mlym', mni: 'mni_Mtei',
  mr: 'mar_Deva', ne: 'npi_Deva', or: 'ory_Orya',
  pa: 'pan_Guru', sa: 'san_Deva', sat: 'sat_Olck',
  sd: 'snd_Arab', ta: 'tam_Taml', te: 'tel_Telu',
  ur: 'urd_Arab', en: 'eng_Latn',
};

// HF endpoints
const HF_BASE = 'https://router.huggingface.co/hf-inference/models';
const HF_WHISPER = `${HF_BASE}/openai/whisper-large-v3`;
const HF_INDIC_EN = `${HF_BASE}/ai4bharat/indictrans2-indic-en-dist-200M`;
const HF_EN_INDIC = `${HF_BASE}/ai4bharat/indictrans2-en-indic-dist-200M`;
const HF_PARLER_TTS = `${HF_BASE}/ai4bharat/indic-parler-tts`;

const getHFToken = () => process.env.HF_TOKEN || '';

// ← NEW: TTS response cache (max 50 entries)
const ttsCache = new Map();
const TTS_CACHE_MAX = 50;

function cacheTTS(key, value) {
  if (ttsCache.size >= TTS_CACHE_MAX) {
    const firstKey = ttsCache.keys().next().value;
    ttsCache.delete(firstKey);
  }
  ttsCache.set(key, value);
}

// ← NEW: Debounce guard per function
const lastCallTimes = { stt: 0, translate: 0, tts: 0 };
const DEBOUNCE_MS = 500;

function debounceGuard(fnName) {
  const now = Date.now();
  if (now - lastCallTimes[fnName] < DEBOUNCE_MS) {
    return true; // debounced
  }
  lastCallTimes[fnName] = now;
  return false;
}

// ── Helper: Make HF API call with timeout ──
async function hfFetch(url, options, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response;
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

/**
 * Route STT — Sarvam for supported langs, Whisper for others
 * @param {Buffer} audioBuffer - Raw audio (WAV/WEBM)
 * @param {string} langCode - BCP-47 language code
 * @returns {{ text: string, provider: string } | { error: true, message: string }}
 */
export async function routeSTT(audioBuffer, langCode) {
  if (debounceGuard('stt')) {
    return { error: true, message: 'Too many requests. Please wait.' };
  }

  try {
    if (SARVAM_LANGS.includes(langCode)) {
      // Use existing Sarvam STT (internal call)
      const FormData = (await import('form-data')).default;
      const formData = new FormData();
      formData.append('file', audioBuffer, {
        filename: 'recording.webm',
        contentType: 'audio/webm',
      });
      formData.append('model', 'saaras:v3');
      formData.append('language_code', langCode === 'en' ? 'en-IN' : `${langCode}-IN`);

      const config = {
        baseURL: 'https://api.sarvam.ai',
        headers: { 'api-subscription-key': process.env.SARVAM_API_KEY || 'test-key' },
      };

      const resp = await axios.post(`${config.baseURL}/speech-to-text`, formData, {
        headers: { ...config.headers, ...formData.getHeaders() },
        timeout: 5000,
      });

      return { text: resp.data?.transcript || resp.data?.text || '', provider: 'sarvam' };
    }

    // HF Whisper
    const token = getHFToken();
    if (!token) return { error: true, message: 'HF_TOKEN not configured.' };

    const resp = await hfFetch(HF_WHISPER, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'audio/wav',
      },
      body: audioBuffer,
    });

    if (!resp.ok) {
      const err = await resp.text().catch(() => '');
      return { error: true, message: `Whisper STT failed: ${resp.status} ${err}` };
    }

    const data = await resp.json();
    return { text: data?.text || '', provider: 'whisper' };
  } catch (err) {
    return { error: true, message: `STT error: ${err.message}` };
  }
}

/**
 * Route Translation — IndicTrans2 for Indic↔English
 * @param {string} text - Text to translate
 * @param {string} sourceLang - Source language code
 * @param {string} targetLang - Target language code
 * @returns {{ text: string, provider: string } | { error: true, message: string }}
 */
export async function routeTranslate(text, sourceLang, targetLang) {
  if (debounceGuard('translate')) {
    return { error: true, message: 'Too many requests. Please wait.' };
  }

  try {
    // Passthrough if same language
    if (sourceLang === targetLang) {
      return { text, provider: 'passthrough' };
    }

    const token = getHFToken();
    if (!token) return { error: true, message: 'HF_TOKEN not configured.' };

    const srcFlores = LANG_MAP[sourceLang];
    const tgtFlores = LANG_MAP[targetLang];

    if (!srcFlores || !tgtFlores) {
      return { error: true, message: `Unsupported language: ${sourceLang} or ${targetLang}` };
    }

    // Determine which model to use
    if (sourceLang === 'en') {
      // English → Indic
      const result = await callIndicTrans(HF_EN_INDIC, text, 'eng_Latn', tgtFlores, token);
      return result;
    } else if (targetLang === 'en') {
      // Indic → English
      const result = await callIndicTrans(HF_INDIC_EN, text, srcFlores, 'eng_Latn', token);
      return result;
    } else {
      // Indic → Indic: two-step via English
      const step1 = await callIndicTrans(HF_INDIC_EN, text, srcFlores, 'eng_Latn', token);
      if (step1.error) return step1;

      const step2 = await callIndicTrans(HF_EN_INDIC, step1.text, 'eng_Latn', tgtFlores, token);
      return step2;
    }
  } catch (err) {
    return { error: true, message: `Translation error: ${err.message}` };
  }
}

// Helper: Call IndicTrans2 model
async function callIndicTrans(modelUrl, text, srcLang, tgtLang, token) {
  try {
    const resp = await hfFetch(modelUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: text,
        parameters: { src_lang: srcLang, tgt_lang: tgtLang },
      }),
    });

    if (!resp.ok) {
      const err = await resp.text().catch(() => '');
      return { error: true, message: `IndicTrans2 failed: ${resp.status} ${err}` };
    }

    const data = await resp.json();
    const translated = Array.isArray(data)
      ? data[0]?.translation_text || ''
      : data?.translation_text || '';

    return { text: translated || text, provider: 'indictrans2' };
  } catch (err) {
    return { error: true, message: `IndicTrans2 error: ${err.message}` };
  }
}

/**
 * Route TTS — Sarvam for supported langs, indic-parler-tts for others
 * @param {string} text - Text to speak
 * @param {string} langCode - Language code
 * @returns {{ audioBase64: string, provider: string } | { error: true, message: string }}
 */
export async function routeTTS(text, langCode) {
  if (debounceGuard('tts')) {
    return { error: true, message: 'Too many requests. Please wait.' };
  }

  // Check TTS cache
  const cacheKey = `${langCode}:${text.slice(0, 40)}`;
  if (ttsCache.has(cacheKey)) {
    const cached = ttsCache.get(cacheKey);
    return { ...cached, provider: cached.provider + ' (cached)' };
  }

  try {
    if (SARVAM_LANGS.includes(langCode)) {
      // Use Sarvam TTS
      const config = {
        baseURL: 'https://api.sarvam.ai',
        headers: {
          'api-subscription-key': process.env.SARVAM_API_KEY || 'test-key',
          'Content-Type': 'application/json',
        },
      };

      const sarvamLangCode = langCode === 'en' ? 'en-IN' : `${langCode}-IN`;
      const resp = await axios.post(
        `${config.baseURL}/text-to-speech`,
        {
          inputs: [text],
          target_language_code: sarvamLangCode,
          speaker_gender: 'female',
          model: 'bulbul:v3',
        },
        { headers: config.headers, timeout: 5000 }
      );

      if (resp.data?.audios?.[0]) {
        const result = { audioBase64: resp.data.audios[0], provider: 'sarvam' };
        cacheTTS(cacheKey, result);
        return result;
      }
      return { error: true, message: 'Sarvam TTS returned no audio.' };
    }

    // HF indic-parler-tts
    const token = getHFToken();
    if (!token) return { error: true, message: 'HF_TOKEN not configured.' };

    const resp = await hfFetch(HF_PARLER_TTS, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: text,
        parameters: {
          description: 'A female speaker delivers clear speech with no background noise.',
        },
      }),
    }, 8000); // TTS may take longer

    if (!resp.ok) {
      const err = await resp.text().catch(() => '');
      return { error: true, message: `Parler TTS failed: ${resp.status} ${err}` };
    }

    const audioBuffer = await resp.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');
    const result = { audioBase64, provider: 'parler-tts' };
    cacheTTS(cacheKey, result);
    return result;
  } catch (err) {
    return { error: true, message: `TTS error: ${err.message}` };
  }
}

export default { routeSTT, routeTranslate, routeTTS, SARVAM_LANGS, LANG_MAP };
