import type { Piece, PieceType } from '@chaturanga/senterej';

const GLYPHS: Record<PieceType, string> = {
  k: 'M22 44 28 27l8 8 8-8 6 17M20 48h32v6H20z',
  r: 'M21 50V31h7v-8h8v8h5v-8h8v8h7v19zM27 35h24v10H27z',
  n: 'M20 51 27 34l8-13 8 9 10 6-4 15zM34 37l10 2 3 7H29z',
  b: 'M36 19 52 36 36 53 20 36zM36 27v18M27 36h18',
  q: 'M20 47 36 22l16 25M24 48h24M31 42h10',
  p: 'M36 20c-7 0-12 5-12 12 0 5 3 9 7 11l-3 8h16l-3-8c4-2 7-6 7-11 0-7-5-12-12-12zM31 51h10',
};

export function PieceMark({ piece, className = '', compact = false }: { piece: Piece; className?: string; compact?: boolean }) {
  const side = piece.color === 'w' ? 'ivory' : 'gold';
  return (
    <span className={`senterej-piece ${side}${compact ? ' compact' : ''} ${className}`} aria-hidden="true">
      <svg viewBox="0 0 72 72" focusable="false">
        <circle className="piece-disc" cx="36" cy="36" r="31" />
        <circle className="piece-rim" cx="36" cy="36" r="27" />
        <path className="piece-mark" d={GLYPHS[piece.type]} />
      </svg>
    </span>
  );
}
