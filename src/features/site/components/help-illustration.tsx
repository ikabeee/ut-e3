import { cn } from "@heroui/react";
import type { ReactNode } from "react";
import type { HelpIllustrationId } from "@features/site/lib/help-topics";

interface HelpIllustrationProps {
  id: HelpIllustrationId;
  className?: string;
}

/**
 * The drawing of a help card: simple lines in the UTG style, white strokes with the accent blue on the one detail that
 * explains the problem. It is decoration (the title says the same in words), so it is hidden from screen readers.
 */
export function HelpIllustration({ id, className }: Readonly<HelpIllustrationProps>) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 120 80"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      data-illustration={id}
      className={cn("h-20 w-30 text-foreground", className)}
    >
      {DRAWINGS[id]()}
    </svg>
  );
}

// A phone, an arrow and a second phone: the passport moves to the new one.
function LostPhone(): ReactNode {
  return (
    <>
      <rect x="10" y="14" width="28" height="52" rx="4" />
      <path d="M20 58h8" />
      <rect x="82" y="14" width="28" height="52" rx="4" className="stroke-accent" />
      <path d="M92 58h8" className="stroke-accent" />
      <path d="M46 40h28M66 32l8 8-8 8" className="stroke-accent" />
    </>
  );
}

// An envelope that did not arrive: a question mark where the notice would be.
function NoEmail(): ReactNode {
  return (
    <>
      <rect x="12" y="24" width="68" height="46" rx="3" />
      <path d="M12 28l34 24 34-24" />
      <circle cx="94" cy="24" r="14" className="stroke-accent" />
      <path d="M89 20a5 5 0 1 1 7 4.5c-2 1-2 2-2 4M94 33v.5" className="stroke-accent" />
    </>
  );
}

// A stand with its awning and a speech bubble: tell the person at the counter.
function StandVisit(): ReactNode {
  return (
    <>
      <path d="M8 36l8-20h52l8 20z" />
      <path d="M16 36v32M68 36v32M8 68h68M28 52h32" />
      <path d="M26 16l-4 20M46 16l-2 20M58 16l2 20" />
      <path d="M82 8h30v22H98l-8 8v-8h-8z" className="stroke-accent" />
      <path d="M97 14v8M97 26v.5" className="stroke-accent" />
    </>
  );
}

// A raffle ticket with a star, torn along the dashed line.
function Tickets(): ReactNode {
  return (
    <>
      <path d="M12 20h96v14a7 7 0 0 0 0 14v14H12V48a7 7 0 0 0 0-14z" />
      <path d="M84 20v42" strokeDasharray="4 5" />
      <path d="M46 28l4.5 9.5 10 1.3-7.4 7 1.9 10L46 50.7l-9 5.1 1.9-10-7.4-7 10-1.3z" className="stroke-accent" />
    </>
  );
}

// The trophy of the tournament.
function Kof(): ReactNode {
  return (
    <>
      <path d="M42 10h36v20a18 18 0 0 1-36 0z" className="stroke-accent" />
      <path d="M42 16H30v6a12 12 0 0 0 12 12M78 16h12v6a12 12 0 0 1-12 12" />
      <path d="M60 48v14M44 70h32M50 62h20" />
    </>
  );
}

// The signal bars crossed out, and the phone that still holds the passport.
function Offline(): ReactNode {
  return (
    <>
      <path d="M16 32a56 56 0 0 1 56-14M28 44a38 38 0 0 1 26-10M40 56a20 20 0 0 1 8-5" />
      <circle cx="46" cy="66" r="2" />
      <path d="M12 8l50 64" className="stroke-accent" />
      <rect x="82" y="18" width="26" height="46" rx="4" />
      <path d="M90 56h10M90 28h10M90 36h10" />
    </>
  );
}

const DRAWINGS: Record<HelpIllustrationId, () => ReactNode> = {
  "lost-phone": LostPhone,
  "no-email": NoEmail,
  "stand-visit": StandVisit,
  tickets: Tickets,
  kof: Kof,
  offline: Offline,
};
