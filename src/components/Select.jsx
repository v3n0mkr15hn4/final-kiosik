import React from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Touch-optimized select component
 */
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
  ...props
}) => {
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label className="block text-kiosk-base font-semibold text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          disabled={disabled}
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
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-500">
          <ChevronDown className="w-6 h-6" />
        </div>
      </div>
      {error && (
        <p className="mt-2 text-kiosk-sm text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
};

export default Select;
