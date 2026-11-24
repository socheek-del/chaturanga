import { type Lesson, storageKey } from '@chaturanga/game-shell';
import { LessonPlayer } from '@chaturanga/game-shell/ui';
import { courier } from '@chaturanga/courier';
import { useNavigate } from 'react-router';
import { PRODUCT } from '../product.config';
import { useBoardIdentity } from './board';

const text = (en: string) => ({ en });
export const tutorialKey = storageKey(PRODUCT, 'tutorial.stars');

export const tutorial: Lesson = {
  id: 'first-game', icon: 'courier', xp: 10, title: text('Learn Courier Chess'),
  summary: text('Practice the medieval pieces on all twelve files.'),
  steps: [
    { kind: 'info', text: text('The board has twelve files. The first moves, called joyleaps, have already advanced the corner pawns, the ferz pawn and the ferz on both sides. White moves first.'), fen: courier.startFen },
    { kind: 'move', text: text('The alfil jumps exactly two squares diagonally. Leap over the pawn from c1 to a3.'), fen: courier.startFen, solutions: ['c1a3'], hint: text('Select c1, then a3.') },
    { kind: 'move', text: text('The courier slides any distance diagonally. Slide from d1 to g4.'), fen: '11k/12/12/12/12/12/1PPP8/K1AC8 w - - 0 1', solutions: ['d1g4'], hint: text('The squares e2 and f3 are clear.') },
    { kind: 'move', text: text('The schleich takes one straight step. Move it from h1 to g1.'), fen: courier.startFen, solutions: ['h1g1'], hint: text('The opening leap left g1 empty.') },
    { kind: 'info', text: text('The sage moves one square in any direction and may be captured. The king moves the same way but must stay out of check. Rooks and knights move just as they do in modern chess.'), fen: courier.startFen },
    { kind: 'move', text: text('Pawns advance one square and capture diagonally. Reach the last rank to turn the pawn on e7 into a ferz.'), fen: '11k/4P7/12/12/12/12/12/K11 w - - 0 1', solutions: ['e7e8f'], hint: text('Select e7 and then e8. Promotion happens automatically.') },
    { kind: 'move', text: text('The ferz takes one diagonal step. Try g3 to h4.'), fen: courier.startFen, solutions: ['g3h4'], hint: text('Select h4, one diagonal step from g3.') },
    { kind: 'move', text: text('Win by checking the king when every escape is covered. Send the rook to d8 to checkmate Black.'), fen: '10k1/9ppp/12/12/12/12/12/3R4K3 w - - 0 1', solutions: ['d1d8'], hint: text('The rook can cross the entire file from d1 to d8.') },
    { kind: 'quiz', text: text('Your king is safe but you have no legal move. What is the result?'), choices: [text('You win'), text('It is a draw'), text('You lose')], correct: 1, hint: text('A player with no legal move and no check is stalemated.') },
    { kind: 'quiz', text: text('Can you advance a pawn two squares in a single turn after the opening?'), choices: [text('No'), text('Yes, from its starting rank')], correct: 0, hint: text('During free play, a pawn advances just one square.') },
  ],
};

export function Tutorial() {
  const navigate = useNavigate();
  const board = useBoardIdentity();
  const finish = (stars: number) => {
    localStorage.setItem(tutorialKey, String(stars));
    navigate('/');
  };
  return <LessonPlayer {...board} variant={courier} lesson={tutorial} translate={(translation) => translation.en!}
    onExit={() => navigate('/')} onFinish={finish} />;
}
