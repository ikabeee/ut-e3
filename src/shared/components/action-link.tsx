import Link from "next/link";
import { buttonVariants } from "@heroui/react";
import { ArrowGlyph, type ArrowDirection } from "@shared/components/arrow-glyph";
import { ScrambleText } from "@shared/components/scramble-text";

interface ActionLinkProps {
  href: string;
  children: string;
  variant?: "primary" | "outline" | "tertiary";
  size?: "md" | "lg";
  arrow?: ArrowDirection;
  isExternal?: boolean;
  fullWidth?: boolean;
  className?: string;
}

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
