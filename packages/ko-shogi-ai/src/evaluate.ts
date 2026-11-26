import type { Color } from '@chaturanga/rules-core';
import type { Game } from '@chaturanga/ko-shogi';
import type { PieceType } from '@chaturanga/ko-shogi';
import { commandOutcome } from '@chaturanga/ko-shogi';
import { MATE } from '@chaturanga/ai-core';

/** Relative values reflect command importance, ranged fire, mobility and promotion potential. */
export const PIECE_VALUE = {
  general: 30_000,
  clerk: 260,
  'staff-officer': 280,
  'aide-de-camp': 220,
  sumo: 460,
  aide: 190,
  staff: 190,
  'chief-of-staff': 280,
  engineer: 220,
  'taoist-priest': 420,
  'spiritual-monk': 440,
  'advance-guard': 210,
  'middle-troop': 13_000,
  drum: 2_400,
  banner: 2_800,
  sentry: 230,
  millenary: 1_250,
  quartermaster: 650,
  centuria: 850,
  'rear-guard': 220,
  'frankish-cannon': 1_150,
  elephant: 600,
  longbow: 680,
  crossbow: 800,
  cannon: 900,
  cavalryman: 440,
  cavalry: 800,
  pawn: 90,
  'patrol-unit': 230,
  shield: 200,
  'shield-unit': 480,
  chariot: 450,
  'chariot-unit': 800,
  vanguard: 280,
  'master-at-arms': 680,
  'banner-and-drum': 5_600,
  'town-brigade': 460,
  'village-brigade': 470,
  'vice-commander': 1_000,
  'poison-flame': 950,
  'five-li-fog': 1_050,
  'immaculate-light': 1_150,
  'skyward-net': 760,
  governor: 26_000,
  thunderclap: 750,
  'flag-waver': 720,
  'dragon-ascending': 1_800,
  'tiger-wing': 1_100,
  'war-hawk': 1_250,
  'earthward-net': 760,
  'chariot-of-the-gods': 1_900,
  'longbow-cavalryman': 900,
  'crossbow-cavalryman': 1_000,
  'gun-carriage': 1_250,
  'winged-horse': 1_350,
  commissar: 950,
  'heavenly-fortress': 1_100,
} satisfies Readonly<Record<PieceType, number>>;

function objectiveFlags(game: Game, color: Color): { general: boolean; governor: boolean; middle: boolean; banner: boolean } {
  let general = false;
  let governor = false;
  let middle = false;
  let banner = false;
  for (const { piece } of game.pieces()) {
    if (piece.color !== color) continue;
    if (piece.type === 'general') general = true;
    else if (piece.type === 'governor') governor = true;
    else if (piece.type === 'middle-troop') middle = true;
    if (piece.type === 'banner' || piece.type === 'banner-and-drum') banner = true;
  }
  return { general, governor, middle, banner };
}

/** Static material/advancement score from the side-to-move's point of view. */
export function evaluate(game: Game): number {
  const pieces = game.pieces();
  const board = pieces.reduce((result, { square, piece }) => {
    result[square] = piece;
    return result;
  }, Array.from({ length: 361 }, () => null) as Array<import('@chaturanga/rules-core').Piece<PieceType, Color> | null>);
  const outcome = commandOutcome(board);
  if (outcome === 'draw') return 0;
  if (outcome) return outcome === game.turn ? MATE : -MATE;

  let whiteScore = 0;
  for (const { square, piece } of pieces) {
    const rank = Math.floor(square / 19) + 1;
    const advance = piece.color === 'w' ? rank - 1 : 19 - rank;
    const file = square % 19;
    let value = PIECE_VALUE[piece.type];
    // Base forms retain a small camp-promotion option; a promoted piece cannot promote twice.
    if (!piece.promoted && ['clerk', 'staff-officer', 'aide-de-camp', 'aide', 'staff', 'chief-of-staff', 'engineer',
      'taoist-priest', 'spiritual-monk', 'advance-guard', 'middle-troop', 'drum', 'banner', 'sentry', 'millenary',
      'quartermaster', 'centuria', 'rear-guard', 'frankish-cannon', 'longbow', 'crossbow', 'cannon', 'cavalryman',
      'cavalry', 'pawn', 'patrol-unit', 'shield', 'shield-unit', 'chariot', 'chariot-unit', 'vanguard'].includes(piece.type)) value += 16;
    if (!['general', 'governor', 'middle-troop', 'banner', 'banner-and-drum'].includes(piece.type)) {
      value += Math.min(20, Math.max(0, advance)) * (piece.type === 'pawn' || piece.type === 'vanguard' ? 7 : 2);
      value += Math.max(0, 8 - Math.abs(file - 9)) * 3;
    }
    whiteScore += piece.color === 'w' ? value : -value;
  }

  // Preserve an extra commander as insurance and reward the Middle Troop/Banner fallback together.
  for (const color of ['w', 'b'] as const) {
    const flags = objectiveFlags(game, color);
    const bonus = (flags.general && flags.governor ? 2_000 : 0) + (flags.middle && flags.banner ? 1_000 : 0);
    whiteScore += color === 'w' ? bonus : -bonus;
  }
  return game.turn === 'w' ? whiteScore : -whiteScore;
}

export function terminalScore(game: Game): number | undefined {
  const pieces = game.pieces();
  const board = pieces.reduce((result, { square, piece }) => {
    result[square] = piece;
    return result;
  }, Array.from({ length: 361 }, () => null) as Array<import('@chaturanga/rules-core').Piece<PieceType, Color> | null>);
  const outcome = commandOutcome(board);
  if (outcome === 'draw') return 0;
  if (outcome) return outcome === game.turn ? MATE : -MATE;
  if (!game.hasAnyLegalAction()) return -MATE;
  return undefined;
}

export function repetitionScore(game: Game): number | undefined {
  const status = game.status();
  if (status.kind === 'ongoing') return undefined;
  if (status.kind === 'repetition') return 'winner' in status && status.winner
    ? (status.winner === game.turn ? MATE - 100 : -(MATE - 100))
    : 0;
  if (status.kind === 'perpetual-check') return status.winner === game.turn ? MATE - 100 : -(MATE - 100);
  return undefined;
}
