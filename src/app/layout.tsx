import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegistration } from "@features/pwa/components/service-worker-registration";
import { SiteHeader } from "@features/site/components/site-header";
import { fontVariables } from "@shared/lib/fonts";
import { buildOpenGraph } from "@shared/lib/metadata";
import { siteConfig } from "@shared/lib/site-config";
import { siteMode } from "@shared/lib/site-mode";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  openGraph: buildOpenGraph(),
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
  icons: {
    icon: { url: "/icon.svg", type: "image/svg+xml" },
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: { capable: true, title: siteConfig.name, statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: siteConfig.themeColor,
  colorScheme: "dark",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`dark ${fontVariables}`} data-theme="dark" data-scroll-behavior="smooth">
      <body className="bg-background text-foreground">
        <SiteHeader isLandingOnly={siteMode === "landing"} />
        {children}
        {/* With only the landing published there is no offline app to install (SITE_MODE=landing). */}
        {siteMode === "full" && <ServiceWorkerRegistration />}
      </body>
    </html>
  );
}
