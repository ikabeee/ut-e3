"use client";

import { Alert, Description, FieldError, Form, Input, Label, TextField } from "@heroui/react";
import { registerVisitorAction } from "@features/visitors/lib/visitors-actions";
import { VISITORS_COPY } from "@features/visitors/lib/visitors-copy";
import { ActionButton } from "@shared/components/action-button";
import { PaperCard } from "@shared/components/paper-card";
import { useServerActionForm } from "@shared/hooks/use-server-action-form";

interface VisitorRegistrationFormProps {
  /** El visitante abrió un QR que ya no es válido (por ejemplo, uno reemplazado). */
  hasUnknownQr: boolean;
}

/**
 * Registro sin login: sólo el gamertag. La acción guarda el QR en una cookie y la página se vuelve
 * a renderizar con el pasaporte.
 */
export function VisitorRegistrationForm({ hasUnknownQr }: Readonly<VisitorRegistrationFormProps>) {
  const form = useServerActionForm(registerVisitorAction);
  const copy = VISITORS_COPY.registration;

  return (
    <PaperCard className="max-w-[560px] gap-5 p-[clamp(20px,3vw,32px)]">
      <div className="flex flex-col gap-2">
        <h2 className="font-wide text-2xl leading-[.95] font-bold tracking-[-.03em] uppercase">{copy.title}</h2>
        <p className="m-0 text-[15px] leading-[1.35]">{copy.intro}</p>
      </div>

      {hasUnknownQr ? (
        <Alert status="warning">
          <Alert.Content>
            <Alert.Title>{copy.unknownQrTitle}</Alert.Title>
            <Alert.Description>{copy.unknownQrDescription}</Alert.Description>
          </Alert.Content>
        </Alert>
      ) : null}

      <Form onSubmit={form.submit} validationErrors={form.fieldErrors} className="flex flex-col gap-4">
        <TextField name="fullName" isRequired autoComplete="name" className="flex flex-col gap-1">
          <Label className="text-paper-foreground">{copy.fullNameLabel}</Label>
          <Input
            placeholder={copy.fullNamePlaceholder}
            onInput={form.clearFieldError}
            autoCapitalize="words"
            className="text-base"
          />
          <FieldError />
        </TextField>

        <TextField name="email" isRequired autoComplete="email" className="flex flex-col gap-1">
          <Label className="text-paper-foreground">{copy.emailLabel}</Label>
          <Input
            type="email"
            placeholder={copy.emailPlaceholder}
            onInput={form.clearFieldError}
            autoCapitalize="none"
            spellCheck={false}
            className="text-base"
          />
          <Description className="text-paper-foreground/70">{copy.emailHint}</Description>
          <FieldError />
        </TextField>

        <TextField name="gamertag" autoComplete="nickname" className="flex flex-col gap-1">
          <Label className="text-paper-foreground">{copy.gamertagLabel}</Label>
          <Input
            placeholder={copy.gamertagPlaceholder}
            onInput={form.clearFieldError}
            autoCapitalize="none"
            spellCheck={false}
            className="text-base"
          />
          <Description className="text-paper-foreground/70">{copy.gamertagHint}</Description>
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
    </PaperCard>
  );
}
