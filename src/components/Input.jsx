import React, { useId } from 'react';

const Input = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  required = false,
  icon: Icon,
  className = '',
  inputClassName = '',
  voiceField,
  ...props
}) => {
  const generatedId = useId();
  const inputId = props.id || generatedId;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-kiosk-base font-semibold text-gray-700 mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" aria-hidden="true">
            <Icon className="w-6 h-6" />
          </div>
        )}
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          aria-required={required || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          data-voice-field={voiceField || undefined}
          className={`
            w-full px-4 py-4 text-kiosk-lg rounded-kiosk border-2
            transition-all duration-200 touch-manipulation
            ${Icon ? 'pl-14' : ''}
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-government-blue focus:ring-blue-200'}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            focus:outline-none focus:ring-4
            placeholder:text-gray-400
            ${inputClassName}
          `}
          {...props}
        />
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-2 text-kiosk-sm text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
};

export default Input;
