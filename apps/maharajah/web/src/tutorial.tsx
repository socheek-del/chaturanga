import { type Lesson, storageKey } from '@chaturanga/game-shell';
import { LessonPlayer } from '@chaturanga/game-shell/ui';
import { maharajah } from '@chaturanga/maharajah';
import { useNavigate } from 'react-router';
import { PRODUCT } from '../product.config';
import { useBoardIdentity } from './board';

const text = (en: string) => ({ en });
export const tutorialKey = storageKey(PRODUCT, 'tutorial.stars');

export const tutorial: Lesson = {
  id: 'first-game', icon: 'maharajah', xp: 10, title: text('Learn Maharajah and the Sepoys'),
  summary: text('Practice the lone royal piece and learn how the army can contain it.'),
  steps: [
    { kind: 'info', text: text('White starts with one royal piece, the Maharajah. Black commands the Sepoy army. Both sides win by checkmate.'), fen: maharajah.startFen },
    { kind: 'move', text: text('The Maharajah can slide like a queen. Move straight from e1 to e4.'), fen: maharajah.startFen, solutions: ['e1e4'], hint: text('Select e1, then e4.') },
    { kind: 'move', text: text('The Maharajah can also leap like a knight. Jump from e1 to f3.'), fen: maharajah.startFen, solutions: ['e1f3'], hint: text('Go two ranks up and one file right.') },
    { kind: 'move', text: text('The Maharajah can cross attacked squares but must land safely. Slide past the rook’s attack on e4 to reach e5.'), fen: 'k7/8/8/8/r7/8/5p2/4M3 w - - 0 1', solutions: ['e1e5'], hint: text('Select e5, beyond the attacked fourth rank.') },
    { kind: 'info', text: text('The Sepoys move like the standard chess army. A pawn may move twice from its starting rank and captures diagonally. The king cannot castle.'), fen: maharajah.startFen },
    { kind: 'move', text: text('A pawn reaching the far rank remains a pawn. Move the black pawn from a2 to a1.'), fen: '4k3/8/8/8/7M/8/p7/8 b - - 0 1', solutions: ['a2a1'], hint: text('Select a2, then a1.') },
    { kind: 'move', text: text('The black king is in the corner. Slide to b6 to deliver a knight-style check and cover all the exits.'), fen: 'k7/8/8/8/8/4M3/8/8 w - - 0 1', solutions: ['e3b6'], hint: text('Slide diagonally from e3 to b6.') },
    { kind: 'quiz', text: text('The Maharajah is safe but has no legal move. What is the result?'), choices: [text('The Sepoys win'), text('It is a draw'), text('The Maharajah wins')], correct: 1, hint: text('A player with no legal move and no check is stalemated.') },
    { kind: 'quiz', text: text('How can the Sepoys checkmate the Maharajah?'), choices: [text('Use pieces together to give check and cover every safe landing square'), text('Trade every piece except the king')], correct: 0, hint: text('Remember to cover both sliding and knight destinations.') },
  ],
};

export function Tutorial() {
  const navigate = useNavigate();
  const board = useBoardIdentity();
  const finish = (stars: number) => {
    localStorage.setItem(tutorialKey, String(stars));
    navigate('/');
  };
  return <LessonPlayer {...board} variant={maharajah} lesson={tutorial} translate={(translation) => translation.en!}
    onExit={() => navigate('/')} onFinish={finish} />;
}
