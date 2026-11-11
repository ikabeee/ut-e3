/**
 * What a Server Action receives as its form. A Server Action is a public endpoint and Next decodes its arguments from
 * whatever body arrives: a JSON body ("[1,2,3]") gives a number, an array or an object instead of FormData.
 */
type DecodedValue =
  string | number | boolean | null | readonly DecodedValue[] | { readonly [key: string]: DecodedValue };

export type ServerActionForm = FormData | DecodedValue | undefined;

// FormData can carry files; a text field that arrives as a file, or not at all, reads as empty. A body that is not
// FormData reads as empty too, so the action answers its validation error instead of a 500 with a TypeError in the log.
export function readFormText(form: ServerActionForm, name: string): string {
  if (!(form instanceof FormData)) return "";

  const value = form.get(name);

  return value instanceof File ? "" : (value ?? "");
}
