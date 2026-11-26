import { makruk } from '@chaturanga/makruk';
import { ClientMessage, GameSnapshot } from '@chaturanga/protocol';
import { activePlayers, IllegalMoveError, type Color, type Variant, type VariantGame, type VariantMoveRecord } from '@chaturanga/rules-core';
import { sittuyin } from '@chaturanga/sittuyin';
import { describe, expect, it } from 'vitest';
import { applyMessage, createRoom, join, leave, nextAlarm, replay, roomStatus, settle, snapshot } from './roomLogic';

const alice = { id: 'u-alice', name: 'Alice', kind: 'guest' as const };
const bob = { id: 'u-bob', name: 'Bob', kind: 'guest' as const };
const code = () => 'NEXT23';

class ConcurrentTestGame implements VariantGame<Color> {
  private records: VariantMoveRecord<Color>[] = [];
  private opening = true;
  private next: Color = 'w';

  get turn(): Color { return this.next; }
  activePlayers(): readonly Color[] { return this.opening ? ['w', 'b'] : [this.next]; }
  fen(): string { return `start:${this.records.map(({ color, uci }) => `${color}.${uci}`).join(',')}`; }
  pieceAt(): null { return null; }
  pieces(): Array<{ square: number; piece: never }> { return []; }
  hand(): readonly string[] { return []; }
  legalUci(): string[] { return this.legalUciFor(this.turn); }
  legalUciFor(color: Color): string[] {
    if (!this.activePlayers().includes(color)) return [];
    if (!this.opening) return ['e1e2'];
    const whitePrepared = this.records.some((move) => move.color === 'w' && move.uci === 'a1a2');
    return ['a1a2', ...(color === 'w' || whitePrepared ? ['b1b2'] : []), 'c1c2'];
  }
  move(uci: string): VariantMoveRecord<Color> { return this.moveFor(this.turn, uci); }
  moveFor(color: Color, uci: string): VariantMoveRecord<Color> {
    if (!this.legalUciFor(color).includes(uci)) throw new IllegalMoveError(uci);
    const enemy: Color = color === 'w' ? 'b' : 'w';
    const captured = uci === 'c1c2' ? { color: enemy, type: 'p', promoted: false } : null;
    const record: VariantMoveRecord<Color> = {
      color, uci, san: uci, piece: { color, type: 'p', promoted: false }, captured,
      action: captured ? 'capture' : 'move', to: 0, fenAfter: '',
    };
    if (captured) {
      this.opening = false;
      this.next = color === 'w' ? 'b' : 'w';
    }
    this.records.push(record);
    record.fenAfter = this.fen();
    return record;
  }
  undo(): VariantMoveRecord<Color> | null { return this.records.pop() ?? null; }
  moves(): VariantMoveRecord<Color>[] { return [...this.records]; }
  lastMove(): VariantMoveRecord<Color> | null { return this.records.at(-1) ?? null; }
  status() { return { kind: 'ongoing' as const }; }
  isGameOver(): boolean { return false; }
  inCheck(): boolean { return false; }
  checkedKingSquare(): null { return null; }
  attackedSquares(): number[] { return []; }
  counting(): null { return null; }
}

const concurrentVariant: Variant<ConcurrentTestGame> = {
  id: 'concurrent-test', files: 8, ranks: 8, startFen: 'start', pieceTypes: ['p'], hasHands: false,
  createGame: () => new ConcurrentTestGame(),
};

function playingRoom(timeControl = { initialMs: 60_000, incrementMs: 2_000 }) {
  const created = createRoom(makruk, { code: 'ABCDEF', creator: alice, color: 'w', timeControl, now: 0 });
  return join(makruk, created, bob, 1_000).room;
}

describe('seating', () => {
  it('waits for a second player, then starts with White on the clock', () => {
    const room = createRoom(makruk, { code: 'ABCDEF', creator: alice, color: 'b', timeControl: { initialMs: 60_000, incrementMs: 0 }, now: 0 });
    expect(roomStatus(room)).toBe('waiting');
    const joined = join(makruk, room, bob, 5_000);
    expect(joined.color).toBe('w');
    expect(roomStatus(joined.room)).toBe('playing');
    expect(joined.room.clock?.running).toBe('w');
  });

  it('reseats a returning player and makes a third person a spectator', () => {
    const room = playingRoom();
    expect(join(makruk, room, alice, 2_000).color).toBe('w');
    expect(join(makruk, room, { id: 'u-carol', name: 'Carol', kind: 'guest' }, 2_000).color).toBeNull();
  });
});

describe('moves (online-001)', () => {
  it('accepts a legal move on your turn and presses the clock with increment', () => {
    const { room, error } = applyMessage(makruk, playingRoom(), 'w', { type: 'move', uci: 'e3e4', ply: 0 }, 11_000, code);
    expect(error).toBeUndefined();
    expect(room.moves).toEqual(['e3e4']);
    expect(room.clock?.running).toBe('b');
    expect(room.clock?.remaining.w).toBe(60_000 - 10_000 + 2_000);
  });

  it('rejects illegal moves, wrong turns, stale plies and spectators', () => {
    const room = playingRoom();
    expect(applyMessage(makruk, room, 'w', { type: 'move', uci: 'e3e5', ply: 0 }, 2_000, code).error).toBe('illegal_move');
    expect(applyMessage(makruk, room, 'b', { type: 'move', uci: 'e6e5', ply: 0 }, 2_000, code).error).toBe('not_your_turn');
    expect(applyMessage(makruk, room, 'w', { type: 'move', uci: 'e3e4', ply: 3 }, 2_000, code).error).toBe('stale_ply');
    expect(applyMessage(makruk, room, null, { type: 'move', uci: 'e3e4', ply: 0 }, 2_000, code).error).toBe('not_a_player');
  });

  it('ends the game on checkmate', () => {
    const room = { ...playingRoom(), startFen: 'k7/2R5/8/8/8/8/8/4K2R w - - 0 1' };
    const { room: after } = applyMessage(makruk, room, 'w', { type: 'move', uci: 'h1h8', ply: 0 }, 2_000, code);
    expect(after.result).toEqual({ winner: 'w', reason: 'checkmate' });
    expect(after.clock?.running).toBeNull();
  });

  it('has no chat message type', () => {
    expect(ClientMessage.safeParse({ type: 'chat', text: 'hello' }).success).toBe(false);
  });
});

describe('concurrent actions (plat-023)', () => {
  function room() {
    const created = createRoom(concurrentVariant, { code: 'ABCDEF', creator: alice, color: 'w', timeControl: null, now: 0 });
    return join(concurrentVariant, created, bob, 1_000).room;
  }

  it('accepts multiple actions from each active seat and preserves actors for replay/snapshots', () => {
    let current = room();
    const actions = [['w', 'a1a2'], ['w', 'b1b2'], ['b', 'a1a2']] as const;
    for (const [color, uci] of actions) {
      const applied = applyMessage(concurrentVariant, current, color, { type: 'move', uci, ply: current.moves.length }, 2_000, code);
      expect(applied.error).toBeUndefined();
      current = applied.room;
    }
    expect(current.moves).toEqual(['a1a2', 'b1b2', 'a1a2']);
    expect(current.moveActors).toEqual(['w', 'w', 'b']);
    expect(replay(concurrentVariant, current).moves().map((move) => move.color)).toEqual(['w', 'w', 'b']);
    expect(snapshot(current, 3_000, { w: true, b: true }).moveActors).toEqual(['w', 'w', 'b']);
    expect(GameSnapshot.parse(snapshot(current, 3_000, { w: true, b: true })).moveActors).toEqual(['w', 'w', 'b']);
  });

  it('retracts only the caller’s non-capturing action when the full remainder replays legally', () => {
    let current = room();
    for (const [color, uci] of [['w', 'a1a2'], ['b', 'a1a2'], ['w', 'b1b2']] as const) {
      current = applyMessage(concurrentVariant, current, color, { type: 'move', uci, ply: current.moves.length }, 2_000, code).room;
    }
    expect(applyMessage(concurrentVariant, current, 'b', { type: 'retract', index: 0, ply: 3 }, 3_000, code).error).toBe('illegal_move');
    const retracted = applyMessage(concurrentVariant, current, 'w', { type: 'retract', index: 0, ply: 3 }, 3_000, code);
    expect(retracted.error).toBeUndefined();
    expect(retracted.room.moves).toEqual(['a1a2', 'b1b2']);
    expect(retracted.room.moveActors).toEqual(['b', 'w']);
    expect(replay(concurrentVariant, retracted.room).moves().map((move) => move.color)).toEqual(['b', 'w']);
  });

  it('rejects a retraction that makes a later accepted action illegal on replay', () => {
    let current = room();
    current = applyMessage(concurrentVariant, current, 'w', { type: 'move', uci: 'a1a2', ply: 0 }, 2_000, code).room;
    current = applyMessage(concurrentVariant, current, 'b', { type: 'move', uci: 'b1b2', ply: 1 }, 2_000, code).room;
    const rejected = applyMessage(concurrentVariant, current, 'w', { type: 'retract', index: 0, ply: 2 }, 3_000, code);
    expect(rejected.error).toBe('illegal_move');
    expect(rejected.room).toBe(current);
  });

  it('ends concurrent play at capture and applies ordinary turn validation afterward', () => {
    let current = room();
    current = applyMessage(concurrentVariant, current, 'w', { type: 'move', uci: 'c1c2', ply: 0 }, 2_000, code).room;
    expect(activePlayers(replay(concurrentVariant, current))).toEqual(['b']);
    expect(applyMessage(concurrentVariant, current, 'w', { type: 'move', uci: 'e1e2', ply: 1 }, 2_000, code).error).toBe('not_your_turn');
    expect(applyMessage(concurrentVariant, current, 'b', { type: 'move', uci: 'e1e2', ply: 1 }, 2_000, code).error).toBeUndefined();
    expect(applyMessage(concurrentVariant, current, 'b', { type: 'retract', index: 0, ply: 1 }, 2_000, code).error).toBe('not_your_turn');
  });

  it('pauses the clock during concurrent play and starts it when turn-taking begins', () => {
    const timeControl = { initialMs: 60_000, incrementMs: 1_000 };
    let current = join(concurrentVariant, createRoom(concurrentVariant, { code: 'ABCDEF', creator: alice, color: 'w', timeControl, now: 0 }), bob, 1_000).room;
    expect(current.clock?.running).toBeNull();
    current = applyMessage(concurrentVariant, current, 'w', { type: 'move', uci: 'c1c2', ply: 0 }, 2_000, code).room;
    expect(current.clock?.running).toBe('b');
    expect(current.clock?.since).toBe(2_000);
  });
});

describe('clocks (online-003)', () => {
  it('flags the side whose time runs out, even before they try to move', () => {
    const room = playingRoom({ initialMs: 5_000, incrementMs: 0 });
    expect(nextAlarm(room)).toBe(1_000 + 5_000);
    expect(settle(room, 5_999).result).toBeNull();
    expect(settle(room, 6_000).result).toEqual({ winner: 'b', reason: 'timeout' });
    const late = applyMessage(makruk, room, 'w', { type: 'move', uci: 'e3e4', ply: 0 }, 7_000, code);
    expect(late.error).toBe('game_over');
    expect(late.room.result?.reason).toBe('timeout');
  });

  it('increment is applied after every move', () => {
    let room = playingRoom({ initialMs: 10_000, incrementMs: 1_000 });
    room = applyMessage(makruk, room, 'w', { type: 'move', uci: 'e3e4', ply: 0 }, 3_000, code).room;
    room = applyMessage(makruk, room, 'b', { type: 'move', uci: 'd6d5', ply: 1 }, 6_000, code).room;
    expect(room.clock?.remaining).toEqual({ w: 10_000 - 2_000 + 1_000, b: 10_000 - 3_000 + 1_000 });
    expect(nextAlarm(room)).toBe(6_000 + 9_000);
  });
});

describe('resign, draw, rematch, abandonment (online-004)', () => {
  it('resigning gives the win to the opponent', () => {
    expect(applyMessage(makruk, playingRoom(), 'b', { type: 'resign' }, 2_000, code).room.result).toEqual({ winner: 'w', reason: 'resign' });
  });

  it('a draw needs an offer from one side and acceptance from the other', () => {
    let room = applyMessage(makruk, playingRoom(), 'w', { type: 'offerDraw' }, 2_000, code).room;
    expect(room.drawOfferBy).toBe('w');
    expect(applyMessage(makruk, room, 'w', { type: 'acceptDraw' }, 2_000, code).room.result).toBeNull();
    expect(applyMessage(makruk, room, 'b', { type: 'declineDraw' }, 2_000, code).room.drawOfferBy).toBeNull();
    room = applyMessage(makruk, room, 'b', { type: 'acceptDraw' }, 2_000, code).room;
    expect(room.result).toEqual({ winner: null, reason: 'agreement' });
  });

  it('a rematch needs both players and produces a new room code', () => {
    let room = applyMessage(makruk, playingRoom(), 'w', { type: 'resign' }, 2_000, code).room;
    const first = applyMessage(makruk, room, 'w', { type: 'rematch' }, 3_000, code);
    expect(first.rematch).toBeUndefined();
    room = first.room;
    const second = applyMessage(makruk, room, 'b', { type: 'rematch' }, 3_000, code);
    expect(second.rematch).toBe(true);
    expect(second.room.nextCode).toBe('NEXT23');
  });

  it('a disconnected player who returns within the grace period keeps playing', () => {
    let room = leave(playingRoom(), 'w', 10_000, 30_000);
    expect(room.disconnect).toEqual({ color: 'w', at: 40_000 });
    expect(settle(room, 39_000).result).toBeNull();
    room = join(makruk, room, alice, 39_000).room;
    expect(room.disconnect).toBeNull();
  });

  it('abandonment past the grace period awards the win to the opponent', () => {
    const room = leave(playingRoom({ initialMs: 600_000, incrementMs: 0 }), 'b', 10_000, 30_000);
    expect(nextAlarm(room)).toBe(40_000);
    expect(settle(room, 40_000).result).toEqual({ winner: 'w', reason: 'abandon' });
  });
});

describe('snapshot', () => {
  it('matches the protocol schema and reports clock times at the snapshot moment', () => {
    const room = playingRoom();
    const snap = snapshot(room, 4_000, { w: true, b: false });
    expect(GameSnapshot.parse(snap)).toEqual(snap);
    expect(snap.variant).toBe('makruk');
    expect(snap.clock).toEqual({ w: 57_000, b: 60_000, running: 'w', serverTime: 4_000 });
    expect(snap.players.b?.connected).toBe(false);
  });
});

describe('any variant', () => {
  function sittuyinRoom() {
    const created = createRoom(sittuyin, { code: 'ABCDEF', creator: alice, color: 'w', timeControl: null, now: 0 });
    return join(sittuyin, created, bob, 1_000).room;
  }

  it('starts from the variant it was created with', () => {
    const room = sittuyinRoom();
    expect(room.variant).toBe('sittuyin');
    expect(room.startFen).toBe(sittuyin.startFen);
    expect(snapshot(room, 0, { w: true, b: true }).variant).toBe('sittuyin');
  });

  it('validates a Sittuyin setup drop that Makruk would reject', () => {
    const room = sittuyinRoom();
    const drop = (replay(sittuyin, room).legalUci?.() ?? []).find((uci) => uci.startsWith('K@'))!;
    const accepted = applyMessage(sittuyin, room, 'w', { type: 'move', uci: drop, ply: 0 }, 2_000, code);
    expect(accepted.error).toBeUndefined();
    expect(accepted.room.moves).toEqual([drop]);
    // The same room played under Makruk's rules rejects it, so the variant really drives validation.
    expect(applyMessage(makruk, { ...room, startFen: makruk.startFen }, 'w', { type: 'move', uci: drop, ply: 0 }, 2_000, code).error).toBe(
      'illegal_move',
    );
  });

  it('rejects a Yahhta placed off the back rank', () => {
    expect(applyMessage(sittuyin, sittuyinRoom(), 'w', { type: 'move', uci: 'R@d2', ply: 0 }, 2_000, code).error).toBe('illegal_move');
  });

  it('keeps the clock stopped during setup and starts it for the side to move after the last placement', () => {
    const timeControl = { initialMs: 60_000, incrementMs: 2_000 };
    let room = join(sittuyin, createRoom(sittuyin, { code: 'ABCDEF', creator: alice, color: 'w', timeControl, now: 0 }), bob, 1_000).room;
    expect(room.clock?.running).toBeNull();
    expect(nextAlarm(room)).toBeNull();

    let now = 1_000;
    for (let ply = 0; ply < 16; ply++) {
      const game = replay(sittuyin, room);
      const drop = (game.legalUci?.() ?? []).find((uci) => uci.includes('@'))!;
      now += 5_000;
      const applied = applyMessage(sittuyin, room, game.turn, { type: 'move', uci: drop, ply }, now, code);
      expect(applied.error, drop).toBeUndefined();
      room = applied.room;
      if (ply < 15) expect(room.clock?.running, `after placement ${ply + 1}`).toBeNull();
    }

    const game = replay(sittuyin, room);
    expect(game.hand('w').length + game.hand('b').length).toBe(0);
    // No time was charged for the 80 seconds of setup, and no increment was added.
    expect(room.clock).toEqual({ remaining: { w: 60_000, b: 60_000 }, running: game.turn, since: now });
    expect(nextAlarm(room)).toBe(now + 60_000);
  });

  it('accepts the drop and the in-place promotion move strings', () => {
    expect(ClientMessage.safeParse({ type: 'move', uci: 'K@e1', ply: 0 }).success).toBe(true);
    expect(ClientMessage.safeParse({ type: 'move', uci: 'd5d5f', ply: 0 }).success).toBe(true);
    expect(ClientMessage.safeParse({ type: 'move', uci: 'a5a6m', ply: 0 }).success).toBe(true);
    expect(ClientMessage.safeParse({ type: 'move', uci: 'not-a-move', ply: 0 }).success).toBe(false);
  });
});
