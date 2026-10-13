import type { Metadata } from "next";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import { ADMIN_SECTION_PATHS, type AdminSection } from "@features/admin/lib/admin-links";

/** Metadata de una sección del panel: privada, nunca se indexa. */
export function buildAdminMetadata(section: AdminSection): Metadata {
  const title = section === "home" ? ADMIN_COPY.title : `${ADMIN_COPY.nav.sections[section]} · ${ADMIN_COPY.title}`;

  return {
    title,
    description: ADMIN_COPY.description,
    alternates: { canonical: ADMIN_SECTION_PATHS[section] },
    robots: { index: false, follow: false },
  };
}
