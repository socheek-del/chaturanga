import { type Lesson, storageKey } from '@chaturanga/game-shell';
import { LessonPlayer } from '@chaturanga/game-shell/ui';
import { tamerlane } from '@chaturanga/tamerlane';
import { useNavigate } from 'react-router';
import { PRODUCT } from '../product.config';
import { useBoardIdentity } from './board';

const text = (en: string) => ({ en });
export const tutorialKey = storageKey(PRODUCT, 'tutorial.stars');

export const tutorial: Lesson = {
  id: 'first-game', icon: 'citadel', xp: 10, title: text('Learn Tamerlane Chess'),
  summary: text('Practice the pieces, royal exchanges and eleven pawns.'),
  steps: [
    { kind: 'info', text: text('The main board has eleven files and ten ranks. A citadel extends from each side. White starts. Checkmating the last opposing royal or stalemating the opponent wins.'), fen: tamerlane.startFen },
    { kind: 'move', text: text('Each pawn belongs to a piece, shown by its badge. Advance the war engine pawn from c3 to c4.'), fen: tamerlane.startFen, solutions: ['c3c4'], hint: text('Pawns move forward one square and capture diagonally.') },
    { kind: 'move', text: text('A picket slides diagonally at least two squares. Move it from d4 to f6.'), fen: '11k1/13/13/13/13/13/3B9/13/13/1K11 w - - 0 1', solutions: ['d4f6'], hint: text('The first diagonal square, e5, must be empty.') },
    { kind: 'move', text: text('A giraffe takes one diagonal step and at least three straight steps away from its start. Go from d4 to h5.'), fen: '11k1/13/13/13/13/13/3G9/13/13/1K11 w - - 0 1', solutions: ['d4h5'], hint: text('Go through e5, then three files right.') },
    { kind: 'info', text: text('Rooks and knights move as in modern chess. The elephant jumps two squares diagonally, the war engine jumps two straight, and the camel leaps three by one. The ferz steps one square diagonally and the vizier one square straight.'), fen: tamerlane.startFen },
    { kind: 'move', text: text('Once per game, a checked shah can trade places with one of its other pieces to reach safety. Exchange the shah on g2 with the rook on b1.'), fen: '11k1/6r6/13/13/13/13/13/13/6K6/1R11 w K - 0 1', solutions: ['g2b1'], hint: text('Select the shah and then select the friendly rook.') },
    { kind: 'move', text: text('A pawn becomes the piece it represents. The king pawn becomes a prince. Advance the king pawn on e9 to e10.'), fen: '11k1/4S8/13/13/13/13/13/13/13/1K11 w - - 0 1', solutions: ['e9e10h'], hint: text('Promotion is automatic. With two royals, either may be captured.') },
    { kind: 'move', text: text('The pawn of pawns waits safely after its first arrival. When it can fork two enemies, it must redeploy. Move it from b10 to f7.'), fen: '1P9k1/13/2n1n1r6/5Q7/13/13/13/13/13/2K10 w - - 0 1', solutions: ['b10f7'], hint: text('From f7, it can attack the knight on e8 and the rook on g8.') },
    { kind: 'move', text: text('When the special pawn reaches the last rank a second time, it returns to its own side. Advance from f9 to f10 and watch where it lands.'), fen: '11k1/5X7/13/13/13/13/13/13/13/1K11 w - - 0 1', solutions: ['f9f10y'], hint: text('The king pawn’s home square is g3.') },
    { kind: 'move', text: text('On its third arrival, the special pawn becomes an adventitious king. Advance it from g9 to g10.'), fen: '11k1/6Y6/13/13/13/13/13/13/13/1K11 w - - 0 1', solutions: ['g9g10t'], hint: text('This royal can guard its own citadel.') },
    { kind: 'move', text: text('A bare shah can still save a draw. Step from b9 into the opposing citadel at a9.'), fen: '11k1/1K11/13/13/13/13/13/13/13/13 w - - 0 1', solutions: ['b9a9'], hint: text('The citadel is the square extending to the left.') },
    { kind: 'move', text: text('When the shah can enter the citadel, it can trade with a lower royal once and keep playing. Select the prince at f3 and then the a9 citadel.'), fen: '11k1/1K11/13/13/13/13/13/5H7/13/13 w Q - 0 1', solutions: ['f3a9'], hint: text('The prince takes the citadel and the shah takes f3.') },
    { kind: 'quiz', text: text('Only one opposing royal remains. How can you win?'), choices: [text('Capture it'), text('Checkmate it or stalemate the opponent')], correct: 1, hint: text('The last royal is protected from direct capture.') },
    { kind: 'quiz', text: text('Which piece can enter its own citadel?'), choices: [text('The adventitious king'), text('The shah'), text('The rook')], correct: 0, hint: text('The pawn of pawns becomes the adventitious king after its third arrival.') },
  ],
};

export function Tutorial() {
  const navigate = useNavigate();
  const board = useBoardIdentity();
  const finish = (stars: number) => {
    localStorage.setItem(tutorialKey, String(stars));
    navigate('/');
  };
  return <LessonPlayer {...board} variant={tamerlane} lesson={tutorial} translate={(translation) => translation.en!}
    onExit={() => navigate('/')} onFinish={finish} />;
}
