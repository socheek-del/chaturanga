import { MATE, type SearchAdapter } from '@chaturanga/ai-core';
import { Game } from '@chaturanga/dameo';
import { legalMoves, parseFen, type Move } from '@chaturanga/dameo/core';

const VALUE = { m: 100, k: 330 } as const;

interface MoveFacts {
  readonly captures: number;
  readonly promotes: boolean;
}

export function positionKey(fen: string): string {
  const [placement = '', turn = ''] = fen.trim().split(/\s+/);
  return `${placement} ${turn}`;
}

/** Adapts the authoritative Variant to ai-core without narrowing complete route UCI strings. */
export class DameoSearch implements SearchAdapter {
  private readonly idByUci = new Map<string, number>();
  private readonly uciById = new Map<number, string>();
  private facts = new Map<number, MoveFacts>();
  private nextId = 0;

  constructor(private readonly game: Game) {}

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
    if (!uci) throw new Error(`Unknown Dameo search move: ${move}`);
    return uci;
  }

  turn(): 0 | 1 {
    return this.game.turn === 'b' ? 1 : 0;
  }

  legalMoves(): number[] {
    this.facts = new Map();
    if (this.game.isGameOver()) return [];
    const moves = legalMoves(parseFen(this.game.fen()));
    return moves.map((move) => {
      const id = this.idFor(move.uci);
      this.facts.set(id, this.moveFacts(move));
      return id;
    });
  }

  make(move: number): void {
    this.game.move(this.decode(move));
  }

  unmake(): void {
    this.game.undo();
  }

  inCheck(): boolean {
    return false;
  }

  evaluate(): number {
    let whiteScore = 0;
    const whiteThreats = new Set(this.game.attackedSquares('w'));
    const blackThreats = new Set(this.game.attackedSquares('b'));
    for (const { square, piece } of this.game.pieces()) {
      const file = square % 8;
      const rank = Math.floor(square / 8);
      const advancement = piece.type === 'm' ? (piece.color === 'w' ? rank : 7 - rank) * 7 : 0;
      const center = Math.max(0, 5 - Math.abs(file - 3.5) - Math.abs(rank - 3.5)) * (piece.type === 'k' ? 3 : 2);
      const threatened = (piece.color === 'w' ? blackThreats : whiteThreats).has(square);
      const value = VALUE[piece.type] + advancement + center - (threatened ? VALUE[piece.type] * 0.42 : 0);
      whiteScore += piece.color === 'w' ? value : -value;
    }
    return this.game.turn === 'w' ? whiteScore : -whiteScore;
  }

  isTactical(move: number): boolean {
    const facts = this.facts.get(move);
    return !!facts && (facts.captures > 0 || facts.promotes);
  }

  orderKey(move: number): number {
    const facts = this.facts.get(move);
    if (!facts) return 0;
    return (facts.captures * 1_000) + (facts.promotes ? 500 : 0);
  }

  key(): string {
    return positionKey(this.game.fen());
  }

  terminalScore(): number | undefined {
    const status = this.game.status();
    if (status.kind === 'ongoing') return undefined;
    if (status.kind === 'repetition') return 0;
    if ('winner' in status && status.winner) return status.winner === this.game.turn ? MATE : -MATE;
    return 0;
  }

  private moveFacts(move: Move): MoveFacts {
    const moving = this.game.pieceAt(move.from);
    const promotes = moving?.type === 'm' && Math.floor(move.to / 8) === (moving.color === 'w' ? 7 : 0);
    return { captures: move.captures.length, promotes };
  }
}
