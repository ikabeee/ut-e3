// FormData can carry files; a text field that arrives as a file, or not at all, reads as empty.
export function readFormText(form: FormData, name: string): string {
  const value = form.get(name);

  return value instanceof File ? "" : (value ?? "");
}
