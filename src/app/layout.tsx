import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@features/site/components/site-footer";
import { SiteHeader } from "@features/site/components/site-header";
import { QueryProvider } from "@shared/components/query-provider";
import { fontVariables } from "@shared/lib/fonts";
import { buildOpenGraph } from "@shared/lib/metadata";
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
  openGraph: buildOpenGraph(),
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
  // iOS no lee el manifest: toma de aquí el ícono y el modo app al agregarlo a la pantalla de inicio.
  // Al definir `icons`, Next deja de agregar `icon.svg` por convención, así que se declara aquí.
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
