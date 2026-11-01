"use client";

import { Button, FieldError, Form, Input, Label, ListBox, Select, TextField } from "@heroui/react";
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import type { ManagementActionState } from "@features/accounts/lib/management-actions";
import { FormFeedback } from "@shared/components/form-feedback";
import { useActionForm } from "@shared/hooks/use-action-form";

export type ManagementAction = (
  previous: ManagementActionState | null,
  form: FormData,
) => Promise<ManagementActionState>;

export interface RoleOption {
  value: string;
  label: string;
}

interface InviteAccountFormProps {
  /** The roles the person may invite; with one role the form does not ask for it. */
  roles: readonly RoleOption[];
  /** The KOF staff belongs to a desk. */
  showDesk: boolean;
  action: ManagementAction;
}

const COPY = ACCOUNTS_COPY.management.panel;

const DESKS = [1, 2];

export function InviteAccountForm({ roles, showDesk, action }: Readonly<InviteAccountFormProps>) {
  const { state, formAction, isPending, formRef, handleSubmit } = useActionForm(action);

  return (
    <Form ref={formRef} action={formAction} onSubmit={handleSubmit} className="grid gap-4">
      <TextField name="name" maxLength={80} autoComplete="off" isRequired>
        <Label>{COPY.nameLabel}</Label>
        <Input className="min-h-11 text-base" />
        <FieldError />
      </TextField>
      <TextField name="email" type="email" autoComplete="off" isRequired>
        <Label>{COPY.emailLabel}</Label>
        <Input className="min-h-11 text-base" />
        <FieldError />
      </TextField>
      <RoleField roles={roles} />
      {showDesk && <DeskField />}
      <FormFeedback state={state} />
      <Button type="submit" variant="primary" className="min-h-11 justify-self-start" isPending={isPending}>
        {isPending ? COPY.sending : COPY.submit}
      </Button>
    </Form>
  );
}

function RoleField({ roles }: Readonly<{ roles: readonly RoleOption[] }>) {
  if (roles.length === 1) return <input type="hidden" name="role" value={roles[0].value} />;

  return (
    <OptionSelect
      name="role"
      label={COPY.roleLabel}
      options={roles.map((role) => ({ value: role.value, label: role.label }))}
    />
  );
}

function DeskField() {
  return (
    <OptionSelect
      name="desk"
      label={COPY.deskLabel}
      options={DESKS.map((desk) => ({ value: String(desk), label: COPY.deskOption(desk) }))}
    />
  );
}

function OptionSelect({
  name,
  label,
  options,
}: Readonly<{ name: string; label: string; options: readonly RoleOption[] }>) {
  return (
    <Select name={name} defaultValue={options[0].value} className="max-w-sm">
      <Label>{label}</Label>
      <Select.Trigger className="min-h-11">
        <Select.Value />
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
    </Select>
  );
}
