import type { Piece } from '@chaturanga/xiangqi';
import { PIECE_GLYPHS } from './glyphs';
import { DIRECTION_VECTOR, PIECE_LETTERS, PIECE_MOVES, pieceKey, type PieceSetId } from './pieceSets';

/** Character colours: cinnabar for Red, ink for Black (D5). */
export const PIECE_INK = { w: '#b3261e', b: '#1f1a17' } as const;

/** Centre of the disc's face, and how far a step marker sits from it. */
const CX = 50;
const CY = 48;
const STEP = 19;

/** A dot for a one-point step, an arrow for a slide, a ring for a leap, in the piece's own directions. */
function SymbolFace({ piece, ink }: { piece: Piece; ink: string }) {
  const moves = PIECE_MOVES[pieceKey(piece)] ?? { steps: [], slides: [] };
  return (
    <g fill={ink} stroke={ink}>
      <rect x={CX - 4.5} y={CY - 4.5} width={9} height={9} rx={1.5} />
      {moves.steps.map((dir) => {
        const [dx, dy] = DIRECTION_VECTOR[dir];
        return <circle key={`s${dir}`} cx={CX + dx * STEP} cy={CY + dy * STEP} r={5.5} />;
      })}
      {moves.slides.map((dir) => {
        const [dx, dy] = DIRECTION_VECTOR[dir];
        const from = { x: CX + dx * 10, y: CY + dy * 10 };
        const to = { x: CX + dx * 25, y: CY + dy * 25 };
        const head = [
          `${to.x + dx * 6},${to.y + dy * 6}`,
          `${to.x - dy * 5 - dx * 2},${to.y + dx * 5 - dy * 2}`,
          `${to.x + dy * 5 - dx * 2},${to.y - dx * 5 - dy * 2}`,
        ].join(' ');
        return (
          <g key={`l${dir}`}>
            <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} strokeWidth={4.5} strokeLinecap="round" />
            <polygon points={head} stroke="none" />
            {/* The cannon takes by jumping exactly one piece: the hollow ring is that screen. */}
            {moves.screen && <circle cx={CX + dx * 36} cy={CY + dy * 36} r={4.5} fill="none" strokeWidth={2.5} />}
          </g>
        );
      })}
      {(moves.jumps ?? []).map(([dx, dy]) => (
        <circle key={`j${dx},${dy}`} cx={CX + dx * 15} cy={CY - dy * 15} r={4.5} />
      ))}
    </g>
  );
}

/**
 * A carved wooden disc with the piece on it, drawn from SVG paths so the board never needs a CJK font. Red
 * and Black read apart by colour and by what is written on the disc.
 *
 * `set` picks what that is: the traditional character of a real set (D4), a diagram of the piece's moves, or
 * a Latin letter (xq-012).
 */
export function PieceSvg({ piece, set = 'characters', className }: { piece: Piece; set?: PieceSetId; className?: string }) {
  const glyph = PIECE_GLYPHS[piece.color][piece.type];
  const ink = PIECE_INK[piece.color];
  const letter = PIECE_LETTERS[pieceKey(piece)] ?? '?';
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-hidden data-glyph={glyph.char} data-piece-set={set}>
      <circle cx="50" cy="52" r="46" fill="#8a5a31" />
      <circle cx="50" cy="48" r="46" fill="#f3e0b8" stroke="#8a5a31" strokeWidth="2" />
      <circle cx="50" cy="48" r="38.5" fill="none" stroke={ink} strokeWidth="3" />
      {set === 'characters' && <path d={glyph.d} fill={ink} transform="translate(0 -2)" />}
      {set === 'symbols' && <SymbolFace piece={piece} ink={ink} />}
      {set === 'letters' && (
        <text
          x={CX}
          y={CY}
          fill={ink}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={46}
          fontWeight="700"
          fontFamily="inherit"
        >
          {letter}
        </text>
      )}
    </svg>
  );
}
