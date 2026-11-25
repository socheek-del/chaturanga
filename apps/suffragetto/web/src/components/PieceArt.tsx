import type { Piece } from '@chaturanga/rules-core';

/** Original field tokens: rosettes for the large officers, stamped discs for the rank and file. */
export function PieceArt({ piece, className }: { piece: Piece; className: string }) {
  const suffragette = piece.color === 'w';
  const large = piece.type === 'l' || piece.type === 'i';
  const ink = suffragette ? '#214b3d' : '#334b62';
  const paper = suffragette ? '#f5ead6' : '#e5edf1';
  const stamp = piece.type.toUpperCase();
  return <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
    {large ? <>
      <path d="M32 4 39 12 50 10 51 21 60 28 53 36 55 48 43 49 32 60 22 51 10 52 11 40 4 31 12 22 11 12 23 13Z" fill={ink} stroke={paper} strokeWidth="2" />
      <circle cx="32" cy="32" r="18" fill={paper} stroke={ink} strokeWidth="2" />
      <circle cx="32" cy="32" r="13" fill="none" stroke={ink} strokeWidth="1.5" strokeDasharray="1 2" />
      <text x="32" y="38" textAnchor="middle" fontSize="17" fontWeight="800" fontFamily="Georgia,serif" fill={ink}>{stamp}</text>
    </> : <>
      <circle cx="32" cy="32" r="25" fill={ink} stroke={paper} strokeWidth="2.5" />
      <circle cx="32" cy="32" r="18" fill={paper} stroke={ink} strokeWidth="1.5" />
      <path d="M18 32h28M32 18v28" stroke={ink} strokeWidth="1" opacity=".35" />
      <text x="32" y="38" textAnchor="middle" fontSize="17" fontWeight="800" fontFamily="Georgia,serif" fill={ink}>{stamp}</text>
    </>}
  </svg>;
}
