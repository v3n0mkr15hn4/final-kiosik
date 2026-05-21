import React from 'react';
import Button from './Button';

export const PageContainer = ({ tone = 'default', children }) => {
  const tones = {
    default: 'from-gray-50 to-white',
    water: 'from-sky-50 to-white',
    sanitation: 'from-emerald-50 to-white',
    healthcare: 'from-pink-50 to-white',
    municipal: 'from-indigo-50 to-white',
    transport: 'from-cyan-50 to-white',
    schemes: 'from-violet-50 to-white',
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b ${tones[tone] || tones.default}`}>
      {children}
    </div>
  );
};

export const DepartmentHeader = ({
  title,
  subtitle,
  icon: Icon,
  iconProps = {},
  gradient = 'from-government-blue to-blue-700',
}) => (
  <div className={`rounded-kiosk-lg bg-gradient-to-r ${gradient} p-6 md:p-8 text-white shadow-kiosk mb-8`}>
    <div className="flex items-center gap-4">
      <div className="w-14 h-14 rounded-xl bg-white/15 flex items-center justify-center">
        {Icon ? <Icon {...iconProps} /> : null}
      </div>
      <div>
        <h1 className="text-kiosk-2xl md:text-kiosk-3xl font-bold leading-tight">{title}</h1>
        {subtitle ? <p className="text-kiosk-base text-white/90 mt-1">{subtitle}</p> : null}
      </div>
    </div>
  </div>
);

export const SectionTitle = ({ title, icon: Icon, accentClass = 'text-government-blue', className = '' }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    {Icon ? <Icon className={`w-5 h-5 ${accentClass}`} /> : null}
    <h2 className="text-kiosk-xl font-bold text-gray-800">{title}</h2>
  </div>
);

export const ServiceCard = ({
  title,
  icon: Icon,
  iconProps = {},
  gradient = 'from-government-blue to-blue-700',
  selected = false,
  badge,
  onClick,
  accessibilityLabel,
}) => (
  <button
    onClick={onClick}
    className={`
      relative text-left rounded-kiosk-lg p-5 text-white shadow-kiosk transition-all duration-200
      bg-gradient-to-br ${gradient} hover:scale-[1.02] active:scale-[0.98] touch-manipulation
      ${selected ? 'ring-4 ring-white/80' : ''}
    `}
    aria-label={accessibilityLabel || title}
  >
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-kiosk bg-white/15 flex items-center justify-center">
        {Icon ? <Icon {...iconProps} /> : null}
      </div>
      <h3 className="text-kiosk-base font-bold leading-snug">{title}</h3>
    </div>
    {badge ? (
      <span className="absolute top-3 right-3 text-xs font-bold px-2 py-1 rounded-full bg-white text-government-blue">
        {badge}
      </span>
    ) : null}
  </button>
);

export const UtilityCard = ({
  title,
  description,
  icon: Icon,
  iconProps = {},
  gradient = 'from-gray-50 to-gray-100',
  onClick,
  accessibilityLabel,
}) => (
  <button
    onClick={onClick}
    className={`text-left rounded-kiosk-lg p-5 bg-gradient-to-br ${gradient} border border-gray-200 hover:shadow-kiosk transition-all duration-200 touch-manipulation`}
    aria-label={accessibilityLabel || title}
  >
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-kiosk bg-white/70 flex items-center justify-center">
        {Icon ? <Icon {...iconProps} /> : null}
      </div>
      <div>
        <h3 className="text-kiosk-base font-bold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
    </div>
  </button>
);

export const ResponsiveGrid = ({ variant = 'services', className = '', children }) => {
  const variants = {
    services: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    utilities: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  };

  return (
    <div className={`grid gap-4 ${variants[variant] || variants.services} ${className}`}>
      {children}
    </div>
  );
};

export const ActionButton = ({
  children,
  variant = 'primary',
  icon,
  iconPosition = 'left',
  size = 'large',
  ...props
}) => (
  <Button
    variant={variant}
    icon={icon}
    iconPosition={iconPosition}
    size={size}
    {...props}
  >
    {children}
  </Button>
);

export default {
  PageContainer,
  DepartmentHeader,
  SectionTitle,
  ServiceCard,
  UtilityCard,
  ResponsiveGrid,
  ActionButton,
};
