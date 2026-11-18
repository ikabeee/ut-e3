import type { HTMLAttributes, Ref } from "react";
import { GuestBadge } from "@features/landing/components/guest-badge";
import type { SwingDirection } from "@features/landing/hooks/use-guest-carousel";
import type { SpecialGuest } from "@features/landing/lib/types";
import { cn } from "@heroui/react";

/** Rest angle of the badge: it leans left on an even index and right on an odd one. */
const TILT_CLASSES = {
  even: "[--pendulum-tilt:-1.5deg] min-[820px]:[--pendulum-tilt:-2deg]",
  odd: "[--pendulum-tilt:1.5deg] min-[820px]:[--pendulum-tilt:2deg]",
} as const;

/** The card behind leans the opposite way, so the badge reads as the top of a deck. */
const DECK_CLASSES = {
  even: "translate-x-3.5 translate-y-2.5 rotate-3",
  odd: "-translate-x-3.5 translate-y-2.5 -rotate-3",
} as const;

const DIRECTION_CLASSES = { 1: "[--pendulum-dir:1]", [-1]: "[--pendulum-dir:-1]" } as const;

const BADGE_WIDTH = "w-full max-w-80 min-[820px]:max-w-110";

interface BadgeSwing {
  index: number;
  moveCount: number;
  direction: SwingDirection;
  hasBeenSeen: boolean;
}

interface GuestBadgeStageProps {
  ref: Ref<HTMLDivElement>;
  guest: SpecialGuest;
  swing: BadgeSwing;
  /** Pointer handlers that make the badge itself the control (swipe or tap); without them the badge is inert. */
  gestures?: HTMLAttributes<HTMLDivElement>;
  /** The landing corrections of the badge photo. */
  isLanding?: boolean;
  className?: string;
}

/**
 * The badge hangs from its strap: it drops the first time it is seen, swings in on every move and then sways.
 * The swinging block is remounted on every move (`key`) so its animation starts again.
 */
export function GuestBadgeStage({ ref, guest, swing, gestures, isLanding, className }: Readonly<GuestBadgeStageProps>) {
  const parity = swing.index % 2 === 0 ? "even" : "odd";
  const hasMoved = swing.moveCount > 0;

  return (
    <div ref={ref} {...gestures} className={cn(getStageClasses(parity, swing.direction, Boolean(gestures)), className)}>
      <div
        aria-hidden="true"
        className={cn(
          "col-start-1 row-start-1 mt-14 bg-surface-tertiary transition-transform duration-300 motion-reduce:transition-none min-[820px]:mt-27.5",
          BADGE_WIDTH,
          DECK_CLASSES[parity],
        )}
      />
      <div
        className={cn(
          "col-start-1 row-start-1 origin-top",
          BADGE_WIDTH,
          getSwayAnimation(swing.hasBeenSeen || hasMoved),
        )}
      >
        <div
          key={swing.moveCount}
          className={cn("flex pendulum flex-col items-center perspective-[1400px]", getSwingAnimation(swing))}
        >
          <span aria-hidden="true" className="h-14 w-8 bg-accent min-[820px]:h-27.5 min-[820px]:w-10" />
          <GuestBadge
            guest={guest}
            isLanding={isLanding}
            className={hasMoved ? "animate-pendulum-twist motion-reduce:animate-none" : ""}
          />
        </div>
      </div>
    </div>
  );
}

function getStageClasses(parity: "even" | "odd", direction: SwingDirection, isInteractive: boolean) {
  return cn(
    "grid justify-items-center px-3",
    isInteractive && "cursor-grab touch-pan-y select-none active:cursor-grabbing",
    TILT_CLASSES[parity],
    DIRECTION_CLASSES[direction],
  );
}

function getSwayAnimation(isSwaying: boolean) {
  return isSwaying ? "animate-pendulum-sway motion-reduce:animate-none" : "";
}

function getSwingAnimation({ moveCount, hasBeenSeen }: BadgeSwing) {
  if (moveCount > 0) return "animate-pendulum-swing motion-reduce:animate-none";

  return hasBeenSeen ? "animate-pendulum-drop motion-reduce:animate-none" : "";
}
