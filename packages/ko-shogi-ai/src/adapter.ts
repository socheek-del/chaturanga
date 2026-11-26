import type { SearchAdapter } from '@chaturanga/ai-core';
import { Game, squareOf } from '@chaturanga/ko-shogi';
import type { Candidate } from '@chaturanga/ko-shogi';
import { evaluate, PIECE_VALUE, repetitionScore, terminalScore } from './evaluate';

interface SearchUndo {
  readonly candidates: Map<number, Candidate> | null;
  readonly priorities: Map<number, number> | null;
}

export function positionKey(fen: string): string {
  const [version, turn = '', lost = '', placement = ''] = fen.trim().split(/\s+/);
  if (version !== 'ks1') throw new Error(`Invalid Ko Shogi position key: ${fen}`);
  return `${placement} ${turn} ${lost}`;
}

export class KoShogiSearch implements SearchAdapter {
  private nextId = 0;
  private readonly idByUci = new Map<string, number>();
  private readonly uciById = new Map<number, string>();
  private currentCandidates: Map<number, Candidate> | null = null;
  private priorities: Map<number, number> | null = null;
  private readonly undo: SearchUndo[] = [];

  constructor(
    private readonly game: Game,
    private readonly maxRootMoves = 320,
    private readonly maxMovesPerPiece = 16,
  ) {}

  private idFor(uci: string): number {
    const known = this.idByUci.get(uci);
    if (known !== undefined) return known;
    const id = this.nextId++;
    this.idByUci.set(uci, id);
    this.uciById.set(id, uci);
    return id;
  }

  decode(move: number): string {
    const uci = this.uciById.get(move);
    if (!uci) throw new Error(`Unknown Ko Shogi search move: ${move}`);
    return uci;
  }

  turn(): 0 | 1 { return this.game.turn === 'w' ? 0 : 1; }

  legalMoves(): number[] {
    this.currentCandidates = new Map();
    this.priorities = new Map();
    const board = this.game.pieces();
    const bySquare = new Map(board.map(({ square, piece }) => [square, piece]));
    const candidates = this.game.searchCandidates(this.maxRootMoves, this.maxMovesPerPiece);
    for (const candidate of candidates) {
      const id = this.idFor(candidate.uci);
      this.currentCandidates.set(id, candidate);
      this.priorities.set(id, priorityOf(candidate.uci, this.game.turn, bySquare));
    }
    return [...this.currentCandidates.keys()];
  }

  make(move: number): void {
    const candidate = this.currentCandidates?.get(move);
    if (!candidate) throw new Error(`Search requested an unknown Ko Shogi move: ${move}`);
    this.undo.push({ candidates: this.currentCandidates, priorities: this.priorities });
    this.game.playSearchCandidate(candidate);
    this.currentCandidates = null;
    this.priorities = null;
  }

  unmake(): void {
    const entry = this.undo.pop();
    if (!entry) throw new Error('Ko Shogi search undo stack is empty');
    this.game.undo();
    this.currentCandidates = entry.candidates;
    this.priorities = entry.priorities;
  }

  inCheck(): boolean { return false; }

  evaluate(): number { return evaluate(this.game); }

  // The very wide 19×19 root is searched one ply; captures still order first, while quiescence is disabled.
  isTactical(_move: number): boolean { return false; }

  tacticalMoves(): number[] { return []; }

  orderKey(move: number): number { return this.priorities?.get(move) ?? 0; }

  key(): string { return positionKey(this.game.fen()); }

  terminalScore(): number | undefined { return terminalScore(this.game); }

  repetitionScore(): number | undefined { return repetitionScore(this.game); }
}

function priorityOf(uci: string, color: 'w' | 'b', pieces: ReadonlyMap<number, { color: string; type: string; promoted: boolean }>): number {
  const body = uci.split('=')[0]!;
  const segments = body.split('-').slice(1);
  let score = uci.includes('=') ? 250 : 0;
  const squares = body.match(/[a-s](?:1[0-9]|[1-9])/g) ?? [];
  const origin = squares[0] ? squareOf(squares[0]) : null;
  const mover = origin === null ? undefined : pieces.get(origin);
  for (const coordinate of squares.slice(1)) {
    const square = squareOf(coordinate);
    const target = square === null ? undefined : pieces.get(square);
    if (target?.color !== color && target) score += PIECE_VALUE[target.type as keyof typeof PIECE_VALUE] ?? 100;
  }
  if (mover && segments.length > 1) score += 10;
  return score;
}
