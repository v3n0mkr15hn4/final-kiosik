export function TrackIcon({ size = 48, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Magnifier circle */}
      <circle cx="20" cy="20" r="12" stroke={color} strokeWidth="2.5" />
      {/* Magnifier handle */}
      <line x1="29" y1="29" x2="42" y2="42" stroke={color} strokeWidth="3" strokeLinecap="round" />
      {/* Timeline inside magnifier */}
      <line x1="13" y1="20" x2="27" y2="20" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      {/* Timeline dots */}
      <circle cx="15" cy="20" r="2" fill={color} />
      <circle cx="20" cy="20" r="2" fill={color} />
      <circle cx="25" cy="20" r="2" fill={color} />
      {/* Tick mark on last dot (completed) */}
      <path d="M23 17 L25 20 L28 16" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
