import { GameDetailPage } from "@/features/games/pages";

export default function Page({ params }: PageProps<"/games/[slug]">) {
  return <GameDetailPage params={params} />;
}
