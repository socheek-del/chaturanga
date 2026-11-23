import {
  ADVISOR,
  BLACK,
  type Board,
  CANNON,
  CHARIOT,
  type ColorIndex,
  ELEPHANT,
  ELEPHANT_TARGETS,
  fileOf,
  GENERAL,
  HORSE,
  HORSE_TARGETS,
  RAYS,
  rankOf,
  SIZE,
  SOLDIER,
  TYPE_MASK,
} from '@chaturanga/janggi/core';

/**
 * Base material: a hundred per Janggi point, which is also how an undecided game is scored. Indexed by piece
 * type: -, Soldier, Horse, Elephant, Advisor, Cannon, Chariot, General.
 */
export const PIECE_VALUE = [0, 200, 500, 300, 300, 700, 1300, 0] as const;

/** Chariots, horses, elephants and cannons of both sides at the start: 2 x (2600 + 1000 + 600 + 1400). */
const OPENING_HEAVY = 11_200;
const CHARIOT_MOBILITY = 4;
const LEAPER_MOBILITY = 8;
const MISSING_ADVISOR = 60;
/** Endgame bonus per missing defender for the side that is clearly ahead. */
const TRADE_DOWN = 40;

/** Pure material difference (centipoints) from `side`'s point of view. */
export function materialBalance(board: Board, side: ColorIndex): number {
  let diff = 0;
  for (const p of board) if (p) diff += (p & BLACK ? -1 : 1) * PIECE_VALUE[p & TYPE_MASK]!;
  return side === 0 ? diff : -diff;
}

/**
 * Static evaluation from the point of view of `side` (0 = Cho, 1 = Han): the points on the board, adjusted for
 * activity (chariot and leaper mobility, cannons with something to jump, linked and advanced soldiers), the
 * general's advisors, and an endgame mop-up so a winning side presses the enemy general.
 */
export function evaluate(board: Board, side: ColorIndex): number {
  const material: [number, number] = [0, 0];
  const placement: [number, number] = [0, 0];
  const attackers: [number, number] = [0, 0];
  const advisors: [number, number] = [0, 0];
  const pieces: [number, number] = [0, 0];
  const generals: [number, number] = [-1, -1];
  const cannons: [number, number] = [0, 0];
  let heavy = 0;

  for (let sq = 0; sq < SIZE; sq++) {
    const p = board[sq]!;
    if (!p) continue;
    const c: ColorIndex = p & BLACK ? 1 : 0;
    const type = p & TYPE_MASK;
    pieces[c]++;
    material[c] += PIECE_VALUE[type]!;
    const rank = c === 0 ? rankOf(sq) : 9 - rankOf(sq);
    const file = fileOf(sq);
    const central = 4 - Math.abs(file - 4); // 0 (edge) .. 4 (e-file)
    if (type === CHARIOT || type === CANNON || type === HORSE || type === ELEPHANT) {
      attackers[c]++;
      heavy += PIECE_VALUE[type]!;
    }
    switch (type) {
      case SOLDIER:
        // Two soldiers side by side defend each other.
        if (file < 8 && board[sq + 1] === p) placement[c] += 25;
        if (rank >= 5 && rank <= 8) placement[c] += 10 + central * 8;
        if (rank === 9) placement[c] -= 60;
        break;
      case HORSE:
        for (const { leg } of HORSE_TARGETS[sq]!) if (board[leg] === 0) placement[c] += LEAPER_MOBILITY / 2;
        placement[c] += central * 6 + (rank >= 5 && rank <= 7 ? 20 : 0);
        break;
      case ELEPHANT:
        for (const { first, second } of ELEPHANT_TARGETS[sq]!) {
          if (board[first] === 0 && board[second] === 0) placement[c] += LEAPER_MOBILITY / 2;
        }
        placement[c] += central * 3;
        break;
      case CANNON:
        cannons[c]++;
        if (file === 4 && rank <= 2) placement[c] += 25; // behind the general: the classic defence
        for (const ray of RAYS[sq]!) {
          const screen = ray.find((s) => board[s] !== 0);
          if (screen !== undefined && (board[screen]! & TYPE_MASK) !== CANNON) placement[c] += 8;
        }
        break;
      case CHARIOT:
        for (const ray of RAYS[sq]!) {
          for (const s of ray) {
            if (board[s]) break;
            placement[c] += CHARIOT_MOBILITY;
          }
        }
        break;
      case ADVISOR:
        advisors[c]++;
        break;
      case GENERAL:
        generals[c] = sq;
        // Deep in the palace is safer while the enemy still has pieces.
        placement[c] += rank === 0 ? 25 : rank === 1 ? 5 : -25;
        break;
    }
  }

  const phase = Math.min(heavy / OPENING_HEAVY, 1);
  const score: [number, number] = [0, 0];
  for (const c of [0, 1] as const) {
    const enemy = c === 0 ? 1 : 0;
    const threat = Math.min(attackers[enemy], 3) / 3;
    score[c] =
      material[c] +
      placement[c] -
      Math.round(cannons[c] * (1 - phase) * 80) - // cannons run out of screens
      Math.round(threat * (2 - advisors[c]) * MISSING_ADVISOR);
  }

  const diff = material[0] - material[1];
  if (phase < 0.45 && Math.abs(diff) >= 400 && generals[0] >= 0 && generals[1] >= 0) {
    const strong: ColorIndex = diff > 0 ? 0 : 1;
    const weak: ColorIndex = strong === 0 ? 1 : 0;
    const target = generals[weak];
    let pressure = 0;
    for (let sq = 0; sq < SIZE; sq++) {
      const p = board[sq]!;
      if (!p || (p & BLACK ? 1 : 0) !== strong) continue;
      const type = p & TYPE_MASK;
      if (type === GENERAL || type === ADVISOR) continue;
      const gap = Math.abs(fileOf(sq) - fileOf(target)) + Math.abs(rankOf(sq) - rankOf(target));
      pressure += Math.max(12 - gap, 0) * (type === SOLDIER ? 3 : 5);
    }
    score[strong] += pressure + (16 - pieces[weak]) * TRADE_DOWN;
  }

  const cho = score[0] - score[1];
  return side === 0 ? cho : -cho;
}
