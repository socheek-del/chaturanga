import type { Color, GameStatus } from '@chaturanga/rules-core';
import type { Game } from '@chaturanga/arimaa';

const WIN = 1_000_000;
const VALUE = { r: 400, c: 260, d: 390, h: 620, m: 900, e: 1_300 } as const;
const STRENGTH = { r: 1, c: 2, d: 3, h: 4, m: 5, e: 6 } as const;
const TRAPS = [18, 21, 42, 45] as const;

const fileOf = (square: number): number => square % 8;
const rankOf = (square: number): number => Math.floor(square / 8);
const distanceOne = (left: number, right: number): boolean =>
  Math.abs(fileOf(left) - fileOf(right)) + Math.abs(rankOf(left) - rankOf(right)) === 1;
const signFor = (color: Color, perspective: Color): number => (color === perspective ? 1 : -1);

function terminalScore(status: GameStatus<Color>, perspective: Color): number | null {
  if (status.kind === 'ongoing') return null;
  if (!('winner' in status) || !status.winner) return 0;
  return status.winner === perspective ? WIN : -WIN;
}

/** Static Arimaa evaluation from one player's point of view, in centipawn-like units. */
export function evaluatePosition(game: Game, perspective: Color): number {
  const finished = terminalScore(game.status(), perspective);
  if (finished !== null) return finished;

  const pieces = game.pieces();
  let score = 0;
  for (const { square, piece } of pieces) {
    const sign = signFor(piece.color, perspective);
    const rank = rankOf(square);
    const advance = piece.color === 'w' ? rank : 7 - rank;
    const value = VALUE[piece.type];
    score += sign * value;

    if (piece.type === 'r') {
      score += sign * advance * 38;
      if (advance >= 6) score += sign * 900;
    } else {
      // Strong pieces benefit slightly from central access; weaker pieces are more valuable as trap guards.
      score += sign * (3.5 - Math.abs(fileOf(square) - 3.5)) * (piece.type === 'e' || piece.type === 'm' ? 10 : 4);
    }

    const frozen = pieces.some(
      (other) =>
        other.piece.color !== piece.color &&
        STRENGTH[other.piece.type] > STRENGTH[piece.type] &&
        distanceOne(square, other.square),
    ) && !pieces.some((other) => other.piece.color === piece.color && distanceOne(square, other.square));
    if (frozen) score -= sign * Math.round(value * 0.18);
  }

  for (const color of ['w', 'b'] as const) {
    const sign = signFor(color, perspective);
    const hand = game.hand(color);
    for (const type of hand) score += sign * VALUE[type];

    // Protecting a trap with a nearby friendly piece supports future captures and prevents accidental loss.
    for (const trap of TRAPS) {
      if (pieces.some(({ square, piece }) => piece.color === color && distanceOne(square, trap))) score += sign * 18;
    }
  }

  return score;
}
