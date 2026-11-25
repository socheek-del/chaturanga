import type { ClientMessage, GameSnapshot, ServerMessage } from '@chaturanga/protocol';
import { type ClockState, type Color, IllegalMoveError, type Variant, type VariantGame } from '@chaturanga/rules-core';
import { create, type StoreApi, type UseBoundStore } from 'zustand';
import type { GameSessionState } from '../session';
import type { ConnectionStatus } from './connection';

export interface OnlineSessionState<G extends VariantGame = VariantGame> extends GameSessionState<G> {
  snapshot: GameSnapshot | null;
  /** Local time the latest snapshot arrived (pairs with snapshot.serverTime for countdowns). */
  receivedAt: number;
  you: Color | null;
  connection: ConnectionStatus;
  lastError: string | null;
  send: (message: ClientMessage) => void;
  receive: (message: ServerMessage, receivedAt?: number) => void;
  setConnection: (status: ConnectionStatus) => void;
  bindSender: (send: (message: ClientMessage) => void) => void;
}

export type OnlineSessionStore<G extends VariantGame = VariantGame> = UseBoundStore<StoreApi<OnlineSessionState<G>>>;

/** Server clock values are "remaining at serverTime"; we count down locally from the moment they arrive. */
export function clockFromSnapshot(snapshot: GameSnapshot, receivedAt: number): ClockState | null {
  if (!snapshot.clock) return null;
  const { w, b, running } = snapshot.clock;
  return { remaining: { w, b }, running, since: running ? receivedAt : null };
}

/**
 * Adapts the server-authoritative room to the same session interface the local game screen uses.
 * Moves (placements included) are applied optimistically and replaced by the next server snapshot.
 */
export function createOnlineSession<G extends VariantGame>(variant: Variant<G>): OnlineSessionStore<G> {
  let sender: (message: ClientMessage) => void = () => {};

  return create<OnlineSessionState<G>>((set, get) => ({
    phase: 'playing',
    game: variant.createGame(),
    startFen: variant.startFen,
    version: 0,
    timeControl: null,
    clock: null,
    result: null,
    viewPly: null,
    flipped: false,
    snapshot: null,
    receivedAt: 0,
    you: null,
    connection: 'connecting',
    lastError: null,

    bindSender: (send) => {
      sender = send;
    },
    send: (message) => sender(message),

    receive: (message, receivedAt = Date.now()) => {
      if (message.type === 'error') {
        set({ lastError: message.code });
        return;
      }
      if (message.type !== 'state') return;
      const snapshot = message.game;
      const game = variant.createGame(snapshot.startFen);
      for (const move of snapshot.moves) game.move(move);
      set((s) => ({
        snapshot,
        receivedAt,
        you: message.you,
        game,
        startFen: snapshot.startFen,
        timeControl: snapshot.timeControl,
        clock: clockFromSnapshot(snapshot, receivedAt),
        result: snapshot.result,
        lastError: null,
        viewPly: s.viewPly !== null && s.viewPly >= snapshot.moves.length ? null : s.viewPly,
        version: s.version + 1,
      }));
    },

    setConnection: (connection) => set({ connection }),

    move: (move) => {
      const { game, you, result, viewPly, snapshot } = get();
      if (!snapshot || snapshot.status !== 'playing' || result || viewPly !== null || game.turn !== you) return null;
      try {
        const record = game.move(move) as ReturnType<G['move']>;
        sender({ type: 'move', uci: record.uci, ply: game.moves().length - 1 });
        set((s) => ({ version: s.version + 1 }));
        return record;
      } catch (err) {
        if (err instanceof IllegalMoveError) return null;
        throw err;
      }
    },

    resign: () => sender({ type: 'resign' }),
    // Local draw agreement has no authority online; the room owns draw-offer acceptance.
    agreeDraw: () => {},
    setViewPly: (ply) => {
      const total = get().game.moves().length;
      set({ viewPly: ply === null || ply >= total ? null : Math.max(0, ply) });
    },
    flip: () => set((s) => ({ flipped: !s.flipped })),

    // Local-only actions that have no meaning online (the room replaces exitToSetup with navigation).
    start: () => {},
    undo: () => {},
    tick: () => {},
    exitToSetup: () => {},
  }));
}
