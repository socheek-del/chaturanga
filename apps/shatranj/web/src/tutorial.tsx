import { type Lesson, storageKey } from '@chaturanga/game-shell';
import { LessonPlayer } from '@chaturanga/game-shell/ui';
import { shatranj } from '@chaturanga/shatranj';
import { useNavigate } from 'react-router';
import { PRODUCT } from '../product.config';
import { useBoardIdentity } from './board';

const text = (en: string) => ({ en });
export const tutorialKey = storageKey(PRODUCT, 'tutorial.stars');

export const tutorial: Lesson = {
  id: 'first-game', icon: 'alfil', xp: 10, title: text('Learn Shatranj'),
  summary: text('Learn the pieces and the ways to win.'),
  steps: [
    { kind: 'info', text: text('White starts, then the players alternate. Keep your own king safe. You win by checkmate, stalemate, or taking every opposing piece except the king.'), fen: shatranj.startFen },
    { kind: 'move', text: text('A pawn moves one square forward and captures diagonally. Move the e2 pawn forward.'), fen: shatranj.startFen, solutions: ['e2e3'], hint: text('Select e2, then e3.') },
    { kind: 'move', text: text('The alfil jumps exactly two squares diagonally. Jump from c1 over the pawn at d2.'), fen: shatranj.startFen, solutions: ['c1e3'], hint: text('Select c1, then e3.') },
    { kind: 'move', text: text('The ferz steps one square diagonally. Move it from e1 to d2.'), fen: 'rnbkqbnr/pppppppp/8/8/8/3P4/PPP1PPPP/RNBKQBNR w - - 0 2', solutions: ['e1d2'], hint: text('The pawn has cleared d2.') },
    { kind: 'info', text: text('The rook slides in straight lines. The knight jumps in an L, and the king steps one square in any direction. There is no castling.'), fen: shatranj.startFen },
    { kind: 'move', text: text('A pawn reaching the far rank becomes a ferz. Promote the pawn on e7.'), fen: '7k/4P2p/8/8/8/8/8/K7 w - - 0 1', solutions: ['e7e8q'], hint: text('Move to e8.') },
    { kind: 'move', text: text('Black has one pawn left. Take it with the rook to win by leaving the king bare.'), fen: '7k/8/8/8/8/3p4/8/K2R4 w - - 0 1', solutions: ['d1d3'], hint: text('The rook can reach d3.') },
    { kind: 'quiz', text: text('Your opponent has no legal move and is not in check. Who wins?'), choices: [text('You win'), text('Your opponent wins'), text('It is a draw')], correct: 0, hint: text('In Shatranj, stalemate is a win for the player who caused it.') },
    { kind: 'quiz', text: text('You bare the other king. It can immediately capture your last remaining piece. What is the result?'), choices: [text('You win'), text('It is a draw')], correct: 1, hint: text('Both sides would be left with only a king.') },
  ],
};

export function Tutorial() {
  const navigate = useNavigate();
  const board = useBoardIdentity();
  const finish = (stars: number) => {
    localStorage.setItem(tutorialKey, String(stars));
    navigate('/');
  };
  return <LessonPlayer {...board} variant={shatranj} lesson={tutorial} translate={(translation) => translation.en!}
    onExit={() => navigate('/')} onFinish={finish} />;
}
