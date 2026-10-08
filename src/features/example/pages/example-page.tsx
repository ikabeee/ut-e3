import type { Metadata } from "next";
import { ExampleCard } from "@features/example/components/example-card";
import { getExampleMessage } from "@features/example/lib/example-data";

export const examplePageMetadata: Metadata = {
  title: "Example",
};

export async function ExamplePage() {
  const message = await getExampleMessage();

  return (
    <main className="p-8">
      <ExampleCard message={message} />
    </main>
  );
}
