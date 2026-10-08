import Link from "next/link";
import { Container } from "./container";

const links = [
  { href: "/games", label: "Videojuegos" },
  { href: "/teams", label: "Equipos" },
] as const;

export function SiteHeader() {
  return (
    <header className="border-b border-black/10 dark:border-white/10">
      <Container>
        <nav className="flex h-16 items-center justify-between">
          <Link href="/" className="font-semibold tracking-tight">
            UT Game Showcase
          </Link>
          <ul className="flex gap-6 text-sm">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </header>
  );
}
