import type { Metadata } from "next";
import { QueryProvider } from "@shared/components/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "UT Game Showcase",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
