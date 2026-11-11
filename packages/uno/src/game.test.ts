import { describe, expect, it } from 'vitest';
import {
  callUno,
  canPlay,
  type Card,
  createDeck,
  DECK_SIZE,
  draw,
  give,
  newGame,
  pass,
  play,
  playableCards,
  randomOf,
  shuffle,
  topCard,
  UnoRuleError,
  type UnoState,
} from './index';

const card = (id: number, kind: Card['kind'], color: Card['color'], value: number | null = null): Card => ({
  id,
  kind,
  color,
  value,
});

/** A hand-built two-player state with a red 5 on the pile. */
function fixture(hands: Card[][], extra: Partial<UnoState> = {}): UnoState {
  return {
    ...newGame(2, 1),
    hands,
    discard: [card(900, 'number', 'red', 5)],
    color: 'red',
    drawPile: Array.from({ length: 20 }, (_, i) => card(1000 + i, 'number', 'blue', i % 10)),
    unoCalled: [false, false],
    ...extra,
  };
}

const totalCards = (s: UnoState) => s.drawPile.length + s.discard.length + s.hands.reduce((n, h) => n + h.length, 0);

describe('deck', () => {
  it('has the standard 108 cards with unique ids', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(DECK_SIZE);
    expect(new Set(deck.map((c) => c.id)).size).toBe(DECK_SIZE);
    expect(deck.filter((c) => c.kind === 'wild4')).toHaveLength(4);
    expect(deck.filter((c) => c.kind === 'number' && c.value === 0)).toHaveLength(4);
    expect(deck.filter((c) => c.color === 'green' && c.kind === 'draw2')).toHaveLength(2);
  });

  it('shuffles deterministically from a seed', () => {
    const a = shuffle(createDeck(), 42).items.map((c) => c.id);
    const b = shuffle(createDeck(), 42).items.map((c) => c.id);
    const c = shuffle(createDeck(), 43).items.map((c) => c.id);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });
});

describe('newGame', () => {
  it('deals seven cards each and turns a number card', () => {
    for (let seed = 0; seed < 50; seed++) {
      const s = newGame(2, seed);
      expect(s.hands.map((h) => h.length)).toEqual([7, 7]);
      expect(topCard(s).kind).toBe('number');
      expect(s.color).toBe(topCard(s).color);
      expect(totalCards(s)).toBe(DECK_SIZE);
    }
  });

  it('survives JSON', () => {
    const s = newGame(3, 9);
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
  });
});

describe('matching', () => {
  const s = fixture([[card(1, 'number', 'red', 2), card(2, 'number', 'blue', 5), card(3, 'number', 'blue', 7), card(4, 'wild', null)], []]);

  it('matches on colour, number or a wild', () => {
    expect(playableCards(s).map((c) => c.id)).toEqual([1, 2, 4]);
  });

  it('matches actions by symbol', () => {
    const t = fixture([[card(1, 'skip', 'blue')], []], { discard: [card(900, 'skip', 'red')] });
    expect(canPlay(t, 0, t.hands[0]![0]!)).toBe(true);
  });

  it('allows a Wild Draw Four only without a card of the current colour', () => {
    const w4 = card(5, 'wild4', null);
    expect(canPlay(fixture([[w4, card(1, 'number', 'red', 1)], []]), 0, w4)).toBe(false);
    expect(canPlay(fixture([[w4, card(1, 'number', 'blue', 5)], []]), 0, w4)).toBe(true);
    const relaxed = fixture([[w4, card(1, 'number', 'red', 1)], []]);
    expect(canPlay({ ...relaxed, rules: { ...relaxed.rules, wildDrawFourNeedsNoColorMatch: false } }, 0, w4)).toBe(true);
  });
});

describe('play', () => {
  it('moves the card to the pile and passes the turn', () => {
    const s = fixture([[card(1, 'number', 'red', 2), card(2, 'number', 'blue', 1), card(3, 'number', 'blue', 2)], [card(9, 'number', 'red', 1)]]);
    const { state, events } = play(s, 1);
    expect(topCard(state).id).toBe(1);
    expect(state.current).toBe(1);
    expect(state.hands[0]).toHaveLength(2);
    expect(events[0]).toMatchObject({ type: 'play', player: 0, color: 'red' });
  });

  it('rejects cards that do not match or are not held', () => {
    const s = fixture([[card(1, 'number', 'blue', 2), card(2, 'number', 'blue', 3), card(3, 'number', 'blue', 4)], []]);
    expect(() => play(s, 1)).toThrow(UnoRuleError);
    expect(() => play(s, 77)).toThrow(/not-in-hand/);
  });

  it('needs a colour for a wild and takes it', () => {
    const s = fixture([[card(1, 'wild', null), card(2, 'number', 'blue', 3), card(3, 'number', 'blue', 4)], []]);
    expect(() => play(s, 1)).toThrow(/needs-color/);
    expect(play(s, 1, { color: 'green' }).state.color).toBe('green');
  });

  it('gives the same player another turn after a Skip or Reverse with two players', () => {
    for (const kind of ['skip', 'reverse'] as const) {
      const s = fixture([[card(1, kind, 'red'), card(2, 'number', 'blue', 3), card(3, 'number', 'blue', 4)], [card(9, 'number', 'red', 1)]]);
      const step = play(s, 1);
      expect(step.state.current).toBe(0);
      expect(step.events.some((e) => e.type === 'skip' && e.player === 1)).toBe(true);
    }
  });

  it('a Reverse with three players turns the order around', () => {
    const s = fixture([[card(1, 'reverse', 'red'), card(2, 'number', 'blue', 3), card(3, 'number', 'blue', 4)], [], []], {
      players: 3,
      unoCalled: [false, false, false],
    });
    const step = play(s, 1);
    expect(step.state.direction).toBe(-1);
    expect(step.state.current).toBe(2);
  });

  it('Draw Two and Wild Draw Four make the next player draw and lose their turn', () => {
    const s = fixture([[card(1, 'draw2', 'red'), card(2, 'number', 'blue', 3), card(3, 'number', 'blue', 4)], [card(9, 'number', 'red', 1)]]);
    const two = play(s, 1);
    expect(two.state.hands[1]).toHaveLength(3);
    expect(two.state.current).toBe(0);

    const t = fixture([[card(1, 'wild4', null), card(2, 'number', 'blue', 3), card(3, 'number', 'blue', 4)], [card(9, 'number', 'red', 1)]]);
    const four = play(t, 1, { color: 'blue' });
    expect(four.state.hands[1]).toHaveLength(5);
    expect(four.state.current).toBe(0);
  });

  it('suppressSkip keeps the penalty but hands the turn on', () => {
    const s = fixture([[card(1, 'draw2', 'red'), card(2, 'number', 'blue', 3), card(3, 'number', 'blue', 4)], [card(9, 'number', 'red', 1)]]);
    const step = play(s, 1, { suppressSkip: true });
    expect(step.state.hands[1]).toHaveLength(3);
    expect(step.state.current).toBe(1);
    expect(step.events.some((e) => e.type === 'skip')).toBe(false);
  });

  it('wins when the last card is played', () => {
    const s = fixture([[card(1, 'number', 'red', 2)], [card(9, 'number', 'red', 1)]], { unoCalled: [true, false] });
    const step = play(s, 1);
    expect(step.state.winner).toBe(0);
    expect(() => draw(step.state)).toThrow(/game-over/);
  });
});

describe('calling Uno', () => {
  const twoLeft = () => fixture([[card(1, 'number', 'red', 2), card(2, 'number', 'blue', 3)], [card(9, 'number', 'red', 1)]]);

  it('a player who goes down to one card without calling draws two', () => {
    const step = play(twoLeft(), 1);
    expect(step.state.hands[0]).toHaveLength(3);
    expect(step.events.some((e) => e.type === 'draw' && e.reason === 'uno-penalty')).toBe(true);
  });

  it('a player who called keeps one card', () => {
    const called = callUno(twoLeft(), 0).state;
    const step = play(called, 1);
    expect(step.state.hands[0]).toHaveLength(1);
  });

  it('cannot be called with three cards, or with two off turn', () => {
    const s = fixture([[card(1, 'number', 'red', 2), card(2, 'number', 'blue', 3), card(3, 'number', 'blue', 4)], [card(8, 'number', 'red', 1), card(9, 'number', 'red', 1)]]);
    expect(() => callUno(s, 0)).toThrow(/cannot-call/);
    expect(() => callUno(s, 1)).toThrow(/cannot-call/);
  });
});

describe('drawing and passing', () => {
  it('passing needs a draw first unless forced', () => {
    const s = fixture([[card(1, 'number', 'blue', 2)], [card(9, 'number', 'red', 1)]]);
    expect(() => pass(s)).toThrow(/cannot-pass/);
    const drawn = draw(s).state;
    expect(drawn.hands[0]).toHaveLength(2);
    expect(drawn.drawnThisTurn).toBe(1);
    expect(pass(drawn).state.current).toBe(1);
    expect(pass(s, true).state.current).toBe(1);
  });

  it('turns the discard pile over when the draw pile is empty', () => {
    const s = fixture([[card(1, 'number', 'blue', 2)], []], {
      drawPile: [],
      discard: [card(800, 'number', 'green', 1), card(801, 'number', 'green', 2), card(900, 'number', 'red', 5)],
    });
    const step = give(s, 1, 2, 'host');
    expect(step.state.hands[1]).toHaveLength(2);
    expect(step.state.discard.map((c) => c.id)).toEqual([900]);
    expect(step.events[0]).toMatchObject({ type: 'reshuffle', cards: 2 });
  });

  it('gives fewer cards when nothing is left to draw', () => {
    const s = fixture([[], []], { drawPile: [] });
    expect(give(s, 0, 3, 'host').state.hands[0]).toHaveLength(0);
  });
});

describe('random playouts', () => {
  it('keep every card accounted for and always end', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const rng = randomOf(seed * 7);
      let s = newGame(2 + (seed % 3), seed);
      for (let turn = 0; turn < 3000 && s.winner === null; turn++) {
        if (s.hands[s.current]!.length === 2 && rng() < 0.8) s = callUno(s, s.current).state;
        const options = playableCards(s);
        if (options.length > 0) {
          const pick = options[Math.floor(rng() * options.length)]!;
          s = play(s, pick.id, { color: (['red', 'yellow', 'green', 'blue'] as const)[Math.floor(rng() * 4)] }).state;
        } else {
          s = draw(s).state;
          const after = playableCards(s);
          s = after.length > 0 ? play(s, after[0]!.id, { color: 'red' }).state : pass(s).state;
        }
        expect(totalCards(s)).toBe(DECK_SIZE);
      }
      expect(s.winner).not.toBeNull();
    }
  });
});
