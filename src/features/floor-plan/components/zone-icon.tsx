import type { ReactElement } from "react";
import type { ZoneId } from "@features/floor-plan/lib/types";

interface ZoneIconProps {
  id: ZoneId;
  size: number;
}

/** The inline stroke icon of a zone marker: restrooms, flag, info, gamepad, microphone or bag. */
export function ZoneIcon({ id, size }: Readonly<ZoneIconProps>): ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      {iconContent(id)}
    </svg>
  );
}

function iconContent(id: ZoneId): ReactElement {
  if (id === "restrooms") {
    return (
      <>
        <circle cx="12" cy="5" r="2.5" />
        <path d="M12 8v6m0 0-3 6m3-6 3 6M7 10.5 12 8.5l5 2" />
      </>
    );
  }

  if (id === "mario-kart") {
    return <path d="M6 21V4m0 1h11l-2.5 3.5L17 12H6" />;
  }

  if (id === "kof") {
    return (
      <>
        <rect x="2" y="7" width="20" height="11" rx="5.5" />
        <path d="M7 11v3M5.5 12.5h3M15.5 11.5h.5M17.5 14h.5" />
      </>
    );
  }

  if (id === "stage") {
    return (
      <>
        <rect x="9" y="3" width="6" height="11" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
      </>
    );
  }

  if (id === "marketplace") {
    return <path d="M5 8h14l-1 12H6L5 8Zm4 0a4 4 0 0 1 8 0" />;
  }

  return (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5m0-8v.5" />
    </>
  );
}
