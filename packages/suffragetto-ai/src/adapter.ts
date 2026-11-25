import { MATE, type SearchAdapter } from '@chaturanga/ai-core';
import type { Color, Square } from '@chaturanga/rules-core';
import {
  ALBERT_HALL,
  Game,
  HOUSE_OF_COMMONS,
  HOSPITAL,
  HOSPITAL_GROUNDS,
  PRISON,
  PRISON_YARD,
  isPinkArena,
} from '@chaturanga/suffragetto';
import { squareOf } from '@chaturanga/rules-core';

const VALUE: Readonly<Record<string, number>> = { s: 100, p: 100, l: 180, i: 180 };

interface MoveFacts {
  captures: number;
  winning: boolean;
}

function goal(color: Color): readonly Square[] {
  return color === 'w' ? HOUSE_OF_COMMONS : ALBERT_HALL;
}

function goalCountAfterMove(game: Game, color: Color, from: Square, to: Square): number {
  let count = goal(color).filter((target) => game.pieceAt(target)?.color === color).length;
  if (goal(color).includes(from) && from !== to) count--;
  if (goal(color).includes(to) && game.pieceAt(to)?.color !== color) count++;
  return count;
}

function moveFacts(game: Game, uci: string): MoveFacts {
  const coordinates = uci.match(/[a-q]\d{1,2}/g) ?? [];
  if (coordinates.length < 2) return { captures: 0, winning: false };
  const path = coordinates.map((name) => squareOf(name, 17));
  if (path.some((square) => square === null)) return { captures: 0, winning: false };

  const squares = path as Square[];
  const piece = game.pieceAt(squares[0]!);
  if (!piece) return { captures: 0, winning: false };
  const moved = new Set<Square>();
  let captures = 0;
  for (let index = 1; index < squares.length; index++) {
    const from = squares[index - 1]!;
    const to = squares[index]!;
    const df = (to % 17) - (from % 17);
    const dr = Math.floor(to / 17) - Math.floor(from / 17);
    if (Math.max(Math.abs(df), Math.abs(dr)) !== 2) continue;
    const over = (from + to) / 2;
    if (!Number.isInteger(over) || moved.has(over)) continue;
    const target = game.pieceAt(over);
    const diagonal = df !== 0 && dr !== 0;
    const large = piece.type === 'l' || piece.type === 'i';
    if (target && target.color !== piece.color && isPinkArena(over) && (large || diagonal)) {
      captures += VALUE[target.type] ?? 100;
      moved.add(over);
    }
  }

  const to = squares.at(-1)!;
  const winning = goalCountAfterMove(game, piece.color, squares[0]!, to) === 6;
  return { captures, winning };
}

export function positionKey(fen: string): string {
  const [placement = '', turn = ''] = fen.trim().split(/\s+/);
  return `${placement} ${turn}`;
}

/**
 * Adapts the authoritative Game to ai-core. UCI routes are registered as opaque integer IDs because
 * chained hops can be longer than a machine-word move encoding; the actual route stays lossless.
 */
export class SuffragettoSearch implements SearchAdapter {
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
    if (!uci) throw new Error(`Unknown Suffragetto search move: ${move}`);
    return uci;
  }

  turn(): 0 | 1 {
    return this.game.turn === 'b' ? 1 : 0;
  }

  legalMoves(): number[] {
    this.facts = new Map();
    return this.game.legalUci().map((uci) => {
      const id = this.idFor(uci);
      this.facts.set(id, moveFacts(this.game, uci));
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
    for (const { square, piece } of this.game.pieces()) {
      const base = VALUE[piece.type] ?? 100;
      const captured = (piece.color === 'w' ? PRISON : HOSPITAL).includes(square);
      const staging = (piece.color === 'w' ? PRISON_YARD : HOSPITAL_GROUNDS).includes(square);
      const targetGoal = goal(piece.color);
      const distance = Math.min(...targetGoal.map((target) =>
        Math.abs((square % 17) - (target % 17)) +
        Math.abs(Math.floor(square / 17) - Math.floor(target / 17)),
      ));
      let value = base * (captured ? 0.2 : staging ? 0.75 : 1);
      if (!captured) value += (16 - distance) * (staging ? 2 : 4);
      if (targetGoal.includes(square)) value += 700;
      whiteScore += piece.color === 'w' ? value : -value;
    }

    const whiteThreats = new Set(this.game.attackedSquares('b'));
    const blackThreats = new Set(this.game.attackedSquares('w'));
    for (const { square, piece } of this.game.pieces()) {
      const threatened = piece.color === 'w' ? whiteThreats.has(square) : blackThreats.has(square);
      if (threatened) {
        const penalty = (VALUE[piece.type] ?? 100) * 0.38;
        whiteScore += piece.color === 'w' ? -penalty : penalty;
      }
    }
    return this.game.turn === 'w' ? whiteScore : -whiteScore;
  }

  isTactical(move: number): boolean {
    const facts = this.facts.get(move);
    return !!facts && (facts.captures > 0 || facts.winning);
  }

  orderKey(move: number): number {
    const facts = this.facts.get(move);
    if (!facts) return 0;
    if (facts.winning) return MATE;
    return facts.captures ? 1_000 + facts.captures : 0;
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
}
