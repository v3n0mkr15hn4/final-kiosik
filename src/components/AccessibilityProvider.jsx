import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

/**
 * Accessibility Context - WCAG 2.1 AA compliant
 * Supports 3 modes: 'normal', 'blind' (voice-first), 'elderly' (large text/high contrast)
 */
const AccessibilityContext = createContext();

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    return {
      highContrast: false,
      fontSize: 'normal',
      screenReaderAnnounce: () => {},
      toggleHighContrast: () => {},
      setFontSize: () => {},
      setHighContrast: () => {},
      setReducedMotion: () => {},
      reducedMotion: false,
      userMode: 'normal',
      setUserMode: () => {},
    };
  }
  return context;
};

export const AccessibilityProvider = ({ children }) => {
  const [highContrast, setHighContrastState] = useState(() => {
    return localStorage.getItem('a11y-high-contrast') === 'true';
  });
  const [fontSize, setFontSizeState] = useState(() => {
    return localStorage.getItem('a11y-font-size') || 'normal';
  });
  const [reducedMotion, setReducedMotionState] = useState(false);
  const [userMode, setUserModeState] = useState(() => {
    return sessionStorage.getItem('userMode') || 'normal';
  });
  const [announcement, setAnnouncement] = useState('');

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotionState(mq.matches);
    const handler = (e) => setReducedMotionState(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Apply high contrast
  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', highContrast);
    localStorage.setItem('a11y-high-contrast', highContrast);
  }, [highContrast]);

  // Apply font size scaling
  useEffect(() => {
    const scales = { small: '14px', normal: '16px', large: '20px', xlarge: '24px' };
    document.documentElement.style.fontSize = scales[fontSize] || '16px';
    localStorage.setItem('a11y-font-size', fontSize);
  }, [fontSize]);

  // Apply reduced motion  
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reducedMotion);
  }, [reducedMotion]);

  // Apply user mode class on body for CSS targeting
  useEffect(() => {
    document.body.classList.remove('mode-blind', 'mode-normal', 'mode-elderly');
    document.body.classList.add(`mode-${userMode}`);
  }, [userMode]);

  const toggleHighContrast = useCallback(() => {
    setHighContrastState(prev => !prev);
  }, []);

  const setFontSize = useCallback((size) => {
    setFontSizeState(size);
  }, []);

  const setHighContrast = useCallback((val) => {
    setHighContrastState(val);
  }, []);

  const setReducedMotion = useCallback((val) => {
    setReducedMotionState(val);
  }, []);

  const setUserMode = useCallback((mode) => {
    setUserModeState(mode);
    sessionStorage.setItem('userMode', mode);
    // Auto-configure settings based on mode
    if (mode === 'blind') {
      setHighContrastState(true);
      setFontSizeState('large');
      setReducedMotionState(true);
      sessionStorage.setItem('voiceNavAlwaysOn', 'true');
    } else if (mode === 'elderly') {
      setHighContrastState(true);
      setFontSizeState('xlarge');
      setReducedMotionState(true);
      sessionStorage.removeItem('voiceNavAlwaysOn');
    } else {
      setHighContrastState(false);
      setFontSizeState('normal');
      setReducedMotionState(false);
      sessionStorage.removeItem('voiceNavAlwaysOn');
    }
  }, []);

  const screenReaderAnnounce = useCallback((message, priority = 'polite') => {
    setAnnouncement('');
    setTimeout(() => setAnnouncement(message), 100);
  }, []);

  const value = {
    highContrast,
    fontSize,
    reducedMotion,
    toggleHighContrast,
    setFontSize,
    setHighContrast,
    setReducedMotion,
    screenReaderAnnounce,
    userMode,
    setUserMode,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clip: 'rect(0,0,0,0)' }}
      >
        {announcement}
      </div>
    </AccessibilityContext.Provider>
  );
};

export default AccessibilityProvider;
