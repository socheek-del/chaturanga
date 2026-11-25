import { type Lesson, type Unit } from '@chaturanga/game-shell';
import { START_FEN } from '@chaturanga/jesonmor';

const l10n = (en: string) => ({ en });

/** Original interactive exercises for the selected 9×9 Jeson Mor rules. */
export const UNITS: Unit[] = [
  {
    id: 'the-race',
    title: l10n('The race begins'),
    lessons: [
      {
        id: 'welcome',
        icon: 'e',
        title: l10n('A race to the center'),
        summary: l10n('Meet the board, the horses, and the two ways to win.'),
        xp: 20,
        steps: [
          { kind: 'info', text: l10n('Jeson Mor uses a nine-by-nine board. Each player has nine identical horses on a home rank. Horses jump like chess knights; there are no kings or checks.'), fen: START_FEN },
          { kind: 'quiz', text: l10n('Which goal can win a Jeson Mor game?'), choices: [l10n('Capture every opposing horse, or complete the center escape.'), l10n('Check the opposing king.')], correct: 0, hint: l10n('There are no kings in this game.') },
        ],
      },
      {
        id: 'knight-leap',
        icon: 'n',
        title: l10n('The horse leaps'),
        summary: l10n('Jump over a blocker and capture at the landing square.'),
        xp: 25,
        steps: [
          { kind: 'info', text: l10n('Every horse moves exactly like a chess knight: two squares in one direction, then one to the side. It jumps over any pieces in between and may capture an opposing horse where it lands.') },
          { kind: 'move', text: l10n('From c3, jump over the horse on c4 and capture the horse on d5.'), fen: '9/9/9/9/3n5/2N6/2N6/9/8n w - - 0 1 -', solutions: ['c3d5'], hint: l10n('The horse leaps; the piece on c4 does not block it.'), success: l10n('A knight move ignores the squares it passes over. Captures happen only on the landing square.') },
        ],
      },
    ],
  },
  {
    id: 'center-square',
    title: l10n('The center attempt'),
    lessons: [
      {
        id: 'reach-e5',
        icon: 'e',
        title: l10n('Reach e5'),
        summary: l10n('The center starts a challenge; it does not win yet.'),
        xp: 25,
        steps: [
          { kind: 'move', text: l10n('Move the horse from c4 to the marked center square e5.'), fen: '8n/9/9/9/9/2N6/9/9/N8 w - - 0 1 -', solutions: ['c4e5'], hint: l10n('From c4, a knight can jump two files right and one rank up.'), success: l10n('Reaching e5 starts the center attempt. The other player now gets one reply.') },
          { kind: 'info', text: l10n('The horse on e5 can be captured. If it survives the reply, the same horse must move away from e5 on its next turn to win.'), fen: '8n/9/9/9/4N4/2n6/9/9/N8 b - - 1 1 w' },
        ],
      },
      {
        id: 'capture-center',
        icon: 'x',
        title: l10n('The center can be challenged'),
        summary: l10n('A reply may capture the horse that reached e5.'),
        xp: 25,
        steps: [
          { kind: 'move', text: l10n('Use the Black horse on c4 to capture the vulnerable horse on e5.'), fen: '8n/9/9/9/4N4/2n6/9/9/N8 b - - 1 1 w', solutions: ['c4e5'], hint: l10n('A knight can capture on e5 in one jump from c4.'), success: l10n('Capturing the claimant cancels that center attempt. The game continues if it was not the last White horse.') },
        ],
      },
      {
        id: 'escape-center',
        icon: '↗',
        title: l10n('Leave e5 to win'),
        summary: l10n('The same horse must escape after the reply.'),
        xp: 30,
        steps: [
          { kind: 'move', text: l10n('The opponent has replied. Move the same horse from e5 to f7 to complete the center escape.'), fen: '8n/9/9/9/4N4/2N6/9/9/N8 w - - 2 2 w', solutions: ['e5f7'], hint: l10n('Only moving the horse that claimed e5 completes this win.'), success: l10n('The horse left e5 on its next turn. White wins immediately.') },
        ],
      },
    ],
  },
  {
    id: 'endings',
    title: l10n('Endings and conventions'),
    lessons: [
      {
        id: 'capture-all',
        icon: '×',
        title: l10n('Capture every opposing horse'),
        summary: l10n('Taking the last opposing horse wins at once.'),
        xp: 25,
        steps: [
          { kind: 'move', text: l10n('Capture the last Black horse to win by elimination.'), fen: '9/9/9/9/3n5/9/2N6/9/N8 w - - 0 1 -', solutions: ['c3d5'], hint: l10n('The only Black horse is on d5.'), success: l10n('Capturing all opposing horses wins, even without reaching the center.') },
        ],
      },
      {
        id: 'draw-and-no-moves',
        icon: 'i',
        title: l10n('Draws and no legal move'),
        summary: l10n('Learn the digital endings added for online play.'),
        xp: 25,
        steps: [
          { kind: 'quiz', text: l10n('If the player to move has no legal move, what is the result in this digital edition?'), choices: [l10n('That player loses.'), l10n('That player wins automatically.')], correct: 0, hint: l10n('The game uses a no-legal-move loss convention.') },
          { kind: 'quiz', text: l10n('What happens after the same position occurs three times?'), choices: [l10n('The game is drawn.'), l10n('The first player wins.')], correct: 0, hint: l10n('Repetition is a digital draw convention.') },
          { kind: 'info', text: l10n('There is no 50-move rule. These digital endings make online games definite; the traditional sources reviewed do not specify them.') },
        ],
      },
    ],
  },
];

export const ALL_LESSONS: Lesson[] = UNITS.flatMap((unit) => unit.lessons);
export const findLesson = (id: string | undefined): Lesson | undefined =>
  ALL_LESSONS.find((lesson) => lesson.id === id);
