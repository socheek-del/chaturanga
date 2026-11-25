import { type Lesson, storageKey } from '@chaturanga/game-shell';
import { LessonPlayer } from '@chaturanga/game-shell/ui';
import { hiashatar } from '@chaturanga/hiashatar';
import { useNavigate } from 'react-router';
import { PRODUCT } from '../product.config';
import { useBoardIdentity } from './board';

const text = (en: string) => ({ en });
export const tutorialKey = storageKey(PRODUCT, 'tutorial.stars');

const zone = '9k/10/10/10/10/4h5/10/10/10/K3R5 w - - 0 1';
const horse = '9k/10/10/10/10/4h5/10/2N7/10/K9 w - - 0 1';
const tripleCapture = '9k/10/10/10/10/3pP5/3p6/10/10/K9 b - e3,e4 0 1';
const promotion = '9k/4P5/10/10/10/10/10/10/10/K9 w - - 0 1';
const mate = 'k9/10/1QK7/10/10/10/10/10/10/10 w - - 0 1';

export const tutorial: Lesson = {
  id: 'first-game', icon: 'bodyguard', xp: 15, title: text('Learn Hiashatar'),
  summary: text('Learn the bodyguard zone, triple pawn steps and both en passant targets.'),
  steps: [
    { kind: 'info', text: text("Hiashatar uses ten files. White's noyan and bers exchange their usual central order. Each side has two hia between the bishops and the centre. White moves first."), fen: hiashatar.startFen },
    { kind: 'move', text: text('A pawn on its starting rank may advance one, two or three clear squares. Move the pawn from e2 all the way to e5.'), fen: hiashatar.startFen, solutions: ['e2e5'], hint: text('Choose the longest clear advance from e2.') },
    { kind: 'info', text: text('A hia moves up to two squares like a queen and protects the squares around it. An opposing sliding piece must stop as soon as it enters that zone. A piece already in the zone moves only one square.'), fen: zone },
    { kind: 'move', text: text('The rook ray reaches the first protected square at e4. Stop there.'), fen: zone, solutions: ['e1e4'], hint: text('Select the rook on e1 and the first zone square, e4.') },
    { kind: 'info', text: text('The zone belongs to its hia: your own hia does not slow your pieces. Horses ignore every hia zone and jump normally.'), fen: horse },
    { kind: 'move', text: text('Jump the horse from c3 into the zone at d5.'), fen: horse, solutions: ['c3d5'], hint: text('A horse jumps over intervening squares.') },
    { kind: 'info', text: text('A pawn entering a hia zone stops on its first protected square. When a pawn advances two or three squares, each square it passed can be an en passant target on the next turn.'), fen: hiashatar.startFen },
    { kind: 'info', text: text('After this triple advance, Black has two en passant choices. Either capture removes the pawn on e5.'), fen: tripleCapture },
    { kind: 'move', text: text('Use the nearer pawn to capture en passant on e3.'), fen: tripleCapture, solutions: ['d4e3'], hint: text('The pawn on d4 can capture onto e3.') },
    { kind: 'move', text: text('Reset and try the other target. Capture on e4 with the pawn from d5.'), fen: tripleCapture, solutions: ['d5e4'], hint: text('Both target squares remove the same pawn on e5.') },
    { kind: 'info', text: text('The hia cannot check the opposing noyan or capture it. Other pieces give check as usual. Castling is not part of Hiashatar.'), fen: zone },
    { kind: 'move', text: text('A pawn reaching the far rank promotes to a bers. Promote the pawn on e9.'), fen: promotion, solutions: ['e9e10q'], hint: text('Choose the final square e10. The bers promotion is automatic.') },
    { kind: 'move', text: text('Checkmate wins. Stalemate is a draw. Mate Black with the bers on b9.'), fen: mate, solutions: ['b8b9'], hint: text('The white noyan protects the bers on b9.') },
    { kind: 'quiz', text: text('A black hia stands next to your rook. What happens when your rook enters its zone along a clear file?'), choices: [text('It must stop on the first zone square'), text('It can slide through the whole zone')], correct: 0, hint: text('The zone slows ordinary sliders.') },
    { kind: 'quiz', text: text('Can a hia give check to the opposing noyan?'), choices: [text('Yes'), text('No')], correct: 1, hint: text('The hia protects the board but cannot check or capture the noyan.') },
  ],
};

export function Tutorial() {
  const navigate = useNavigate();
  const board = useBoardIdentity();
  const finish = (stars: number) => {
    localStorage.setItem(tutorialKey, String(stars));
    navigate('/');
  };
  return <LessonPlayer {...board} variant={hiashatar} lesson={tutorial} translate={(translation) => translation.en!}
    onExit={() => navigate('/')} onFinish={finish} />;
}
