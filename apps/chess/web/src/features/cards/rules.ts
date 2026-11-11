/**
 * Card Chess: chess where a hand of Uno-rules cards decides what may move.
 *
 * - Each player holds cards (seven to start). On your turn you play one card that matches the top of the
 *   pile by colour or symbol (Uno law), then make a chess move the card allows.
 * - The card's colour picks the pieces: red = queen and rooks, blue = bishops, green = knights, yellow =
 *   pawns. The king answers to every card. A wild lets any piece move, and you name the next colour.
 * - Skip and Reverse give you another move (two-player Uno law); Draw Two and Wild Draw Four also make the
 *   opponent draw. Chess safety first: if your move gives check, the extra move is cancelled (the opponent
 *   must answer the check) but the draw still happens.
 * - Every capture makes the captured side's owner draw one card.
 * - No card that fits? Draw one. Still stuck: pass — unless you are in check, then keep drawing until a card
 *   saves your king.
 * - Call "Uno" before you play your second-to-last card, or draw two.
 * - You win by checkmate, or by playing your last card.
 *
 * Pure: the state is plain data (a FEN and an Uno state), so it can be saved and restored.
 */
import { Game, type MoveRecord, moveToUci, type PieceType } from '@chaturanga/chess';
import {
  type Card,
  type CardColor,
  callUno,
  draw,
  give,
  isWild,
  newGame,
  pass,
  play,
  playableCards,
  type UnoEvent,
  type UnoState,
} from '@chaturanga/uno';

export type Side = 'w' | 'b';

/** Which pieces each colour moves. The king is never listed: it may move with any card. */
export const COLOR_PIECES: Record<CardColor, readonly PieceType[]> = {
  red: ['q', 'r'],
  blue: ['b'],
  green: ['n'],
  yellow: ['p'],
};

export const sideOf = (player: number): Side => (player === 0 ? 'w' : 'b');
export const playerOf = (side: Side): number => (side === 'w' ? 0 : 1);

export type CardChessResult =
  | { kind: 'checkmate' | 'last-card'; winner: Side }
  | { kind: 'stalemate' | 'insufficient-material' | 'fifty-move' | 'repetition' };

export type LogEntry =
  | { kind: 'move'; side: Side; card: Card; color: CardColor; san: string; uci: string }
  | { kind: 'free-move'; side: Side; san: string; uci: string }
  | { kind: 'draw'; side: Side; count: number; reason: 'stuck' | 'draw2' | 'wild4' | 'uno-penalty' | 'capture' }
  | { kind: 'pass'; side: Side }
  | { kind: 'skip'; side: Side }
  | { kind: 'skip-cancelled'; side: Side }
  | { kind: 'uno'; side: Side };

export interface CardChessState {
  fen: string;
  uno: UnoState;
  result: CardChessResult | null;
  /** The last chess move, for the board's highlight. */
  lastMove: { from: number; to: number; uci: string } | null;
  log: LogEntry[];
}

/** What a step changed, in order, so the screen can animate it. */
export type CardChessEvent =
  | { kind: 'uno'; event: UnoEvent }
  | { kind: 'move'; record: MoveRecord }
  | { kind: 'capture-draw'; side: Side }
  | { kind: 'skip-cancelled'; side: Side }
  | { kind: 'result'; result: CardChessResult };

export interface CardChessStep {
  state: CardChessState;
  events: CardChessEvent[];
}

export class CardChessError extends Error {
  constructor(message: string) {
    super(`Card Chess: ${message}`);
    this.name = 'CardChessError';
  }
}

export function newCardChess(seed: number, fen?: string): CardChessState {
  const game = new Game(fen);
  const uno = newGame(2, seed);
  return { fen: game.fen(), uno: { ...uno, current: playerOf(game.turn) }, result: null, lastMove: null, log: [] };
}

export const turnOf = (state: CardChessState): Side => sideOf(state.uno.current);
export const gameOf = (state: CardChessState): Game => new Game(state.fen);

/** Legal chess moves a card allows: its colour's pieces plus the king; a wild allows every move. */
export function movesForCard(game: Game, card: Card): string[] {
  const legal = game.legalMoves();
  const pieces = isWild(card) ? null : COLOR_PIECES[card.color!];
  const out: string[] = [];
  for (const move of legal) {
    const piece = game.pieceAt(move.from)!;
    if (pieces === null || piece.type === 'k' || pieces.includes(piece.type)) out.push(moveToUci(move));
  }
  return out;
}

export interface CardOption {
  card: Card;
  moves: string[];
}

/** The current player's cards that Uno allows and that also have at least one chess move. */
export function cardOptions(state: CardChessState): CardOption[] {
  if (state.result) return [];
  const game = gameOf(state);
  return playableCards(state.uno)
    .map((card) => ({ card, moves: movesForCard(game, card) }))
    .filter((option) => option.moves.length > 0);
}

/** Every card in the current hand with the moves it would allow if it could be played (for highlighting). */
export function movesByCard(state: CardChessState): Map<number, string[]> {
  const game = gameOf(state);
  const map = new Map<number, string[]>();
  for (const card of state.uno.hands[state.uno.current]!) map.set(card.id, movesForCard(game, card));
  return map;
}

const canDrawAnything = (uno: UnoState) => uno.drawPile.length > 0 || uno.discard.length > 1;

export type TurnNeed =
  /** At least one card can be played. */
  | 'play'
  /** Nothing fits: draw a card. */
  | 'draw'
  /** Drew and still nothing fits: pass. */
  | 'pass'
  /** In check, nothing fits and the decks are empty: any legal move is allowed without a card. */
  | 'free-move'
  | 'over';

export function turnNeed(state: CardChessState): TurnNeed {
  if (state.result) return 'over';
  if (cardOptions(state).length > 0) return 'play';
  const game = gameOf(state);
  if (game.inCheck()) return canDrawAnything(state.uno) ? 'draw' : 'free-move';
  if (state.uno.drawnThisTurn > 0 || !canDrawAnything(state.uno)) return 'pass';
  return 'draw';
}

/** The current player plays `cardId` and makes the chess move `uci` with it. */
export function playCard(state: CardChessState, cardId: number, uci: string, color?: CardColor): CardChessStep {
  if (state.result) throw new CardChessError('game over');
  const option = cardOptions(state).find((o) => o.card.id === cardId);
  if (!option) throw new CardChessError('card cannot be played');
  if (!option.moves.includes(uci)) throw new CardChessError(`card does not allow ${uci}`);
  if (isWild(option.card) && !color) throw new CardChessError('a wild needs a colour');

  const side = turnOf(state);
  const game = gameOf(state);
  const record = game.move(uci);
  const opponentInCheck = game.inCheck();
  const chessOver = game.isGameOver();

  const played = play(state.uno, cardId, { color, suppressSkip: opponentInCheck || chessOver });
  const events: CardChessEvent[] = [{ kind: 'move', record }];
  const log: LogEntry[] = [
    ...state.log,
    { kind: 'move', side, card: option.card, color: played.state.color, san: record.san, uci: record.uci },
  ];
  const extraTurn = played.state.current === playerOf(side);
  if (opponentInCheck && ['skip', 'reverse', 'draw2', 'wild4'].includes(option.card.kind)) {
    events.push({ kind: 'skip-cancelled', side });
    log.push({ kind: 'skip-cancelled', side });
  }
  return finishTurn(
    { ...state, fen: game.fen(), lastMove: { from: record.from, to: record.to, uci: record.uci }, log },
    played.state,
    played.events,
    events,
    { record, extraTurn, mover: side },
  );
}

/** In check with nothing to draw and no card that helps: any legal move, no card. */
export function freeMove(state: CardChessState, uci: string): CardChessStep {
  if (turnNeed(state) !== 'free-move') throw new CardChessError('no free move now');
  const side = turnOf(state);
  const game = gameOf(state);
  const record = game.move(uci);
  const passed = pass(state.uno, true);
  return finishTurn(
    {
      ...state,
      fen: game.fen(),
      lastMove: { from: record.from, to: record.to, uci: record.uci },
      log: [...state.log, { kind: 'free-move', side, san: record.san, uci: record.uci }],
    },
    passed.state,
    passed.events,
    [{ kind: 'move', record }],
    { record, extraTurn: false, mover: side },
  );
}

/** Applies what follows every chess move: the capture draw, the result, and the null move of an extra turn. */
function finishTurn(
  state: CardChessState,
  uno: UnoState,
  unoEvents: UnoEvent[],
  events: CardChessEvent[],
  { record, extraTurn, mover }: { record: MoveRecord; extraTurn: boolean; mover: Side },
): CardChessStep {
  let log = state.log;
  for (const event of unoEvents) {
    events.push({ kind: 'uno', event });
    log = [...log, ...logOfUno(event)];
  }

  const game = new Game(state.fen);
  const status = game.status();
  if (status.kind !== 'ongoing') {
    const result: CardChessResult =
      status.kind === 'checkmate' ? { kind: 'checkmate', winner: mover } : { kind: status.kind as 'stalemate' };
    events.push({ kind: 'result', result });
    return { state: { ...state, uno, log, result }, events };
  }
  if (uno.winner !== null) {
    const result: CardChessResult = { kind: 'last-card', winner: mover };
    events.push({ kind: 'result', result });
    return { state: { ...state, uno, log, result }, events };
  }

  if (record.captured) {
    const victim = record.color === 'w' ? 'b' : 'w';
    const drawn = give(uno, playerOf(victim), 1, 'host');
    uno = drawn.state;
    events.push({ kind: 'capture-draw', side: victim });
    for (const event of drawn.events) events.push({ kind: 'uno', event });
    log = [...log, { kind: 'draw', side: victim, count: 1, reason: 'capture' }];
  }

  let fen = state.fen;
  if (extraTurn) {
    const flipped = nullMove(fen);
    if (new Game(flipped).legalMoves().length > 0) {
      fen = flipped;
    } else {
      // The mover would have no move on the extra turn: hand the turn over instead of ending in stalemate.
      uno = pass(uno, true).state;
    }
  }
  return { state: { ...state, fen, uno, log }, events };
}

function logOfUno(event: UnoEvent): LogEntry[] {
  switch (event.type) {
    case 'draw':
      if (event.reason === 'host' || event.reason === 'stuck') return [];
      return [{ kind: 'draw', side: sideOf(event.player), count: event.cards.length, reason: event.reason }];
    case 'skip':
      return [{ kind: 'skip', side: sideOf(event.player) }];
    default:
      return [];
  }
}

/** The same position with the other side to move: how a lost turn looks to the chess engine. */
export function nullMove(fen: string): string {
  const [board, turn, castling, , half, full] = fen.split(' ');
  const nextTurn = turn === 'w' ? 'b' : 'w';
  const fullmove = turn === 'b' ? Number(full) + 1 : Number(full);
  return `${board} ${nextTurn} ${castling} - ${half} ${fullmove}`;
}

/** The current player draws because nothing fits. */
export function drawCard(state: CardChessState): CardChessStep {
  if (turnNeed(state) !== 'draw') throw new CardChessError('cannot draw now');
  const step = draw(state.uno);
  const side = turnOf(state);
  const count = step.events.reduce((n, e) => n + (e.type === 'draw' ? e.cards.length : 0), 0);
  return {
    state: { ...state, uno: step.state, log: [...state.log, { kind: 'draw', side, count, reason: 'stuck' }] },
    events: step.events.map((event) => ({ kind: 'uno' as const, event })),
  };
}

/** The current player passes after drawing (never while in check). */
export function passTurn(state: CardChessState): CardChessStep {
  if (turnNeed(state) !== 'pass') throw new CardChessError('cannot pass now');
  const side = turnOf(state);
  const step = pass(state.uno, true);
  const fen = nullMove(state.fen);
  const next = { ...state, fen, uno: step.state, log: [...state.log, { kind: 'pass' as const, side }] };
  const status = new Game(fen).status();
  if (status.kind === 'stalemate') {
    const result: CardChessResult = { kind: 'stalemate' };
    return { state: { ...next, result }, events: [{ kind: 'uno', event: step.events[0]! }, { kind: 'result', result }] };
  }
  return { state: next, events: step.events.map((event) => ({ kind: 'uno' as const, event })) };
}

/** `side` calls Uno (two cards on their turn, or one card any time). */
export function sayUno(state: CardChessState, side: Side): CardChessStep {
  const step = callUno(state.uno, playerOf(side));
  return {
    state: { ...state, uno: step.state, log: [...state.log, { kind: 'uno', side }] },
    events: step.events.map((event) => ({ kind: 'uno' as const, event })),
  };
}

/** Whether `side` may call Uno right now and has not yet. */
export function canSayUno(state: CardChessState, side: Side): boolean {
  if (state.result) return false;
  const player = playerOf(side);
  const cards = state.uno.hands[player]!.length;
  if (state.uno.unoCalled[player]) return false;
  return cards === 1 || (cards === 2 && state.uno.current === player);
}
