export function SanitationIcon({ size = 48, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Broom handle */}
      <line x1="32" y1="6" x2="16" y2="40" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      {/* Broom head bristles */}
      <path
        d="M10 36 Q12 30 16 28 Q20 26 24 30 Q20 38 14 42 Q10 42 10 36Z"
        stroke={color} strokeWidth="2" strokeLinejoin="round"
      />
      {/* Bristle lines */}
      <line x1="12" y1="38" x2="15" y2="30" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="15" y1="40" x2="18" y2="30" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="18" y1="41" x2="21" y2="31" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      {/* Dustbin on right */}
      <rect x="32" y="24" width="12" height="16" rx="2" stroke={color} strokeWidth="2.2" />
      {/* Bin lid */}
      <line x1="30" y1="24" x2="46" y2="24" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      {/* Bin handle */}
      <path d="M36 24 Q38 21 40 24" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Lines on bin */}
      <line x1="36" y1="28" x2="36" y2="36" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="40" y1="28" x2="40" y2="36" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
