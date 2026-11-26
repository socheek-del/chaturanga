import type { Color, Square } from '@chaturanga/rules-core';

export const FILES = 19;
export const RANKS = 19;
export const BOARD_SIZE = FILES * RANKS;
export const FILE_NAMES = 'abcdefghijklmnopqrs';

export const BASE_PIECE_TYPES = [
  'general', 'clerk', 'staff-officer', 'aide-de-camp', 'sumo', 'aide', 'staff', 'chief-of-staff',
  'engineer', 'taoist-priest', 'spiritual-monk', 'advance-guard', 'middle-troop', 'drum', 'banner',
  'sentry', 'millenary', 'quartermaster', 'centuria', 'rear-guard', 'frankish-cannon', 'elephant',
  'longbow', 'crossbow', 'cannon', 'cavalryman', 'cavalry', 'pawn', 'patrol-unit', 'shield',
  'shield-unit', 'chariot', 'chariot-unit', 'vanguard',
] as const;

export const PROMOTED_PIECE_TYPES = [
  'master-at-arms', 'banner-and-drum', 'town-brigade', 'village-brigade', 'vice-commander', 'poison-flame',
  'five-li-fog', 'immaculate-light', 'skyward-net', 'governor', 'thunderclap', 'flag-waver',
  'dragon-ascending', 'tiger-wing', 'war-hawk', 'earthward-net', 'chariot-of-the-gods',
  'longbow-cavalryman', 'crossbow-cavalryman', 'gun-carriage', 'winged-horse', 'commissar',
  'heavenly-fortress',
] as const;

export type PieceType = (typeof BASE_PIECE_TYPES)[number] | (typeof PROMOTED_PIECE_TYPES)[number];
export const PIECE_TYPES = [...new Set<PieceType>([...BASE_PIECE_TYPES, ...PROMOTED_PIECE_TYPES])];

export const PROMOTION_OF: Partial<Readonly<Record<PieceType, PieceType>>> = {
  clerk: 'master-at-arms',
  'staff-officer': 'banner-and-drum',
  'aide-de-camp': 'quartermaster',
  aide: 'town-brigade',
  staff: 'village-brigade',
  'chief-of-staff': 'vice-commander',
  engineer: 'poison-flame',
  'taoist-priest': 'five-li-fog',
  'spiritual-monk': 'immaculate-light',
  'advance-guard': 'skyward-net',
  'middle-troop': 'governor',
  drum: 'thunderclap',
  banner: 'flag-waver',
  sentry: 'centuria',
  millenary: 'dragon-ascending',
  quartermaster: 'tiger-wing',
  centuria: 'war-hawk',
  'rear-guard': 'earthward-net',
  'frankish-cannon': 'chariot-of-the-gods',
  longbow: 'longbow-cavalryman',
  crossbow: 'crossbow-cavalryman',
  cannon: 'gun-carriage',
  cavalryman: 'cavalry',
  cavalry: 'winged-horse',
  pawn: 'patrol-unit',
  'patrol-unit': 'commissar',
  shield: 'shield-unit',
  'shield-unit': 'heavenly-fortress',
  chariot: 'chariot-unit',
  'chariot-unit': 'millenary',
  vanguard: 'commissar',
};

export interface StartingPiece {
  readonly square: Square;
  readonly color: Color;
  readonly type: PieceType;
}

const at = (file: number, rank: number): Square => (rank - 1) * FILES + file;

function centerOutRow(rank: number, center: PieceType, pairs: Readonly<Record<number, readonly [PieceType, PieceType] | PieceType>>): StartingPiece[] {
  const result: StartingPiece[] = [{ square: at(9, rank), color: 'w', type: center }];
  for (let offset = 1; offset <= 9; offset++) {
    const entry = pairs[offset];
    if (!entry) continue;
    const [left, right] = typeof entry === 'string' ? [entry, entry] : entry;
    result.push({ square: at(9 - offset, rank), color: 'w', type: left });
    result.push({ square: at(9 + offset, rank), color: 'w', type: right });
  }
  return result;
}

const WHITE_START: StartingPiece[] = [
  ...centerOutRow(7, 'general', {
    1: ['staff-officer', 'clerk'], 2: 'aide-de-camp', 3: 'sumo', 4: 'aide', 5: 'staff',
    6: 'chief-of-staff', 7: 'engineer', 8: ['taoist-priest', 'spiritual-monk'], 9: 'advance-guard',
  }),
  ...centerOutRow(6, 'middle-troop', {
    1: ['banner', 'drum'], 2: 'sentry', 4: 'millenary', 6: 'quartermaster', 8: 'centuria', 9: 'rear-guard',
  }),
  ...centerOutRow(5, 'frankish-cannon', {
    1: 'elephant', 2: 'longbow', 3: 'crossbow', 4: 'cannon', 5: 'elephant',
    6: 'longbow', 7: 'crossbow', 8: 'cannon', 9: 'elephant',
  }),
  ...centerOutRow(4, 'vanguard', { 1: 'cavalryman', 3: 'cavalryman', 5: 'cavalryman', 7: 'cavalryman', 9: 'cavalry' }),
  ...centerOutRow(3, 'patrol-unit', { 2: 'pawn', 4: 'pawn', 6: 'pawn', 8: 'patrol-unit' }),
  ...centerOutRow(2, 'shield-unit', {
    1: 'chariot', 2: 'shield', 3: 'chariot', 4: 'shield', 5: 'chariot', 6: 'shield',
    7: 'chariot', 8: 'shield-unit', 9: 'chariot-unit',
  }),
  { square: at(9, 1), color: 'w', type: 'vanguard' },
];

// Rank 4 has a blank center; replace its temporary center placeholder with no piece.
WHITE_START.splice(WHITE_START.findIndex(({ square }) => square === at(9, 4)), 1);

export const STARTING_PIECES: readonly StartingPiece[] = WHITE_START;

export function coordinateOf(square: Square): { file: number; rank: number } {
  return { file: square % FILES, rank: Math.floor(square / FILES) + 1 };
}

export function squareName(square: Square): string {
  const { file, rank } = coordinateOf(square);
  return `${FILE_NAMES[file]}${rank}`;
}

export function squareOf(name: string): Square | null {
  const match = /^([a-s])(1[0-9]|[1-9])$/.exec(name);
  if (!match) return null;
  const file = FILE_NAMES.indexOf(match[1]!);
  const rank = Number(match[2]);
  return (rank - 1) * FILES + file;
}

export const opposite = (color: Color): Color => color === 'w' ? 'b' : 'w';
