export { proxy } from "@features/site/lib/site-proxy";

// Next reads the matcher statically, so it stays a literal in this file. Everything but the build output passes through
// the proxy: the kill switch (SITE_MODE=landing) also has to stop the public files and the Route Handlers.
export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
