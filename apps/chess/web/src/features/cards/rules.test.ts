import { Game } from '@chaturanga/chess';
import { type Card, randomOf, type UnoState } from '@chaturanga/uno';
import { describe, expect, it } from 'vitest';
import { chooseAction } from './bot';
import {
  canSayUno,
  type CardChessState,
  cardOptions,
  drawCard,
  freeMove,
  movesForCard,
  newCardChess,
  nullMove,
  passTurn,
  playCard,
  sayUno,
  turnNeed,
  turnOf,
} from './rules';

const card = (id: number, kind: Card['kind'], color: Card['color'], value: number | null = null): Card => ({ id, kind, color, value });
const filler = (n: number, from = 500): Card[] => Array.from({ length: n }, (_, i) => card(from + i, 'number', 'blue', 9));

/** A game in `fen` where White holds `white` and Black holds `black`, with a red 5 on the pile. */
function setup(fen: string, white: Card[], black: Card[], uno: Partial<UnoState> = {}): CardChessState {
  const base = newCardChess(1, fen);
  return {
    ...base,
    uno: {
      ...base.uno,
      hands: [white, black],
      discard: [card(900, 'number', 'red', 5)],
      color: 'red',
      drawPile: Array.from({ length: 30 }, (_, i) => card(1000 + i, 'number', 'yellow', i % 10)),
      ...uno,
    },
  };
}

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

describe('which pieces a card moves', () => {
  const game = new Game();
  it('yellow moves pawns, green knights, a wild anything', () => {
    expect(movesForCard(game, card(1, 'number', 'yellow', 3))).toHaveLength(16);
    expect(movesForCard(game, card(1, 'number', 'green', 3)).sort()).toEqual(['b1a3', 'b1c3', 'g1f3', 'g1h3']);
    expect(movesForCard(game, card(1, 'number', 'red', 3))).toEqual([]);
    expect(movesForCard(game, card(1, 'wild', null))).toHaveLength(20);
  });

  it('the king answers to every card', () => {
    const open = new Game('4k3/8/8/8/8/8/8/4K3 w - - 0 1');
    expect(movesForCard(open, card(1, 'number', 'blue', 1))).toHaveLength(5);
  });
});

describe('a turn', () => {
  it('needs a card that matches the pile and has a move', () => {
    const s = setup(START, [card(1, 'number', 'yellow', 5), card(2, 'number', 'red', 2), card(3, 'number', 'green', 7)], filler(7));
    // yellow 5 matches by number; red 2 matches by colour but red pieces cannot move; green 7 does not match.
    expect(cardOptions(s).map((o) => o.card.id)).toEqual([1]);
    expect(() => playCard(s, 3, 'g1f3')).toThrow(/cannot be played/);
    expect(() => playCard(s, 1, 'g1f3')).toThrow(/does not allow/);
  });

  it('plays the card and the move, then hands the turn over', () => {
    const s = setup(START, [card(1, 'number', 'yellow', 5), ...filler(3)], filler(7, 600));
    const { state, events } = playCard(s, 1, 'e2e4');
    expect(turnOf(state)).toBe('b');
    expect(state.fen.split(' ')[1]).toBe('b');
    expect(state.uno.color).toBe('yellow');
    expect(events[0]).toMatchObject({ kind: 'move' });
    expect(state.log[0]).toMatchObject({ kind: 'move', san: 'e4' });
  });

  it('a Skip gives the same player another move through a null move', () => {
    const s = setup(START, [card(1, 'skip', 'yellow'), ...filler(3)], filler(7, 600), { discard: [card(900, 'number', 'yellow', 1)], color: 'yellow' });
    const { state } = playCard(s, 1, 'e2e4');
    expect(turnOf(state)).toBe('w');
    expect(state.fen.split(' ')[1]).toBe('w');
    expect(state.fen.split(' ')[3]).toBe('-');
  });

  it('a Draw Two that gives check keeps the draw but loses the extra move', () => {
    const fen = '4k3/8/8/8/8/8/8/R3K3 w - - 0 1';
    const s = setup(fen, [card(1, 'draw2', 'red'), ...filler(3)], filler(4, 600));
    const { state, events } = playCard(s, 1, 'a1a8');
    expect(turnOf(state)).toBe('b');
    expect(state.uno.hands[1]).toHaveLength(6);
    expect(events.some((e) => e.kind === 'skip-cancelled')).toBe(true);
  });

  it('a capture makes the other side draw a card', () => {
    const fen = '4k3/8/8/3p4/4P3/8/8/4K3 w - - 0 1';
    const s = setup(fen, [card(1, 'number', 'yellow', 5), ...filler(3)], filler(4, 600));
    const { state, events } = playCard(s, 1, 'e4d5');
    expect(state.uno.hands[1]).toHaveLength(5);
    expect(events.some((e) => e.kind === 'capture-draw' && e.side === 'b')).toBe(true);
  });

  it('a wild needs a colour and lets any piece move', () => {
    const s = setup(START, [card(1, 'wild', null), ...filler(3)], filler(4, 600));
    expect(() => playCard(s, 1, 'g1f3')).toThrow(/colour/);
    expect(playCard(s, 1, 'g1f3', 'green').state.uno.color).toBe('green');
  });
});

describe('when nothing fits', () => {
  it('draws, then passes with a null move', () => {
    const s = setup(START, [card(1, 'number', 'blue', 2)], filler(4, 600), { drawPile: [card(1000, 'number', 'blue', 3)] });
    expect(turnNeed(s)).toBe('draw');
    expect(() => passTurn(s)).toThrow();
    const drawn = drawCard(s).state;
    expect(drawn.uno.hands[0]).toHaveLength(2);
    expect(turnNeed(drawn)).toBe('pass');
    const passed = passTurn(drawn).state;
    expect(turnOf(passed)).toBe('b');
    expect(passed.fen).toBe(nullMove(START));
  });

  it('in check keeps drawing instead of passing', () => {
    const fen = '4k3/8/8/8/8/8/3r4/R3K2r w - - 0 1'; // white king in check, only Ra1xh1 or a king move
    const s = setup(fen, [card(1, 'number', 'blue', 2)], filler(4, 600), {
      drawPile: [card(1001, 'wild', null), card(1000, 'number', 'blue', 3)],
    });
    const once = drawCard(s).state;
    expect(turnNeed(once)).toBe('draw');
    const twice = drawCard(once).state;
    expect(turnNeed(twice)).toBe('play');
  });

  it('in check with nothing left to draw allows a free move', () => {
    const fen = '4k3/8/8/8/8/8/3r4/R3K2r w - - 0 1';
    const s = setup(fen, [card(1, 'number', 'blue', 2)], filler(4, 600), { drawPile: [], discard: [card(900, 'number', 'red', 5)] });
    expect(turnNeed(s)).toBe('free-move');
    const { state } = freeMove(s, 'e1d2');
    expect(turnOf(state)).toBe('b');
  });
});

describe('winning', () => {
  it('playing the last card wins', () => {
    const s = setup(START, [card(1, 'number', 'yellow', 5)], filler(4, 600), { unoCalled: [true, false] });
    expect(playCard(s, 1, 'e2e4').state.result).toEqual({ kind: 'last-card', winner: 'w' });
  });

  it('forgetting to call Uno costs two cards', () => {
    const s = setup(START, [card(1, 'number', 'yellow', 5), card(2, 'number', 'blue', 9)], filler(4, 600));
    expect(canSayUno(s, 'w')).toBe(true);
    expect(playCard(s, 1, 'e2e4').state.uno.hands[0]).toHaveLength(3);
    const called = sayUno(s, 'w').state;
    expect(canSayUno(called, 'w')).toBe(false);
    expect(playCard(called, 1, 'e2e4').state.uno.hands[0]).toHaveLength(1);
  });

  it('checkmate wins', () => {
    const fen = '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1';
    const s = setup(fen, [card(1, 'number', 'red', 2), ...filler(3)], filler(4, 600));
    expect(playCard(s, 1, 'a1a8').state.result).toEqual({ kind: 'checkmate', winner: 'w' });
  });
});

describe('whole games', () => {
  it('random play always stays in sync and ends', () => {
    for (let seed = 1; seed <= 25; seed++) {
      const rng = randomOf(seed);
      let s = newCardChess(seed);
      for (let ply = 0; ply < 2000 && !s.result; ply++) {
        const side = turnOf(s);
        expect(s.fen.split(' ')[1]).toBe(side);
        if (canSayUno(s, side) && rng() < 0.7) s = sayUno(s, side).state;
        const need = turnNeed(s);
        if (need === 'play') {
          const options = cardOptions(s);
          const option = options[Math.floor(rng() * options.length)]!;
          s = playCard(s, option.card.id, option.moves[Math.floor(rng() * option.moves.length)]!, 'red').state;
        } else if (need === 'draw') s = drawCard(s).state;
        else if (need === 'pass') s = passTurn(s).state;
        else if (need === 'free-move') s = freeMove(s, new Game(s.fen).legalUci()[0]!).state;
      }
      expect(s.result).not.toBeNull();
      expect(JSON.parse(JSON.stringify(s))).toEqual(s);
    }
  });

  it('the bot finishes a game against itself', () => {
    let s = newCardChess(7);
    const rng = randomOf(3);
    for (let ply = 0; ply < 400 && !s.result; ply++) {
      const action = chooseAction(s, 1, rng);
      if (action.kind === 'play') {
        if (action.callUno) s = sayUno(s, turnOf(s)).state;
        s = playCard(s, action.cardId, action.uci, action.color).state;
      } else if (action.kind === 'draw') s = drawCard(s).state;
      else if (action.kind === 'pass') s = passTurn(s).state;
      else s = freeMove(s, action.uci).state;
    }
    expect(s.result).not.toBeNull();
  }, 30_000);

  it('the bot takes a mate in one', () => {
    const fen = '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1';
    const s = setup(fen, [card(1, 'number', 'red', 2), card(2, 'number', 'red', 3), ...filler(3)], filler(4, 600));
    const action = chooseAction(s, 2, () => 0.5);
    expect(action).toMatchObject({ kind: 'play', uci: 'a1a8' });
  });
});
