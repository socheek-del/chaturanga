import { Game, isPlayable, parseSquare, type Seat } from '@chaturanga/fortress';

export type TutorialStep =
  | { id: string; kind: 'info'; fen?: string }
  | { id: string; kind: 'move'; fen: string; answer: string }
  | { id: string; kind: 'quiz'; choices: readonly string[]; answer: string };

function position(
  pieces: Record<string, string>,
  turn: Seat = 'r',
  enPassant = '-',
  eliminated = '-',
  rights = '-',
): string {
  const cells: string[] = Array.from({ length: 256 }, (_, square) => (isPlayable(square) ? '-' : '.'));
  for (const [name, token] of Object.entries(pieces)) {
    const square = parseSquare(name);
    if (square === null) throw new Error(`Bad tutorial square: ${name}`);
    cells[square] = token;
  }
  const rows = Array.from({ length: 16 }, (_, row) =>
    cells.slice((15 - row) * 16, (16 - row) * 16).join(','),
  );
  return `${rows.join('/')} ${turn} ${enPassant} ${eliminated} - r:-;b:-;w:-;k:- ${rights}`;
}

function setupComplete(): string {
  const game = new Game();
  for (const move of [
    'B@a13',
    'N@b13',
    'R@c13',
    'B@m13',
    'N@n13',
    'R@o13',
    'B@m1',
    'N@n1',
    'R@o1',
    'B@a1',
    'N@b1',
    'R@c1',
  ])
    game.move(move);
  return game.fen();
}

const start = new Game().fen();
const play = setupComplete();
const epStart = position({ a15: 'Rk', n8: 'Bk', n1: 'Wk', c8: 'Kk', e13: 'Rp', f11: 'Bp' });
const epGame = new Game(epStart);
epGame.move('e13e11');
const ep = epGame.fen();
const castle = position(
  { h14: 'Rk', e14: 'Rr', l14: 'Rr', l5: 'Bk', l12: 'Wk', e12: 'Kk' },
  'r',
  '-',
  '-',
  'rKLR',
);
const promotion = position({ a15: 'Rk', n8: 'Bk', n1: 'Wk', c8: 'Kk', e4: 'Rp' });
const walls = position({ e5: 'Rk', l5: 'Bk', l12: 'Wk', e12: 'Kk', n2: 'Rb' });
const mate = position({ a15: 'Rk', h8: 'Bk', n12: 'Wk', a1: 'Kk', g7: 'Rq', f7: 'Rr', h14: 'Rr', i3: 'Rr' });

export const tutorialSteps: readonly TutorialStep[] = [
  { id: 'welcome', kind: 'info', fen: start },
  { id: 'board', kind: 'info', fen: start },
  { id: 'teams', kind: 'info', fen: start },
  { id: 'reserve', kind: 'move', fen: start, answer: 'B@a13' },
  { id: 'turns', kind: 'move', fen: play, answer: 'e13e11' },
  { id: 'pieces', kind: 'info', fen: play },
  { id: 'walls', kind: 'info', fen: walls },
  { id: 'enPassant', kind: 'move', fen: ep, answer: 'f11e12' },
  { id: 'castling', kind: 'move', fen: castle, answer: 'h14f14' },
  { id: 'promotion', kind: 'move', fen: promotion, answer: 'e4e3q' },
  { id: 'checkmate', kind: 'move', fen: mate, answer: 'a15a14' },
  { id: 'stalemate', kind: 'quiz', choices: ['draw', 'pass', 'win'], answer: 'draw' },
];
