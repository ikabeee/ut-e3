"use client";

import { Description, FieldError, Form, Input, Label, TextField } from "@heroui/react";
import { claimRaffleTicketAction } from "@features/visitors/lib/visitors-actions";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import { ActionButton } from "@shared/components/action-button";
import { useServerActionForm } from "@shared/hooks/use-server-action-form";

/** Teléfono para el boleto; al guardarlo, la página se actualiza con el número del boleto. */
export function RaffleTicketForm() {
  const form = useServerActionForm(claimRaffleTicketAction);
  const copy = VISITORS_COPY.raffle;

  return (
    <Form onSubmit={form.submit} validationErrors={form.fieldErrors} className="flex flex-col gap-4">
      <TextField name="phone" type="tel" isRequired autoComplete="tel" className="flex flex-col gap-1">
        <Label>{copy.phoneLabel}</Label>
        {/* 16 px: con menos, iOS hace zoom al escribir. */}
        <Input placeholder={copy.phonePlaceholder} inputMode="tel" className="text-base" />
        <Description>{copy.phoneHint}</Description>
        <FieldError />
      </TextField>
      {form.error && Object.keys(form.fieldErrors).length === 0 ? (
        <p role="alert" className="m-0 text-sm text-danger">
          {form.error}
        </p>
      ) : null}
      <ActionButton type="submit" variant="primary" isPending={form.isPending} arrow="ne">
        {copy.submit}
      </ActionButton>
    </Form>
  );
}
