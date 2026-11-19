"use client";

import { useState } from "react";
import { FieldError, Form, Input, Label, ListBox, Select, TextField } from "@heroui/react";
import { ACCOUNTS_COPY } from "@features/accounts/lib/accounts-copy";
import type { ManagementActionState } from "@features/accounts/lib/management-actions";
import { KOF_DESKS } from "@features/accounts/lib/types";
import { FormFeedback } from "@shared/components/form-feedback";
import { useActionForm } from "@shared/hooks/use-action-form";
import { PendingButton } from "@shared/components/pending-button";

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
  /** The KOF staff belongs to a desk: the field appears while that role is the chosen one. */
  showDesk: boolean;
  /** The stands that a stand account can belong to; only the sysadmin chooses one. Without them there is no field. */
  stands?: readonly RoleOption[];
  /** The role chosen at first; the first one of the list when it is left out. */
  defaultRole?: string;
  action: ManagementAction;
}

const COPY = ACCOUNTS_COPY.management.panel;

export function InviteAccountForm({
  roles,
  showDesk,
  stands = [],
  defaultRole = roles[0].value,
  action,
}: Readonly<InviteAccountFormProps>) {
  const { state, formAction, isPending, formRef, handleSubmit } = useActionForm(action);
  const [role, setRole] = useState(defaultRole);

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
      <RoleField roles={roles} defaultRole={defaultRole} onChange={setRole} />
      {showDesk && role === "kof_staff" && <DeskField />}
      {stands.length > 0 && isStandRole(role) && (
        <OptionSelect name="standId" label={COPY.standLabel} options={stands} />
      )}
      <FormFeedback state={state} />
      <PendingButton type="submit" variant="primary" className="min-h-11 justify-self-start" isPending={isPending}>
        {isPending ? COPY.sending : COPY.submit}
      </PendingButton>
    </Form>
  );
}

function RoleField({
  roles,
  defaultRole,
  onChange,
}: Readonly<{ roles: readonly RoleOption[]; defaultRole: string; onChange: (role: string) => void }>) {
  if (roles.length === 1) return <input type="hidden" name="role" value={roles[0].value} />;

  return (
    <OptionSelect
      name="role"
      label={COPY.roleLabel}
      options={roles.map((role) => ({ value: role.value, label: role.label }))}
      defaultValue={defaultRole}
      onChange={onChange}
    />
  );
}

function isStandRole(role: string): boolean {
  return role === "stand_admin" || role === "stand_staff";
}

function DeskField() {
  return (
    <OptionSelect
      name="desk"
      label={COPY.deskLabel}
      options={KOF_DESKS.map((desk) => ({ value: String(desk), label: COPY.deskOption(desk) }))}
    />
  );
}

interface OptionSelectProps {
  name: string;
  label: string;
  options: readonly RoleOption[];
  /** The option selected at first; the first one when it is left out. */
  defaultValue?: string;
  /** Tells the form which option was chosen, for the fields that depend on it. */
  onChange?: (value: string) => void;
}

export function OptionSelect({ name, label, options, defaultValue, onChange }: Readonly<OptionSelectProps>) {
  return (
    <Select
      name={name}
      defaultValue={defaultValue ?? options[0].value}
      onChange={(key) => onChange?.(String(key))}
      className="max-w-sm"
    >
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
