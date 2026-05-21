import React from 'react';

/**
 * Loading spinner component
 */
const LoadingSpinner = ({ size = 'medium', message, className = '' }) => {
  const sizes = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div
        className={`
          ${sizes[size]}
          border-4 border-gray-200 border-t-government-blue
          rounded-full animate-spin
        `}
      />
      {message && (
        <p className="mt-4 text-kiosk-lg text-gray-600">{message}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
