import { siteConfig } from "@shared/lib/site-config";

export function SiteFooter() {
  return (
    <footer>
      <div className="page-wrap type-tiny flex flex-wrap justify-between gap-4 py-8">
        <span className="text-accent">{siteConfig.title}</span>
        <span className="text-muted">{siteConfig.organization}</span>
      </div>
    </footer>
  );
}
