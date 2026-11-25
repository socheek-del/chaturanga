import { type Lesson, type Unit } from '@chaturanga/game-shell';
import { pieceFromType, PYRAMID_COMPONENTS, serializeFen, START_FEN, squareAt } from '@chaturanga/rithmomachia';
import type { Color, Square } from '@chaturanga/rules-core';

const l10n = (en: string) => ({ en });
type LessonPiece = { at: string; color: Color; type: string };

function fen(
  pieces: readonly LessonPiece[],
  turn: Color = 'w',
  hands: Record<Color, string[]> = { w: [], b: [] },
  capturePlies = 0,
): string {
  const board = Array(128).fill(null);
  for (const piece of pieces) {
    const file = piece.at[0]!;
    const rank = Number(piece.at.slice(1));
    const square: Square = squareAt(file, rank);
    if (board[square]) throw new Error(`Duplicate lesson square: ${piece.at}`);
    board[square] = pieceFromType(piece.color, piece.type, 'lesson position');
  }
  return serializeFen({ board, turn, hands, capturePlies });
}

function pyramidType(color: Color): string {
  const mask = PYRAMID_COMPONENTS
    .filter((component) => component.color === color)
    .reduce((value, component) => value | (1 << component.index), 0);
  return `p${mask.toString(36)}`;
}

const circleMove = fen([{ at: 'c4', color: 'w', type: 'c2' }]);
const triangleMove = fen([{ at: 'b4', color: 'w', type: 't6' }]);
const squareMove = fen([{ at: 'a4', color: 'w', type: 's15' }]);
const blockedTriangle = fen([
  { at: 'b4', color: 'w', type: 't6' },
  { at: 'c4', color: 'w', type: 'c2' },
]);
const meeting = fen([
  { at: 'c4', color: 'w', type: 'c16' },
  { at: 'd5', color: 'b', type: 'c16' },
]);
const assault = fen([
  { at: 'a4', color: 'w', type: 's15' },
  { at: 'd4', color: 'b', type: 't30' },
]);
const ambuscade = fen([
  { at: 'd5', color: 'w', type: 'c2' },
  { at: 'f5', color: 'w', type: 'c4' },
  { at: 'e4', color: 'b', type: 't6' },
]);
const siege = fen([
  { at: 'd7', color: 'w', type: 'c2' },
  { at: 'c8', color: 'w', type: 'c4' },
  { at: 'e8', color: 'w', type: 'c6' },
  { at: 'd9', color: 'w', type: 'c8' },
  { at: 'd8', color: 'b', type: 'c9' },
]);
const pyramidComponent = fen([
  { at: 'c8', color: 'w', type: 't64' },
  { at: 'e8', color: 'b', type: pyramidType('b') },
]);
const pyramidSiege = fen([
  { at: 'd7', color: 'w', type: 'c2' },
  { at: 'c8', color: 'w', type: 'c4' },
  { at: 'e8', color: 'w', type: 'c6' },
  { at: 'd9', color: 'w', type: 'c8' },
  { at: 'd8', color: 'b', type: pyramidType('b') },
]);
const reserveDrop = fen([], 'w', { w: ['c2'], b: [] });
const progression = fen([
  { at: 'b9', color: 'w', type: 'c2' },
  { at: 'd9', color: 'w', type: 'c4' },
  { at: 'f9', color: 'w', type: 'c6' },
], 'b');
const noAction = fen([
  { at: 'a1', color: 'w', type: 'c2' },
  { at: 'b2', color: 'b', type: 'c4' },
]);
const countingDraw = fen([
  { at: 'c4', color: 'w', type: 'c2' },
  { at: 'f13', color: 'b', type: 'c3' },
], 'w', { w: [], b: [] }, 200);

/** Every selected rules topic has a lesson; UI practice moves are legal in the authoritative Variant. */
export const RULE_LESSONS = {
  standardSetup: 'the-opening-board',
  blackMovesFirst: 'the-opening-board',
  numberFamilies: 'number-families',
  circleMovement: 'the-circle-step',
  triangleMovement: 'the-triangle-span',
  squareMovement: 'the-square-span',
  pyramidMovement: 'pyramid-components',
  noJumping: 'blocked-paths',
  meetingCapture: 'meeting-capture',
  assaultCapture: 'assault-capture',
  ambuscadeCapture: 'ambuscade-capture',
  siegeCapture: 'siege-capture',
  captureLeavesAttacker: 'meeting-capture',
  capturedPieceChangesSide: 'reserves-and-drops',
  capturedPieceCanBePlaced: 'reserves-and-drops',
  reserveDropsOnHomeRank: 'reserves-and-drops',
  pyramidPartialCapture: 'pyramid-components',
  pyramidSiegeTakesAll: 'pyramid-siege',
  greatVictory: 'great-victory',
  noLegalActionLoses: 'game-endings',
  threefoldRepetitionDraw: 'game-endings',
  '200PlyDraw': 'game-endings',
} as const;

export const UNITS: Unit[] = [
  {
    id: 'the-field',
    title: l10n('The number field'),
    lessons: [
      {
        id: 'the-opening-board', icon: '8×16', title: l10n('The opening board'),
        summary: l10n('Read the tall board, the starting rows, and the first turn.'), xp: 20,
        steps: [
          { kind: 'info', text: l10n('Rithmomachia uses eight files and sixteen ranks. White begins on ranks 1–4, Black on ranks 13–16, and Black takes the first turn. Each side has circles, triangles, squares, and a composite pyramid.'), fen: START_FEN },
          { kind: 'quiz', text: l10n('Who moves first in this edition?'), choices: [l10n('Black'), l10n('White'), l10n('The player with fewer pieces')], correct: 0, hint: l10n('Black begins from the far end of the 16-rank field.'), fen: START_FEN },
        ],
      },
      {
        id: 'number-families', icon: '1 · 4 · 9', title: l10n('Numbers and shapes'),
        summary: l10n('Read a piece by its shape and its value.'), xp: 20,
        steps: [
          { kind: 'info', text: l10n('Each piece has a geometric shape and a number. Circles move one diagonal square; triangles span exactly two empty orthogonal squares; squares span exactly three. A pyramid carries several numbered components and shows their current total.'), fen: START_FEN },
          { kind: 'quiz', text: l10n('How far does a square move in a straight line?'), choices: [l10n('Exactly three squares, if the path is clear.'), l10n('Any distance.'), l10n('One square at a time.')], correct: 0, hint: l10n('Movement length is fixed by the shape.'), fen: START_FEN },
        ],
      },
      {
        id: 'the-circle-step', icon: '↗', title: l10n('A circle’s step'),
        summary: l10n('Move one square diagonally.'), xp: 20,
        steps: [
          { kind: 'info', text: l10n('A circle moves exactly one square diagonally in any direction, when that square is empty.'), fen: circleMove },
          { kind: 'move', text: l10n('Move the white circle from c4 to d5.'), fen: circleMove, solutions: ['c4d5'], hint: l10n('The destination is one diagonal step away.') },
        ],
      },
      {
        id: 'the-triangle-span', icon: '⇢2', title: l10n('A triangle’s span'),
        summary: l10n('Move exactly two orthogonal squares.'), xp: 20,
        steps: [
          { kind: 'info', text: l10n('A triangle moves exactly two squares along a rank or file. It cannot turn or jump over a piece.'), fen: triangleMove },
          { kind: 'move', text: l10n('Move the triangle from b4 to d4.'), fen: triangleMove, solutions: ['b4d4'], hint: l10n('Follow the same rank for exactly two squares.') },
        ],
      },
      {
        id: 'the-square-span', icon: '⇢3', title: l10n('A square’s span'),
        summary: l10n('Move exactly three orthogonal squares.'), xp: 20,
        steps: [
          { kind: 'info', text: l10n('A square moves exactly three squares along a rank or file. Any occupied square in its path blocks the move.'), fen: squareMove },
          { kind: 'move', text: l10n('Move the square from a4 to d4.'), fen: squareMove, solutions: ['a4d4'], hint: l10n('There are two empty squares between the start and the destination.') },
        ],
      },
      {
        id: 'blocked-paths', icon: '⊣', title: l10n('No jumping'),
        summary: l10n('A piece in the way blocks a longer move.'), xp: 20,
        steps: [
          { kind: 'info', text: l10n('Triangles and squares travel a fixed distance. A piece on an intermediate square blocks the path, even when it belongs to the moving player.'), fen: blockedTriangle },
          { kind: 'quiz', text: l10n('Can the white triangle on b4 reach d4 through its own circle on c4?'), choices: [l10n('No. The circle blocks the path.'), l10n('Yes. Triangles jump over pieces.')], correct: 0, hint: l10n('Every intermediate square must be empty.'), fen: blockedTriangle },
        ],
      },
    ],
  },
  {
    id: 'arithmetic-captures',
    title: l10n('Arithmetic captures'),
    lessons: [
      {
        id: 'meeting-capture', icon: '=', title: l10n('Meeting'),
        summary: l10n('Capture an equal number in ordinary reach.'), xp: 25,
        steps: [
          { kind: 'info', text: l10n('A meeting capture takes an enemy piece of the same value that lies in the attacker’s ordinary movement reach. The attacker stays on its square. The captured piece changes sides and enters the captor’s reserve.'), fen: meeting },
          { kind: 'move', text: l10n('The circle on c4 and the enemy circle on d5 both show 16. Capture by meeting; the attacker remains on c4.'), fen: meeting, solutions: ['c4d5'], hint: l10n('The circles are equal in value and one diagonal step apart.') },
        ],
      },
      {
        id: 'assault-capture', icon: '×', title: l10n('Assault'),
        summary: l10n('Multiply the attacker by the empty squares between.'), xp: 25,
        steps: [
          { kind: 'info', text: l10n('In an assault, the attacker’s value times the number of empty squares between attacker and target equals the target’s value. The path must be straight and clear.'), fen: assault },
          { kind: 'move', text: l10n('Capture the 30 on d4 with the 15 on a4: 15 × 2 empty squares = 30.'), fen: assault, solutions: ['a4d4'], hint: l10n('Count only the two empty squares b4 and c4 between the pieces.') },
        ],
      },
      {
        id: 'ambuscade-capture', icon: '+', title: l10n('Ambuscade'),
        summary: l10n('Two reachable friendly values add to the target.'), xp: 25,
        steps: [
          { kind: 'info', text: l10n('An ambuscade uses two friendly pieces that can each reach the enemy square. Their values add to the target value. Choose one attacker; it remains in place while the target enters the reserve.'), fen: ambuscade },
          { kind: 'move', text: l10n('Capture the 6 on e4. The white circles on d5 and f5 contribute 2 + 4 = 6.'), fen: ambuscade, solutions: ['d5e4'], hint: l10n('Both circles are one diagonal step from e4.') },
        ],
      },
      {
        id: 'siege-capture', icon: '⊞', title: l10n('Siege'),
        summary: l10n('Surround all four orthogonal sides.'), xp: 25,
        steps: [
          { kind: 'info', text: l10n('A siege captures a piece when the four orthogonal neighboring squares are occupied by the attacker’s side. The chosen attacking piece stays where it is.'), fen: siege },
          { kind: 'move', text: l10n('The 9 on d8 is surrounded on c8, e8, d7, and d9. Complete the siege from d7.'), fen: siege, solutions: ['d7d8'], hint: l10n('All four neighboring squares must belong to White.') },
        ],
      },
    ],
  },
  {
    id: 'pyramids-and-endings',
    title: l10n('Pyramids and endings'),
    lessons: [
      {
        id: 'pyramid-components', icon: '△□', title: l10n('A pyramid’s components'),
        summary: l10n('Capture one numbered component and keep the rest.'), xp: 30,
        steps: [
          { kind: 'info', text: l10n('A pyramid moves by any surviving component shape. Its face shows the total of the components still stacked. Capturing a component removes only that number and adds it to the attacker’s reserve.'), fen: pyramidComponent },
          { kind: 'move', text: l10n('The white triangle worth 64 reaches the black pyramid. Capture its square 64 component; the rest of the pyramid stays on e8.'), fen: pyramidComponent, solutions: ['c8e8g'], hint: l10n('Choose the component whose value matches the attacker.') },
        ],
      },
      {
        id: 'pyramid-siege', icon: '⊞△', title: l10n('Siege a pyramid'),
        summary: l10n('A siege removes every component still in the stack.'), xp: 30,
        steps: [
          { kind: 'info', text: l10n('A pyramid can also be captured by siege. Unlike an ordinary component capture, siege removes every component that remains.'), fen: pyramidSiege },
          { kind: 'move', text: l10n('The white pieces surround the pyramid on d8. Complete the siege from d7; every component enters the reserve.'), fen: pyramidSiege, solutions: ['d7d8z'], hint: l10n('The siege action is marked with the special all-components choice.') },
        ],
      },
      {
        id: 'reserves-and-drops', icon: '↧', title: l10n('Reserves and placement'),
        summary: l10n('Captured numbers join your side and can return on your home rank.'), xp: 30,
        steps: [
          { kind: 'info', text: l10n('Captured pieces change sides. Each is kept as its own numbered piece in the captor’s reserve. On a later turn, place one on any empty square of your home rank.'), fen: reserveDrop },
          { kind: 'move', text: l10n('Place the circle worth 2 from White’s reserve on a1.'), fen: reserveDrop, solutions: ['C2@a1'], hint: l10n('White’s home rank is rank 1.') },
        ],
      },
      {
        id: 'great-victory', icon: '∴', title: l10n('Great victory'),
        summary: l10n('Build an equally spaced arithmetic progression in enemy territory.'), xp: 30,
        steps: [
          { kind: 'info', text: l10n('Great victory is made by three same-side pieces in a straight line at equal spacing, inside the opponent’s half. Their values must form an arithmetic progression. Here, 2, 4, and 6 rise by the same amount along rank 9.'), fen: progression },
          { kind: 'quiz', text: l10n('Which values form an arithmetic progression with equal gaps?'), choices: [l10n('2, 4, 6'), l10n('2, 5, 6'), l10n('4, 4, 6')], correct: 0, hint: l10n('The difference from 2 to 4 is the same as the difference from 4 to 6.'), fen: progression },
        ],
      },
      {
        id: 'game-endings', icon: '∞', title: l10n('The game ends'),
        summary: l10n('Learn blocked positions, repetition, and the digital counting draw.'), xp: 30,
        steps: [
          { kind: 'quiz', text: l10n('The white circle on a1 has no legal action. What happens?'), choices: [l10n('White loses.'), l10n('The game is drawn.')], correct: 0, hint: l10n('A player with no legal action loses.'), fen: noAction },
          { kind: 'info', text: l10n('The same position appearing for the third time is a draw. This digital edition also declares a draw after 200 plies without a capture. The 200-ply counter resets whenever a capture happens.'), fen: countingDraw },
        ],
      },
    ],
  },
];

export const ALL_LESSONS: Lesson[] = UNITS.flatMap((unit) => unit.lessons);
