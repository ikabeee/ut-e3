"use client";

import { useToggle } from "../hooks/use-toggle";

export function ExampleToggle() {
  const { isOn, toggle } = useToggle();

  return (
    <button type="button" aria-pressed={isOn} onClick={toggle} className="self-start underline">
      {isOn ? "Encendido" : "Apagado"}
    </button>
  );
}
