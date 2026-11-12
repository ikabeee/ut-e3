"use client";

import { usePathname } from "next/navigation";
import { SiteNav } from "@features/site/components/site-nav";

/** Reads the current path so the shared navbar marks its page and stays off the staff screens. */
export function SiteNavbar({ isLandingOnly }: Readonly<{ isLandingOnly: boolean }>) {
  return <SiteNav pathname={usePathname()} isLandingOnly={isLandingOnly} />;
}
