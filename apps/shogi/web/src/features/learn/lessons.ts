import type { Lesson, Unit } from './types';

/**
 * Shogi lessons (sg-006). Every position is checked against the engine in `lessons.test.ts`: each FEN
 * parses, each move solution is legal, each `targetsOf` answer equals the engine's legal destinations,
 * each mate really mates and each ending claim matches `status()`. So the text cannot drift away from
 * packages/shogi/RULES.md.
 */

const START = 'lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL[] w - - 0 1';
/** An empty board with both kings out of the way of anything placed in the middle. */
const empty = (rows: Partial<Record<number, string>>, hands = '', side = 'w'): string => {
  const board = ['2k6', '9', '9', '9', '9', '9', '9', '9', '2K6'];
  for (const [index, row] of Object.entries(rows)) board[Number(index)] = row!;
  return `${board.join('/')}[${hands}] ${side} - - 0 1`;
};

const board: Lesson = {
  id: 'board',
  icon: 'board',
  title: { ja: '盤と駒', en: 'The board and the pieces' },
  summary: { ja: '九×九の升目、先手と後手', en: 'Nine by nine, Sente and Gote' },
  xp: 10,
  steps: [
    {
      kind: 'info',
      fen: START,
      text: {
        ja: '将棋盤は九×九の升目です。駒は升の中に置きます。手前が先手、向こうが後手。先手から指します。',
        en: 'A Shogi board is nine squares by nine. Pieces stand inside the squares. You are Sente at the bottom and move first; your opponent is Gote.',
      },
    },
    {
      kind: 'info',
      fen: START,
      highlight: ['a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7', 'i7'],
      text: {
        ja: '駒はどちらの色も同じ形です。自分の駒は自分から見て前を向いています。向こう三段が敵陣で、そこに入ると駒は成ることができます。',
        en: 'Both sides use the same pieces: a piece belongs to whoever it points at. The three far ranks are the enemy camp, where a piece may promote.',
      },
    },
    {
      kind: 'squares',
      fen: START,
      answer: ['a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3', 'i3'],
      text: { ja: '先手の歩を九枚とも選んでください。', en: "Tap all nine of Sente's pawns." },
      hint: { ja: '歩は自陣の三段目に並んでいます。', en: 'They stand in a row on the third rank.' },
    },
  ],
};

const king: Lesson = {
  id: 'king',
  icon: 'k',
  title: { ja: '王将', en: 'The King' },
  summary: { ja: 'どこへでも一升', en: 'One square in any direction' },
  xp: 10,
  steps: [
    {
      kind: 'info',
      fen: empty({ 4: '4K4', 8: '9' }),
      highlight: ['d4', 'd5', 'd6', 'e4', 'e6', 'f4', 'f5', 'f6'],
      text: {
        ja: '王将は縦横斜めに一升動きます。取られたら負けなので、まず王を囲うのが将棋の基本です。',
        en: 'The King moves one square in any of the eight directions. Losing it loses the game, so most openings begin by building a castle around it.',
      },
    },
    {
      kind: 'squares',
      fen: empty({ 4: '4K4', 8: '9' }),
      targetsOf: 'e5',
      answer: ['d4', 'd5', 'd6', 'e4', 'e6', 'f4', 'f5', 'f6'],
      text: { ja: '王将が動ける升を選んでください。', en: 'Tap every square the King can move to.' },
    },
  ],
};

const gold: Lesson = {
  id: 'gold',
  icon: 'g',
  title: { ja: '金将', en: 'The Gold' },
  summary: { ja: '斜め後ろにだけ行けない', en: 'Everywhere but diagonally backwards' },
  xp: 10,
  steps: [
    {
      kind: 'squares',
      fen: empty({ 4: '4G4' }),
      targetsOf: 'e5',
      answer: ['d5', 'd6', 'e4', 'e6', 'f5', 'f6'],
      text: { ja: '金将が動ける升を選んでください。', en: 'Tap every square the Gold can move to.' },
      hint: { ja: '斜め後ろの二つだけは行けません。', en: 'Everything but the two squares diagonally behind it.' },
    },
    {
      kind: 'info',
      fen: empty({ 4: '4G4' }),
      text: {
        ja: '金将は成れません。その代わり、歩・香・桂・銀が成るとこの金と同じ動きになります。',
        en: 'A Gold never promotes. In return, a promoted pawn, lance, knight or silver all move exactly like this.',
      },
    },
  ],
};

const silver: Lesson = {
  id: 'silver',
  icon: 's',
  title: { ja: '銀将', en: 'The Silver' },
  summary: { ja: '前と斜め四方', en: 'Forward and the four diagonals' },
  xp: 10,
  steps: [
    {
      kind: 'squares',
      fen: empty({ 4: '4S4' }),
      targetsOf: 'e5',
      answer: ['d4', 'd6', 'e6', 'f4', 'f6'],
      text: { ja: '銀将が動ける升を選んでください。', en: 'Tap every square the Silver can move to.' },
      hint: { ja: '真横と真後ろには行けません。', en: 'It cannot step sideways or straight back.' },
    },
    {
      kind: 'info',
      fen: empty({ 4: '4S4' }),
      text: {
        ja: '銀は斜め後ろに引けるので、金より攻めに向きます。成ると成銀になり、金と同じ動きになります。',
        en: 'A Silver can come back diagonally, which makes it the better attacker; a Gold is the better defender. Promoted, it moves as a Gold.',
      },
    },
  ],
};

const knight: Lesson = {
  id: 'knight',
  icon: 'n',
  title: { ja: '桂馬', en: 'The Knight' },
  summary: { ja: '前にだけ跳ねる', en: 'It only jumps forward' },
  xp: 10,
  steps: [
    {
      kind: 'squares',
      fen: empty({ 4: '4N4' }),
      targetsOf: 'e5',
      answer: ['d7', 'f7'],
      text: { ja: '桂馬が跳べる升を選んでください。', en: 'Tap every square the Knight can jump to.' },
      hint: { ja: '二つ前の、左右ひとつずつ。間の駒は飛び越えます。', en: 'Two forward and one to the side, jumping over anything between.' },
    },
    {
      kind: 'info',
      fen: empty({ 1: '4N4' }),
      text: {
        ja: '桂馬は戻れません。敵陣の一番奥や、その一つ手前に進むと動けなくなるので、そこへ行くときは必ず成ります。',
        en: 'A Knight can never come back. On the last two ranks it would have no move at all, so a Knight that lands there always promotes.',
      },
    },
  ],
};

const lance: Lesson = {
  id: 'lance',
  icon: 'l',
  title: { ja: '香車', en: 'The Lance' },
  summary: { ja: 'まっすぐ前へどこまでも', en: 'Straight forward, any distance' },
  xp: 10,
  steps: [
    {
      kind: 'squares',
      fen: empty({ 4: '4L4' }),
      targetsOf: 'e5',
      answer: ['e6', 'e7', 'e8', 'e9'],
      text: { ja: '香車が動ける升を選んでください。', en: 'Tap every square the Lance can move to.' },
      hint: { ja: '前だけ。横にも後ろにも動けません。', en: 'Forward only: never sideways, never back.' },
    },
    {
      kind: 'info',
      fen: empty({ 4: '4L4', 2: '4p4' }),
      text: {
        ja: '香車は駒を飛び越えられません。前に駒があれば、そこで止まるか、相手の駒なら取ります。',
        en: 'A Lance cannot jump. It stops in front of a piece, or takes it if it belongs to the opponent.',
      },
    },
  ],
};

const pawn: Lesson = {
  id: 'pawn',
  icon: 'p',
  title: { ja: '歩兵', en: 'The Pawn' },
  summary: { ja: '一升前へ、取り方も同じ', en: 'One square forward, and it takes the same way' },
  xp: 10,
  steps: [
    {
      kind: 'squares',
      fen: empty({ 4: '4P4' }),
      targetsOf: 'e5',
      answer: ['e6'],
      text: { ja: '歩が動ける升を選んでください。', en: 'Tap the square the Pawn can move to.' },
    },
    {
      kind: 'info',
      fen: empty({ 4: '4P4', 3: '4p4' }),
      text: {
        ja: '歩はチェスと違い、前の駒をそのまま取ります。斜めには取りません。成ると「と金」になり、金と同じ動きです。',
        en: 'Unlike chess, a Shogi pawn takes the piece straight in front of it, not diagonally. Promoted it becomes a tokin and moves as a Gold.',
      },
    },
  ],
};

const rook: Lesson = {
  id: 'rook',
  icon: 'r',
  title: { ja: '飛車', en: 'The Rook' },
  summary: { ja: '縦横にどこまでも', en: 'Any distance along a rank or file' },
  xp: 15,
  steps: [
    {
      kind: 'squares',
      fen: empty({ 4: '4R4' }),
      targetsOf: 'e5',
      answer: [
        'a5',
        'b5',
        'c5',
        'd5',
        'e1',
        'e2',
        'e3',
        'e4',
        'e6',
        'e7',
        'e8',
        'e9',
        'f5',
        'g5',
        'h5',
        'i5',
      ],
      text: { ja: '飛車が動ける升を選んでください。', en: 'Tap every square the Rook can move to.' },
    },
    {
      kind: 'info',
      fen: empty({ 3: '4+R4' }),
      text: {
        ja: '飛車が成ると竜王です。飛車の動きに加えて、斜めにも一升動けます。将棋で一番強い駒です。',
        en: 'A promoted Rook is a Dragon: everything the Rook does, plus one step diagonally. It is the strongest piece on the board.',
      },
    },
  ],
};

const bishop: Lesson = {
  id: 'bishop',
  icon: 'b',
  title: { ja: '角行', en: 'The Bishop' },
  summary: { ja: '斜めにどこまでも', en: 'Any distance along a diagonal' },
  xp: 15,
  steps: [
    {
      kind: 'squares',
      fen: empty({ 4: '4B4' }),
      targetsOf: 'e5',
      answer: [
        'a1',
        'a9',
        'b2',
        'b8',
        'c3',
        'c7',
        'd4',
        'd6',
        'f4',
        'f6',
        'g3',
        'g7',
        'h2',
        'h8',
        'i1',
        'i9',
      ],
      text: { ja: '角行が動ける升を選んでください。', en: 'Tap every square the Bishop can move to.' },
    },
    {
      kind: 'info',
      fen: empty({ 3: '4+B4' }),
      text: {
        ja: '角が成ると竜馬です。斜めに加えて縦横にも一升動けるので、盤上のどの升にも届くようになります。',
        en: 'A promoted Bishop is a Horse: the diagonals plus one step up, down or sideways, so it can reach any square on the board.',
      },
    },
  ],
};

const promotion: Lesson = {
  id: 'promotion',
  icon: 'promote',
  title: { ja: '成り', en: 'Promotion' },
  summary: { ja: '敵陣に入ったら裏返せる', en: 'Turn the piece over in the enemy camp' },
  xp: 15,
  steps: [
    {
      kind: 'info',
      fen: empty({ 3: '4S4' }),
      highlight: ['e7', 'e8', 'e9'],
      text: {
        ja: '向こうの三段が敵陣です。敵陣に入る手、敵陣から出る手、敵陣の中で指す手では、成るかどうかを選べます。',
        en: 'The three far ranks are the enemy camp. A move into it, out of it, or inside it may promote — you choose.',
      },
    },
    {
      kind: 'move',
      fen: empty({ 3: '4S4' }),
      solutions: ['e6e7+'],
      text: {
        ja: '銀を敵陣に進めて成ってください。成銀は金と同じ動きになります。',
        en: 'Move the Silver into the enemy camp and promote it. A promoted Silver moves as a Gold.',
      },
      hint: { ja: '一つ前に進み、「成る」を選びます。', en: 'Step forward one square and answer yes.' },
    },
    {
      kind: 'move',
      fen: empty({ 1: '4P4' }),
      solutions: ['e8e9+'],
      text: {
        ja: '歩が一番奥に進むときは必ず成ります。動けない駒を作らないためです。',
        en: 'A pawn reaching the last rank must promote: the rules never let you leave a piece that can never move again.',
      },
    },
  ],
};

const drops: Lesson = {
  id: 'drops',
  icon: 'drop',
  title: { ja: '持ち駒を打つ', en: 'Pieces in hand' },
  summary: { ja: '取った駒は自分の駒になる', en: 'A captured piece changes sides' },
  xp: 20,
  steps: [
    {
      kind: 'info',
      fen: empty({}, 'GS'),
      text: {
        ja: '取った駒は自分の持ち駒になります。手番では、盤の駒を動かす代わりに、持ち駒を空いている升に打てます。これが将棋のいちばんの特徴です。',
        en: 'A piece you capture becomes yours. On your turn you may drop one from hand onto an empty square instead of moving. This is what makes Shogi its own game.',
      },
    },
    {
      kind: 'move',
      fen: empty({}, 'G'),
      solutions: ['G@c8'],
      text: {
        ja: '持ち駒の金を、相手の玉の前 c8 に打ってください。打った駒は成らずに置かれます。',
        en: "Drop the Gold from hand on c8, right in front of the enemy King. A dropped piece always arrives unpromoted.",
      },
      hint: { ja: '下の持ち駒を選んでから升を選びます。', en: 'Tap the piece in the tray, then the square.' },
    },
    {
      kind: 'info',
      fen: empty({ 1: '4N4' }, 'N'),
      text: {
        ja: '打てない升もあります。二度と動けなくなる升には打てません。歩と香は一番奥、桂は奥の二段に打てません。',
        en: 'Some squares are closed to a drop: a piece may not be dropped where it could never move again — a pawn or lance on the last rank, a knight on the last two.',
      },
    },
  ],
};

const nifu: Lesson = {
  id: 'nifu',
  icon: 'rule',
  title: { ja: '二歩と打ち歩詰め', en: 'Two pawns, and the pawn-drop mate' },
  summary: { ja: '歩を打つときの二つの禁じ手', en: 'The two things a dropped pawn may never do' },
  xp: 20,
  steps: [
    {
      kind: 'info',
      fen: empty({ 4: '4P4' }, 'P'),
      highlight: ['e1', 'e2', 'e3', 'e4', 'e6', 'e7', 'e8'],
      text: {
        ja: '二歩：自分の歩がいる筋には、もう一枚歩を打てません。成った歩（と金）は数えません。',
        en: 'Nifu: you may not drop a pawn onto a file where you already have an unpromoted pawn. A promoted pawn does not count.',
      },
    },
    {
      kind: 'quiz',
      fen: empty({ 4: '4P4' }, 'P'),
      text: {
        ja: 'e筋にはすでに自分の歩がいます。そこにもう一枚打てますか。',
        en: 'You already have a pawn on the e-file. May you drop another one there?',
      },
      choices: [
        { ja: '打てる', en: 'Yes' },
        { ja: '二歩だから打てない', en: 'No — that is nifu' },
      ],
      correct: 1,
    },
    {
      kind: 'quiz',
      fen: empty({}, 'P'),
      text: {
        ja: '打ち歩詰め：歩を打ってそのまま詰ますことはできません。ほかの駒ならできます。',
        en: 'Uchifuzume: a dropped pawn may not deliver checkmate. Any other piece may, and a pawn that only gives check is fine.',
      },
      choices: [
        { ja: '歩を打って詰ますのは反則', en: 'Dropping a pawn for mate is illegal' },
        { ja: '歩でも詰ましてよい', en: 'A pawn may mate like any other piece' },
      ],
      correct: 0,
    },
  ],
};

const checkmate: Lesson = {
  id: 'checkmate',
  icon: 'mate',
  title: { ja: '王手と詰み', en: 'Check and checkmate' },
  summary: { ja: '逃げ道をすべて塞ぐ', en: 'Take away every escape' },
  xp: 20,
  steps: [
    {
      kind: 'info',
      fen: empty({ 0: '2k6', 2: '2G6' }),
      text: {
        ja: '玉が取られる形を王手といいます。王手をかけられたら、必ず受けなければいけません。受けられない王手が詰みです。',
        en: 'A move that attacks the King is check. You must answer a check; when there is no answer, it is checkmate and the game ends.',
      },
    },
    {
      kind: 'move',
      fen: '4k4/9/4G4/R8/9/9/9/9/4K4[] w - - 0 1',
      solutions: ['a6a9'],
      text: {
        ja: '金が玉の前の三升を押さえています。飛車を一番奥の段に走らせて詰ましてください。',
        en: 'The Gold covers the three squares in front of the King. Run the Rook to the last rank and mate.',
      },
      hint: { ja: '玉と同じ段に飛車を回します。', en: 'Bring the Rook onto the rank the King stands on.' },
    },
    {
      kind: 'quiz',
      fen: '4k4/9/4G4/R8/9/9/9/9/4K4[] w - - 0 1',
      text: {
        ja: 'この飛車を九段目に走らせると、玉はどこへも逃げられません。これを何といいますか。',
        en: 'After that Rook move the King has nowhere to go. What is that called?',
      },
      choices: [
        { ja: '王手', en: 'Check' },
        { ja: '詰み', en: 'Checkmate' },
      ],
      correct: 1,
      verify: { fen: '4k4/9/4G4/R8/9/9/9/9/4K4[] w - - 0 1', moves: ['a6a9'], kind: 'checkmate', winner: 'w' },
    },
    {
      kind: 'quiz',
      fen: 'k8/9/NG7/9/9/9/9/9/8K[] b - - 0 1',
      text: {
        ja: '後手の番ですが、王手ではなく、指せる手が一つもありません。どうなりますか。',
        en: 'It is Gote to move, not in check, and with no legal move at all. What happens?',
      },
      choices: [
        { ja: '引き分け', en: 'The game is a draw' },
        { ja: '指す手がない側の負け', en: 'The side with no move loses' },
      ],
      correct: 1,
      verify: { fen: 'k8/9/NG7/9/9/9/9/9/8K[] b - - 0 1', moves: [], kind: 'stalemate', winner: 'w' },
    },
  ],
};

const sennichite: Lesson = {
  id: 'sennichite',
  icon: 'repeat',
  title: { ja: '千日手', en: 'Sennichite' },
  summary: { ja: '同じ局面が四回で引き分け', en: 'The same position four times' },
  xp: 20,
  steps: [
    {
      kind: 'quiz',
      fen: '4k4/9/9/9/9/9/9/1R7/4K4[] w - - 0 1',
      text: {
        ja: '同じ局面が四回現れました。持ち駒も手番も同じです。結果は？',
        en: 'The same position — same board, same hands, same side to move — has now come up four times. The result is…',
      },
      choices: [
        { ja: '引き分け（千日手）', en: 'A draw (sennichite)' },
        { ja: '先に繰り返した側の負け', en: 'The side that repeated first loses' },
      ],
      correct: 0,
      verify: {
        fen: '4k4/9/9/9/9/9/9/1R7/4K4[] w - - 0 1',
        moves: ['b2c2', 'e9d9', 'c2b2', 'd9e9', 'b2c2', 'e9d9', 'c2b2', 'd9e9', 'b2c2', 'e9d9', 'c2b2', 'd9e9'],
        kind: 'repetition',
      },
    },
    {
      kind: 'quiz',
      fen: '4k4/9/9/9/9/9/9/9/R3K4[] w - - 0 1',
      text: {
        ja: '先手が王手をかけ続けて千日手になりました。結果は？',
        en: 'This time one side gave check on every move of the cycle. The result is…',
      },
      choices: [
        { ja: '引き分け', en: 'A draw' },
        { ja: '王手を続けた側の負け', en: 'The side that kept checking loses' },
      ],
      correct: 1,
      verify: {
        fen: '4k4/9/9/9/9/9/9/9/R3K4[] w - - 0 1',
        moves: ['a1a9', 'e9f8', 'a9a8', 'f8e9', 'a8a9', 'e9f8', 'a9a8', 'f8e9', 'a8a9', 'e9f8', 'a9a8', 'f8e9', 'a8a9'],
        kind: 'perpetual-check',
        winner: 'b',
      },
    },
  ],
};

const mates: Lesson = {
  id: 'mates',
  icon: 'crown',
  title: { ja: '詰ましてみる', en: 'Finishing the game' },
  summary: { ja: '持ち駒を使った基本の詰み', en: 'Basic mates, with a piece from hand' },
  xp: 25,
  steps: [
    {
      kind: 'move',
      fen: '4k4/9/4G4/9/9/9/9/9/R3K4[] w - - 0 1',
      solutions: ['a1a9'],
      text: {
        ja: '金が玉の周りを押さえています。飛車を敵陣の一番奥に走らせて詰ましてください。',
        en: 'The Gold holds the squares around the King. Run the Rook to the last rank and mate.',
      },
      hint: { ja: '一段目から九段目へ、まっすぐ上がります。', en: 'Straight up the a-file.' },
    },
    {
      kind: 'move',
      fen: '4k4/9/4G4/9/9/9/9/9/4K4[R] w - - 0 1',
      // Not d9 or f9: next to the King, it would simply be taken.
      solutions: ['R@a9', 'R@b9', 'R@c9', 'R@g9', 'R@h9', 'R@i9'],
      text: {
        ja: '今度は持ち駒の飛車で詰ましてください。打った駒でも詰ますことはできます（歩だけは例外です）。',
        en: 'Now mate by dropping the Rook from hand. A dropped piece may deliver mate — only a pawn may not.',
      },
      hint: { ja: '玉の段に飛車を打ちます。', en: 'Drop it on the rank the King stands on.' },
    },
  ],
};

export const UNITS: Unit[] = [
  { id: 'board', title: { ja: '盤', en: 'The board' }, lessons: [board] },
  {
    id: 'pieces',
    title: { ja: '駒の動き', en: 'The pieces' },
    lessons: [king, gold, silver, knight, lance, pawn, rook, bishop],
  },
  {
    id: 'rules',
    title: { ja: '将棋ならではの決まり', en: 'What makes Shogi Shogi' },
    lessons: [promotion, drops, nifu, checkmate, sennichite],
  },
  { id: 'mates', title: { ja: '寄せ', en: 'Winning' }, lessons: [mates] },
];

export const ALL_LESSONS: Lesson[] = UNITS.flatMap((u) => u.lessons);

export function findLesson(id: string | undefined): Lesson | undefined {
  return ALL_LESSONS.find((l) => l.id === id);
}
