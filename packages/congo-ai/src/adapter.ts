import { MATE, type SearchAdapter } from '@chaturanga/ai-core';
import { squareOf, type Square } from '@chaturanga/rules-core';
import { Game, FILES, RIVER_RANK, type PieceType } from '@chaturanga/congo';

export const PIECE_VALUE: Record<PieceType, number> = {
  l: 18_000,
  z: 310,
  e: 350,
  g: 420,
  c: 450,
  m: 500,
  p: 100,
  s: 190,
};

export const keyOfFen = (fen: string): string => fen.split(' ').slice(0, 2).join(' ');

interface ParsedMove { from: Square; path: Square[]; promotion: boolean }

function parseMove(uci: string): ParsedMove | null {
  const promotion = uci.endsWith('+');
  const coordinates = promotion ? uci.slice(0, -1) : uci;
  const names = coordinates.match(/[a-g][1-7]/g);
  if (!names || names.length < 2 || names.join('') !== coordinates) return null;
  const squares = names.map((name) => squareOf(name, FILES));
  if (squares.some((square) => square === null || square < 0)) return null;
  return { from: squares[0]!, path: squares.slice(1) as Square[], promotion };
}

function capturedPieces(game: Game, uci: string): Array<{ type: PieceType; color: string }> {
  const parsed = parseMove(uci);
  if (!parsed) return [];
  const mover = game.pieceAt(parsed.from);
  if (!mover) return [];
  const captured: Array<{ type: PieceType; color: string }> = [];
  let from = parsed.from;
  for (const to of parsed.path) {
    const target = game.pieceAt(to);
    if (target?.color !== mover.color && target) captured.push({ type: target.type, color: target.color });
    if (mover.type === 'm') {
      const midFile = (from % FILES + to % FILES) / 2;
      const midRank = (Math.floor(from / FILES) + Math.floor(to / FILES)) / 2;
      if (Number.isInteger(midFile) && Number.isInteger(midRank)) {
        const jumped = game.pieceAt(midRank * FILES + midFile);
        if (jumped?.color !== mover.color && jumped) {
          captured.push({ type: jumped.type, color: jumped.color });
        }
      }
    }
    from = to;
  }
  return captured;
}

export function evaluate(game: Game): number {
  let whiteScore = 0;
  for (const { square, piece } of game.pieces()) {
    const rank = Math.floor(square / FILES);
    const file = square % FILES;
    const forward = piece.color === 'w' ? rank - 1 : 5 - rank;
    const center = 3 - Math.abs(file - 3) + 3 - Math.abs(rank - RIVER_RANK);
    let value = PIECE_VALUE[piece.type];
    if (piece.type === 'p') value += Math.max(-3, Math.min(5, forward)) * 9;
    if (piece.type === 's') value += Math.max(-2, Math.min(5, forward)) * 5;
    if (piece.type === 'c' && rank === RIVER_RANK) value += 35;
    if (piece.type !== 'l' && piece.type !== 'p' && piece.type !== 's') value += center * 4;
    if (piece.riverDeadline) value -= 25;
    whiteScore += piece.color === 'w' ? value : -value;
  }

  const whiteLion = game.pieces().find(({ piece }) => piece.color === 'w' && piece.type === 'l');
  const blackLion = game.pieces().find(({ piece }) => piece.color === 'b' && piece.type === 'l');
  if (whiteLion && blackLion) {
    if (game.attackedSquares('w').includes(blackLion.square)) whiteScore += 900;
    if (game.attackedSquares('b').includes(whiteLion.square)) whiteScore -= 900;
  }

  return game.turn === 'w' ? whiteScore : -whiteScore;
}

export class CongoSearch implements SearchAdapter {
  private nextId = 0;
  private readonly moves = new Map<number, string>();
  private readonly tactics = new Map<number, boolean>();
  private readonly order = new Map<number, number>();

  constructor(readonly game: Game) {}

  turn(): 0 | 1 { return this.game.turn === 'w' ? 0 : 1; }

  legalMoves(): number[] {
    return this.game.legalUci().map((uci) => {
      const id = ++this.nextId;
      this.moves.set(id, uci);
      const captures = capturedPieces(this.game, uci);
      const parsed = parseMove(uci)!;
      const attacker = this.game.pieceAt(parsed.from)!;
      const capturedValue = captures.reduce((sum, piece) => sum + PIECE_VALUE[piece.type], 0);
      const terminal = captures.some((piece) => piece.type === 'l');
      const isTactical = captures.length > 0 || parsed.promotion;
      this.tactics.set(id, isTactical);
      this.order.set(id, (terminal ? MATE : capturedValue - PIECE_VALUE[attacker.type] / 8) + (parsed.promotion ? 350 : 0));
      return id;
    });
  }

  make(move: number): void { this.game.move(this.moves.get(move)!); }
  unmake(): void { this.game.undo(); }
  inCheck(): boolean { return false; }
  key(): string { return keyOfFen(this.game.fen()); }
  terminalScore(): number | undefined {
    const status = this.game.status();
    if (status.kind === 'ongoing') return undefined;
    if (!('winner' in status) || !status.winner) return 0;
    return status.winner === this.game.turn ? MATE : -MATE;
  }
  repetitionScore(): number | undefined { return this.game.status().kind === 'repetition' ? 0 : undefined; }
  evaluate(): number { return evaluate(this.game); }
  isTactical(move: number): boolean { return this.tactics.get(move) ?? false; }
  orderKey(move: number): number { return this.order.get(move) ?? 0; }
  toUci(move: number): string { return this.moves.get(move)!; }
}
