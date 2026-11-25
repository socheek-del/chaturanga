import { type Lesson, type Unit } from '@chaturanga/game-shell';
import { START_FEN } from '@chaturanga/congo';

const l10n = (en: string) => ({ en });

/** Original, interactive lessons for the selected two-player 7×7 Congo rules. */
export const UNITS: Unit[] = [
  {
    id: 'meet-the-river',
    title: l10n('Meet the river'),
    lessons: [
      {
        id: 'welcome',
        icon: 'l',
        title: l10n('A game of territory'),
        summary: l10n('Meet the board, the river, and the Lion’s objective.'),
        xp: 20,
        steps: [
          {
            kind: 'info',
            text: l10n('Congo is played on a seven-by-seven board. White moves first. Each side protects its Lion inside a three-by-three castle, while the river runs across the middle.'),
            fen: START_FEN,
          },
          {
            kind: 'quiz',
            text: l10n('How does a player win?'),
            choices: [l10n('Capture the opposing Lion.'), l10n('Move a pawn to the river.')],
            correct: 0,
            hint: l10n('The Lion is the most important piece on the board.'),
          },
        ],
      },
      {
        id: 'zebra-and-elephant',
        icon: 'z',
        title: l10n('Zebra and Elephant'),
        summary: l10n('One leaps like a knight; the other moves in straight steps.'),
        xp: 25,
        steps: [
          {
            kind: 'info',
            text: l10n('The Zebra leaps in a two-by-one pattern like a chess knight. The Elephant moves one or two squares orthogonally; a two-square move leaps over the square in between.'),
          },
          {
            kind: 'squares',
            text: l10n('From d3, tap every square the Zebra can reach.'),
            fen: '6l/7/7/7/3Z3/7/L6 w - 0 1',
            answer: ['b2', 'c1', 'e1', 'f2', 'f4', 'e5', 'c5', 'b4'],
            targetsOf: 'd3',
            hint: l10n('Count two squares in one direction and one square to the side.'),
          },
        ],
      },
      {
        id: 'giraffe-and-crocodile',
        icon: 'g',
        title: l10n('Giraffe and Crocodile'),
        summary: l10n('A long leap and a river-wise swimmer.'),
        xp: 25,
        steps: [
          {
            kind: 'info',
            text: l10n('The Giraffe leaps exactly two squares in any direction. It may also step one square like a king, but only when not capturing. The Crocodile steps one square, slides toward the river along its file, and moves any distance sideways while on the river.'),
          },
          {
            kind: 'move',
            text: l10n('Guide the Crocodile from c3 into the river.'),
            fen: '6l/7/7/7/2C4/7/L6 w - 0 1',
            solutions: ['c3c4'],
            hint: l10n('The river is rank four, one step north of the Crocodile.'),
            success: l10n('Crocodiles can stay in the river without drowning. From there they can swim along the whole riverbank.'),
          },
        ],
      },
    ],
  },
  {
    id: 'crossings-and-routes',
    title: l10n('Crossings and routes'),
    lessons: [
      {
        id: 'river-deadline',
        icon: 'r',
        title: l10n('A crossing has a deadline'),
        summary: l10n('Leave the river on your next turn or the piece drowns.'),
        xp: 25,
        steps: [
          {
            kind: 'quiz',
            text: l10n('A Zebra ends its turn on the river. When must it leave?'),
            choices: [l10n('By the end of its next own turn.'), l10n('Before the opponent moves.')],
            correct: 0,
            hint: l10n('The player gets one full turn to find a way out.'),
          },
          {
            kind: 'move',
            text: l10n('The marked Elephant must escape the river now. Move it to d5.'),
            fen: '6l/7/7/3E!3/7/7/L6 w - 0 1',
            solutions: ['d4d5'],
            hint: l10n('A `!` beside the river piece means this is its leave-now turn.'),
            success: l10n('It escaped. If a non-Crocodile is still on the river after this turn, it drowns.'),
          },
          {
            kind: 'info',
            text: l10n('Only the final square of a Monkey’s complete route counts for the river deadline. The Lion cannot enter the river; the Crocodile is immune to drowning.'),
            fen: START_FEN,
          },
        ],
      },
      {
        id: 'monkey-route',
        icon: 'm',
        title: l10n('The Monkey’s capture route'),
        summary: l10n('Jump over enemy pieces and choose how far to continue.'),
        xp: 30,
        steps: [
          {
            kind: 'info',
            text: l10n('A Monkey steps one square without capturing. To capture, it jumps an adjacent enemy piece to the empty square just beyond. A route may turn and continue, but cannot capture the same piece twice. Captured pieces stay in place as blockers until the route ends.'),
          },
          {
            kind: 'move',
            text: l10n('The Monkey can jump the pawn on c3, then the pawn on e5. Make both jumps in one move.'),
            fen: '6l/7/4p2/7/2p4/1M5/L6 w - 0 1',
            solutions: ['b2d4f6'],
            hint: l10n('Land two squares beyond each pawn. The whole route is one turn.'),
            success: l10n('Both captures are part of a single Monkey move. It may stop after any capture unless it takes a Lion.'),
          },
        ],
      },
      {
        id: 'pawn-and-superpawn',
        icon: 'p',
        title: l10n('Pawn and Superpawn'),
        summary: l10n('Pawns cross forward, retreat on the far bank, and promote.'),
        xp: 30,
        steps: [
          {
            kind: 'info',
            text: l10n('A Pawn moves one square forward or captures one square diagonally forward. On the far bank it may retreat one or two squares straight backward without capturing. Reaching the last rank promotes it automatically to a Superpawn.'),
          },
          {
            kind: 'move',
            text: l10n('This White Pawn has crossed the river. Retreat two squares to c3.'),
            fen: '6l/7/2P4/7/7/7/L6 w - 0 1',
            solutions: ['c5c3'],
            hint: l10n('White moves toward rank seven; retreat goes toward rank one.'),
          },
          {
            kind: 'move',
            text: l10n('Advance the Pawn to the last rank. It becomes a Superpawn automatically.'),
            fen: '6l/P6/7/7/7/7/L6 w - 0 1',
            solutions: ['a6a7+'],
            hint: l10n('Promotion happens as soon as the Pawn reaches rank seven.'),
            success: l10n('The Superpawn keeps its forward moves, gains one-square sideways moves and captures, and may retreat one or two squares straight or diagonally anywhere.'),
          },
        ],
      },
    ],
  },
  {
    id: 'lions-and-endings',
    title: l10n('Lions and endings'),
    lessons: [
      {
        id: 'lion-capture',
        icon: 'l',
        title: l10n('The Lion leaves its castle'),
        summary: l10n('The Lion can make one special capture beyond its walls.'),
        xp: 30,
        steps: [
          {
            kind: 'info',
            text: l10n('Inside its own three-by-three castle, the Lion moves one square in any direction and captures normally. It may not leave the castle except to capture the opposing Lion along a clear file or diagonal. A Lion may enter an attacked square; Congo has no check or checkmate.'),
            fen: START_FEN,
          },
          {
            kind: 'move',
            text: l10n('The enemy Lion is directly north in the same clear file. Capture it from c1.'),
            fen: '7/7/2l4/7/7/7/2L4 w - 0 1',
            solutions: ['c1c5'],
            hint: l10n('Only a capture of the opposing Lion lets your Lion leave its castle.'),
            success: l10n('That capture wins immediately. No check warning is needed.'),
          },
        ],
      },
      {
        id: 'game-endings',
        icon: 'l',
        title: l10n('When play ends'),
        summary: l10n('Lion capture, no legal move, and the bare-Lion draw.'),
        xp: 25,
        steps: [
          {
            kind: 'quiz',
            text: l10n('A player has no legal move. What happens?'),
            choices: [l10n('That player loses.'), l10n('The game pauses until a piece is captured.')],
            correct: 0,
          },
          {
            kind: 'quiz',
            text: l10n('Only the two Lions remain, and neither can capture the other immediately. What is the result?'),
            choices: [l10n('A draw.'), l10n('The game continues until a Lion enters the river.')],
            correct: 0,
            hint: l10n('A Lion is not allowed to enter the river.'),
          },
          {
            kind: 'info',
            text: l10n('A Lion plus another piece against a bare Lion is not automatically drawn. Threefold repetition is a digital draw convention in this edition; there is no 50-move rule.'),
          },
        ],
      },
    ],
  },
];

export const ALL_LESSONS: Lesson[] = UNITS.flatMap((unit) => unit.lessons);
export const findLesson = (id: string | undefined): Lesson | undefined =>
  ALL_LESSONS.find((lesson) => lesson.id === id);
