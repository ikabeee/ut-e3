import { Button, cn, type ButtonProps } from "@heroui/react";
import { ArrowGlyph } from "@shared/components/arrow-glyph";

type ArrowButtonProps = Omit<ButtonProps, "children" | "isIconOnly" | "aria-label"> & {
  direction: "previous" | "next";
  /** Texto para lectores de pantalla, por ejemplo "Juego anterior". */
  label: string;
};

/**
 * Flecha anterior/siguiente de los carruseles (`.arrow` del diseño).
 * Las flechas usan Arial: es la fuente por defecto de los botones en el diseño.
 */
export function ArrowButton({
  direction,
  label,
  variant = "ghost",
  className,
  ...buttonProps
}: Readonly<ArrowButtonProps>) {
  return (
    <Button
      isIconOnly
      variant={variant}
      aria-label={label}
      className={cn("font-[family-name:Arial,Helvetica,sans-serif] font-normal", className)}
      {...buttonProps}
    >
      <ArrowGlyph direction={direction === "previous" ? "w" : "e"} />
    </Button>
  );
}
