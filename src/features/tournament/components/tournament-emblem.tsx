interface TournamentEmblemProps {
  className?: string;
}

/** An arcade joystick: the fighting game motif of the KOF tournament. Decorative, so screen readers skip it. */
export function TournamentEmblem({ className }: Readonly<TournamentEmblemProps>) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinejoin="round"
      strokeLinecap="round"
      className={className}
    >
      <circle cx="22" cy="14" r="9" fill="currentColor" />
      <path d="M22 23v17" />
      <path d="M6 54l5-14h42l5 14z" />
      <circle cx="40" cy="30" r="4" fill="currentColor" />
      <circle cx="52" cy="26" r="4" fill="currentColor" />
      <path d="M14 47h36" />
    </svg>
  );
}
