import type { Piece } from '@chaturanga/rules-core';
import type { ReactNode } from 'react';

const SHAPES: Record<string, ReactNode> = {
  k: (
    <>
      <path d="M30 8h4M32 6v5" strokeWidth="2.4" />
      <path d="M23 15c0-4 4-7 9-7s9 3 9 7v5l-4 4 8 20H19l8-20-4-4z" />
      <path d="M17 48h30l3 7H14z" />
    </>
  ),
  q: (
    <>
      <circle cx="19" cy="14" r="3" />
      <circle cx="32" cy="10" r="3" />
      <circle cx="45" cy="14" r="3" />
      <path d="m18 18 5 24h18l5-24-9 9-5-15-5 15z" />
      <path d="M21 45h22l3 8H18z" />
    </>
  ),
  r: (
    <>
      <path d="M18 12h8v8h12v-8h8v14l-4 4 4 12H18l4-12-4-4z" />
      <path d="M17 45h30l3 8H14z" />
    </>
  ),
  b: (
    <>
      <path d="M32 9c-3 8-12 13-12 23a12 12 0 0 0 24 0c0-10-9-15-12-23z" />
      <path d="m25 22 14 13" strokeWidth="2.7" />
      <path d="M19 45h26l3 8H16z" />
    </>
  ),
  n: (
    <>
      <path d="M17 47c2-11 7-20 16-28l-3-9c9 1 16 7 18 16l-5 4 5 17z" />
      <path d="M28 22c4 2 8 4 12 8M19 46h30l2 7H17z" />
      <circle cx="38" cy="22" r="1.8" className="piece-eye" />
    </>
  ),
  p: (
    <>
      <circle cx="32" cy="18" r="9" />
      <path d="M24 29c-3 4-6 10-7 15h30c-1-5-4-11-7-15z" />
      <path d="M18 47h28l3 7H15z" />
    </>
  ),
};

/** A small original seal-shaped piece set drawn for Crazyhouse. */
export function PieceArt({ piece, className }: { piece: Piece; className: string }) {
  const light = piece.color === 'w';
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <g
        fill={light ? '#f5edda' : '#21342a'}
        stroke={light ? '#304538' : '#e0b887'}
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {SHAPES[piece.type] ?? SHAPES.p}
        {piece.promoted && (
          <path
            d="m49 5 2 4 4 .5-3 2.8.8 4-3.8-2-3.8 2 .8-4-3-2.8 4-.5z"
            fill="#bd7150"
            stroke="#f5edda"
            strokeWidth=".8"
          />
        )}
      </g>
    </svg>
  );
}
