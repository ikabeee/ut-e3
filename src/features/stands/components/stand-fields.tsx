"use client";

import { FieldError, Input, Label, TextField } from "@heroui/react";
import { OptionSelect } from "@features/accounts/components/invite-account-form";
import type { StandFields as StandData } from "@features/stands/lib/stand-input";
import { STAND_ZONES } from "@features/stands/lib/stand-zones";
import { STANDS_COPY } from "@features/stands/lib/stands-copy";

const COPY = STANDS_COPY.admin;

const ZONE_OPTIONS = STAND_ZONES.map((zone) => ({ value: zone, label: COPY.zoneOption(zone) }));

/** Zone, number, studio and group of a stand; with `stand` they start with its values. The code is never typed. */
export function StandFields({ stand }: Readonly<{ stand?: StandData }>) {
  return (
    <>
      <OptionSelect name="zone" label={COPY.fields.zone} options={ZONE_OPTIONS} defaultValue={stand?.zone} />
      <NumberField name="number" label={COPY.fields.number} value={stand?.number} />
      <NumberField name="studio" label={COPY.fields.studio} value={stand?.studio} />
      <TextField name="groupCode" defaultValue={stand?.groupCode} maxLength={6} autoComplete="off" isRequired>
        <Label>{COPY.fields.group}</Label>
        <Input className="min-h-11 text-base" />
        <FieldError />
      </TextField>
    </>
  );
}

function NumberField({ name, label, value }: Readonly<{ name: string; label: string; value?: number }>) {
  return (
    <TextField name={name} defaultValue={value?.toString()} inputMode="numeric" autoComplete="off" isRequired>
      <Label>{label}</Label>
      <Input className="min-h-11 text-base" />
      <FieldError />
    </TextField>
  );
}

/** The name and the email of the person who administers the stand. */
export function AdminFields() {
  return (
    <>
      <TextField name="adminName" maxLength={80} autoComplete="off" isRequired>
        <Label>{COPY.fields.adminName}</Label>
        <Input className="min-h-11 text-base" />
        <FieldError />
      </TextField>
      <TextField name="adminEmail" type="email" autoComplete="off" isRequired>
        <Label>{COPY.fields.adminEmail}</Label>
        <Input className="min-h-11 text-base" />
        <FieldError />
      </TextField>
    </>
  );
}
