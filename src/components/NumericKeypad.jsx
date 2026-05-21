import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Delete, Check } from 'lucide-react';
import Button from './Button';

/**
 * Touch-optimized numeric keypad for OTP input
 */
const NumericKeypad = ({
  value = '',
  onChange,
  maxLength = 6,
  onSubmit,
  submitLabel,
  disabled = false,
}) => {
  const { t } = useTranslation();

  const handleKeyPress = useCallback((key) => {
    if (disabled) return;
    
    if (key === 'delete') {
      onChange(value.slice(0, -1));
    } else if (key === 'clear') {
      onChange('');
    } else if (value.length < maxLength) {
      onChange(value + key);
    }
  }, [value, onChange, maxLength, disabled]);

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['clear', '0', 'delete'],
  ];

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Display */}
      <div className="mb-6">
        <div className="flex justify-center space-x-3">
          {Array.from({ length: maxLength }).map((_, index) => (
            <div
              key={index}
              className={`
                w-14 h-16 rounded-kiosk border-2 flex items-center justify-center
                text-kiosk-2xl font-bold transition-all duration-200
                ${index < value.length 
                  ? 'border-government-blue bg-blue-50 text-government-blue' 
                  : 'border-gray-300 bg-white text-gray-400'}
              `}
            >
              {value[index] ? '●' : ''}
            </div>
          ))}
        </div>
      </div>

      {/* Keypad */}
      <div className="grid gap-3">
        {keys.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center space-x-3">
            {row.map((key) => (
              <button
                key={key}
                onClick={() => handleKeyPress(key)}
                disabled={disabled}
                className={`
                  w-20 h-20 rounded-kiosk text-kiosk-xl font-bold
                  transition-all duration-200 touch-manipulation
                  active:scale-95 select-none
                  ${key === 'delete' 
                    ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                    : key === 'clear'
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-white border-2 border-gray-200 text-government-blue hover:bg-blue-50 hover:border-government-blue'}
                  ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {key === 'delete' ? (
                  <Delete className="w-8 h-8 mx-auto" />
                ) : key === 'clear' ? (
                  'C'
                ) : (
                  key
                )}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Submit Button */}
      {onSubmit && (
        <div className="mt-6">
          <Button
            onClick={onSubmit}
            disabled={disabled || value.length !== maxLength}
            fullWidth
            size="xlarge"
            icon={Check}
          >
            {submitLabel || t('app.submit')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default NumericKeypad;
