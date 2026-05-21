export function OfficeIcon({ size = 48, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Map pin teardrop */}
      <path
        d="M24 4C16.27 4 10 10.27 10 18C10 27 24 44 24 44C24 44 38 27 38 18C38 10.27 31.73 4 24 4Z"
        stroke={color} strokeWidth="2.5" strokeLinejoin="round"
      />
      {/* Inner circle */}
      <circle cx="24" cy="18" r="6" stroke={color} strokeWidth="2.2" />
      {/* Small office building inside circle */}
      <rect x="21" y="15" width="6" height="6" fill={color} opacity="0.5" rx="1" />
      <line x1="21" y1="16.5" x2="27" y2="16.5" stroke={color} strokeWidth="0.8" />
      <line x1="24" y1="15" x2="24" y2="21" stroke={color} strokeWidth="0.8" />
    </svg>
  );
}
