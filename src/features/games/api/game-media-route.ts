import "server-only";
import { readGameImage } from "@features/games/lib/server/game-image-storage";

// The name of a stored image carries a hash of its content, so a changed image is a new URL and this one never changes.
const IMMUTABLE = "public, max-age=31536000, immutable";

// Serves the images that stand administrators upload (they live in the volume, not in public/). The name is checked
// against the pattern the app writes, so a path with `..` or another extension never reaches the file system.
export async function GET(_request: Request, context: RouteContext<"/api/media/games/[file]">): Promise<Response> {
  const { file } = await context.params;
  const bytes = await readGameImage(file);

  if (!bytes) return new Response("No encontrada.", { status: 404 });

  return new Response(new Uint8Array(bytes), {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": IMMUTABLE, "X-Content-Type-Options": "nosniff" },
  });
}
