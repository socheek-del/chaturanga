import type { Piece } from '@chaturanga/shogi';
import { GOTE_KING_GLYPH, PIECE_GLYPHS } from './glyphs';
import type { BoardTheme } from './themes';

/**
 * A five-sided wooden tile with the piece's kanji (D4), drawn from SVG paths so the board never needs a
 * Japanese font. Both sides share the same faces — a Shogi piece belongs to whoever it points at — so the
 * tile is turned 180 degrees for the player at the far side of the board. A promoted face is written in red,
 * as on a real set.
 */
export function PieceSvg({
  piece,
  theme,
  upsideDown = false,
  className,
}: {
  piece: Piece;
  theme: BoardTheme;
  upsideDown?: boolean;
  className?: string;
}) {
  const entry = PIECE_GLYPHS[piece.type];
  const glyph =
    piece.promoted && entry.promoted
      ? entry.promoted
      : piece.type === 'k' && piece.color === 'b'
        ? GOTE_KING_GLYPH
        : entry.plain;
  const ink = piece.promoted && entry.promoted ? theme.promotedInk : theme.ink;
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-hidden
      data-glyph={glyph.char}
      style={upsideDown ? { transform: 'rotate(180deg)' } : undefined}
    >
      {/* The tile: a pentagon, wider at the foot, with the point towards the opponent. */}
      <path
        d="M50 5 L79 19 L88 93 Q88 96 85 96 L15 96 Q12 96 12 93 L21 19 Z"
        fill={theme.tile}
        stroke={theme.tileEdge}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d={glyph.d} fill={ink} transform="translate(0 4)" />
    </svg>
  );
}
