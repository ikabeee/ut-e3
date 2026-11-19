import type { ReactNode } from "react";
import type { AdminNavIconName } from "@features/admin/lib/admin-nav-items";

// Line icons on a 24 px grid, all drawn with the same 1.75 stroke and the color of the text around them.
const ICON_DRAWINGS: Record<AdminNavIconName | "menu", ReactNode> = {
  home: <path d="M4 10.5 12 4l8 6.5V20H4zM9.5 20v-6h5v6" />,
  settings: <path d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6" />,
  moderation: <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6zM9 12l2 2 4-4" />,
  visitors: (
    <path d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14.3c1.8.8 3 2.6 3 4.7" />
  ),
  catalog: <path d="M4 5h16M4 12h16M4 19h16M7 5h.01M7 12h.01M7 19h.01" />,
  server: <path d="M4 5h16v6H4zM4 13h16v6H4zM8 8h.01M8 16h.01" />,
  accounts: (
    <path d="M3 6h18v12H3zM8 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM5 16c.5-1.7 1.6-2.5 3-2.5s2.5.8 3 2.5M14 9h4M14 13h4" />
  ),
  emails: <path d="M3 6h18v12H3zM3 7l9 6.5L21 7" />,
  sql: (
    <path d="M12 8c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3zM4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
  ),
  logs: <path d="M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6" />,
  recovery: <path d="M20 12a8 8 0 1 1-2.5-5.8M20 4v5h-5" />,
  kof: <path d="M8 4h8v6a4 4 0 0 1-8 0zM8 6H4v1.5C4 9.4 5.6 11 8 11M16 6h4v1.5c0 1.9-1.6 3.5-4 3.5M12 14v4M8 20h8" />,
  raffle: <path d="M3 8a2 2 0 0 0 0 4v0a2 2 0 0 1 0 4v2h18v-2a2 2 0 0 1 0-4v0a2 2 0 0 0 0-4V6H3zM14 6v12" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
};

/** The icon of a section of the panel: decorative, because the text next to it already names the section. */
export function AdminNavIcon({ name }: Readonly<{ name: AdminNavIconName | "menu" }>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5 flex-none"
    >
      {ICON_DRAWINGS[name]}
    </svg>
  );
}
