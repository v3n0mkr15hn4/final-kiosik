import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAccessibility } from './AccessibilityProvider';
import { speak as ttsSpeak, isVoiceEnabled } from '../utils/ttsService';

const getBaseLang = (language) => (language || 'en').toLowerCase().split('-')[0];

/**
 * WakeWordListener — "Hey Suvidha"
 * Always runs in the background listening for the wake word.
 * When detected, activates blind/voice mode automatically.
 * Uses continuous Web Speech API recognition.
 */
const WakeWordListener = () => {
  const { t } = useTranslation();
  const { userMode, setUserMode } = useAccessibility();
  const [isListening, setIsListening] = useState(false);
  const [detected, setDetected] = useState(false);
  const recognitionRef = useRef(null);
  const restartTimeoutRef = useRef(null);

  // Pretrained-model voice only (ttsService). No robotic browser SpeechSynthesis.
  // Language/speaker are forced by the session config inside ttsService.
  const speak = useCallback((text) => {
    ttsSpeak(text, { interrupt: true });
  }, []);

  const activateBlindMode = useCallback(() => {
    setDetected(true);
    
    // Set blind mode
    setUserMode('blind');
    sessionStorage.setItem('userMode', 'blind');
    sessionStorage.setItem('voiceNavAlwaysOn', 'true');

    // Activation feedback must always be audible — bypass the session voiceEnabled
    // gate by falling back to Web Speech directly when ttsService voice is off.
    if (isVoiceEnabled()) {
      ttsSpeak(t('wakeword.activationMessage'), { staticKey: 'greet_wake' }).catch(() => speak(t('wakeword.activationMessage')));
    } else {
      speak(t('wakeword.activationMessage'));
    }

    // Reset detection indicator after 3s
    setTimeout(() => setDetected(false), 3000);
  }, [setUserMode, speak, t]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    // Don't run wake-word listener if already in blind mode
    // (VoiceNavigation handles commands in blind mode)
    if (userMode === 'blind') return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    const lang = getBaseLang(localStorage.getItem('i18nextLng') || 'en');
    // Full STT language map — bridge languages use hi-IN so "Hey Suvidha" is still heard
    const langMap = {
      en: 'en-IN', hi: 'hi-IN', ta: 'ta-IN', te: 'te-IN',
      kn: 'kn-IN', ml: 'ml-IN', mr: 'mr-IN', gu: 'gu-IN',
      bn: 'bn-IN', or: 'or-IN', pa: 'pa-IN', as: 'as-IN',
      ur: 'hi-IN', ks: 'hi-IN', sd: 'hi-IN', mai: 'hi-IN',
      kok: 'hi-IN', doi: 'hi-IN', ne: 'hi-IN', sa: 'hi-IN',
      mni: 'hi-IN', sat: 'hi-IN',
    };
    recognition.lang = langMap[lang] || 'hi-IN';

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript.toLowerCase().trim();
        
        // Check for wake word variants
        const wakeWords = [
          'hey suvidha', 'he suvidha', 'hay suvidha',
          'हे सुविधा', 'हेलो सुविधा', 'अरे सुविधा',
          'হে সুবিধা', 'হেলো সুবিধা', 'সুবিধা',
          'ஹே சுவிதா', 'சுவிதா',
        ];

        const isWakeWord = wakeWords.some((w) => transcript.includes(w));
        if (isWakeWord) {
          activateBlindMode();
          break;
        }
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Auto-restart unless in blind mode (where VoiceNavigation takes over)
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      const currentMode = sessionStorage.getItem('userMode');
      if (currentMode !== 'blind') {
        restartTimeoutRef.current = setTimeout(() => {
          try {
            recognition.start();
            setIsListening(true);
          } catch (e) { /* ignore */ }
        }, 2000);
      }
    };

    recognitionRef.current = recognition;

    // Start listening after a short delay
    setTimeout(() => {
      try {
        recognition.start();
        setIsListening(true);
      } catch (e) { /* ignore */ }
    }, 3000);

    return () => {
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      try { recognition.abort(); } catch (e) { /* ignore */ }
    };
  }, [userMode, activateBlindMode]);

  // Small indicator showing wake word listener status
  return (
    <>
      {/* Tiny indicator dot */}
      {isListening && userMode !== 'blind' && (
        <div
          className="fixed bottom-6 right-24 z-[9990] flex items-center space-x-1 bg-gray-800/80 text-white px-2 py-1 rounded-full text-xs"
          title={t('wakeword.indicatorLabel')}
        >
          <Mic className="w-3 h-3 text-green-400 animate-pulse" />
          <span className="hidden sm:inline">{t('wakeword.indicatorLabel')}</span>
        </div>
      )}

      {/* Detection flash */}
      {detected && (
        <div className="fixed inset-0 z-[10000] bg-purple-900/90 flex items-center justify-center animate-fade-in pointer-events-none">
          <div className="text-center text-white">
            <Mic className="w-24 h-24 mx-auto mb-4 animate-pulse" />
            <h2 className="text-4xl font-bold mb-2">{t('wakeword.activatedTitle')}</h2>
            <p className="text-xl opacity-80">{t('wakeword.switchingToVoice')}</p>
          </div>
        </div>
      )}
    </>
  );
};

export default WakeWordListener;
