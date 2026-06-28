/**
 * voiceFieldPrompts.js — per-field voice prompts for the form wizard.
 * Fields with a matching staticKey in staticAudioMap.js play the pre-recorded
 * MP3 (en/as). Fields without one fall back to this text → dynamic TTS.
 */

export const FIELD_TEXT_PROMPTS = {
  name: {
    en: 'Please say your full name.',
    hi: 'कृपया अपना पूरा नाम बताएं।',
    as: 'অনুগ্রহ কৰি আপোনাৰ সম্পূৰ্ণ নাম কওক।',
  },
  mobile: {
    en: 'Please say your 10 digit mobile number.',
    hi: 'कृपया अपना 10 अंकों का मोबाइल नंबर बताएं।',
    as: 'অনুগ্রহ কৰি আপোনাৰ ১০ অঙ্কৰ মোবাইল নম্বৰ কওক।',
  },
  phone: {
    en: 'Please say your 10 digit mobile number.',
    hi: 'कृपया अपना 10 अंकों का मोबाइल नंबर बताएं।',
    as: 'অনুগ্রহ কৰি আপোনাৰ ১০ অঙ্কৰ মোবাইল নম্বৰ কওক।',
  },
  aadhaar: {
    en: 'Please say your 12 digit Aadhaar number.',
    hi: 'कृपया अपना 12 अंकों का आधार नंबर बताएं।',
    as: 'অনুগ্রহ কৰি আপোনাৰ ১২ অঙ্কৰ আধাৰ নম্বৰ কওক।',
  },
  pincode: {
    en: 'Please say your 6 digit PIN code.',
    hi: 'कृपया अपना 6 अंकों का पिन कोड बताएं।',
    as: 'অনুগ্রহ কৰি আপোনাৰ ৬ অঙ্কৰ পিন কোড কওক।',
  },
  email: {
    en: 'Please say your email address.',
    hi: 'कृपया अपना ईमेल पता बताएं।',
    as: 'অনুগ্রহ কৰি আপোনাৰ ইমেইল ঠিকনা কওক।',
  },
  pan: {
    en: 'Please say your PAN number.',
    hi: 'कृपया अपना पैन नंबर बताएं।',
    as: 'অনুগ্রহ কৰি আপোনাৰ পেন নম্বৰ কওক।',
  },
};

// Fields with pre-recorded ask_shared_* audio (staticAudioMap.js) — text used
// only as the TTS fallback text when the static file fails to load.
export const FIELD_STATIC_KEYS = {
  address:     'ask_shared_address',
  city:        'ask_shared_city',
  state:       'ask_shared_state',
  ward:        'ask_shared_ward',
  description: 'ask_shared_description',
  upload:      'ask_shared_upload',
};

export const FIELD_STATIC_TEXT_PROMPTS = {
  address: {
    en: 'Please say your address.',
    hi: 'कृपया अपना पता बताएं।',
    as: 'অনুগ্রহ কৰি আপোনাৰ ঠিকনা কওক।',
  },
  city: {
    en: 'Please say your city.',
    hi: 'कृपया अपना शहर बताएं।',
    as: 'অনুগ্রহ কৰি আপোনাৰ চহৰৰ নাম কওক।',
  },
  state: {
    en: 'Please say your state.',
    hi: 'कृपया अपना राज्य बताएं।',
    as: 'অনুগ্রহ কৰি আপোনাৰ ৰাজ্যৰ নাম কওক।',
  },
  ward: {
    en: 'Please say your ward number.',
    hi: 'कृपया अपना वार्ड नंबर बताएं।',
    as: 'অনুগ্রহ কৰি আপোনাৰ ৱাৰ্ড নম্বৰ কওক।',
  },
  description: {
    en: 'Please describe your issue.',
    hi: 'कृपया अपनी समस्या बताएं।',
    as: 'অনুগ্রহ কৰি আপোনাৰ সমস্যা বৰ্ণনা কৰক।',
  },
  upload: {
    en: 'Please upload your document using the QR code, or say skip.',
    hi: 'कृपया क्यूआर कोड का उपयोग करके अपना दस्तावेज़ अपलोड करें, या स्किप कहें।',
    as: 'অনুগ্রহ কৰি QR কোড ব্যৱহাৰ কৰি আপোনাৰ দলিল আপলোড কৰক, বা স্কিপ কওক।',
  },
};

export const CONFIRM_PROMPTS = {
  en: (value) => `Got it. ${value}.`,
  hi: (value) => `समझ गया। ${value}।`,
  as: (value) => `বুজি পাইছো। ${value}।`,
};

export const INVALID_PROMPTS = {
  en: 'That did not sound right. Please say it again.',
  hi: 'यह सही नहीं लगा। कृपया फिर से बताएं।',
  as: 'এইটো শুদ্ধ যেন লাগিল নাই। অনুগ্রহ কৰি পুনৰ কওক।',
};

export const REPEAT_PROMPTS = {
  en: "I didn't hear you. Please say it again.",
  hi: 'मैं सुन नहीं पाया। कृपया फिर से बताएं।',
  as: 'মই শুনিব নোৱাৰিলোঁ। অনুগ্রহ কৰি পুনৰ কওক।',
};

export const SKIP_ACK_PROMPTS = {
  en: 'Skipped.',
  hi: 'छोड़ दिया गया।',
  as: 'এৰি দিয়া হ\'ল।',
};

export function getFieldText(fieldName, language) {
  const lang = (language || 'en').toLowerCase().split('-')[0];
  const dict = FIELD_TEXT_PROMPTS[fieldName] || FIELD_STATIC_TEXT_PROMPTS[fieldName];
  if (!dict) return null;
  return dict[lang] || dict.en;
}

export function getFieldStaticKey(fieldName) {
  return FIELD_STATIC_KEYS[fieldName] || null;
}

export function getPrompt(promptMap, language, ...args) {
  const lang = (language || 'en').toLowerCase().split('-')[0];
  const entry = promptMap[lang] || promptMap.en;
  return typeof entry === 'function' ? entry(...args) : entry;
}
