import type { ReviewLinks } from '@chaturanga/game-shell/ui';
import { useMemo } from 'react';
import { useNavigate } from 'react-router';

/** Where the Games list and a review live in this app, and the router that takes the player there. */
export function useReviewLinks(): ReviewLinks {
  const navigate = useNavigate();
  return useMemo(() => ({ games: '/games', review: (id: string) => `/games/${id}`, navigate: (path: string) => void navigate(path) }), [navigate]);
}
