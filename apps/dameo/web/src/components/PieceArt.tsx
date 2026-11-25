import type { Piece } from '@chaturanga/rules-core';
import { cn } from '@chaturanga/ui';

/** Original carved-token art, composed from local SVG primitives. */
export function PieceArt({ piece, className = '' }: { piece: Piece; className?: string }) {
  const isKing = piece.type === 'k';
  return (
    <span className={cn('dameo-token', piece.color === 'w' ? 'dameo-token--chalk' : 'dameo-token--ink', className)} aria-hidden>
      <svg viewBox="0 0 64 64" fill="none" focusable="false">
        <circle className="token-shadow" cx="32" cy="34" r="24" />
        <circle className="token-rim" cx="32" cy="31" r="25" />
        <circle className="token-face" cx="32" cy="31" r="21" />
        <circle className="token-incision" cx="32" cy="31" r="15.5" />
        {isKing ? (
          <g className="token-mark">
            <path d="M32 14v34M15 31h34M20 19l24 24M44 19 20 43" />
            <circle cx="32" cy="31" r="4.1" />
          </g>
        ) : (
          <path className="token-mark" d="M32 20v22" />
        )}
        <path className="token-glint" d="M17 25c2.3-7 8-11 15-12" />
      </svg>
    </span>
  );
}
