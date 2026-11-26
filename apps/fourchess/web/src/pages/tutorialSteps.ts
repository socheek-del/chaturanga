import { fourchess, isPlayable, parseSquare, type Player, type PieceType } from '@chaturanga/fourchess';

export type TutorialStep =
  | { id: 'welcome' | 'shape' | 'special' | 'elimination'; kind: 'info' }
  | { id: 'turns' | 'directions' | 'finish'; kind: 'quiz'; choices: readonly string[]; answer: string }
  | { id: 'pieces' | 'red-pawn' | 'score' | 'promotion'; kind: 'move'; fen: string; answer: string };

interface PieceSpec { square: string; color: Player; type: PieceType; promoted?: boolean }

function position(pieces: readonly PieceSpec[], eliminated = 'yg'): string {
  const board = Array.from({ length: 196 }, () => '-');
  for (let square = 0; square < board.length; square++) {
    if (!isPlayable(square % 14, Math.floor(square / 14))) board[square] = '.';
  }
  for (const piece of pieces) {
    const square = parseSquare(piece.square);
    if (square === null) throw new Error(`Tutorial uses invalid square ${piece.square}`);
    board[square] = `${piece.color}${piece.type}${piece.promoted ? '~' : ''}`;
  }
  const rows = Array.from({ length: 14 }, (_, row) => board.slice((13 - row) * 14, (14 - row) * 14).join(','));
  return `${rows.join('/')} r - - ${eliminated} r=0,b=0,y=0,g=0 0 ---- -`;
}

export const steps: readonly TutorialStep[] = [
  { id: 'welcome', kind: 'info' },
  { id: 'shape', kind: 'info' },
  { id: 'turns', kind: 'quiz', choices: ['blue', 'yellow', 'green'], answer: 'blue' },
  { id: 'pieces', kind: 'move', fen: fourchess.startFen, answer: 'e1d3' },
  { id: 'red-pawn', kind: 'move', fen: fourchess.startFen, answer: 'd2d4' },
  { id: 'directions', kind: 'quiz', choices: ['left', 'right'], answer: 'left' },
  {
    id: 'score', kind: 'move', answer: 'e4e8', fen: position([
      { square: 'h1', color: 'r', type: 'k' }, { square: 'a11', color: 'b', type: 'k' },
      { square: 'e4', color: 'r', type: 'r' }, { square: 'e8', color: 'b', type: 'q' },
    ]),
  },
  {
    id: 'promotion', kind: 'move', answer: 'd7d8q', fen: position([
      { square: 'h1', color: 'r', type: 'k' }, { square: 'a11', color: 'b', type: 'k' },
      { square: 'd7', color: 'r', type: 'p' },
    ]),
  },
  { id: 'special', kind: 'info' },
  { id: 'elimination', kind: 'info' },
  { id: 'finish', kind: 'quiz', choices: ['draw', 'no'], answer: 'draw' },
];
