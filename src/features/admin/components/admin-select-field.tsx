"use client";

import { FieldError, Label, ListBox, Select } from "@heroui/react";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import type { AdminOption } from "@features/admin/lib/types";

interface AdminSelectFieldProps {
  name: string;
  label: string;
  options: readonly AdminOption[];
  defaultValue?: string | null;
  isRequired?: boolean;
}

/**
 * Lista desplegable del panel (Select de HeroUI); envía el `value` elegido con el formulario.
 *
 * Es un componente cliente aunque no tenga estado: React Aria arma la lista en el servidor dentro
 * de un `<template>`, y si los `ListBox.Item` llegaran desde un Server Component, Next.js los
 * transmitiría en segmentos que el navegador no encuentra ahí (error de hidratación). Recibe las
 * opciones como datos y crea los elementos aquí.
 */
export function AdminSelectField({
  name,
  label,
  options,
  defaultValue,
  isRequired = false,
}: Readonly<AdminSelectFieldProps>) {
  return (
    <Select
      name={name}
      isRequired={isRequired}
      defaultValue={defaultValue ?? null}
      placeholder={ADMIN_COPY.common.noneSelected}
      className="flex flex-col gap-1"
    >
      <Label>{label}</Label>
      <Select.Trigger className="min-h-11">
        <Select.Value className="text-base" />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map((option) => (
            <ListBox.Item key={option.value} id={option.value} textValue={option.label}>
              {option.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
      <FieldError />
    </Select>
  );
}
