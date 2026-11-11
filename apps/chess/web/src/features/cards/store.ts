import { storageKey } from '@chaturanga/game-shell';
import type { CardColor } from '@chaturanga/uno';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { PRODUCT } from '../../../product.config';
import {
  type CardChessEvent,
  type CardChessState,
  type CardChessStep,
  drawCard,
  freeMove,
  newCardChess,
  passTurn,
  playCard,
  sayUno,
  type Side,
  turnOf,
} from './rules';

export type CardMode = 'computer' | 'local';

export interface CardConfig {
  mode: CardMode;
  /** The human's side against the computer. */
  side: Side;
  level: number;
}

/** One burst of animation the screen shows once, then drops. */
export interface Fx {
  id: number;
  kind: 'skip' | 'reverse' | 'draw2' | 'wild4' | 'uno' | 'caught' | 'capture' | 'color' | 'check' | 'pass' | 'reshuffle' | 'no-skip';
  side: Side;
  color?: CardColor;
  count?: number;
  /** Bursts from one action play one after another, in ms. */
  delay?: number;
}

interface CardStore {
  config: CardConfig;
  game: CardChessState | null;
  /** Pass-and-play: the hand stays face down until the player whose turn it is taps it. */
  revealed: boolean;
  fx: Fx[];
  muted: boolean;
  start: (config: CardConfig) => void;
  quit: () => void;
  reveal: () => void;
  play: (cardId: number, uci: string, color?: CardColor) => void;
  draw: () => void;
  pass: () => void;
  freeMove: (uci: string) => void;
  sayUno: (side: Side) => void;
  dropFx: (id: number) => void;
  setMuted: (muted: boolean) => void;
}

let fxId = 0;

/** Turns rule events into the bursts worth showing. */
export function fxOf(events: readonly CardChessEvent[], mover: Side): Omit<Fx, 'id'>[] {
  const out: Omit<Fx, 'id'>[] = [];
  for (const e of events) {
    if (e.kind === 'skip-cancelled') out.push({ kind: 'no-skip', side: e.side });
    else if (e.kind === 'capture-draw') out.push({ kind: 'capture', side: e.side, count: 1 });
    else if (e.kind === 'move' && e.record.san.endsWith('+')) out.push({ kind: 'check', side: mover });
    else if (e.kind === 'uno') {
      const u = e.event;
      if (u.type === 'play') {
        if (u.card.kind === 'wild' || u.card.kind === 'wild4') out.push({ kind: 'color', side: mover, color: u.color });
        if (u.card.kind === 'reverse') out.push({ kind: 'reverse', side: mover });
      } else if (u.type === 'skip') out.push({ kind: 'skip', side: mover });
      else if (u.type === 'draw' && (u.reason === 'draw2' || u.reason === 'wild4')) {
        out.push({ kind: u.reason, side: u.player === 0 ? 'w' : 'b', count: u.cards.length });
      } else if (u.type === 'draw' && u.reason === 'uno-penalty') out.push({ kind: 'caught', side: u.player === 0 ? 'w' : 'b', count: u.cards.length });
      else if (u.type === 'uno') out.push({ kind: 'uno', side: u.player === 0 ? 'w' : 'b' });
      else if (u.type === 'pass') out.push({ kind: 'pass', side: u.player === 0 ? 'w' : 'b' });
      else if (u.type === 'reshuffle') out.push({ kind: 'reshuffle', side: mover });
    }
  }
  // A reverse is announced by its own burst; the skip it causes would just repeat it.
  if (out.some((f) => f.kind === 'reverse')) return out.filter((f) => f.kind !== 'skip');
  return out;
}

const randomSeed = () => Math.floor(Math.random() * 2 ** 31);

export const useCardChess = create<CardStore>()(
  persist(
    (set, get) => {
      const apply = (step: (game: CardChessState) => CardChessStep) => {
        const { game, config, fx } = get();
        if (!game) return;
        const mover = turnOf(game);
        const next = step(game);
        const bursts = fxOf(next.events, mover).map((f, i) => ({ ...f, id: ++fxId, delay: i * 650 }));
        const turnChanged = turnOf(next.state) !== mover;
        set({
          game: next.state,
          fx: [...fx, ...bursts].slice(-6),
          // In pass-and-play the next player's hand stays hidden until they take the device.
          revealed: config.mode === 'local' && turnChanged && !next.state.result ? false : get().revealed,
        });
      };
      return {
        config: { mode: 'computer', side: 'w', level: 2 },
        game: null,
        revealed: true,
        fx: [],
        muted: false,
        start: (config) => {
          const side = config.mode === 'computer' ? config.side : 'w';
          set({ config: { ...config, side }, game: newCardChess(randomSeed()), revealed: config.mode !== 'local', fx: [] });
        },
        quit: () => set({ game: null, fx: [] }),
        reveal: () => set({ revealed: true }),
        play: (cardId, uci, color) => apply((g) => playCard(g, cardId, uci, color)),
        draw: () => apply(drawCard),
        pass: () => apply(passTurn),
        freeMove: (uci) => apply((g) => freeMove(g, uci)),
        sayUno: (side) => apply((g) => sayUno(g, side)),
        dropFx: (id) => set({ fx: get().fx.filter((f) => f.id !== id) }),
        setMuted: (muted) => set({ muted }),
      };
    },
    {
      name: storageKey(PRODUCT, 'cards'),
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: ({ config, game, muted, revealed }) => ({ config, game, muted, revealed }),
    },
  ),
);
