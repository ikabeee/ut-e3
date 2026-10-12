import { Checkbox, CheckboxGroup, FieldError, Label } from "@heroui/react";
import type { AdminOption } from "@features/admin/lib/types";

interface AdminCheckboxGroupProps {
  name: string;
  label: string;
  options: readonly AdminOption[];
  defaultValue?: readonly string[];
}

/** Varias opciones a la vez (CheckboxGroup de HeroUI); envía cada valor marcado con el mismo `name`. */
export function AdminCheckboxGroup({ name, label, options, defaultValue = [] }: Readonly<AdminCheckboxGroupProps>) {
  return (
    <CheckboxGroup name={name} defaultValue={[...defaultValue]} className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-x-5 gap-y-1">
        {options.map((option) => (
          <Checkbox key={option.value} value={option.value} className="min-h-11">
            <Checkbox.Content>
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Label>{option.label}</Label>
            </Checkbox.Content>
          </Checkbox>
        ))}
      </div>
      <FieldError />
    </CheckboxGroup>
  );
}
