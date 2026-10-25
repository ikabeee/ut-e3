import { Button, cn, type ButtonProps } from "@heroui/react";
import { ArrowGlyph } from "@shared/components/arrow-glyph";

const TONE_CLASSES = { default: "", plate: "button--plate", overlay: "button--overlay" } as const;

type ArrowButtonProps = Omit<ButtonProps, "children" | "isIconOnly" | "aria-label"> & {
  direction: "previous" | "next";
  label: string;
  tone?: keyof typeof TONE_CLASSES;
};

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
      className={cn("touch-target font-[Arial,Helvetica,sans-serif] font-normal", TONE_CLASSES[tone], className)}
      {...buttonProps}
    >
      <ArrowGlyph direction={direction === "previous" ? "w" : "e"} />
    </Button>
  );
}
