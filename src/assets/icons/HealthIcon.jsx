export function HealthIcon({ size = 48, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Outer circle */}
      <circle cx="24" cy="24" r="20" stroke={color} strokeWidth="2.5" />
      {/* Lotus petal decorations (4 petals) */}
      <ellipse cx="24" cy="7" rx="3" ry="5" fill={color} opacity="0.2" />
      <ellipse cx="41" cy="24" rx="5" ry="3" fill={color} opacity="0.2" />
      <ellipse cx="24" cy="41" rx="3" ry="5" fill={color} opacity="0.2" />
      <ellipse cx="7" cy="24" rx="5" ry="3" fill={color} opacity="0.2" />
      {/* Medical cross — horizontal bar */}
      <rect x="16" y="21" width="16" height="6" rx="2" fill={color} />
      {/* Medical cross — vertical bar */}
      <rect x="21" y="16" width="6" height="16" rx="2" fill={color} />
    </svg>
  );
}
