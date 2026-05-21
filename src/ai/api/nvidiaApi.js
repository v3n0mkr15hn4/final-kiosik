/**
 * nvidiaApi.js — NVIDIA NIM Multi-Model AI Client
 *
 * Model routing strategy:
 *  PRIMARY   nvidia/llama-3.1-nemotron-ultra-253b-v1  → deep reasoning, multilingual
 *  FAST      meta/llama-3.3-70b-instruct              → quick responses, 22-language capable
 *  VISION    meta/llama-3.2-11b-vision-instruct       → Aadhaar card / document OCR
 *  TRANSLATE mistralai/mixtral-8x7b-instruct-v0.1    → regional language translation
 */

const NVIDIA_BASE = 'https://integrate.api.nvidia.com/v1';

// Model catalogue — ordered by capability
export const MODELS = {
  PRIMARY:   'meta/llama-3.3-70b-instruct',          // fast, excellent multilingual
  NEMOTRON:  'nvidia/llama-3.1-nemotron-ultra-253b-v1', // ultra quality (use only for complex)
  VISION:    'meta/llama-3.2-11b-vision-instruct',   // Aadhaar card OCR
  TRANSLATE: 'mistralai/mixtral-8x7b-instruct-v0.1', // regional language translation
  COMPACT:   'meta/llama-3.1-8b-instruct',           // lightweight fallback
  FAST:      'meta/llama-3.1-8b-instruct',           // alias
};

const getApiKey = () => import.meta.env.VITE_NVIDIA_API_KEY || '';

// Track model health to auto-fallback
const modelHealth = {};
const markUnhealthy = (model) => { modelHealth[model] = Date.now(); };
const isUnhealthy = (model) => (Date.now() - (modelHealth[model] || 0)) < 60_000;

function pickModel(preferred = MODELS.PRIMARY) {
  if (!isUnhealthy(preferred)) return preferred;
  if (!isUnhealthy(MODELS.FAST)) return MODELS.FAST;
  return MODELS.COMPACT;
}

/**
 * Core chat completion — handles streaming, fallback, JSON parsing.
 */
export async function callNvidiaAI(messages, options = {}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('[NVIDIA NIM] No API key');
    return buildOfflineFallback(messages);
  }

  const preferred = options.model || MODELS.PRIMARY;
  const model = pickModel(preferred);
  const useStream = options.stream !== false && !!options.onChunk;

  // response_format:json_object NOT compatible with streaming on most models
  const wantJson = options.jsonMode !== false && !useStream;

  const body = {
    model,
    messages,
    temperature: options.temperature ?? 0.3,
    top_p: 0.7,
    max_tokens: options.maxTokens ?? 600,
    stream: useStream,
    ...(wantJson && { response_format: { type: 'json_object' } }),
  };

  console.log(`[NVIDIA NIM] → ${model} stream=${useStream} json=${wantJson}`);

  try {
    const resp = await fetch(`${NVIDIA_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20_000),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      console.error(`[NVIDIA NIM] ${model} HTTP ${resp.status}: ${errText.slice(0, 200)}`);
      markUnhealthy(model);
      if (model !== MODELS.COMPACT) {
        return callNvidiaAI(messages, { ...options, model: MODELS.FAST });
      }
      return buildOfflineFallback(messages);
    }

    if (useStream) {
      return await consumeStream(resp, options.onChunk);
    }

    const data = await resp.json();
    const raw = data?.choices?.[0]?.message?.content || '{}';
    return safeParseJSON(raw);

  } catch (err) {
    console.error('[NVIDIA NIM] Request failed:', err.message);
    markUnhealthy(model);
    return buildOfflineFallback(messages);
  }
}

/**
 * Vision model — analyse image (base64) and extract text / Aadhaar data.
 */
export async function callVisionModel(imageBase64, prompt, mimeType = 'image/jpeg') {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  const messages = [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: prompt,
        },
        {
          type: 'image_url',
          image_url: { url: `data:${mimeType};base64,${imageBase64}` },
        },
      ],
    },
  ];

  try {
    const resp = await fetch(`${NVIDIA_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODELS.VISION,
        messages,
        temperature: 0.1,
        max_tokens: 400,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!resp.ok) return null;
    const data = await resp.json();
    return data?.choices?.[0]?.message?.content || null;
  } catch (err) {
    console.error('[NVIDIA Vision] Failed:', err.message);
    return null;
  }
}

/**
 * Fast translation — translate text to/from any of 22 Indian languages.
 */
export async function translateText(text, targetLang, sourceLang = 'auto') {
  const apiKey = getApiKey();
  if (!apiKey) return text;

  const LANG_NAMES = {
    as: 'Assamese', bn: 'Bengali', brx: 'Bodo', doi: 'Dogri',
    gu: 'Gujarati', hi: 'Hindi', kn: 'Kannada', ks: 'Kashmiri',
    kok: 'Konkani', mai: 'Maithili', ml: 'Malayalam', mni: 'Manipuri',
    mr: 'Marathi', ne: 'Nepali', or: 'Odia', pa: 'Punjabi',
    sa: 'Sanskrit', sat: 'Santali', sd: 'Sindhi', ta: 'Tamil',
    te: 'Telugu', ur: 'Urdu', en: 'English',
  };

  const targetName = LANG_NAMES[targetLang] || targetLang;

  const messages = [
    {
      role: 'system',
      content: `You are a translator. Translate the given text to ${targetName}. Return ONLY the translated text, nothing else.`,
    },
    { role: 'user', content: text },
  ];

  try {
    const result = await callNvidiaAI(messages, {
      model: MODELS.TRANSLATE,
      jsonMode: false,
      maxTokens: 300,
      temperature: 0.1,
    });
    return typeof result === 'string' ? result : (result?.response || text);
  } catch {
    return text;
  }
}

// ── Stream reader ─────────────────────────────────────────────────────────

async function consumeStream(resp, onChunk) {
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === '[DONE]') continue;
      try {
        const chunk = JSON.parse(jsonStr);
        const delta = chunk?.choices?.[0]?.delta?.content || '';
        if (delta) {
          fullText += delta;
          onChunk(delta, fullText);
        }
      } catch { /* malformed chunk */ }
    }
  }

  return safeParseJSON(fullText);
}

// ── Helpers ───────────────────────────────────────────────────────────────

function safeParseJSON(raw) {
  if (!raw) return buildErrorResponse();
  let cleaned = raw
    .replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) cleaned = match[0];
  try {
    return JSON.parse(cleaned);
  } catch {
    return {
      intent: 'general_response',
      response: raw.replace(/[{}"]/g, '').trim().slice(0, 500),
      language: 'en',
      action: null,
    };
  }
}

function buildOfflineFallback(messages) {
  const lastUser = [...messages].reverse().find(m => m.role === 'user');
  return {
    intent: 'offline_mode',
    response: 'AI assistant is currently unavailable. Please use the menu to access services.',
    language: 'en',
    action: null,
    offline: true,
    originalQuery: lastUser?.content || '',
  };
}

function buildErrorResponse() {
  return {
    intent: 'error',
    response: 'I encountered an issue. Please try again or use the navigation menu.',
    language: 'en',
    action: null,
  };
}

export default { callNvidiaAI, callVisionModel, translateText, MODELS };
