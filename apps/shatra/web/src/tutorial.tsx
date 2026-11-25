import { type Lesson, storageKey } from '@chaturanga/game-shell';
import { LessonPlayer } from '@chaturanga/game-shell/ui';
import { RANKS, FILES, isPlayable, shatra, square } from '@chaturanga/shatra';
import { useNavigate } from 'react-router';
import { PRODUCT } from '../product.config';
import { useBoardIdentity } from './board';

const text = (en: string) => ({ en });
export const tutorialKey = storageKey(PRODUCT, 'tutorial.stars');

type LessonPiece = readonly [square: string, color: 'w' | 'b', type: 'k' | 's' | 'b'];
function position(pieces: readonly LessonPiece[], turn: 'w' | 'b' = 'w'): string {
  const cells = Array.from({ length: FILES * RANKS }, () => '');
  for (const [name, color, type] of pieces) cells[square(name)] = color === 'w' ? type.toUpperCase() : type;
  const rows: string[] = [];
  for (let rank = RANKS - 1; rank >= 0; rank--) {
    let row = '';
    let empty = 0;
    for (let file = 0; file < FILES; file++) {
      const sq = rank * FILES + file;
      if (!isPlayable(sq)) {
        empty++;
        continue;
      }
      const piece = cells[sq];
      if (!piece) {
        empty++;
        continue;
      }
      if (empty) row += String(empty);
      empty = 0;
      row += piece;
    }
    rows.push(row + (empty || ''));
  }
  return `${rows.join('/')} ${turn} - 0 1`;
}

const biy = position([['d4', 'w', 'k'], ['d11', 'b', 'k']]);
const reserve = position([['d4', 'w', 'k'], ['d11', 'b', 'k'], ['c3', 'w', 's']]);
const capture = position([['d4', 'w', 'k'], ['d11', 'b', 'k'], ['d6', 'w', 's'], ['e7', 'b', 's']]);
const route = position([
  ['d4', 'w', 'k'], ['g10', 'b', 'k'], ['d9', 'w', 's'],
  ['c9', 'b', 's'], ['e9', 'b', 's'], ['c10', 'b', 's'], ['e10', 'b', 's'],
]);
const promotion = position([['d4', 'w', 'k'], ['d11', 'b', 'k'], ['d13', 'w', 's']]);
const batyr = position([['d4', 'w', 'k'], ['d11', 'b', 'k'], ['c6', 'w', 'b']]);

export const tutorial: Lesson = {
  id: 'first-game', icon: 'gate', xp: 15, title: text('Learn Altai Shatra'),
  summary: text('Read the 62-field board, move the Biy and Shatras, use the fortresses, and promote a Batyr.'),
  steps: [
    { kind: 'info', text: text('Altai Shatra is played on 62 fields: a 7×6 main board, two 3×3 fortresses and a gate for each side. White moves first. The Biy is the objective; there is no check.'), fen: shatra.startFen },
    { kind: 'move', text: text('A Shatra steps forward, forward-diagonal or sideways. Move the White Shatra from a6 to a7.'), fen: shatra.startFen, solutions: ['a6a7'], hint: text('White advances toward the far fortress. This Shatra has a clear forward step.') },
    { kind: 'move', text: text('The Biy moves one step in any direction. Step from the gate at d4 to e5.'), fen: biy, solutions: ['d4e5'], hint: text('The Biy can move to any adjacent playable field.') },
    { kind: 'info', text: text('Nine Shatras begin in each fortress as reserves. From your gate or fortress, deploy a reserve onto any empty field in your half of the main board. A reserve Shatra cannot make a quiet move inside its fortress.'), fen: reserve },
    { kind: 'move', text: text('Deploy the reserve Shatra from c3 onto the open field a7.'), fen: reserve, solutions: ['c3a7'], hint: text('Select the Shatra in the lower fortress, then the empty field a7.') },
    { kind: 'move', text: text('A Shatra captures by jumping an adjacent enemy to the empty field beyond it. Captures are required. Jump from d6 over the enemy on e7 to f8.'), fen: capture, solutions: ['d6f8'], hint: text('The capture landing field is two steps away in the same direction.') },
    { kind: 'move', text: text('Choose a capture route. Both routes reach the Black gate at d11; a capture chain may stop there.'), fen: route, solutions: ['d9b9d11'], hint: text('Move the Shatra from d9 to d11. When the route chooser appears, take the path through b9.') },
    { kind: 'info', text: text('A Shatra that moves sideways cannot reverse direction on its very next turn. Move any other piece for that side first to clear the restriction. A Shatra captures in any direction, including backward.'), fen: shatra.startFen },
    { kind: 'info', text: text('The Biy may stop its own capture chain anywhere. If it has a capture, you must move the Biy that turn. A Shatra or Batyr may also stop on a gate; the gate grants a capture choice on a later turn.'), fen: capture },
    { kind: 'move', text: text('Reach the marked field in the opposing fortress to promote. Move the Shatra from d13 to d14; it becomes a Batyr.'), fen: promotion, solutions: ['d13d14b'], hint: text('The far fortress has three promotion fields for each side.') },
    { kind: 'move', text: text('A Batyr slides along clear ranks, files and diagonals. Move the Batyr from c6 to c10.'), fen: batyr, solutions: ['c6c10'], hint: text('A clear file can be crossed in one move.') },
    { kind: 'info', text: text('Capture the opposing Biy to win. A player who has no legal move also loses. Threefold repetition and 100 quiet plies are digital draw limits.'), fen: shatra.startFen },
    { kind: 'quiz', text: text('Your Shatra can capture an enemy. What must you do?'), choices: [text('Make a capture'), text('Choose any quiet move')], correct: 0, hint: text('Captures are compulsory, with the Biy and gate exceptions.') },
    { kind: 'quiz', text: text('What ends the game immediately?'), choices: [text('Capturing the opposing Biy'), text('Moving a Batyr into the centre')], correct: 0, hint: text('The Biy is the target. Check is not used in this game.') },
  ],
};

export function Tutorial() {
  const navigate = useNavigate();
  const board = useBoardIdentity();
  const finish = (stars: number) => {
    localStorage.setItem(tutorialKey, String(stars));
    navigate('/');
  };
  return <LessonPlayer {...board} variant={shatra} lesson={tutorial} translate={(translation) => translation.en!}
    onExit={() => navigate('/')} onFinish={finish} />;
}
