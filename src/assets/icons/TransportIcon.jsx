export function TransportIcon({ size = 48, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Auto-rickshaw body */}
      <path
        d="M8 30 Q8 20 16 18 L36 18 Q42 18 42 26 L42 34 L8 34 Z"
        stroke={color} strokeWidth="2.5" strokeLinejoin="round"
      />
      {/* Roof */}
      <path d="M14 18 L14 12 L36 12 L36 18" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {/* Windshield */}
      <path d="M14 12 Q14 18 20 18 L36 18" stroke={color} strokeWidth="1.5" />
      {/* Front wheel */}
      <circle cx="14" cy="36" r="4" stroke={color} strokeWidth="2.5" />
      <circle cx="14" cy="36" r="1.5" fill={color} />
      {/* Rear wheel */}
      <circle cx="36" cy="36" r="4" stroke={color} strokeWidth="2.5" />
      <circle cx="36" cy="36" r="1.5" fill={color} />
      {/* Passenger window */}
      <rect x="22" y="20" width="10" height="8" rx="2" stroke={color} strokeWidth="1.8" />
      {/* Handle bar */}
      <path d="M8 26 Q6 24 6 22 L10 22" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
