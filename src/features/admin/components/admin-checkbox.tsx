import { Checkbox, Label } from "@heroui/react";

interface AdminCheckboxProps {
  name: string;
  label: string;
  defaultSelected?: boolean;
}

/** Casilla de sí o no (Checkbox de HeroUI); marcada envía `name=true`. */
export function AdminCheckbox({ name, label, defaultSelected = false }: Readonly<AdminCheckboxProps>) {
  return (
    <Checkbox name={name} value="true" defaultSelected={defaultSelected} className="min-h-11">
      <Checkbox.Content>
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Label>{label}</Label>
      </Checkbox.Content>
    </Checkbox>
  );
}
