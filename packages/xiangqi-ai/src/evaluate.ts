import {
  ADVISOR,
  BLACK,
  type Board,
  CANNON,
  CHARIOT,
  type ColorIndex,
  ELEPHANT,
  fileOf,
  GENERAL,
  HORSE,
  RAYS,
  rankOf,
  SIZE,
  SOLDIER,
  TYPE_MASK,
} from '@chaturanga/xiangqi/core';

/** Base material in centipawns, indexed by piece type: -, Soldier, Horse, Elephant, Advisor, Cannon, Chariot, General. */
export const PIECE_VALUE = [0, 100, 400, 200, 200, 450, 900, 0] as const;

/** Heavy material (chariots, horses, cannons of both sides) at the start: 2 x (1800 + 800 + 900). */
const OPENING_HEAVY = 7000;
/** A crossed soldier is worth about twice an uncrossed one. */
const SOLDIER_CROSSED = 90;
/** Chariot bonus per empty point it sees. */
const CHARIOT_MOBILITY = 3;
const MISSING_ADVISOR = 30;
const MISSING_ELEPHANT = 20;
/** Endgame bonus per missing defender for the side that is clearly ahead. */
const TRADE_DOWN = 40;

interface Tally {
  material: [number, number];
  /** Chariots, horses and cannons: the pieces that can attack across the river. */
  attackers: [number, number];
  heavy: number;
  advisors: [number, number];
  elephants: [number, number];
  pieces: [number, number];
  generals: [number, number];
}

function tally(board: Board): Tally {
  const t: Tally = {
    material: [0, 0],
    attackers: [0, 0],
    heavy: 0,
    advisors: [0, 0],
    elephants: [0, 0],
    pieces: [0, 0],
    generals: [-1, -1],
  };
  for (let sq = 0; sq < SIZE; sq++) {
    const p = board[sq]!;
    if (!p) continue;
    const c = p & BLACK ? 1 : 0;
    const type = p & TYPE_MASK;
    t.pieces[c]++;
    t.material[c] += PIECE_VALUE[type]!;
    if (type === CHARIOT || type === HORSE || type === CANNON) {
      t.attackers[c]++;
      t.heavy += PIECE_VALUE[type]!;
    }
    if (type === ADVISOR) t.advisors[c]++;
    if (type === ELEPHANT) t.elephants[c]++;
    if (type === GENERAL) t.generals[c] = sq;
  }
  return t;
}

/** Pure material difference (centipawns) from `side`'s point of view. */
export function materialBalance(board: Board, side: ColorIndex): number {
  const t = tally(board);
  const diff = t.material[0] - t.material[1];
  return side === 0 ? diff : -diff;
}

const relRank = (c: ColorIndex, sq: number): number => (c === 0 ? rankOf(sq) : 9 - rankOf(sq));

/**
 * Static evaluation in centipawns from the point of view of `side` (0 = Red, 1 = Black): material with
 * crossed-soldier and endgame horse/cannon adjustments, piece activity (chariot mobility, horse centrality,
 * central cannons), the general's advisor/elephant cover, and an endgame mop-up so a winning side presses the
 * enemy general before the 50-move rule. Stalemate wins in Xiangqi, so the search needs no special case.
 */
export function evaluate(board: Board, side: ColorIndex): number {
  // One pass: material and tallies, plus the phase-independent placement terms and the counts the
  // phase-dependent terms need.
  const t: Tally = {
    material: [0, 0],
    attackers: [0, 0],
    heavy: 0,
    advisors: [0, 0],
    elephants: [0, 0],
    pieces: [0, 0],
    generals: [-1, -1],
  };
  const placement: [number, number] = [0, 0];
  const horses: [number, number] = [0, 0];
  const cannons: [number, number] = [0, 0];
  const centralCannons: [number, number] = [0, 0];
  const generalRank: [number, number] = [0, 0];

  for (let sq = 0; sq < SIZE; sq++) {
    const p = board[sq]!;
    if (!p) continue;
    const c: ColorIndex = p & BLACK ? 1 : 0;
    const type = p & TYPE_MASK;
    t.pieces[c]++;
    t.material[c] += PIECE_VALUE[type]!;
    const rank = c === 0 ? rankOf(sq) : 9 - rankOf(sq);
    const file = fileOf(sq);
    const central = 4 - Math.abs(file - 4); // 0 (edge) .. 4 (e-file)
    switch (type) {
      case SOLDIER:
        if (rank >= 5) {
          placement[c] += SOLDIER_CROSSED;
          if (rank <= 7) placement[c] += central >= 3 ? 30 : 10; // near the palace
          if (rank === 9) placement[c] -= 40; // on the last rank a soldier can only move sideways
        } else if (rank === 4 && central === 4) {
          placement[c] += 10;
        }
        break;
      case HORSE:
        t.attackers[c]++;
        t.heavy += PIECE_VALUE[HORSE];
        horses[c]++;
        placement[c] += central * 6 - 12 + (rank >= 5 && rank <= 7 ? 20 : 0) + (rank === 0 ? -15 : 0);
        break;
      case CANNON:
        t.attackers[c]++;
        t.heavy += PIECE_VALUE[CANNON];
        cannons[c]++;
        if (file === 4) centralCannons[c]++;
        break;
      case CHARIOT: {
        t.attackers[c]++;
        t.heavy += PIECE_VALUE[CHARIOT];
        let seen = 0;
        for (const ray of RAYS[sq]!) {
          for (const s of ray) {
            if (board[s]) break;
            seen++;
          }
        }
        placement[c] += seen * CHARIOT_MOBILITY + (rank >= 5 ? 10 : 0);
        break;
      }
      case ADVISOR:
        t.advisors[c]++;
        break;
      case ELEPHANT:
        t.elephants[c]++;
        break;
      case GENERAL:
        t.generals[c] = sq;
        generalRank[c] = rank;
        break;
    }
  }

  // 1 in the opening, falling to 0 as chariots, horses and cannons come off.
  const phase = Math.min(t.heavy / OPENING_HEAVY, 1);
  const score: [number, number] = [0, 0];
  for (const c of [0, 1] as const) {
    score[c] =
      t.material[c] +
      placement[c] +
      Math.round(
        horses[c] * (1 - phase) * 40 - // horses gain value as the board empties
          cannons[c] * (1 - phase) * 60 + // cannons lose their screens
          centralCannons[c] * 25 * phase -
          12 * generalRank[c] * phase,
      );
  }

  // Defence: missing advisors and elephants matter when the other side can still attack.
  for (const c of [0, 1] as const) {
    const enemy = c === 0 ? 1 : 0;
    const threat = Math.min(t.attackers[enemy], 3) / 3;
    score[c] -= Math.round(threat * ((2 - t.advisors[c]) * MISSING_ADVISOR + (2 - t.elephants[c]) * MISSING_ELEPHANT));
  }

  const diff = t.material[0] - t.material[1];
  if (phase < 0.45 && Math.abs(diff) >= 300 && t.generals[0] >= 0 && t.generals[1] >= 0) {
    const strong: ColorIndex = diff > 0 ? 0 : 1;
    const weak: ColorIndex = strong === 0 ? 1 : 0;
    const target = t.generals[weak];
    let pressure = 0;
    for (let sq = 0; sq < SIZE; sq++) {
      const p = board[sq]!;
      if (!p || (p & BLACK ? 1 : 0) !== strong) continue;
      const type = p & TYPE_MASK;
      if (type === SOLDIER || type === HORSE || type === CHARIOT || type === CANNON) {
        const gap = Math.abs(fileOf(sq) - fileOf(target)) + Math.abs(rankOf(sq) - rankOf(target));
        pressure += Math.max(12 - gap, 0) * (type === SOLDIER ? 3 : 5);
      }
    }
    // An exposed general (off its home point) is easier to mate.
    const exposure = Math.abs(fileOf(target) - 4) + relRank(weak, target);
    score[strong] += pressure + exposure * 15 + (16 - t.pieces[weak]) * TRADE_DOWN;
  }

  const red = score[0] - score[1];
  return side === 0 ? red : -red;
}
