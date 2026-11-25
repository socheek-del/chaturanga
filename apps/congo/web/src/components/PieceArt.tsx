import type { Piece } from '@chaturanga/rules-core';
import type { ReactNode } from 'react';

const SHAPES: Record<string, ReactNode> = {
  l: (
    <>
      <path d="M13 34c0-13 7-22 19-22s19 9 19 22l7 12-10 1-4 8H20l-4-8-10-1z" />
      <path d="m22 22 4 9m16-9-4 9M18 37h3m22 0h3" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M25 38q7 6 14 0" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="24" cy="34" r="2" className="animal-eye" /><circle cx="40" cy="34" r="2" className="animal-eye" />
      <path d="m26 47 6-4 6 4-6 4z" className="animal-nose" />
    </>
  ),
  z: (
    <>
      <path d="M18 51 22 22l8-10 7 10 9 29z" />
      <path d="m24 23 13 7m-14 3 17 7m-18 0 16 7m-9-33 12 7" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <circle cx="35" cy="20" r="1.8" className="animal-eye" />
    </>
  ),
  e: (
    <>
      <path d="M17 24 9 17v20l8-1c1 9 7 15 15 15s14-6 15-15l8 1V17l-8 7c-3-6-8-9-15-9s-12 3-15 9z" />
      <path d="M34 32c8 3 9 11 5 17-2 3-7 2-7-2v-7c-1-4-3-6-6-8" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <circle cx="26" cy="28" r="2" className="animal-eye" />
    </>
  ),
  g: (
    <>
      <path d="M22 54V31c0-5 5-8 10-8s10 3 10 8v23H22z" />
      <path d="M24 26c-3-5-2-11 3-14 4-2 11-1 14 3l-2 10" />
      <path d="M27 13V7m12 7 3-5" fill="none" stroke="currentColor" strokeWidth="2.7" strokeLinecap="round" />
      <circle cx="37" cy="20" r="1.8" className="animal-eye" />
      <circle cx="27" cy="37" r="2.1" className="animal-spot" /><circle cx="37" cy="45" r="2.1" className="animal-spot" />
    </>
  ),
  c: (
    <>
      <path d="M8 38c6-9 13-14 22-14h12l13 10-13 8H25l-7 8H8l6-9z" />
      <path d="M13 39h36m-27-8 4 4m6-4 4 4m6-4 4 4" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="39" cy="30" r="2" className="animal-eye" />
      <path d="M23 43v5m9-5v5m9-5v5" stroke="currentColor" strokeWidth="2" />
    </>
  ),
  m: (
    <>
      <circle cx="17" cy="26" r="9" /><circle cx="47" cy="26" r="9" />
      <path d="M16 39c0-14 7-24 16-24s16 10 16 24c0 10-7 16-16 16s-16-6-16-16z" />
      <path d="M21 37c0-5 5-8 11-8s11 3 11 8-5 11-11 11-11-6-11-11z" className="animal-muzzle" />
      <circle cx="26" cy="30" r="2" className="animal-eye" /><circle cx="38" cy="30" r="2" className="animal-eye" />
      <path d="m29 38 3-2 3 2-3 2z" className="animal-nose" />
    </>
  ),
  p: (
    <>
      <path d="M32 10c-9 12-15 20-15 29a15 15 0 0 0 30 0c0-9-6-17-15-29z" />
      <path d="M32 14c-2 10-2 25 0 38" fill="none" stroke="currentColor" strokeWidth="2" />
    </>
  ),
  s: (
    <>
      <path d="m32 6 4 6 7 1-5 5 1 7-7-3-7 3 1-7-5-5 7-1z" />
      <path d="M32 20c-8 10-14 18-14 27a14 14 0 0 0 28 0c0-9-6-17-14-27z" />
      <path d="M32 25v32" fill="none" stroke="currentColor" strokeWidth="2" />
    </>
  ),
};

/** Original Congo animal seals. A small river mark shows a piece with a turn to escape. */
export function PieceArt({ piece, className }: { piece: Piece & { riverDeadline?: boolean }; className: string }) {
  const light = piece.color === 'w';
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" className={className}>
      <g
        fill={light ? '#fff5d8' : '#264532'}
        stroke={light ? '#355a40' : '#e9cb8d'}
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ color: light ? '#355a40' : '#e9cb8d' }}
      >
        {SHAPES[piece.type] ?? SHAPES.p}
        {piece.riverDeadline && <path d="M51 5c-2 4-4 6-4 9a4 4 0 0 0 8 0c0-3-2-5-4-9z" fill="#48a6a0" stroke="#f5f0df" strokeWidth="1.2" />}
      </g>
    </svg>
  );
}
