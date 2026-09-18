import type { Lesson, LessonStep, Unit } from './types';

/**
 * Chess lessons (ch-006). Every position is checked against the engine in `lessons.test.ts`: each FEN
 * parses, each move solution is legal, each `targetsOf` answer equals the engine's legal destinations, each
 * mate really mates and each ending claim matches `status()`. So the text cannot drift away from
 * packages/chess/RULES.md.
 *
 * Shape of a piece lesson: **show, then ask**. The first step lights up the squares the piece can reach and
 * says what it does; only then does the lesson ask the learner to tap them. Every question also carries a
 * hint, which the lesson player offers on a button before the answer is checked.
 */

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

/** An empty board with both kings tucked into opposite corners, out of the way of anything in the middle. */
const empty = (rows: Partial<Record<number, string>>, side = 'w'): string => {
  const board = ['k7', '8', '8', '8', '8', '8', '8', '7K'];
  for (const [index, row] of Object.entries(rows)) board[Number(index)] = row!;
  return `${board.join('/')} ${side} - - 0 1`;
};

/** One piece alone on e5: a step that lights up where it can go, then the same position as a question. */
function pieceSteps(fen: string, from: string, squares: string[], teach: string, hint: string): LessonStep[] {
  return [
    { kind: 'info', fen, highlight: squares, text: { en: teach } },
    {
      kind: 'squares',
      fen,
      targetsOf: from,
      answer: squares,
      text: { en: `Now tap every square the piece on ${from} can move to.` },
      hint: { en: hint },
    },
  ];
}

const board: Lesson = {
  id: 'board',
  icon: 'board',
  title: { en: 'The board' },
  summary: { en: 'Sixty-four squares, two armies' },
  xp: 10,
  steps: [
    {
      kind: 'info',
      fen: START,
      text: {
        en: 'A chess board is eight squares by eight, light and dark. You play White at the bottom and move first; your opponent plays Black.',
      },
    },
    {
      kind: 'info',
      fen: START,
      highlight: ['a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2'],
      text: {
        en: 'Your eight pawns stand in a row in front of everything else — the squares lit up here. Behind them stand the pieces.',
      },
    },
    {
      kind: 'info',
      fen: START,
      highlight: ['d1', 'e1', 'd8', 'e8'],
      text: {
        en: 'The king and the queen stand next to each other in the middle. The queen starts on her own colour: the white queen on a light square, the black queen on a dark one.',
      },
    },
    {
      kind: 'squares',
      fen: START,
      answer: ['a1', 'h1'],
      text: { en: 'Tap both of your rooks — the pieces in the corners.' },
      hint: { en: 'The two corner squares on your side: a1 and h1.' },
    },
  ],
};

const king: Lesson = {
  id: 'king',
  icon: 'k',
  title: { en: 'The king' },
  summary: { en: 'One square in any direction' },
  xp: 10,
  steps: [
    ...pieceSteps(
      empty({ 3: '4K3', 7: '8' }),
      'e5',
      ['d4', 'd5', 'd6', 'e4', 'e6', 'f4', 'f5', 'f6'],
      'The king moves one square in any of the eight directions. The whole game is about him: when he is attacked and cannot escape, the game is over.',
      'All eight squares around him.',
    ),
    {
      kind: 'info',
      fen: empty({ 3: '4K3', 7: '8' }),
      text: { en: 'A king may never move onto a square where he would be attacked, and the two kings can never stand next to each other.' },
    },
  ],
};

const queen: Lesson = {
  id: 'queen',
  icon: 'q',
  title: { en: 'The queen' },
  summary: { en: 'Any distance, any line' },
  xp: 10,
  steps: pieceSteps(
    empty({ 3: '4Q3' }),
    'e5',
    [
      'e1', 'e2', 'e3', 'e4', 'e6', 'e7', 'e8',
      'a5', 'b5', 'c5', 'd5', 'f5', 'g5', 'h5',
      'f6', 'g7', 'h8', 'd6', 'c7', 'b8',
      'f4', 'g3', 'h2', 'd4', 'c3', 'b2', 'a1',
    ],
    'The queen is the strongest piece: she moves any distance along a rank, a file or a diagonal, until something blocks her.',
    'Every square in a straight line from her — twenty-seven of them on an empty board.',
  ),
};

const rook: Lesson = {
  id: 'rook',
  icon: 'r',
  title: { en: 'The rook' },
  summary: { en: 'Straight lines only' },
  xp: 10,
  steps: [
    ...pieceSteps(
      empty({ 3: '4R3' }),
      'e5',
      ['e1', 'e2', 'e3', 'e4', 'e6', 'e7', 'e8', 'a5', 'b5', 'c5', 'd5', 'f5', 'g5', 'h5'],
      'The rook moves any distance along a rank or a file, never diagonally.',
      'The whole file and the whole rank it stands on — fourteen squares.',
    ),
    {
      kind: 'info',
      fen: 'k7/8/8/8/8/8/8/4R2K w - - 0 1',
      text: { en: 'Rooks are strongest on open files and on the seventh rank, where they cut the enemy king off.' },
    },
  ],
};

const bishop: Lesson = {
  id: 'bishop',
  icon: 'b',
  title: { en: 'The bishop' },
  summary: { en: 'Diagonals, and one colour forever' },
  xp: 10,
  steps: [
    ...pieceSteps(
      empty({ 3: '4B3' }),
      'e5',
      ['f6', 'g7', 'h8', 'd6', 'c7', 'b8', 'f4', 'g3', 'h2', 'd4', 'c3', 'b2', 'a1'],
      'The bishop moves any distance along a diagonal. It never changes the colour of square it stands on.',
      'The four diagonals out of e5 — thirteen squares, all the same colour.',
    ),
    {
      kind: 'info',
      fen: START,
      highlight: ['c1', 'f1'],
      text: { en: 'That is why you start with two: one for the light squares, one for the dark. A pair of bishops is worth a little more than the sum of them.' },
    },
  ],
};

const knight: Lesson = {
  id: 'knight',
  icon: 'n',
  title: { en: 'The knight' },
  summary: { en: 'The only jumper' },
  xp: 10,
  steps: [
    ...pieceSteps(
      empty({ 3: '4N3' }),
      'e5',
      ['d7', 'f7', 'c6', 'g6', 'c4', 'g4', 'd3', 'f3'],
      'The knight moves two squares in a line and one across — an L. It is the only piece that jumps: nothing in between can block it.',
      'Eight squares, none of them next to the knight.',
    ),
    {
      kind: 'info',
      fen: empty({ 7: 'N6K' }),
      highlight: ['b3', 'c2'],
      text: { en: 'A knight in the corner reaches only two squares, and one in the middle reaches eight. Knights belong in the centre.' },
    },
  ],
};

const pawn: Lesson = {
  id: 'pawn',
  icon: 'p',
  title: { en: 'The pawn' },
  summary: { en: 'Forward to move, across to take' },
  xp: 10,
  steps: [
    ...pieceSteps(
      'k7/8/8/8/8/8/4P3/7K w - - 0 1',
      'e2',
      ['e3', 'e4'],
      'A pawn steps one square forward — or two, but only from its starting row. It can never move backwards.',
      'One step, or the double step from its own row.',
    ),
    {
      kind: 'info',
      fen: 'k7/8/8/3p1p2/4P3/8/8/7K w - - 0 1',
      highlight: ['d5', 'f5'],
      text: { en: 'A pawn takes differently from the way it moves: one square diagonally forward. A piece straight ahead simply blocks it.' },
    },
    {
      kind: 'move',
      fen: 'k7/8/8/3p1p2/4P3/8/8/7K w - - 0 1',
      solutions: ['e4d5', 'e4f5'],
      text: { en: 'Take one of the black pawns.' },
      hint: { en: 'Tap the pawn on e4, then a black pawn on the diagonal in front of it.' },
    },
  ],
};

const castling: Lesson = {
  id: 'castling',
  icon: 'castle',
  title: { en: 'Castling' },
  summary: { en: 'Two pieces, one move' },
  xp: 15,
  steps: [
    {
      kind: 'info',
      fen: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1',
      highlight: ['e1', 'g1', 'c1'],
      text: {
        en: 'Once the squares between the king and a rook are empty, the two can move together. The king steps two squares towards the rook, and the rook jumps over him to the other side.',
      },
    },
    {
      kind: 'move',
      fen: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R3K2R w KQkq - 0 1',
      solutions: ['e1g1'],
      text: { en: 'Castle on the king side: tap the king, then g1.' },
      hint: { en: 'The king moves two squares to the right; the rook lands beside him on f1.' },
      success: { en: 'That is O-O, castling short. The king is tucked away and the rook is ready for the middle.' },
    },
    {
      kind: 'info',
      fen: 'r3k2r/pppppppp/8/8/8/8/PPPPPPPP/R4RK1 b kq - 1 1',
      text: {
        en: 'Castling is off when the king or that rook has already moved, when a piece is in the way, and while the king is in check, passes through an attacked square, or would land on one.',
      },
    },
    {
      kind: 'quiz',
      fen: '4k3/8/8/8/8/8/8/R3K2R w KQ - 0 1',
      text: { en: 'White has both rooks and both rights. How many ways can this king castle?' },
      choices: [{ en: 'None' }, { en: 'One' }, { en: 'Two: king side and queen side' }],
      correct: 2,
      hint: { en: 'Look at both corners: nothing is in the way on either side.' },
    },
  ],
};

const enPassant: Lesson = {
  id: 'enpassant',
  icon: 'p',
  title: { en: 'Capture in passing' },
  summary: { en: 'The pawn move that looks impossible' },
  xp: 15,
  steps: [
    {
      kind: 'info',
      fen: 'k7/3p4/8/4P3/8/8/8/7K b - - 0 1',
      highlight: ['d7', 'd5'],
      text: {
        en: 'Black is about to play the pawn from d7 two squares, right past your pawn on e5. That double step is not a way to escape you.',
      },
    },
    {
      kind: 'info',
      fen: 'k7/8/8/3pP3/8/8/8/7K w - d6 0 2',
      highlight: ['d6'],
      text: {
        en: 'Your pawn may take it as if it had only stepped one square: you move to d6 and the pawn on d5 comes off. This is the capture in passing — and it is only allowed on the very next move.',
      },
    },
    {
      kind: 'move',
      fen: 'k7/8/8/3pP3/8/8/8/7K w - d6 0 2',
      solutions: ['e5d6'],
      text: { en: 'Take the pawn in passing.' },
      hint: { en: 'Tap your pawn on e5, then the empty square d6 behind the black pawn.' },
      success: { en: 'Written exd6. The black pawn is gone even though your pawn never stood on d5.' },
    },
    {
      kind: 'quiz',
      text: { en: 'You did not take straight away and played a different move. Can you still take in passing next move?' },
      choices: [{ en: 'Yes, any time later' }, { en: 'No — the chance is gone' }],
      correct: 1,
      hint: { en: 'It is the one move in chess with a deadline.' },
    },
  ],
};

const promotion: Lesson = {
  id: 'promotion',
  icon: 'q',
  title: { en: 'Promotion' },
  summary: { en: 'A pawn that crosses becomes a piece' },
  xp: 15,
  steps: [
    {
      kind: 'info',
      fen: '7k/1P6/8/8/8/8/8/K7 w - - 0 1',
      highlight: ['b8'],
      text: { en: 'A pawn that reaches the far row turns into a queen, a rook, a bishop or a knight — your choice, and you may have more than one queen.' },
    },
    {
      kind: 'move',
      fen: '7k/1P6/8/8/8/8/8/K7 w - - 0 1',
      solutions: ['b7b8q', 'b7b8r', 'b7b8b', 'b7b8n'],
      text: { en: 'Push the pawn through and pick a piece.' },
      hint: { en: 'Tap the pawn, then b8 — the site asks which piece you want.' },
      success: { en: 'Almost always a queen. The others are called under-promotion.' },
    },
    {
      kind: 'move',
      fen: '8/k1P5/8/K7/8/8/8/8 w - - 0 1',
      solutions: ['c7c8r'],
      text: {
        en: 'Here a new queen would leave Black with no legal move at all — stalemate, and only half a point. Promote to a rook instead and the win stays.',
      },
      hint: { en: 'Tap the pawn, then c8, and choose the rook.' },
      success: { en: 'That is why under-promotion exists.' },
    },
  ],
};

const check: Lesson = {
  id: 'check',
  icon: 'check',
  title: { en: 'Check and checkmate' },
  summary: { en: 'Attack the king, and cut off the escape' },
  xp: 20,
  steps: [
    {
      kind: 'info',
      fen: '6k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1',
      text: {
        en: 'A king under attack is in check, and the player must get out of it: move the king, block the line, or take the attacker. If none of those is possible, it is checkmate and the game is over.',
      },
    },
    {
      kind: 'move',
      fen: '6k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1',
      solutions: ['d1d8'],
      text: { en: 'The black king is hemmed in by his own pawns. Mate him with the rook.' },
      hint: { en: 'Run the rook up the d-file to the last row.' },
      success: { en: 'The back-rank mate: the king has no square, no block and no capture.' },
      verify: { fen: '6k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1', moves: ['d1d8'], kind: 'checkmate', winner: 'w' },
    },
    {
      kind: 'quiz',
      fen: '6k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1',
      text: { en: 'What would save Black from that mate before it comes?' },
      choices: [{ en: 'Moving a pawn in front of the king, to open an escape square' }, { en: 'Nothing can' }],
      correct: 0,
      hint: { en: 'The king needs a hole in his own wall.' },
    },
  ],
};

const stalemate: Lesson = {
  id: 'stalemate',
  icon: 'draw',
  title: { en: 'Stalemate' },
  summary: { en: 'No move, no check, no winner' },
  xp: 20,
  steps: [
    {
      kind: 'info',
      fen: '7k/8/8/3K1Q2/8/8/8/8 w - - 0 1',
      text: {
        en: 'If the player to move is not in check but has no legal move at all, the game is a draw. A winning position can be thrown away this way.',
      },
    },
    {
      kind: 'move',
      fen: '7k/8/8/3K1Q2/8/8/8/8 w - - 0 1',
      solutions: ['f5f7'],
      text: { en: 'Play the queen to f7 and see what happens to Black.' },
      hint: { en: 'Tap the queen, then f7 — right next to the king, but not attacking him.' },
      success: { en: 'Stalemate: Black is not in check, and every square is covered. Half a point each.' },
      verify: { fen: '7k/8/8/3K1Q2/8/8/8/8 w - - 0 1', moves: ['f5f7'], kind: 'stalemate' },
    },
    {
      kind: 'move',
      fen: '7k/8/8/3K1Q2/8/8/8/8 w - - 0 1',
      solutions: ['d5e6'],
      text: { en: 'Now do it properly: bring the king closer instead, and keep the win.' },
      hint: { en: 'The king walks to e6; the mate follows next move.' },
    },
  ],
};

const draws: Lesson = {
  id: 'draws',
  icon: 'draw',
  title: { en: 'The other draws' },
  summary: { en: 'Repetition, fifty moves, too little material' },
  xp: 20,
  steps: [
    {
      kind: 'info',
      fen: '4k3/8/8/8/8/8/8/4KB2 w - - 0 1',
      text: {
        en: 'A king and one bishop, or a king and one knight, cannot force mate. When neither side has enough material, the game is a draw on the spot.',
      },
      verify: { fen: '4k3/8/8/8/8/8/8/4KB2 w - - 0 1', moves: [], kind: 'insufficient-material' },
    },
    {
      kind: 'info',
      fen: '4k3/8/8/8/8/8/R7/4K2R w - - 99 60',
      text: {
        en: 'Fifty moves by each side with no capture and no pawn move also end the game as a draw. On this site the game simply ends — you never have to claim it.',
      },
      verify: { fen: '4k3/8/8/8/8/8/R7/4K2R w - - 99 60', moves: ['a2a3'], kind: 'fifty-move' },
    },
    {
      kind: 'info',
      fen: '4k3/8/8/8/8/8/R7/4K2R w - - 0 1',
      text: { en: 'And if the same position appears three times, with the same player to move, that is a draw by repetition.' },
      verify: {
        fen: '4k3/8/8/8/8/8/R7/4K2R w - - 0 1',
        moves: ['h1h2', 'e8f8', 'h2h1', 'f8e8', 'h1h2', 'e8f8', 'h2h1', 'f8e8'],
        kind: 'repetition',
      },
    },
    {
      kind: 'quiz',
      text: { en: 'You are a rook up but cannot see a mate, and the same position keeps coming back. What is the result?' },
      choices: [{ en: 'You win on material' }, { en: 'A draw — material does not decide a game' }],
      correct: 1,
      hint: { en: 'Only mate, resignation, time or a draw rule ever ends a game.' },
    },
  ],
};

const tactics: Lesson = {
  id: 'tactics',
  icon: 'fork',
  title: { en: 'Forks, pins and skewers' },
  summary: { en: 'Attack two things at once' },
  xp: 25,
  steps: [
    {
      kind: 'info',
      fen: '2r1k3/8/8/8/4N3/6K1/8/8 w - - 0 1',
      highlight: ['c8', 'e8'],
      text: { en: 'A fork attacks two pieces with one. The knight is the great forker, because nothing it attacks can attack it back.' },
    },
    {
      kind: 'move',
      fen: '2r1k3/8/8/8/4N3/6K1/8/8 w - - 0 1',
      solutions: ['e4d6'],
      text: { en: 'Fork the king and the rook with the knight.' },
      hint: { en: 'Find the knight square that gives check and hits c8 at the same time.' },
      success: { en: 'Black must answer the check, and then the rook falls.' },
    },
    {
      kind: 'info',
      fen: '3k4/8/8/3r4/8/8/8/3R2K1 w - - 0 1',
      text: {
        en: 'A pin is the other way round: a piece cannot move because something more valuable stands behind it. Here the black rook on d5 is pinned to its king and cannot leave the file.',
      },
    },
    {
      kind: 'quiz',
      fen: '3k4/8/8/3r4/8/8/8/3R2K1 w - - 0 1',
      text: { en: 'Why is the pinned rook stuck?' },
      choices: [{ en: 'Moving it would put its own king in check, which is never legal' }, { en: 'Pinned pieces are frozen by rule' }],
      correct: 0,
      hint: { en: 'There is no special rule — it follows from the rule about check.' },
    },
  ],
};

const endings: Lesson = {
  id: 'endings',
  icon: 'crown',
  title: { en: 'Two endings to know' },
  summary: { en: 'King and queen, king and rook' },
  xp: 25,
  steps: [
    {
      kind: 'info',
      fen: '7k/8/6K1/5Q2/8/8/8/8 w - - 0 1',
      text: {
        en: 'King and queen against a bare king is the first ending to learn: push the king to the edge with the queen, bring your own king up, then mate.',
      },
    },
    {
      kind: 'move',
      fen: '7k/8/6K1/5Q2/8/8/8/8 w - - 0 1',
      solutions: ['f5f8'],
      text: { en: 'Your king already covers g7 and h7. Find the queen move that mates.' },
      hint: { en: 'Along the last row, where the king cannot reach her.' },
      verify: { fen: '7k/8/6K1/5Q2/8/8/8/8 w - - 0 1', moves: ['f5f8'], kind: 'checkmate', winner: 'w' },
    },
    {
      kind: 'info',
      fen: '7k/8/6K1/8/8/8/8/R7 w - - 0 1',
      text: {
        en: 'With a rook it takes longer: the rook cuts the king off, your king walks up, and the two of them squeeze him against the edge. This is the ladder.',
      },
    },
    {
      kind: 'move',
      fen: '7k/8/6K1/8/8/8/8/R7 w - - 0 1',
      solutions: ['a1a8'],
      text: { en: 'The kings stand opposite each other. Deliver the ladder mate with the rook.' },
      hint: { en: 'Swing the rook to the last row.' },
      success: { en: 'That shape — king facing king, rook alongside — is the mate to remember.' },
      verify: { fen: '7k/8/6K1/8/8/8/8/R7 w - - 0 1', moves: ['a1a8'], kind: 'checkmate', winner: 'w' },
    },
  ],
};

const openings: Lesson = {
  id: 'openings',
  icon: 'board',
  title: { en: 'Starting a game well' },
  summary: { en: 'Centre, pieces, king' },
  xp: 20,
  steps: [
    {
      kind: 'info',
      fen: START,
      highlight: ['d4', 'e4', 'd5', 'e5'],
      text: { en: 'Three rules carry most openings. First: take space in the middle — the four squares lit up here are worth more than any others.' },
    },
    {
      kind: 'move',
      fen: START,
      solutions: ['e2e4', 'd2d4'],
      text: { en: 'Open with a centre pawn.' },
      hint: { en: 'Push the pawn in front of your king or your queen two squares.' },
    },
    {
      kind: 'info',
      fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
      text: { en: 'Second: bring out knights and bishops before queen and rooks, and do not move the same piece twice for no reason.' },
    },
    {
      kind: 'move',
      fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
      solutions: ['g1f3', 'b1c3', 'f1c4', 'f1b5', 'f1e2'],
      text: { en: 'Develop a knight or a bishop.' },
      hint: { en: 'Any knight or bishop move off the back row will do.' },
      success: { en: 'Third rule: castle early, and your opening is done.' },
    },
  ],
};

export const UNITS: Unit[] = [
  { id: 'board', title: { en: 'The board' }, lessons: [board] },
  { id: 'pieces', title: { en: 'The pieces' }, lessons: [king, queen, rook, bishop, knight, pawn] },
  { id: 'special', title: { en: 'The special moves' }, lessons: [castling, enPassant, promotion] },
  { id: 'ending', title: { en: 'How a game ends' }, lessons: [check, stalemate, draws] },
  { id: 'playing', title: { en: 'Playing well' }, lessons: [tactics, endings, openings] },
];

export const ALL_LESSONS: Lesson[] = UNITS.flatMap((unit) => unit.lessons);

export function findLesson(id: string | undefined): Lesson | undefined {
  return ALL_LESSONS.find((lesson) => lesson.id === id);
}
