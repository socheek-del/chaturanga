import { type Lesson, storageKey } from '@chaturanga/game-shell';
import { LessonPlayer } from '@chaturanga/game-shell/ui';
import { acedrex } from '@chaturanga/acedrex';
import { useNavigate } from 'react-router';
import { PRODUCT } from '../product.config';
import { useBoardIdentity } from './board';

const text = (en: string) => ({ en });
export const tutorialKey = storageKey(PRODUCT, 'tutorial.stars');

export const tutorial: Lesson = {
  id: 'first-game', icon: 'aanca', xp: 10, title: text('Learn Grande Acedrex'),
  summary: text('Practice the bent moves, king leap and file-based promotions.'),
  steps: [
    { kind: 'info', text: text('Grande Acedrex is played on twelve files and twelve ranks. The pawns start on the fourth rank from each player’s side. White moves first.'), fen: acedrex.startFen },
    { kind: 'move', text: text('The Aanca starts with a diagonal step and can turn outward in a straight line. Move from f1 to j2 through g2.'), fen: acedrex.startFen, solutions: ['f1j2'], hint: text('The turn at g2 takes you along rank two.') },
    { kind: 'move', text: text('The Unicornio starts with a knight leap and can continue diagonally outward. Move from c1 to f3 via e2.'), fen: acedrex.startFen, solutions: ['c1f3'], hint: text('After the knight leap to e2, continue one square diagonally.') },
    { kind: 'move', text: text('The lion leaps three squares straight or three in one direction and one across. Try b1 to e2.'), fen: acedrex.startFen, solutions: ['b1e2'], hint: text('Jump three files right and one rank up.') },
    { kind: 'move', text: text('The giraffe leaps three squares in one direction and two across. Try d1 to g3.'), fen: acedrex.startFen, solutions: ['d1g3'], hint: text('Jump three files right and two ranks up.') },
    { kind: 'move', text: text('The king normally steps one square. On its first move it can leap two squares straight or diagonally. Leap from g1 to g3.'), fen: acedrex.startFen, solutions: ['g1g3'], hint: text('Select g3, two squares up.') },
    { kind: 'info', text: text('The crocodile slides diagonally. The rook slides straight. Pawns move one square straight and capture one square diagonally forward.'), fen: acedrex.startFen },
    { kind: 'move', text: text('Promotion matches the piece that originally occupied the destination file. On the king’s file it becomes an Aanca. Advance the g-pawn to rank twelve.'), fen: '11k/6P5/7p4/12/12/12/12/12/12/12/12/K11 w - - 0 1', solutions: ['g11g12a'], hint: text('Choose g11 and then g12.') },
    { kind: 'move', text: text('You can win by checkmate. Slide the rook from d1 to d12 to cover the king’s last escape.'), fen: '11k/10pp/12/12/12/12/12/12/12/12/12/K2R8 w - - 0 1', solutions: ['d1d12'], hint: text('Follow the d-file to the top of the board.') },
    { kind: 'quiz', text: text('Your opponent has no moves and their king is safe. Who wins?'), choices: [text('Your opponent'), text('You'), text('Neither player')], correct: 1, hint: text('Stalemating the opponent wins in Grande Acedrex.') },
    { kind: 'quiz', text: text('You capture your opponent’s last piece beside the king. What happens?'), choices: [text('You win'), text('Play continues until checkmate')], correct: 0, hint: text('Baring your opponent’s king ends the game.') },
  ],
};

export function Tutorial() {
  const navigate = useNavigate();
  const board = useBoardIdentity();
  const finish = (stars: number) => {
    localStorage.setItem(tutorialKey, String(stars));
    navigate('/');
  };
  return <LessonPlayer {...board} variant={acedrex} lesson={tutorial} translate={(translation) => translation.en!}
    onExit={() => navigate('/')} onFinish={finish} />;
}
