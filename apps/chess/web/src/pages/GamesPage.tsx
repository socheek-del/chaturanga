import { GamesScreen } from '@chaturanga/game-shell/ui';
import { useReviewLinks } from '../features/review/links';
import { chessReview } from '../features/review/kit';

/** Every chess game saved in this browser (ch-014): the shared Games screen. */
export function GamesPage() {
  return <GamesScreen kit={chessReview} links={useReviewLinks()} />;
}
