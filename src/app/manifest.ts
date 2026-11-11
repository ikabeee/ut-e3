import type { MetadataRoute } from "next";
import { buildManifest } from "@features/pwa/lib/pwa-manifest";

export default function manifest(): MetadataRoute.Manifest {
  return buildManifest();
}
