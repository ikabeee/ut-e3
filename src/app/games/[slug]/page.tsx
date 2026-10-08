import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GameDetail } from "@/modules/games";
import { getGameBySlug } from "@/modules/games/server";
import { Container } from "@/shared/ui";

async function GameContent({ params }: Pick<PageProps<"/games/[slug]">, "params">) {
  const { slug } = await params;
  const game = await getGameBySlug(slug);

  if (!game) notFound();

  return <GameDetail game={game} />;
}

export default function GamePage({ params }: PageProps<"/games/[slug]">) {
  return (
    <Container>
      <div className="py-12">
        <Suspense fallback={<p className="text-zinc-500">Cargando videojuego…</p>}>
          <GameContent params={params} />
        </Suspense>
      </div>
    </Container>
  );
}
