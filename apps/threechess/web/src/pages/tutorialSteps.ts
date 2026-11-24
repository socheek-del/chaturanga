import { Game, hexAt, parseSquare, RADIUS, SIZE, type PieceType, type Player } from '@chaturanga/threechess';

type TutorialStep =
  | { id: string; kind: 'info' }
  | { id: string; kind: 'move'; fen: string; answer: string; outcome?: Player }
  | { id: string; kind: 'quiz'; choices: readonly string[]; answer: string };

function position(pieces: ReadonlyArray<readonly [string, Player, PieceType]>, eliminated = '-'): string {
  const cells = Array.from({ length: SIZE * SIZE }, (_, square): string =>
    hexAt(square % SIZE - RADIUS, Math.floor(square / SIZE) - RADIUS) === null ? '.' : '-');
  for (const [cell, player, piece] of pieces) cells[parseSquare(cell)!] = player + piece;
  const rows = Array.from({ length: SIZE }, (_, row) => cells.slice(row * SIZE, (row + 1) * SIZE).join(','));
  return `${rows.join('/')} w - ${eliminated} -`;
}

const opening = new Game();
const firstThreeTurns = ['d10d9', 'j4i5', 'd4e4'].map((answer, index): TutorialStep => {
  const fen = opening.fen();
  opening.move(answer);
  return { id: ['white', 'black', 'red'][index]!, kind: 'move', fen, answer };
});

export const steps: readonly TutorialStep[] = [
  { id: 'welcome', kind: 'info' },
  ...firstThreeTurns,
  { id: 'pieces', kind: 'info' },
  {
    id: 'promote', kind: 'move', answer: 'f2f1n',
    fen: position([['f2', 'w', 'p'], ['a10', 'w', 'k'], ['k5', 'b', 'k'], ['k1', 'r', 'k']]),
  },
  {
    id: 'mate', kind: 'move', answer: 'i1g2', outcome: 'w',
    fen: position([['f1', 'b', 'k'], ['h1', 'w', 'k'], ['i1', 'w', 'q']], 'r'),
  },
  { id: 'stalemate', kind: 'quiz', choices: ['win', 'out', 'pass'], answer: 'pass' },
];
