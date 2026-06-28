/**
 * SessionContext — single source of truth for the kiosk session.
 *
 * Owns: language (Sarvam code), speaker (derived), voiceEnabled (opt-in),
 *       isLoggedIn, userType, aadhaarVerified.
 *
 * Rules:
 *  - language is set once after login and is immutable for the rest of the
 *    session (governs TTS speaker, STT language code, and UI strings).
 *  - voiceEnabled is set during onboarding and never flipped on afterwards by
 *    anything except an explicit new session.
 *  - This context is the ONLY thing that configures ttsService / speechRecognition.
 *    No component passes language or speaker to those services directly.
 */

import React, {
  createContext, useContext, useState, useEffect, useCallback, useMemo,
} from 'react';
import { VOICE_PROFILE } from '../config/voiceProfile';
import { configureTTS } from '../utils/ttsService';
import { configureSTT } from '../ai/voice/speechRecognition';

const STORAGE_KEY = 'suvidha:session';

const deriveSpeaker = (langCode) =>
  VOICE_PROFILE.speakers[langCode] || VOICE_PROFILE.defaultSpeaker;

const DEFAULT_STATE = {
  language: 'en-IN',
  speaker: deriveSpeaker('en-IN'),
  voiceEnabled: true,  // kiosk default: voice always on; user can turn off via bottom bar
  isLoggedIn: false,
  userType: null,        // 'citizen' | 'guest' | 'admin'
  aadhaarVerified: false,
};

function hydrate() {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    const language = parsed.language || DEFAULT_STATE.language;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      language,
      speaker: deriveSpeaker(language),
    };
  } catch {
    return DEFAULT_STATE;
  }
}

const SessionContext = createContext(null);

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}

export function SessionProvider({ children }) {
  const [state, setState] = useState(hydrate);

  // Drive the voice services + persist whenever the relevant fields change.
  useEffect(() => {
    configureTTS({
      language: state.language,
      speaker: state.speaker,
      voiceEnabled: state.voiceEnabled,
    });
    configureSTT(state.language);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch { /* storage unavailable — ignore */ }
  }, [state]);

  // language is immutable once set after login — only the onboarding language
  // step calls this, before voiceEnabled is true.
  const setLanguage = useCallback((langCode) => {
    if (!langCode) return;
    setState((prev) => ({ ...prev, language: langCode, speaker: deriveSpeaker(langCode) }));
  }, []);

  const setVoiceEnabled = useCallback((enabled) => {
    setState((prev) => ({ ...prev, voiceEnabled: Boolean(enabled) }));
  }, []);

  const setUserType = useCallback((userType) => {
    setState((prev) => ({ ...prev, userType }));
  }, []);

  const setLoggedIn = useCallback((isLoggedIn) => {
    setState((prev) => ({ ...prev, isLoggedIn: Boolean(isLoggedIn) }));
  }, []);

  const setAadhaarVerified = useCallback((verified) => {
    setState((prev) => ({ ...prev, aadhaarVerified: Boolean(verified) }));
  }, []);

  const resetSession = useCallback(() => {
    setState(DEFAULT_STATE);
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ok */ }
  }, []);

  const value = useMemo(() => ({
    ...state,
    setLanguage,
    setVoiceEnabled,
    setUserType,
    setLoggedIn,
    setAadhaarVerified,
    resetSession,
  }), [state, setLanguage, setVoiceEnabled, setUserType, setLoggedIn, setAadhaarVerified, resetSession]);

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export default SessionProvider;
