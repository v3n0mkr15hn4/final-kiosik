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
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-kiosk transition-all duration-200 touch-manipulation select-none active:scale-95';
  
  const variants = {
    primary: 'bg-government-blue text-white hover:bg-blue-800 active:bg-blue-900 shadow-kiosk hover:shadow-kiosk-hover',
    secondary: 'bg-white text-government-blue border-2 border-government-blue hover:bg-blue-50 active:bg-blue-100',
    success: 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800 shadow-kiosk',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-kiosk',
    outline: 'bg-transparent text-government-blue border-2 border-government-blue hover:bg-government-blue hover:text-white',
    ghost: 'bg-transparent text-government-blue hover:bg-blue-50 active:bg-blue-100',
    orange: 'bg-government-orange text-white hover:bg-orange-600 active:bg-orange-700 shadow-kiosk',
  };

  const sizes = {
    small: 'px-4 py-2 text-kiosk-sm min-h-[44px]',
    medium: 'px-6 py-3 text-kiosk-base min-h-[52px]',
    large: 'px-8 py-4 text-kiosk-lg min-h-[60px]',
    xlarge: 'px-10 py-5 text-kiosk-xl min-h-[72px]',
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
        <Icon className="w-6 h-6 mr-2" />
      )}
      {children}
      {Icon && iconPosition === 'right' && (
        <Icon className="w-6 h-6 ml-2" />
      )}
    </button>
  );
};

export default Button;
