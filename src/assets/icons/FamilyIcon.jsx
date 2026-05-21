export function FamilyIcon({ size = 48, color = 'currentColor', className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Father — left adult */}
      <circle cx="14" cy="12" r="5" stroke={color} strokeWidth="2.2" />
      <path d="M7 42 L7 28 Q7 22 14 22 Q21 22 21 28 L21 42" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Mother — right adult */}
      <circle cx="34" cy="12" r="5" stroke={color} strokeWidth="2.2" />
      {/* Saree hint — wider silhouette bottom */}
      <path d="M27 42 L27 28 Q27 22 34 22 Q41 22 41 28 L41 42" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Child in middle */}
      <circle cx="24" cy="18" r="4" stroke={color} strokeWidth="2" />
      <path d="M19 42 L19 33 Q19 28 24 28 Q29 28 29 33 L29 42" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* Joining hands line (symbolic) */}
      <line x1="21" y1="32" x2="19" y2="32" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="29" y1="32" x2="27" y2="32" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
