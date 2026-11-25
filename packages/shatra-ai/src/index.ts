import { MATE, search, type SearchAdapter } from '@chaturanga/ai-core';
import { squareOf, type Square } from '@chaturanga/rules-core';
import { FILES, Game, isFortress, rankOf, type PieceType } from '@chaturanga/shatra';

const values: Record<PieceType, number> = { k: 12_000, b: 780, s: 110 };
export const valueOf = (type: PieceType): number => values[type];

function parseMove(uci: string): { from: Square; path: Square[] } | null {
  const promotion = /[a-z+]$/.test(uci) ? uci.at(-1)! : '';
  const coordinates = promotion ? uci.slice(0, -1) : uci;
  const names = coordinates.match(/[a-p]\d{1,2}/g);
  if (!names || names.length < 2 || names.join('') !== coordinates) return null;
  const squares = names.map((name) => squareOf(name, FILES));
  if (squares.some((square) => square === null || square < 0)) return null;
  return { from: squares[0]!, path: squares.slice(1) as Square[] };
}

function isCapture(game: Game, uci: string): boolean {
  const move = parseMove(uci);
  if (!move) return false;
  let from = move.from;
  for (const to of move.path) {
    const dx = to % FILES - from % FILES;
    const dy = Math.floor(to / FILES) - Math.floor(from / FILES);
    if (dx !== 0 && dy !== 0 && Math.abs(dx) !== Math.abs(dy)) {
      from = to;
      continue;
    }
    const df = Math.sign(dx);
    const dr = Math.sign(dy);
    if (df === 0 && dr === 0) return false;
    let current = from;
    while (true) {
      const file = current % FILES + df;
      const rank = Math.floor(current / FILES) + dr;
      const next = rank * FILES + file;
      if (next === to) break;
      const piece = game.pieceAt(next);
      if (piece && piece.color !== game.turn) return true;
      current = next;
      if (file < 0 || file >= FILES || rank < 0 || rank >= 14) break;
    }
    from = to;
  }
  return false;
}

class ShatraSearch implements SearchAdapter {
  private nextId = 0;
  private readonly moves = new Map<number, string>();
  private readonly tactical = new Map<number, boolean>();

  constructor(private readonly game: Game) {}

  turn(): 0 | 1 { return this.game.turn === 'w' ? 0 : 1; }

  legalMoves(): number[] {
    return this.game.legalUci().map((uci) => {
      const id = ++this.nextId;
      this.moves.set(id, uci);
      this.tactical.set(id, isCapture(this.game, uci) || uci.endsWith('b'));
      return id;
    });
  }

  make(move: number): void {
    this.game.move(this.moves.get(move)!);
  }

  unmake(): void { this.game.undo(); }
  inCheck(): boolean { return false; }
  key(): string { return this.game.fen().split(' ').slice(0, 3).join(' '); }
  isTactical(move: number): boolean { return this.tactical.get(move) ?? false; }

  terminalScore(): number | undefined {
    const status = this.game.status();
    if (status.kind === 'ongoing') return undefined;
    if (!('winner' in status) || !status.winner) return 0;
    return status.winner === this.game.turn ? MATE : -MATE;
  }

  uci(move: number): string | null { return this.moves.get(move) ?? null; }

  evaluate(): number {
    return this.game.pieces().reduce((score, { square, piece }) => {
      const sign = piece.color === this.game.turn ? 1 : -1;
      const rank = rankOf(square);
      const advance = piece.color === 'w' ? rank - 4 : 9 - rank;
      const advancement = piece.type === 's' ? Math.max(-2, Math.min(8, advance)) * 7 : 0;
      const reserveAdjustment = piece.type === 's' && isFortress(square) ? -20 : 0;
      const centrality = 5 - Math.abs(square % FILES - 3) - Math.abs(rank - 6.5) / 2;
      const activity = piece.type === 'k' ? centrality * 2 : piece.type === 'b' ? centrality * 4 : 0;
      return score + sign * (valueOf(piece.type) + advancement + reserveAdjustment + activity);
    }, 0);
  }

  orderKey(move: number): number {
    const uci = this.moves.get(move)!;
    const parsed = parseMove(uci);
    if (!parsed) return 0;
    const attacker = this.game.pieceAt(parsed.from);
    if (!attacker) return 0;
    const captureBonus = isCapture(this.game, uci) ? 1_000 + valueOf('s') * 2 - valueOf(attacker.type) / 4 : 0;
    return captureBonus + (uci.endsWith('b') ? valueOf('b') : 0);
  }
}

export function chooseMove(
  startFen: string,
  moves: readonly string[],
  options: { maxNodes?: number; deadline?: number } = {},
): string | null {
  const game = new Game(startFen);
  for (const move of moves) game.move(move);
  const legal = game.legalUci();
  if (!legal.length) return null;
  const adapter = new ShatraSearch(game);
  const result = search(adapter, {
    maxDepth: 3,
    maxNodes: options.maxNodes ?? 600,
    deadline: options.deadline,
    exactRootScores: false,
    contempt: 0,
  });
  return result.move < 0 ? legal[0]! : adapter.uci(result.move) ?? legal[0]!;
}
