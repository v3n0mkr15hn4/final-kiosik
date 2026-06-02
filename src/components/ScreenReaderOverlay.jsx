import React, { useEffect, useRef, useCallback } from 'react';
import { useAccessibility } from './AccessibilityProvider';
import { speak as ttsSpeak } from '../utils/ttsService';

/**
 * ScreenReaderOverlay
 * When in 'blind' mode, reads aloud every visible text element on the screen.
 * Also announces focus changes and button labels.
 * Uses Web Speech API (SpeechSynthesis).
 */
const ScreenReaderOverlay = () => {
  const { userMode } = useAccessibility();
  const lastReadRef = useRef('');
  const observerRef = useRef(null);

  const speak = useCallback((text) => {
    if (!text || text === lastReadRef.current) return;
    lastReadRef.current = text;
    const lang = (localStorage.getItem('i18nextLng') || 'en').split('-')[0];
    ttsSpeak(text, { language: lang }).catch(() => {});
  }, []);

  // Read focused element
  useEffect(() => {
    if (userMode !== 'blind') return;

    const handleFocus = (e) => {
      const el = e.target;
      const label = el.getAttribute('aria-label') 
        || el.getAttribute('title') 
        || el.textContent?.trim()?.slice(0, 200);
      if (label) {
        const role = el.tagName === 'BUTTON' ? 'Button: ' 
          : el.tagName === 'A' ? 'Link: '
          : el.tagName === 'INPUT' ? `Input field: ${el.placeholder || el.name || ''}, ` 
          : '';
        speak(role + label);
      }
    };

    document.addEventListener('focusin', handleFocus);
    return () => document.removeEventListener('focusin', handleFocus);
  }, [userMode, speak]);

  // Read all visible content when page changes (mutation observer)
  useEffect(() => {
    if (userMode !== 'blind') return;

    const readPage = () => {
      const main = document.querySelector('main') || document.querySelector('#root');
      if (!main) return;

      // Collect headings, buttons, and paragraph text
      const elements = main.querySelectorAll('h1, h2, h3, p, button, a, label, [aria-label]');
      const texts = [];
      elements.forEach((el) => {
        const ariaLabel = el.getAttribute('aria-label');
        const text = (ariaLabel || el.textContent || '').trim();
        if (text && text.length > 1 && text.length < 300) {
          texts.push(text);
        }
      });

      const fullText = texts.slice(0, 20).join('. ');
      if (fullText && fullText !== lastReadRef.current) {
        // Delay to let the page render
        setTimeout(() => speak(fullText), 800);
      }
    };

    // Observe DOM changes (route changes will trigger mutations)
    const observer = new MutationObserver(() => {
      readPage();
    });

    const root = document.querySelector('#root');
    if (root) {
      observer.observe(root, { childList: true, subtree: true });
    }

    // Initial read
    setTimeout(readPage, 1000);
    observerRef.current = observer;

    return () => {
      observer.disconnect();
    };
  }, [userMode, speak]);

  // Don't render anything visible
  return null;
};

export default ScreenReaderOverlay;
