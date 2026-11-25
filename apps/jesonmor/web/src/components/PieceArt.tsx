import type { Piece } from '@chaturanga/rules-core';

/** Original horse seal: a leaping profile in the app's field-guide palette. */
export function PieceArt({ piece, className }: { piece: Piece; className: string }) {
  const light = piece.color === 'w';
  return <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
    <path
      d="M13 53c3-7 7-11 11-14l-2-18 9 5 8-8 11 8-4 10 6 7-10 3-3 9H18z"
      fill={light ? '#fbf2df' : '#263a3a'}
      stroke={light ? '#394b45' : '#f0d4a8'}
      strokeWidth="3"
      strokeLinejoin="round"
    />
    <path d="m23 26 12 4 9-4m-20 15 19 2m-24 13h27" fill="none" stroke={light ? '#394b45' : '#f0d4a8'} strokeWidth="2.4" strokeLinecap="round" />
    <circle cx="42" cy="28" r="1.7" fill={light ? '#394b45' : '#f0d4a8'} />
  </svg>;
}
