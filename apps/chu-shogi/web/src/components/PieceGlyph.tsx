import type { PieceType } from '@chaturanga/chu-shogi';
import { rankForPiece, RANK_GUIDE, PROMOTION_GUIDE } from '../lessons/pieceAtlas';

const promotedRank = new Map(PROMOTION_GUIDE.map(({ from, to }) => [from, to]));
export type PieceFace = { color: 'w' | 'b'; type: string; promoted: boolean };

export function activeRank(piece: PieceFace) {
  if (!piece.promoted) return rankForPiece(piece.type, false);
  const target = promotedRank.get(piece.type as PieceType);
  const promoted = target ? RANK_GUIDE.find((rank) => rank.id === target) : undefined;
  return promoted ?? (target ? RANK_GUIDE.find((rank) => rank.type === target && !rank.promoted) : undefined);
}

export function PieceGlyph({ piece, className = '' }: { piece: PieceFace; className?: string }) {
  const rank = activeRank(piece);
  return <span className={`piece-glyph piece-${piece.color}${piece.promoted ? ' is-promoted' : ''} ${className}`} aria-hidden="true">
    <span className="piece-seal">{rank?.abbreviation ?? piece.type.slice(0, 2).toUpperCase()}</span>
    {piece.promoted && <i className="piece-promotion-mark" />}
  </span>;
}
