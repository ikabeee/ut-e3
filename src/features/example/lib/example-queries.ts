import "server-only";
import { cacheLife } from "next/cache";
import type { ExampleMessage } from "@features/example/lib/types";

// Con Prisma, aquí iría la consulta (`db.orm.public.<Model>`) y el mapeo de la fila al tipo de
// dominio. "use cache" + cacheLife permite prerenderizar la page sin `<Suspense>`.
export async function getExampleMessage(): Promise<ExampleMessage> {
  "use cache";
  cacheLife("hours");

  return {
    title: "Feature de ejemplo",
    description: "Copia src/features/example para crear tu propia feature.",
  };
}
