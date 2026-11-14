import { Suspense } from "react";
import { SiteNavbar } from "@features/site/components/site-navbar";

/**
 * The navbar of the root layout. With Cache Components, usePathname suspends on a dynamic param that was not
 * prerendered (/activate/[token]), so the navbar waits behind its own Suspense and the rest of the layout still
 * prerenders. It reads no cookies, headers or clock, so the public pages stay cacheable for offline use (RNF-14).
 */
export function SiteHeader({ isLandingOnly }: Readonly<{ isLandingOnly: boolean }>) {
  return (
    <Suspense fallback={null}>
      <SiteNavbar isLandingOnly={isLandingOnly} />
    </Suspense>
  );
}
