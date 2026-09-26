import type { Color } from '@chaturanga/chess';
import type { Score } from './uci';

/** Centre of a square in a board drawn as an 8x8 SVG (`viewBox="0 0 8 8"`), seen from `orientation`. */
export function squareCenter(square: number, orientation: Color): { x: number; y: number } {
  const file = square % 8;
  const rank = Math.floor(square / 8);
  return orientation === 'w' ? { x: file + 0.5, y: 7 - rank + 0.5 } : { x: 7 - file + 0.5, y: rank + 0.5 };
}

/** Points of the evaluation graph: White's win percentage at each ply, White up. */
export function graphPoints(whiteWins: readonly number[], width: number, height: number): Array<{ x: number; y: number }> {
  const steps = Math.max(1, whiteWins.length - 1);
  return whiteWins.map((win, i) => ({ x: (i / steps) * width, y: height - (win / 100) * height }));
}

/** The ply a tap at `x` on a graph `width` wide lands on. */
export function plyAt(x: number, width: number, plies: number): number {
  if (plies <= 0 || width <= 0) return 0;
  return Math.max(0, Math.min(plies, Math.round((x / width) * plies)));
}

/** How much of the evaluation bar is White's, in percent, from White's win percentage. */
export function whiteShare(whiteWin: number): number {
  return Math.max(4, Math.min(96, whiteWin));
}

/** An engine score as players read it, from White's side: +0.35, −1.20, M3, −M2. */
export function formatScore(score: Score): string {
  if ('mate' in score) return `${score.mate < 0 ? '−' : ''}M${Math.abs(score.mate)}`;
  const pawns = score.cp / 100;
  return `${pawns > 0 ? '+' : pawns < 0 ? '−' : ''}${Math.abs(pawns).toFixed(2)}`;
}
