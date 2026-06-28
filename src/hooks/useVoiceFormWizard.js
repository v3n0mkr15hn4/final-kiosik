/**
 * useVoiceFormWizard.js — sequential voice-driven form fill.
 *
 * For each field: speak prompt → listen (STT) → validate/normalise →
 * fillField() → speak confirmation → advance to next field.
 * Works for any language with a getSTTLangCode() entry; prompts are
 * localised for en/hi/as (see voiceFieldPrompts.js), other languages
 * fall back to English prompt text but still drive STT in that language.
 *
 * Field list shape: [{ name: 'aadhaar', optional: false }, ...]
 * `name` must match the field's data-voice-field / name / id attribute
 * AND a known key in formActions.js VALIDATORS for normalisation to apply.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { speak, stopTTS } from '../utils/ttsService';
import { startSTT, stopSTT } from '../ai/voice/speechRecognition';
import { fillField, validateField, normaliseFieldValue } from '../ai/actions/formActions';
import {
  getFieldText, getFieldStaticKey, getPrompt,
  CONFIRM_PROMPTS, INVALID_PROMPTS, REPEAT_PROMPTS, SKIP_ACK_PROMPTS,
} from '../utils/voiceFieldPrompts';

const LISTEN_TIMEOUT_MS = 8000;
const MAX_RETRIES = 3;
const SKIP_PATTERN = /\b(skip|छोड़ो|छोड़|এৰি|এড়াই)\b/i;

export function useVoiceFormWizard({ fields, language, onComplete, onFieldFilled } = {}) {
  const [currentField, setCurrentField] = useState(null);
  const [isActive, setIsActive] = useState(false);

  const fieldsRef = useRef(fields || []);
  const languageRef = useRef(language || 'en');
  const indexRef = useRef(-1);
  const retryRef = useRef(0);
  const timeoutRef = useRef(null);
  const activeRef = useRef(false);

  fieldsRef.current = fields || [];
  languageRef.current = language || 'en';

  const clearListenTimeout = () => {
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
  };

  const finish = useCallback(() => {
    clearListenTimeout();
    stopSTT();
    activeRef.current = false;
    setIsActive(false);
    setCurrentField(null);
    onComplete?.();
  }, [onComplete]);

  const stop = useCallback(() => {
    clearListenTimeout();
    stopSTT();
    stopTTS();
    activeRef.current = false;
    setIsActive(false);
    setCurrentField(null);
  }, []);

  const listenForField = useCallback((idx) => {
    if (!activeRef.current) return;
    const field = fieldsRef.current[idx];
    if (!field) return;

    stopSTT();
    clearListenTimeout();
    timeoutRef.current = setTimeout(() => {
      if (!activeRef.current || indexRef.current !== idx) return;
      stopSTT();
      speak(getPrompt(REPEAT_PROMPTS, languageRef.current), { priority: 'warning' })
        .then(() => listenForField(idx));
    }, LISTEN_TIMEOUT_MS);

    startSTT({
      language: languageRef.current,
      continuous: false,
      autoRestart: false,
      onResult: (text) => {
        if (!activeRef.current || indexRef.current !== idx) return;
        clearListenTimeout();
        stopSTT();
        handleResult(idx, text);
      },
      onInterim: () => {},
      onError: () => {},
    });
    // eslint-disable-next-line no-use-before-define
  }, []);

  const askField = useCallback((idx) => {
    const field = fieldsRef.current[idx];
    if (!field) { finish(); return; }

    indexRef.current = idx;
    retryRef.current = 0;
    setCurrentField(field.name);

    const staticKey = getFieldStaticKey(field.name);
    const text = getFieldText(field.name, languageRef.current) || `Please say your ${field.name}.`;

    speak(text, { staticKey, language: languageRef.current, priority: 'normal' })
      .then(() => listenForField(idx));
  }, [finish, listenForField]);

  const advance = useCallback((idx) => {
    const next = idx + 1;
    if (next >= fieldsRef.current.length) { finish(); return; }
    askField(next);
  }, [askField, finish]);

  const handleResult = useCallback((idx, rawText) => {
    const field = fieldsRef.current[idx];
    if (!field) return;
    const lang = languageRef.current;

    if (field.optional && SKIP_PATTERN.test(rawText || '')) {
      speak(getPrompt(SKIP_ACK_PROMPTS, lang), { staticKey: 'ask_shared_skip_ack' })
        .then(() => advance(idx));
      return;
    }

    const value = normaliseFieldValue(field.name, rawText);
    const { valid } = validateField(field.name, value);

    if (!valid || !value) {
      retryRef.current += 1;
      if (retryRef.current >= MAX_RETRIES) { advance(idx); return; }
      speak(getPrompt(INVALID_PROMPTS, lang), { staticKey: 'ask_shared_invalid', priority: 'warning' })
        .then(() => listenForField(idx));
      return;
    }

    fillField(field.name, value);
    onFieldFilled?.(field.name, value);
    speak(getPrompt(CONFIRM_PROMPTS, lang, value), { staticKey: 'ask_shared_confirm' })
      .then(() => advance(idx));
  }, [advance, listenForField, onFieldFilled]);

  const start = useCallback(() => {
    if (!fieldsRef.current.length) return;
    activeRef.current = true;
    setIsActive(true);
    askField(0);
  }, [askField]);

  useEffect(() => () => stop(), [stop]);

  return { start, stop, isActive, currentField };
}

export default useVoiceFormWizard;
