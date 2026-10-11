import type { Metadata } from "next";
import { ExampleCard } from "@features/example/components/example-card";
import { ExampleToggle } from "@features/example/components/example-toggle";
import { getExampleMessage } from "@features/example/lib/example-queries";

// Al copiar la feature, agrega `alternates: { canonical: "/<ruta>" }` y la ruta a `src/app/sitemap.ts`.
export const examplePageMetadata: Metadata = {
  title: "Ejemplo",
  description: "Feature de ejemplo para crear nuevas secciones del showcase.",
};

export async function ExamplePage() {
  const message = await getExampleMessage(); // lib/

  return (
    <main className="page-wrap flex flex-col gap-6 py-8">
      <ExampleCard message={message} />
      <ExampleToggle />
    </main>
  );
}
