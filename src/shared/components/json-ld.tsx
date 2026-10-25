type JsonLdPrimitive = string | number | boolean | null;

export type JsonLdValue = JsonLdPrimitive | readonly JsonLdValue[] | { readonly [key: string]: JsonLdValue };

export type JsonLdRecord = {
  readonly [key: string]: JsonLdValue;
};

interface JsonLdProps {
  data: JsonLdRecord;
}

export function JsonLd({ data }: Readonly<JsonLdProps>) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replaceAll("<", String.raw`\u003c`) }}
    />
  );
}
