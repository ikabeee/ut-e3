import { siteConfig } from "@shared/lib/site-config";

export function SiteFooter() {
  return (
    <footer>
      <div className="page-wrap type-tiny flex flex-wrap justify-between gap-4 pt-8 pb-[calc(2rem+env(safe-area-inset-bottom,0px))]">
        <span className="text-accent">{siteConfig.title}</span>
        <span className="text-muted">{siteConfig.organizationLabel}</span>
      </div>
    </footer>
  );
}
