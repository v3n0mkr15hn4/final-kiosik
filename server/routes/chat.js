/**
 * Chat Route — translate-bridge architecture
 *
 * Sarvam is used ONLY for translation here (STT/TTS happen client-side via
 * ttsService / speechRecognition). The answer engine is NVIDIA NIM:
 *
 *   1. Non-English input  → Sarvam translate → English
 *   2. English prompt     → NVIDIA NIM (Llama 3.3-70b, HF Gemma-2 fallback)
 *   3. English reply      → Sarvam translate → original language
 *
 * This keeps one consistent English-reasoning model instead of juggling
 * Sarvam's own multilingual chat models.
 */

import { Router } from 'express';

const router = Router();

// Per-IP rate limiter — 1 request per 3 seconds, sliding window
const rateLimitMap = new Map();
const RATE_LIMIT_MS = 3000;

function isRateLimited(ip) {
  const now = Date.now();
  const lastCall = rateLimitMap.get(ip);
  if (lastCall && now - lastCall < RATE_LIMIT_MS) return true;
  rateLimitMap.set(ip, now);
  // GC: prune stale entries every 200 unique IPs
  if (rateLimitMap.size > 200) {
    for (const [key, time] of rateLimitMap) {
      if (now - time > 60000) rateLimitMap.delete(key);
    }
  }
  return false;
}

// ── System prompt ──────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are SUVIDHA, a friendly voice assistant at a government kiosk in Assam, India. You help citizens access government services quickly and easily.

SERVICES YOU HANDLE:
- Electricity (APDCL): New connection, load extension, meter replacement/shifting, complaints, bill payment, track requests
- Gas (AGCL): New gas connection, meter issues, bills, reconnect/disconnect, prepaid conversion, complaints
- Municipal / Water: Water connection, grievances (roads, sewage, garbage, streetlights), property tax, track requests
- Healthcare: Hospital appointments, health camps, vaccination schedules, Ayushman Bharat, CMCHI scheme
- Transport: Bus routes, schedules, vehicle registration, driving licence, permit, ASTC services
- Sanitation: Swachh Bharat, toilet construction subsidy, solid waste complaints, drainage
- Government Schemes: PM-KISAN, PM Awas Yojana, MGNREGS, Orunodoi, scholarships, ration card, pension
- Complaints & Grievances: Track any submitted complaint, escalate, get status updates

REPLY RULES — FOLLOW STRICTLY:
1. Maximum 2 sentences. Never more.
2. Reply in the SAME language the user writes in.
3. Never expose your reasoning, thinking, or internal steps. Only give the final answer.
4. Guide with simple menu path: e.g. "Tap Gas → New Connection and follow the steps."
5. For unknown or off-topic questions: "I handle government services — please ask about electricity, gas, water, healthcare, transport, sanitation, or schemes."
6. Be warm, calm, direct. No technical jargon.
7. Never mention AI, models, NVIDIA, Sarvam, or any technology names.
8. For scheme queries: always mention the key eligibility criterion and the document needed.`;

// Strip <think>...</think> reasoning chains some models leak into responses
function stripThinkingTags(text) {
  if (!text) return text;
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/^[\s\S]*?<\/think>/i, '')
    .replace(/Okay,?\s+the user[\s\S]{0,300}?(?=\n|$)/i, '')
    .replace(/Let me[\s\S]{0,200}?(?=\n|$)/i, '')
    .trim();
}

const CONTEXT_MAP = {
  electricity: 'User is in the Electricity (APDCL) section. Help with new connection, load extension, meter, bills, complaints.',
  gas: 'User is in the Assam Gas (AGCL) section. Help with gas connection, meter issues, bills, reconnect, prepaid.',
  municipal: 'User is in Municipal services. Help with water connection, roads, sewage, garbage, streetlights, property tax.',
  healthcare: 'User is in Healthcare. Help with hospital appointments, Ayushman Bharat, CMCHI, vaccination, health camps.',
  transport: 'User is in Transport. Help with ASTC bus routes, vehicle registration, driving licence, permit, schedules.',
  sanitation: 'User is in Sanitation. Help with Swachh Bharat toilet subsidy, solid waste complaints, drainage.',
  schemes: 'User is in Government Schemes. Help with PM-KISAN, PM Awas, Orunodoi, scholarships, ration card, pension, MGNREGS.',
  complaints: 'User is in Complaints & Grievances. Help track submitted complaints, escalate issues, get status updates.',
  water: 'User is in Water services. Help with new water connection, pipe complaints, billing, sewage.',
};

// ── Sarvam translate — used as a bridge in/out of NVIDIA, not for chat ──────
async function translateViaSarvam(text, sourceLangCode, targetLangCode, signal) {
  const SARVAM_KEY = process.env.SARVAM_API_KEY;
  if (!SARVAM_KEY || !text?.trim() || sourceLangCode === targetLangCode) return null;

  try {
    const response = await fetch('https://api.sarvam.ai/translate', {
      method: 'POST',
      headers: {
        'api-subscription-key': SARVAM_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: text,
        source_language_code: sourceLangCode,
        target_language_code: targetLangCode,
        model: 'mayura:v1',
        mode: 'formal',
        enable_preprocessing: false,
      }),
      signal,
    });
    if (!response.ok) {
      console.warn('[Chat] Sarvam translate unavailable:', response.status);
      return null;
    }
    const data = await response.json();
    return data?.translated_text?.trim() || null;
  } catch (e) {
    if (e.name !== 'AbortError') console.warn('[Chat] Sarvam translate failed:', e.message);
    return null;
  }
}

// ── Llama-3.1-8b via NVIDIA NIM (secondary) ───────────────────────────────
async function callLlamaNIM(messages, signal) {
  const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
  if (!NVIDIA_API_KEY) return null;

  const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${NVIDIA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'meta/llama-3.3-70b-instruct',
      messages,
      max_tokens: 200,
      temperature: 0.7,
      top_p: 0.9,
    }),
    signal,
  });

  if (!response.ok) {
    const err = await response.text().catch(() => '');
    console.error('[Chat] Llama NIM error:', response.status, err.slice(0, 120));
    return null;
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content?.trim() || null;
}

// ── HuggingFace Gemma-2 (last resort) ────────────────────────────────────
async function callHuggingFace(messages, signal) {
  const HF_TOKEN = process.env.HF_TOKEN;
  if (!HF_TOKEN) return null;

  const response = await fetch(
    'https://router.huggingface.co/hf-inference/v1/chat/completions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemma-2-2b-it',
        messages,
        max_tokens: 200,
        temperature: 0.7,
        top_p: 0.9,
      }),
      signal,
    }
  );

  if (!response.ok) {
    const err = await response.text().catch(() => '');
    console.error('[Chat] HuggingFace error:', response.status, err.slice(0, 120));
    return null;
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content?.trim() || null;
}

// ── POST /api/chat ────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { message, language = 'en', context = '' } = req.body;

    // Input validation
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Message is required.' });
    }
    if (message.trim().length > 500) {
      return res.status(400).json({ success: false, error: 'Message too long.' });
    }

    // Sanitize input — strip HTML tags and control characters
    const sanitized = message.trim()
      .replace(/<[^>]*>/g, '')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    const clientIP = req.ip || req.socket?.remoteAddress || 'unknown';
    if (isRateLimited(clientIP)) {
      return res.status(429).json({
        reply: language === 'hi'
          ? 'कृपया एक पल रुकें और फिर कोशिश करें।'
          : language === 'as'
          ? 'অনুগ্ৰহ কৰি এটু ৰাওক, তাৰ পিছত চেষ্টা কৰক।'
          : 'Please wait a moment before sending another message.',
        language,
      });
    }

    // Build system prompt with page context — NVIDIA always reasons in English;
    // translation in/out of the user's language happens via Sarvam below.
    let systemPrompt = SYSTEM_PROMPT;
    const contextInfo = CONTEXT_MAP[context];
    systemPrompt += contextInfo ? `\n\nCurrent context: ${contextInfo}` : '\n\nUser is on the home screen. Give a friendly overview of available services if asked.';
    systemPrompt += '\n\nIMPORTANT: Always reply in English. The text you write will be translated separately.';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    // 0. Bridge into English via Sarvam translate (no-op if already English)
    const sarvamLangCode = `${language}-IN`;
    let englishMessage = sanitized;
    if (language && language !== 'en') {
      const translatedIn = await translateViaSarvam(sanitized, sarvamLangCode, 'en-IN', controller.signal);
      if (translatedIn) englishMessage = translatedIn;
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: englishMessage },
    ];

    let reply = null;
    let provider = 'llama-nim';

    // 1. NVIDIA NIM — Llama-3.3-70b, the answer engine
    try {
      reply = await callLlamaNIM(messages, controller.signal);
    } catch (e) {
      if (e.name !== 'AbortError') console.warn('[Chat] Llama NIM call failed:', e.message);
    }

    // 2. Last resort: HuggingFace Gemma-2
    if (!reply) {
      provider = 'huggingface';
      try {
        reply = await callHuggingFace(messages, controller.signal);
      } catch (e) {
        if (e.name !== 'AbortError') console.error('[Chat] HuggingFace call failed:', e.message);
      }
    }

    clearTimeout(timeout);

    if (!reply) {
      if (!process.env.NVIDIA_API_KEY && !process.env.HF_TOKEN) {
        console.error('[Chat] No AI provider configured — set NVIDIA_API_KEY or HF_TOKEN in .env');
        return res.json({
          reply: language === 'hi'
            ? 'AI सेवा उपलब्ध नहीं है। मेनू से सेवा चुनें।'
            : 'AI service is not configured. Please use the menu to navigate services.',
          language,
          provider: 'none',
        });
      }
      return res.json({
        reply: language === 'hi'
          ? 'सेवा अभी उपलब्ध नहीं। कृपया मेनू का उपयोग करें या फिर कोशिश करें।'
          : language === 'as'
          ? 'সেৱা এতিয়া উপলব্ধ নহয়। মেনু ব্যৱহাৰ কৰক বা পুনৰ চেষ্টা কৰক।'
          : 'Service temporarily unavailable. Please use the menu or try again.',
        language,
        provider: 'none',
      });
    }

    let cleanReply = stripThinkingTags(reply);

    // 3. Bridge back out of English via Sarvam translate
    if (language && language !== 'en') {
      const translatedOut = await translateViaSarvam(cleanReply, 'en-IN', sarvamLangCode);
      if (translatedOut) cleanReply = translatedOut;
    }

    console.log(`[Chat] Reply via ${provider} | lang=${language} | ctx=${context || 'home'}`);
    return res.json({ reply: cleanReply, language, provider: 'suvidha-ai' });

  } catch (err) {
    if (err.name === 'AbortError') {
      console.error('[Chat] Request timeout');
    } else {
      console.error('[Chat] Unhandled error:', err.message);
    }
    return res.json({
      reply: 'Service temporarily unavailable. Please use the menu or try again.',
      language: req.body?.language || 'en',
      provider: 'error',
    });
  }
});

export default router;
