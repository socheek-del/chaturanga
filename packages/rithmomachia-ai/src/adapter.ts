import { MATE, type SearchAdapter } from '@chaturanga/ai-core';
import { Game } from '@chaturanga/rithmomachia';
import {
  legalActions,
  parseFen,
  pieceFromType,
  positionKey as keyForPosition,
  PYRAMID_COMPONENTS,
  type Action,
  type Position,
} from '@chaturanga/rithmomachia/core';

interface MoveFacts {
  readonly capturedValue: number;
  readonly captureCount: number;
  readonly drops: boolean;
}

export function positionKey(fen: string): string {
  return keyForPosition(parseFen(fen));
}

/** Adapts the authoritative Variant to ai-core and preserves complete action strings in both directions. */
export class RithmomachiaSearch implements SearchAdapter {
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
    if (!uci) throw new Error(`Unknown Rithmomachia search move: ${move}`);
    return uci;
  }

  turn(): 0 | 1 { return this.game.turn === 'b' ? 1 : 0; }

  legalMoves(): number[] {
    const position = parseFen(this.game.fen());
    this.facts = new Map();
    const actions = legalActions(position);
    return actions.map((action) => {
      const id = this.idFor(action.uci);
      this.facts.set(id, this.moveFacts(position, action));
      return id;
    });
  }

  make(move: number): void { this.game.move(this.decode(move)); }
  unmake(): void { this.game.undo(); }
  inCheck(): boolean { return false; }

  evaluate(): number {
    const position = parseFen(this.game.fen());
    let whiteScore = 0;
    for (const piece of position.board) {
      if (!piece) continue;
      const magnitude = piece.value * 42 + (piece.shape === 'pyramid' ? 18 * countBits(piece.mask!) : 0);
      whiteScore += piece.color === 'w' ? magnitude : -magnitude;
    }
    for (const color of ['w', 'b'] as const) {
      for (const type of position.hands[color]) {
        const piece = pieceFromType(color, type, '');
        const magnitude = Math.round(piece.value * 30);
        whiteScore += color === 'w' ? magnitude : -magnitude;
      }
    }
    return this.game.turn === 'w' ? whiteScore : -whiteScore;
  }

  isTactical(move: number): boolean {
    return (this.facts.get(move)?.captureCount ?? 0) > 0;
  }

  orderKey(move: number): number {
    const facts = this.facts.get(move);
    return facts ? facts.capturedValue * 10 + facts.captureCount * 1_000 + (facts.drops ? 1 : 0) : 0;
  }

  key(): string { return positionKey(this.game.fen()); }

  terminalScore(): number | undefined {
    const status = this.game.status();
    if (status.kind === 'ongoing') return undefined;
    if (status.kind === 'repetition' || status.kind === 'counting') return 0;
    if ('winner' in status && status.winner) return status.winner === this.game.turn ? MATE : -MATE;
    return 0;
  }

  private moveFacts(position: Position, action: Action): MoveFacts {
    if (action.kind !== 'capture') return { capturedValue: 0, captureCount: 0, drops: action.kind === 'drop' };
    const target = position.board[action.to]!;
    const captureCount = action.takesWholePiece ? 1 : action.components.length;
    const capturedValue = action.takesWholePiece
      ? target.value
      : action.components.reduce((total, index) => total + PYRAMID_COMPONENTS[index]!.value, 0);
    return { capturedValue, captureCount, drops: false };
  }
}

function countBits(value: number): number {
  let count = 0;
  for (let bits = value; bits > 0; bits &= bits - 1) count++;
  return count;
}
