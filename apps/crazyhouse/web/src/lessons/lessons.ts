import { type Lesson, type Unit } from '@chaturanga/game-shell';
import { START_FEN } from '@chaturanga/crazyhouse';

const l10n = (en: string) => ({ en });

/** Original, interactive lessons for the selected online-server rules of Crazyhouse. */
export const UNITS: Unit[] = [
  {
    id: 'first-life',
    title: l10n('The first life'),
    lessons: [
      {
        id: 'welcome',
        icon: 'p',
        title: l10n('A piece can return'),
        summary: l10n('The board is familiar; the pockets change everything.'),
        xp: 20,
        steps: [
          {
            kind: 'info',
            text: l10n(
              'Crazyhouse begins as ordinary chess on an eight-by-eight board. White moves first. The pieces use their usual chess moves; captured pieces change sides and wait in your pocket.',
            ),
            fen: START_FEN,
          },
          {
            kind: 'quiz',
            text: l10n('What happens to a captured piece?'),
            choices: [
              l10n('It joins the capturer’s pocket.'),
              l10n('It disappears for the rest of the game.'),
            ],
            correct: 0,
          },
        ],
      },
      {
        id: 'piece-moves',
        icon: 'n',
        title: l10n('How the pieces travel'),
        summary: l10n('Try the knight, bishop, rook, and pawn on the board.'),
        xp: 30,
        steps: [
          {
            kind: 'info',
            text: l10n(
              'A knight hops in an L shape. Bishops travel diagonally, rooks travel along ranks and files, and queens combine those paths. Kings move one square. Pawns move forward and capture diagonally.',
            ),
          },
          {
            kind: 'squares',
            text: l10n('Tap every square this knight can move to from d4.'),
            fen: '4k3/8/8/8/3N4/8/8/4K3[] w - - 0 1',
            answer: ['b3', 'c2', 'e2', 'f3', 'f5', 'e6', 'c6', 'b5'],
            targetsOf: 'd4',
            hint: l10n('Count two squares in one direction, then one to the side.'),
          },
          {
            kind: 'squares',
            text: l10n('Tap every square this bishop can move to from d4.'),
            fen: '4k3/8/8/8/3B4/8/8/4K3[] w - - 0 1',
            answer: ['e5', 'f6', 'g7', 'h8', 'c5', 'b6', 'a7', 'e3', 'f2', 'g1', 'c3', 'b2', 'a1'],
            targetsOf: 'd4',
            hint: l10n('A bishop follows the diagonal lines until the board edge or another piece.'),
          },
          {
            kind: 'squares',
            text: l10n('Tap every square this rook can move to from d4.'),
            fen: '4k3/8/8/8/3R4/8/8/4K3[] w - - 0 1',
            answer: ['a4', 'b4', 'c4', 'e4', 'f4', 'g4', 'h4', 'd1', 'd2', 'd3', 'd5', 'd6', 'd7', 'd8'],
            targetsOf: 'd4',
            hint: l10n('A rook travels straight along its rank and file.'),
          },
          {
            kind: 'squares',
            text: l10n('This pawn is on d4. Tap the square it can move to.'),
            fen: '4k3/8/8/8/3P4/8/8/4K3[] w - - 0 1',
            answer: ['d5'],
            targetsOf: 'd4',
            hint: l10n('Pawns move forward; they do not capture on the square straight ahead.'),
          },
          {
            kind: 'quiz',
            text: l10n('Which move can a queen make?'),
            choices: [l10n('Along a rank, file, or diagonal.'), l10n('Only in an L shape.')],
            correct: 0,
          },
        ],
      },
      {
        id: 'capture',
        icon: 'r',
        title: l10n('Capture and collect'),
        summary: l10n('Take the pawn and claim your first pocket piece.'),
        xp: 20,
        steps: [
          {
            kind: 'move',
            text: l10n('White’s pawn can take the black pawn on d5. Make the capture.'),
            fen: '4k3/8/8/3p4/4P3/8/8/4K3[] w - - 0 1',
            solutions: ['e4d5'],
            hint: l10n('Move the pawn diagonally from e4 to d5.'),
            success: l10n('The pawn has changed sides. Look for it in White’s pocket below the board.'),
          },
        ],
      },
      {
        id: 'drop',
        icon: 'n',
        title: l10n('Drop a piece'),
        summary: l10n('A pocket piece enters an empty square as a move.'),
        xp: 25,
        steps: [
          {
            kind: 'move',
            text: l10n('White has a pawn in hand. Select it, then place it on e4.'),
            fen: '4k3/8/8/8/8/8/8/4K3[P] w - - 0 1',
            solutions: ['P@e4'],
            hint: l10n('Choose the pawn from the pocket, then tap an empty board square.'),
            success: l10n('A drop uses your turn. The dropped pawn is now a regular board piece.'),
          },
          {
            kind: 'info',
            text: l10n(
              'Dropped pieces can attack, block, give check, and be captured. A drop is written with an at-sign, such as N@f6.',
            ),
            fen: '4k3/8/8/8/8/8/8/4K3[PN] w - - 0 1',
          },
        ],
      },
    ],
  },
  {
    id: 'drop-craft',
    title: l10n('Drop craft'),
    lessons: [
      {
        id: 'pawn-ranks',
        icon: 'p',
        title: l10n('Pawn drop ranks'),
        summary: l10n('Pawns cannot be dropped on the first or eighth rank.'),
        xp: 20,
        steps: [
          {
            kind: 'quiz',
            text: l10n('Which square can a White pawn be dropped on?'),
            choices: [l10n('a1, on the first rank'), l10n('a4, in the middle of the board')],
            correct: 1,
            hint: l10n('A pawn needs room to move forward after it arrives.'),
          },
          {
            kind: 'info',
            text: l10n(
              'Pawns cannot be dropped on rank one or rank eight. Same-file pawns are allowed, and a pawn dropped on its own second rank can still move two squares on its first move.',
            ),
          },
        ],
      },
      {
        id: 'same-file',
        icon: 'p',
        title: l10n('Same-file pawns'),
        summary: l10n('Unlike chess, a pawn may be dropped in front of another pawn.'),
        xp: 20,
        steps: [
          {
            kind: 'move',
            text: l10n(
              'White already has a pawn on the a-file. Drop the pocket pawn on a3; this is legal in Crazyhouse.',
            ),
            fen: '4k3/8/8/8/8/8/P7/4K3[P] w - - 0 1',
            solutions: ['P@a3'],
            hint: l10n('Select the pawn in hand, then choose a3.'),
            success: l10n(
              'Both White pawns may share a file. Crazyhouse has no same-file pawn-drop restriction.',
            ),
          },
        ],
      },
      {
        id: 'drop-check',
        icon: 'b',
        title: l10n('Block a check'),
        summary: l10n('A drop can be the only way to answer a sliding attack.'),
        xp: 25,
        steps: [
          {
            kind: 'move',
            text: l10n('White’s king is checked by the rook on e8. Drop the bishop on e4 to block the file.'),
            fen: 'k3r3/8/8/8/8/8/8/4K3[B] w - - 0 1',
            solutions: ['B@e4'],
            hint: l10n('Put the bishop somewhere between the rook and king on the e-file.'),
            success: l10n(
              'Drops can answer check when they interrupt a line. A drop cannot leave your own king in check.',
            ),
          },
        ],
      },
      {
        id: 'pawn-mate',
        icon: 'q',
        title: l10n('Mate by drop'),
        summary: l10n('Pawn-drop mate is legal in Crazyhouse.'),
        xp: 25,
        steps: [
          {
            kind: 'move',
            text: l10n(
              'Find the pawn drop that checkmates Black. The king is boxed in by White’s knight, bishop, and king.',
            ),
            fen: '5N1k/8/4BK2/8/8/8/8/8[P] w - - 0 1',
            solutions: ['P@g7'],
            hint: l10n('Drop the pawn next to the black king on h8.'),
            success: l10n('That is checkmate. Crazyhouse allows a pawn drop to deliver mate.'),
          },
        ],
      },
      {
        id: 'check-and-mate',
        icon: 'k',
        title: l10n('Check, mate, and stalemate'),
        summary: l10n('Know when a king is threatened and when the game ends.'),
        xp: 25,
        steps: [
          {
            kind: 'quiz',
            text: l10n('What must you do when your king is in check?'),
            choices: [
              l10n('Make a legal move that removes the check.'),
              l10n('Keep moving another piece and ignore it.'),
            ],
            correct: 0,
            hint: l10n('Your king may not remain under attack after your move.'),
          },
          {
            kind: 'quiz',
            text: l10n('What is stalemate?'),
            choices: [
              l10n('A player has no legal move, but their king is not in check.'),
              l10n('A player has captured every piece.'),
            ],
            correct: 0,
          },
          {
            kind: 'info',
            text: l10n(
              'Checkmate ends the game with a winner. Stalemate is a draw. A player may also win by timeout or resignation; threefold repetition and the 50-move rule are draws.',
            ),
          },
        ],
      },
    ],
  },
  {
    id: 'old-and-new',
    title: l10n('Old moves, new endings'),
    lessons: [
      {
        id: 'promotion-capture',
        icon: 'q',
        title: l10n('A promoted piece is a pawn'),
        summary: l10n('When a promoted piece is captured, it returns as a pawn.'),
        xp: 25,
        steps: [
          {
            kind: 'move',
            text: l10n('The black queen on d5 is marked as promoted. Capture it with the rook from d4.'),
            fen: '4k3/8/8/3q~4/3R4/8/8/4K3[] w - - 0 1',
            solutions: ['d4d5'],
            hint: l10n('The rook on d4 can take the queen directly above it.'),
            success: l10n(
              'White receives a pawn in hand, not a queen. The ~ marker records that the queen began as a pawn.',
            ),
          },
        ],
      },
      {
        id: 'promotion-choice',
        icon: 'q',
        title: l10n('Choose a promotion'),
        summary: l10n('A pawn reaching the far rank becomes a queen, rook, bishop, or knight.'),
        xp: 25,
        steps: [
          {
            kind: 'move',
            text: l10n(
              'Move the pawn to a8 and choose what it becomes. Any of the four promotions is accepted.',
            ),
            fen: '4k3/P7/8/8/8/8/8/4K3[] w - - 0 1',
            solutions: ['a7a8q', 'a7a8r', 'a7a8b', 'a7a8n'],
            hint: l10n('A queen is powerful, but the other three choices can be useful too.'),
          },
          {
            kind: 'info',
            text: l10n(
              'Promotion is mandatory when a pawn reaches the last rank. A new piece keeps the pawn’s colour. The engine marks it as promoted so a later capture returns a pawn to hand.',
            ),
          },
        ],
      },
      {
        id: 'castling',
        icon: 'k',
        title: l10n('Castling still works'),
        summary: l10n('Use ordinary chess castling rules.'),
        xp: 20,
        steps: [
          {
            kind: 'move',
            text: l10n('The path is clear and both White castling rights remain. Castle kingside.'),
            fen: 'r3k2r/8/8/8/8/8/8/R3K2R[] w KQkq - 0 1',
            solutions: ['e1g1'],
            hint: l10n('Move the king two squares toward the rook.'),
          },
        ],
      },
      {
        id: 'en-passant',
        icon: 'p',
        title: l10n('Capture in passing'),
        summary: l10n('En passant works as in chess; the captured pawn enters your pocket.'),
        xp: 20,
        steps: [
          {
            kind: 'move',
            text: l10n('Black just advanced a pawn two squares past White’s pawn. Capture en passant on d6.'),
            fen: '4k3/8/8/3pP3/8/8/8/4K3[] w - d6 0 1',
            solutions: ['e5d6'],
            hint: l10n('Move the white pawn diagonally to the empty d6 square.'),
            success: l10n('The pawn is removed from d5 and added to White’s pocket.'),
          },
        ],
      },
      {
        id: 'draws',
        icon: 'r',
        title: l10n('Repetition and the move clock'),
        summary: l10n('Pockets and promoted pieces are part of the position.'),
        xp: 25,
        steps: [
          {
            kind: 'quiz',
            text: l10n('In Crazyhouse, does king versus king end automatically for insufficient material?'),
            choices: [
              l10n('No. The game keeps going unless another ending rule applies.'),
              l10n('Yes. It is always an automatic draw.'),
            ],
            correct: 0,
            hint: l10n('A pocket piece can change what a player is able to do next.'),
          },
          {
            kind: 'info',
            text: l10n(
              'Threefold repetition counts the full position, including pocket contents and promoted-piece markers. The 50-move rule still applies. Checkmate, stalemate, repetition, and the 50-move rule end the game.',
            ),
          },
        ],
      },
    ],
  },
];

export const ALL_LESSONS: Lesson[] = UNITS.flatMap((unit) => unit.lessons);
export const findLesson = (id: string | undefined): Lesson | undefined =>
  ALL_LESSONS.find((lesson) => lesson.id === id);
