import { Input, Label, TextField } from "@heroui/react";
import { ADMIN_COPY } from "@features/admin/lib/admin-copy";
import type { LogsDateRange } from "@features/admin/lib/logs-filters";

const COPY = ADMIN_COPY.logs;

const CONTROL_CLASS = "min-h-11 w-full border border-border bg-surface px-3 text-base";

interface TextFilterProps {
  name: string;
  label: string;
  value: string;
}

export function TextFilter({ name, label, value }: Readonly<TextFilterProps>) {
  return (
    <TextField name={name} defaultValue={value}>
      <Label>{label}</Label>
      <Input className="min-h-11 text-base" autoComplete="off" />
    </TextField>
  );
}

interface ChoiceFilterProps {
  name: string;
  label: string;
  value: string | null;
  options: readonly { value: string; label: string }[];
}

/** A native select: it is part of the GET form without any script, and phones show their own picker. */
export function ChoiceFilter({ name, label, value, options }: Readonly<ChoiceFilterProps>) {
  return (
    <label className="grid gap-1 text-sm">
      {label}
      <select name={name} defaultValue={value ?? ""} className={CONTROL_CLASS}>
        <option value="">{COPY.all}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function DateFilters({ fromDate, toDate }: Readonly<Pick<LogsDateRange, "fromDate" | "toDate">>) {
  return (
    <>
      <label className="grid gap-1 text-sm">
        {COPY.from}
        <input type="date" name="from" defaultValue={fromDate} className={CONTROL_CLASS} />
      </label>
      <label className="grid gap-1 text-sm">
        {COPY.to}
        <input type="date" name="to" defaultValue={toDate} className={CONTROL_CLASS} />
      </label>
    </>
  );
}
