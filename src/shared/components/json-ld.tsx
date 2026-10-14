type JsonLdPrimitive = string | number | boolean | null;

export type JsonLdValue = JsonLdPrimitive | readonly JsonLdValue[] | { readonly [key: string]: JsonLdValue };

export type JsonLdRecord = {
  readonly [key: string]: JsonLdValue;
};

interface JsonLdProps {
  /** Objeto de schema.org (por ejemplo `{ "@context": "https://schema.org", "@type": "Event" }`). */
  data: JsonLdRecord;
}

/**
 * Datos estructurados para buscadores. Se escapa `<` para que el contenido no pueda cerrar
 * la etiqueta `<script>` (recomendación de la guía de JSON-LD de Next.js).
 */
export function JsonLd({ data }: Readonly<JsonLdProps>) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replaceAll("<", String.raw`\u003c`) }}
    />
  );
}
