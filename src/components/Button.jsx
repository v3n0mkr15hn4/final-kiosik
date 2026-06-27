import React from 'react';

/**
 * Touch-optimized button component for kiosk interface
 */
const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'large',
  disabled = false,
  fullWidth = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  type = 'button',
  ...props
}) => {
  // Radius matches the `.btn` primitive (32px * --ui-scale) so React buttons and
  // CSS-primitive buttons share one kiosk scale across the app.
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-[calc(32px*var(--ui-scale))] transition-all duration-200 touch-manipulation select-none active:scale-95';
  
  const variants = {
    primary: 'bg-government-blue text-white hover:bg-blue-800 active:bg-blue-900 shadow-kiosk hover:shadow-kiosk-hover',
    secondary: 'bg-white text-government-blue border-2 border-government-blue hover:bg-blue-50 active:bg-blue-100',
    success: 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 shadow-kiosk',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-kiosk',
    outline: 'bg-transparent text-government-blue border-2 border-government-blue hover:bg-government-blue hover:text-white',
    ghost: 'bg-transparent text-government-blue hover:bg-blue-50 active:bg-blue-100',
    orange: 'bg-government-orange text-white hover:bg-orange-600 active:bg-orange-700 shadow-kiosk',
  };

  // Sizes track the `.btn` / `.btn-xl` primitive kiosk scale (min-height 120px /
  // 160px * --ui-scale, font 40px / 48px) so touch targets match across the app.
  const sizes = {
    small: 'px-[calc(1.25rem*var(--ui-scale))] py-[calc(0.75rem*var(--ui-scale))] text-kiosk-xl min-h-[calc(72px*var(--ui-scale))]',
    medium: 'px-[calc(1.75rem*var(--ui-scale))] py-[calc(1rem*var(--ui-scale))] text-kiosk-2xl min-h-[calc(96px*var(--ui-scale))]',
    large: 'px-[calc(3rem*var(--ui-scale))] py-[calc(1.5rem*var(--ui-scale))] text-kiosk-3xl min-h-[calc(120px*var(--ui-scale))]',
    xlarge: 'px-[calc(4.5rem*var(--ui-scale))] py-[calc(2rem*var(--ui-scale))] text-kiosk-4xl min-h-[calc(160px*var(--ui-scale))]',
  };

  const disabledStyles = 'opacity-50 cursor-not-allowed pointer-events-none';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${disabled ? disabledStyles : ''}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      {...props}
    >
      {Icon && iconPosition === 'left' && (
        <Icon className="w-[calc(1.5rem*var(--ui-scale))] h-[calc(1.5rem*var(--ui-scale))] mr-2" />
      )}
      {children}
      {Icon && iconPosition === 'right' && (
        <Icon className="w-[calc(1.5rem*var(--ui-scale))] h-[calc(1.5rem*var(--ui-scale))] ml-2" />
      )}
    </button>
  );
};

export default Button;
