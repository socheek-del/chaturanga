import type { Piece } from '@chaturanga/shogi';
import { GOTE_KING_GLYPH, PIECE_GLYPHS } from './glyphs';
import { DIRECTION_VECTOR, PIECE_LETTERS, PIECE_MOVES, pieceKey, type PieceSetId } from './pieceSets';
import type { BoardTheme } from './themes';

/** Centre of the tile's face, and how far a step marker sits from it. */
const CX = 50;
const CY = 54;
const STEP = 21;

/** A dot for a one-square step, an arrow for a slide, in the piece's own directions (sg-012). */
function SymbolFace({ piece, ink }: { piece: Piece; ink: string }) {
  const moves = PIECE_MOVES[pieceKey(piece)] ?? { steps: [], slides: [] };
  return (
    <g fill={ink} stroke={ink}>
      <rect x={CX - 5} y={CY - 5} width={10} height={10} rx={1.5} />
      {moves.steps.map((dir) => {
        const [dx, dy] = DIRECTION_VECTOR[dir];
        return <circle key={`s${dir}`} cx={CX + dx * STEP} cy={CY + dy * STEP} r={6} />;
      })}
      {moves.slides.map((dir) => {
        const [dx, dy] = DIRECTION_VECTOR[dir];
        const from = { x: CX + dx * 11, y: CY + dy * 11 };
        const to = { x: CX + dx * 30, y: CY + dy * 30 };
        // The arrowhead is a triangle across the direction of travel.
        const head = [
          `${to.x + dx * 7},${to.y + dy * 7}`,
          `${to.x - dy * 6 - dx * 2},${to.y + dx * 6 - dy * 2}`,
          `${to.x + dy * 6 - dx * 2},${to.y - dx * 6 - dy * 2}`,
        ].join(' ');
        return (
          <g key={`l${dir}`}>
            <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} strokeWidth={5} strokeLinecap="round" />
            <polygon points={head} stroke="none" />
          </g>
        );
      })}
      {(moves.jumps ?? []).map(([dx, dy]) => (
        <circle key={`j${dx},${dy}`} cx={CX + dx * 20} cy={CY - dy * 17} r={5.5} />
      ))}
    </g>
  );
}

/**
 * A five-sided wooden tile with the piece on it (D4), drawn from SVG paths so the board never needs a
 * Japanese font. Both sides share the same faces — a Shogi piece belongs to whoever it points at — so the
 * tile is turned 180 degrees for the player at the far side of the board. A promoted face is written in red,
 * as on a real set.
 *
 * `set` picks what is written on the tile: the kanji of a real set, a diagram of the piece's moves, or a
 * Latin letter (sg-012). `tint` gives the far player's tiles their own wood, for players who find the
 * rotation alone hard to read.
 */
export function PieceSvg({
  piece,
  theme,
  upsideDown = false,
  set = 'kanji',
  tint = false,
  className,
}: {
  piece: Piece;
  theme: BoardTheme;
  upsideDown?: boolean;
  set?: PieceSetId;
  tint?: boolean;
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
  const tinted = tint && piece.color === 'b';
  const letters = PIECE_LETTERS[pieceKey(piece)] ?? '?';
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-hidden
      data-glyph={glyph.char}
      data-piece-set={set}
      style={upsideDown ? { transform: 'rotate(180deg)' } : undefined}
    >
      {/* The tile: a pentagon, wider at the foot, with the point towards the opponent. */}
      <path
        d="M50 5 L79 19 L88 93 Q88 96 85 96 L15 96 Q12 96 12 93 L21 19 Z"
        fill={tinted ? theme.tileAlt : theme.tile}
        stroke={tinted ? theme.tileEdgeAlt : theme.tileEdge}
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {set === 'kanji' && <path d={glyph.d} fill={ink} transform="translate(0 4)" />}
      {set === 'symbols' && <SymbolFace piece={piece} ink={ink} />}
      {set === 'letters' && (
        <text
          x={CX}
          y={CY}
          fill={ink}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={letters.length > 1 ? 36 : 50}
          fontWeight="700"
          fontFamily="inherit"
        >
          {letters}
        </text>
      )}
    </svg>
  );
}
