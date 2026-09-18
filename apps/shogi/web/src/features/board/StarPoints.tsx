import type { BoardTheme } from './themes';

const FILES = 9;
const RANKS = 9;
/** The four dots where the promotion zones meet, at the corners of cells 3/4 and 6/7. */
const STARS: ReadonlyArray<readonly [number, number]> = [
  [3, 3],
  [6, 3],
  [3, 6],
  [6, 6],
];

/** The dots (星) printed on a Shogi board, drawn under the pieces. */
export function StarPoints({ theme }: { theme: BoardTheme }) {
  return (
    <svg viewBox={`0 0 ${FILES} ${RANKS}`} className="h-full w-full" aria-hidden preserveAspectRatio="none">
      {STARS.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={0.07} fill={theme.grain} />
      ))}
    </svg>
  );
}
