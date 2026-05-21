export function MunicipalIcon({ size = 48, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Main building body */}
      <rect x="6" y="22" width="36" height="20" rx="1" stroke={color} strokeWidth="2.5" />
      {/* Roof / pediment */}
      <path d="M4 22L24 8L44 22" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {/* Flagpole on top */}
      <line x1="24" y1="8" x2="24" y2="2" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Flag */}
      <path d="M24 2L32 5L24 8Z" fill={color} />
      {/* Columns */}
      <line x1="13" y1="22" x2="13" y2="42" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="20" y1="22" x2="20" y2="42" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="28" y1="22" x2="28" y2="42" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="35" y1="22" x2="35" y2="42" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Central door */}
      <rect x="20" y="30" width="8" height="12" rx="4" stroke={color} strokeWidth="2" />
      {/* Base step */}
      <line x1="3" y1="42" x2="45" y2="42" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
