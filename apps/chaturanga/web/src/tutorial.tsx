import { type Lesson, storageKey } from '@chaturanga/game-shell';
import { LessonPlayer } from '@chaturanga/game-shell/ui';
import { chaturanga } from '@chaturanga/chaturanga';
import { useNavigate } from 'react-router';
import { PRODUCT } from '../product.config';
import { useBoardIdentity } from './board';

const text = (en: string) => ({ en });
export const tutorialKey = storageKey(PRODUCT, 'tutorial.stars');

export const tutorial: Lesson = {
  id: 'first-game', icon: 'gaja', xp: 10, title: text('Learn Chaturanga'),
  summary: text('Learn the pieces and the ways to win.'),
  steps: [
    { kind: 'info', text: text('White starts, then the players alternate. Protect your raja. Checkmate or leave the opposing raja without other pieces to win.'), fen: chaturanga.startFen },
    { kind: 'move', text: text('A padati moves one square forward and captures diagonally. Move the infantry from e2 to e3.'), fen: chaturanga.startFen, solutions: ['e2e3'], hint: text('Select e2, then e3.') },
    { kind: 'move', text: text('A gaja jumps exactly two squares along a row or file. Jump over the infantry from a1 to a3.'), fen: chaturanga.startFen, solutions: ['a1a3'], hint: text('Select a1, then a3.') },
    { kind: 'move', text: text('The mantri steps one square diagonally. Move the adviser from d1 to e2.'), fen: 'brnkqnrb/pppppppp/8/8/8/4P3/PPPP1PPP/BRNQKNRB w - - 0 2', solutions: ['d1e2'], hint: text('The infantry has cleared e2.') },
    { kind: 'info', text: text('The ratha slides straight along files and ranks. The ashva jumps in an L. Your raja steps one square in any direction and must stay out of check.'), fen: chaturanga.startFen },
    { kind: 'move', text: text('Infantry reaching the far rank become mantri. Promote the pawn on e7.'), fen: '7k/4P2p/8/8/8/8/8/K7 w - - 0 1', solutions: ['e7e8q'], hint: text('Move to e8.') },
    { kind: 'move', text: text('Black has only one piece beside the raja. Take it with the ratha at d1 to win immediately.'), fen: '7k/8/8/8/8/3p4/8/K2R4 w - - 0 1', solutions: ['d1d3'], hint: text('The chariot can reach d3.') },
    { kind: 'quiz', text: text('Your opponent has no legal move and their raja is safe. Who wins?'), choices: [text('You win'), text('Your opponent wins'), text('It is a draw')], correct: 1, hint: text('The stalemated player wins in this reconstruction.') },
    { kind: 'quiz', text: text('You capture the last piece protecting the opposing raja. It could capture your last piece on its next turn. What happens?'), choices: [text('You win immediately'), text('It is a draw')], correct: 0, hint: text('The first player to bare the opposing raja wins.') },
  ],
};

export function Tutorial() {
  const navigate = useNavigate();
  const board = useBoardIdentity();
  const finish = (stars: number) => {
    localStorage.setItem(tutorialKey, String(stars));
    navigate('/');
  };
  return <LessonPlayer {...board} variant={chaturanga} lesson={tutorial} translate={(translation) => translation.en!}
    onExit={() => navigate('/')} onFinish={finish} />;
}
