import type { Lesson, Unit } from '@chaturanga/game-shell';
import { fenOf, Game, makePiece, parseFen, PIECE_TYPES, square, squareName, START_FEN } from '@chaturanga/chu-shogi';
import { parseUci } from '@chaturanga/board-ui';
import type { PieceType } from '@chaturanga/chu-shogi';
import type { Color } from '@chaturanga/rules-core';
import { RANK_GUIDE, PROMOTION_GUIDE } from './pieceAtlas';

const en = (text: string) => ({ en: text });
type Placement = { at: string; color: Color; type: PieceType; promoted?: boolean };

function practiceFen(extra: readonly Placement[] = [], turn: Color = 'w'): string {
  const position = parseFen(START_FEN);
  position.board.fill(null);
  position.board[square('a1')] = makePiece('w', 'king');
  position.board[square('l12')] = makePiece('b', 'king');
  position.board[square('b3')] = makePiece('w', 'pawn');
  position.board[square('k10')] = makePiece('b', 'pawn');
  for (const piece of extra) position.board[square(piece.at)] = makePiece(piece.color, piece.type, piece.promoted);
  position.turn = turn;
  return fenOf(position);
}

function firstMove(fen: string, from: string, accept: (uci: string) => boolean = () => true): string {
  const game = new Game(fen);
  const origin = square(from);
  const move = game.legalUci().find((uci) => {
    const parsed = parseUci(uci, 12);
    return parsed?.kind === 'move' && parsed.from === origin && accept(uci);
  });
  if (!move) throw new Error(`No lesson move from ${from} in ${fen}`);
  return move;
}

const stepFen = practiceFen([{ at: 'f6', color: 'w', type: 'kirin' }]);
const slideFen = practiceFen([{ at: 'f6', color: 'w', type: 'rook' }]);
const promoteFen = practiceFen([{ at: 'c8', color: 'w', type: 'pawn' }]);
const lionFen = practiceFen([
  { at: 'f6', color: 'w', type: 'lion' },
  { at: 'g6', color: 'b', type: 'copper-general' },
]);
const iguiFen = practiceFen([
  { at: 'f6', color: 'w', type: 'lion' },
  { at: 'g6', color: 'b', type: 'pawn' },
]);
const stepMove = firstMove(stepFen, 'f6');
const slideMove = firstMove(slideFen, 'f6');
const lionRoute = firstMove(lionFen, 'f6', (uci) => uci.length >= 6);
const iguiMove = firstMove(iguiFen, 'f6', (uci) => uci === 'f6g6f6');
const allFromRook = new Game(slideFen).legalUci()
  .map((uci) => parseUci(uci, 12))
  .filter((move): move is NonNullable<typeof move> & { kind: 'move' } => move?.kind === 'move' && move.from === square('f6') && move.to !== square('f6'))
  .map((move) => squareName(move.to))
  .filter((name, index, all) => all.indexOf(name) === index);

export const RULE_LESSONS = {
  boardInventoryAndNoDrops: 'the-board',
  stepAndJumpMovement: 'step-and-jump',
  slidingMovement: 'long-ranks',
  allTwentyNineRanks: 'the-rank-atlas',
  allEighteenPromotionChanges: 'promotion-and-deferral',
  promotionZoneAndRecovery: 'promotion-and-deferral',
  promotionDeferral: 'promotion-and-deferral',
  princeIsRoyal: 'the-prince',
  lionTwoLegTurn: 'a-lion-turn',
  lionDirectJump: 'a-lion-turn',
  igui: 'igui-and-jitto',
  jitto: 'igui-and-jitto',
  protectedLionAndTsukegui: 'lion-trades',
  wholeTurnPawnFootRule: 'lion-trades',
  firstLionCounterstrike: 'first-lion',
  noCheckOrRoyalSafety: 'royal-endings',
  captureAllRoyals: 'royal-endings',
  forcedRoyalMate: 'royal-endings',
  noLegalMoveLoses: 'royal-endings',
  barrenMaterial: 'barren-material',
  dutyToVaryRepetition: 'repetition',
} as const;

export const LESSON_UNITS: Unit[] = [
  {
    id: 'field',
    title: en('Read the field'),
    lessons: [
      {
        id: 'the-board', icon: '12 × 12', title: en('The twelve by twelve board'),
        summary: en('Meet the 46-piece armies, a full turn, and captures that leave play.'), xp: 20,
        steps: [
          { kind: 'info', text: en('Chu Shogi uses a twelve-file by twelve-rank board. Each side begins with 46 pieces. One complete move is one turn; a captured piece leaves the game and cannot be dropped later.'), fen: START_FEN },
          { kind: 'quiz', text: en('What happens to a captured piece in this edition?'), choices: [en('It leaves play; there are no drops.'), en('It changes sides and returns from hand.'), en('It becomes a new King.')], correct: 0, hint: en('The board has no piece-in-hand phase.') },
        ],
      },
      {
        id: 'step-and-jump', icon: 'STEP / JUMP', title: en('Steps and jumps'),
        summary: en('A short step and a direct two-square jump are different moves.'), xp: 20,
        steps: [
          { kind: 'info', text: en('A step lands on one adjacent square. Kirin and Phoenix can also jump directly two squares in named directions; the middle square does not stop a direct jump.'), fen: stepFen },
          { kind: 'move', text: en('Move the Kirin from f6. The engine accepts any one of its legal step or jump landings.'), fen: stepFen, solutions: [stepMove], hint: en('The Kirin steps diagonally or jumps two squares orthogonally.') },
        ],
      },
      {
        id: 'long-ranks', icon: 'SLIDE', title: en('Long ranks'),
        summary: en('Sliding pieces travel along a clear line and stop before a friendly piece.'), xp: 20,
        steps: [
          { kind: 'info', text: en('A slide may travel several squares along one permitted line. It cannot pass through an occupied square. The movement atlas lists the exact lines for every rank.'), fen: slideFen },
          { kind: 'squares', text: en('Tap every square the Rook on f6 can reach along its open files and ranks.'), fen: slideFen, answer: allFromRook, targetsOf: 'f6', hint: en('The Rook slides orthogonally until the edge or a piece.') },
        ],
      },
      {
        id: 'the-rank-atlas', icon: '29 RANKS', title: en('The rank atlas'),
        summary: en('Open the full movement table and compare each promoted form.'), xp: 20,
        steps: [
          { kind: 'info', text: en('The movement atlas shows all 29 distinct ranks, including the promoted forms with unique movement. Ten other promotions become a rank already present in the starting formation.'), fen: START_FEN },
          { kind: 'quiz', text: en('How many distinct movement ranks are used here?'), choices: [en('29'), en('21'), en('46')], correct: 0, hint: en('The starting set has 21 types; eight promotions add a new movement rank.') },
        ],
      },
    ],
  },
  {
    id: 'transformation',
    title: en('Promotion and royalty'),
    lessons: [
      {
        id: 'promotion-and-deferral', icon: 'PROMOTE', title: en('Promotion and deferral'),
        summary: en('Choose when to change a piece and learn the last-rank recovery.'), xp: 25,
        steps: [
          { kind: 'info', text: en('Promotion is optional when an eligible piece enters the far four-rank zone, or captures in or while leaving that zone. A declined chance is remembered: another chance follows when the piece leaves and re-enters or makes a qualifying capture. Pawn and Lance also receive a final-rank recovery chance; an unpromoted one left there is immobile.'), fen: promoteFen },
          { kind: 'move', text: en('Move the Pawn from c8 to c9. The same route can be played with or without promotion.'), fen: promoteFen, solutions: ['c8c9', 'c8c9+'], hint: en('The move enters White’s far four ranks. Promotion is optional.') },
        ],
      },
      {
        id: 'the-prince', icon: 'ROYAL', title: en('The Prince'),
        summary: en('A promoted Drunk Elephant becomes a second royal piece.'), xp: 20,
        steps: [
          { kind: 'info', text: en('When a Drunk Elephant promotes, it becomes a Prince and moves one square in any direction. The Prince is royal. If a side has one, defeating only its King does not end the game.'), fen: START_FEN },
          { kind: 'quiz', text: en('A player has a King and a Prince. Which royals must be defeated?'), choices: [en('Both the King and the Prince.'), en('Only the King.'), en('Only the Prince.')], correct: 0, hint: en('The Prince adds a second royal to that side.') },
        ],
      },
    ],
  },
  {
    id: 'lion-play',
    title: en('The Lion and its rules'),
    lessons: [
      {
        id: 'a-lion-turn', icon: '2 LANDINGS', title: en('A Lion turn'),
        summary: en('Make up to two King steps, turn between them, or jump two squares straight.'), xp: 30,
        steps: [
          { kind: 'info', text: en('A Lion may make up to two adjacent King steps in one turn and may turn after its first landing. It can capture on either landing, or make a direct two-square jump along a straight line. The route is one atomic move.'), fen: lionFen },
          { kind: 'move', text: en('Play the two-landing Lion route from f6. Inspect both squares before choosing the complete turn.'), fen: lionFen, solutions: [lionRoute], hint: en('A route lists the first landing and then the final landing.') },
        ],
      },
      {
        id: 'igui-and-jitto', icon: 'RETURN', title: en('Igui and Jitto'),
        summary: en('The Lion can capture and return, or pass through a square and return empty.'), xp: 25,
        steps: [
          { kind: 'info', text: en('Igui is a two-leg Lion turn that captures an adjacent piece and returns to its starting square. Jitto follows a two-leg route and returns without a capture. Their route strings share the same endpoints; the board position distinguishes them.'), fen: iguiFen },
          { kind: 'move', text: en('Capture the Pawn beside the Lion and return to f6 in the same turn.'), fen: iguiFen, solutions: [iguiMove], hint: en('The route ends on the Lion’s starting square after the capture.') },
        ],
      },
      {
        id: 'lion-trades', icon: 'LION RULES', title: en('Protected Lions'),
        summary: en('Learn protection, eligible tsukegui, and the complete-turn foot exception.'), xp: 30,
        steps: [
          { kind: 'info', text: en('An adjacent Lion may capture another Lion. A non-adjacent Lion capture is restricted while the target has a foot. Hidden line attacks also protect it. Tsukegui can capture an eligible intervening piece before the protected Lion, but Pawn and Go-Between do not qualify.'), fen: START_FEN },
          { kind: 'quiz', text: en('A Pawn is the target Lion’s only foot. The attacking Lion captures that Pawn earlier on its two-leg route. Is the Lion capture allowed on that same route?'), choices: [en('No. Protection lasts through the complete Lion turn.'), en('Yes. Removing the Pawn earlier makes it a legal tsukegui.'), en('Yes, but only if the two Lions are adjacent.')], correct: 0, hint: en('The 2004 clarification reads the full route as one action.') },
        ],
      },
      {
        id: 'first-lion', icon: 'FIRST LION', title: en('The first-Lion reply'),
        summary: en('A protected Lion can gain a one-reply counterstrike restriction.'), xp: 25,
        steps: [
          { kind: 'info', text: en('When a non-Lion captures an enemy Lion while a friendly Lion has a foot, the opponent receives a one-reply restriction. During that reply, a non-Lion cannot capture the newly protected Lion. A Lion capture or qualifying tsukegui keeps its priority.'), fen: START_FEN },
          { kind: 'quiz', text: en('When does the first-Lion restriction expire?'), choices: [en('After the opponent’s next move.'), en('At the end of the whole game.'), en('It never expires.')], correct: 0, hint: en('The counterstrike is stored for one reply only.') },
        ],
      },
    ],
  },
  {
    id: 'endings',
    title: en('Winning and repetition'),
    lessons: [
      {
        id: 'royal-endings', icon: 'ROYALS', title: en('Royal endings'),
        summary: en('There is no check restriction; capture all royals or force their capture.'), xp: 30,
        steps: [
          { kind: 'info', text: en('A King can remain under attack; there is no royal-safety restriction and no need to announce check. Capture ends the game when every opposing King and Prince is gone. The engine calls a forced royal mate only when the defender has no legal reply that prevents all remaining royals being captured on the next turn. A side with no legal move loses.'), fen: START_FEN },
          { kind: 'quiz', text: en('The opponent still has a King and a Prince. Capturing only the King ends the game immediately.'), choices: [en('False. The Prince must also be defeated.'), en('True. The King is the only royal.'), en('True, if the Prince is under attack.')], correct: 0, hint: en('The game ends after the last opposing royal is defeated.') },
        ],
      },
      {
        id: 'barren-material', icon: 'BARE KING', title: en('Barren material'),
        summary: en('The narrow three-piece end condition has a specific winner.'), xp: 20,
        steps: [
          { kind: 'info', text: en('When both Kings and exactly one other eligible piece remain, the side with two pieces wins. Dead unpromoted Pawn or Lance do not count. An unpromoted Pawn or Go-Between does not qualify as the extra piece.'), fen: START_FEN },
          { kind: 'quiz', text: en('Both Kings and one eligible Rook remain. Which side wins?'), choices: [en('The side with the Rook.'), en('The side whose King is to move.'), en('The game is always drawn.')], correct: 0, hint: en('The side with King plus the single extra piece has two pieces.') },
        ],
      },
      {
        id: 'repetition', icon: 'VARY', title: en('The duty to vary'),
        summary: en('Repeated positions are judged by who must change the sequence.'), xp: 30,
        steps: [
          { kind: 'info', text: en('At a fourth repeated position, the responsible player must have varied. Continuous royal attack assigns responsibility to the attacker; if only one side attacks opposing pieces, that side varies. When every move is Jitto by both players, the first passer varies. Quiet-cycle and loss adjudication are stated software conventions.'), fen: START_FEN },
          { kind: 'quiz', text: en('Only one side attacks opposing pieces throughout the repeated cycle. Who must vary?'), choices: [en('The side that attacked.'), en('The other side.'), en('The player who moved first in the game.')], correct: 0, hint: en('The rules assign the duty to the only side attacking pieces.') },
        ],
      },
    ],
  },
];

export const ALL_LESSONS: Lesson[] = LESSON_UNITS.flatMap((unit) => unit.lessons);

export const ATLAS_COVERAGE = {
  distinctRanks: RANK_GUIDE.length,
  promotionChanges: PROMOTION_GUIDE.length,
  startingPieceTypes: PIECE_TYPES.length,
  movesUsed: [stepMove, slideMove, lionRoute, iguiMove],
} as const;
