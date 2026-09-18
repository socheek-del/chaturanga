import type { BoardTheme } from './themes';

/**
 * The chequer, drawn under the pieces. The squares themselves are transparent (the board theme's `board`
 * colour), so this one SVG owns the light and dark pattern. A 180-degree flip maps the pattern onto itself,
 * so the same drawing is right for both orientations.
 */
export function Chequer({ theme }: { theme: BoardTheme }) {
  const squares = [];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      squares.push(
        <rect key={`${row}-${col}`} x={col} y={row} width={1} height={1} fill={(row + col) % 2 === 0 ? theme.light : theme.dark} />,
      );
    }
  }
  return (
    <svg viewBox="0 0 8 8" className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
      {squares}
    </svg>
  );
}
