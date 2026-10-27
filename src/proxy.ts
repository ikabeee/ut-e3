export { redirectWithoutSession as proxy } from "@features/accounts/lib/accounts-proxy";

// Next reads the matcher statically, so it stays a literal in this file.
export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
