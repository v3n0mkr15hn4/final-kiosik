import React from 'react';

/**
 * Touch-optimized card component for service selection
 */
const Card = ({
  children,
  onClick,
  selected = false,
  disabled = false,
  icon: Icon,
  title,
  subtitle,
  variant = 'default',
  size = 'large',
  className = '',
  ...props
}) => {
  // Radius matches the `.card` primitive (--r-lg = 28px * --ui-scale).
  const baseStyles = 'relative flex flex-col items-center justify-center rounded-[calc(28px*var(--ui-scale))] transition-all duration-200 cursor-pointer touch-manipulation select-none';

  const variants = {
    default: `bg-white border-2 ${selected ? 'border-government-blue bg-blue-50' : 'border-gray-200'} hover:border-government-blue hover:shadow-kiosk-hover`,
    primary: 'bg-government-blue text-white hover:bg-blue-800 shadow-kiosk hover:shadow-kiosk-hover',
    secondary: 'bg-government-grey border-2 border-transparent hover:border-government-blue',
    gradient: 'bg-gradient-to-br from-government-blue to-government-lightBlue text-white shadow-kiosk hover:shadow-kiosk-hover',
  };

  // Padding tracks the `.card` primitive (64px * --ui-scale at the default size).
  const sizes = {
    small: 'p-[calc(32px*var(--ui-scale))] min-h-[calc(100px*var(--ui-scale))]',
    medium: 'p-[calc(48px*var(--ui-scale))] min-h-[calc(140px*var(--ui-scale))]',
    large: 'p-[calc(64px*var(--ui-scale))] min-h-[calc(180px*var(--ui-scale))]',
    xlarge: 'p-[calc(80px*var(--ui-scale))] min-h-[calc(220px*var(--ui-scale))]',
  };

  const disabledStyles = 'opacity-50 cursor-not-allowed pointer-events-none';
  const selectedStyles = 'ring-4 ring-government-blue ring-opacity-50';

  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${disabled ? disabledStyles : 'active:scale-[0.98]'}
        ${selected ? selectedStyles : ''}
        ${className}
      `}
      role="button"
      tabIndex={disabled ? -1 : 0}
      {...props}
    >
      {Icon && (
        <div className={`mb-4 ${variant === 'default' ? 'text-government-blue' : ''}`}>
          <Icon className="w-12 h-12 md:w-16 md:h-16" strokeWidth={1.5} />
        </div>
      )}
      {title && (
        <h3 className={`text-kiosk-lg md:text-kiosk-xl font-bold text-center ${variant === 'default' ? 'text-government-blue' : ''}`}>
          {title}
        </h3>
      )}
      {subtitle && (
        <p className={`text-kiosk-sm mt-2 text-center ${variant === 'default' ? 'text-gray-600' : 'opacity-80'}`}>
          {subtitle}
        </p>
      )}
      {children}
      {selected && (
        <div className="absolute top-3 right-3">
          <div className="w-6 h-6 bg-government-blue rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default Card;
