export function ElectricityIcon({ size = 48, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Transmission tower base */}
      <line x1="24" y1="6" x2="24" y2="42" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      {/* Cross arms */}
      <line x1="10" y1="16" x2="38" y2="16" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="14" y1="24" x2="34" y2="24" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      {/* Diagonal struts */}
      <line x1="10" y1="16" x2="18" y2="24" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="38" y1="16" x2="30" y2="24" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="14" y1="24" x2="20" y2="34" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="34" y1="24" x2="28" y2="34" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      {/* Base feet */}
      <line x1="20" y1="34" x2="16" y2="42" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="28" y1="34" x2="32" y2="42" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      {/* Lightning bolt — centred */}
      <path d="M27 8L20 20H25L21 32L31 18H26L27 8Z" fill={color} />
    </svg>
  );
}
