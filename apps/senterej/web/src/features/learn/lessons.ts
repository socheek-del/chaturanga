import { Game, START_FEN, type PieceType, senterej } from '@chaturanga/senterej';
import type { Lesson, LessonStep } from '@chaturanga/game-shell';

type Placement = { type: PieceType; color: 'w' | 'b'; square: string };

function position(placements: readonly Placement[], turn: 'w' | 'b' = 'w', phase: 'werera' | 'turn' = 'turn'): string {
  const board: Array<Array<string | null>> = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (const { type, color, square } of placements) {
    const file = square.charCodeAt(0) - 97;
    const rank = Number(square[1]) - 1;
    board[rank]![file] = color === 'w' ? type.toUpperCase() : type;
  }
  const rows = Array.from({ length: 8 }, (_, index) => {
    const row = board[7 - index]!;
    let empty = 0;
    let result = '';
    for (const cell of row) {
      if (cell === null) empty++;
      else {
        if (empty) result += String(empty);
        result += cell;
        empty = 0;
      }
    }
    return result + (empty || '');
  });
  return `${rows.join('/')} ${turn} - - 0 1 ${phase} - -`;
}

function teachingPosition(type: PieceType): string {
  const placements: Placement[] = [
    { type: 'k', color: 'w', square: type === 'k' ? 'e4' : 'a1' },
    { type: 'k', color: 'b', square: 'h8' },
    { type: 'r', color: 'w', square: 'a2' },
    { type: 'n', color: 'b', square: 'a8' },
    { type: 'r', color: 'b', square: 'g7' },
  ];
  if (type !== 'k') placements.push({ type, color: 'w', square: 'e4' });
  if (type === 'p') placements.push({ type: 'n', color: 'w', square: 'b2' });
  return position(placements);
}

function pieceSteps(type: PieceType, text: string, prompt: string, hint: string): LessonStep[] {
  const fen = teachingPosition(type);
  const targets = new Game(fen).legalUci().filter((uci) => uci.startsWith('e4')).map((uci) => uci.slice(2, 4));
  return [
    { kind: 'info', fen, highlight: targets, text: { en: text } },
    { kind: 'squares', fen, targetsOf: 'e4', answer: targets, text: { en: prompt }, hint: { en: hint } },
  ];
}

const CHECKMATE = 'n5k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1 turn - -';
const CAPTURE = '7k/1p5r/8/8/8/8/8/KR6 w - - 0 1 werera - -';
const PROMOTION = '1n5k/P7/8/8/8/8/8/KR6 w - - 0 1 turn - -';
const BARE_KING = '7k/8/8/8/8/8/8/KR6 w - - 0 1 turn - -';

export const LESSONS: readonly Lesson[] = [
  {
    id: 'field-and-werera', icon: 'field', xp: 10,
    title: { en: 'The open field' }, summary: { en: 'Meet the board and the opening phase' },
    steps: [
      { kind: 'info', fen: START_FEN, text: { en: 'Senterej is played on an uncheckered eight-by-eight field. Ivory begins at the bottom and Gold at the far edge. The king columns cross: Ivory’s Negus is on e1 and Gold’s on d8.' } },
      { kind: 'info', fen: START_FEN, highlight: ['e1', 'd8', 'd1', 'e8'], text: { en: 'Werera comes first. Both players may move their own pieces repeatedly while they mobilize. The first capture ends Werera in this digital edition.' } },
      { kind: 'quiz', choices: [{ en: 'Only the side shown in the turn banner' }, { en: 'Either side may act during Werera' }], correct: 1, text: { en: 'Who may make a move during Werera?' }, hint: { en: 'The opening is a shared mobilization phase.' } },
    ],
  },
  {
    id: 'negus-and-ferz', icon: 'k', xp: 10,
    title: { en: 'Negus and Ferz' }, summary: { en: 'The king and its one-step counselor' },
    steps: [
      ...pieceSteps('k', 'The Negus steps one square in any direction. In ordinary play it must stay out of check.', 'Tap every square the Negus can reach from e4.', 'Choose the neighboring squares around e4.'),
      ...pieceSteps('q', 'The Ferz moves one square diagonally. It is a small piece with a precise reach.', 'Tap every square the Ferz can reach from e4.', 'Look one step away on each diagonal.'),
    ],
  },
  {
    id: 'saba-and-feres', icon: 'b', xp: 10,
    title: { en: 'Saba and Feres' }, summary: { en: 'A long leap and a horse jump' },
    steps: [
      ...pieceSteps('b', 'The Saba jumps exactly two squares diagonally. It can leap over a piece in the middle.', 'Tap every square the Saba can reach from e4.', 'Each landing point is two diagonal steps away.'),
      ...pieceSteps('n', 'The Feres makes the familiar two-by-one horse jump. The middle squares do not matter.', 'Tap every square the Feres can reach from e4.', 'Find the eight L-shaped destinations.'),
    ],
  },
  {
    id: 'der-and-medeq', icon: 'r', xp: 10,
    title: { en: 'Der and Medeq' }, summary: { en: 'The straight-moving tower and pawn' },
    steps: [
      ...pieceSteps('r', 'The Der travels any unobstructed distance along a rank or file. It stops at the board edge or the first piece.', 'Tap every square the Der can reach from e4.', 'Trace the open ranks and files from e4.'),
      ...pieceSteps('p', 'A Medeq advances one square into an empty space and captures one square diagonally forward. There is no two-square start move.', 'Tap every square the Medeq can reach from e4.', 'It steps forward, and captures diagonally.'),
    ],
  },
  {
    id: 'promotion', icon: 'p', xp: 10,
    title: { en: 'The far rank' }, summary: { en: 'A Medeq becomes a Ferz' },
    steps: [
      { kind: 'info', fen: PROMOTION, highlight: ['a7', 'a8'], text: { en: 'When a Medeq reaches the far rank, it promotes automatically to a Ferz. The move notation marks this as “q” for the Ferz.' } },
      { kind: 'move', fen: PROMOTION, solutions: ['a7a8q'], text: { en: 'Move the Medeq from a7 to the far rank to promote it.' }, hint: { en: 'The square directly ahead is open.' }, success: { en: 'The pawn is now a Ferz.' } },
    ],
  },
  {
    id: 'first-capture', icon: 'x', xp: 10,
    title: { en: 'The first capture' }, summary: { en: 'Werera gives way to ordinary turns' },
    steps: [
      { kind: 'info', fen: CAPTURE, text: { en: 'A capture ends Werera immediately. The other player receives the first ordinary turn. From then on, turns alternate and the Negus may not remain in check.' } },
      { kind: 'move', fen: CAPTURE, solutions: ['b1b7'], text: { en: 'Capture the Medeq on b7. Notice which side receives the next turn.' }, hint: { en: 'The Der on b1 can travel straight up the b-file.' } },
      { kind: 'quiz', choices: [{ en: 'The capturing side' }, { en: 'The other side' }], correct: 1, text: { en: 'After Ivory makes the first capture, who moves first in ordinary play?' }, hint: { en: 'The rule gives the first ordinary turn to the player who did not capture.' } },
    ],
  },
  {
    id: 'checkmate', icon: 'mate', xp: 10,
    title: { en: 'Check and mate' }, summary: { en: 'Keep the Negus safe and finish the game' },
    steps: [
      { kind: 'info', fen: CHECKMATE, text: { en: 'During ordinary play you may not expose your Negus to attack. A check must be answered. If there is no legal escape, the game ends in checkmate.' } },
      { kind: 'move', fen: CHECKMATE, solutions: ['d1d8'], text: { en: 'Find the Der move that checkmates Gold.' }, hint: { en: 'Move the Der to the eighth rank.' }, success: { en: 'The Negus has no safe move or interposition.' } },
    ],
  },
  {
    id: 'draws-and-counting', icon: 'draw', xp: 10,
    title: { en: 'Material and draws' }, summary: { en: 'Bare Negus, counting and repetition' },
    steps: [
      { kind: 'info', fen: BARE_KING, text: { en: 'If a Negus loses every non-pawn supporting piece, it cannot be mated and the game is drawn. Pawns do not count as support for this rule.' } },
      { kind: 'quiz', choices: [{ en: 'The opponent must mate before that piece makes seven moves' }, { en: 'The player loses on their seventh turn' }], correct: 0, text: { en: 'What happens when a side has exactly one non-pawn support beside its Negus?' }, hint: { en: 'Count the support piece’s own moves, starting when it becomes the only one.' } },
      { kind: 'info', fen: senterej.startFen, text: { en: 'Stalemate, threefold repetition of the same normal-play position, and an expired seven-move count are draws in this digital profile.' } },
    ],
  },
];
