/** The pole and weighted base of a display stand, drawn to the same 400-unit width as the wig. */
export function StandBase({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 64" className={className} aria-hidden="true">
      <rect x="196" y="0" width="8" height="50" fill="var(--espresso)" />
      <rect x="170" y="46" width="60" height="6" rx="1" fill="var(--espresso)" />
      <ellipse cx="200" cy="56" rx="56" ry="6" fill="var(--espresso)" />
    </svg>
  );
}
