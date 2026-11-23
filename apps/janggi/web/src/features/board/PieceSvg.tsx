import type { Piece } from '@chaturanga/janggi';
import { HANGUL_GLYPHS, PIECE_GLYPHS } from './glyphs';
import { DIRECTION_VECTOR, PIECE_LETTERS, PIECE_MOVES, pieceKey, type PieceSetId } from './pieceSets';

/** Character colours: Cho's green and Han's red, as on a real set. */
export const PIECE_INK = { w: '#0f6b4f', b: '#b3261e' } as const;

/** Janggi pieces come in three sizes: the general largest, advisors and soldiers smallest. */
const SIZE: Readonly<Record<Piece['type'], number>> = { k: 1, r: 0.9, c: 0.9, n: 0.9, b: 0.9, a: 0.74, p: 0.74 };

/** A regular octagon of radius `r` around (50, y), flat side up. */
function octagon(r: number, y: number): string {
  return Array.from({ length: 8 }, (_, i) => {
    const angle = Math.PI / 8 + (i * Math.PI) / 4;
    return `${(50 + r * Math.cos(angle)).toFixed(1)},${(y + r * Math.sin(angle)).toFixed(1)}`;
  }).join(' ');
}

const CX = 50;
const CY = 48;
const STEP = 19;

/** A dot for a one-point step, an arrow for a slide, a small dot for a leap, in the piece's own directions. */
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
        // The cannon's arrow starts beyond a hollow ring: the one piece it has to jump.
        const start = moves.screen ? 18 : 10;
        const from = { x: CX + dx * start, y: CY + dy * start };
        const to = { x: CX + dx * 25, y: CY + dy * 25 };
        const head = [
          `${to.x + dx * 6},${to.y + dy * 6}`,
          `${to.x - dy * 5 - dx * 2},${to.y + dx * 5 - dy * 2}`,
          `${to.x + dy * 5 - dx * 2},${to.y - dx * 5 - dy * 2}`,
        ].join(' ');
        return (
          <g key={`l${dir}`}>
            {moves.screen && <circle cx={CX + dx * 12} cy={CY + dy * 12} r={4} fill="none" strokeWidth={2.5} />}
            <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} strokeWidth={4.5} strokeLinecap="round" />
            <polygon points={head} stroke="none" />
          </g>
        );
      })}
      {(moves.jumps ?? []).map(([dx, dy]) => {
        const unit = 30 / Math.max(Math.abs(dx), Math.abs(dy));
        return <circle key={`j${dx},${dy}`} cx={CX + dx * unit} cy={CY - dy * unit} r={4.5} />;
      })}
    </g>
  );
}

/**
 * An octagonal wooden piece, drawn from SVG paths so the board never needs a Korean font. Cho and Han read
 * apart by colour and, on the general and the soldiers, by what is written. `set` picks what that is: the
 * character of a real set, the same word in Hangul, a diagram of the piece's moves, or a Latin letter.
 */
export function PieceSvg({ piece, set = 'characters', className }: { piece: Piece; set?: PieceSetId; className?: string }) {
  const glyph = (set === 'hangul' ? HANGUL_GLYPHS : PIECE_GLYPHS)[piece.color][piece.type];
  const ink = PIECE_INK[piece.color];
  const scale = SIZE[piece.type];
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-hidden data-glyph={glyph.char} data-piece-set={set}>
      <g transform={`translate(${50 - 50 * scale} ${50 - 50 * scale}) scale(${scale})`}>
        <polygon points={octagon(49, 52)} fill="#8f6a3c" />
        <polygon points={octagon(49, 48)} fill="#f6e7c6" stroke="#8f6a3c" strokeWidth="2" strokeLinejoin="round" />
        <polygon points={octagon(41, 48)} fill="none" stroke={ink} strokeWidth="2.5" strokeLinejoin="round" />
        {(set === 'characters' || set === 'hangul') && <path d={glyph.d} fill={ink} transform="translate(0 -2)" />}
        {set === 'symbols' && <SymbolFace piece={piece} ink={ink} />}
        {set === 'letters' && (
          <text x={CX} y={CY} fill={ink} textAnchor="middle" dominantBaseline="central" fontSize={46} fontWeight="700" fontFamily="inherit">
            {PIECE_LETTERS[pieceKey(piece)] ?? '?'}
          </text>
        )}
      </g>
    </svg>
  );
}
