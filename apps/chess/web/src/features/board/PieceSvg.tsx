import type { Piece } from '@chaturanga/chess';
import type { BoardTheme } from './themes';

/**
 * The chess pieces of the "Marble" identity (ch-004, decision D4): Staunton-shaped silhouettes drawn as SVG
 * paths in this repository. The Staunton *design* of 1849 is nobody's copyright, but the well-known SVG sets
 * on the web are not in the public domain, so these are our own drawings — solid bodies with a drawn edge,
 * so a piece stays readable at 32 px and on a dark board.
 *
 * Every piece is drawn in a 100x100 box standing on the same plinth, so the set looks like one set.
 */

/** The plinth every piece stands on. */
const BASE = 'M22 92h56a3 3 0 0 1 3 3v3H19v-3a3 3 0 0 1 3-3z';
/** The collar between a body and the plinth. */
const COLLAR = 'M28 82h44l4 8H24z';

/** A piece is a body (filled) plus optional detail marks: a cut line, or a filled dot for the eye. */
type Shape = { d: string; kind?: 'line' | 'dot' };

const PAWN: Shape[] = [
  { d: 'M50 20a13 13 0 0 1 13 13 13 13 0 0 1-5 10c6 5 9 15 10 27H32c1-12 4-22 10-27a13 13 0 0 1-5-10 13 13 0 0 1 13-13z' },
];

const ROOK: Shape[] = [{ d: 'M26 20h9v8h10v-8h10v8h10v-8h9v20l-7 7v25l6 10H27l6-10V47l-7-7z' }, { d: 'M33 47h34', kind: 'line' }];

const BISHOP: Shape[] = [
  { d: 'M50 12c5 5 8 9 8 14 0 4-2 7-5 10 7 6 11 14 11 24 0 5-1 9-3 12H39c-2-3-3-7-3-12 0-10 4-18 11-24-3-3-5-6-5-10 0-5 3-9 8-14z' },
  { d: 'M44 34 56 46', kind: 'line' },
  { d: 'M38 62h24', kind: 'line' },
];

const QUEEN: Shape[] = [
  {
    d: 'M50 14a6 6 0 0 1 6 6 6 6 0 0 1-3 5l8 19 11-14a5 5 0 0 1-2-4 5 5 0 0 1 10 0 5 5 0 0 1-4 5l-6 41H30l-6-41a5 5 0 0 1-4-5 5 5 0 0 1 10 0 5 5 0 0 1-2 4l11 14 8-19a6 6 0 0 1-3-5 6 6 0 0 1 6-6z',
  },
  { d: 'M31 60h38', kind: 'line' },
];

const KING: Shape[] = [
  { d: 'M47 8h6v6h6v6h-6v7h-6v-7h-6v-6h6z' },
  { d: 'M50 27c10 0 18 7 18 16 0 5-2 9-6 13l4 16H34l4-16c-4-4-6-8-6-13 0-9 8-16 18-16z' },
  { d: 'M36 66h28', kind: 'line' },
];

const KNIGHT: Shape[] = [
  {
    d: 'M56 10 L67 17 C75 23 81 31 85 41 C87 47 85 51 79 51 L70 51 C66 57 62 61 58 65 C54 71 52 76 52 82 L33 82 C31 72 32 62 36 54 C40 45 46 39 44 35 L35 41 C31 44 26 42 26 37 C26 31 30 25 37 21 Z',
  },
  { d: 'M50 30a3 3 0 1 0 0.1 0', kind: 'dot' },
];

const SHAPES: Readonly<Record<string, readonly Shape[]>> = {
  p: PAWN,
  r: ROOK,
  b: BISHOP,
  q: QUEEN,
  k: KING,
  n: KNIGHT,
};

export interface PieceSvgProps {
  piece: Piece;
  theme: BoardTheme;
  className?: string;
}

/** One piece, in the colour its side owns. */
export function PieceSvg({ piece, theme, className }: PieceSvgProps) {
  const white = piece.color === 'w';
  const body = white ? theme.whitePiece : theme.blackPiece;
  const edge = white ? theme.whiteEdge : theme.blackEdge;
  const shapes = SHAPES[piece.type] ?? PAWN;

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
      <g fill={body} stroke={edge} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round">
        {shapes.map((shape) => (
          <path
            key={shape.d}
            d={shape.d}
            fill={shape.kind === 'dot' ? edge : shape.kind === 'line' ? 'none' : body}
            stroke={shape.kind === 'dot' ? 'none' : edge}
            strokeWidth={shape.kind === 'line' ? 3 : 4}
          />
        ))}
        <path d={COLLAR} />
        <path d={BASE} />
      </g>
    </svg>
  );
}
