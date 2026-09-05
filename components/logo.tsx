/**
 * BookaCourt brand mark — a white "B" built from court line-markings on a
 * brand-blue rounded tile. Scales cleanly for the header, footer and favicon.
 */
export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="BookaCourt"
      className={className}
    >
      <rect x="2" y="2" width="44" height="44" rx="11" fill="var(--color-brand)" />
      <g fill="none" stroke="#ffffff" strokeLinecap="round" strokeLinejoin="round">
        {/* court markings inside the letter */}
        <g strokeWidth={1.3} opacity={0.85}>
          <line x1="24.5" y1="12" x2="24.5" y2="36" />
          <line x1="16" y1="18" x2="24.5" y2="18" />
          <line x1="16" y1="30" x2="24.5" y2="30" />
          <line x1="22.5" y1="24" x2="26.5" y2="24" />
        </g>
        {/* bold "B" */}
        <g strokeWidth={3.2}>
          <path d="M16 12 V36" />
          <path d="M16 12 H27 C31.5 12 34 14.7 34 18 C34 21.3 31.5 24 27 24 H16" />
          <path d="M16 24 H28 C32.5 24 35 26.7 35 30 C35 33.3 32.5 36 28 36 H16" />
        </g>
      </g>
    </svg>
  );
}
