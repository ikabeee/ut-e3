import type { ReactNode } from "react";
import { Button, type ButtonProps } from "@heroui/react";
import { ArrowGlyph, type ArrowDirection } from "@shared/components/arrow-glyph";
import { ScrambleText } from "@shared/components/scramble-text";

type ActionButtonProps = Omit<ButtonProps, "children"> & {
  /** Texto del botón (se decodifica al pasar el mouse). */
  children: string;
  arrow?: ArrowDirection;
  icon?: ReactNode;
};

/** Button de HeroUI con la etiqueta animada del diseño. */
export function ActionButton({ children, arrow, icon, ...buttonProps }: Readonly<ActionButtonProps>) {
  return (
    <Button {...buttonProps}>
      {icon ? (
        <span aria-hidden="true" className="inline-flex shrink-0 items-center">
          {icon}
        </span>
      ) : null}
      <ScrambleText text={children} />
      {arrow ? <ArrowGlyph direction={arrow} /> : null}
    </Button>
  );
}
