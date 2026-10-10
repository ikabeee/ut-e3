import type { ExampleMessage } from "@features/example/lib/types";

// Replace this with real data access (for example `lib/example-queries.ts` using Prisma)
// when the feature needs it.
export async function getExampleMessage(): Promise<ExampleMessage> {
  return {
    title: "Feature de ejemplo",
    description: "Edita src/features/example o usa esta estructura para crear tu propia feature.",
  };
}
