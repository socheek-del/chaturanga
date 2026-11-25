import { type Lesson, type Unit } from '@chaturanga/game-shell';
import { START_FEN } from '@chaturanga/dameo';

const l10n = (en: string) => ({ en });

/** Builds compact 8×8 lesson positions with the product's a1-origin notation. */
function fen(pieces: Record<string, string>, turn: 'w' | 'b' = 'w'): string {
  const board = Array.from({ length: 8 * 8 }, () => '.');
  for (const [name, token] of Object.entries(pieces)) {
    const file = name.charCodeAt(0) - 97;
    const rank = Number(name.slice(1)) - 1;
    if (file < 0 || file > 7 || rank < 0 || rank > 7) throw new Error(`Bad lesson square: ${name}`);
    board[rank * 8 + file] = token;
  }
  const rows = Array.from({ length: 8 }, (_, row) =>
    board.slice((7 - row) * 8, (8 - row) * 8).join('').replace(/\.+/g, (empty) => String(empty.length)),
  );
  return `${rows.join('/')} ${turn}`;
}

const manSteps = fen({ e4: 'M', h8: 'm' });
const lineMove = fen({ b2: 'M', c3: 'M', h8: 'm' });
const linePromotion = fen({ e6: 'M', f7: 'M', h1: 'm' });
const kingSlide = fen({ c3: 'K', h8: 'm' });
const sidewaysCapture = fen({ b2: 'M', c2: 'm', d4: 'M', e4: 'm', h8: 'm' });
const kingCapture = fen({ e4: 'K', e6: 'm', f4: 'm', a1: 'm' });
const maxCapture = fen({ e4: 'M', a1: 'M', e5: 'm', e7: 'm', a2: 'm' });
const delayedBlocker = fen({ d4: 'K', d6: 'm', d2: 'm' });
const coupTurc = fen({ d4: 'K', d6: 'm', f7: 'm', g5: 'm', e4: 'm', d2: 'm' });
const promotion = fen({ e7: 'M', h1: 'm' });
const crossBackRank = fen({ e6: 'M', e7: 'm', f8: 'm', g7: 'm', a1: 'M', b1: 'm', d1: 'm', f1: 'm' });
const blocked = fen({ a8: 'M', h1: 'm' });
const repetition = fen({ c3: 'K', h8: 'k' });

/** Rule-to-lesson index used by the tutorial coverage check. */
export const RULE_LESSONS = {
  standardSetup: 'the-opening-field',
  forwardMan: 'a-mans-step',
  manCannotRetreat: 'a-mans-step',
  lineMove: 'the-moving-line',
  lineMoveOnlyMen: 'the-moving-line',
  linePromotion: 'the-moving-line',
  kingRange: 'the-compass-king',
  orthogonalKingCapture: 'the-compass-king',
  orthogonalManCapture: 'a-mans-capture',
  manCanCaptureBackwardsAndSideways: 'a-mans-capture',
  kingCapture: 'the-compass-king',
  compulsoryCapture: 'the-longest-route',
  globalMaximumCapture: 'the-longest-route',
  menAndKingsCountEqually: 'the-longest-route',
  delayedCapturedBlocker: 'captured-stones',
  noRepeatedCapture: 'captured-stones',
  emptySquareRevisit: 'coup-turc',
  endOfTurnPromotion: 'when-a-man-becomes-king',
  linePromotionOnlyLeader: 'the-moving-line',
  noLegalMoveLoses: 'the-end-of-the-road',
  threefoldDraw: 'the-end-of-the-road',
  sameSideToMoveRepetition: 'the-end-of-the-road',
  agreedDrawConvention: 'the-end-of-the-road',
  noFiftyMoveRule: 'the-end-of-the-road',
  noMaterialCountHeuristic: 'the-end-of-the-road',
} as const;

/** Exercises use the selected standard rules; every route is played by the authoritative Dameo Variant. */
export const UNITS: Unit[] = [
  {
    id: 'orientation',
    title: l10n('Read the board'),
    lessons: [
      {
        id: 'the-opening-field', icon: '18', title: l10n('The opening field'),
        summary: l10n('Read the 8×8 board and the two 18-man formations.'), xp: 20,
        steps: [
          { kind: 'info', text: l10n('Dameo is played across all 64 squares. Each player begins with 18 men in three shallow rows. White stands on ranks 1–3, Black mirrors that shape on ranks 6–8, and White begins.'), fen: START_FEN },
          { kind: 'quiz', text: l10n('How many men begin on each side?'), choices: [l10n('18'), l10n('12'), l10n('24')], correct: 0, hint: l10n('Count the rows: 8 on the back, 6 in the middle, and 4 at the front.') },
        ],
      },
      {
        id: 'a-mans-step', icon: '↗', title: l10n('A man’s step'),
        summary: l10n('Advance one empty square, straight or diagonally.'), xp: 20,
        steps: [
          { kind: 'info', text: l10n('A man advances one square toward the far edge. It may go straight ahead or one square diagonally forward. It never steps backward.'), fen: manSteps },
          { kind: 'move', text: l10n('Advance the white man straight from e4 to e5.'), fen: manSteps, solutions: ['e4e5'], hint: l10n('The white side moves toward rank 8.') },
        ],
      },
      {
        id: 'the-moving-line', icon: '⇢', title: l10n('The moving line'),
        summary: l10n('Slide connected men together and crown only the leader.'), xp: 25,
        steps: [
          { kind: 'move', text: l10n('Shift the two connected men forward together: b2 moves to c3, and c3 moves to d4.'), fen: lineMove, solutions: ['b2c3d4'], hint: l10n('The empty square in front of the leading man gives the whole line room to move.') },
          { kind: 'info', text: l10n('A line is unbroken and moves one square in the direction a man could step. Kings cannot join a line move. When a line reaches the far row, only its leading man is promoted.'), fen: linePromotion },
          { kind: 'move', text: l10n('Move the line from e6 through f7 to g8. Only the leading man on f7 will become a king.'), fen: linePromotion, solutions: ['e6f7g8'], hint: l10n('The men shift one square forward along their shared diagonal.') },
        ],
      },
      {
        id: 'the-compass-king', icon: '✳', title: l10n('The compass king'),
        summary: l10n('Slide any clear distance in eight directions.'), xp: 25,
        steps: [
          { kind: 'info', text: l10n('A king moves any unobstructed distance along a rank, file, or diagonal. Captures are different: a king captures only along a rank or file.'), fen: kingSlide },
          { kind: 'move', text: l10n('Slide the white king diagonally from c3 to g7.'), fen: kingSlide, solutions: ['c3g7'], hint: l10n('The diagonal is clear all the way to g7.') },
          { kind: 'move', text: l10n('Capture the black man on e6. Choose either empty landing square beyond it.'), fen: kingCapture, solutions: ['e4e7', 'e4e8'], hint: l10n('A king may land on any clear square beyond the piece it leaps over.') },
        ],
      },
    ],
  },
  {
    id: 'captures',
    title: l10n('Captures and routes'),
    lessons: [
      {
        id: 'a-mans-capture', icon: '×', title: l10n('A man’s capture'),
        summary: l10n('Leap one enemy piece in an orthogonal direction.'), xp: 25,
        steps: [
          { kind: 'info', text: l10n('A man captures by leaping over one adjacent enemy into the empty square immediately beyond. It may capture forward, backward, or sideways, but never diagonally.'), fen: sidewaysCapture },
          { kind: 'move', text: l10n('Capture sideways: leap from d4 over the black man on e4 and land on f4.'), fen: sidewaysCapture, solutions: ['d4f4'], hint: l10n('Capture routes turn at right angles; this leap is along the rank.') },
        ],
      },
      {
        id: 'the-longest-route', icon: '↗×', title: l10n('The longest route'),
        summary: l10n('Captures are compulsory; finish a route with the most pieces.'), xp: 30,
        steps: [
          { kind: 'info', text: l10n('If any capture is possible, a quiet move is forbidden. Continue capturing with the same piece until its route ends. When several complete routes are available, choose one that captures the greatest number anywhere on the board. A man and a king count equally.'), fen: maxCapture },
          { kind: 'quiz', text: l10n('The board offers a two-piece route from e4 and a one-piece route from a1. Which route may you play?'), choices: [l10n('The route from e4, because it captures the greatest number.'), l10n('Either route, because the player may choose any capture.')], correct: 0, hint: l10n('A capture is compulsory, and the complete route taking the most pieces is the only kind allowed.'), fen: maxCapture },
        ],
      },
      {
        id: 'captured-stones', icon: '⊣', title: l10n('Captured stones still stand'),
        summary: l10n('A jumped piece remains as a blocker until the turn ends.'), xp: 25,
        steps: [
          { kind: 'move', text: l10n('Leap the black man on d6 from d4 to d7. It stays on d6 until this route is complete, blocking the man on d2.'), fen: delayedBlocker, solutions: ['d4d7'], hint: l10n('A captured piece is not removed in the middle of the route.') },
          { kind: 'quiz', text: l10n('From d7, can the king jump over d6 again to reach the black man on d2?'), choices: [l10n('No. The captured piece remains and cannot be captured twice.'), l10n('Yes. Captures are removed after each leap.')], correct: 0, hint: l10n('Dameo delays removal until the entire capture turn is over.') },
        ],
      },
      {
        id: 'coup-turc', icon: '⤺', title: l10n('Coup Turc'),
        summary: l10n('Use captured blockers and revisit an empty square.'), xp: 30,
        steps: [
          { kind: 'info', text: l10n('During a route, captured pieces stay where they were jumped. They block sliding kings and cannot be jumped twice. Empty squares are different: once vacated, they may be crossed or landed on again. This creates intricate loops known as Coup Turc.'), fen: coupTurc },
          { kind: 'move', text: l10n('Follow the whole route: capture at d6, f7, g5, and e4, return to d4, then capture at d2.'), fen: coupTurc, solutions: ['d4d7g7g4d4d1'], hint: l10n('Read each landing in order. The king returns to d4, an empty square it left earlier.') },
        ],
      },
    ],
  },
  {
    id: 'promotion-and-endings',
    title: l10n('Promotion and endings'),
    lessons: [
      {
        id: 'when-a-man-becomes-king', icon: '♙', title: l10n('When a man becomes a king'),
        summary: l10n('Promotion happens after the full turn ends.'), xp: 25,
        steps: [
          { kind: 'move', text: l10n('Advance the man from e7 to the far row at e8. It becomes a king when the turn ends.'), fen: promotion, solutions: ['e7e8'], hint: l10n('Only a man that finishes its turn on the back row is promoted.') },
          { kind: 'info', text: l10n('A man may pass through the far row during a capture route and finish elsewhere. It remains a man. A line move promotes only the leading man that reaches the row.'), fen: crossBackRank },
          { kind: 'move', text: l10n('Capture through e8, then f8, and finish at g6. The man must not promote because the full turn ends away from rank 8.'), fen: crossBackRank, solutions: ['e6e8g8g6'], hint: l10n('Promotion is checked after the last capture, not during the route.') },
        ],
      },
      {
        id: 'the-end-of-the-road', icon: '∞', title: l10n('The end of the road'),
        summary: l10n('Learn blocked endings, repetition, and the draw convention.'), xp: 30,
        steps: [
          { kind: 'quiz', text: l10n('The white man on a8 has no legal move. What happens in this edition?'), choices: [l10n('White loses.'), l10n('The game is drawn.')], correct: 0, hint: l10n('A player with no legal move loses, including when their remaining pieces are blocked.'), fen: blocked },
          { kind: 'quiz', text: l10n('What happens when the same board and side to move appears for the third time?'), choices: [l10n('The game is drawn.'), l10n('The player to move loses.')], correct: 0, hint: l10n('Threefold repetition is an automatic draw.'), fen: repetition },
          { kind: 'quiz', text: l10n('What can the players do when neither side can make progress and both agree to stop?'), choices: [l10n('Offer an agreed draw, accepted by the other player.'), l10n('Claim an automatic 50-move draw.')], correct: 0, hint: l10n('This edition uses mutual agreement for the source rules’ undefined “mutual exhaustion” case; it does not add a 50-move rule.'), fen: START_FEN },
          { kind: 'info', text: l10n('The source rules do not define when material is mutually exhausted. This edition uses an agreed draw: the game ends in a draw when both players accept. It has no 50-move rule or automatic material-count guess.'), fen: START_FEN },
        ],
      },
    ],
  },
];

export const ALL_LESSONS: Lesson[] = UNITS.flatMap((unit) => unit.lessons);
