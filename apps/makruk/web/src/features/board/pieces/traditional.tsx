import type { Piece } from '@chaturanga/makruk';
import { type ReactNode, useId } from 'react';

/**
 * art-003: "traditional wood" set — the pieces of a physical Thai set, seen from the side.
 * The shapes follow a real turned set (reference: a Thai teak set photographed side by side):
 * Khun and Met are turned urns on a wide foot with a pointed finial, Khon is a squatter urn with a short
 * finial, Ruea is a low dome drawn up into a spiral point, Bia is a flat turned puck, and Ma is a carved
 * horse. Each solid of revolution is generated from its lathe profile, so the silhouette, the turning
 * grooves and the shading all agree. A promoted Bia is the puck turned over, showing its hollowed
 * underside, as it is on a real board.
 * Drawn on the same 100×100 grid as the other sets; the pieces stand on y = 87.
 */
export const TRADITIONAL_PALETTE = {
  // The pale side of a Thai set: honey-coloured wood, kept lighter than the teak board.
  w: { light: '#fff6e6', body: '#f4ddb6', shade: '#d3ac74', deep: '#ab8148', edge: '#5b3a18', mark: '#8a5a24' },
  // The dark side: rosewood, oiled.
  b: { light: '#9a5f36', body: '#65381f', shade: '#402011', edge: '#160a03', deep: '#2a1409', mark: '#d0a469' },
} as const;

type Palette = (typeof TRADITIONAL_PALETTE)[keyof typeof TRADITIONAL_PALETTE];

/** A lathe profile: [half-width, y] from the foot upwards. x = 50 is the axis. */
type Profile = readonly (readonly [number, number])[];

/**
 * Outline through the given points. A lathe cuts both sharp steps and soft curves, so a vertex that turns
 * hard (a disc edge, a collar) stays a corner and a gentle one is rounded.
 */
function outline(points: readonly (readonly [number, number])[]): string {
  const angle = (a: readonly [number, number], b: readonly [number, number]) => Math.atan2(b[1] - a[1], b[0] - a[0]);
  let d = `M${points[0]![0]} ${points[0]![1]}`;
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]!;
    const here = points[i]!;
    const next = points[i + 1]!;
    let turn = Math.abs(angle(prev, here) - angle(here, next));
    if (turn > Math.PI) turn = 2 * Math.PI - turn;
    if (turn > 1.15) {
      d += ` L${here[0]} ${here[1]}`;
    } else {
      d += ` Q${here[0]} ${here[1]} ${(here[0] + next[0]) / 2} ${(here[1] + next[1]) / 2}`;
    }
  }
  const last = points[points.length - 1]!;
  return `${d} L${last[0]} ${last[1]}`;
}

/** The outline of a solid of revolution: up the left side of the profile and back down the right. */
function turned(profile: Profile): string {
  const left = profile.map(([w, y]) => [50 - w, y] as const);
  const right = [...profile].reverse().map(([w, y]) => [50 + w, y] as const);
  return `${outline([...left, ...right])} Z`;
}

/** Half-width of the profile at y, so a turning groove follows the real body. */
function widthAt(profile: Profile, y: number): number {
  for (let i = 0; i < profile.length - 1; i++) {
    const [w1, y1] = profile[i]!;
    const [w2, y2] = profile[i + 1]!;
    if ((y <= y1 && y >= y2) || (y >= y1 && y <= y2)) {
      const t = y1 === y2 ? 0 : (y - y1) / (y2 - y1);
      return w1 + (w2 - w1) * t;
    }
  }
  return profile[profile.length - 1]![0];
}

interface Turned {
  /** Lathe profile, foot first. */
  profile: Profile;
  /** Heights of the turning grooves cut into the body. */
  grooves: readonly number[];
}

/**
 * The six turned profiles. Heights follow the real set: Khun tallest, then Met, Khon, Ruea, and the Bia
 * is a flat puck. (Ma is carved, not turned, and is drawn separately.)
 */
export const TRADITIONAL_PROFILES: Record<Exclude<Piece['type'], 'n'>, Turned> = {
  // Khun: the tallest turned piece — a flat foot disc, a pinched waist, a wide cap that overhangs the
  // foot, a collar and a short ringed finial.
  k: {
    profile: [
      [26, 87], [26, 84], [23, 82], [12, 79.5], [10, 76], [10.5, 72.5], [16, 69], [21.5, 65],
      [24.5, 61], [25.5, 57], [25, 53.5], [22, 49.5], [17.5, 46], [12, 43], [7.5, 40.5],
      [12, 37.5], [11.5, 36], [6, 34], [8.5, 30], [5, 26.5], [2.5, 22], [0, 17],
    ],
    grooves: [58, 53],
  },
  // Met: the Khon's height, two thirds its width, and a longer finial.
  m: {
    profile: [
      [17, 87], [17, 84.5], [15.5, 82.5], [8, 80.5], [6.5, 77.5], [7, 74.5], [10, 71.5], [13.5, 68],
      [16, 64.5], [16.5, 61], [15.5, 57.5], [13, 54], [9.5, 50.5], [6.5, 48], [10, 45], [5, 42.5],
      [7, 38.5], [3.5, 34.5], [0, 26],
    ],
    grooves: [62, 58],
  },
  // Khon: the Met's height with a much wider cap and a stubby finial.
  s: {
    profile: [
      [21, 87], [21, 84.5], [19, 82.5], [10.5, 80.5], [9, 77.5], [9.5, 74.5], [13.5, 71.5], [18, 68],
      [21, 64.5], [21.5, 61], [20.5, 57.5], [17.5, 54], [13, 50.5], [9, 48], [12.5, 45], [6.5, 42.5],
      [8, 39], [4, 35.5], [0, 30],
    ],
    grooves: [62, 58],
  },
  // Ruea: a round bun that keeps its belly low, cut off at the shoulder by a short turned cone.
  r: {
    profile: [
      [23, 87], [25, 84], [25.5, 79.5], [25, 74.5], [23.5, 70], [21, 66], [14, 58], [8.5, 52.5],
      [4, 47.5], [0, 43],
    ],
    grooves: [79, 73, 68],
  },
  // Bia: a thick turned puck — a flat face, a rounded rim, three times as wide as it is tall.
  p: {
    profile: [[19.5, 87], [20.5, 84], [20.5, 79], [18.5, 75], [14, 72.5], [8, 72], [0, 72]],
    grooves: [80],
  },
};

/** Ma: carved, not turned — a horse's head and neck facing right, on the same foot as the rest. */
const MA_BODY =
  'M33.7 87.0 C32.8 79.3 33.7 72.4 36.3 66.4 C32.0 58.7 31.1 49.2 35.4 40.6 C38.8 32.9 44.8 25.2 51.7 21.7 C55.2 20.0 58.6 19.2 61.2 20.0 L59.4 14.0 L68.9 20.0 ' +
  'C73.2 24.3 74.0 32.0 70.6 38.0 C68.0 42.3 62.9 44.9 61.2 49.2 C59.4 53.5 60.3 58.7 62.0 63.8 C63.7 70.7 66.3 79.3 66.3 87.0 Z';

function MaDetails({ p }: { p: Palette }): ReactNode {
  return (
    <>
      {/* Muzzle, eye and nostril, the mane ridge down the back of the neck, and the cut of the jaw. */}
      <path d="M69.8 33.8 C74.0 34.6 75.8 38.9 73.2 42.3 C70.6 44.9 66.3 44.9 63.7 43.2" fill={p.shade} stroke={p.edge} strokeWidth="2" strokeLinejoin="round" />
      <circle cx="59.4" cy="32.0" r="2.8" fill={p.edge} stroke="none" />
      <path d="M72.3 38.9 C74.0 38.9 74.9 38.0 74.9 37.2" stroke={p.edge} strokeWidth="1.6" fill="none" />
      <path d="M41.4 30.3 C36.3 38.9 35.4 49.2 38.8 58.7" stroke={p.deep} strokeWidth="2.4" fill="none" opacity="0.75" />
      <path d="M48.3 24.3 C43.1 32.0 41.4 41.5 43.1 50.9" stroke={p.deep} strokeWidth="1.8" fill="none" opacity="0.45" />
      <path d="M56.0 44.1 C59.4 46.6 63.7 47.5 67.2 45.8" stroke={p.deep} strokeWidth="2" fill="none" opacity="0.6" />
    </>
  );
}

/** A promoted Bia is the puck turned over: the hollowed underside and its turning rings face up. */
function FlippedBia({ palette, id }: { palette: Palette; id: string }) {
  const { profile } = TRADITIONAL_PROFILES.p;
  return (
    <>
      <path d={turned(profile)} fill={`url(#${id}-wood)`} stroke={palette.edge} strokeWidth="2.2" strokeLinejoin="round" />
      <path d={turned(profile)} fill={`url(#${id}-depth)`} stroke="none" />
      <ellipse cx="50" cy="65" rx="13" ry="4.2" fill={palette.deep} stroke={palette.edge} strokeWidth="2" />
      <ellipse cx="50" cy="65.4" rx="8" ry="2.6" fill={palette.shade} stroke="none" />
      <ellipse cx="50" cy="65.4" rx="3.4" ry="1.1" fill={palette.mark} stroke="none" />
    </>
  );
}

export function TraditionalPiece({ piece, className }: { piece: Piece; className?: string }) {
  const palette = TRADITIONAL_PALETTE[piece.color];
  // React ids contain ':' — invalid in a CSS url() reference, so strip it for the gradient ids.
  const id = `mk-trad-${useId().replaceAll(':', '')}`;
  const turnedShape = piece.type === 'n' ? undefined : TRADITIONAL_PROFILES[piece.type];

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden focusable="false" data-set="traditional" data-type={piece.promoted ? 'p~' : piece.type}>
      <defs>
        {/* A turned body is round: dark rim, a highlight left of the axis, then the shaded far side. */}
        <linearGradient id={`${id}-wood`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor={palette.deep} />
          <stop offset="0.14" stopColor={palette.shade} />
          <stop offset="0.36" stopColor={palette.light} />
          <stop offset="0.66" stopColor={palette.body} />
          <stop offset="0.9" stopColor={palette.shade} />
          <stop offset="1" stopColor={palette.deep} />
        </linearGradient>
        {/* Wood is darker where it meets the board and where the light does not reach. */}
        <linearGradient id={`${id}-depth`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={palette.light} stopOpacity="0.35" />
          <stop offset="0.45" stopColor={palette.light} stopOpacity="0" />
          <stop offset="1" stopColor={palette.edge} stopOpacity="0.4" />
        </linearGradient>
      </defs>

      {/* The set keeps the real proportions but is scaled up around the ground line to fill the square. */}
      <g transform="translate(50 87) scale(1.12) translate(-50 -87)">
        {/* The piece stands on the square, lit from the left. */}
        <ellipse cx="54" cy="88" rx="28" ry="4.6" fill={palette.edge} opacity="0.26" />

        {piece.promoted ? (
          <FlippedBia palette={palette} id={id} />
        ) : turnedShape ? (
          <g stroke={palette.edge} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
            <path d={turned(turnedShape.profile)} fill={`url(#${id}-wood)`} />
            <path d={turned(turnedShape.profile)} fill={`url(#${id}-depth)`} stroke="none" />
            {turnedShape.grooves.map((y) => {
              const w = widthAt(turnedShape.profile, y) - 0.8;
              return (
                <g key={y}>
                  {/* A groove cut round the body, with the lit edge just below it. */}
                  <path d={`M${50 - w} ${y} Q50 ${y + 3.4} ${50 + w} ${y}`} stroke={palette.deep} strokeWidth="1.8" fill="none" opacity="0.8" />
                  <path d={`M${50 - w + 1.5} ${y + 2.2} Q50 ${y + 5.2} ${50 + w - 1.5} ${y + 2.2}`} stroke={palette.light} strokeWidth="1.4" fill="none" opacity="0.5" />
                </g>
              );
            })}
          </g>
        ) : (
          <g stroke={palette.edge} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
            <path d={MA_BODY} fill={`url(#${id}-wood)`} />
            <path d={MA_BODY} fill={`url(#${id}-depth)`} stroke="none" />
            <MaDetails p={palette} />
          </g>
        )}
      </g>
    </svg>
  );
}
