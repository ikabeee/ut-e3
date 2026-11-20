import "server-only";
import { LOGO_CONTENT_TYPES, isSponsorLogoFileName, readLogoExtension } from "@features/sponsors/lib/sponsor-logo";
import { readSponsorLogo } from "@features/sponsors/lib/server/sponsor-logo-storage";

// The name of a stored logo carries a hash of its content, so a changed logo is a new URL and this one never changes.
const IMMUTABLE = "public, max-age=31536000, immutable";

// Serves the logos that the sysadmin uploads (they live in the volume, not in public/). The name is checked against the
// pattern the app writes, so a path with `..` or another extension never reaches the file system, and the type comes
// from that validated extension (never SVG), with `nosniff` so the browser does not guess another one.
export async function GET(_request: Request, context: RouteContext<"/api/media/sponsors/[file]">): Promise<Response> {
  const { file } = await context.params;
  const bytes = isSponsorLogoFileName(file) ? await readSponsorLogo(file) : null;

  if (!bytes) return new Response("No encontrada.", { status: 404 });

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": LOGO_CONTENT_TYPES[readLogoExtension(file)],
      "Cache-Control": IMMUTABLE,
      "X-Content-Type-Options": "nosniff",
      // An uploaded file is only ever an image: even a polyglot opened directly can run nothing.
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
