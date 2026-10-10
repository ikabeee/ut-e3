import { Button, type ButtonProps } from "@heroui/react";
import { ArrowGlyph, type ArrowDirection } from "@shared/components/arrow-glyph";
import { ScrambleText } from "@shared/components/scramble-text";

type ActionButtonProps = Omit<ButtonProps, "children"> & {
  /** Texto del botón (se decodifica al pasar el mouse). */
  children: string;
  arrow?: ArrowDirection;
};

/** Button de HeroUI con la etiqueta animada del diseño. */
export function ActionButton({ children, arrow, ...buttonProps }: Readonly<ActionButtonProps>) {
  return (
    <Button {...buttonProps}>
      <ScrambleText text={children} />
      {arrow ? <ArrowGlyph direction={arrow} /> : null}
    </Button>
  );
}
