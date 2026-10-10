import Link from "next/link";
import { buttonVariants } from "@heroui/react";
import { ArrowGlyph, type ArrowDirection } from "@shared/components/arrow-glyph";
import { ScrambleText } from "@shared/components/scramble-text";

interface ActionLinkProps {
  href: string;
  /** Texto del enlace (se decodifica al pasar el mouse). */
  children: string;
  /** Mismas variantes que el Button de HeroUI (ver src/shared/styles/components.css). */
  variant?: "primary" | "outline" | "tertiary";
  /** `lg` es la "pestaña" del diseño: sin borde y con más relleno. */
  size?: "md" | "lg";
  arrow?: ArrowDirection;
  /** Abre en otra pestaña (Google Calendar, Google Maps...). */
  isExternal?: boolean;
  fullWidth?: boolean;
  className?: string;
}

/** Enlace con la apariencia de un Button de HeroUI. */
export function ActionLink({
  href,
  children,
  variant = "outline",
  size = "md",
  arrow,
  isExternal = false,
  fullWidth = false,
  className,
}: Readonly<ActionLinkProps>) {
  const classes = buttonVariants({ variant, size, fullWidth, className });
  const content = (
    <>
      <ScrambleText text={children} />
      {arrow ? <ArrowGlyph direction={arrow} /> : null}
    </>
  );

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {content}
    </Link>
  );
}
