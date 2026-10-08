import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Container, LoadingMessage } from "@/shared/components";
import { GameDetail } from "../components/game-detail";
import { getPublishedGameBySlug } from "../lib/game-queries";

interface GameDetailPageProps {
  params: Promise<{ slug: string }>;
}

async function PublishedGameDetail({ params }: GameDetailPageProps) {
  const { slug } = await params;
  const game = await getPublishedGameBySlug(slug);

  if (!game) notFound();

  return <GameDetail game={game} />;
}

export function GameDetailPage({ params }: GameDetailPageProps) {
  return (
    <Container>
      <div className="py-12">
        <Suspense fallback={<LoadingMessage message="Cargando videojuego..." />}>
          <PublishedGameDetail params={params} />
        </Suspense>
      </div>
    </Container>
  );
}
