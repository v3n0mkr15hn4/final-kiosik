import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Eye, ZoomIn, ZoomOut, Sun, Type, Accessibility } from 'lucide-react';
import { useAccessibility } from './AccessibilityProvider';

/**
 * Floating Accessibility Toolbar
 * Provides quick access to accessibility features:
 * - High contrast toggle
 * - Font size controls
 * - Screen reader hints
 * Follows WCAG 2.1 AA guidelines
 */
const AccessibilityToolbar = () => {
  const { t } = useTranslation();
  const { highContrast, fontSize, toggleHighContrast, setFontSize } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);

  const fontSizes = [
    { id: 'small', label: 'A-', ariaLabel: 'Small text' },
    { id: 'normal', label: 'A', ariaLabel: 'Normal text' },
    { id: 'large', label: 'A+', ariaLabel: 'Large text' },
    { id: 'xlarge', label: 'A++', ariaLabel: 'Extra large text' },
  ];

  const togglePanel = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 no-print" role="toolbar" aria-label="Accessibility options">
      {/* Toggle Button */}
      <button
        onClick={togglePanel}
        className={`
          w-16 h-16 rounded-full shadow-xl flex items-center justify-center
          transition-all duration-200 touch-manipulation
          ${highContrast
            ? 'bg-yellow-400 text-black border-4 border-black'
            : 'bg-government-blue text-white hover:bg-blue-800'}
        `}
        aria-label="Toggle accessibility options"
        aria-expanded={isOpen}
      >
        <Accessibility className="w-8 h-8" />
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          className={`
            absolute bottom-20 right-0 w-72 rounded-kiosk-lg shadow-2xl p-4
            animate-slide-up
            ${highContrast
              ? 'bg-black text-yellow-400 border-4 border-yellow-400'
              : 'bg-white border-2 border-gray-200'}
          `}
          role="region"
          aria-label="Accessibility settings"
        >
          <h3 className="text-kiosk-lg font-bold mb-4 flex items-center gap-2">
            <Accessibility className="w-6 h-6" />
            {t('accessibility.title') || 'Accessibility'}
          </h3>

          {/* High Contrast */}
          <div className="mb-4">
            <button
              onClick={toggleHighContrast}
              className={`
                w-full flex items-center justify-between p-3 rounded-kiosk
                transition-colors touch-manipulation min-h-[52px]
                ${highContrast
                  ? 'bg-yellow-400 text-black'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-800'}
              `}
              aria-pressed={highContrast}
              role="switch"
            >
              <span className="flex items-center gap-2 text-kiosk-base font-semibold">
                <Sun className="w-5 h-5" />
                {t('accessibility.highContrast') || 'High Contrast'}
              </span>
              <span className={`w-12 h-6 rounded-full relative transition-colors ${highContrast ? 'bg-black' : 'bg-gray-300'}`}>
                <span className={`absolute w-5 h-5 rounded-full top-0.5 transition-all ${highContrast ? 'right-0.5 bg-yellow-400' : 'left-0.5 bg-white'}`} />
              </span>
            </button>
          </div>

          {/* Font Size */}
          <div className="mb-4">
            <label className="text-kiosk-sm font-semibold mb-2 block flex items-center gap-2">
              <Type className="w-5 h-5" />
              {t('accessibility.fontSize') || 'Font Size'}
            </label>
            <div className="flex gap-2">
              {fontSizes.map((size) => (
                <button
                  key={size.id}
                  onClick={() => setFontSize(size.id)}
                  className={`
                    flex-1 py-3 rounded-kiosk font-bold text-kiosk-base
                    transition-all touch-manipulation min-h-[48px]
                    ${fontSize === size.id
                      ? highContrast
                        ? 'bg-yellow-400 text-black'
                        : 'bg-government-blue text-white'
                      : highContrast
                        ? 'bg-gray-800 text-yellow-400 border border-yellow-400'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                  `}
                  aria-label={size.ariaLabel}
                  aria-pressed={fontSize === size.id}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </div>

          {/* Keyboard Hint */}
          <div className={`p-3 rounded-kiosk text-kiosk-sm ${highContrast ? 'bg-gray-900 text-yellow-300' : 'bg-blue-50 text-blue-700'}`}>
            <p className="font-semibold">{t('accessibility.keyboardHint') || 'Keyboard Navigation'}</p>
            <p className="mt-1 opacity-80">Tab to navigate, Enter to select, Esc to go back</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessibilityToolbar;
