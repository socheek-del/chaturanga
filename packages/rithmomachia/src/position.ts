import { FenError, type Color, type Square } from '@chaturanga/rules-core';
import { BLACK_SETUP, BOARD_SIZE, STARTING_PIECES, WHITE_SETUP, coordinateOf, squareName } from './layout';

type Shape = 'circle' | 'triangle' | 'square' | 'pyramid';
type ComponentShape = Exclude<Shape, 'pyramid'>;

export interface RithPiece {
  readonly color: Color;
  readonly type: string;
  readonly shape: Shape;
  readonly value: number;
  readonly mask?: number;
  readonly promoted: false;
}

export type Board = (RithPiece | null)[];

export interface Position {
  readonly board: Board;
  readonly turn: Color;
  readonly hands: Record<Color, string[]>;
  /** Plies since the most recent capture. */
  readonly capturePlies: number;
}

export interface PyramidComponentDefinition {
  readonly index: number;
  readonly color: Color;
  readonly shape: ComponentShape;
  readonly value: number;
}

const whitePyramid = WHITE_SETUP.find((piece) => piece.shape === 'pyramid')!;
const blackPyramid = BLACK_SETUP.find((piece) => piece.shape === 'pyramid')!;
export const PYRAMID_COMPONENTS: readonly PyramidComponentDefinition[] = Object.freeze([
  ...whitePyramid.components!.map((component, index) => ({ ...component, index, color: 'w' as const })),
  ...blackPyramid.components!.map((component, index) => ({ ...component, index: index + whitePyramid.components!.length, color: 'b' as const })),
]);

const PYRAMID_MASKS: Readonly<Record<Color, number>> = Object.freeze({
  w: (1 << whitePyramid.components!.length) - 1,
  b: ((1 << blackPyramid.components!.length) - 1) << whitePyramid.components!.length,
});

interface PieceDefinition {
  readonly type: string;
  readonly shape: Shape;
  readonly value: number;
  readonly mask?: number;
}

const definitions = new Map<string, PieceDefinition>();
const addSingle = (shape: ComponentShape, value: number) => {
  const type = `${shape[0]}${value}`;
  definitions.set(type, { type, shape, value });
};

for (const setup of STARTING_PIECES) {
  if (setup.shape !== 'pyramid') addSingle(setup.shape, setup.value);
}
for (const component of PYRAMID_COMPONENTS) addSingle(component.shape, component.value);

for (let mask = 1; mask <= 0x7ff; mask++) {
  const color: Color | null = (mask & ~PYRAMID_MASKS.w) === 0 ? 'w' : (mask & ~PYRAMID_MASKS.b) === 0 ? 'b' : null;
  if (!color) continue;
  const type = `p${mask.toString(36)}`;
  const value = PYRAMID_COMPONENTS.reduce((total, component) => total + ((mask & (1 << component.index)) ? component.value : 0), 0);
  definitions.set(type, { type, shape: 'pyramid', value, mask });
}

export const PIECE_TYPES: readonly string[] = Object.freeze([...definitions.keys()].sort());
const TYPE_INDEX = new Map(PIECE_TYPES.map((type, index) => [type, index]));
const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function encodeBase64(bytes: readonly number[]): string {
  let output = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i]!;
    const b = bytes[i + 1];
    const c = bytes[i + 2];
    const packed = (a << 16) | ((b ?? 0) << 8) | (c ?? 0);
    output += BASE64[(packed >>> 18) & 63]!;
    output += BASE64[(packed >>> 12) & 63]!;
    if (b !== undefined) output += BASE64[(packed >>> 6) & 63]!;
    if (c !== undefined) output += BASE64[packed & 63]!;
  }
  return output;
}

function decodeBase64(encoded: string, fen: string): number[] {
  if (!/^[A-Za-z0-9+/]*$/.test(encoded) || encoded.length % 4 === 1)
    throw new FenError('Invalid compact position data', fen);
  const bytes: number[] = [];
  for (let i = 0; i < encoded.length; i += 4) {
    const chunk = encoded.slice(i, i + 4);
    const values = [...chunk].map((character) => BASE64.indexOf(character));
    if (values.some((value) => value < 0)) throw new FenError('Invalid compact position data', fen);
    const a = values[0] ?? 0;
    const b = values[1] ?? 0;
    const c = values[2] ?? 0;
    const d = values[3] ?? 0;
    const packed = (a << 18) | (b << 12) | (c << 6) | d;
    bytes.push((packed >>> 16) & 255);
    if (chunk.length >= 3) bytes.push((packed >>> 8) & 255);
    if (chunk.length === 4) bytes.push(packed & 255);
  }
  if (encodeBase64(bytes) !== encoded) throw new FenError('Non-canonical compact position data', fen);
  return bytes;
}

export function pieceFromType(color: Color, type: string, fen: string): RithPiece {
  const definition = definitions.get(type);
  if (!definition) throw new FenError(`Unknown piece type: ${type}`, fen);
  if (definition.shape === 'pyramid') {
    const mask = definition.mask!;
    if ((mask & ~PYRAMID_MASKS[color]) !== 0) throw new FenError('Pyramid components do not match their color', fen);
    return { color, type, shape: 'pyramid', value: definition.value, mask, promoted: false };
  }
  return { color, type, shape: definition.shape, value: definition.value, promoted: false };
}

function typeIndex(type: string): number {
  const index = TYPE_INDEX.get(type);
  if (index === undefined || index > 255) throw new RangeError(`Unknown Rithmomachia piece type: ${type}`);
  return index;
}

function setupPiece(setup: (typeof STARTING_PIECES)[number]): RithPiece {
  if (setup.shape !== 'pyramid') return pieceFromType(setup.color, `${setup.shape[0]}${setup.value}`, '');
  const components = setup.components!;
  const offset = setup.color === 'w' ? 0 : whitePyramid.components!.length;
  const mask = components.reduce((result, _component, index) => result | (1 << (offset + index)), 0);
  return pieceFromType(setup.color, `p${mask.toString(36)}`, '');
}

function encodeBoard(board: readonly (RithPiece | null)[]): string {
  const bytes: number[] = [];
  for (let square = 0; square < board.length; square++) {
    const piece = board[square];
    if (!piece) continue;
    bytes.push(square | (piece.color === 'b' ? 128 : 0), typeIndex(piece.type));
  }
  return encodeBase64(bytes);
}

function encodeHand(hand: readonly string[]): string {
  return encodeBase64(hand.map(typeIndex).sort((a, b) => a - b));
}

export function serializeFen(position: Position): string {
  return `r1.${encodeBoard(position.board)}.${position.turn}.${position.capturePlies}.${encodeHand(position.hands.w) || '-'}.${encodeHand(position.hands.b) || '-'}`;
}

export function parseFen(fen: string): Position {
  const fields = fen.trim().split('.');
  if (fields.length !== 6 || fields[0] !== 'r1' || !['w', 'b'].includes(fields[2]!) || !/^(?:0|[1-9]\d{0,2})$/.test(fields[3]!) || Number(fields[3]) > 200)
    throw new FenError('Expected Rithmomachia compact FEN: r1.board.turn.capturePlies.whiteHand.blackHand', fen);
  const board: Board = Array(BOARD_SIZE).fill(null);
  const boardBytes = decodeBase64(fields[1]!, fen);
  if (boardBytes.length % 2 !== 0) throw new FenError('Incomplete board piece record', fen);
  let previousSquare = -1;
  for (let i = 0; i < boardBytes.length; i += 2) {
    const colorAndSquare = boardBytes[i]!;
    const square = colorAndSquare & 127;
    const color: Color = (colorAndSquare & 128) === 0 ? 'w' : 'b';
    const index = boardBytes[i + 1]!;
    const type = PIECE_TYPES[index];
    if (!type || square >= BOARD_SIZE || square <= previousSquare)
      throw new FenError('Board entries must use known pieces in ascending square order', fen);
    previousSquare = square;
    board[square] = pieceFromType(color, type, fen);
  }
  const parseHand = (encoded: string): string[] => {
    if (encoded === '-') return [];
    const indices = decodeBase64(encoded, fen);
    if (indices.some((index, order) => order > 0 && index < indices[order - 1]!))
      throw new FenError('Reserve pieces must use canonical type order', fen);
    return indices.map((index) => {
      const type = PIECE_TYPES[index];
      if (!type || definitions.get(type)!.shape === 'pyramid') throw new FenError('Only single pieces can be held in reserve', fen);
      return type;
    }).sort((a, b) => typeIndex(a) - typeIndex(b));
  };
  const turn = fields[2] as Color;
  const hands = { w: parseHand(fields[4]!), b: parseHand(fields[5]!) };
  return { board, turn, hands, capturePlies: Number(fields[3]) };
}

function startingBoard(): Board {
  const board: Board = Array(BOARD_SIZE).fill(null);
  for (const setup of STARTING_PIECES) board[setup.square] = setupPiece(setup);
  return board;
}

export const START_POSITION: Position = Object.freeze({
  board: Object.freeze(startingBoard()) as unknown as Board,
  turn: 'b',
  hands: Object.freeze({ w: Object.freeze([]), b: Object.freeze([]) }) as unknown as Record<Color, string[]>,
  capturePlies: 0,
});

export const START_FEN = serializeFen(START_POSITION);

export function clonePosition(position: Position): Position {
  return {
    board: position.board.map((piece) => piece ? { ...piece } : null),
    turn: position.turn,
    hands: { w: [...position.hands.w], b: [...position.hands.b] },
    capturePlies: position.capturePlies,
  };
}

export function positionKey(position: Position): string {
  return `${encodeBoard(position.board)}.${position.turn}.${encodeHand(position.hands.w)}.${encodeHand(position.hands.b)}`;
}

export const opposite = (color: Color): Color => color === 'w' ? 'b' : 'w';
export const pieceAtName = (name: string): Square | null => {
  const match = /^([a-h])(\d{1,2})$/.exec(name);
  if (!match) return null;
  const rank = Number(match[2]);
  if (rank < 1 || rank > 16) return null;
  return (rank - 1) * 8 + 'abcdefgh'.indexOf(match[1]!);
};
export { coordinateOf, squareName };
