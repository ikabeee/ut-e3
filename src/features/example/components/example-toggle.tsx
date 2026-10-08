"use client";

import { Button } from "@heroui/react";
import { useToggle } from "@features/example/hooks/use-toggle";

export function ExampleToggle() {
  const { isOn, toggle } = useToggle();

  return (
    <Button variant={isOn ? "primary" : "secondary"} aria-pressed={isOn} onPress={toggle}>
      {isOn ? "Encendido" : "Apagado"}
    </Button>
  );
}
