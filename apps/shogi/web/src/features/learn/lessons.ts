import type { Lesson, LessonStep, Unit } from './types';

/**
 * Shogi lessons (sg-006). Every position is checked against the engine in `lessons.test.ts`: each FEN
 * parses, each move solution is legal, each `targetsOf` answer equals the engine's legal destinations,
 * each mate really mates and each ending claim matches `status()`. So the text cannot drift away from
 * packages/shogi/RULES.md.
 *
 * Shape of a piece lesson: **show, then ask**. The first step lights up the squares the piece can reach and
 * says what it does; only then does the lesson ask the learner to tap them. Every question also carries a
 * hint, which the lesson player offers on a button before the answer is checked (plat-014).
 */

const START = 'lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL[] w - - 0 1';
/** An empty board with both kings out of the way of anything placed in the middle. */
const empty = (rows: Partial<Record<number, string>>, hands = '', side = 'w'): string => {
  const board = ['2k6', '9', '9', '9', '9', '9', '9', '9', '2K6'];
  for (const [index, row] of Object.entries(rows)) board[Number(index)] = row!;
  return `${board.join('/')}[${hands}] ${side} - - 0 1`;
};

/**
 * One piece alone on e5: first a step that lights up where it can go and explains it, then the same
 * position as a question. Nobody is asked for a move they have not been shown.
 */
function pieceSteps(
  fen: string,
  squares: string[],
  teach: { ja: string; en: string },
  hint: { ja: string; en: string },
): LessonStep[] {
  return [
    { kind: 'info', fen, highlight: squares, text: teach },
    {
      kind: 'squares',
      fen,
      targetsOf: 'e5',
      answer: squares,
      text: {
        ja: 'では、e5の駒が動ける升をすべて選んでください。',
        en: 'Now tap every square the piece on e5 can move to.',
      },
      hint,
    },
  ];
}

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
      kind: 'info',
      fen: START,
      highlight: ['a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3', 'i3'],
      text: {
        ja: '先手の歩は三段目に九枚並んでいます。光っている升がそれです。',
        en: "Sente's nine pawns stand in a row on the third rank — the squares lit up here.",
      },
    },
    {
      kind: 'squares',
      fen: START,
      answer: ['a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3', 'i3'],
      text: { ja: '先手の歩を九枚とも選んでください。', en: "Tap all nine of Sente's pawns." },
      hint: {
        ja: '手前から三段目に、端から端まで並んでいます。',
        en: 'The third row from your side, from edge to edge.',
      },
    },
  ],
};

const king: Lesson = {
  id: 'king',
  icon: 'k',
  title: { ja: '王将', en: 'The King' },
  summary: { ja: 'どこへでも一升', en: 'One square in any direction' },
  xp: 10,
  steps: pieceSteps(
    empty({ 4: '4K4', 8: '9' }),
    ['d4', 'd5', 'd6', 'e4', 'e6', 'f4', 'f5', 'f6'],
    {
      ja: '王将は縦横斜めに一升動きます。光っている八つの升です。取られたら負けなので、まず王を囲うのが将棋の基本です。',
      en: 'The King moves one square in any of the eight directions — the squares lit up here. Losing it loses the game, so most openings begin by building a castle around it.',
    },
    { ja: '王のまわりの八升すべてです。', en: 'All eight squares around it.' },
  ),
};

const gold: Lesson = {
  id: 'gold',
  icon: 'g',
  title: { ja: '金将', en: 'The Gold' },
  summary: { ja: '斜め後ろにだけ行けない', en: 'Everywhere but diagonally backwards' },
  xp: 10,
  steps: [
    ...pieceSteps(
      empty({ 4: '4G4' }),
      ['d5', 'd6', 'e4', 'e6', 'f5', 'f6'],
      {
        ja: '金将は六升に動けます。前、斜め前、真横、そして真後ろ。斜め後ろの二升にだけ行けません。',
        en: 'The Gold reaches six squares: forward, the two forward diagonals, both sides, and straight back. Only the two squares diagonally behind it are closed.',
      },
      {
        ja: '斜め後ろの d4 と f4 以外の六升です。',
        en: 'Six squares — everything except d4 and f4, the two behind it.',
      },
    ),
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
    ...pieceSteps(
      empty({ 4: '4S4' }),
      ['d4', 'd6', 'e6', 'f4', 'f6'],
      {
        ja: '銀将は五升です。真っすぐ前と、斜め四方。真横と真後ろには行けません。',
        en: 'The Silver reaches five squares: straight forward and all four diagonals. It cannot step sideways or straight back.',
      },
      {
        ja: '前の三升と、斜め後ろの二升。真横と真後ろは選びません。',
        en: 'The three in front and the two diagonally behind — not the sides, not straight back.',
      },
    ),
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
    ...pieceSteps(
      empty({ 4: '4N4' }),
      ['d7', 'f7'],
      {
        ja: '桂馬は二つ前の、左右ひとつずつに跳びます。間の駒は飛び越えられます。後ろには戻れません。',
        en: 'The Knight jumps two squares forward and one to the side, over anything in between. It can never come back.',
      },
      { ja: '二升前の左右、二つだけです。', en: 'Only two squares: two ranks up, one file to each side.' },
    ),
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
    ...pieceSteps(
      empty({ 4: '4L4' }),
      ['e6', 'e7', 'e8', 'e9'],
      {
        ja: '香車はまっすぐ前へ、何升でも進みます。横にも後ろにも動けません。',
        en: 'The Lance slides straight forward as far as it likes. It never moves sideways or back.',
      },
      {
        ja: '同じ筋の前の升を、端まで全部です。',
        en: 'Every square straight ahead on the same file, up to the far edge.',
      },
    ),
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
    ...pieceSteps(
      empty({ 4: '4P4' }),
      ['e6'],
      {
        ja: '歩は一升前へ進みます。それだけです。将棋で一番多い駒です。',
        en: 'The Pawn moves one square straight forward. That is all it does — and there are nine of them.',
      },
      { ja: '真上の一升だけです。', en: 'Just the one square directly ahead.' },
    ),
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
    ...pieceSteps(
      empty({ 4: '4R4' }),
      ['a5', 'b5', 'c5', 'd5', 'e1', 'e2', 'e3', 'e4', 'e6', 'e7', 'e8', 'e9', 'f5', 'g5', 'h5', 'i5'],
      {
        ja: '飛車は縦にも横にも、何升でも走ります。盤の上で一番働く駒です。',
        en: 'The Rook slides any distance along its file or its rank. It is the busiest piece on the board.',
      },
      { ja: '同じ筋と同じ段の升すべて、十六升です。', en: 'The whole file and the whole rank — sixteen squares.' },
    ),
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
    ...pieceSteps(
      empty({ 4: '4B4' }),
      ['a1', 'a9', 'b2', 'b8', 'c3', 'c7', 'd4', 'd6', 'f4', 'f6', 'g3', 'g7', 'h2', 'h8', 'i1', 'i9'],
      {
        ja: '角行は斜めに、何升でも走ります。同じ色の升にしか行けないので、盤の半分しか使えません。',
        en: 'The Bishop slides any distance along the diagonals. It only ever reaches half the board.',
      },
      { ja: '四本の斜めの線を、端まで全部です。', en: 'All four diagonals, right to the edges.' },
    ),
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
        ja: 'e6の銀を一升前の e7 に進め、出てくる質問で「成る」を選んでください。成銀は金と同じ動きになります。',
        en: 'Move the Silver on e6 one square forward to e7, then answer "Promote" in the question that appears. A promoted Silver moves as a Gold.',
      },
      hint: {
        ja: 'e6 を選んでから e7 を選び、「成る」を押します。',
        en: 'Tap e6, then e7, then choose "Promote".',
      },
    },
    {
      kind: 'move',
      fen: empty({ 1: '4P4' }),
      solutions: ['e8e9+'],
      text: {
        ja: 'e8の歩を一番奥の e9 に進めてください。ここでは必ず成ります。動けない駒を作らないためです。',
        en: 'Move the Pawn on e8 to the last rank, e9. Here it must promote: the rules never let you leave a piece that can never move again.',
      },
      hint: { ja: 'e8 を選んでから e9 を選びます。質問は出ません。', en: 'Tap e8, then e9. No question this time — it promotes by itself.' },
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
        ja: '取った駒は自分の持ち駒になり、盤の下の駒台に並びます。手番では、盤の駒を動かす代わりに、持ち駒を空いている升に打てます。これが将棋のいちばんの特徴です。',
        en: 'A piece you capture becomes yours and waits on the stand below the board. On your turn you may drop one from hand onto an empty square instead of moving. This is what makes Shogi its own game.',
      },
    },
    {
      kind: 'move',
      fen: empty({}, 'G'),
      solutions: ['G@c8'],
      text: {
        ja: '駒台の金を選び、相手の玉の前 c8 に打ってください。打った駒は成らずに置かれます。',
        en: 'Tap the Gold on the stand below the board, then drop it on c8, right in front of the enemy King. A dropped piece always arrives unpromoted.',
      },
      hint: {
        ja: 'まず盤の下の駒台の金を選び、それから c8 の升を選びます。',
        en: 'First tap the Gold in the tray under the board, then tap the square c8.',
      },
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
        ja: '二歩：自分の歩がいる筋には、もう一枚歩を打てません。光っている e筋の升は、どれも持ち駒の歩を打てない升です。成った歩（と金）は数えません。',
        en: 'Nifu: you may not drop a pawn onto a file where you already have an unpromoted pawn. Every lit square on the e-file is closed to the pawn in your hand. A promoted pawn does not count.',
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
      hint: { ja: '同じ筋に自分の歩が二枚あってはいけません。', en: 'Two of your own unpromoted pawns may never share a file.' },
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
      hint: { ja: '歩だけは、打って詰ますことを許されていません。', en: 'The pawn is the one piece that may not be dropped for mate.' },
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
      kind: 'info',
      fen: '4k4/9/4G4/R8/9/9/9/9/4K4[] w - - 0 1',
      highlight: ['d8', 'e8', 'f8'],
      text: {
        ja: 'e7の金が、玉の前の三升（光っている d8・e8・f8）を押さえています。あとは九段目をふさげば逃げ道がなくなります。',
        en: 'The Gold on e7 already covers the three squares in front of the King — d8, e8 and f8, lit up here. Take the last rank away as well and the King has nowhere to go.',
      },
    },
    {
      kind: 'move',
      fen: '4k4/9/4G4/R8/9/9/9/9/4K4[] w - - 0 1',
      solutions: ['a6a9'],
      text: {
        ja: 'a6の飛車を九段目 a9 まで走らせて詰ましてください。',
        en: 'Run the Rook on a6 up to a9, the rank the King stands on, and mate.',
      },
      hint: { ja: 'a6 を選んでから a9 を選びます。', en: 'Tap a6, then a9 — the Rook takes the whole rank the King is on.' },
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
      hint: { ja: 'チェスと違い、将棋では手がなくなった側が負けます。', en: 'Unlike chess, running out of moves in Shogi is a loss, not a draw.' },
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
      hint: { ja: 'どちらも王手をかけていないので、勝ち負けはつきません。', en: 'Neither side was checking, so nobody is punished for it.' },
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
        ja: '今度は先手が王手をかけ続けて千日手になりました。結果は？',
        en: 'This time one side gave check on every move of the cycle. The result is…',
      },
      choices: [
        { ja: '引き分け', en: 'A draw' },
        { ja: '王手を続けた側の負け', en: 'The side that kept checking loses' },
      ],
      correct: 1,
      hint: { ja: '連続王手の千日手は反則負けです。', en: 'Repeating with perpetual check is a foul, and the checking side loses.' },
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
        ja: 'e7の金が玉の周りを押さえています。a1の飛車を九段目 a9 まで走らせて詰ましてください。',
        en: 'The Gold on e7 holds the squares around the King. Run the Rook on a1 up to a9 and mate.',
      },
      hint: { ja: 'a1 を選んでから a9 を選びます。', en: 'Tap a1, then a9 — straight up the file.' },
    },
    {
      kind: 'move',
      fen: '4k4/9/4G4/9/9/9/9/9/4K4[R] w - - 0 1',
      // Not d9 or f9: next to the King, the Rook would simply be taken.
      solutions: ['R@a9', 'R@b9', 'R@c9', 'R@g9', 'R@h9', 'R@i9'],
      text: {
        ja: '今度は持ち駒の飛車で詰ましてください。玉と同じ段に打てば詰みます。打った駒でも詰ますことはできます（歩だけは例外です）。',
        en: 'Now mate by dropping the Rook from hand onto the rank the King stands on. A dropped piece may deliver mate — only a pawn may not.',
      },
      hint: {
        ja: '駒台の飛車を選び、九段目の升に打ちます。玉のとなりの d9・f9 では取られてしまいます。',
        en: 'Tap the Rook in the tray, then a square on the ninth rank — but not d9 or f9, next to the King, where it would just be taken.',
      },
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
