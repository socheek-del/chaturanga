import { type Lesson, storageKey } from '@chaturanga/game-shell';
import { LessonPlayer } from '@chaturanga/game-shell/ui';
import { shatar } from '@chaturanga/shatar';
import { useNavigate } from 'react-router';
import { PRODUCT } from '../product.config';
import { useBoardIdentity } from './board';

const text = (en: string) => ({ en });
export const tutorialKey = storageKey(PRODUCT, 'tutorial.stars');

export const tutorial: Lesson = {
  id: 'first-game', icon: 'bers', xp: 10, title: text('Learn Shatar'),
  summary: text('Practice traditional Mongolian pieces and the shak rule.'),
  steps: [
    { kind: 'info', text: text('The first two moves are d4 and d5. They have already been played. White moves next. Pawns advance one square at a time from here, and the noyan cannot castle.'), fen: shatar.startFen },
    { kind: 'move', text: text('Advance the pawn on e2 by one square.'), fen: shatar.startFen, solutions: ['e2e3'], hint: text('Select e2, then e3.') },
    { kind: 'move', text: text('The bers slides straight like a cart. Move the bers from d1 to d3.'), fen: shatar.startFen, solutions: ['d1d3'], hint: text('The opening moved the d-pawn out of the way.') },
    { kind: 'move', text: text('The bers can also step one square diagonally. Try d4 to e5.'), fen: '7k/6p1/8/8/3J4/8/8/K7 w - - 0 1', solutions: ['d4e5'], hint: text('Diagonal movement is limited to one square.') },
    { kind: 'info', text: text('The cart moves like a rook, the horse like a knight, and the camel like a bishop. A check from a cart, bers or horse counts as shak.'), fen: shatar.startFen },
    { kind: 'move', text: text('Advance the pawn to e8. It becomes a bers.'), fen: '7k/4P2p/8/8/8/8/8/K7 w - - 0 1', solutions: ['e7e8j'], hint: text('Select e7, then e8.') },
    { kind: 'move', text: text('A cart can deliver a winning mate because it gives shak. Checkmate Black with the cart from d1.'), fen: '6k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1', solutions: ['d1d8'], hint: text('Slide to d8 to cover the back rank.') },
    { kind: 'move', text: text('Your cart checked the king on the previous turn. Continue the sequence with the camel from a5 to b6.'), fen: '2R5/k7/p1K5/B7/8/8/8/8 w S - 1 2', solutions: ['a5b6'], hint: text('The earlier cart check supplies the shak for this mate.') },
    { kind: 'quiz', text: text('What happens if you deliver mate with only a horse giving check?'), choices: [text('You win'), text('You lose')], correct: 1, hint: text('Your horse can give shak but cannot give the final check by itself.') },
    { kind: 'quiz', text: text('You mate with a camel with no shak in the current uninterrupted sequence. What is the result?'), choices: [text('A draw'), text('You win')], correct: 0, hint: text('Mate without shak is a draw, called niol.') },
    { kind: 'info', text: text('Stalemate is a draw. Either side being reduced to a bare noyan also draws the game.'), fen: shatar.startFen },
  ],
};

export function Tutorial() {
  const navigate = useNavigate();
  const board = useBoardIdentity();
  const finish = (stars: number) => {
    localStorage.setItem(tutorialKey, String(stars));
    navigate('/');
  };
  return <LessonPlayer {...board} variant={shatar} lesson={tutorial} translate={(translation) => translation.en!}
    onExit={() => navigate('/')} onFinish={finish} />;
}
