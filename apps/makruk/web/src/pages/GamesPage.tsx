import { GamesScreen } from '@chaturanga/game-shell/ui';
import { makrukReview } from '../features/review/kit';
import { useReviewLinks } from '../features/review/links';

/** Every Makruk game saved in this browser (review-001): the shared Games screen. */
export function GamesPage() {
  return <GamesScreen kit={makrukReview} links={useReviewLinks()} />;
}
