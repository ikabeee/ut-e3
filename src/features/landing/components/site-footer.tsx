import { LANDING_COPY } from "@features/landing/lib/landing-copy";
import { siteConfig } from "@shared/lib/site-config";

export function SiteFooter() {
  const { footer } = LANDING_COPY;

  return (
    <footer>
      <div className="page-wrap flex flex-wrap justify-between gap-4 pt-8 pb-[calc(2rem+env(safe-area-inset-bottom,0px))] type-tiny">
        <span className="text-accent">{siteConfig.title}</span>
        <span className="text-muted">{siteConfig.organizationLabel}</span>
        <p className="m-0 basis-full text-muted">
          {footer.credit}{" "}
          <a
            href={footer.creditUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="touch-target relative text-muted underline underline-offset-2 hover:text-foreground"
          >
            {footer.creditName}
          </a>
        </p>
      </div>
    </footer>
  );
}
