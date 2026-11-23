import { setupFen, START_FEN as START } from '@chaturanga/janggi';
import type { Lesson, Unit } from './types';

/**
 * Janggi lessons (jg-006). Every position is checked against the engine in `lessons.test.ts`: each FEN
 * parses, each move solution is legal, each `targetsOf` answer equals the engine's legal destinations,
 * each mate really mates and each ending claim matches `status()`. So the text cannot drift away from
 * packages/janggi/RULES.md.
 */

const YES = { ko: '네', en: 'Yes' };
const NO = { ko: '아니요', en: 'No' };

const board: Lesson = {
  id: 'board',
  icon: 'board',
  title: { ko: '장기판', en: 'Meet the board' },
  summary: { ko: '교차점과 궁성', en: 'Points and palaces' },
  xp: 10,
  steps: [
    {
      kind: 'info',
      fen: START,
      text: {
        ko: '장기의 기물은 선이 만나는 교차점에 놓입니다. 세로 아홉 줄, 가로 열 줄입니다. 초(초록)가 아래에 앉아 먼저 둡니다.',
        en: 'Janggi pieces stand on the points where lines cross: 9 files and 10 ranks. Cho (green) sits at the bottom and moves first; Han is red.',
      },
    },
    {
      kind: 'info',
      fen: START,
      highlight: ['d1', 'e1', 'f1', 'd2', 'e2', 'f2', 'd3', 'e3', 'f3'],
      text: {
        ko: '대각선이 그려진 네모가 궁성입니다. 왕과 사는 궁성을 떠나지 못하며, 왕은 궁성 한가운데에서 시작합니다.',
        en: 'The box with the diagonal lines is the palace. The General and its Advisors never leave it, and the General starts at its centre.',
      },
    },
    {
      kind: 'squares',
      fen: START,
      answer: ['a4', 'c4', 'e4', 'g4', 'i4'],
      text: { ko: '초의 졸 다섯을 눌러 보세요.', en: "Tap Cho's five Soldiers." },
      hint: { ko: '아래에서 네 번째 줄에 있습니다.', en: 'They stand on the fourth rank from the bottom.' },
    },
  ],
};

const general: Lesson = {
  id: 'general',
  icon: 'k',
  title: { ko: '왕 (楚·漢)', en: 'The General' },
  summary: { ko: '궁성의 선을 따라 한 칸', en: 'One step along the palace lines' },
  xp: 10,
  steps: [
    {
      kind: 'info',
      fen: '3k5/9/9/9/9/9/9/9/4K4/9 w - - 0 1',
      highlight: ['d1', 'd2', 'd3', 'e1', 'e3', 'f1', 'f2', 'f3'],
      text: {
        ko: '왕은 궁성 안에서 그려진 선을 따라 한 칸 갑니다. 한가운데에서는 대각선을 포함해 여덟 곳 모두 갈 수 있습니다.',
        en: 'The General steps one point along any line drawn in its palace. From the centre that is all eight points, diagonals included.',
      },
    },
    {
      kind: 'squares',
      fen: '5k3/9/9/9/9/9/9/9/9/4K4 w - - 0 1',
      targetsOf: 'e1',
      answer: ['d1', 'e2', 'f1'],
      text: { ko: '왕이 갈 수 있는 곳을 모두 누르세요.', en: 'Tap every point the General can move to.' },
      hint: { ko: 'e1에는 대각선이 지나지 않습니다.', en: 'No diagonal line runs through e1.' },
    },
  ],
};

const advisor: Lesson = {
  id: 'advisor',
  icon: 'a',
  title: { ko: '사 (士)', en: 'The Advisor' },
  summary: { ko: '왕과 똑같이 움직인다', en: 'Moves just like the General' },
  xp: 10,
  steps: [
    {
      kind: 'info',
      fen: '5k3/9/9/9/9/9/9/3A5/9/4K4 w - - 0 1',
      highlight: ['d2', 'e2', 'e3'],
      text: {
        ko: '사는 왕과 똑같이 궁성의 선을 따라 한 칸 움직이며 왕을 지킵니다. 이 사는 빛나는 세 곳으로 갈 수 있습니다.',
        en: 'The Advisor moves exactly like the General, one point along the palace lines, and guards it. This one can go to the three lit points.',
      },
    },
    {
      kind: 'squares',
      fen: '5k3/9/9/9/9/9/9/5A3/9/3K5 w - - 0 1',
      targetsOf: 'f3',
      answer: ['e2', 'e3', 'f2'],
      text: { ko: '사가 갈 수 있는 곳을 모두 누르세요.', en: 'Tap every point this Advisor can reach.' },
      hint: { ko: '귀퉁이에서는 세 곳입니다.', en: 'From a corner there are three.' },
    },
  ],
};

const chariot: Lesson = {
  id: 'chariot',
  icon: 'r',
  title: { ko: '차 (車)', en: 'The Chariot' },
  summary: { ko: '직선으로, 궁성에서는 대각선도', en: 'Any distance, and palace diagonals too' },
  xp: 10,
  steps: [
    {
      kind: 'info',
      fen: '4k4/9/5R3/9/9/9/9/9/9/3K5 w - - 0 1',
      highlight: ['e9', 'd10'],
      text: {
        ko: '차는 직선으로 얼마든지 갑니다. 궁성 안에서는 대각선으로도 갈 수 있습니다. 이 차는 빛나는 두 점까지 대각선으로 갈 수 있습니다.',
        en: 'The Chariot slides any distance along a line. Inside a palace it may also follow the diagonals: this one can slide to the two lit points.',
      },
    },
    {
      kind: 'squares',
      fen: '5k3/9/9/9/9/9/9/P8/9/R2K5 w - - 0 1',
      targetsOf: 'a1',
      answer: ['a2', 'b1', 'c1'],
      text: { ko: '차는 기물을 넘지 못합니다. 갈 수 있는 곳을 모두 누르세요.', en: 'The Chariot cannot jump. Tap every point this Chariot can reach.' },
      hint: { ko: '자기 졸과 왕이 길을 막고 있습니다.', en: 'Its own Soldier and General block everything else.' },
    },
    {
      kind: 'move',
      fen: '5k3/9/9/9/9/1n2R4/9/9/9/3K5 w - - 0 1',
      solutions: ['e5b5'],
      text: { ko: '차로 한의 마를 잡으세요.', en: "Capture Han's Horse with the Chariot." },
      hint: { ko: 'e5의 차를 누르고 b5의 마를 누르세요.', en: 'Tap the Chariot on e5, then the Horse on b5.' },
      success: { ko: '좋습니다! 차는 13점으로 가장 강한 기물입니다.', en: 'Well done: at 13 points the Chariot is the strongest piece.' },
    },
  ],
};

const cannon: Lesson = {
  id: 'cannon',
  icon: 'c',
  title: { ko: '포 (包)', en: 'The Cannon' },
  summary: { ko: '반드시 하나를 넘어야 한다', en: 'It must always jump one piece' },
  xp: 15,
  steps: [
    {
      kind: 'info',
      fen: '5k3/9/9/9/1P7/9/1C7/9/9/3K5 w - - 0 1',
      highlight: ['b7', 'b8', 'b9', 'b10'],
      text: {
        ko: '포는 움직일 때도 잡을 때도 반드시 기물 하나를 넘어야 합니다. 이 포는 졸을 넘어 빛나는 점으로 갑니다.',
        en: 'A Cannon must jump exactly one piece, both to move and to capture. This one jumps the Soldier to any of the lit points.',
      },
    },
    {
      kind: 'squares',
      fen: '5k3/9/1n7/9/1P7/9/1C7/9/9/3K5 w - - 0 1',
      targetsOf: 'b4',
      answer: ['b7', 'b8'],
      text: { ko: '포가 갈 수 있는 곳을 모두 누르세요.', en: 'Tap every point this Cannon can reach.' },
      hint: { ko: '졸을 넘어 마까지입니다. 마도 잡을 수 있습니다.', en: 'Over the Soldier, up to and including the Horse it can take.' },
    },
    {
      kind: 'quiz',
      fen: '5k3/9/9/9/1c7/9/1C7/9/9/3K5 w - - 0 1',
      text: { ko: '포가 다른 포를 넘거나 잡을 수 있나요?', en: 'May a Cannon jump or capture another Cannon?' },
      choices: [NO, YES],
      correct: 0,
      hint: { ko: '포끼리는 넘지도 잡지도 못합니다.', en: 'Cannons never jump and never take each other.' },
    },
  ],
};

const horse: Lesson = {
  id: 'horse',
  icon: 'n',
  title: { ko: '마 (馬)', en: 'The Horse' },
  summary: { ko: '직선 한 칸, 대각선 한 칸', en: 'One straight, one diagonal' },
  xp: 10,
  steps: [
    {
      kind: 'info',
      fen: '5k3/9/9/9/9/4N4/9/9/9/3K5 w - - 0 1',
      highlight: ['c4', 'c6', 'd3', 'd7', 'f3', 'f7', 'g4', 'g6'],
      text: {
        ko: '마는 직선으로 한 칸, 이어서 바깥 대각선으로 한 칸 갑니다. 트인 곳에서는 여덟 곳입니다.',
        en: 'The Horse moves one point straight, then one diagonally outward: eight landing points in the open.',
      },
    },
    {
      kind: 'squares',
      fen: '5k3/9/9/9/4P4/4N4/9/9/9/3K5 w - - 0 1',
      targetsOf: 'e5',
      answer: ['c4', 'c6', 'd3', 'f3', 'g4', 'g6'],
      text: { ko: '첫 칸이 막히면 그쪽으로 갈 수 없습니다(멱). 이제 어디로 갈 수 있나요?', en: 'A piece on the first point blocks that way. Where can the Horse go now?' },
      hint: { ko: 'e6의 졸이 위쪽 두 곳을 막습니다.', en: 'The Soldier on e6 blocks both upward leaps.' },
    },
  ],
};

const elephant: Lesson = {
  id: 'elephant',
  icon: 'b',
  title: { ko: '상 (象)', en: 'The Elephant' },
  summary: { ko: '직선 한 칸, 대각선 두 칸', en: 'One straight, two diagonal' },
  xp: 15,
  steps: [
    {
      kind: 'info',
      fen: '5k3/9/9/9/9/4B4/9/9/9/3K5 w - - 0 1',
      highlight: ['b3', 'b7', 'c2', 'c8', 'g2', 'g8', 'h3', 'h7'],
      text: {
        ko: '상은 직선으로 한 칸, 이어서 바깥 대각선으로 두 칸 갑니다. 판 어디든 갈 수 있습니다.',
        en: 'The Elephant moves one point straight, then two diagonally outward. It may go anywhere on the board.',
      },
    },
    {
      kind: 'squares',
      fen: '5k3/9/9/5p3/9/4B4/9/9/9/3K5 w - - 0 1',
      targetsOf: 'e5',
      answer: ['b3', 'b7', 'c2', 'c8', 'g2', 'h3', 'h7'],
      text: { ko: '지나는 두 점 가운데 하나라도 막히면 갈 수 없습니다. 상은 어디로 갈 수 있나요?', en: 'A piece on either point it passes blocks it. Where can this Elephant go?' },
      hint: { ko: 'f7의 병이 g8로 가는 길을 막습니다.', en: 'The Soldier on f7 blocks the way to g8.' },
    },
  ],
};

const soldier: Lesson = {
  id: 'soldier',
  icon: 'p',
  title: { ko: '졸·병 (卒·兵)', en: 'The Soldier' },
  summary: { ko: '앞으로, 옆으로, 뒤로는 못 간다', en: 'Forward or sideways, never back' },
  xp: 10,
  steps: [
    {
      kind: 'info',
      fen: '5k3/9/9/9/9/9/4P4/9/9/3K5 w - - 0 1',
      highlight: ['d4', 'e5', 'f4'],
      text: {
        ko: '졸은 처음부터 앞이나 옆으로 한 칸 갑니다. 뒤로는 가지 못합니다.',
        en: 'From the very start a Soldier steps one point forward or sideways. It never moves back.',
      },
    },
    {
      kind: 'squares',
      fen: '4k4/9/5P3/9/9/9/9/9/9/3K5 w - - 0 1',
      targetsOf: 'f8',
      answer: ['e8', 'e9', 'f9', 'g8'],
      text: { ko: '적의 궁성에서는 대각선 앞으로도 갑니다. 이 졸은 어디로 갈 수 있나요?', en: 'Inside the enemy palace it may also step diagonally forward. Where can this Soldier go?' },
      hint: { ko: '앞, 양옆, 그리고 궁성 한가운데입니다.', en: 'Forward, both sides, and the palace centre.' },
    },
  ],
};

const setup: Lesson = {
  id: 'setup',
  icon: 'setup',
  title: { ko: '차림', en: 'Opening arrangements' },
  summary: { ko: '마와 상의 자리를 고른다', en: 'Choose where Horses and Elephants stand' },
  xp: 10,
  steps: [
    {
      kind: 'info',
      fen: START,
      highlight: ['b1', 'c1', 'g1', 'h1'],
      text: {
        ko: '대국 전에 양쪽은 마와 상을 놓는 차림을 고릅니다. 지금은 상이 안쪽에 있는 안상차림(마상상마)입니다.',
        en: 'Before play each side chooses how to set out its Horses and Elephants. Here the Elephants are inside.',
      },
    },
    {
      kind: 'info',
      fen: setupFen('outer', 'inner'),
      highlight: ['b1', 'c1', 'g1', 'h1'],
      text: { ko: '초가 바깥상차림(상마마상)을 고른 모습입니다. 왼상차림과 오른상차림까지 모두 네 가지입니다.', en: 'Now Cho has put its Elephants outside. Both on the left or both on the right are the other two: four in all.' },
    },
    {
      kind: 'squares',
      fen: setupFen('left', 'inner'),
      answer: ['b1', 'g1'],
      text: { ko: '왼상차림입니다. 초의 상 둘을 눌러 보세요.', en: "This is the left arrangement. Tap Cho's two Elephants." },
      hint: { ko: '상이 각각 마의 왼쪽에 있습니다.', en: 'Each Elephant stands to the left of its Horse.' },
    },
  ],
};

const checkmate: Lesson = {
  id: 'checkmate',
  icon: 'mate',
  title: { ko: '장군과 외통', en: 'Check and checkmate' },
  summary: { ko: '왕이 피할 곳을 없앤다', en: 'Leave the enemy General no way out' },
  xp: 15,
  steps: [
    {
      kind: 'info',
      fen: '3k5/R8/9/9/9/9/9/9/4K4/7R1 w - - 0 1',
      text: {
        ko: '왕을 공격하는 것이 장군이고, 막거나 피하는 것이 멍군입니다. 어떤 수로도 멍군할 수 없으면 외통, 승리입니다.',
        en: 'Attacking the enemy General is check (janggun), and it must be answered. If no move answers it, that is checkmate and you win.',
      },
    },
    {
      kind: 'move',
      fen: '3k5/R8/9/9/9/9/9/9/4K4/7R1 w - - 0 1',
      solutions: ['h1h10'],
      text: { ko: '한 수로 외통을 내세요.', en: 'Checkmate Han in one move.' },
      hint: { ko: 'a9의 차가 아홉째 줄을 막고 있습니다.', en: 'The Chariot on a9 already covers the ninth rank.' },
    },
  ],
};

const pass: Lesson = {
  id: 'pass',
  icon: 'pass',
  title: { ko: '한수쉼', en: 'Passing' },
  summary: { ko: '둘 수가 마땅치 않으면 쉰다', en: 'You may skip your turn' },
  xp: 10,
  steps: [
    {
      kind: 'info',
      fen: START,
      text: {
        ko: '장군을 받지 않았다면 한 수 쉴 수 있습니다. 그래서 장기에는 둘 곳이 없어 지는 일이 없습니다. 대국 화면의 한수쉼 버튼을 쓰세요.',
        en: 'Unless you are in check you may pass, so nobody is ever stuck without a move. In a game, use the Pass button.',
      },
    },
    {
      kind: 'quiz',
      fen: START,
      text: { ko: '초가 쉬고, 이어서 한도 쉬었습니다. 어떻게 되나요?', en: 'Cho passes, then Han passes too. What happens?' },
      choices: [
        { ko: '대국이 끝나고 점수로 가린다', en: 'The game ends on points' },
        { ko: '대국이 계속된다', en: 'Play goes on' },
      ],
      correct: 0,
      hint: { ko: '둘 다 둘 뜻이 없다는 표시입니다.', en: 'Both sides have shown they do not want to move.' },
      verify: { fen: START, moves: ['e2e2', 'e9e9'], kind: 'double-pass', winner: 'b' },
    },
  ],
};

const bikjang: Lesson = {
  id: 'bikjang',
  icon: 'bikjang',
  title: { ko: '빅장', en: 'Bikjang' },
  summary: { ko: '두 왕이 마주 보면', en: 'When the Generals face each other' },
  xp: 15,
  steps: [
    {
      kind: 'info',
      fen: '4k4/9/9/9/9/9/9/9/3K5/R8 w - - 0 1',
      highlight: ['e2', 'e10'],
      text: {
        ko: '두 왕이 같은 세로줄에서 사이에 아무것도 없이 마주 보면 빅장입니다. 상대는 빅장을 풀어야 하고, 풀지 않고 쉬면 점수로 승부를 가립니다.',
        en: 'When the Generals stand on one file with nothing between them, that is bikjang. The other side must break it; passing instead accepts it, and the points decide.',
      },
    },
    {
      kind: 'move',
      fen: '4k4/9/9/9/9/9/9/9/3K5/R8 w - - 0 1',
      solutions: ['d2e2'],
      text: { ko: '초는 차 하나를 앞서 있습니다. 왕을 움직여 빅장을 부르세요.', en: 'Cho is a Chariot ahead. Move the General to call bikjang.' },
      hint: { ko: '한의 왕은 e줄에 있습니다.', en: "Han's General is on the e-file." },
      verify: { fen: '4k4/9/9/9/9/9/9/9/3K5/R8 w - - 0 1', moves: ['d2e2', 'e10e10'], kind: 'bikjang', winner: 'w' },
    },
    {
      kind: 'quiz',
      fen: '4k4/9/9/9/9/9/9/9/4K4/R8 b - - 0 1',
      text: { ko: '점수가 뒤진 한은 어떻게 해야 하나요?', en: 'Han is behind on points. What should it do?' },
      choices: [
        { ko: '왕을 옆으로 피한다', en: 'Step the General aside' },
        { ko: '한 수 쉰다', en: 'Pass' },
      ],
      correct: 0,
      hint: { ko: '쉬면 빅장을 받아들이는 것이고 점수로 집니다.', en: 'Passing accepts bikjang, and Han would lose on points.' },
      verify: { fen: '4k4/9/9/9/9/9/9/9/4K4/R8 b - - 0 1', moves: ['e10e10'], kind: 'bikjang', winner: 'w' },
    },
  ],
};

const points: Lesson = {
  id: 'points',
  icon: 'points',
  title: { ko: '점수', en: 'Points' },
  summary: { ko: '외통이 없으면 점수로', en: 'No checkmate? The points decide' },
  xp: 10,
  steps: [
    {
      kind: 'info',
      fen: START,
      text: {
        ko: '차 13점, 포 7점, 마 5점, 상 3점, 사 3점, 졸·병 2점입니다. 처음에는 양쪽 72점이고, 후수인 한은 덤 1.5점을 더 받습니다.',
        en: 'Chariot 13, Cannon 7, Horse 5, Elephant 3, Advisor 3, Soldier 2. Each side starts with 72, and Han gets 1.5 more for moving second.',
      },
    },
    {
      kind: 'quiz',
      text: { ko: '두 쪽의 남은 기물이 똑같은데 점수로 가리게 되었습니다. 누가 이기나요?', en: 'Both sides have the same pieces left and the points decide. Who wins?' },
      choices: [
        { ko: '한', en: 'Han' },
        { ko: '초', en: 'Cho' },
        { ko: '무승부', en: 'Nobody' },
      ],
      correct: 0,
      hint: { ko: '한에게는 덤 1.5점이 있습니다.', en: 'Han has its 1.5 extra.' },
    },
    {
      kind: 'quiz',
      fen: START,
      text: { ko: '같은 장면이 세 번 나왔고 계속 장군을 부른 쪽은 없습니다. 어떻게 되나요?', en: 'The same position has come up three times and nobody kept checking. What happens?' },
      choices: [
        { ko: '점수로 가린다', en: 'The points decide' },
        { ko: '무승부', en: 'A draw' },
      ],
      correct: 0,
      hint: { ko: '장기에서는 거의 모든 미결 대국을 점수로 가립니다.', en: 'In Janggi the points settle almost every undecided game.' },
      verify: {
        fen: START,
        moves: ['a1a2', 'a10a9', 'a2a1', 'a9a10', 'a1a2', 'a10a9', 'a2a1', 'a9a10'],
        kind: 'repetition',
        winner: 'b',
      },
    },
    {
      kind: 'quiz',
      fen: '3k5/R8/9/9/9/9/9/9/9/4K4 w - - 0 1',
      text: { ko: '초의 차가 계속 장군을 불러 같은 장면이 세 번 나왔습니다. 어떻게 되나요?', en: "Cho's Chariot keeps checking until the position repeats a third time. What happens?" },
      choices: [
        { ko: '점수로 초가 이긴다', en: 'Cho wins on points' },
        { ko: '계속 장군을 부른 초가 진다', en: 'Cho loses for perpetual check' },
      ],
      correct: 1,
      hint: { ko: '장군만 반복하는 쪽이 책임을 집니다.', en: 'The side doing the checking is held responsible.' },
      verify: {
        fen: '3k5/R8/9/9/9/9/9/9/9/4K4 w - - 0 1',
        moves: ['a9a10', 'd10d9', 'a10a9', 'd9d10', 'a9a10', 'd10d9', 'a10a9', 'd9d10'],
        kind: 'perpetual-check',
        winner: 'b',
      },
    },
  ],
};

const mates: Lesson = {
  id: 'mates',
  icon: 'mate',
  title: { ko: '기본 외통', en: 'Basic mates' },
  summary: { ko: '차와 졸의 협력', en: 'Chariots and Soldiers together' },
  xp: 20,
  steps: [
    {
      kind: 'info',
      fen: '4k4/9/3P1P3/9/9/9/9/9/9/R2K5 w - - 0 1',
      highlight: ['d9', 'e9', 'f9'],
      text: {
        ko: '두 졸이 궁성 안에서 아홉째 줄을 지키고 있습니다. 이제 열째 줄에서 장군을 부르면 됩니다.',
        en: 'Two Soldiers in the palace already guard the ninth rank, lit here. All that is left is a check along the tenth.',
      },
    },
    {
      kind: 'move',
      fen: '4k4/9/3P1P3/9/9/9/9/9/9/R2K5 w - - 0 1',
      solutions: ['a1a10'],
      text: { ko: '차로 외통을 내세요.', en: 'Checkmate with the Chariot.' },
      hint: { ko: '차를 열째 줄로 보내세요.', en: 'Send the Chariot to the tenth rank.' },
    },
    {
      kind: 'move',
      fen: '3k5/9/9/4R4/9/9/9/9/5K3/8R w - - 0 1',
      solutions: ['i1d1'],
      text: { ko: '왕은 대각선으로도 달아납니다. 두 차로 외통을 내세요.', en: 'The General can also flee diagonally. Checkmate with two Chariots.' },
      hint: { ko: 'e줄의 차가 길을 막고 있습니다. 다른 차로 장군을 부르세요.', en: 'The Chariot on the e-file guards; check with the other.' },
    },
  ],
};

export const UNITS: Unit[] = [
  { id: 'board', title: { ko: '장기판', en: 'The board' }, lessons: [board] },
  { id: 'pieces', title: { ko: '기물', en: 'The pieces' }, lessons: [general, advisor, chariot, cannon, horse, elephant, soldier] },
  { id: 'rules', title: { ko: '규칙', en: 'Special rules' }, lessons: [setup, checkmate, pass, bikjang, points] },
  { id: 'mates', title: { ko: '외통', en: 'Winning' }, lessons: [mates] },
];

export const ALL_LESSONS: Lesson[] = UNITS.flatMap((u) => u.lessons);

export function findLesson(id: string | undefined): Lesson | undefined {
  return ALL_LESSONS.find((l) => l.id === id);
}
