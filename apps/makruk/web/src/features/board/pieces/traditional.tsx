import type { Piece } from '@chaturanga/makruk';
import { type ReactNode, useId } from 'react';

/**
 * art-003: "traditional wood" set — the pieces of a physical Thai set, drawn the way a real set reads on a
 * board: flat carved silhouettes, not shaded 3D objects.
 *
 * Shapes and sizes are measured from the traditional set the owner chose as the reference (percentages of a
 * square): Khun 50x81, Ma 50x81, Khon 41x70, Met 28x48, Ruea 66x50 — the widest and lowest piece — and the
 * Bia a 53-wide disc of concentric turning rings, because a Bia lies on the board and is seen from above.
 * Khun, Met and Khon are turned urns on a stepped plinth under a spire; Ruea is a broad low pot with a
 * small knob; Ma is carved.
 *
 * A promoted Bia (Bia Ngai) is the same disc turned over, with the Met's spire cut into the middle.
 * Drawn on a 100x100 grid. The turned pieces stand on y = 92.
 */
export const TRADITIONAL_PALETTE = {
  // Bone-pale wood with a carved dark line, the way the light side of a Thai set reads on a board.
  w: { fill: '#f7e7c3', line: '#2f1d0c', detail: '#2f1d0c' },
  // The dark side is near-black; its carved lines are pale so it still reads on a dark board.
  b: { fill: '#241a13', line: '#c9a86f', detail: '#c9a86f' },
} as const;

type Palette = (typeof TRADITIONAL_PALETTE)[keyof typeof TRADITIONAL_PALETTE];

/** A lathe profile: [half-width, y] from the plinth upwards. x = 50 is the axis. */
type Profile = readonly (readonly [number, number])[];

/**
 * Outline through the given points. A lathe cuts both sharp steps and soft curves, so a vertex that turns
 * hard (a plinth edge, a collar) stays a corner and a gentle one is rounded.
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
    if (turn > 0.75) {
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

interface Turned {
  /** Lathe profile, plinth first. */
  profile: Profile;
  /** Lines cut across the body: [y, half-width]. */
  lines: readonly (readonly [number, number])[];
}

/** The four turned pieces, at the reference set's sizes. (The Bia is a disc and the Ma is carved.) */
export const TRADITIONAL_PROFILES: Record<'k' | 'm' | 's' | 'r', Turned> = {
  // Khun: 50 wide, 81 tall — a two-step plinth, a bulging body and a long spire.
  k: {
    profile: [
      [25, 92], [25, 86], [19.5, 85], [19.5, 81], [10, 79.5], [9, 76], [11, 73], [17, 68.5],
      [22.5, 63], [24.5, 57], [24, 51], [20.5, 45.5], [15, 41], [8.5, 38], [13, 35], [12.5, 33],
      [6, 30.5], [8, 26], [4, 21], [2, 15], [0, 9],
    ],
    lines: [[86, 24], [81, 19], [57, 24], [50.5, 23], [33.5, 12]],
  },
  // Met: 28 wide, 48 tall — the smallest turned piece.
  m: {
    profile: [
      [14, 92], [14, 88], [11, 87], [11, 84], [5.5, 82.5], [5, 80], [6.5, 77.5], [10, 73.5],
      [13.5, 69], [14, 65], [13, 61], [10, 57.5], [5, 55], [8, 52.5], [7.5, 51], [3.5, 49],
      [4.5, 47], [0, 43],
    ],
    lines: [[88, 13], [84, 10.5], [65, 13.5], [51, 7]],
  },
  // Khon: 41 wide, 70 tall — the Khun's turning at three quarters the size, with a shorter spire.
  s: {
    profile: [
      [20.5, 92], [20.5, 87], [16, 86], [16, 82.5], [8, 81], [7.5, 78], [9.5, 75], [14, 70.5],
      [18.5, 66], [20.5, 61], [20, 56], [17, 51], [12, 47], [6.5, 44.5], [10.5, 42], [10, 40],
      [5, 38], [6.5, 34], [3, 29], [1.5, 25], [0, 22],
    ],
    lines: [[87, 19.5], [82.5, 15.5], [61, 20], [55, 19], [40.5, 9.5]],
  },
  // Ruea: 66 wide, 50 tall — the widest and lowest piece, a broad pot with a small knob.
  r: {
    profile: [
      [23.5, 92], [23.5, 88], [28, 86.5], [31.5, 83], [33, 78], [32.5, 73], [30, 68.5],
      [26.5, 65], [19, 63.5], [19, 60], [9, 58], [8.5, 55], [13, 52], [12.5, 50], [6, 47],
      [4.5, 44], [0, 41],
    ],
    lines: [[88, 25], [78, 32], [69, 28.5], [63.5, 18.5], [50.5, 11]],
  },
};

/** Ma: carved, not turned — a horse's head and neck facing right on a plinth. 50 wide, 81 tall. */
const MA_BODY =
  'M26 92 H74 V88 H70 C70 82 68 75 66 69 C64 63 63 57 65 52 C67 46 73 42 76 36 C80 28 78 19 73 14 ' +
  'L61 7 L63 16 C60 15 56 16 52 18 C44 22 37 30 33 39 C29 48 30 58 35 66 C32 73 31 81 31 88 H26 Z';

function MaDetails({ p }: { p: Palette }): ReactNode {
  return (
    <>
      {/* Ear, eye, nostril, cheek, the mane down the back of the neck, and the line above the plinth. */}
      <path d="M61 7 L63 16" stroke={p.detail} strokeWidth="2.4" fill="none" />
      <circle cx="63" cy="25" r="2.6" fill={p.detail} stroke="none" />
      <path d="M74 30 C77 31 78 29 77 27" stroke={p.detail} strokeWidth="2" fill="none" />
      <path d="M56 22 C48 30 43 41 45 53" stroke={p.detail} strokeWidth="2.2" fill="none" />
      <path d="M49 21 C42 29 38 40 40 52" stroke={p.detail} strokeWidth="1.8" fill="none" opacity="0.7" />
      <path d="M59 44 C64 47 69 47 73 44" stroke={p.detail} strokeWidth="2" fill="none" />
      <path d="M31 88 H70" stroke={p.detail} strokeWidth="2.2" fill="none" />
    </>
  );
}

/** Bia: a cowrie lies on the board, so it is drawn from above — a disc of concentric turning rings. */
const BIA_RINGS = [26.5, 21, 16, 11, 6] as const;

function Bia({ palette, promoted }: { palette: Palette; promoted: boolean }) {
  return (
    <g stroke={palette.line} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round">
      <circle cx="50" cy="50" r={BIA_RINGS[0]} fill={palette.fill} />
      {BIA_RINGS.slice(1, promoted ? 2 : undefined).map((r) => (
        <circle key={r} cx="50" cy="50" r={r} fill="none" stroke={palette.detail} strokeWidth="2.2" />
      ))}
      {/* A promoted Bia is turned over: the Met's spire is cut into the middle, so it out-ranks a Bia. */}
      {promoted && (
        <>
          <circle cx="50" cy="50" r="15" fill={palette.detail} stroke="none" />
          <path d="M50 36 L54.5 46 L59 50 L54.5 54 L50 64 L45.5 54 L41 50 L45.5 46 Z" fill={palette.fill} stroke="none" />
        </>
      )}
    </g>
  );
}

export function TraditionalPiece({ piece, className }: { piece: Piece; className?: string }) {
  const palette = TRADITIONAL_PALETTE[piece.color];
  // React ids contain ':' — invalid in a CSS url() reference, so strip it for the clip-path id.
  const id = `mk-trad-${useId().replaceAll(':', '')}`;
  const type = piece.promoted ? 'p' : piece.type;
  const shape = type === 'k' || type === 'm' || type === 's' || type === 'r' ? TRADITIONAL_PROFILES[type] : undefined;

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden focusable="false" data-set="traditional" data-type={piece.promoted ? 'p~' : piece.type}>
      {type === 'p' ? (
        <Bia palette={palette} promoted={piece.promoted} />
      ) : shape ? (
        <g stroke={palette.line} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round">
          <clipPath id={`${id}-body`}>
            <path d={turned(shape.profile)} />
          </clipPath>
          <path d={turned(shape.profile)} fill={palette.fill} />
          {/* The turning lines stop at the silhouette, so they read as cuts in the wood. */}
          <g clipPath={`url(#${id}-body)`} stroke={palette.detail} strokeWidth="2.2">
            {shape.lines.map(([y, w]) => (
              <path key={`${y}-${w}`} d={`M${50 - w} ${y} H${50 + w}`} />
            ))}
          </g>
        </g>
      ) : (
        <g stroke={palette.line} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round">
          <path d={MA_BODY} fill={palette.fill} />
          <MaDetails p={palette} />
        </g>
      )}
    </svg>
  );
}
