import {
  FenError,
  squareOf,
  type Color,
  type Piece as RulesPiece,
  type Square,
} from '@chaturanga/rules-core';
import {
  ALBERT_HALL,
  BOARD_SIZE,
  FILES,
  HOSPITAL,
  HOSPITAL_GROUNDS,
  HOUSE_OF_COMMONS,
  PRISON,
  PRISON_YARD,
  RANKS,
  POLICE_SETUP,
  SUFFRAGETTE_SETUP,
} from './layout';

export { FILES, RANKS, BOARD_SIZE };
export const PIECE_TYPES = ['l', 's', 'i', 'p'] as const;
export type PieceType = (typeof PIECE_TYPES)[number];
export type Piece = RulesPiece<PieceType>;
export type Board = Array<Piece | null>;

export interface Position {
  board: Board;
  turn: Color;
}

export const opposite = (color: Color): Color => color === 'w' ? 'b' : 'w';
export const fileOf = (target: Square): number => target % FILES;
export const rankOf = (target: Square): number => Math.floor(target / FILES);
export const onBoard = (file: number, rank: number): boolean =>
  Number.isInteger(file) && Number.isInteger(rank) && file >= 0 && file < FILES && rank >= 0 && rank < RANKS;
export const squareName = (target: Square): string => {
  const file = String.fromCharCode(97 + fileOf(target));
  return `${file}${rankOf(target) + 1}`;
};
export const square = (name: string): Square => {
  const target = squareOf(name, FILES);
  if (target === null || target < 0 || target >= BOARD_SIZE) throw new Error(`Not a Suffragetto square: ${name}`);
  return target;
};

function makePiece(color: Color, type: PieceType): Piece {
  return { color, type, promoted: false };
}

export function startingPosition(turn: Color = 'w'): Position {
  const board: Board = Array.from({ length: BOARD_SIZE }, () => null);
  for (const target of SUFFRAGETTE_SETUP.cells)
    board[target] = makePiece('w', SUFFRAGETTE_SETUP.large.includes(target) ? 'l' : 's');
  for (const target of POLICE_SETUP.cells)
    board[target] = makePiece('b', POLICE_SETUP.large.includes(target) ? 'i' : 'p');
  return { board, turn };
}

export function placementOf(board: Board): string {
  const rows: string[] = [];
  for (let rank = RANKS - 1; rank >= 0; rank--) {
    let row = '';
    let empty = 0;
    for (let file = 0; file < FILES; file++) {
      const piece = board[rank * FILES + file];
      if (!piece) {
        empty++;
        continue;
      }
      if (empty) row += String(empty);
      empty = 0;
      row += piece.color === 'w' ? piece.type.toUpperCase() : piece.type;
    }
    rows.push(row + (empty || ''));
  }
  return rows.join('/');
}

export function parseFen(fen: string): Position {
  const fields = fen.trim().split(/\s+/);
  const [placement, turn] = fields;
  const invalid = () => new FenError('Invalid Suffragetto position', fen);
  if (fields.length !== 2 || (turn !== 'w' && turn !== 'b') || !placement) throw invalid();

  const rows = placement.split('/');
  if (rows.length !== RANKS) throw invalid();
  const board: Board = Array.from({ length: BOARD_SIZE }, () => null);
  const counts: Record<Color, number> = { w: 0, b: 0 };
  const prisonSet = new Set(PRISON);
  const yardSet = new Set(PRISON_YARD);
  const hospitalSet = new Set(HOSPITAL);
  const groundsSet = new Set(HOSPITAL_GROUNDS);
  const houseSet = new Set(HOUSE_OF_COMMONS);
  const hallSet = new Set(ALBERT_HALL);

  for (const [rowIndex, text] of rows.entries()) {
    let file = 0;
    const tokens = text.match(/\d+|[A-Za-z]/g) ?? [];
    if (tokens.join('') !== text) throw invalid();
    for (const token of tokens) {
      if (/^\d+$/.test(token)) {
        if (!/^(?:[1-9]|1[0-7])$/.test(token)) throw invalid();
        file += Number(token);
        if (file > FILES) throw invalid();
        continue;
      }

      const letter = token[0]!;
      const type = letter.toLowerCase() as PieceType;
      const color: Color = letter === type ? 'b' : 'w';
      const rank = RANKS - 1 - rowIndex;
      if (file >= FILES || !PIECE_TYPES.includes(type) ||
          (color === 'w' && type !== 'l' && type !== 's') || (color === 'b' && type !== 'i' && type !== 'p'))
        throw invalid();

      const target = rank * FILES + file++;
      if ((prisonSet.has(target) || yardSet.has(target)) && color !== 'w') throw invalid();
      if ((hospitalSet.has(target) || groundsSet.has(target)) && color !== 'b') throw invalid();
      if (hallSet.has(target) && color === 'w') throw invalid();
      if (houseSet.has(target) && color === 'b') throw invalid();
      board[target] = makePiece(color, type);
      counts[color]++;
      if (counts[color] > 21) throw invalid();
    }
    if (file !== FILES) throw invalid();
  }

  return { board, turn };
}

export function keyOf(position: Position): string {
  return `${placementOf(position.board)} ${position.turn}`;
}

const START_BOARD = startingPosition();
export const START_FEN = `${placementOf(START_BOARD.board)} w`;
export const POLICE_START_FEN = `${placementOf(START_BOARD.board)} b`;
