interface JsonLdProps {
  /** Objeto de schema.org (por ejemplo `{ "@context": "https://schema.org", "@type": "Event" }`). */
  data: Record<string, unknown>;
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
