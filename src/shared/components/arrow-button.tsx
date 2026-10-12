import { Button, cn, type ButtonProps } from "@heroui/react";
import { ArrowGlyph } from "@shared/components/arrow-glyph";

/** Variantes de `components.css`: `plate` (exhibidor 3D) y `overlay` (sobre una imagen). */
const TONE_CLASSES = { default: "", plate: "button--plate", overlay: "button--overlay" } as const;

type ArrowButtonProps = Omit<ButtonProps, "children" | "isIconOnly" | "aria-label"> & {
  direction: "previous" | "next";
  /** Texto para lectores de pantalla, por ejemplo "Juego anterior". */
  label: string;
  /** Apariencia de la flecha según dónde va; `default` es la flecha con borde gris. */
  tone?: keyof typeof TONE_CLASSES;
};

/**
 * Flecha anterior/siguiente de los carruseles (`.arrow` del diseño).
 * Las flechas usan Arial: es la fuente por defecto de los botones en el diseño.
 * `touch-target` amplía el área táctil a 44x44 px sin cambiar el tamaño de la flecha.
 */
export function ArrowButton({
  direction,
  label,
  tone = "default",
  variant = "ghost",
  className,
  ...buttonProps
}: Readonly<ArrowButtonProps>) {
  return (
    <Button
      isIconOnly
      variant={variant}
      aria-label={label}
      className={cn(
        "touch-target font-[family-name:Arial,Helvetica,sans-serif] font-normal",
        TONE_CLASSES[tone],
        className,
      )}
      {...buttonProps}
    >
      <ArrowGlyph direction={direction === "previous" ? "w" : "e"} />
    </Button>
  );
}
