import type { Metadata, Viewport } from "next";
import { QueryProvider } from "@shared/components/query-provider";
import { SiteFooter } from "@shared/components/site-footer";
import { SiteHeader } from "@shared/components/site-header";
import { fontVariables } from "@shared/lib/fonts";
import { siteConfig } from "@shared/lib/site-config";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    siteName: siteConfig.title,
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // El diseño tiene un solo tema oscuro: se fija el tema "dark" de HeroUI.
    <html lang="es" className={`dark ${fontVariables}`} data-theme="dark">
      <body className="bg-background text-foreground">
        <QueryProvider>
          <SiteHeader />
          {children}
          <SiteFooter />
        </QueryProvider>
      </body>
    </html>
  );
}
