/** The pole and weighted base of a display stand, drawn to the same 400-unit width as the wig. */
export function StandBase({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 120" className={className} aria-hidden="true">
      <rect x="196" y="0" width="8" height="104" fill="var(--espresso)" />
      <rect x="168" y="100" width="64" height="6" rx="1" fill="var(--espresso)" />
      <ellipse cx="200" cy="112" rx="58" ry="6" fill="var(--espresso)" />
    </svg>
  );
}
