import React, { useId } from 'react';
import { ChevronDown } from 'lucide-react';

const Select = ({
  label,
  value,
  onChange,
  options = [],
  placeholder,
  error,
  disabled = false,
  required = false,
  className = '',
  voiceField,
  ...props
}) => {
  const generatedId = useId();
  const selectId = props.id || generatedId;
  const errorId = error ? `${selectId}-error` : undefined;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-kiosk-base font-semibold text-gray-700 mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          value={value}
          onChange={onChange}
          disabled={disabled}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          data-voice-field={voiceField || undefined}
          className={`
            w-full px-4 py-4 text-kiosk-lg rounded-kiosk border-2
            transition-all duration-200 touch-manipulation appearance-none
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-government-blue focus:ring-blue-200'}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            focus:outline-none focus:ring-4
            pr-12
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value || option.id} value={option.value || option.id}>
              {option.label || option.name}
            </option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500" aria-hidden="true">
          <ChevronDown className="w-6 h-6" />
        </div>
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-kiosk-sm text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
};

export default Select;
