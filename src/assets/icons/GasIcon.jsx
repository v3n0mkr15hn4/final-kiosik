export function GasIcon({ size = 48, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Cylinder body */}
      <rect x="13" y="18" width="22" height="22" rx="4" stroke={color} strokeWidth="2.5" />
      {/* Cylinder top cap */}
      <rect x="16" y="13" width="16" height="7" rx="3" stroke={color} strokeWidth="2.5" />
      {/* Valve on top */}
      <rect x="21" y="8" width="6" height="6" rx="1.5" stroke={color} strokeWidth="2" />
      <line x1="24" y1="8" x2="24" y2="5" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Flame */}
      <path
        d="M24 5C24 5 21 2 22 0C22 0 20 3 18 2C18 2 20 5 18 7C18 7 20 6 21 8C21 8 22 6 24 5Z"
        fill={color}
        transform="translate(3, 0) scale(0.9)"
      />
      {/* Bottom ring */}
      <line x1="13" y1="37" x2="35" y2="37" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Horizontal stripe on cylinder */}
      <line x1="13" y1="28" x2="35" y2="28" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
