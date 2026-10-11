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
 * `touch-target` amplía el área táctil a 44x44 px sin cambiar el tamaño de la flecha.
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
      className={cn("touch-target font-[family-name:Arial,Helvetica,sans-serif] font-normal", className)}
      {...buttonProps}
    >
      <ArrowGlyph direction={direction === "previous" ? "w" : "e"} />
    </Button>
  );
}
