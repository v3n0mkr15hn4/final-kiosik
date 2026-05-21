/**
 * naturalVoice.js — Conversational TTS + Barge-In (Interrupt) Detection
 *
 * Makes the kiosk voice feel warm and human, NOT robotic.
 *
 * Features:
 * 1. Conversational text preprocessor — strips markdown, adds natural pauses
 * 2. Randomised warm response phrases (no repeating the same robotic string)
 * 3. Barge-in / interrupt detection — if user speaks while TTS is playing,
 *    the speech stops immediately and the command is processed
 * 4. Context-aware page introductions — brief, friendly welcome when entering a section
 * 5. Pace control — slightly slower for elderly/blind modes
 */

import ttsService, { speak as rawSpeak, stopTTS } from './ttsService';

// ─── Warm, randomised phrase banks ────────────────────────────────────────

const PHRASES = {
  navigating: {
    en: [
      'Sure! Taking you to',
      'Alright, opening',
      'On it! Going to',
      'Great choice! Loading',
      'No problem! Heading to',
    ],
    hi: [
      'ठीक है! आपको ले जा रहा हूँ',
      'बिल्कुल! खोल रहा हूँ',
      'अच्छा! चलते हैं',
      'जरूर! जा रहे हैं',
    ],
    as: [
      'ঠিক আছে! আপোনাক লৈ যাইছো',
      'অৱশ্যে! খুলি আছো',
      'নিশ্চয়! যাওঁ',
    ],
  },
  goingBack: {
    en: ['Going back.', 'Taking you back.', 'Stepping back now.'],
    hi: ['वापस जा रहे हैं।', 'पिछले पृष्ठ पर जा रहे हैं।'],
    as: ['পিছলৈ যাইছো।', 'আগৰ পৃষ্ঠালৈ যাইছো।'],
  },
  loggedOut: {
    en: ['Logged out safely. Have a great day!', 'Session ended. Stay safe!', 'Goodbye! Session closed.'],
    hi: ['लॉग आउट हो गया। अच्छा दिन हो!', 'सत्र समाप्त हुआ। अलविदा!'],
    as: ['লগ আউট হ\'ল। ভাল দিন হওক!'],
  },
  notUnderstood: {
    en: [
      "Sorry, I didn't catch that. Could you try again?",
      "Hmm, I'm not sure what you said. Please try once more.",
      "I didn't quite get that. Say it again?",
    ],
    hi: [
      'माफ करें, समझ नहीं आया। फिर से कहें?',
      'क्षमा करें, दोबारा बोलें।',
    ],
    as: [
      'মাফ কৰিব, বুজা নগ\'ল। পুনৰ কওক?',
      'ক্ষমা কৰিব, আকৌ কওক।',
    ],
  },
  listening: {
    en: ["I'm listening...", 'Go ahead, I\'m all ears.', 'Yes? Listening...'],
    hi: ['सुन रहा हूँ...', 'बोलिए, मैं सुन रहा हूँ।'],
    as: ['শুনি আছো...', 'কওক, শুনি আছো।'],
  },
  commandConfirm: {
    en: ['Got it!', 'Sure!', 'Perfect!', 'Understood!'],
    hi: ['ठीक है!', 'समझ गया!', 'बिल्कुल!'],
    as: ['বুজিলো!', 'ঠিক আছে!'],
  },
};

// Page introductions — keep them SHORT so users can interrupt immediately
const PAGE_INTROS = {
  '/home': {
    en: "Welcome! You can access electricity, gas, water, or municipal services. Just say what you need, or tap a tile.",
    hi: "स्वागत है! बिजली, गैस, पानी, या नगर सेवाओं के लिए यहाँ आएं। जो चाहिए बोलें या टाइल दबाएं।",
    as: "স্বাগতম! বিদ্যুৎ, গেছ, পানী বা পৌৰ সেৱাৰ বাবে এয়াই জায়গা। যি লাগে কওক বা টাইল টিপক।",
  },
  '/electricity': {
    en: "Electricity Services. New connection, meter replacement, load change, or billing complaint — all here.",
    hi: "बिजली सेवाएं। नया कनेक्शन, मीटर बदलना, लोड बदलाव, या बिल शिकायत — सब यहाँ है।",
    as: "বিদ্যুৎ সেৱা। নতুন সংযোগ, মিটাৰ সলনি, লোড পৰিবৰ্তন বা বিল অভিযোগ — সকলো ইয়াতে।",
  },
  '/electricity-menu': {
    en: "Electricity menu. Choose what you need — new connection, meter issue, load extension, or complaint.",
    hi: "बिजली मेनू। चुनें — नया कनेक्शन, मीटर समस्या, लोड एक्सटेंशन, या शिकायत।",
    as: "বিদ্যুৎ মেনু। বাছনি কৰক — নতুন সংযোগ, মিটাৰ সমস্যা, লোড সম্প্ৰসাৰণ বা অভিযোগ।",
  },
  '/gas': {
    en: "Assam Gas Services. Apply for connections, view bills, report meter damage, or track requests.",
    hi: "असम गैस सेवाएं। कनेक्शन, बिल, मीटर समस्या या अनुरोध ट्रैक करें।",
    as: "অসম গেছ সেৱা। সংযোগ, বিল, মিটাৰ সমস্যা বা অনুৰোধ ট্ৰেক কৰক।",
  },
  '/gas-menu': {
    en: "Gas services menu. New connection, meter replacement, bills, complaints — choose your service.",
    hi: "गैस सेवाएं। नया कनेक्शन, मीटर, बिल, शिकायत — सेवा चुनें।",
    as: "গেছ মেনু। নতুন সংযোগ, মিটাৰ, বিল, অভিযোগ — সেৱা বাছনি কৰক।",
  },
  '/water': {
    en: "Water Services. Apply for new connection, report supply issues, or track your request.",
    hi: "जल सेवाएं। नया कनेक्शन, आपूर्ति समस्या, या अनुरोध ट्रैक करें।",
    as: "জল সেৱা। নতুন সংযোগ, যোগান সমস্যা বা অনুৰোধ ট্ৰেক কৰক।",
  },
  '/municipal': {
    en: "Municipal Services. Water, sewage, roads, streetlights, garbage — report any civic issue here.",
    hi: "नगर सेवाएं। पानी, सीवर, सड़क, स्ट्रीटलाइट, कचरा — कोई भी नागरिक समस्या यहाँ दर्ज करें।",
    as: "পৌৰ সেৱা। পানী, পয়ঃনিষ্কাশন, পথ, পথবাতি, আৱৰ্জনা — যিকোনো নাগৰিক সমস্যা ইয়াতে জনাওক।",
  },
  '/municipal-menu': {
    en: "Municipal menu. Water connection, grievances, property tax, or complaint tracking.",
    hi: "नगर मेनू। जल कनेक्शन, शिकायत, संपत्ति कर, या ट्रैकिंग।",
    as: "পৌৰ মেনু। জল সংযোগ, অভিযোগ, সম্পত্তি কৰ বা ট্ৰেকিং।",
  },
  '/complaints': {
    en: "Complaint Registration. Choose your complaint type, add a photo if needed, and submit. I'll generate a ticket ID for you.",
    hi: "शिकायत दर्ज करें। श्रेणी चुनें, फोटो जोड़ें, सबमिट करें। मैं आपको टिकट ID दूंगा।",
    as: "অভিযোগ পঞ্জীয়ন। শ্ৰেণী বাছনি কৰক, ফটো যোগ কৰক আৰু জমা দিয়ক। আমি টিকট আইডি দিম।",
  },
  '/track-status': {
    en: "Track Status. Enter your ticket ID, application ID, or mobile number to check the current status of your request.",
    hi: "स्थिति ट्रैक करें। अपना टिकट ID, आवेदन ID, या मोबाइल नंबर दर्ज करें।",
    as: "স্থিতি ট্ৰেক কৰক। টিকট আইডি, আবেদন আইডি বা মোবাইল নম্বৰ দিয়ক।",
  },
  '/schemes': {
    en: "Welfare Schemes. Find government schemes you qualify for based on your profile — PM-KISAN, Ayushman Bharat, and more.",
    hi: "कल्याण योजनाएं। PM-KISAN, आयुष्मान भारत और अन्य योजनाएं देखें।",
    as: "কল্যাণ আঁচনি। PM-KISAN, আয়ুষ্মান ভাৰত আৰু অন্য আঁচনি চাওক।",
  },
  '/login': {
    en: "Citizen Login. Enter your 12-digit Aadhaar number to access personalised services.",
    hi: "नागरिक लॉगिन। अपना 12 अंकों का आधार नंबर दर्ज करें।",
    as: "নাগৰিক লগিন। আপোনাৰ 12 অংকৰ আধাৰ নম্বৰ দিয়ক।",
  },
};

// ─── Utilities ─────────────────────────────────────────────────────────────

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const getLang = (language) => {
  const base = (language || 'en').toLowerCase().split('-')[0];
  return ['en', 'hi', 'as'].includes(base) ? base : 'en';
};

/**
 * Preprocess text for natural-sounding TTS:
 * - Remove markdown symbols
 * - Convert arrows/bullets to spoken equivalents
 * - Add breathing pauses after sentences
 * - Trim to a reasonable length to avoid long monologues
 */
function preprocessText(text) {
  return text
    .replace(/<[^>]*>/g, '')                  // strip HTML
    .replace(/\*\*(.*?)\*\*/g, '$1')          // **bold** → plain
    .replace(/\*(.*?)\*/g, '$1')              // *italic* → plain
    .replace(/→/g, ',')                       // → to pause
    .replace(/←/g, ',')
    .replace(/•\s*/g, ', ')                   // bullets → pause
    .replace(/\n+/g, '. ')                    // newlines → sentence breaks
    .replace(/\s{2,}/g, ' ')                  // collapse whitespace
    .replace(/\.{2,}/g, '.')                  // ellipsis → period
    .replace(/[_`#]/g, '')                    // clean remaining markdown
    .trim()
    .slice(0, 280);                            // max 280 chars — keeps speech under ~15s
}

// ─── Public API ────────────────────────────────────────────────────────────

/** Speak text naturally — warm preprocessing + Sarvam TTS */
export function naturalSpeak(text, options = {}) {
  const processed = preprocessText(text);
  if (!processed) return Promise.resolve();
  const lang = getLang(options.language);
  const pace = options.elderlyMode ? 0.85 : options.blindMode ? 0.9 : 1.0;
  return rawSpeak(processed, { ...options, language: lang, pace });
}

/** Announce navigation in a warm, varied phrase */
export function announceNavigation(pageName, language = 'en') {
  const lang = getLang(language);
  const prefix = pick(PHRASES.navigating[lang] || PHRASES.navigating.en);
  return rawSpeak(`${prefix} ${pageName}.`, { language: lang, interrupt: false });
}

/** Speak a page introduction when first entering a route */
export function speakPageIntro(pathname, language = 'en', options = {}) {
  const lang = getLang(language);
  const intros = PAGE_INTROS[pathname];
  if (!intros) return Promise.resolve();
  const text = intros[lang] || intros.en;
  return rawSpeak(text, { language: lang, priority: 'normal', ...options });
}

/** Get a random "going back" phrase */
export function announceGoBack(language = 'en') {
  const lang = getLang(language);
  const phrase = pick(PHRASES.goingBack[lang] || PHRASES.goingBack.en);
  return rawSpeak(phrase, { language: lang });
}

/** Logout announcement */
export function announceLogout(language = 'en') {
  const lang = getLang(language);
  const phrase = pick(PHRASES.loggedOut[lang] || PHRASES.loggedOut.en);
  return rawSpeak(phrase, { language: lang });
}

/** "I didn't understand" — varied phrase */
export function announceNotUnderstood(language = 'en') {
  const lang = getLang(language);
  const phrase = pick(PHRASES.notUnderstood[lang] || PHRASES.notUnderstood.en);
  return rawSpeak(phrase, { language: lang });
}

/** "I'm listening" — varied phrase */
export function announceListening(language = 'en') {
  const lang = getLang(language);
  const phrase = pick(PHRASES.listening[lang] || PHRASES.listening.en);
  return rawSpeak(phrase, { language: lang });
}

/** Brief acknowledgement before action */
export function announceConfirm(language = 'en') {
  const lang = getLang(language);
  const phrase = pick(PHRASES.commandConfirm[lang] || PHRASES.commandConfirm.en);
  return rawSpeak(phrase, { language: lang, interrupt: true });
}

// ─── Barge-in / Interrupt Detection ───────────────────────────────────────
//
// How it works:
//   1. When TTS starts playing, call startBargeInListener(onCommand, language)
//   2. A Web Speech API recogniser runs in continuous mode at LOW confidence threshold
//   3. If ANY interim speech is detected, TTS stops immediately (barge-in)
//   4. onCommand(transcript) is called with what the user said
//   5. When TTS ends naturally, stopBargeInListener() cleans up
//
// This creates a "smart speaker" feel — users can interrupt at any moment.

let bargeInRecognition = null;
let bargeInActive = false;

const BARGE_IN_LANG_MAP = {
  en: 'en-IN', hi: 'hi-IN', as: 'as-IN',
  ta: 'ta-IN', te: 'te-IN', kn: 'kn-IN',
  ml: 'ml-IN', mr: 'mr-IN', gu: 'gu-IN',
  bn: 'bn-IN', pa: 'pa-IN',
};

/**
 * Start listening for barge-in while TTS is playing.
 * @param {Function} onInterrupt - called with (transcript) when user speaks
 * @param {string} language - user's current language
 */
export function startBargeInListener(onInterrupt, language = 'en') {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition || bargeInActive) return;

  const lang = getLang(language);
  const recognitionLang = BARGE_IN_LANG_MAP[lang] || 'en-IN';

  const recognition = new SpeechRecognition();
  recognition.lang = recognitionLang;
  recognition.continuous = true;
  recognition.interimResults = true;    // detect speech as it happens, not just final
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    const lastResult = event.results[event.results.length - 1];
    const transcript = (lastResult?.[0]?.transcript || '').trim();

    if (!transcript) return;

    // On any speech detected (even interim) — stop TTS immediately (barge-in)
    stopTTS();
    stopBargeInListener();
    if (typeof onInterrupt === 'function') {
      onInterrupt(transcript);
    }
  };

  recognition.onerror = () => {
    bargeInActive = false;
    bargeInRecognition = null;
  };

  recognition.onend = () => {
    bargeInActive = false;
    bargeInRecognition = null;
  };

  try {
    recognition.start();
    bargeInRecognition = recognition;
    bargeInActive = true;
  } catch {
    bargeInActive = false;
  }
}

/** Stop the barge-in listener */
export function stopBargeInListener() {
  if (bargeInRecognition) {
    try { bargeInRecognition.stop(); } catch { /* ok */ }
    bargeInRecognition = null;
  }
  bargeInActive = false;
}

/** Whether barge-in is currently active */
export function isBargeInActive() {
  return bargeInActive;
}

export default {
  naturalSpeak,
  announceNavigation,
  speakPageIntro,
  announceGoBack,
  announceLogout,
  announceNotUnderstood,
  announceListening,
  announceConfirm,
  startBargeInListener,
  stopBargeInListener,
  isBargeInActive,
};
