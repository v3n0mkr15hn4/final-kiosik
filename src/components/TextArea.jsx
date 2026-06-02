import React, { useId } from 'react';

const TextArea = ({
  label,
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  required = false,
  rows = 4,
  maxLength,
  className = '',
  voiceField,
  ...props
}) => {
  const generatedId = useId();
  const textareaId = props.id || generatedId;
  const errorId = error ? `${textareaId}-error` : undefined;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-kiosk-base font-semibold text-gray-700 mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        data-voice-field={voiceField || undefined}
        className={`
          w-full px-4 py-4 text-kiosk-lg rounded-kiosk border-2
          transition-all duration-200 touch-manipulation resize-none
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-300 focus:border-government-blue focus:ring-blue-200'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          focus:outline-none focus:ring-4
          placeholder:text-gray-400
        `}
        {...props}
      />
      <div className="flex justify-between mt-2">
        {error && (
          <p id={errorId} role="alert" className="text-kiosk-sm text-red-500 font-medium">{error}</p>
        )}
        {maxLength && (
          <p className="text-kiosk-sm text-gray-500 ml-auto" aria-live="polite">
            {value?.length || 0} / {maxLength}
          </p>
        )}
      </div>
    </div>
  );
};

export default TextArea;
