import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from './AccessibilityProvider';
import { speak, stopTTS, setVoiceCommandActive } from '../utils/ttsService';
import { ROUTE_STATIC_KEYS } from '../utils/staticAudioMap';

const VOICE_TOGGLE_KEY = 'voiceInstructionsEnabled';

const ROUTE_INSTRUCTIONS = {
  '/': {
    en: 'Welcome to Suvidha kiosk. Choose guest access to browse services, or login with Aadhaar for full access.',
    hi: 'सुविधा कियोस्क में आपका स्वागत है। सेवाएं ब्राउज़ करने के लिए अतिथि चुनें, या संपूर्ण पहुंच के लिए आधार से लॉगिन करें।',
    as: 'সুবিধা কিয়স্কলৈ আপোনাক স্বাগতম। সেৱা ব্ৰাউজ কৰিবলৈ অতিথি বাছক, বা সম্পূর্ণ প্ৰবেশাধিকাৰ বাবে আধাৰেৰে লগইন কৰক।',
    ta: 'சுவிதா கியோஸ்க்கிற்கு வரவேற்கிறோம். சேவைகளை பார்க்க விருந்தினர் அணுகலை தேர்வு செய்யுங்கள், அல்லது முழு அணுகலுக்காக ஆதாருடன் உள்நுழையுங்கள்.',
  },
  '/login': {
    en: 'Citizen login. Enter your Aadhaar number to verify your identity and proceed.',
    hi: 'नागरिक लॉगिन। अपनी पहचान सत्यापित करने के लिए अपना आधार नंबर दर्ज करें।',
    as: 'নাগরিক লগইন। আপোনাৰ পরিচয় যাচাই কৰিবলৈ আপোনাৰ আধাৰ নম্বৰ দিয়ক।',
    ta: 'குடிமகன் உள்நுழைவு. உங்கள் அடையாளத்தை சரிபார்க்க ஆதார் எண்ணை உள்ளிடுங்கள்.',
  },
  '/mode-select': {
    en: 'Choose your accessibility mode. Select blind mode for voice navigation, elderly mode for larger text, or normal mode for standard experience.',
    hi: 'अपनी सुलभता मोड चुनें। वॉइस नेविगेशन के लिए ब्लाइंड मोड, बड़े पाठ के लिए बुजुर्ग मोड, या सामान्य मोड चुनें।',
    as: 'আপোনাৰ অ্যাক্সেসযোগ্যতা মোড বাছক। ভয়েস নেভিগেশনৰ বাবে ব্লাইন্ড মোড, ডাঙৰ পাঠৰ বাবে জ্যেষ্ঠ মোড বাছক।',
    ta: 'உங்கள் அணுகல் முறையைத் தேர்வு செய்யுங்கள். குரல் வழிசெலுத்தலுக்கு பார்வை குறைபாடு முறை, பெரிய எழுத்துக்கு முதியோர் முறை, அல்லது சாதாரண முறையை தேர்வு செய்யலாம்.',
  },
  '/home': {
    en: 'Home. Select a service to continue. Available services include electricity, gas, water, sanitation, municipal services, transport, healthcare, and complaints.',
    hi: 'होम। सेवा चुनें। उपलब्ध सेवाओं में बिजली, गैस, पानी, सफाई, नगर सेवाएं शामिल हैं।',
    as: 'ঘৰ। সেৱা বাছক। উপলব্ধ সেৱাত বিদ্যুৎ, গেছ, পানী অন্তৰ্ভুক্ত।',
    ta: 'முகப்பு. தொடர ஒரு சேவையைத் தேர்வு செய்யுங்கள். மின்சாரம், எரிவாயு, தண்ணீர், சுகாதாரம், நகராட்சி, போக்குவரத்து, சுகாதார சேவை மற்றும் புகார் சேவைகள் கிடைக்கின்றன.',
  },
  '/electricity': {
    en: 'Electricity services. You can check bills, report issues, track complaints, or discover government schemes.',
    hi: 'बिजली सेवाएं। आप बिल देख सकते हैं, समस्याओं की रिपोर्ट कर सकते हैं।',
    as: 'বিদ্যুৎ সেৱা। আপুনি বিল পৰীক্ষা কৰিব পাৰে, সমস্যা প্ৰতিবেদন কৰিব পাৰে।',
  },
  '/gas': {
    en: 'Gas services. Check bills, report issues, and track your gas connection.',
    hi: 'गैस सेवाएं। बिल देखें, समस्याओं की रिपोर्ट करें।',
    as: 'গেছ সেৱা। বিল পৰীক্ষা কৰক, সমস্যা প্ৰতিবেদন কৰক।',
  },
  '/water': {
    en: 'Water services. Manage your water connection, check bills, and report problems.',
    hi: 'जल सेवाएं। अपने जल कनेक्शन को प्रबंधित करें।',
    as: 'পানী সেৱা। আপোনাৰ পানীৰ সংযোগ পরিচালনা কৰক।',
  },
  '/sanitation': {
    en: 'Sanitation services. Report waste collection issues and book cleaning services.',
    hi: 'स्वच्छता सेवाएं। कचरा संग्रह की समस्याओं की रिपोर्ट करें।',
    as: 'স্বচ্ছতা সেৱা। বর্জ্য সংগ্ৰহৰ সমস্যা প্ৰতিবেদন কৰক।',
  },
  '/municipal': {
    en: 'Municipal services. Report property tax issues, book civic services, or track your complaints.',
    hi: 'नगर सेवाएं। संपत्ति कर समस्याओं की रिपोर्ट करें।',
    as: 'নগৰ সেৱা। সম্পত্তি কৰ সমস্যা প্ৰতিবেদন কৰক।',
  },
  '/transport': {
    en: 'Transport services. Book tickets, check traffic updates, and report road issues.',
    hi: 'परिवहन सेवाएं। टिकट बुक करें, यातायात अपडेट देखें।',
    as: 'পৰিবহন সেৱা। টিকিট বুক কৰক, ট্ৰাফিক আপডেট পৰীক্ষা কৰক।',
  },
  '/healthcare': {
    en: 'Healthcare services. Find hospitals, book appointments, and access health information.',
    hi: 'स्वास्थ्य सेवाएं। अस्पताल खोजें, नियुक्तियां बुक करें।',
    as: 'স্বাস্থ্য সেৱা। হাসপাতাল বিচাৰ কৰক, অপয়েন্টমেন্ট বুক কৰক।',
  },
  '/complaints': {
    en: 'Complaints. Register a new complaint or track your existing complaints.',
    hi: 'शिकायतें। नई शिकायत दर्ज करें या अपनी शिकायतों का ट्रैक करें।',
    as: 'অভিযোগ। নতুন অভিযোগ দাখিল কৰক বা আপোনাৰ অভিযোগ ট্রেক কৰক।',
  },
  '/track-status': {
    en: 'Track status. Enter your request ID or mobile number to track your application status.',
    hi: 'स्थिति ट्रैक करें। अपने अनुरोध ID या मोबाइल नंबर दर्ज करें।',
    as: 'স্থিতি ট্রেক কৰক। আপোনাৰ অনুৰোধ আইডি বা মোবাইল নম্বৰ প্ৰবেশ কৰক।',
  },
  '/schemes': {
    en: 'Government schemes. Discover schemes you are eligible for and learn how to apply.',
    hi: 'सरकारी योजनाएं। योजनाएं खोजें जिसके लिए आप पात्र हैं।',
    as: 'চৰকাৰী যোজনা। আপুনি যোগ্য যোজনা আবিষ্কাৰ কৰক।',
  },
  '/office-locator': {
    en: 'Office locator. Find government offices near you and their contact information.',
    hi: 'कार्यालय खोजने वाला। अपने पास सरकारी कार्यालय खोजें।',
    as: 'কার্যালয় খোঁজ। আপোনাৰ ওচৰৰ চৰকাৰী কার্যালয় খোঁজ।',
  },
  '/family-profile': {
    en: 'Family profile. View and manage your family information and dependencies.',
    hi: 'परिवार की प्रोफाइल। अपनी पारिवारिक जानकारी देखें।',
    as: 'পরিবাৰ প্ৰোফাইল। আপোনাৰ পরিবাৰৰ তথ্য দেখক।',
  },
  '/receipt': {
    en: 'Your form has been submitted. Please collect your receipt from this page.',
    hi: 'आपका फॉर्म जमा हो गया है। कृपया इस पेज से अपनी रसीद लें।',
    as: 'আপোনাৰ ফৰ্ম জমা হৈছে। অনুগ্ৰহ কৰি এই পৃষ্ঠাৰ পৰা আপোনাৰ ৰসিদ লওক।',
    ta: 'உங்கள் படிவம் சமர்ப்பிக்கப்பட்டது. தயவுசெய்து இந்தப் பக்கத்தில் இருந்து உங்கள் ரசீதை பெறுங்கள்.',
  },
};

const MODE_MESSAGES = {
  blind: {
    en: 'Blind accessibility mode activated. Voice instructions are always enabled.',
    hi: 'दृष्टिबाधित मोड सक्रिय हुआ। वॉइस निर्देश हमेशा चालू रहेंगे।',
    as: 'দৃষ্টিহীন মোড সক্ৰিয় হ’ল। কণ্ঠ নিৰ্দেশ সদায় সক্ৰিয় থাকিব।',
    ta: 'பார்வைக்குறைபாடு அணுகல் முறை செயல்படுத்தப்பட்டது. குரல் வழிகாட்டல் எப்போதும் இயங்கும்.',
  },
  elderly: {
    en: 'Elderly accessibility mode activated with larger text and higher contrast.',
    hi: 'वरिष्ठ मोड सक्रिय हुआ, बड़े अक्षर और उच्च कॉन्ट्रास्ट लागू किया गया।',
    as: 'জ্যেষ্ঠ মোড সক্ৰিয় হৈছে।',
    ta: 'பெரியவர்களுக்கான அணுகலுடன் பயன்முறை செயல்படுத்தப்பட்டது।',
  },
  normal: {
    en: 'Normal accessibility mode activated.',
    hi: 'सामान्य मोड सक्रिय हुआ।',
    as: 'সাধাৰণ মোড সক্ৰিয় হৈছে।',
    ta: 'சாதாரண பயன்முறை செயல்படுத்தப்பட்டது।',
  },
};

const IDLE_MESSAGES = {
  en: 'Need help? You can select a service or say help.',
  hi: 'मदद चाहिए? आप सेवा चुन सकते हैं या मदद बोल सकते हैं।',
  as: 'সহায় লাগে নেকি? আপুনি সেৱা বাছিব পাৰে বা সহায় বুলি কওক।',
  ta: 'உதவி தேவையா? நீங்கள் சேவையைத் தேர்ந்தெடுக்கலாம் அல்லது உதவி என்று சொல்லலாம்।',
};

const ONLINE_MESSAGES = {
  online: {
    en: 'Connection restored.',
    hi: 'कनेक्शन बहाल हो गया है।',
    as: 'সংযোগ পুনৰ স্থাপন হৈছে।',
    ta: 'இணைப்பு மீட்டெடுக்கப்பட்டது।',
  },
  offline: {
    en: 'You are offline.',
    hi: 'आप ऑफलाइन हैं।',
    as: 'আপুনি অফলাইনত আছে।',
    ta: 'நீங்கள் ஆஃப்லைனில் உள்ளீர்கள்।',
  },
};

const BACK_MESSAGES = {
  en: 'Going back to previous page.',
  hi: 'पिछले पृष्ठ पर जा रहे हैं।',
  as: 'আগৰ পৃষ্ঠালৈ উভতি যোৱা হৈছে।',
  ta: 'முந்தைய பக்கத்திற்கு திரும்புகிறேன்।',
};

const FORM_SUBMIT_MESSAGES = {
  en: 'Submitting form. Please wait.',
  hi: 'फॉर्म जमा कर रहे हैं। कृपया प्रतीक्षा करें।',
  as: 'ফৰ্ম জমা দিয়া হৈছে। অনুগ্ৰহ কৰি অপেক্ষা কৰক।',
  ta: 'படிவம் சமர்ப்பிக்கப்படுகிறது। தயவுசெய்து காத்திருங்கள்।',
};

const FORM_SUCCESS_MESSAGES = {
  en: 'Form submitted successfully. Please take your receipt.',
  hi: 'फॉर्म सफलतापूर्वक जमा हुआ। कृपया अपनी रसीद लें।',
  as: 'ফৰ্ম সফলভাৱে জমা হৈছে। অনুগ্ৰহ কৰি আপোনাৰ ৰসিদ লওক।',
  ta: 'படிவம் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது. தயவுசெய்து உங்கள் ரசீதை எடுத்துக்கொள்ளுங்கள்.',
};

const FORM_ERROR_MESSAGES = {
  en: 'Error submitting form. Please check your entries and try again.',
  hi: 'फॉर्म जमा करने में त्रुटि। कृपया अपनी प्रविष्टियों की जांच करें।',
  as: 'ফৰ্ম জমা দিওতে ত্ৰুটি হৈছে। অনুগ্ৰহ কৰি পুনৰ চেষ্টা কৰক।',
  ta: 'படிவம் சமர்ப்பிக்க பிழை। உங்கள் உள்ளீடுகளைச் சரிபார்க்கவும்।',
};

const getBaseLang = (language) => (language || 'en').toLowerCase().split('-')[0];

const getMessageByLanguage = (entry, language) => {
  const lang = getBaseLang(language);
  if (!entry) {
    return '';
  }
  return entry[lang] || entry.en || '';
};

const VoiceInstructionEngine = () => {
  const location = useLocation();
  const { i18n } = useTranslation();
  const { userMode } = useAccessibility();

  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    const stored = localStorage.getItem(VOICE_TOGGLE_KEY);
    if (stored === null) {
      return true;
    }
    return stored === 'true';
  });

  const previousModeRef = useRef(userMode);
  const onlineStatusRef = useRef(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Voice off must truly silence the kiosk — even when blind mode would
  // normally force-on, the explicit user toggle wins. This is what fixes
  // the "welcome to suvidha kiosk just plays again and again" loop.
  const shouldSpeak = voiceEnabled;

  const speakIfEnabled = (text, options = {}) => {
    if (!shouldSpeak || !text) {
      return;
    }

    speak(text, {
      language: i18n.language,
      ...options,
    }).catch(() => {});
  };

  useEffect(() => {
    localStorage.setItem(VOICE_TOGGLE_KEY, String(voiceEnabled));
    // Hard-stop any audio mid-flight the moment voice gets disabled.
    if (!voiceEnabled) {
      try { stopTTS(); } catch {}
    }
  }, [voiceEnabled]);

  // Allow other UI (e.g. the VK bottom-bar voice button) to toggle voice.
  useEffect(() => {
    const handler = (e) => {
      const next = e?.detail?.enabled;
      setVoiceEnabled((prev) => (typeof next === 'boolean' ? next : !prev));
    };
    window.addEventListener('suvidha:toggle-voice-instructions', handler);
    return () => window.removeEventListener('suvidha:toggle-voice-instructions', handler);
  }, []);

  useEffect(() => {
    const routeInstruction = getMessageByLanguage(ROUTE_INSTRUCTIONS[location.pathname], i18n.language);
    if (!routeInstruction || !shouldSpeak) {
      return;
    }

    const langKey = getBaseLang(i18n.language);
    const sessionKey = `voiceRouteInstruction:${location.pathname}:${langKey}`;
    if (sessionStorage.getItem(sessionKey) === 'true') {
      return;
    }

    sessionStorage.setItem(sessionKey, 'true');

    speak(routeInstruction, {
      priority: userMode === 'blind' ? 'warning' : 'normal',
      language: i18n.language,
      cache: true,
      staticKey: ROUTE_STATIC_KEYS[location.pathname],
    }).catch(() => {});
  }, [location.pathname, i18n.language, shouldSpeak, userMode]);

  useEffect(() => {
    const previousMode = previousModeRef.current;
    if (previousMode !== userMode) {
      const message = getMessageByLanguage(MODE_MESSAGES[userMode], i18n.language);
      const modeKeys = { blind: 'mode_blind', elderly: 'mode_elderly', normal: 'mode_normal' };
      speakIfEnabled(message, { priority: 'warning', staticKey: modeKeys[userMode] });
      previousModeRef.current = userMode;
    }
  }, [userMode, i18n.language, shouldSpeak]);

  useEffect(() => {
    const handleOffline = () => {
      onlineStatusRef.current = false;
      const message = getMessageByLanguage(ONLINE_MESSAGES.offline, i18n.language);
      speakIfEnabled(message, { priority: 'error', interrupt: true, cache: false, staticKey: 'net_offline' });
    };

    const handleOnline = () => {
      const wasOffline = !onlineStatusRef.current;
      onlineStatusRef.current = true;
      if (wasOffline) {
        const message = getMessageByLanguage(ONLINE_MESSAGES.online, i18n.language);
        speakIfEnabled(message, { priority: 'warning', cache: false, staticKey: 'net_restored' });
      }
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [i18n.language, shouldSpeak]);

  useEffect(() => {
    const onVoiceCommandStart = () => setVoiceCommandActive(true);
    const onVoiceCommandEnd = () => setVoiceCommandActive(false);

    window.addEventListener('voice-navigation:listening-started', onVoiceCommandStart);
    window.addEventListener('voice-navigation:listening-stopped', onVoiceCommandEnd);

    return () => {
      window.removeEventListener('voice-navigation:listening-started', onVoiceCommandStart);
      window.removeEventListener('voice-navigation:listening-stopped', onVoiceCommandEnd);
    };
  }, []);

  // Listen for back button navigation
  useEffect(() => {
    const handleBackButton = () => {
      if (!shouldSpeak) return;
      const lang = getBaseLang(i18n.language);
      const msg = BACK_MESSAGES[lang] || BACK_MESSAGES.en;
      speak(msg, { language: i18n.language, priority: 'normal', staticKey: 'nav_back' }).catch(() => {});
    };

    window.addEventListener('voice:back-button-clicked', handleBackButton);
    
    return () => {
      window.removeEventListener('voice:back-button-clicked', handleBackButton);
    };
  }, [shouldSpeak, i18n.language]);

  // Listen for form submissions
  useEffect(() => {
    const handleFormSubmit = (event) => {
      if (!shouldSpeak) return;
      const lang = getBaseLang(i18n.language);
      const msg = FORM_SUBMIT_MESSAGES[lang] || FORM_SUBMIT_MESSAGES.en;
      speak(msg, { language: i18n.language, priority: 'normal', staticKey: 'form_submitting' }).catch(() => {});
    };

    const handleFormSuccess = (event) => {
      if (!shouldSpeak) return;
      const lang = getBaseLang(i18n.language);
      const msg = FORM_SUCCESS_MESSAGES[lang] || FORM_SUCCESS_MESSAGES.en;
      speak(msg, { language: i18n.language, priority: 'warning', staticKey: 'form_success' }).catch(() => {});
    };

    const handleFormError = (event) => {
      if (!shouldSpeak) return;
      const lang = getBaseLang(i18n.language);
      const msg = FORM_ERROR_MESSAGES[lang] || FORM_ERROR_MESSAGES.en;
      speak(msg, { language: i18n.language, priority: 'error', staticKey: 'form_error' }).catch(() => {});
    };

    window.addEventListener('voice:form-submit', handleFormSubmit);
    window.addEventListener('voice:form-success', handleFormSuccess);
    window.addEventListener('voice:form-error', handleFormError);

    return () => {
      window.removeEventListener('voice:form-submit', handleFormSubmit);
      window.removeEventListener('voice:form-success', handleFormSuccess);
      window.removeEventListener('voice:form-error', handleFormError);
    };
  }, [shouldSpeak, i18n.language]);

  // Visible overlay removed — the kiosk now exposes voice control via the
  // VK bottom-bar Voice button (see src/components/kiosk/VK.jsx), which
  // dispatches 'suvidha:toggle-voice-instructions'. This component only
  // owns the announcement logic now.
  return null;
};

export default VoiceInstructionEngine;
