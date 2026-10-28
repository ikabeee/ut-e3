export {
  generateGameDetailStaticParams as generateStaticParams,
  generateGameDetailPageMetadata as generateMetadata,
  GameDetailPage as default,
} from "@features/games/pages/game-detail-page";

// The page reads params outside Suspense so an unknown slug answers 404 before streaming starts; navigating here waits
// for the (cached) game instead of showing an empty App Shell. Segment config must be a literal in the route file.
export const instant = false;
