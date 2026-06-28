# SUVIDHA Kiosk — Full App Flow (current, verified state)

This reflects what's actually in the codebase and confirmed working — not aspirational. Where something is unverified or has a known gap, it's marked explicitly.

---

## 1. Boot sequence

```
Citizen approaches kiosk
  → Landing page loads (PWA, React + Vite)
  → "Citizen Login (Aadhaar)" or "Guest" or "Blind / Hands-free"
```

Confirmed live via Playwright: landing renders clean, zero console errors, 14 interactive elements.

---

## 2. Identity — Aadhaar QR or Guest

```
Aadhaar path:
  Camera opens (consent gate first, HMAC token, 5min TTL)
    → jsQR (WASM) decodes QR
    → starts with '<' → parse XML → name/dob/gender/address
    → starts with digit → v2 Secure QR (protobuf)
    → starts with 'DEMO:' → JSON (testing)
    → NVIDIA Vision OCR fallback if scan fails (meta/llama-3.2-11b-vision-instruct)
    → stored in sessionStorage, no UIDAI network call needed

Guest path:
  → skip straight to language select, read-only/limited access

Mobile number is NOT in standard Aadhaar QR — collected separately via OTP or voice.
```

---

## 3. Language selection

```
LanguageSelection.jsx → 24 language tiles (grid, React key fixed this session —
                         was colliding on shared Sarvam codes for bridge langs)
  → setLanguage(sarvamCode) → SessionContext → configureTTS() + configureSTT()
  → navigate('/voice-select')
```

Confirmed live (Playwright): selecting Assamese (অসমীয়া) re-renders entire UI
in Assamese script, zero errors.

```
VoiceSelection → opt-in voice (off by default)
  → setVoiceEnabled(true) → ttsService._session.voiceEnabled = true
  → from here, all speak() calls actually produce audio
```

---

## 4. STT — speech to text

**File:** `src/ai/voice/speechRecognition.js`

```
startSTT({ language })
  │
  ├─ lang in WHISPER_PREFERRED_LANGS (ur,mai,kok,doi,ne,sa,brx,ks,mni,sat,sd)
  │     → Tier 3: Local Whisper-small (offline, transformers.js/ONNX)
  │       fail → Sarvam bridge (hi-IN/bn-IN)
  │
  ├─ Tier 1: Browser Web Speech API (default — fast, interim results)
  │     critical error (not-allowed) → stop
  │     other error → Tier 2
  │
  └─ Tier 2: Sarvam Saaras v3 (MediaRecorder, chunked on Silero VAD speech-end)
```

**Assamese specifically:** routes to Sarvam `as-IN` directly (NOT bridged, NOT
Whisper) — confirmed correct in code, confirmed live. WER ~28-38% per
ai4bharat benchmark tier — best available without fine-tuning (verified by
checking real alternatives, none beat it without further work).

**VAD gate** — `src/ai/voice/vadDetector.js` (built this session). Replaces
old RMS-energy loop (misfired on kiosk ambient noise). Wraps Silero VAD v5
ONNX:
- `onSpeechEnd` → flushes MediaRecorder chunk to STT
- `onSpeechStart` → barge-in: kills TTS mid-sentence if user starts talking

---

## 5. Routing — two independent layers

### Navigation intent (fast path, offline-capable)

**File:** `src/ai/brain/semanticIntentMatcher.js`

```
transcript → MiniLM embed (Xenova/paraphrase-multilingual-MiniLM-L12-v2, 90MB)
           → cosine similarity vs INTENT_EXAMPLES
           → confidence ≥ 0.52 → { intent, confidence }
           → intentRouter.js → React Router navigate()
```

All 22 langs natively (multilingual embedding, no translation step). Runs
before any LLM call for simple navigation commands.

### Page announcement

**File:** `src/components/VoiceInstructionEngine.jsx`

```
route changes → ROUTE_INSTRUCTIONS[pathname] text
             → speak(text, { staticKey: ROUTE_STATIC_KEYS[pathname] })
```
Fires once per route per session. Static audio (Tier 0, below) plays for
en/as if a key matches; otherwise falls through TTS tiers.

---

## 6. AI Chatbot

**File:** `server/routes/chat.js`

```
4-tier model cascade:
  0. sarvam-105b           (Sarvam direct — best Indian-language quality)
  1. sarvamai/sarvam-m     (NVIDIA NIM, 24B)
  2. meta/llama-3.1-8b-instruct (NVIDIA NIM, English fallback)
  3. google/gemma-2-2b-it  (HuggingFace, last resort)
```

Rate-limited 1 req/3sec/IP. Strips leaked `<think>` reasoning tags. System
prompt currently scoped to electricity/gas/municipal only — doesn't mention
healthcare/transport/sanitation/schemes (gap, not yet fixed).

**Known weakness:** prompt instructs the LLM to "reply in the SAME language
the user writes in" — forces direct Assamese reasoning, which open models
handle worse than English. A translate-pivot (Assamese→English→reason→
Assamese, using the already-wired `sarvamTranslate()`) would improve quality
but isn't built yet — discussed, not implemented.

### Offline RAG

**Files:** `src/ai/brain/promptBuilder.js`, `src/ai/prompts/serviceKnowledge.js`

```
buildKnowledgeSummary() → static knowledge base, pre-built (no vector DB)
getRelevantKnowledge(path) → filters to current page's category + schemes + revenue
  → injected into LLM system prompt
```
Works fully offline for FAQ-type queries — no embedding/retrieval step needed,
just path-based filtering of a static knowledge object.

---

## 7. TTS — text to speech

**File:** `src/utils/ttsService.js`

```
speak(text, { staticKey, language, priority })
  │
  ├─ Tier 0: Static pre-recorded MP3 (staticAudioMap.js, built this session)
  │     en/as only, ~80 real human-recorded files, zero-latency
  │
  ├─ Tier 1: In-memory cache
  ├─ Tier 2: IndexedDB cache (offlineAudioCache.js)
  ├─ Tier 3: Sarvam streaming TTS (~200ms)
  ├─ Tier 4: Sarvam batch TTS
  └─ Tier 5: Browser SpeechSynthesis (always available, lowest quality)
```

**Assamese TTS gap, found in your own code comment**
(`server/routes/sarvam.js:372`):
```js
'as-IN': 'anand',    // Assamese → bridge to Hindi voice (Sarvam as-IN needs beta)
```
Sarvam's native Assamese TTS is in beta — silently uses the Hindi voice
"anand" for anything not covered by your static MP3s. Your own 80 recordings
(Tier 0) are real Assamese audio and bypass this entirely for the phrases
they cover. Dynamic text (citizen names, AI responses, anything outside the
80 keys) still hits the Hindi-bridge voice.

No-op entirely until voice is opted in (`_session.voiceEnabled`).

---

## 8. Form filling — two mechanisms

### Generic field detection

**File:** `src/ai/actions/formActions.js`

```
fillField(name, value)
  ├─ <input>/<textarea> → native value setter + dispatch input/change
  └─ <button data-voice-field> (custom Select.jsx)
        → dispatch 'voicefill' CustomEvent
        → Select.jsx fuzzy-matches spoken value against its own options
```
(Select.jsx fix from this session — it's a custom listbox, not native
`<select>`, generic DOM value-setting didn't work on it before.)

`normaliseFieldValue()` — spoken digits→numerals (aadhaar/phone/pincode),
title-case names, email de-spacing. `validateField()` — format checks.

### Sequential voice wizard

**File:** `src/hooks/useVoiceFormWizard.js` (built this session)

```
start() → askField(0)
            speak(prompt, { staticKey }) → listenForField()
                startSTT() → onResult → handleResult()
                    "skip" + optional field → ask_shared_skip_ack → advance
                    invalid/empty → retry (max 3) → ask_shared_invalid
                    valid → fillField() → ask_shared_confirm → advance
            timeout (8s silence) → ask_shared_repeat → re-listen
→ all fields done → onComplete()
```

**Wired into:** `MunicipalGrievance.jsx` only (name/mobile/state/city/ward/
description). Same pattern not yet rolled out to the other 8 forms
(Electricity, Gas, Water, Healthcare, Transport, Sanitation, etc.).

---

## 9. Submission → Supabase → Portal

**Files:** `src/utils/supabaseSync.js`, `src/utils/apiService.js`

```
serviceAPI.submit(data) / complaintAPI.submit(data)
  → try: submitToSupabase() → direct insert to 'submissions' table
  → catch: api.post('/service-requests') → Express fallback
  → if offline entirely: savePendingSubmission() → IndexedDB queue
       → auto-drains to Supabase on 'online' event
```

**Org coverage fixed this session** — DB had a CHECK constraint locked to
`electricity/gas/municipal` only. Healthcare/sanitation/transport/water/
complaint submissions were silently rejected at insert (fell back to
offline queue forever, never reached the portal). `portal/supabase_setup.sql`
now has the `ALTER TABLE` fix + the missing SELECT RLS policy the dashboard
query needed (previously returned empty under RLS even with real rows).

```
portal/index.html — single-file officer dashboard
  → reads Supabase directly (no backend needed)
  → 8 service tabs, doc counts, QR upload verification page
```

---

## 10. Offline-first behavior

```
Form submit while offline:
  → IndexedDB queue (src/utils/offline.js)
  → window 'online' event → auto-drain → Supabase
  → receipt shown immediately either way (trackingId generated client-side)

Aadhaar identity: works fully offline (QR parse, no UIDAI call)
STT/TTS offline fallback: Whisper-small (browser WASM) / Browser SpeechSynthesis
Office locator: requires internet (Overpass API)
```

---

## 11. Deployment

| Target | What | Status |
|---|---|---|
| Vercel | Frontend (Vite build) + isolated Sarvam serverless function (`api/sarvam.js`) | Built, function tested live (boot + `/status` endpoint returned 200) |
| Render | Full backend — OTP, auth, SQLite DB, sockets (`render.yaml`) | Config built, not yet deployed |
| Local | Full Express backend | Confirmed running, `/api/health` returns 200 |

**Why split:** full Express app can't run as Vercel serverless — `initDB()`
(better-sqlite3 needs writable filesystem) and `createRealtimeServer()`
(socket.io needs persistent connections) both run unconditionally at module
load, both incompatible with serverless. Sarvam's routes have no DB/socket
dependency, so only those got isolated to Vercel; everything stateful goes
to Render.

---

## 12. Known gaps (honest list)

| Gap | Detail |
|---|---|
| Live mic/STT/TTS never tested | Playwright fake-media-stream can't produce real audio — only code-path and build verified |
| Voice wizard | Wired into 1 of 9 forms |
| Assamese TTS for dynamic text | Bridges to Hindi voice (Sarvam beta limitation, not fixable client-side) |
| Chatbot system prompt | Missing healthcare/transport/sanitation/schemes context |
| Translate-pivot for LLM | Discussed, not built — would improve Assamese AI response quality |
| Fine-tuned Assamese STT | Not done — local machine is CPU-only torch + Windows MAX_PATH blocked NeMo install. Colab/Kaggle LoRA notebook written (`whisper_assamese_lora_finetune.ipynb`), not yet run |
| Render deploy | Config exists, not yet actually deployed/tested live |
| Public repo key exposure | Real Supabase key is in `harikishore635/suvidha-portal` and `final-kiosik` (public repos) — accepted risk, not rotated |
