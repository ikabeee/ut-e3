import { Button, type ButtonProps } from "@heroui/react";
import { ArrowGlyph } from "@shared/components/arrow-glyph";

type ArrowButtonProps = Omit<ButtonProps, "children" | "isIconOnly" | "aria-label"> & {
  direction: "previous" | "next";
  /** Texto para lectores de pantalla, por ejemplo "Juego anterior". */
  label: string;
};

/** Flecha anterior/siguiente de los carruseles (`.arrow` del diseño). */
export function ArrowButton({
  direction,
  label,
  variant = "ghost",
  ...buttonProps
}: Readonly<ArrowButtonProps>) {
  return (
    <Button isIconOnly variant={variant} aria-label={label} {...buttonProps}>
      <ArrowGlyph direction={direction === "previous" ? "w" : "e"} />
    </Button>
  );
}
