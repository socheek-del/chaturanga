import { type Lesson, type Unit } from '@chaturanga/game-shell';
import { START_FEN } from '@chaturanga/suffragetto';

const l10n = (en: string) => ({ en });
type Token = { at: string; piece: string };

/** Builds compact 17×17 fixtures in the same uppercase/lowercase notation as the engine. */
function fen(tokens: Token[], turn: 'w' | 'b' = 'w'): string {
  const board = Array.from({ length: 17 * 17 }, () => '.');
  for (const { at, piece } of tokens) {
    const file = at.charCodeAt(0) - 97;
    const rank = Number(at.slice(1)) - 1;
    if (file < 0 || file >= 17 || rank < 0 || rank >= 17) throw new Error(`Bad fixture square: ${at}`);
    board[rank * 17 + file] = piece;
  }
  const rows: string[] = [];
  for (let rank = 16; rank >= 0; rank--) {
    const row = board.slice(rank * 17, (rank + 1) * 17).join('');
    rows.push(row.replace(/\.+/g, (empty) => String(empty.length)));
  }
  return `${rows.join('/')} ${turn}`;
}

const stepFen = fen([{ at: 'i6', piece: 'S' }]);
const ownHopFen = fen([{ at: 'h8', piece: 'S' }, { at: 'i8', piece: 'S' }]);
const chainFen = fen([{ at: 'h8', piece: 'S' }, { at: 'i8', piece: 'S' }, { at: 'k8', piece: 'p' }]);
const smallCaptureFen = fen([{ at: 'h8', piece: 'S' }, { at: 'i9', piece: 'p' }]);
const largeCaptureFen = fen([{ at: 'h8', piece: 'L' }, { at: 'i8', piece: 'p' }]);
const goalEntryFen = fen([{ at: 'g12', piece: 'S' }]);
const almostWin = [
  ...['i13', 'j13', 'h14', 'i14', 'j14'].map((at) => ({ at, piece: 'S' })),
  { at: 'g13', piece: 'S' },
];
const exchangeFen = fen([
  { at: 'a1', piece: 'L' },
  ...Array.from({ length: 11 }, (_, index) => ({ at: `a${index + 2}`, piece: 'S' })),
  { at: 'q1', piece: 'i' },
  ...Array.from({ length: 11 }, (_, index) => ({ at: `q${index + 2}`, piece: 'p' })),
]);

/** Interactive exercises follow the selected Sargeant Bros. second-edition rules. */
export const UNITS: Unit[] = [
  {
    id: 'board-and-movement',
    title: l10n('The board and the march'),
    lessons: [
      {
        id: 'two-forces', icon: 'S', title: l10n('Two forces, one Arena'),
        summary: l10n('Read the board, the starting ranks, and the first move.'), xp: 20,
        steps: [
          { kind: 'info', text: l10n('Suffragetto is played on a 17×17 board. The pink 9-file Arena sits between the Prison and Hospital. The Suffragettes begin at the south; Police begin at the north. Each side has 16 rank-and-file pieces and five large officers.'), fen: START_FEN },
          { kind: 'quiz', text: l10n('How is the first player chosen in the printed rules?'), choices: [l10n('By a coin toss.'), l10n('The Suffragettes always start.')], correct: 0, hint: l10n('This product lets you choose either side to move first.') },
        ],
      },
      {
        id: 'step-or-hop', icon: '↗', title: l10n('Step or hop'),
        summary: l10n('Move one adjacent cell or jump over one piece.'), xp: 25,
        steps: [
          { kind: 'move', text: l10n('Move the Suffragette one empty cell from i6 to i7.'), fen: stepFen, solutions: ['i6i7'], hint: l10n('A step may go one empty cell in any of the eight directions.') },
          { kind: 'move', text: l10n('Hop from h8 over the friendly piece on i8 and land on j8.'), fen: ownHopFen, solutions: ['h8j8'], hint: l10n('A hop passes over one occupied adjacent cell and lands immediately beyond it.') },
          { kind: 'move', text: l10n('Continue the same piece’s turn with a second hop: from h8 over i8 to j8, then over the Police on k8 to l8.'), fen: chainFen, solutions: ['h8j8l8'], hint: l10n('A route can change direction and chain hops over either side.') },
        ],
      },
      {
        id: 'routes-and-zones', icon: '□', title: l10n('Routes and restricted ground'),
        summary: l10n('Learn where routes may pass and where a piece must stay.'), xp: 25,
        steps: [
          { kind: 'info', text: l10n('Prison, Hospital, Prison Yard and Hospital Grounds are not ordinary route squares. A hop cannot pass over them. A Suffragette cannot enter Albert Hall; a Police piece cannot enter the House of Commons. A piece that enters its own goal building may move within it, but cannot leave.'), fen: START_FEN },
          { kind: 'move', text: l10n('Move from g12 into the first House of Commons cell at h13.'), fen: goalEntryFen, solutions: ['g12h13'], hint: l10n('The House is the Suffragettes’ goal building.') },
          { kind: 'quiz', text: l10n('Once a Suffragette enters the House of Commons, can it leave again?'), choices: [l10n('No. It may move within the House, but cannot leave.'), l10n('Yes, it can return to the Arena.')], correct: 0 },
        ],
      },
    ],
  },
  {
    id: 'captures-and-exchange',
    title: l10n('Captures and exchanges'),
    lessons: [
      {
        id: 'small-rank-capture', icon: 'S', title: l10n('A small piece captures diagonally'),
        summary: l10n('Capture only on a diagonal hop through the pink Arena.'), xp: 25,
        steps: [
          { kind: 'move', text: l10n('Hop diagonally from h8 over the Police at i9 and land on j10.'), fen: smallCaptureFen, solutions: ['h8j10'], hint: l10n('A rank-and-file piece captures only diagonally, and the captured piece must stand in the pink Arena.'), success: l10n('The captured Police piece is transferred to Hospital.') },
          { kind: 'info', text: l10n('The large Suffragette Leader and Police Inspector can capture on straight or diagonal hops. A hop that does not meet its piece’s capture rule is still a legal non-capturing hop. Captured pieces stay in play inside Prison or Hospital.') },
          { kind: 'move', text: l10n('The large Leader can capture straight: hop from h8 over the Police on i8 to j8.'), fen: largeCaptureFen, solutions: ['h8j8'], hint: l10n('Large officers capture in any direction, including straight ahead.') },
        ],
      },
      {
        id: 'exchange', icon: '⇄', title: l10n('Demand an exchange'),
        summary: l10n('Release up to six matched pairs from the holding buildings.'), xp: 30,
        steps: [
          { kind: 'info', text: l10n('An exchange becomes available when Prison and Hospital each hold at least 12 pieces. Either player may demand one without consent, exchanging up to six pairs of equal rank. Exchanges are unavailable while either staging area is occupied.'), fen: exchangeFen },
          { kind: 'move', text: l10n('Choose the one-small and one-large pair exchange. Both sides return to their staging areas.'), fen: exchangeFen, solutions: ['X11@b1'], hint: l10n('The action lists small pairs, large pairs, and the first released Suffragette’s staging cell.'), success: l10n('The matched pieces return automatically. The exchange uses one turn.') },
        ],
      },
    ],
  },
  {
    id: 'goals-and-endings',
    title: l10n('Goals and endings'),
    lessons: [
      {
        id: 'six-in-the-building', icon: '6', title: l10n('Occupy all six cells'),
        summary: l10n('Fill the opposing building to win immediately.'), xp: 30,
        steps: [
          { kind: 'move', text: l10n('Move the last Suffragette into h13 to fill all six House cells and win.'), fen: fen(almostWin), solutions: ['g13h13'], hint: l10n('The first player to place six pieces in the opponent’s building wins.'), success: l10n('The Suffragettes have filled the House of Commons.') },
          { kind: 'info', text: l10n('Police win by filling all six cells of the Suffragettes’ Albert Hall. A captured piece does not count toward a building goal.') },
        ],
      },
      {
        id: 'digital-endings', icon: '∞', title: l10n('Draws and no-move endings'),
        summary: l10n('Learn the digital conventions used when a game cannot continue.'), xp: 25,
        steps: [
          { kind: 'quiz', text: l10n('What happens when the same full position occurs for the third time?'), choices: [l10n('The game is drawn.'), l10n('The player to move wins.')], correct: 0, hint: l10n('Threefold repetition is a draw in this digital edition.') },
          { kind: 'quiz', text: l10n('If a player has no legal move, what happens in this digital edition?'), choices: [l10n('That player loses.'), l10n('The game is an automatic draw.')], correct: 0 },
          { kind: 'info', text: l10n('The reviewed printed rules do not settle repetition or a no-move result; this product uses threefold repetition as a draw and no legal move as a loss. There is no 50-move rule. During a hop chain, captured pieces are removed immediately and a landing cannot be revisited, so routes always serialize and finish.') },
        ],
      },
    ],
  },
];

export const ALL_LESSONS: Lesson[] = UNITS.flatMap((unit) => unit.lessons);
export const findLesson = (id: string | undefined): Lesson | undefined => ALL_LESSONS.find((lesson) => lesson.id === id);
