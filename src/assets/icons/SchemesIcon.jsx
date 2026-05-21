export function SchemesIcon({ size = 48, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Scroll body */}
      <rect x="10" y="10" width="28" height="32" rx="2" stroke={color} strokeWidth="2.5" />
      {/* Scroll roll top */}
      <ellipse cx="24" cy="10" rx="14" ry="4" stroke={color} strokeWidth="2" />
      {/* Scroll roll bottom */}
      <ellipse cx="24" cy="42" rx="14" ry="4" stroke={color} strokeWidth="2" />
      {/* Text lines on scroll */}
      <line x1="16" y1="18" x2="32" y2="18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="16" y1="24" x2="32" y2="24" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <line x1="16" y1="30" x2="28" y2="30" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      {/* Official seal / stamp */}
      <circle cx="32" cy="34" r="5" stroke={color} strokeWidth="1.8" />
      <circle cx="32" cy="34" r="2.5" fill={color} opacity="0.4" />
    </svg>
  );
}
