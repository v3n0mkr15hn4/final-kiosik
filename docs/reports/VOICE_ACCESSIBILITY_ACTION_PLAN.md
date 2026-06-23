# Voice UX And Accessibility Action Plan

This document captures the prioritized voice-first fixes from the repository audit. The application is intended for blind users and uses Sarvam AI for TTS and STT, so the main goal is to make speech output consistent, interruption reliable, recognition resilient, and every flow reachable without touch.

## 1. TTS Voice Consistency

1. Centralize all spoken output through one TTS service.

   Files to change:
   - `src/ai/provider/VoiceAssistantProvider.jsx`
   - `src/components/AIChatbot.jsx`
   - `src/components/VoiceInstructionEngine.jsx`
   - `src/components/AadhaarCameraScanner.jsx`
   - `src/components/RealtimeNavigationMap.jsx`
   - `src/components/ScreenReaderOverlay.jsx`

   What to change:
   - Route every spoken output through `src/utils/ttsService.js`.
   - Remove direct `window.speechSynthesis` usage from components.
   - Replace use of `src/ai/voice/speechSynthesis.js` with the same shared TTS service.

   Why:
   - The app currently has multiple TTS paths: `src/ai/voice/speechSynthesis.js`, `src/utils/ttsService.js`, and direct browser speech. This is the main cause of inconsistent voices.

   Example:
   ```js
   // src/ai/provider/VoiceAssistantProvider.jsx
   import { speak, stopTTS as stopSpeaking } from '../../utils/ttsService';
   ```

2. Convert `src/ai/voice/speechSynthesis.js` into a thin adapter or remove it.

   File to change:
   - `src/ai/voice/speechSynthesis.js`

   What to change:
   ```js
   export { speak, stopTTS as stopSpeaking } from '../../utils/ttsService';
   export const isSpeaking = () => false; // or expose real state from ttsService
   ```

   Why:
   - Maintaining two queues, two speaker maps, and two fallback policies creates voice drift and race conditions.

3. Create one Sarvam voice profile.

   Files to change:
   - `src/utils/ttsService.js`
   - `server/routes/sarvam.js`
   - New file: `src/config/voiceProfile.js`

   What to change:
   - Use one source of truth for `speaker`, `gender`, `pace`, `sampleRate`, and `model`.
   - Stop hardcoding speakers in several places, such as `SPEAKER_MAP`, `SARVAM_SPEAKERS`, bridge TTS, and batch fallback.

   Example:
   ```js
   export const VOICE_PROFILE = {
     model: 'bulbul:v3',
     pace: 0.95,
     defaultSpeaker: 'ritu',
     speakers: {
       'en-IN': 'ritu',
       'hi-IN': 'anand',
       'as-IN': 'anand',
       'ta-IN': 'kavitha',
       'te-IN': 'ratan',
       'kn-IN': 'mani',
       'ml-IN': 'roopa',
       'bn-IN': 'neha',
       'mr-IN': 'sumit',
       'gu-IN': 'pooja',
       'pa-IN': 'rahul',
       'or-IN': 'priya',
     },
   };
   ```

4. Align Sarvam model names.

   File to change:
   - `src/ai/api/sarvamApi.js`

   What to change:
   - Change `model: 'bulbul:v1'` to `model: 'bulbul:v3'`.

   Why:
   - The server and comments use Bulbul v3, while this older path asks for v1. If that code path runs, the voice may differ.

5. Emit TTS lifecycle events from the shared TTS service.

   File to change:
   - `src/utils/ttsService.js`

   What to change:
   ```js
   async playItem(item) {
     window.dispatchEvent(new CustomEvent('suvidha:tts-started', { detail: item }));
     try {
       await this.playAudio(item);
     } finally {
       window.dispatchEvent(new CustomEvent('suvidha:tts-ended', { detail: item }));
     }
   }
   ```

   Why:
   - `VoiceNavigation.jsx` listens for `suvidha:tts-started`, but `ttsService` never emits it.

## 2. Barge-In Implementation

1. Keep an interrupt detector active while TTS is speaking.

   File to change:
   - `src/ai/provider/VoiceAssistantProvider.jsx`

   What to change:
   - Do not rely only on the main STT loop for interruption.
   - On TTS start, start a dedicated barge-in listener.
   - On user speech, stop TTS immediately and process the new utterance.

   Example:
   ```js
   import { startBargeInListener, stopBargeInListener } from '../../utils/naturalVoice';

   onStart: () => {
     setAIState('speaking');
     startBargeInListener((spokenText) => {
       stopSpeaking();
       stopBargeInListener();
       canCaptureTranscriptRef.current = true;
       processMessage(spokenText);
     }, currentLanguage());
   },
   onEnd: () => {
     stopBargeInListener();
     canCaptureTranscriptRef.current = true;
     startListening();
   }
   ```

   Why:
   - Current code stops listening when TTS starts, so users cannot reliably interrupt speech.

2. Add abort support to TTS streaming.

   File to change:
   - `src/utils/ttsService.js`

   What to change:
   - Store an `AbortController` for current TTS fetches.
   - Abort it inside `stop()`.

   Example:
   ```js
   this.currentAbort = new AbortController();

   const resp = await fetch(endpoint, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(body),
     signal: this.currentAbort.signal,
   });

   stop() {
     this.currentAbort?.abort();
     this.currentAbort = null;
     // existing pause/cancel logic
   }
   ```

   Why:
   - Pausing audio is not enough if streaming fetches continue in the background.

3. Add VAD-based interruption.

   File to change:
   - `src/utils/naturalVoice.js`

   What to change:
   - Add a microphone amplitude detector using `AudioContext`.
   - Stop TTS as soon as speech-like input crosses a threshold.
   - Use STT after the interrupt to decode the command.

   Why:
   - Web Speech events can arrive late. Blind users need interruption to feel immediate.

4. Fix chatbot barge-in timing.

   File to change:
   - `src/components/AIChatbot.jsx`

   What to change:
   - Start `startBargeInListener` before `naturalSpeak`, not after `.then()`.
   - Stop the listener in `.finally()`.

   Why:
   - The current listener starts after speech ends, so it cannot interrupt the speech it is meant to interrupt.

5. Remove or mount stale voice components.

   File to change:
   - `src/App.jsx`
   - `src/components/VoiceNavigation.jsx`

   What to change:
   - Either mount `VoiceNavigation` intentionally or remove it from the active architecture.

   Why:
   - It contains barge-in code but is not mounted by `App.jsx`, so changes there do not affect the live app.

## 3. STT Reliability

1. Remove fixed-gap Sarvam chunking.

   File to change:
   - `src/ai/voice/speechRecognition.js`

   What to change:
   - Current Sarvam chunks record for `4500ms`, stop, upload, then restart after `500ms`.
   - Replace this with overlapping chunks or continuous `MediaRecorder.start(timeslice)` plus silence-based flushing.

   Why:
   - The 500ms restart gap can drop words.

2. Prefer browser STT for fast commands, then fall back to Sarvam.

   File to change:
   - `src/ai/voice/speechRecognition.js`

   What to change:
   - Use `startBrowserSTT` first when available.
   - Fall back to Sarvam upload when browser STT is unavailable, low confidence, or errors.

   Why:
   - Browser STT provides interim results and faster command detection. Sarvam remains the higher-quality fallback.

3. Add recoverable-error retry logic.

   File to change:
   - `src/ai/provider/VoiceAssistantProvider.jsx`

   What to change:
   - Treat `no-speech`, `network`, `audio-capture`, and `aborted` differently.
   - Retry recoverable failures with backoff.

   Why:
   - Current `onError` often sets the assistant to idle and stops listening.

4. Replace page-local STT implementations.

   Files to change:
   - `src/components/AIChatbot.jsx`
   - `src/pages/GasComplaint.jsx`
   - `src/pages/MunicipalGrievance.jsx`
   - `src/pages/ElectricityComplaint.jsx`

   What to change:
   - Replace direct `SpeechRecognition` setup with the unified `startSTT()` manager.

   Why:
   - These pages have no shared retry, no Sarvam fallback, no silence timeout, and inconsistent language handling.

5. Fix microphone permissions policy.

   File to change:
   - `server/middleware/enterprise/observability.js`

   What to change:
   ```js
   res.setHeader(
     'Permissions-Policy',
     'camera=(self), microphone=(self), geolocation=(self)'
   );
   ```

   Why:
   - The current header is `camera=(), microphone=(), geolocation=()`, which can block microphone access in kiosk deployments.

## 4. Voice-Only Navigation

1. Handle all actions defined in the prompt.

   File to change:
   - `src/ai/brain/intentRouter.js`

   What to change:
   - Add cases for `TRACK_APPLICATION`, `EMERGENCY_ALERT`, and `ESCALATE_HUMAN`.

   Why:
   - The system prompt tells the model to emit these actions, but the router currently does not execute them.

2. Add voice field metadata to forms.

   Files to change:
   - `src/components/Input.jsx`
   - `src/components/Select.jsx`
   - `src/components/TextArea.jsx`
   - Form pages under `src/pages`

   What to change:
   - Pass and render `data-voice-field` for fields such as `name`, `mobile`, `consumerNumber`, `state`, `city`, `ward`, `address`, and `description`.

   Why:
   - `FILL_FORM` depends on `data-voice-field`, but no fields currently expose it.

3. Wire voice form submission.

   Files to change:
   - `src/ai/provider/VoiceAssistantProvider.jsx`
   - All form pages with submit actions

   What to change:
   - Pages must listen for `suvidha:submit-form`.
   - Add a shared hook such as `useVoiceFormSubmit(formId, submitFn)`.

   Example:
   ```js
   useEffect(() => {
     const handler = (e) => {
       if (e.detail?.formId === 'gas_complaint') handleSubmit();
     };
     window.addEventListener('suvidha:submit-form', handler);
     return () => window.removeEventListener('suvidha:submit-form', handler);
   }, [handleSubmit]);
   ```

   Why:
   - The provider dispatches submit events, but no page listens to them.

4. Add voice onboarding commands.

   Files to change:
   - `src/pages/Landing.jsx`
   - `src/pages/Login.jsx`
   - `src/pages/ModeSelection.jsx`
   - `src/ai/brain/intentRouter.js`

   What to change:
   - Support commands like “blind mode”, “guest access”, “login with Aadhaar”, “enter Aadhaar”, “send OTP”, and “verify OTP”.

   Why:
   - Initial onboarding still requires touch for several critical choices.

5. Add voice equivalents for kiosk shell actions.

   Files to change:
   - `src/components/kiosk/VK.jsx`
   - `src/ai/brain/intentRouter.js`

   What to change:
   - Add action support for help, language selector, voice instructions toggle, back, logout, and emergency.

   Why:
   - The bottom bar is touch-first, but those controls are essential for blind users.

## 5. Accessibility Hardening

1. Mount or merge the screen reader support layer.

   Files to change:
   - `src/App.jsx`
   - `src/components/ScreenReaderOverlay.jsx`
   - `src/components/AccessibilityProvider.jsx`

   What to change:
   - Mount `ScreenReaderOverlay`, or move its focus-announcement behavior into `AccessibilityProvider`.

   Why:
   - `ScreenReaderOverlay` is exported but not mounted.

2. Associate labels with controls.

   Files to change:
   - `src/components/Input.jsx`
   - `src/components/Select.jsx`
   - `src/components/TextArea.jsx`

   What to change:
   - Add stable `id`, `htmlFor`, `aria-invalid`, and `aria-describedby`.

   Why:
   - Current labels are visual only and are not programmatically tied to controls.

3. Harden modal focus.

   File to change:
   - `src/components/Modal.jsx`

   What to change:
   - Trap focus inside the modal.
   - Announce dialog open.
   - Return focus to the triggering element after close.
   - Support voice commands “confirm” and “cancel”.

   Why:
   - Confirmation modals block form submission and must be fully accessible without touch.

4. Avoid duplicate assistant surfaces in blind mode.

   Files to change:
   - `src/App.jsx`
   - `src/components/AIChatbot.jsx`
   - `src/components/ai/AIOverlay.jsx`

   What to change:
   - In blind mode, keep only the full voice assistant active.
   - Hide or disable the floating chatbot.

   Why:
   - Two assistant UIs create competing live regions, separate STT/TTS states, and duplicate speech.

5. Add centralized audio cues.

   File to change:
   - `src/utils/ttsService.js`

   What to change:
   - Add short earcons for listening start, listening stop, error, success, and interruption.
   - Make them obey the same stop, volume, and voice-instructions settings.

   Why:
   - Blind users benefit from quick audio state cues without repeated verbose prompts.

