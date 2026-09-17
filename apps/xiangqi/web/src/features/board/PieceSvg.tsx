import type { Piece } from '@chaturanga/xiangqi';
import { PIECE_GLYPHS } from './glyphs';

/** Character colours: cinnabar for Red, ink for Black (D5). */
export const PIECE_INK = { w: '#b3261e', b: '#1f1a17' } as const;

/**
 * A carved wooden disc with the piece's traditional character (D4), drawn from SVG paths so the board never
 * needs a CJK font. Red and Black read apart by colour and by the character itself.
 */
export function PieceSvg({ piece, className }: { piece: Piece; className?: string }) {
  const glyph = PIECE_GLYPHS[piece.color][piece.type];
  const ink = PIECE_INK[piece.color];
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-hidden data-glyph={glyph.char}>
      <circle cx="50" cy="52" r="46" fill="#8a5a31" />
      <circle cx="50" cy="48" r="46" fill="#f3e0b8" stroke="#8a5a31" strokeWidth="2" />
      <circle cx="50" cy="48" r="38.5" fill="none" stroke={ink} strokeWidth="3" />
      <path d={glyph.d} fill={ink} transform="translate(0 -2)" />
    </svg>
  );
}
