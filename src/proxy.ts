export { proxy } from "@features/auth/lib/server/proxy";

export const config = {
  matcher: ["/admin", "/admin/:path*", "/team", "/team/:path*", "/login", "/register"],
};
