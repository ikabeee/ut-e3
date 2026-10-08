import Link from "next/link";
import { Container } from "@/shared/components";

export default function NotFound() {
  return (
    <Container>
      <section className="flex flex-col items-start gap-4 py-20">
        <h1 className="text-3xl font-bold">Game over</h1>
        <p className="text-zinc-600 dark:text-zinc-400">No encontramos lo que buscabas.</p>
        <Link href="/" className="underline">
          Volver al inicio
        </Link>
      </section>
    </Container>
  );
}
