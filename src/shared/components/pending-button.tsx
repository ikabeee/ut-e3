"use client";

import { Button, Spinner, type ButtonProps } from "@heroui/react";
import type { ReactNode } from "react";

interface PendingButtonProps extends Omit<ButtonProps, "children"> {
  children: ReactNode;
}

/** A HeroUI button that shows a spinner next to its label while `isPending` (S6); pressing it does nothing meanwhile. */
export function PendingButton({ children, ...props }: Readonly<PendingButtonProps>) {
  return (
    <Button {...props}>
      {({ isPending }) => (
        <>
          {isPending ? <Spinner size="sm" color="current" aria-hidden="true" /> : null}
          {children}
        </>
      )}
    </Button>
  );
}
