"use client";

import { useId } from "react";
import { Button } from "@heroui/react";
import { useToggle } from "@features/example/hooks/use-toggle";

export function ExampleToggle() {
  const { isOn, toggle } = useToggle();
  const detailsId = useId();

  return (
    <div className="flex flex-col items-start gap-4">
      <Button variant="primary" className="min-h-11" aria-expanded={isOn} aria-controls={detailsId} onPress={toggle}>
        {isOn ? "Ocultar detalles" : "Mostrar detalles"}
      </Button>
      <p id={detailsId} hidden={!isOn} className="text-muted">
        El estado vive en el hook useToggle; el componente sólo lo pinta.
      </p>
    </div>
  );
}
