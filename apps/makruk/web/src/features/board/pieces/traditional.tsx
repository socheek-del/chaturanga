import type { Piece } from '@chaturanga/makruk';
import { type ReactNode, useId } from 'react';

/**
 * art-003: "traditional wood" set — the lathe-turned pieces of a real Thai set seen from the side,
 * for players who cannot read the stylised sets. Each piece is the turned profile of the physical piece
 * (chedi-shaped Khun, lotus-bud Met, conical Khon, carved Ma, cleft Ruea hull, cowrie Bia) with a wood
 * gradient, a collar ring and a cast shadow so it reads as a rounded object, not a flat symbol.
 * A promoted Bia is the cowrie turned over, the way the shell is flipped on a real board.
 * Drawn on the same 100×100 grid as the other sets.
 */
export const TRADITIONAL_PALETTE = {
  // Pale boxwood, the light side of a Thai set.
  w: { light: '#fdf1d9', body: '#ecd0a0', shade: '#c49a5d', deep: '#a1773f', edge: '#5f3f1d', mark: '#7a5326' },
  // Rosewood, darkened with lacquer.
  b: { light: '#8a5634', body: '#53301c', shade: '#331c0f', deep: '#231208', edge: '#120903', mark: '#caa06a' },
} as const;

type Palette = (typeof TRADITIONAL_PALETTE)[keyof typeof TRADITIONAL_PALETTE];

interface Shape {
  /** Turned profile of the piece, from the top of the foot upwards. */
  body: string;
  /** Collar rings: [cx, cy, rx, ry] ellipses drawn across the body. */
  rings: readonly (readonly [number, number, number, number])[];
  details?: (p: Palette) => ReactNode;
}

export const TRADITIONAL_SHAPES: Record<Piece['type'], Shape> = {
  // Khun: the tallest piece, a chedi — bell, waist, tiered neck and a pointed finial.
  k: {
    body:
      'M31 79 C31 71 35 67 37 61 C39 55 38 51 36 47 L43 43 C41 37 42 32 46 28 L47 17 L50 8 L53 17 L54 28 ' +
      'C58 32 59 37 57 43 L64 47 C62 51 61 55 63 61 C65 67 69 71 69 79 Z',
    rings: [
      [50, 61, 15, 3.4],
      [50, 46, 12, 2.8],
      [50, 30, 7.5, 2.2],
    ],
    details: (p) => <path d="M50 8 L50 24" stroke={p.light} strokeWidth="1.6" opacity="0.5" fill="none" />,
  },
  // Met: the shortest piece after the Bia — a round lotus bud on a turned foot.
  m: {
    body: 'M33 79 C33 74 35 70 37 67 C30 60 33 49 50 46 C67 49 70 60 63 67 C65 70 67 74 67 79 Z M47 47 L50 37 L53 47 Z',
    rings: [[50, 67, 14, 3.2]],
  },
  // Khon: a blunt cone with the flared brim of a soldier's hat — no spire, so it never reads as a Khun.
  s: {
    body:
      'M31 79 C31 72 34 67 37 62 L39 56 C32 53 33 46 41 44 L45 28 C45 22 55 22 55 28 L59 44 C67 46 68 53 61 56 ' +
      'L63 62 C66 67 69 72 69 79 Z',
    rings: [
      [50, 62, 14.5, 3.2],
      [50, 45.5, 13.5, 3],
    ],
  },
  // Ma: the carved horse head, muzzle to the right, on a turned neck.
  n: {
    body:
      'M32 79 C32 72 35 67 39 62 C35 54 35 44 41 36 C46 29 53 24 61 22 C66 21 71 23 71 28 C71 32 67 34 64 37 ' +
      'C61 40 60 44 61 48 C63 53 63 57 62 62 C65 67 68 72 68 79 Z',
    rings: [[50, 62, 14, 3.2]],
    details: (p) => (
      <>
        <path d="M58 24 L59 14 L66 21 Z" fill={p.shade} stroke={p.edge} strokeWidth="2" strokeLinejoin="round" />
        <circle cx="52" cy="33" r="2.6" fill={p.edge} />
        <path d="M67 29 C69 29 70 28 70 27" stroke={p.edge} strokeWidth="1.8" fill="none" />
        <path d="M46 30 C43 37 43 45 46 51" stroke={p.deep} strokeWidth="2.4" fill="none" opacity="0.7" />
      </>
    ),
  },
  // Ruea: the squat boat hull, cleft across the top like the prow of a real Ruea.
  r: {
    body: 'M29 79 C29 71 31 64 33 58 C33 49 39 44 44 42 L50 50 L56 42 C61 44 67 49 67 58 C69 64 71 71 71 79 Z',
    rings: [[50, 58, 17, 3.6]],
    details: (p) => <path d="M44 43 L50 51 L56 43" stroke={p.edge} strokeWidth="2.4" fill="none" strokeLinejoin="round" />,
  },
  // Bia: the cowrie shell resting on its back, ribs along the dome.
  p: {
    body: 'M26 79 C26 64 36 55 50 55 C64 55 74 64 74 79 Z',
    rings: [],
    details: (p) => (
      <>
        <path d="M39 59 C43 66 44 73 43 79" stroke={p.deep} strokeWidth="1.8" fill="none" opacity="0.55" />
        <path d="M50 56 V79" stroke={p.deep} strokeWidth="1.8" opacity="0.45" />
        <path d="M61 59 C57 66 56 73 57 79" stroke={p.deep} strokeWidth="1.8" fill="none" opacity="0.55" />
      </>
    ),
  },
};

/** A promoted Bia is the same shell turned over: the toothed aperture faces up (Bia Ngai). */
function FlippedCowrie({ palette, id }: { palette: Palette; id: string }) {
  return (
    <>
      <path d="M26 79 C26 64 36 55 50 55 C64 55 74 64 74 79 Z" fill={`url(#${id}-wood)`} stroke={palette.edge} strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M36 72 C36 62 42 58 50 58 C58 58 64 62 64 72 Z" fill={palette.deep} stroke={palette.edge} strokeWidth="2" />
      {[41, 46, 51, 56, 61].map((x) => (
        <path key={x} d={`M${x} 72 L${x - 1} 63`} stroke={palette.light} strokeWidth="1.8" opacity="0.8" />
      ))}
      <path d="M36 72 H64" stroke={palette.mark} strokeWidth="2.2" />
    </>
  );
}

export function TraditionalPiece({ piece, className }: { piece: Piece; className?: string }) {
  const palette = TRADITIONAL_PALETTE[piece.color];
  // React ids contain ':' — invalid in a CSS url() reference, so strip it for the gradient ids.
  const id = `mk-trad-${useId().replaceAll(':', '')}`;
  const shape = TRADITIONAL_SHAPES[piece.type];

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden focusable="false" data-set="traditional" data-type={piece.promoted ? 'p~' : piece.type}>
      <defs>
        {/* Side light across a turned (round) body: dark rim, highlight left of centre, dark rim. */}
        <linearGradient id={`${id}-wood`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={palette.deep} />
          <stop offset="0.18" stopColor={palette.shade} />
          <stop offset="0.38" stopColor={palette.light} />
          <stop offset="0.62" stopColor={palette.body} />
          <stop offset="1" stopColor={palette.deep} />
        </linearGradient>
        <linearGradient id={`${id}-foot`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={palette.deep} />
          <stop offset="0.35" stopColor={palette.body} />
          <stop offset="0.65" stopColor={palette.shade} />
          <stop offset="1" stopColor={palette.deep} />
        </linearGradient>
      </defs>

      {/* The piece stands on the square: a soft cast shadow, then the turned foot. */}
      <ellipse cx="52" cy="92" rx="30" ry="5.5" fill={palette.edge} opacity="0.28" />
      <g stroke={palette.edge} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round">
        {piece.promoted ? (
          <FlippedCowrie palette={palette} id={id} />
        ) : (
          <>
            <path d={shape.body} fill={`url(#${id}-wood)`} />
            {shape.rings.map(([cx, cy, rx, ry]) => (
              <ellipse key={`${cx}-${cy}`} cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${id}-foot)`} strokeWidth="2" />
            ))}
            {shape.details?.(palette)}
          </>
        )}
        <path d="M23 79 H77 L79 86 Q79 91 50 91 Q21 91 21 86 Z" fill={`url(#${id}-foot)`} />
        <ellipse cx="50" cy="79" rx="27" ry="4.6" fill={`url(#${id}-wood)`} strokeWidth="2.2" />
      </g>
    </svg>
  );
}
