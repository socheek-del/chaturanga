import type { Lesson, Unit } from './types';

/**
 * Xiangqi lessons (xq-006). Every position is checked against the engine in `lessons.test.ts`: each FEN
 * parses, each move solution is legal, each `targetsOf` answer equals the engine's legal destinations,
 * each mate really mates and each ending claim matches `status()`. So the text cannot drift away from
 * packages/xiangqi/RULES.md.
 */

const START = 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1';
const YES = { 'zh-Hans': '可以', en: 'Yes' };
const NO = { 'zh-Hans': '不可以', en: 'No' };

const board: Lesson = {
  id: 'board',
  icon: 'board',
  title: { 'zh-Hans': '认识棋盘', en: 'Meet the board' },
  summary: { 'zh-Hans': '交叉点、河界和九宫', en: 'Points, the river and the palaces' },
  xp: 10,
  steps: [
    {
      kind: 'info',
      fen: START,
      text: {
        'zh-Hans': '象棋的棋子放在线的交叉点上，不是格子里。棋盘有九条竖线、十条横线。红方在下，先走。',
        en: 'Xiangqi pieces stand on the points where lines cross, not inside squares. The board has 9 files and 10 ranks. Red sits at the bottom and moves first.',
      },
    },
    {
      kind: 'info',
      fen: START,
      highlight: ['d1', 'e1', 'f1', 'd2', 'e2', 'f2', 'd3', 'e3', 'f3'],
      text: {
        'zh-Hans': '中间画着斜线的方框叫九宫。帅和仕只能在自己的九宫里走。棋盘中间的空白是河界：楚河、汉界。',
        en: 'The box with the diagonal lines is the palace: the General and its Advisors never leave it. The empty band across the middle is the river.',
      },
    },
    {
      kind: 'squares',
      fen: START,
      answer: ['a4', 'c4', 'e4', 'g4', 'i4'],
      text: { 'zh-Hans': '点出红方的五个兵。', en: "Tap Red's five Soldiers." },
      hint: { 'zh-Hans': '兵站在河界前面的一排上。', en: 'They stand on the rank just before the river.' },
    },
  ],
};

const general: Lesson = {
  id: 'general',
  icon: 'k',
  title: { 'zh-Hans': '帅（将）', en: 'The General' },
  summary: { 'zh-Hans': '在九宫里一步一步走', en: 'One step at a time, inside the palace' },
  xp: 10,
  steps: [
    {
      kind: 'info',
      fen: '5k3/9/9/9/9/9/9/9/4K4/9 w - - 0 1',
      highlight: ['d2', 'e1', 'e3', 'f2'],
      text: {
        'zh-Hans': '帅每次沿线走一步，上下左右都可以，但不能走出九宫。',
        en: 'The General moves one point along a line, up, down or sideways, and never leaves the palace.',
      },
    },
    {
      kind: 'squares',
      fen: '5k3/9/9/9/9/9/9/9/4K4/9 w - - 0 1',
      targetsOf: 'e2',
      answer: ['d2', 'e1', 'e3'],
      text: { 'zh-Hans': '点出帅可以走到的点。', en: 'Tap every point the General can move to.' },
      hint: {
        'zh-Hans': 'f2 不行：两个将帅不能在同一条线上直接对面。',
        en: 'Not f2: the two Generals may never face each other on an open file.',
      },
    },
  ],
};

const advisor: Lesson = {
  id: 'advisor',
  icon: 'a',
  title: { 'zh-Hans': '仕（士）', en: 'The Advisor' },
  summary: { 'zh-Hans': '在九宫里斜走一步', en: 'One diagonal step, inside the palace' },
  xp: 10,
  steps: [
    {
      kind: 'info',
      fen: '5k3/9/9/9/9/9/9/9/4A4/3K5 w - - 0 1',
      highlight: ['d3', 'f1', 'f3'],
      text: {
        'zh-Hans': '仕沿九宫的斜线走一步，只能在九宫里。亮着的点就是这个仕能去的地方（d1 上是自己的帅）。',
        en: 'The Advisor steps one point along the palace diagonals and never leaves the palace. The lit points are where this one can go — d1 is taken by your own General.',
      },
    },
    {
      kind: 'squares',
      fen: '5k3/9/9/9/9/9/9/9/4A4/3K5 w - - 0 1',
      targetsOf: 'e2',
      answer: ['d3', 'f1', 'f3'],
      text: {
        'zh-Hans': '仕沿九宫的斜线走一步。点出这个仕可以走到的点。',
        en: 'The Advisor steps one point along the palace diagonals. Tap every point this Advisor can reach.',
      },
      hint: { 'zh-Hans': 'd1 上是自己的帅。', en: 'Your own General is on d1.' },
    },
  ],
};

const elephant: Lesson = {
  id: 'elephant',
  icon: 'b',
  title: { 'zh-Hans': '相（象）', en: 'The Elephant' },
  summary: { 'zh-Hans': '走田字，不过河', en: 'Two points diagonally, never across the river' },
  xp: 10,
  steps: [
    {
      kind: 'info',
      fen: '5k3/9/9/9/9/9/9/4B4/9/3K5 w - - 0 1',
      highlight: ['c1', 'c5', 'g1', 'g5'],
      text: {
        'zh-Hans': '相斜着走两步，走“田”字，四个方向。亮着的四个点就是它能去的地方。',
        en: 'The Elephant moves exactly two points diagonally, in any of the four directions — the four lit points.',
      },
    },
    {
      kind: 'squares',
      fen: '5k3/9/9/9/9/9/9/4B4/9/3K5 w - - 0 1',
      targetsOf: 'e3',
      answer: ['c1', 'c5', 'g1', 'g5'],
      text: {
        'zh-Hans': '相斜着走两步（走“田”字）。点出这个相可以走到的点。',
        en: 'The Elephant moves exactly two points diagonally. Tap every point this Elephant can reach.',
      },
      hint: { 'zh-Hans': '四个斜方向，每个方向两步。', en: 'Four diagonal directions, two points in each.' },
    },
    {
      kind: 'squares',
      fen: '5k3/9/9/9/9/9/5p3/4B4/9/3K5 w - - 0 1',
      targetsOf: 'e3',
      answer: ['c1', 'c5', 'g1'],
      text: {
        'zh-Hans': '田字中心有子叫“塞象眼”，那个方向就不能走。现在相能走到哪里？',
        en: "A piece on the point in between blocks that direction (the Elephant's eye). Where can it go now?",
      },
      hint: { 'zh-Hans': 'f4 上的卒挡住了去 g5 的路。', en: 'The Soldier on f4 blocks the way to g5.' },
    },
    {
      kind: 'quiz',
      text: { 'zh-Hans': '相可以过河吗？', en: 'May an Elephant cross the river?' },
      choices: [NO, YES],
      correct: 0,
      hint: { 'zh-Hans': '相守在自己一边，永远不过河。', en: 'The Elephant defends its own half and never crosses.' },
    },
  ],
};

const horse: Lesson = {
  id: 'horse',
  icon: 'n',
  title: { 'zh-Hans': '马', en: 'The Horse' },
  summary: { 'zh-Hans': '走日字，会被蹩马腿', en: 'One straight, one diagonal, and it can be hobbled' },
  xp: 15,
  steps: [
    {
      kind: 'info',
      fen: '5k3/9/9/9/9/4N4/9/9/9/3K5 w - - 0 1',
      highlight: ['c4', 'c6', 'd3', 'd7', 'f3', 'f7', 'g4', 'g6'],
      text: {
        'zh-Hans': '马先直走一步，再斜走一步，走“日”字。空旷时它有八个落点，都亮着。',
        en: 'The Horse moves one point straight, then one diagonally outward: eight landing points in the open, all lit here.',
      },
    },
    {
      kind: 'squares',
      fen: '5k3/9/9/9/9/4N4/9/9/9/3K5 w - - 0 1',
      targetsOf: 'e5',
      answer: ['c4', 'c6', 'd3', 'd7', 'f3', 'f7', 'g4', 'g6'],
      text: {
        'zh-Hans': '马先直走一步，再斜走一步（走“日”字）。点出这匹马可以走到的点。',
        en: 'The Horse moves one point straight, then one diagonally outward. Tap every point this Horse can reach.',
      },
      hint: { 'zh-Hans': '空旷的马有八个落点。', en: 'A Horse in the open has eight landing points.' },
    },
    {
      kind: 'squares',
      fen: '5k3/9/9/9/4P4/4N4/9/9/9/3K5 w - - 0 1',
      targetsOf: 'e5',
      answer: ['c4', 'c6', 'd3', 'f3', 'g4', 'g6'],
      text: {
        'zh-Hans': '紧挨着马的点上有子，马就不能往那边走，这叫“蹩马腿”。现在马能走到哪里？',
        en: 'A piece right next to the Horse blocks the leaps that start that way: the Horse is hobbled. Where can it go now?',
      },
      hint: { 'zh-Hans': 'e6 上的兵挡住了往上的两步。', en: 'The Soldier on e6 blocks both upward leaps.' },
    },
  ],
};

const chariot: Lesson = {
  id: 'chariot',
  icon: 'r',
  title: { 'zh-Hans': '车', en: 'The Chariot' },
  summary: { 'zh-Hans': '直线走，不限步数', en: 'Any distance along a line' },
  xp: 10,
  steps: [
    {
      kind: 'info',
      fen: '5k3/9/9/9/9/9/9/P8/9/R2K5 w - - 0 1',
      highlight: ['a2', 'b1', 'c1'],
      text: {
        'zh-Hans': '车沿直线走任意步，但不能跳过棋子。这个车被 a3 的兵和 d1 的帅挡住，只剩亮着的三个点。',
        en: 'The Chariot slides any distance along a line but never jumps. This one is boxed in by its own Soldier on a3 and General on d1, so only the three lit points are left.',
      },
    },
    {
      kind: 'squares',
      fen: '5k3/9/9/9/9/9/9/P8/9/R2K5 w - - 0 1',
      targetsOf: 'a1',
      answer: ['a2', 'b1', 'c1'],
      text: {
        'zh-Hans': '车沿直线走任意步，但不能跳过棋子。点出这个车可以走到的点。',
        en: 'The Chariot moves any distance along a line but cannot jump. Tap every point this Chariot can reach.',
      },
      hint: { 'zh-Hans': '自己的兵和帅挡住了其余的路。', en: 'Its own Soldier and General block everything else.' },
    },
    {
      kind: 'move',
      fen: '5k3/9/9/9/9/1n2R4/9/9/9/3K5 w - - 0 1',
      solutions: ['e5b5'],
      text: { 'zh-Hans': '用车吃掉黑方的马。', en: "Capture Black's Horse with the Chariot." },
      hint: { 'zh-Hans': '先点 e5 的车，再点 b5 的马。', en: 'Tap the Chariot on e5, then the Horse on b5.' },
      success: { 'zh-Hans': '好！车是最强的棋子。', en: 'Well done: the Chariot is the strongest piece.' },
    },
  ],
};

const cannon: Lesson = {
  id: 'cannon',
  icon: 'c',
  title: { 'zh-Hans': '炮（砲）', en: 'The Cannon' },
  summary: { 'zh-Hans': '走法像车，吃子要隔一个子', en: 'Moves like a Chariot, captures over a screen' },
  xp: 15,
  steps: [
    {
      kind: 'info',
      fen: '5k3/9/4n4/9/9/4P4/9/4C4/9/3K5 w - - 0 1',
      highlight: ['e5', 'e8'],
      text: {
        'zh-Hans': '炮不吃子时走法和车一样。吃子时必须正好隔着一个棋子（炮架），不论是哪一方的。',
        en: 'Without capturing, the Cannon moves like a Chariot. To capture it must jump exactly one piece of either side, the screen.',
      },
    },
    {
      kind: 'move',
      fen: '5k3/9/4n4/9/9/4P4/9/4C4/9/3K5 w - - 0 1',
      solutions: ['e3e8'],
      text: { 'zh-Hans': '隔着 e5 的兵，用炮吃掉黑马。', en: "Jump the Soldier on e5 and capture Black's Horse." },
      hint: { 'zh-Hans': '先点 e3 的炮，再点 e8 的黑马。', en: 'Tap the Cannon on e3, then the Horse on e8.' },
    },
    {
      kind: 'quiz',
      text: { 'zh-Hans': '炮可以隔着两个棋子吃子吗？', en: 'May a Cannon capture by jumping two pieces?' },
      choices: [NO, YES],
      correct: 0,
      hint: { 'zh-Hans': '炮架只能是一个子，不多不少。', en: 'The screen is exactly one piece, no more and no less.' },
    },
  ],
};

const soldier: Lesson = {
  id: 'soldier',
  icon: 'p',
  title: { 'zh-Hans': '兵（卒）', en: 'The Soldier' },
  summary: { 'zh-Hans': '只进不退，过河后可以横走', en: 'Forward only; sideways once across the river' },
  xp: 10,
  steps: [
    {
      kind: 'info',
      fen: '5k3/9/9/9/9/9/4P4/9/9/3K5 w - - 0 1',
      highlight: ['e5'],
      text: {
        'zh-Hans': '没过河的兵只能向前走一步，就是亮着的那个点。兵永远不能后退。',
        en: 'Before the river a Soldier only steps forward — the single lit point. A Soldier never moves backwards.',
      },
    },
    {
      kind: 'squares',
      fen: '5k3/9/9/9/9/9/4P4/9/9/3K5 w - - 0 1',
      targetsOf: 'e4',
      answer: ['e5'],
      text: {
        'zh-Hans': '没过河的兵只能向前走一步。点出这个兵可以走到的点。',
        en: 'Before the river a Soldier only steps forward. Tap every point this Soldier can reach.',
      },
      hint: { 'zh-Hans': '只有正前方的一个点。', en: 'Just the one point straight ahead.' },
    },
    {
      kind: 'squares',
      fen: '5k3/9/9/9/4P4/9/9/9/9/3K5 w - - 0 1',
      targetsOf: 'e6',
      answer: ['d6', 'e7', 'f6'],
      text: {
        'zh-Hans': '过了河的兵还可以横走，但永远不能后退。现在它能走到哪里？',
        en: 'Across the river it may also step sideways, but never back. Where can it go now?',
      },
      hint: { 'zh-Hans': '前面一个点，左右各一个点。', en: 'One point forward and one to each side.' },
    },
  ],
};

const flying: Lesson = {
  id: 'flying',
  icon: 'flying',
  title: { 'zh-Hans': '将帅不能对面', en: 'The flying General' },
  summary: { 'zh-Hans': '同一条线上中间必须有子', en: 'Something must always stand between the Generals' },
  xp: 15,
  steps: [
    {
      kind: 'info',
      fen: '3k5/9/9/9/9/9/9/9/9/4K4 w - - 0 1',
      highlight: ['e2', 'f1'],
      text: {
        'zh-Hans': '将和帅不能在同一条空竖线上对面。所以这个帅只能去亮着的两个点：走到 d1 就和黑将对面了。',
        en: 'The two Generals may never face each other down an empty file. So this General has only the two lit points: stepping to d1 would put it face to face with the black General.',
      },
    },
    {
      kind: 'squares',
      fen: '3k5/9/9/9/9/9/9/9/9/4K4 w - - 0 1',
      targetsOf: 'e1',
      answer: ['e2', 'f1'],
      text: {
        'zh-Hans': '将和帅不能在同一条竖线上直接对面，中间没有子。点出帅可以走到的点。',
        en: 'The two Generals may never face each other on a file with nothing between them. Tap every point the red General can reach.',
      },
      hint: { 'zh-Hans': 'd1 和黑将在同一条空线上。', en: 'd1 is on the same empty file as the black General.' },
    },
    {
      kind: 'quiz',
      fen: '4k4/9/9/9/9/4N4/9/9/9/4K4 w - - 0 1',
      text: {
        'zh-Hans': 'e5 的马是两帅之间唯一的子。它可以走吗？',
        en: 'The Horse on e5 is the only piece between the Generals. May it move?',
      },
      choices: [NO, YES],
      correct: 0,
      hint: {
        'zh-Hans': '马的每一步都会离开 e 线，让两帅对面。',
        en: 'Every Horse move leaves the e-file and would let the Generals face each other.',
      },
    },
  ],
};

const checkmate: Lesson = {
  id: 'checkmate',
  icon: 'mate',
  title: { 'zh-Hans': '将军与将死', en: 'Check and checkmate' },
  summary: { 'zh-Hans': '让对方的将无路可走', en: 'Leave the enemy General no way out' },
  xp: 15,
  steps: [
    {
      kind: 'info',
      fen: '3k5/8R/9/9/9/9/9/9/9/R3K4 w - - 0 1',
      text: {
        'zh-Hans': '攻击对方的将叫“将军”，对方必须应将。如果怎么走都不能解除，就是“将死”，你赢了。',
        en: 'Attacking the enemy General is check, and it must be answered. If no move answers it, that is checkmate and you win.',
      },
    },
    {
      kind: 'move',
      fen: '3k5/8R/9/9/9/9/9/9/9/R3K4 w - - 0 1',
      solutions: ['a1a10', 'a1d1'],
      text: { 'zh-Hans': '一步将死黑方。', en: 'Checkmate Black in one move.' },
      hint: {
        'zh-Hans': 'i9 的车已经封住了 d9，e 线被帅控制着。',
        en: 'The Chariot on i9 already covers d9, and your General controls the e-file.',
      },
    },
  ],
};

const stalemate: Lesson = {
  id: 'stalemate',
  icon: 'stalemate',
  title: { 'zh-Hans': '困毙判负', en: 'Stalemate loses' },
  summary: { 'zh-Hans': '无子可走就输了', en: 'No legal move means you lose' },
  xp: 15,
  steps: [
    {
      kind: 'info',
      fen: '3k5/9/8R/9/9/9/9/9/9/4K4 w - - 0 1',
      highlight: ['d9', 'e10'],
      text: {
        'zh-Hans': '黑将现在只有两个亮着的点可去：d9 和 e10，而 e10 正对着红帅，其实去不了。所以只要封住 d9，黑方就无子可走。',
        en: 'The black General has only the two lit points: d9, and e10 — which it cannot really use, because your General faces it there. Close d9 and Black has no move at all.',
      },
    },
    {
      kind: 'move',
      fen: '3k5/9/8R/9/9/9/9/9/9/4K4 w - - 0 1',
      solutions: ['i8i9'],
      text: {
        'zh-Hans': '在象棋里，轮到走棋却无子可走（困毙）是输棋，不是和棋。走一步，让黑方无路可走。',
        en: 'In Xiangqi, having no legal move on your turn loses; it is not a draw. Make a move that leaves Black no move at all.',
      },
      hint: {
        'zh-Hans': '将只能去 d9；e10 被帅对着。',
        en: 'The black General can only go to d9; e10 faces your General.',
      },
      verify: { fen: '3k5/9/8R/9/9/9/9/9/9/4K4 w - - 0 1', moves: ['i8i9'], kind: 'stalemate', winner: 'w' },
    },
    {
      kind: 'quiz',
      text: { 'zh-Hans': '被困毙的一方……', en: 'The side that is stalemated…' },
      choices: [
        { 'zh-Hans': '输棋', en: 'Loses' },
        { 'zh-Hans': '和棋', en: 'Draws' },
      ],
      correct: 0,
      hint: { 'zh-Hans': '象棋和国际象棋不同：无子可走就判负。', en: 'Xiangqi is not chess here: no legal move is a loss.' },
    },
  ],
};

const repetition: Lesson = {
  id: 'repetition',
  icon: 'repeat',
  title: { 'zh-Hans': '长将与长捉', en: 'Perpetual check and chase' },
  summary: { 'zh-Hans': '重复局面谁输谁和', en: 'Who a repetition favours' },
  xp: 15,
  steps: [
    {
      kind: 'info',
      fen: 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1',
      text: {
        'zh-Hans': '同一局面重复三次就要判定。谁都不将不捉，是和棋；一直将军（长将）或一直捉子（长捉）的一方判负。下面三题就是这三种情形。',
        en: 'When the same position comes up a third time the game is decided: nobody checking or chasing is a draw, but a side that keeps checking (perpetual check) or keeps chasing (perpetual chase) loses. The next three questions are exactly those three cases.',
      },
    },
    {
      kind: 'quiz',
      fen: 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1',
      text: {
        'zh-Hans': '双方来回走马，同一局面出现了三次，没有人将军或捉子。结果是？',
        en: 'Both sides move a Horse out and back until the same position appears a third time, with no checks or chases. The result is…',
      },
      choices: [
        { 'zh-Hans': '和棋', en: 'A draw' },
        { 'zh-Hans': '先走的一方输', en: 'A loss for whoever started' },
      ],
      correct: 0,
      hint: { 'zh-Hans': '没有人将军，也没有人捉子。', en: 'Nobody checked and nobody chased.' },
      verify: {
        fen: 'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1',
        moves: ['b1c3', 'b10c8', 'c3b1', 'c8b10', 'b1c3', 'b10c8', 'c3b1', 'c8b10'],
        kind: 'repetition',
      },
    },
    {
      kind: 'quiz',
      fen: '3k5/R8/9/9/9/9/9/9/9/4K4 w - - 0 1',
      text: {
        'zh-Hans': '红车在第 10 线和第 9 线来回将军，局面第三次重复。结果是？',
        en: 'Red keeps checking with the Chariot on ranks 10 and 9 until the position repeats a third time. The result is…',
      },
      choices: [
        { 'zh-Hans': '和棋', en: 'A draw' },
        { 'zh-Hans': '长将的红方输', en: 'Red loses for perpetual check' },
      ],
      correct: 1,
      hint: { 'zh-Hans': '一直将军的一方要负责任。', en: 'The side doing the checking is the one held responsible.' },
      verify: {
        fen: '3k5/R8/9/9/9/9/9/9/9/4K4 w - - 0 1',
        moves: ['a9a10', 'd10d9', 'a10a9', 'd9d10', 'a9a10', 'd10d9', 'a10a9', 'd9d10'],
        kind: 'perpetual-check',
        winner: 'b',
      },
    },
    {
      kind: 'quiz',
      fen: '3k5/9/9/9/c8/9/9/9/9/1R2K4 w - - 0 1',
      text: {
        'zh-Hans': '红车一直追着没有保护的黑炮，局面第三次重复。结果是？',
        en: "Red's Chariot keeps chasing Black's undefended Cannon until the position repeats a third time. The result is…",
      },
      choices: [
        { 'zh-Hans': '和棋', en: 'A draw' },
        { 'zh-Hans': '长捉的红方输', en: 'Red loses for perpetual chase' },
      ],
      correct: 1,
      hint: { 'zh-Hans': '长捉和长将一样判负。', en: 'A perpetual chase is punished just like a perpetual check.' },
      verify: {
        fen: '3k5/9/9/9/c8/9/9/9/9/1R2K4 w - - 0 1',
        moves: ['b1a1', 'a6b6', 'a1b1', 'b6a6', 'b1a1', 'a6b6', 'a1b1', 'b6a6'],
        kind: 'perpetual-chase',
        winner: 'b',
      },
    },
  ],
};

const mates: Lesson = {
  id: 'mates',
  icon: 'mate',
  title: { 'zh-Hans': '基本杀法', en: 'Basic mates' },
  summary: { 'zh-Hans': '马后炮、车帅配合', en: 'Cannon behind Horse, Chariot with General' },
  xp: 20,
  steps: [
    {
      kind: 'info',
      fen: '4k4/9/4N4/9/9/9/9/C8/9/3K5 w - - 0 1',
      highlight: ['d10', 'f10'],
      text: {
        'zh-Hans': 'e8 的马已经守住了将的两个逃点（亮着的 d10 和 f10）。剩下的只是把炮摆到 e 线上将军。',
        en: "The Horse on e8 already guards the General's two escape points, lit here. All that is left is to check down the e-file with the Cannon.",
      },
    },
    {
      kind: 'move',
      fen: '4k4/9/4N4/9/9/9/9/C8/9/3K5 w - - 0 1',
      solutions: ['a3e3'],
      text: {
        'zh-Hans': '“马后炮”：马守住将的两边，炮在马后面将军。一步将死黑方。',
        en: "Cannon behind the Horse: the Horse guards the General's sides and the Cannon checks over it. Checkmate in one.",
      },
      hint: { 'zh-Hans': '把炮移到 e 线上。', en: 'Bring the Cannon onto the e-file.' },
    },
    {
      kind: 'move',
      fen: '3k5/9/9/9/9/9/9/9/7R1/4K4 w - - 0 1',
      solutions: ['h2d2'],
      text: {
        'zh-Hans': '帅控制着 e 线，将不能去 e10。用车将死黑方。',
        en: 'Your General controls the e-file, so the black General cannot use e10. Checkmate with the Chariot.',
      },
      hint: { 'zh-Hans': '在 d 线上将军。', en: 'Give check on the d-file.' },
    },
  ],
};

export const UNITS: Unit[] = [
  { id: 'board', title: { 'zh-Hans': '棋盘', en: 'The board' }, lessons: [board] },
  {
    id: 'pieces',
    title: { 'zh-Hans': '棋子', en: 'The pieces' },
    lessons: [general, advisor, elephant, horse, chariot, cannon, soldier],
  },
  {
    id: 'rules',
    title: { 'zh-Hans': '特殊规则', en: 'Special rules' },
    lessons: [flying, checkmate, stalemate, repetition],
  },
  { id: 'mates', title: { 'zh-Hans': '杀法', en: 'Winning' }, lessons: [mates] },
];

export const ALL_LESSONS: Lesson[] = UNITS.flatMap((u) => u.lessons);

export function findLesson(id: string | undefined): Lesson | undefined {
  return ALL_LESSONS.find((l) => l.id === id);
}
